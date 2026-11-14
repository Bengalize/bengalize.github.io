/* supabase-adapter.js — the go-live adapter: same interface as
 * LocalAdapter (see data.js), backed by Supabase (Postgres + Storage)
 * through its REST API. No library needed — plain fetch.
 *
 * Status: implemented against the schema in supabase/schema.sql, but NOT
 * exercised end-to-end (that needs Bengaly's Supabase account, created at
 * go-live). Treat the first go-live session as a smoke test: load, add a
 * person, add a photo, record a voice note, export.
 *
 * Mapping notes:
 *  - Partial dates ({y} or {y,m,d}) are stored as jsonb — identical shape
 *    to the local model, no conversion.
 *  - Photos / voice audio: uploaded to Storage buckets "photos" / "voice";
 *    the public URL is stored on the row (people.photo, media via
 *    suggestions.voice / people voice-notes are kept in a `media` table).
 *  - Voice notes on profiles live in the media table (kind='voice-note').
 *  - Personality traits live in the person_traits table (one row per
 *    pick: person_id, trait_key, contributor_name) — created by
 *    supabase/traits-migration.sql, run after schema.sql.
 */
(function (global) {
  "use strict";

  function SupabaseAdapter(cfg) {
    this.url = (cfg.supabaseUrl || "").replace(/\/$/, "");
    this.key = cfg.supabaseAnonKey || "";
    if (!this.url || !this.key) {
      throw new Error("Supabase config missing (supabaseUrl / supabaseAnonKey). See README.md.");
    }
  }

  SupabaseAdapter.prototype._headers = function (extra) {
    return Object.assign({
      "apikey": this.key,
      "Authorization": "Bearer " + this.key,
      "Content-Type": "application/json"
    }, extra || {});
  };

  SupabaseAdapter.prototype._rest = function (path, options) {
    var opts = options || {};
    opts.headers = this._headers(opts.headers);
    return fetch(this.url + "/rest/v1/" + path, opts).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (body) {
          throw new Error("Supabase " + res.status + ": " + body);
        });
      }
      return res.status === 204 ? null : res.json().catch(function () { return null; });
    });
  };

  /* Upload a data URL to a storage bucket; returns the public URL. */
  SupabaseAdapter.prototype._uploadDataUrl = function (bucket, dataUrl) {
    var self = this;
    var match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
    if (!match) return Promise.resolve(dataUrl); // already a URL
    var mime = match[1];
    var bytes = Uint8Array.from(atob(match[2]), function (c) { return c.charCodeAt(0); });
    var ext = mime.indexOf("png") >= 0 ? "png" : mime.indexOf("jpeg") >= 0 ? "jpg"
      : mime.indexOf("webm") >= 0 ? "webm" : mime.indexOf("mp4") >= 0 ? "m4a"
      : mime.indexOf("ogg") >= 0 ? "ogg" : "bin";
    var path = Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36) + "." + ext;
    return fetch(self.url + "/storage/v1/object/" + bucket + "/" + path, {
      method: "POST",
      headers: { "apikey": self.key, "Authorization": "Bearer " + self.key, "Content-Type": mime, "x-upsert": "true" },
      body: bytes
    }).then(function (res) {
      if (!res.ok) throw new Error("Storage upload failed: " + res.status);
      return self.url + "/storage/v1/object/public/" + bucket + "/" + path;
    });
  };

  function rowToPerson(r, voiceNotes) {
    return {
      id: r.id,
      fullName: r.full_name,
      nickname: r.nickname || "",
      gender: r.gender || "unknown",
      birth: r.birth_date || null,
      birthPlace: r.birth_place || "",
      birthCountry: r.birth_country || null,
      residenceCountry: r.residence_country || null,
      death: r.death_date || null,
      deathPlace: r.death_place || "",
      deathCountry: r.death_country || null,
      memorialNote: r.memorial_note || "",
      notes: r.notes || "",
      photo: r.photo_url || null,
      passingRecordedAt: r.passing_recorded_at || null,
      voiceNotes: voiceNotes || [],
      isSelf: !!r.is_self,
      createdBy: r.created_by || "",
      createdAt: r.created_at
    };
  }

  /* Builds a row from a full person (insert) or a partial patch (update):
     only keys actually present on the input are written, so a patch like
     { death: ... } never nulls out the person's name. */
  function personToRow(p) {
    var row = {};
    if ("fullName" in p) row.full_name = p.fullName;
    if ("nickname" in p) row.nickname = p.nickname || null;
    if ("gender" in p) row.gender = p.gender || "unknown";
    if ("birth" in p) row.birth_date = p.birth || null;
    if ("birthPlace" in p) row.birth_place = p.birthPlace || null;
    if ("birthCountry" in p) row.birth_country = p.birthCountry || null;
    if ("residenceCountry" in p) row.residence_country = p.residenceCountry || null;
    if ("death" in p) row.death_date = p.death || null;
    if ("deathPlace" in p) row.death_place = p.deathPlace || null;
    if ("deathCountry" in p) row.death_country = p.deathCountry || null;
    if ("memorialNote" in p) row.memorial_note = p.memorialNote || null;
    if ("notes" in p) row.notes = p.notes || null;
    if ("photo" in p) row.photo_url = p.photo && p.photo.indexOf("http") === 0 ? p.photo : null;
    if ("passingRecordedAt" in p) row.passing_recorded_at = p.passingRecordedAt || null;
    if ("isSelf" in p) row.is_self = !!p.isSelf;
    if ("createdBy" in p) row.created_by = p.createdBy || null;
    return row;
  }

  function rowToTrait(r) {
    return {
      id: r.id, personId: r.person_id, traitKey: r.trait_key,
      contributorName: r.contributor_name || "", createdAt: r.created_at
    };
  }

  SupabaseAdapter.prototype.loadTree = function () {
    var self = this;
    return Promise.all([
      self._rest("people?select=*&order=created_at.asc"),
      self._rest("relationships?select=*&order=created_at.asc"),
      self._rest("suggestions?select=*&order=created_at.asc"),
      self._rest("media?select=*&order=created_at.asc"),
      self._rest("person_traits?select=*&order=created_at.asc")
    ]).then(function (parts) {
      var voiceByPerson = {};
      (parts[3] || []).forEach(function (m) {
        if (m.kind !== "voice-note") return;
        (voiceByPerson[m.person_id] = voiceByPerson[m.person_id] || []).push({
          id: m.id, authorName: m.author_name || "", audio: m.file_url, createdAt: m.created_at
        });
      });
      return {
        people: (parts[0] || []).map(function (r) { return rowToPerson(r, voiceByPerson[r.id]); }),
        relationships: (parts[1] || []).map(function (r) {
          return { id: r.id, a: r.person_a, b: r.person_b, type: r.type, createdBy: r.created_by || "", createdAt: r.created_at };
        }),
        suggestions: (parts[2] || []).map(function (r) {
          return {
            id: r.id, personId: r.person_id, suggesterName: r.suggester_name || "",
            kind: r.kind, text: r.text || "", voice: r.voice_url || null,
            proposed: r.proposed || null, status: r.status, createdAt: r.created_at
          };
        }),
        traits: (parts[4] || []).map(rowToTrait)
      };
    });
  };

  SupabaseAdapter.prototype.addPerson = function (person) {
    var self = this;
    var photoReady = person.photo && person.photo.indexOf("data:") === 0
      ? self._uploadDataUrl("photos", person.photo)
      : Promise.resolve(person.photo || null);
    return photoReady.then(function (photoUrl) {
      var row = personToRow(Object.assign({}, person, { photo: photoUrl }));
      return self._rest("people", {
        method: "POST",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify(row)
      }).then(function (rows) {
        var saved = rowToPerson(rows[0], []);
        saved._pendingVoiceNotes = person.voiceNotes || [];
        return self._saveVoiceNotes(saved).then(function () { return saved; });
      });
    });
  };

  SupabaseAdapter.prototype._saveVoiceNotes = function (person) {
    var self = this;
    var notes = person._pendingVoiceNotes || [];
    delete person._pendingVoiceNotes;
    var chain = Promise.resolve();
    notes.forEach(function (n) {
      chain = chain.then(function () {
        var up = n.audio && n.audio.indexOf("data:") === 0
          ? self._uploadDataUrl("voice", n.audio) : Promise.resolve(n.audio);
        return up.then(function (url) {
          return self._rest("media", {
            method: "POST",
            body: JSON.stringify({ person_id: person.id, kind: "voice-note", file_url: url, author_name: n.authorName || null })
          });
        });
      });
    });
    return chain;
  };

  SupabaseAdapter.prototype.updatePerson = function (id, patch) {
    var self = this;
    var photoReady = patch.photo && patch.photo.indexOf("data:") === 0
      ? self._uploadDataUrl("photos", patch.photo)
      : Promise.resolve(patch.photo);
    return photoReady.then(function (photoUrl) {
      var full = Object.assign({}, patch);
      if (photoUrl !== undefined) full.photo = photoUrl;
      var voice = full.voiceNotes;
      delete full.voiceNotes;
      var row = personToRow(full);
      Object.keys(row).forEach(function (k) { if (row[k] === null && k !== "photo_url") { /* keep nulls to clear fields */ } });
      return self._rest("people?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify(row)
      }).then(function (rows) {
        var saved = rowToPerson(rows[0], voice || []);
        saved._pendingVoiceNotes = (voice || []).filter(function (n) { return n.audio && n.audio.indexOf("data:") === 0; });
        return self._saveVoiceNotes(saved).then(function () { return saved; });
      });
    });
  };

  SupabaseAdapter.prototype.deletePerson = function (id) {
    return this._rest("people?id=eq." + encodeURIComponent(id), { method: "DELETE" })
      .then(function () { return undefined; });
  };

  SupabaseAdapter.prototype.addRelationship = function (rel) {
    return this._rest("relationships", {
      method: "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ person_a: rel.a, person_b: rel.b, type: rel.type, created_by: rel.createdBy || null })
    }).then(function (rows) {
      var r = rows[0];
      return { id: r.id, a: r.person_a, b: r.person_b, type: r.type, createdBy: r.created_by || "", createdAt: r.created_at };
    });
  };

  SupabaseAdapter.prototype.deleteRelationship = function (id) {
    return this._rest("relationships?id=eq." + encodeURIComponent(id), { method: "DELETE" })
      .then(function () { return undefined; });
  };

  SupabaseAdapter.prototype.addSuggestion = function (sug) {
    var self = this;
    var voiceReady = sug.voice && sug.voice.indexOf("data:") === 0
      ? self._uploadDataUrl("voice", sug.voice) : Promise.resolve(sug.voice || null);
    return voiceReady.then(function (voiceUrl) {
      return self._rest("suggestions", {
        method: "POST",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify({
          person_id: sug.personId, suggester_name: sug.suggesterName || null,
          kind: sug.kind || "edit", text: sug.text || null, voice_url: voiceUrl,
          proposed: sug.proposed || null, status: sug.status || "pending"
        })
      }).then(function (rows) {
        var r = rows[0];
        return {
          id: r.id, personId: r.person_id, suggesterName: r.suggester_name || "",
          kind: r.kind, text: r.text || "", voice: r.voice_url || null,
          proposed: r.proposed || null, status: r.status, createdAt: r.created_at
        };
      });
    });
  };

  SupabaseAdapter.prototype.updateSuggestion = function (id, patch) {
    return this._rest("suggestions?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({ status: patch.status })
    }).then(function (rows) {
      var r = rows[0];
      return {
        id: r.id, personId: r.person_id, suggesterName: r.suggester_name || "",
        kind: r.kind, text: r.text || "", voice: r.voice_url || null,
        proposed: r.proposed || null, status: r.status, createdAt: r.created_at
      };
    });
  };

  /* Idempotent per (person, trait, contributor): the table's unique
     constraint backs this up, but checking first keeps a double-tap
     from ever surfacing an error to an elder. */
  SupabaseAdapter.prototype.addTrait = function (trait) {
    var self = this;
    var contributor = trait.contributorName || "";
    return self.listTraits(trait.personId).then(function (existing) {
      var found = existing.find(function (tr) {
        return tr.traitKey === trait.traitKey && tr.contributorName === contributor;
      });
      if (found) return found;
      return self._rest("person_traits", {
        method: "POST",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify({
          person_id: trait.personId, trait_key: trait.traitKey,
          contributor_name: contributor || null
        })
      }).then(function (rows) { return rowToTrait(rows[0]); });
    });
  };

  SupabaseAdapter.prototype.removeTrait = function (id) {
    return this._rest("person_traits?id=eq." + encodeURIComponent(id), { method: "DELETE" })
      .then(function () { return undefined; });
  };

  SupabaseAdapter.prototype.listTraits = function (personId) {
    return this._rest("person_traits?person_id=eq." + encodeURIComponent(personId) + "&select=*&order=created_at.asc")
      .then(function (rows) { return (rows || []).map(rowToTrait); });
  };

  /* Import: wipe-and-replace is intentionally NOT offered against the
     shared database from the client (too destructive for an open link).
     Go-live migration of the local seed uses the SQL/JSON path in the
     README instead. */
  SupabaseAdapter.prototype.replaceAll = function () {
    return Promise.reject(new Error("Import is disabled against the shared database. See README (go-live migration)."));
  };

  global.FC_SupabaseAdapter = SupabaseAdapter;
})(typeof window !== "undefined" ? window : globalThis);
