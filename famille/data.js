/* data.js — the data layer for Famille Cisse.
 *
 * Everything in the app talks to a small async adapter interface:
 *   loadTree()                       -> { people, relationships, suggestions, traits }
 *   addPerson(person)                -> saved person (with id)
 *   updatePerson(id, patch)          -> saved person
 *   deletePerson(id)
 *   addRelationship(rel)             -> saved relationship
 *   deleteRelationship(id)
 *   addSuggestion(suggestion)        -> saved suggestion
 *   updateSuggestion(id, patch)      -> saved suggestion
 *   addTrait(trait)                  -> saved trait (one pick of one quality)
 *   removeTrait(id)                  -> removes that one pick
 *   listTraits(personId)             -> [trait] for one person
 *   replaceAll(data)                 -> used by JSON import
 *
 * Two implementations exist:
 *   - LocalAdapter (this file): data lives in this browser's localStorage,
 *     seeded on first run with the family's starting tree. This is the
 *     practice / demo mode.
 *   - SupabaseAdapter (supabase-adapter.js): same interface against a real
 *     shared database — this is the go-live mode. Switching is one line in
 *     config.js; no UI code changes.
 *
 * Data model
 *   Person: { id, fullName, nickname, gender: 'female'|'male'|'unknown',
 *             birth: {y, m, d} | {y} | null, birthPlace, birthCountry,
 *             residenceCountry, death: {y, m, d} | {y} | null, deathPlace,
 *             deathCountry, memorialNote, notes, photo (data URL or URL),
 *             voiceNotes: [{id, authorName, audio, createdAt}],
 *             isSelf, createdBy, createdAt }
 *   Relationship: { id, a, b, type, createdBy, createdAt }
 *     type 'parent'       : a is a parent of b
 *     type 'step-parent'  : a is a step-parent of b
 *     type 'raised-by'    : a raised b
 *     type 'partner'      : a and b are spouses/partners (symmetric)
 *     type 'sibling'      : a and b are full siblings (symmetric)
 *     type 'half-sibling' : a and b are half-siblings (symmetric)
 *     type 'cousin'       : a and b are cousins by a manual link (symmetric)
 *   Suggestion: { id, personId, suggesterName, kind: 'edit'|'passing',
 *                 text, voice (data URL or URL), proposed: {...}|null,
 *                 status: 'pending'|'accepted'|'dismissed', createdAt }
 *   Trait: { id, personId, traitKey, contributorName, createdAt }
 *     One row = one family member picking one quality for one person.
 *     traitKey is one of FC_I18N.TRAIT_KEYS (positive/funny only, no free
 *     text); the profile groups rows by traitKey to show counts + who
 *     picked it. A contributor can pick the same quality only once.
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Seed — exactly the 9 people + 8 relationships Bengaly entered in   */
  /* v1 (~/workspace/family-tree/seed-from-v1.json). Nothing invented.  */
  /* ------------------------------------------------------------------ */
  var SEED_RAW = {
    "people": [
      { "birthDate": "18 Oct 2002", "fullName": "Bengaly Django Cisse", "id": 1, "isSelf": true, "nickname": "Junior" },
      { "birthDate": "4 May 1977", "birthPlace": "Bamako", "fullName": "Django Cisse", "gender": "male", "id": 2, "nickname": "Django" },
      { "deathDate": "2 Sep 2026", "deathPlace": "Bamako", "fullName": "Niakale Soucko", "gender": "female", "id": 3, "nickname": "Niang" },
      { "fullName": "Salimata Niang", "gender": "female", "id": 5 },
      { "fullName": "Fatoumata Cisse", "gender": "female", "id": 6, "nickname": "Mah Cisse" },
      { "birthDate": "7 Dec 2010", "birthPlace": "Bamako", "fullName": "Mohamed Django Cisse", "gender": "male", "id": 9, "nickname": "Papito" },
      { "birthPlace": "Dakar", "fullName": "Mamadou Namory Django Cisse", "gender": "male", "id": 10, "nickname": "Chico" },
      { "fullName": "Saran Cisse", "gender": "female", "id": 11 },
      { "fullName": "Sekou Mahamadou Cisse", "gender": "male", "id": 12 }
    ],
    "relationships": [
      { "a": 2, "b": 1, "type": "parent" },
      { "a": 3, "b": 2, "type": "parent" },
      { "a": 2, "b": 5, "type": "partner" },
      { "a": 2, "b": 6, "type": "sibling" },
      { "a": 2, "b": 9, "type": "parent" },
      { "a": 2, "b": 10, "type": "parent" },
      { "a": 3, "b": 11, "type": "parent" },
      { "a": 3, "b": 12, "type": "partner" }
    ]
  };

  var MONTH_INDEX = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };

  /* "18 Oct 2002" -> { d: 18, m: 10, y: 2002 }; "1977" -> { y: 1977 } */
  function parseDateText(text) {
    if (!text) return null;
    var s = String(text).trim();
    var m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      var mon = MONTH_INDEX[m[2].slice(0, 3).toLowerCase()];
      if (mon) return { d: parseInt(m[1], 10), m: mon, y: parseInt(m[3], 10) };
    }
    m = s.match(/^(\d{4})$/);
    if (m) return { y: parseInt(m[1], 10) };
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
    return null;
  }

  function normalizeSeedPerson(raw, idx) {
    var countries = global.FC_COUNTRIES;
    var birth = parseDateText(raw.birthDate);
    var death = parseDateText(raw.deathDate);
    var base = Date.UTC(2026, 10, 14, 12, 0, 0); // seed import moment
    return {
      id: String(raw.id),
      fullName: raw.fullName || "",
      nickname: raw.nickname || "",
      gender: raw.gender || "unknown",
      birth: birth,
      birthPlace: raw.birthPlace || "",
      birthCountry: countries ? countries.countryForCity(raw.birthPlace) : null,
      residenceCountry: null,
      death: death,
      deathPlace: raw.deathPlace || "",
      deathCountry: countries ? countries.countryForCity(raw.deathPlace) : null,
      memorialNote: "",
      notes: "",
      photo: null,
      voiceNotes: [],
      passingRecordedAt: death ? new Date(base + idx * 60000 + 30000).toISOString() : null,
      isSelf: !!raw.isSelf,
      createdBy: "Bengaly",
      createdAt: new Date(base + idx * 60000).toISOString()
    };
  }

  function buildSeed() {
    var people = SEED_RAW.people.map(normalizeSeedPerson);
    var base = Date.UTC(2026, 10, 14, 12, 30, 0);
    var relationships = SEED_RAW.relationships.map(function (r, i) {
      return {
        id: "seed-rel-" + (i + 1),
        a: String(r.a), b: String(r.b), type: r.type,
        createdBy: "Bengaly",
        createdAt: new Date(base + i * 60000).toISOString()
      };
    });
    return { people: people, relationships: relationships, suggestions: [], traits: [] };
  }

  /* ------------------------------------------------------------------ */
  /* LocalAdapter — localStorage-backed, seeded on first run.          */
  /* ------------------------------------------------------------------ */
  var STORAGE_KEY = "famillecisse.local.v1";

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
  }

  function LocalAdapter(storage) {
    this.storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    this.memory = null; // fallback when localStorage is unavailable
  }

  LocalAdapter.prototype._read = function () {
    if (this.memory) return this.memory;
    var raw = null;
    try { raw = this.storage ? this.storage.getItem(STORAGE_KEY) : null; } catch (e) { raw = null; }
    if (!raw) {
      var seed = buildSeed();
      this._write(seed);
      return seed;
    }
    try {
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.people)) throw new Error("bad shape");
      data.relationships = data.relationships || [];
      data.suggestions = data.suggestions || [];
      data.traits = data.traits || [];
      return data;
    } catch (e) {
      var fresh = buildSeed();
      this._write(fresh);
      return fresh;
    }
  };

  LocalAdapter.prototype._write = function (data) {
    this.memory = data;
    try {
      if (this.storage) this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* Quota exceeded (photos/voice are heavy locally) — data still lives
         in memory for this session; the app surfaces a warning. */
      if (typeof console !== "undefined") console.warn("Local save failed (storage full?)", e);
      if (typeof global.FC_onLocalSaveError === "function") global.FC_onLocalSaveError();
    }
  };

  LocalAdapter.prototype.loadTree = function () {
    return Promise.resolve(JSON.parse(JSON.stringify(this._read())));
  };

  LocalAdapter.prototype.addPerson = function (person) {
    var data = this._read();
    var saved = Object.assign({}, person, {
      id: person.id || uid("p"),
      voiceNotes: person.voiceNotes || [],
      createdAt: person.createdAt || new Date().toISOString()
    });
    data.people.push(saved);
    this._write(data);
    return Promise.resolve(JSON.parse(JSON.stringify(saved)));
  };

  LocalAdapter.prototype.updatePerson = function (id, patch) {
    var data = this._read();
    var p = data.people.find(function (x) { return x.id === id; });
    if (!p) return Promise.reject(new Error("person not found"));
    Object.assign(p, patch);
    this._write(data);
    return Promise.resolve(JSON.parse(JSON.stringify(p)));
  };

  LocalAdapter.prototype.deletePerson = function (id) {
    var data = this._read();
    data.people = data.people.filter(function (x) { return x.id !== id; });
    data.relationships = data.relationships.filter(function (r) { return r.a !== id && r.b !== id; });
    data.suggestions = data.suggestions.filter(function (s) { return s.personId !== id; });
    data.traits = (data.traits || []).filter(function (tr) { return tr.personId !== id; });
    this._write(data);
    return Promise.resolve();
  };

  LocalAdapter.prototype.addRelationship = function (rel) {
    var data = this._read();
    var exists = data.relationships.some(function (r) {
      return r.type === rel.type &&
        ((r.a === rel.a && r.b === rel.b) || (r.a === rel.b && r.b === rel.a));
    });
    if (exists) {
      var found = data.relationships.find(function (r) { return r.type === rel.type; });
      return Promise.resolve(JSON.parse(JSON.stringify(found)));
    }
    var saved = Object.assign({}, rel, {
      id: rel.id || uid("r"),
      createdAt: rel.createdAt || new Date().toISOString()
    });
    data.relationships.push(saved);
    this._write(data);
    return Promise.resolve(JSON.parse(JSON.stringify(saved)));
  };

  LocalAdapter.prototype.deleteRelationship = function (id) {
    var data = this._read();
    data.relationships = data.relationships.filter(function (r) { return r.id !== id; });
    this._write(data);
    return Promise.resolve();
  };

  LocalAdapter.prototype.addSuggestion = function (sug) {
    var data = this._read();
    var saved = Object.assign({}, sug, {
      id: sug.id || uid("s"),
      status: sug.status || "pending",
      createdAt: sug.createdAt || new Date().toISOString()
    });
    data.suggestions.push(saved);
    this._write(data);
    return Promise.resolve(JSON.parse(JSON.stringify(saved)));
  };

  LocalAdapter.prototype.updateSuggestion = function (id, patch) {
    var data = this._read();
    var s = data.suggestions.find(function (x) { return x.id === id; });
    if (!s) return Promise.reject(new Error("suggestion not found"));
    Object.assign(s, patch);
    this._write(data);
    return Promise.resolve(JSON.parse(JSON.stringify(s)));
  };

  /* One pick of one quality for one person. Idempotent per
     (personId, traitKey, contributorName) — tapping twice never stacks
     two picks from the same family member, same as relationships. */
  LocalAdapter.prototype.addTrait = function (trait) {
    var data = this._read();
    data.traits = data.traits || [];
    var contributor = trait.contributorName || "";
    var existing = data.traits.find(function (tr) {
      return tr.personId === trait.personId && tr.traitKey === trait.traitKey &&
        (tr.contributorName || "") === contributor;
    });
    if (existing) return Promise.resolve(JSON.parse(JSON.stringify(existing)));
    var saved = {
      id: trait.id || uid("t"),
      personId: trait.personId,
      traitKey: trait.traitKey,
      contributorName: contributor,
      createdAt: trait.createdAt || new Date().toISOString()
    };
    data.traits.push(saved);
    this._write(data);
    return Promise.resolve(JSON.parse(JSON.stringify(saved)));
  };

  LocalAdapter.prototype.removeTrait = function (id) {
    var data = this._read();
    data.traits = (data.traits || []).filter(function (tr) { return tr.id !== id; });
    this._write(data);
    return Promise.resolve();
  };

  LocalAdapter.prototype.listTraits = function (personId) {
    var data = this._read();
    var mine = (data.traits || []).filter(function (tr) { return tr.personId === personId; });
    return Promise.resolve(JSON.parse(JSON.stringify(mine)));
  };

  LocalAdapter.prototype.replaceAll = function (newData) {
    this._write({
      people: newData.people || [],
      relationships: newData.relationships || [],
      suggestions: newData.suggestions || [],
      traits: newData.traits || []
    });
    return this.loadTree();
  };

  /* ------------------------------------------------------------------ */
  /* Factory — config.js decides which adapter the app uses.            */
  /* ------------------------------------------------------------------ */
  function createAdapter() {
    var cfg = global.FC_CONFIG || { backend: "local" };
    if (cfg.backend === "supabase" && typeof global.FC_SupabaseAdapter === "function") {
      return new global.FC_SupabaseAdapter(cfg);
    }
    return new LocalAdapter();
  }

  global.FC_DATA = {
    SEED_RAW: SEED_RAW,
    buildSeed: buildSeed,
    parseDateText: parseDateText,
    LocalAdapter: LocalAdapter,
    createAdapter: createAdapter,
    STORAGE_KEY: STORAGE_KEY
  };
})(typeof window !== "undefined" ? window : globalThis);
