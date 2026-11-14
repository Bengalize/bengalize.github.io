/* family.js — pure relationship logic over { people, relationships }.
   No DOM, no storage: the same functions drive the profile page, the
   tree layout, and the node test harness. */
(function (global) {
  "use strict";

  function byId(data) {
    var map = {};
    (data.people || []).forEach(function (p) { map[p.id] = p; });
    return map;
  }

  function relsOfType(data, type) {
    return (data.relationships || []).filter(function (r) { return r.type === type; });
  }

  function uniq(ids) {
    var seen = {}, out = [];
    ids.forEach(function (id) { if (!seen[id]) { seen[id] = true; out.push(id); } });
    return out;
  }

  /* Blood parents: ids of people with a 'parent' link pointing at id. */
  function parentsOf(data, id) {
    return uniq(relsOfType(data, "parent")
      .filter(function (r) { return r.b === id; })
      .map(function (r) { return r.a; }));
  }

  function childrenOf(data, id) {
    return uniq(relsOfType(data, "parent")
      .filter(function (r) { return r.a === id; })
      .map(function (r) { return r.b; }));
  }

  function stepParentsOf(data, id) {
    return uniq(relsOfType(data, "step-parent")
      .filter(function (r) { return r.b === id; })
      .map(function (r) { return r.a; }));
  }

  function stepChildrenOf(data, id) {
    return uniq(relsOfType(data, "step-parent")
      .filter(function (r) { return r.a === id; })
      .map(function (r) { return r.b; }));
  }

  function raisedByOf(data, id) {
    return uniq(relsOfType(data, "raised-by")
      .filter(function (r) { return r.b === id; })
      .map(function (r) { return r.a; }));
  }

  function partnersOf(data, id) {
    var out = [];
    relsOfType(data, "partner").forEach(function (r) {
      if (r.a === id) out.push(r.b);
      if (r.b === id) out.push(r.a);
    });
    return uniq(out);
  }

  function linkedOf(data, id, type) {
    var out = [];
    relsOfType(data, type).forEach(function (r) {
      if (r.a === id) out.push(r.b);
      if (r.b === id) out.push(r.a);
    });
    return uniq(out);
  }

  function fatherOf(data, id) {
    var map = byId(data);
    var ps = parentsOf(data, id);
    for (var i = 0; i < ps.length; i++) {
      if (map[ps[i]] && map[ps[i]].gender === "male") return ps[i];
    }
    return null;
  }

  function motherOf(data, id) {
    var map = byId(data);
    var ps = parentsOf(data, id);
    for (var i = 0; i < ps.length; i++) {
      if (map[ps[i]] && map[ps[i]].gender === "female") return ps[i];
    }
    return null;
  }

  /* Full siblings: explicit 'sibling' links + people sharing both known
     parents. Half siblings: explicit 'half-sibling' links + people
     sharing exactly one known parent. Explicit full wins over derived half. */
  function siblingsOf(data, id) {
    var myParents = parentsOf(data, id);
    var full = linkedOf(data, id, "sibling");
    var half = linkedOf(data, id, "half-sibling");
    (data.people || []).forEach(function (p) {
      if (p.id === id) return;
      var theirs = parentsOf(data, p.id);
      if (!theirs.length || !myParents.length) return;
      var shared = theirs.filter(function (x) { return myParents.indexOf(x) >= 0; });
      if (shared.length >= 2) full.push(p.id);
      else if (shared.length === 1) half.push(p.id);
    });
    full = uniq(full).filter(function (x) { return x !== id; });
    var fullSet = {};
    full.forEach(function (x) { fullSet[x] = true; });
    half = uniq(half).filter(function (x) { return x !== id && !fullSet[x]; });
    return { full: full, half: half };
  }

  /* Automatic cousins: children of my parents' siblings (full or half),
     excluding my own siblings. Plus manual 'cousin' links. */
  function cousinsOf(data, id) {
    var out = linkedOf(data, id, "cousin");
    var myParents = parentsOf(data, id);
    var sib = siblingsOf(data, id);
    var exclude = {};
    exclude[id] = true;
    sib.full.concat(sib.half).forEach(function (x) { exclude[x] = true; });
    myParents.forEach(function (parentId) {
      var ps = siblingsOf(data, parentId);
      ps.full.concat(ps.half).forEach(function (auntUncleId) {
        childrenOf(data, auntUncleId).forEach(function (c) {
          if (!exclude[c]) out.push(c);
        });
      });
    });
    return uniq(out).filter(function (x) { return x !== id; });
  }

  /* One-line distinguishing context for the picker: "son of Django Cisse ·
     b. 2010 · Bamako" — same-name cousins are the #1 duplicate risk, so
     search results never show a bare name. */
  function personContext(data, person, t) {
    var map = byId(data);
    var bits = [];
    var ps = parentsOf(data, person.id).map(function (pid) { return map[pid]; }).filter(Boolean);
    if (ps.length) {
      bits.push(t("childOfContext") + " " + ps.map(function (p) { return p.fullName; }).join(" & "));
    }
    if (person.birth && person.birth.y) bits.push(t("bornShort") + " " + person.birth.y);
    if (person.birthPlace) bits.push(person.birthPlace);
    if (person.death && person.death.y) bits.push("† " + person.death.y);
    return bits.join(" · ");
  }

  /* --- Duplicate detection ------------------------------------------- */
  function normalizeName(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  /* Similarity 0..1 between two full names. Tuned for this family: nearly
     everyone shares the family name (last token), so a shared surname alone
     must NOT count as a likely duplicate — otherwise every new Cisse would
     trigger a false "did you mean…?". The strong boost (dropped middle
     name, spelling variant) only applies when two tokens are shared or
     the given names (first tokens) are near-identical. */
  function nameSimilarity(a, b) {
    var na = normalizeName(a), nb = normalizeName(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    var ta = na.split(" "), tb = nb.split(" ");
    var sharedTokens = ta.filter(function (tok) { return tb.indexOf(tok) >= 0; });
    var shared = sharedTokens.length;
    var tokenScore = shared / Math.max(ta.length, tb.length);
    var dist = levenshtein(na, nb);
    var editScore = 1 - dist / Math.max(na.length, nb.length);
    var score = tokenScore * 0.7 + editScore * 0.3;
    var givenSim = 1 - levenshtein(ta[0], tb[0]) / Math.max(ta[0].length, tb[0].length);
    if (shared >= 2 || givenSim >= 0.8) {
      var bestTokenPair = 0;
      ta.forEach(function (x) {
        tb.forEach(function (y) {
          var s = 1 - levenshtein(x, y) / Math.max(x.length, y.length);
          if (s > bestTokenPair) bestTokenPair = s;
        });
      });
      score = Math.max(score, bestTokenPair * 0.6 + tokenScore * 0.4);
    } else if (shared === 1 &&
               sharedTokens[0] === ta[ta.length - 1] &&
               sharedTokens[0] === tb[tb.length - 1]) {
      // Only the family name matches, given names differ: not a duplicate.
      score = Math.min(score, 0.5);
    }
    return score;
  }

  /* Existing people whose name resembles `name` (threshold-tunable). */
  function findSimilar(data, name, excludeId) {
    var scored = [];
    (data.people || []).forEach(function (p) {
      if (excludeId && p.id === excludeId) return;
      var s = nameSimilarity(name, p.fullName);
      if (p.nickname) s = Math.max(s, nameSimilarity(name, p.nickname) * 0.95);
      if (s >= 0.55) scored.push({ person: p, score: s });
    });
    scored.sort(function (x, y) { return y.score - x.score; });
    return scored.slice(0, 3);
  }

  /* Generations: 0 = eldest known. Blood-parent longest path, then
     equalized across sibling and partner links so couples and siblings
     sit on the same row. */
  function generations(data) {
    var gen = {};
    (data.people || []).forEach(function (p) { gen[p.id] = 0; });
    var changed = true, guard = 0;
    while (changed && guard++ < 100) {
      changed = false;
      relsOfType(data, "parent").forEach(function (r) {
        if (gen[r.b] < gen[r.a] + 1) { gen[r.b] = gen[r.a] + 1; changed = true; }
      });
      ["sibling", "half-sibling", "partner", "cousin"].forEach(function (type) {
        relsOfType(data, type).forEach(function (r) {
          var m = Math.max(gen[r.a] || 0, gen[r.b] || 0);
          if (gen[r.a] !== m || gen[r.b] !== m) { gen[r.a] = m; gen[r.b] = m; changed = true; }
        });
      });
    }
    return gen;
  }

  global.FC_FAMILY = {
    byId: byId,
    parentsOf: parentsOf,
    childrenOf: childrenOf,
    stepParentsOf: stepParentsOf,
    stepChildrenOf: stepChildrenOf,
    raisedByOf: raisedByOf,
    partnersOf: partnersOf,
    linkedOf: linkedOf,
    fatherOf: fatherOf,
    motherOf: motherOf,
    siblingsOf: siblingsOf,
    cousinsOf: cousinsOf,
    personContext: personContext,
    normalizeName: normalizeName,
    nameSimilarity: nameSimilarity,
    findSimilar: findSimilar,
    generations: generations
  };
})(typeof window !== "undefined" ? window : globalThis);
