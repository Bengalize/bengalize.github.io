/* app.js — Famille Cisse UI. Plain DOM, no framework, no downloads:
   everything renders from the adapter (data.js) through family.js logic. */
(function () {
  "use strict";

  var C = window.FC_COUNTRIES;
  var I = window.FC_I18N;
  var D = window.FC_DATA;
  var F = window.FC_FAMILY;
  var S = I.STRINGS;

  var adapter = D.createAdapter();

  var state = {
    lang: localStorage.getItem("fc.lang") ||
      ((navigator.language || "en").toLowerCase().indexOf("fr") === 0 ? "fr" : "en"),
    data: null,
    view: "tree",           // tree | people | remembered | recent | profile
    selectedId: null,
    contributor: localStorage.getItem("fc.name") || "",
    keeper: localStorage.getItem("fc.keeper") === "1",
    query: "",
    transform: { k: 1, x: 0, y: 0 },
    formPhoto: null,        // pending photo data URL inside the person form
    formVoice: null,        // pending voice data URL inside suggestion form
    showAllTraitsFor: null  // profile id whose trait list is fully expanded
  };

  function t(key) {
    return (S[state.lang] && S[state.lang][key]) || S.en[key] || key;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function person(id) {
    return state.data ? F.byId(state.data)[id] : null;
  }

  function initials(p) {
    var parts = (p.fullName || "?").trim().split(/\s+/);
    var a = parts[0] ? parts[0][0] : "?";
    var b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }

  function fmtDate(d) {
    if (!d || !d.y) return "";
    var months = t("months");
    if (d.m && d.d) return d.d + " " + months[d.m - 1] + " " + d.y;
    if (d.m) return months[d.m - 1] + " " + d.y;
    return String(d.y);
  }

  function yearsLine(p) {
    var b = p.birth && p.birth.y ? p.birth.y : "?";
    if (p.death && p.death.y) return b + " – † " + p.death.y;
    if (p.birth) return t("bornShort") === "b." ? "b. " + b : t("bornShort") + " " + b;
    return "";
  }

  function flagPair(p) {
    var out = "";
    if (p.birthCountry) out += C.flag(p.birthCountry);
    if (p.residenceCountry && p.residenceCountry !== p.birthCountry) out += C.flag(p.residenceCountry);
    return out;
  }

  function avatarHTML(p, cls) {
    if (p.photo) {
      return '<span class="avatar ' + cls + '"><img src="' + esc(p.photo) + '" alt=""></span>';
    }
    return '<span class="avatar avatar-initials ' + cls + '" aria-hidden="true">' + esc(initials(p)) + "</span>";
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  window.FC_onLocalSaveError = function () {
    toast(state.lang === "fr"
      ? "Stockage de l'appareil plein — exportez l'arbre pour le garder en sécurité."
      : "This device's storage is full — export the tree to keep it safe.");
  };

  /* ------------------------------------------------------------ */
  /* Boot                                                          */
  /* ------------------------------------------------------------ */
  function refresh() {
    return adapter.loadTree().then(function (data) {
      state.data = data;
      render();
    });
  }

  function render() {
    renderHeader();
    var main = document.getElementById("appMain");
    if (!state.data) {
      main.innerHTML = '<p class="loading">' + esc(t("loading")) + "</p>";
      return;
    }
    if (state.view === "tree") renderTree(main);
    else if (state.view === "people") renderPeople(main);
    else if (state.view === "remembered") renderRemembered(main);
    else if (state.view === "recent") renderRecent(main);
    else if (state.view === "profile") renderProfile(main);
  }

  function renderHeader() {
    var h = document.getElementById("appHeader");
    var tabs = [
      ["tree", t("viewTree")], ["people", t("viewPeople")],
      ["remembered", t("viewRemembered")], ["recent", t("viewRecent")]
    ];
    h.innerHTML =
      '<div class="header-top">' +
        '<div class="brand"><span class="brand-tree" aria-hidden="true">🌳</span>' +
        '<div><div class="brand-name">' + esc(t("appTitle")) + "</div>" +
        '<div class="brand-tag">' + esc(t("appTagline")) + "</div></div></div>" +
        '<div class="header-actions">' +
          '<button class="btn btn-small" data-action="lang">' + esc(t("langName")) + "</button>" +
          (state.contributor
            ? '<button class="btn btn-small btn-ghost" data-action="set-name" title="' + esc(t("changeName")) + '">👤 ' + esc(state.contributor) + "</button>"
            : '<button class="btn btn-small btn-warn" data-action="set-name">👤 ' + esc(t("yourName")) + " ?</button>") +
        "</div>" +
      "</div>" +
      '<nav class="tabs">' +
        tabs.map(function (tab) {
          return '<button class="tab' + (state.view === tab[0] || (state.view === "profile" && tab[0] === "people") ? " active" : "") +
            '" data-action="nav" data-view="' + tab[0] + '">' + esc(tab[1]) + "</button>";
        }).join("") +
        '<button class="tab tab-add" data-action="add-person">' + esc(t("addPerson")) + "</button>" +
      "</nav>" +
      (state.keeper ? '<div class="keeper-banner">' + esc(t("keeperOn")) + "</div>" : "") +
      ((window.FC_CONFIG && window.FC_CONFIG.backend !== "supabase")
        ? '<div class="local-banner">' + esc(t("localNote")) + "</div>" : "");
  }

  /* ------------------------------------------------------------ */
  /* Tree view                                                     */
  /* ------------------------------------------------------------ */
  var CARD_W = 150, CARD_H = 104, PARTNER_W = 122, H_GAP = 30, V_GAP = 96, PAD = 30;

  function descendantCount(data, id) {
    var seen = {}, queue = F.childrenOf(data, id), count = 0;
    while (queue.length) {
      var cur = queue.pop();
      if (seen[cur]) continue;
      seen[cur] = true; count++;
      F.childrenOf(data, cur).forEach(function (c) { queue.push(c); });
    }
    return count;
  }

  function byBirthThenName(map) {
    return function (a, b) {
      var pa = map[a], pb = map[b];
      var ya = pa && pa.birth && pa.birth.y ? pa.birth.y : 9999;
      var yb = pb && pb.birth && pb.birth.y ? pb.birth.y : 9999;
      if (ya !== yb) return ya - yb;
      return (pa ? pa.fullName : "").localeCompare(pb ? pb.fullName : "");
    };
  }

  function layoutTree(data) {
    var map = F.byId(data);
    var gens = F.generations(data);
    var placed = {};
    var edges = [];   // {x1,y1,x2,y2} parent->child branch curves
    var links = [];   // {x1,x2,y} couple links

    function makeUnit(headId) {
      var unit = { head: headId, partners: [], children: [], width: 0, rowWidth: 0, cx: 0 };
      placed[headId] = true;
      F.partnersOf(data, headId).forEach(function (pid) {
        if (!placed[pid]) { unit.partners.push(pid); placed[pid] = true; }
      });
      var childIds = [];
      [headId].concat(unit.partners).forEach(function (pid) {
        F.childrenOf(data, pid).forEach(function (cid) {
          if (childIds.indexOf(cid) < 0) childIds.push(cid);
        });
      });
      childIds.sort(byBirthThenName(map));
      childIds.forEach(function (cid) {
        if (placed[cid]) return;
        unit.children.push({ id: cid, unit: makeUnit(cid) });
      });
      unit.rowWidth = CARD_W + unit.partners.length * (PARTNER_W + 14);
      var kids = unit.children.reduce(function (s, c) { return s + c.unit.width; }, 0) +
        Math.max(0, unit.children.length - 1) * H_GAP;
      unit.width = Math.max(unit.rowWidth, kids);
      return unit;
    }

    var candidates = data.people
      .filter(function (p) { return F.parentsOf(data, p.id).length === 0; })
      .sort(function (a, b) { return descendantCount(data, b.id) - descendantCount(data, a.id); });
    var roots = [];
    candidates.forEach(function (p) { if (!placed[p.id]) roots.push(makeUnit(p.id)); });
    data.people.forEach(function (p) { if (!placed[p.id]) roots.push(makeUnit(p.id)); });

    var positions = {}; // id -> {cx, top, w, head:boolean}
    var maxGen = 0;
    Object.keys(gens).forEach(function (id) { if (gens[id] > maxGen) maxGen = gens[id]; });

    function place(unit, left) {
      unit.cx = left + unit.width / 2;
      var gen = gens[unit.head] || 0;
      var top = PAD + gen * (CARD_H + V_GAP);
      var rowLeft = unit.cx - unit.rowWidth / 2;
      positions[unit.head] = { cx: rowLeft + CARD_W / 2, top: top, w: CARD_W, head: unit.head };
      var x = rowLeft + CARD_W;
      unit.partners.forEach(function (pid) {
        x += 14;
        positions[pid] = { cx: x + PARTNER_W / 2, top: top, w: PARTNER_W, head: unit.head };
        links.push({ x1: positions[unit.head].cx + CARD_W / 2 - 6, x2: x + 2, y: top + 30 });
        x += PARTNER_W;
      });
      var kidsWidth = unit.children.reduce(function (s, c) { return s + c.unit.width; }, 0) +
        Math.max(0, unit.children.length - 1) * H_GAP;
      var kx = unit.cx - kidsWidth / 2;
      unit.children.forEach(function (child) {
        place(child.unit, kx);
        // Anchor: midpoint of the two parents when both are in this row.
        var childPos = positions[child.id];
        var anchorIds = F.parentsOf(data, child.id).filter(function (pid) { return positions[pid] && positions[pid].head === unit.head; });
        var ax;
        if (anchorIds.length >= 2) {
          ax = (positions[anchorIds[0]].cx + positions[anchorIds[1]].cx) / 2;
        } else if (anchorIds.length === 1) {
          ax = positions[anchorIds[0]].cx;
        } else {
          ax = unit.cx;
        }
        edges.push({ x1: ax, y1: top + CARD_H, x2: childPos.cx, y2: childPos.top });
        kx += child.unit.width + H_GAP;
      });
    }

    var cursor = PAD;
    roots.forEach(function (r) { place(r, cursor); cursor += r.width + H_GAP * 2; });
    var totalW = cursor + PAD;
    var totalH = PAD * 2 + (maxGen + 1) * CARD_H + maxGen * V_GAP;
    return { positions: positions, edges: edges, links: links, width: totalW, height: totalH, gens: gens };
  }

  function renderTree(main) {
    var data = state.data;
    if (!data.people.length) {
      main.innerHTML = '<p class="empty">' + esc(t("emptyTree")) + "</p>";
      return;
    }
    var L = layoutTree(data);
    var map = F.byId(data);
    var svg = '<svg class="tree-lines" width="' + L.width + '" height="' + L.height + '" aria-hidden="true">';
    L.links.forEach(function (l) {
      svg += '<line x1="' + l.x1 + '" y1="' + l.y + '" x2="' + l.x2 + '" y2="' + l.y + '" class="couple-line"/>' +
        '<text x="' + ((l.x1 + l.x2) / 2) + '" y="' + (l.y + 5) + '" class="couple-heart">♥</text>';
    });
    L.edges.forEach(function (e) {
      var midY = (e.y1 + e.y2) / 2;
      svg += '<path d="M ' + e.x1 + " " + e.y1 + " C " + e.x1 + " " + midY + ", " + e.x2 + " " + midY + ", " + e.x2 + " " + e.y2 + '" class="branch"/>';
    });
    svg += "</svg>";

    var nodes = Object.keys(L.positions).map(function (id) {
      var p = map[id], pos = L.positions[id];
      var deceased = p.death ? " deceased" : "";
      return '<button class="tree-node' + deceased + '" data-action="open-person" data-id="' + esc(id) + '"' +
        ' style="left:' + (pos.cx - pos.w / 2) + "px;top:" + pos.top + "px;width:" + pos.w +
        "px;animation-delay:" + Math.min(1.1, (L.gens[id] || 0) * 0.16) + 's">' +
        avatarHTML(p, "avatar-node") +
        '<span class="node-name">' + esc(p.fullName) + "</span>" +
        '<span class="node-years">' + esc(yearsLine(p)) + "</span>" +
        (flagPair(p) ? '<span class="node-flags">' + flagPair(p) + "</span>" : "") +
        "</button>";
    }).join("");

    /* Honest family stats + a generation distribution bar (real counts). */
    var genCounts = [];
    data.people.forEach(function (p) {
      var g = L.gens[p.id] || 0;
      genCounts[g] = (genCounts[g] || 0) + 1;
    });
    var countrySet = {};
    data.people.forEach(function (p) {
      if (p.birthCountry) countrySet[p.birthCountry] = true;
      if (p.residenceCountry) countrySet[p.residenceCountry] = true;
    });
    var rememberedCount = data.people.filter(function (p) { return !!p.death; }).length;
    var genBar = genCounts.map(function (count, g) {
      if (!count) return "";
      return '<span class="gen-seg gen-seg-' + (g % 6) + '" style="width:' +
        (count / data.people.length * 100) + '%" title="' +
        esc(t("genShort")) + " " + (g + 1) + " : " + count + '"></span>';
    }).join("");
    var statsHTML =
      '<div class="stats-strip enter">' +
        '<div class="stat"><span class="stat-num">' + data.people.length + '</span><span class="stat-label">' + esc(t("statsPeople")) + "</span></div>" +
        '<div class="stat"><span class="stat-num">' + genCounts.length + '</span><span class="stat-label">' + esc(t("statsGenerations")) + "</span></div>" +
        '<div class="stat"><span class="stat-num">' + rememberedCount + '</span><span class="stat-label">' + esc(t("viewRemembered")) + "</span></div>" +
        '<div class="stat"><span class="stat-num">' + Object.keys(countrySet).length + '</span><span class="stat-label">' + esc(t("statsCountries")) + "</span></div>" +
        '<div class="gen-bar" aria-hidden="true">' + genBar + "</div>" +
      "</div>";

    main.innerHTML = statsHTML +
      '<div class="tree-toolbar">' +
        '<span class="tree-hint">' + esc(t("treeHint")) + "</span>" +
        '<span class="tree-tools">' +
          '<button class="btn btn-small" data-action="zoom-out" title="' + esc(t("zoomOut")) + '">−</button>' +
          '<button class="btn btn-small" data-action="zoom-reset" title="' + esc(t("zoomReset")) + '">⌂</button>' +
          '<button class="btn btn-small" data-action="zoom-in" title="' + esc(t("zoomIn")) + '">＋</button>' +
          '<button class="btn btn-small" data-action="print">' + esc(t("printTree")) + "</button>" +
        "</span>" +
      "</div>" +
      '<div class="tree-viewport enter" id="treeViewport">' +
        '<span class="leaf" style="left:5%;top:8%;animation-duration:11s" aria-hidden="true">🍃</span>' +
        '<span class="leaf" style="right:7%;top:14%;animation-duration:13s" aria-hidden="true">🍃</span>' +
        '<span class="leaf" style="left:11%;bottom:9%;animation-duration:9s" aria-hidden="true">🍂</span>' +
        '<div class="tree-canvas" id="treeCanvas" style="width:' + L.width + "px;height:" + L.height + 'px">' +
          svg + nodes +
        "</div>" +
      "</div>";
    applyTransform();
    attachPanZoom();
  }

  function applyTransform() {
    var canvas = document.getElementById("treeCanvas");
    if (!canvas) return;
    var tr = state.transform;
    canvas.style.transform = "translate(" + tr.x + "px," + tr.y + "px) scale(" + tr.k + ")";
  }

  function attachPanZoom() {
    var vp = document.getElementById("treeViewport");
    if (!vp) return;
    var drag = null, moved = false;
    vp.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, tx: state.transform.x, ty: state.transform.y };
      moved = false;
    });
    vp.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      state.transform.x = drag.tx + dx;
      state.transform.y = drag.ty + dy;
      applyTransform();
    });
    function endDrag(e) {
      if (drag && moved) {
        // Suppress the click that follows a drag.
        e.stopPropagation();
        vp.addEventListener("click", function swallow(ev) {
          ev.stopPropagation(); ev.preventDefault();
          vp.removeEventListener("click", swallow, true);
        }, true);
      }
      drag = null;
    }
    vp.addEventListener("pointerup", endDrag);
    vp.addEventListener("pointercancel", function () { drag = null; });
    vp.addEventListener("wheel", function (e) {
      e.preventDefault();
      var factor = e.deltaY < 0 ? 1.08 : 0.92;
      state.transform.k = Math.min(2.5, Math.max(0.25, state.transform.k * factor));
      applyTransform();
    }, { passive: false });
  }

  /* ------------------------------------------------------------ */
  /* People / Remembered / Recent                                  */
  /* ------------------------------------------------------------ */
  function personRow(p, label) {
    return '<button class="person-row" data-action="open-person" data-id="' + esc(p.id) + '">' +
      avatarHTML(p, "avatar-row") +
      '<span class="row-main"><span class="row-name">' + esc(p.fullName) +
      (p.nickname ? ' <span class="row-nick">“' + esc(p.nickname) + '”</span>' : "") +
      (p.isSelf ? ' <span class="me-badge">' + esc(t("me")) + "</span>" : "") + "</span>" +
      '<span class="row-context">' + esc(F.personContext(state.data, p, t)) + "</span></span>" +
      (label ? '<span class="row-label">' + esc(label) + "</span>" : "") +
      (flagPair(p) ? '<span class="row-flags">' + flagPair(p) + "</span>" : "") +
      "</button>";
  }

  function renderPeople(main) {
    var data = state.data;
    var q = state.query.trim().toLowerCase();
    var list = data.people.slice().sort(function (a, b) { return a.fullName.localeCompare(b.fullName); });
    if (q) {
      list = list.filter(function (p) {
        return (p.fullName + " " + (p.nickname || "")).toLowerCase().indexOf(q) >= 0;
      });
    }
    main.innerHTML =
      '<div class="list-head">' +
        '<input type="search" id="peopleSearch" class="search-input" placeholder="' + esc(t("searchPeople")) + '" value="' + esc(state.query) + '">' +
        '<span class="count-note">' + data.people.length + " " + esc(t("peopleCount")) + "</span>" +
      "</div>" +
      '<div class="person-list">' + list.map(function (p) { return personRow(p); }).join("") + "</div>" +
      '<div class="footer-actions">' +
        '<button class="btn" data-action="export">' + esc(t("exportTree")) + "</button>" +
        '<button class="btn" data-action="import">' + esc(t("importTree")) + "</button>" +
        '<label class="keeper-toggle"><input type="checkbox" data-action-change="keeper" ' + (state.keeper ? "checked" : "") + "> " + esc(t("keeperMode")) + "</label>" +
      "</div>";
    var input = document.getElementById("peopleSearch");
    input.addEventListener("input", function () {
      state.query = input.value;
      var pos = input.selectionStart;
      renderPeople(main);
      var again = document.getElementById("peopleSearch");
      again.focus();
      try { again.setSelectionRange(pos, pos); } catch (e) {}
    });
  }

  function renderRemembered(main) {
    var gone = state.data.people.filter(function (p) { return !!p.death; })
      .sort(function (a, b) { return (b.death.y || 0) - (a.death.y || 0); });
    main.innerHTML = '<div class="remembered-grid">' + gone.map(function (p, idx) {
      return '<button class="memory-card enter-card" style="animation-delay:' + Math.min(0.6, idx * 0.06) + 's" data-action="open-person" data-id="' + esc(p.id) + '">' +
        avatarHTML(p, "avatar-memory") +
        '<span class="memory-name">' + esc(p.fullName) + "</span>" +
        '<span class="memory-dates">' + esc(fmtDate(p.birth)) + (p.birth ? " – " : "") + esc(fmtDate(p.death)) + "</span>" +
        (p.deathPlace ? '<span class="memory-place">🕊 ' + esc(p.deathPlace) + (p.deathCountry ? " " + C.flag(p.deathCountry) : "") + "</span>" : "") +
        (p.memorialNote ? '<span class="memory-note">“' + esc(p.memorialNote) + '”</span>' : "") +
        "</button>";
    }).join("") + "</div>";
  }

  function renderRecent(main) {
    var data = state.data;
    var map = F.byId(data);
    var events = [];
    data.people.forEach(function (p) {
      events.push({ at: p.createdAt, html: "<strong>" + esc(p.fullName) + "</strong> " + esc(t("recentPerson")) + (p.createdBy ? " — " + esc(p.createdBy) : "") });
      if (p.passingRecordedAt) {
        events.push({ at: p.passingRecordedAt, html: esc(t("recentPassing")) + " <strong>" + esc(p.fullName) + "</strong>" });
      }
    });
    data.relationships.forEach(function (r) {
      var a = map[r.a], b = map[r.b];
      if (!a || !b) return;
      events.push({ at: r.createdAt, html: esc(t("recentRelation")) + " <strong>" + esc(a.fullName) + "</strong> — <strong>" + esc(b.fullName) + "</strong>" });
    });
    data.suggestions.forEach(function (s) {
      var p = map[s.personId];
      if (!p) return;
      events.push({ at: s.createdAt, html: esc(t("recentSuggestion")) + " <strong>" + esc(p.fullName) + "</strong>" + (s.suggesterName ? " — " + esc(s.suggesterName) : "") });
    });
    events.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    events = events.slice(0, 30);
    main.innerHTML = events.length
      ? '<div class="recent-list">' + events.map(function (e) {
          return '<div class="recent-item"><span class="recent-date">' + esc(String(e.at).slice(0, 10)) + '</span><span>' + e.html + "</span></div>";
        }).join("") + "</div>"
      : '<p class="empty">' + esc(t("recentEmpty")) + "</p>";
  }

  /* ------------------------------------------------------------ */
  /* Profile                                                       */
  /* ------------------------------------------------------------ */
  function relLabel(kind, gender) {
    var g = gender || "unknown";
    switch (kind) {
      case "father": return t("relFather");
      case "mother": return t("relMother");
      case "parent": return g === "male" ? t("relFather") : g === "female" ? t("relMother") : t("relParent");
      case "step-parent": return g === "male" ? t("relStepfather") : g === "female" ? t("relStepmother") : t("relStepparent");
      case "raised-by": return t("relRaisedBy");
      case "spouse": return g === "male" ? t("relHusband") : g === "female" ? t("relWife") : t("relSpouse");
      case "child": return g === "male" ? t("relSon") : g === "female" ? t("relDaughter") : t("relChild");
      case "stepchild": return t("relStepchild");
      case "sibling": return g === "male" ? t("relBrother") : g === "female" ? t("relSister") : t("relSibling");
      case "half-sibling": return g === "male" ? t("relHalfBrother") : g === "female" ? t("relHalfSister") : t("relHalfSibling");
      case "cousin": return g === "female" ? t("relCousinF") : t("relCousinM");
      default: return kind;
    }
  }

  function chipHTML(p, label, directRelId) {
    return '<span class="chip-wrap">' +
      '<button class="chip" data-action="open-person" data-id="' + esc(p.id) + '">' +
      avatarHTML(p, "avatar-chip") +
      '<span class="chip-text"><span class="chip-name">' + esc(p.fullName) + "</span>" +
      (label ? '<span class="chip-label">' + esc(label) + "</span>" : "") + "</span></button>" +
      (state.keeper && directRelId
        ? '<button class="chip-x" data-action="delete-rel" data-rel="' + esc(directRelId) + '" title="✕">✕</button>' : "") +
      "</span>";
  }

  function directRelId(aId, bId, types) {
    var found = state.data.relationships.filter(function (r) {
      return types.indexOf(r.type) >= 0 &&
        ((r.a === aId && r.b === bId) || (r.a === bId && r.b === aId));
    });
    return found.length ? found[0].id : null;
  }

  function familySection(title, chips) {
    if (!chips.length) return "";
    return '<section class="fam-section"><h3>' + esc(title) + '</h3><div class="chips">' + chips.join("") + "</div></section>";
  }

  function canModerate(p) {
    return state.keeper || (!!state.contributor && state.contributor === p.createdBy);
  }

  /* ------------------------------------------------------------ */
  /* Personality traits — fixed palette, picks grouped per person  */
  /* ------------------------------------------------------------ */
  function traitLabel(key) {
    return t("trait" + key.charAt(0).toUpperCase() + key.slice(1));
  }

  /* [{ key, picks: [trait, …] }] for one person, most-picked first;
     ties keep the palette order so the list is stable. */
  function traitSummary(personId) {
    var byKey = {};
    (state.data.traits || []).forEach(function (tr) {
      if (tr.personId !== personId) return;
      (byKey[tr.traitKey] = byKey[tr.traitKey] || []).push(tr);
    });
    return Object.keys(byKey).map(function (key) {
      return { key: key, picks: byKey[key] };
    }).sort(function (a, b) {
      if (b.picks.length !== a.picks.length) return b.picks.length - a.picks.length;
      return I.TRAIT_KEYS.indexOf(a.key) - I.TRAIT_KEYS.indexOf(b.key);
    });
  }

  function traitSection(p) {
    var summary = traitSummary(p.id);
    var TOP = 6; // the profile shows the top traits; the rest are one tap away
    var showAll = state.showAllTraitsFor === p.id;
    var shown = showAll ? summary : summary.slice(0, TOP);
    var html = '<section class="traits-block"><h3>' + esc(t("personality")) + "</h3>";
    if (!summary.length) {
      html += '<p class="empty">' + esc(t("noTraitsYet")) + "</p>";
    } else {
      html += '<div class="trait-chips">' + shown.map(function (g) {
        var mine = !!state.contributor && g.picks.some(function (tr) {
          return tr.contributorName === state.contributor;
        });
        return '<button class="trait-chip' + (mine ? " mine" : "") + '" data-action="trait-who" data-id="' +
          esc(p.id) + '" data-key="' + esc(g.key) + '">' + esc(traitLabel(g.key)) +
          ' <span class="trait-count">×' + g.picks.length + "</span></button>";
      }).join("") + "</div>";
      if (summary.length > TOP) {
        html += '<button class="btn btn-ghost btn-small traits-more" data-action="traits-more" data-id="' + esc(p.id) + '">' +
          esc(showAll ? t("showLess") : t("showAllQualities") + " (" + summary.length + ")") + "</button>";
      }
    }
    html += '<button class="btn trait-add-btn" data-action="add-trait" data-id="' + esc(p.id) + '">' +
      esc(t("addQuality")) + "</button></section>";
    return html;
  }

  function renderProfile(main) {
    var data = state.data;
    var p = person(state.selectedId);
    if (!p) { state.view = "people"; renderPeople(main); return; }
    var map = F.byId(data);
    var get = function (id) { return map[id]; };

    var parents = F.parentsOf(data, p.id).map(get).filter(Boolean);
    var father = F.fatherOf(data, p.id), mother = F.motherOf(data, p.id);
    var unknownGenderParent = parents.some(function (x) { return x.gender !== "male" && x.gender !== "female"; });
    var partners = F.partnersOf(data, p.id).map(get).filter(Boolean);
    var myChildren = F.childrenOf(data, p.id);
    var sib = F.siblingsOf(data, p.id);
    var cousins = F.cousinsOf(data, p.id).map(get).filter(Boolean);
    var suggestions = data.suggestions.filter(function (s) { return s.personId === p.id; })
      .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });

    var html = '<button class="btn btn-ghost" data-action="nav" data-view="people">' + esc(t("back")) + "</button>";
    html += '<div class="profile-hero enter' + (p.death ? " deceased" : "") + '">' +
      avatarHTML(p, "avatar-hero") +
      '<div class="hero-text"><h2>' + esc(p.fullName) +
      (p.isSelf ? ' <span class="me-badge">' + esc(t("me")) + "</span>" : "") + "</h2>" +
      (p.nickname ? '<div class="hero-nick">“' + esc(p.nickname) + '”</div>' : "") +
      '<div class="hero-lines">' +
      (p.birth ? "<div>🎂 " + esc(t("born")) + " : " + esc(fmtDate(p.birth)) +
        (p.birthPlace ? " — " + esc(p.birthPlace) : "") +
        (p.birthCountry ? " " + C.flag(p.birthCountry) + " " + esc(C.name(p.birthCountry, state.lang)) : "") + "</div>" : "") +
      (p.residenceCountry ? "<div>🏠 " + esc(t("livesIn")) + " : " + C.flag(p.residenceCountry) + " " + esc(C.name(p.residenceCountry, state.lang)) + "</div>" : "") +
      (p.death ? '<div class="hero-death">🕊 ' + esc(t("died")) + " : " + esc(fmtDate(p.death)) +
        (p.deathPlace ? " — " + esc(p.deathPlace) : "") +
        (p.deathCountry ? " " + C.flag(p.deathCountry) : "") + "</div>" : "") +
      (p.createdBy ? '<div class="hero-by">' + esc(t("addedBy")) + " " + esc(p.createdBy) + "</div>" : "") +
      "</div></div></div>";

    if (p.memorialNote) html += '<blockquote class="memorial-note">“' + esc(p.memorialNote) + '”</blockquote>';
    if (p.notes) html += '<p class="profile-notes">' + esc(p.notes) + "</p>";

    html += '<div class="profile-actions">' +
      '<button class="btn btn-primary" data-action="add-relation" data-id="' + esc(p.id) + '">' + esc(t("addFamily")) + "</button>" +
      '<button class="btn" data-action="suggest" data-id="' + esc(p.id) + '">' + esc(t("suggestEdit")) + "</button>" +
      '<button class="btn" data-action="voice-note" data-id="' + esc(p.id) + '">' + esc(t("addVoiceNote")) + "</button>" +
      (p.death
        ? '<span class="in-memory-badge">🕊 ' + esc(t("inMemory")) + "</span>"
        : '<button class="btn" data-action="passing" data-id="' + esc(p.id) + '">' + esc(t("recordPassing")) + "</button>") +
      (canModerate(p) ? '<button class="btn" data-action="edit-person" data-id="' + esc(p.id) + '">' + esc(t("edit")) + "</button>" : "") +
      (state.keeper ? '<button class="btn btn-danger" data-action="delete-person" data-id="' + esc(p.id) + '">' + esc(t("deleteEntry")) + "</button>" : "") +
      "</div>";

    /* Family sections */
    var fam = "";
    var parentChips = parents.map(function (x) {
      return chipHTML(x, relLabel("parent", x.gender), directRelId(p.id, x.id, ["parent"]));
    });
    if (!father && !unknownGenderParent) {
      parentChips.push('<button class="chip chip-missing" data-action="add-relation" data-id="' + esc(p.id) + '" data-kind="father">＋ ' + esc(t("fatherNotKnown")) + "</button>");
    }
    if (!mother && !unknownGenderParent) {
      parentChips.push('<button class="chip chip-missing" data-action="add-relation" data-id="' + esc(p.id) + '" data-kind="mother">＋ ' + esc(t("motherNotKnown")) + "</button>");
    }
    fam += familySection(t("parents"), parentChips);
    fam += familySection(t("stepParents"), F.stepParentsOf(data, p.id).map(get).filter(Boolean).map(function (x) {
      return chipHTML(x, relLabel("step-parent", x.gender), directRelId(p.id, x.id, ["step-parent"]));
    }));
    fam += familySection(t("raisedBy"), F.raisedByOf(data, p.id).map(get).filter(Boolean).map(function (x) {
      return chipHTML(x, t("relRaisedBy"), directRelId(p.id, x.id, ["raised-by"]));
    }));
    fam += familySection(t("partners"), partners.map(function (x) {
      return chipHTML(x, relLabel("spouse", x.gender), directRelId(p.id, x.id, ["partner"]));
    }));
    // Children grouped by the other parent, then the rest.
    var grouped = {};
    partners.forEach(function (partner) {
      var shared = myChildren.filter(function (cid) {
        return F.childrenOf(data, partner.id).indexOf(cid) >= 0;
      });
      if (shared.length) {
        grouped[partner.id] = shared;
        fam += familySection(t("childrenWith") + " " + partner.fullName, shared.map(function (cid) {
          var c = get(cid);
          return c ? chipHTML(c, relLabel("child", c.gender), directRelId(p.id, cid, ["parent"])) : "";
        }));
      }
    });
    var groupedIds = {};
    Object.keys(grouped).forEach(function (k) { grouped[k].forEach(function (cid) { groupedIds[cid] = true; }); });
    var restChildren = myChildren.filter(function (cid) { return !groupedIds[cid]; });
    fam += familySection(t("children"), restChildren.map(function (cid) {
      var c = get(cid);
      return c ? chipHTML(c, relLabel("child", c.gender), directRelId(p.id, cid, ["parent"])) : "";
    }));
    fam += familySection(t("siblings"), sib.full.map(function (id) {
      var x = get(id); return x ? chipHTML(x, relLabel("sibling", x.gender), directRelId(p.id, id, ["sibling", "parent"])) : "";
    }));
    fam += familySection(t("halfSiblings"), sib.half.map(function (id) {
      var x = get(id); return x ? chipHTML(x, relLabel("half-sibling", x.gender), directRelId(p.id, id, ["half-sibling", "parent"])) : "";
    }));
    fam += familySection(t("stepChildren"), F.stepChildrenOf(data, p.id).map(get).filter(Boolean).map(function (x) {
      return chipHTML(x, t("relStepchild"), directRelId(p.id, x.id, ["step-parent"]));
    }));
    fam += familySection(t("cousins"), cousins.map(function (x) {
      return chipHTML(x, relLabel("cousin", x.gender), directRelId(p.id, x.id, ["cousin"]));
    }));

    html += '<div class="fam-block"><h3 class="fam-title">' + esc(t("family")) + "</h3>" +
      (fam || '<p class="empty">' + esc(t("noFamilyYet")) + "</p>") + "</div>";

    /* Personality traits */
    html += traitSection(p);

    /* Voice notes */
    html += '<section class="voice-block"><h3>' + esc(t("voiceNotes")) + '</h3><div class="voice-list">';
    if (p.voiceNotes && p.voiceNotes.length) {
      p.voiceNotes.forEach(function (n) {
        html += '<div class="voice-item"><audio controls preload="none" src="' + esc(n.audio) + '"></audio>' +
          '<span class="voice-meta">' + esc(n.authorName || "") + (n.createdAt ? " · " + esc(String(n.createdAt).slice(0, 10)) : "") + "</span></div>";
      });
    } else {
      html += '<p class="empty">' + esc(t("voiceNoteHint")) + "</p>";
    }
    html += "</div></section>";

    /* Suggestions */
    html += '<section class="sugg-block"><h3>' + esc(t("suggestions")) + "</h3>";
    if (!suggestions.length) html += '<p class="empty">' + esc(t("noSuggestions")) + "</p>";
    suggestions.forEach(function (s) {
      html += '<div class="sugg sugg-' + esc(s.status) + '">' +
        '<div class="sugg-head"><strong>' + esc(s.suggesterName || "?") + "</strong>" +
        '<span class="sugg-kind">' + (s.kind === "passing" ? "🕊 " + esc(t("recordPassing")) : "✎ " + esc(t("suggestEdit"))) + "</span>" +
        '<span class="sugg-status">' + (s.status === "pending" ? esc(t("statusPending")) : esc(s.status)) + "</span></div>" +
        (s.text ? '<div class="sugg-text">' + esc(s.text) + "</div>" : "") +
        (s.voice ? '<audio controls preload="none" src="' + esc(s.voice) + '"></audio>' : "") +
        (s.status === "pending" && canModerate(p)
          ? '<div class="sugg-actions"><button class="btn btn-small" data-action="accept-sugg" data-sugg="' + esc(s.id) + '">' + esc(t("accept")) + "</button>" +
            '<button class="btn btn-small btn-ghost" data-action="dismiss-sugg" data-sugg="' + esc(s.id) + '">' + esc(t("dismiss")) + "</button></div>"
          : "") +
        "</div>";
    });
    html += "</section>";

    main.innerHTML = html;
  }

  /* ------------------------------------------------------------ */
  /* Trait picker + "who picked it"                                */
  /* ------------------------------------------------------------ */
  /* Big-button grid of the whole palette. One tap picks with your
     name; tapping your own pick again takes it back. The modal stays
     open so several qualities can be picked in one visit. */
  function openTraitPicker(p) {
    ensureContributor(function () {
      var mine = {};
      (state.data.traits || []).forEach(function (tr) {
        if (tr.personId === p.id && tr.contributorName === state.contributor) mine[tr.traitKey] = tr;
      });
      openModal('<h3>' + esc(t("addQuality")) + " — " + esc(p.fullName) + "</h3>" +
        '<p class="form-hint">' + esc(t("traitHint")) + "</p>" +
        '<div class="kind-grid">' + I.TRAIT_KEYS.map(function (key) {
          var picked = !!mine[key];
          return '<button class="kind-btn' + (picked ? " picked" : "") + '" data-action="trait-pick" data-id="' +
            esc(p.id) + '" data-key="' + key + '"><span class="kind-icon">' + (picked ? "✓" : "＋") + "</span>" +
            esc(traitLabel(key)) + "</button>";
        }).join("") + "</div>" +
        '<div class="form-actions"><button class="btn btn-primary" data-action="close-modal">' + esc(t("close")) + "</button></div>");
    });
  }

  /* Who picked this quality — and the removal surface: you can take
     back your own pick; the keeper can remove anyone's (honor system,
     same as everywhere else in v1). */
  function openTraitWho(p, key) {
    var picks = (state.data.traits || []).filter(function (tr) {
      return tr.personId === p.id && tr.traitKey === key;
    });
    if (!picks.length) { closeModal(); return; }
    openModal('<h3>' + esc(traitLabel(key)) + " — " + esc(p.fullName) + "</h3>" +
      '<p class="form-hint">' + esc(t("pickedBy")) + " :</p>" +
      '<div class="who-list">' + picks.map(function (tr) {
        var canRemove = state.keeper ||
          (!!state.contributor && tr.contributorName === state.contributor);
        return '<div class="who-row"><span class="who-name">' + esc(tr.contributorName || "?") + "</span>" +
          (canRemove
            ? '<button class="btn btn-small btn-danger" data-action="trait-remove" data-trait="' + esc(tr.id) +
              '" data-id="' + esc(p.id) + '" data-key="' + esc(key) + '">✕</button>'
            : "") + "</div>";
      }).join("") + "</div>" +
      '<div class="form-actions"><button class="btn btn-primary" data-action="close-modal">' + esc(t("close")) + "</button></div>");
  }

  /* ------------------------------------------------------------ */
  /* Modal + shared form pieces                                    */
  /* ------------------------------------------------------------ */
  function openModal(html) {
    document.getElementById("modalRoot").innerHTML =
      '<div class="modal-backdrop" data-action="backdrop"><div class="modal" role="dialog" aria-modal="true">' +
      '<button class="modal-x" data-action="close-modal" aria-label="' + esc(t("close")) + '">✕</button>' +
      html + "</div></div>";
  }
  function closeModal() { document.getElementById("modalRoot").innerHTML = ""; }

  function ensureContributor(next) {
    if (state.contributor) { next(state.contributor); return; }
    openModal('<h3>' + esc(t("yourName")) + "</h3>" +
      '<p class="form-hint">' + esc(t("yourNameHint")) + "</p>" +
      '<input type="text" id="nameInput" class="text-input" autocomplete="name">' +
      '<div class="form-actions"><button class="btn btn-primary" id="nameSave">' + esc(t("save")) + "</button></div>");
    document.getElementById("nameSave").addEventListener("click", function () {
      var name = document.getElementById("nameInput").value.trim();
      if (!name) return;
      state.contributor = name;
      localStorage.setItem("fc.name", name);
      closeModal();
      renderHeader();
      next(name);
    });
  }

  function datePickerHTML(prefix, value) {
    var v = value || {};
    var months = t("months");
    var day = '<option value="">' + esc(t("dateDay")) + "</option>";
    for (var d = 1; d <= 31; d++) day += '<option value="' + d + '"' + (v.d === d ? " selected" : "") + ">" + d + "</option>";
    var mon = '<option value="">' + esc(t("dateMonth")) + "</option>";
    months.forEach(function (name, i) {
      mon += '<option value="' + (i + 1) + '"' + (v.m === i + 1 ? " selected" : "") + ">" + esc(name) + "</option>";
    });
    var thisYear = new Date().getFullYear();
    var yr = '<option value="">' + esc(t("dateYear")) + "</option>";
    for (var y = thisYear + 1; y >= 1850; y--) yr += '<option value="' + y + '"' + (v.y === y ? " selected" : "") + ">" + y + "</option>";
    return '<div class="date-picker"><select id="' + prefix + '-d" aria-label="' + esc(t("dateDay")) + '">' + day + "</select>" +
      '<select id="' + prefix + '-m" aria-label="' + esc(t("dateMonth")) + '">' + mon + "</select>" +
      '<select id="' + prefix + '-y" aria-label="' + esc(t("dateYear")) + '">' + yr + "</select></div>";
  }

  function readDatePicker(prefix) {
    var dEl = document.getElementById(prefix + "-d");
    if (!dEl) return null;
    var d = dEl.value, m = document.getElementById(prefix + "-m").value, y = document.getElementById(prefix + "-y").value;
    if (!y) return null;
    var out = { y: parseInt(y, 10) };
    if (m) out.m = parseInt(m, 10);
    if (m && d) out.d = parseInt(d, 10);
    return out;
  }

  function countrySelectHTML(id, value) {
    var lang = state.lang;
    function opt(code) {
      return '<option value="' + code + '"' + (value === code ? " selected" : "") + ">" +
        C.flag(code) + " " + esc(C.name(code, lang)) + "</option>";
    }
    var pinned = C.PINNED.map(opt).join("");
    var rest = C.ALL.filter(function (c) { return C.PINNED.indexOf(c) < 0; })
      .map(function (c) { return { code: c, name: C.name(c, lang) }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); })
      .map(function (o) { return opt(o.code); }).join("");
    return '<select id="' + id + '" class="country-select"><option value="">' + esc(t("pickCountry")) + "</option>" +
      '<optgroup label="★">' + pinned + "</optgroup>" + rest + "</select>";
  }

  function processPhotoFile(file, cb) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = 480;
      var scale = Math.min(1, max / Math.max(img.width, img.height));
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width * scale));
      cv.height = Math.max(1, Math.round(img.height * scale));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cb(cv.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast(t("photoTooBig")); };
    img.src = url;
  }

  function pickPhoto(cb) {
    var input = document.getElementById("photoInput");
    input.value = "";
    input.onchange = function () {
      if (input.files && input.files[0]) processPhotoFile(input.files[0], cb);
    };
    input.click();
  }

  function makeRecorder(btn, onDone, idleLabel) {
    var mr = null, chunks = [], stream = null, recording = false;
    btn.addEventListener("click", function () {
      if (!recording) {
        if (!navigator.mediaDevices || !window.MediaRecorder) { toast(t("voiceUnsupported")); return; }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
          stream = st; chunks = [];
          mr = new MediaRecorder(st);
          mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          mr.onstop = function () {
            stream.getTracks().forEach(function (tr) { tr.stop(); });
            var blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
            var fr = new FileReader();
            fr.onload = function () { onDone(fr.result); };
            fr.readAsDataURL(blob);
          };
          mr.start();
          recording = true;
          btn.textContent = t("stopRecording");
          btn.classList.add("recording");
        }).catch(function () { toast(t("voiceDenied")); });
      } else {
        recording = false;
        btn.textContent = idleLabel;
        btn.classList.remove("recording");
        if (mr) mr.stop();
      }
    });
  }

  /* ------------------------------------------------------------ */
  /* Person form (add / edit / create-inside-relation-flow)        */
  /* ------------------------------------------------------------ */
  function personFormHTML(existing) {
    var p = existing || {};
    state.formPhoto = p.photo || null;
    var gender = p.gender === "male" || p.gender === "female" ? p.gender : "unknown";
    // Elders first: the form opens with three things only — name, woman/man,
    // photo. Everything else lives behind one "More details" tap. When
    // editing someone who already has details, start open so nothing hides.
    var hasDetails = !!(p.nickname || p.birth || p.birthPlace || p.birthCountry ||
      p.residenceCountry || p.notes || p.death);
    function genderBtn(value, icon, label) {
      return '<button type="button" class="gender-btn' + (gender === value ? " selected" : "") +
        '" data-gender="' + value + '" aria-pressed="' + (gender === value) + '">' +
        '<span class="gender-icon">' + icon + "</span>" + esc(label) + "</button>";
    }
    return '<h3>' + (existing ? esc(t("edit")) + " — " + esc(p.fullName) : esc(t("addPerson"))) + "</h3>" +
      '<div id="dupPanel"></div>' +
      '<div class="form-grid">' +
      '<label class="field field-wide"><span>' + esc(t("fullName")) + ' *</span>' +
      '<input type="text" id="pf-name" class="text-input" value="' + esc(p.fullName || "") + '"></label>' +
      '<div class="field field-wide"><span>' + esc(t("gender")) + '</span>' +
      '<input type="hidden" id="pf-gender" value="' + gender + '">' +
      '<div class="gender-row">' +
      genderBtn("female", "👩", t("genderFemale")) +
      genderBtn("male", "👨", t("genderMale")) +
      genderBtn("unknown", "?", t("genderUnknown")) +
      "</div></div>" +
      '<div class="field field-wide"><span>' + esc(t("photo")) + '</span><div class="photo-row">' +
      '<span id="pf-photo-preview">' + (state.formPhoto ? '<img src="' + esc(state.formPhoto) + '" alt="">' : "") + "</span>" +
      '<button type="button" class="btn" id="pf-photo-btn">' + esc(state.formPhoto ? t("changePhoto") : t("addPhoto")) + "</button></div></div>" +
      "</div>" +
      '<button type="button" class="btn btn-more" id="pf-more-btn" aria-expanded="' + hasDetails + '">' + esc(t("moreDetails")) + "</button>" +
      '<div id="pf-more" style="display:' + (hasDetails ? "block" : "none") + '">' +
      '<div class="form-grid">' +
      '<label class="field"><span>' + esc(t("nickname")) + '</span>' +
      '<input type="text" id="pf-nick" class="text-input" value="' + esc(p.nickname || "") + '"></label>' +
      '<div class="field"><span>' + esc(t("birthDate")) + "</span>" + datePickerHTML("pf-birth", p.birth) +
      '<span class="date-hint">' + esc(t("dateHint")) + "</span></div>" +
      '<label class="field"><span>' + esc(t("birthPlace")) + '</span>' +
      '<input type="text" id="pf-birthplace" class="text-input" value="' + esc(p.birthPlace || "") + '"></label>' +
      '<label class="field"><span>' + esc(t("birthPlace")) + " — " + (state.lang === "fr" ? "pays" : "country") + "</span>" +
      countrySelectHTML("pf-birthcountry", p.birthCountry) + "</label>" +
      '<label class="field"><span>' + esc(t("currentCountry")) + "</span>" +
      countrySelectHTML("pf-residence", p.residenceCountry) + "</label>" +
      '<label class="field field-wide"><span>' + esc(t("notes")) + '</span>' +
      '<textarea id="pf-notes" class="text-input" rows="2">' + esc(p.notes || "") + "</textarea></label>" +
      '<label class="field field-wide check-field"><input type="checkbox" id="pf-deceased" ' + (p.death ? "checked" : "") + "> " + esc(t("died")) + "</label>" +
      '<div class="field-wide death-fields" id="pf-death-fields" style="display:' + (p.death ? "block" : "none") + '">' +
      '<div class="form-grid">' +
      '<div class="field"><span>' + esc(t("deathDate")) + "</span>" + datePickerHTML("pf-death", p.death) + "</div>" +
      '<label class="field"><span>' + esc(t("deathPlace")) + '</span>' +
      '<input type="text" id="pf-deathplace" class="text-input" value="' + esc(p.deathPlace || "") + '"></label>' +
      '<label class="field"><span>' + esc(t("deathPlace")) + " — " + (state.lang === "fr" ? "pays" : "country") + "</span>" +
      countrySelectHTML("pf-deathcountry", p.deathCountry) + "</label>" +
      '<label class="field field-wide"><span>' + esc(t("memorialNote")) + '</span>' +
      '<textarea id="pf-memorial" class="text-input" rows="2">' + esc(p.memorialNote || "") + "</textarea></label>" +
      "</div></div>" +
      "</div></div>" +
      '<div class="form-actions"><button class="btn btn-ghost" data-action="close-modal">' + esc(t("cancel")) + "</button>" +
      '<button class="btn btn-primary" id="pf-save">' + esc(t("save")) + "</button></div>";
  }

  function readPersonForm(existing) {
    var deceased = document.getElementById("pf-deceased").checked;
    return {
      fullName: document.getElementById("pf-name").value.trim(),
      nickname: document.getElementById("pf-nick").value.trim(),
      gender: document.getElementById("pf-gender").value,
      photo: state.formPhoto,
      birth: readDatePicker("pf-birth"),
      birthPlace: document.getElementById("pf-birthplace").value.trim(),
      birthCountry: document.getElementById("pf-birthcountry").value || null,
      residenceCountry: document.getElementById("pf-residence").value || null,
      notes: document.getElementById("pf-notes").value.trim(),
      death: deceased ? readDatePicker("pf-death") : null,
      deathPlace: deceased ? document.getElementById("pf-deathplace").value.trim() : "",
      deathCountry: deceased ? (document.getElementById("pf-deathcountry").value || null) : null,
      memorialNote: deceased ? document.getElementById("pf-memorial").value.trim() : ""
    };
  }

  /* opts: { existing, onSaved(person), onUseExisting(person) } */
  function openPersonForm(opts) {
    var existing = opts.existing || null;
    var dupConfirmed = false;
    openModal(personFormHTML(existing));
    document.getElementById("pf-photo-btn").addEventListener("click", function () {
      pickPhoto(function (dataUrl) {
        state.formPhoto = dataUrl;
        document.getElementById("pf-photo-preview").innerHTML = '<img src="' + esc(dataUrl) + '" alt="">';
        document.getElementById("pf-photo-btn").textContent = t("changePhoto");
      });
    });
    document.getElementById("pf-deceased").addEventListener("change", function (e) {
      document.getElementById("pf-death-fields").style.display = e.target.checked ? "block" : "none";
    });
    document.getElementById("pf-more-btn").addEventListener("click", function () {
      var more = document.getElementById("pf-more");
      var open = more.style.display !== "none";
      more.style.display = open ? "none" : "block";
      this.setAttribute("aria-expanded", String(!open));
    });
    document.querySelectorAll("[data-gender]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.getElementById("pf-gender").value = btn.getAttribute("data-gender");
        document.querySelectorAll("[data-gender]").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("selected", on);
          b.setAttribute("aria-pressed", String(on));
        });
      });
    });
    document.getElementById("pf-save").addEventListener("click", function () {
      var values = readPersonForm(existing);
      if (!values.fullName) { toast(t("nameRequired")); return; }
      if (!existing && !dupConfirmed) {
        var similar = F.findSimilar(state.data, values.fullName, null);
        if (similar.length) {
          var panel = document.getElementById("dupPanel");
          var sameDate = similar.some(function (s) {
            return s.person.birth && values.birth && s.person.birth.y === values.birth.y &&
              (!s.person.birth.d || !values.birth.d || s.person.birth.d === values.birth.d);
          });
          panel.innerHTML = '<div class="dup-box"><p>' + esc(t("didYouMean")) + "</p>" +
            similar.map(function (s) {
              return '<div class="dup-row">' + avatarHTML(s.person, "avatar-chip") +
                '<span class="dup-text"><strong>' + esc(s.person.fullName) + "</strong>" +
                '<span class="row-context">' + esc(F.personContext(state.data, s.person, t)) + "</span></span>" +
                '<button class="btn btn-small" data-dup-use="' + esc(s.person.id) + '">' + esc(t("useThisPerson")) + "</button></div>";
            }).join("") +
            (sameDate ? '<p class="dup-twin">👶 ' + esc(t("twinNote")) + "</p>" : "") +
            '<button class="btn btn-small btn-ghost" id="dup-new">' + esc(t("differentPerson")) + "</button></div>";
          panel.querySelectorAll("[data-dup-use]").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var found = person(btn.getAttribute("data-dup-use"));
              closeModal();
              if (opts.onUseExisting) opts.onUseExisting(found);
              else { state.view = "profile"; state.selectedId = found.id; render(); }
            });
          });
          document.getElementById("dup-new").addEventListener("click", function () {
            dupConfirmed = true;
            panel.innerHTML = "";
            document.getElementById("pf-save").click();
          });
          return;
        }
      }
      if (existing) {
        adapter.updatePerson(existing.id, values).then(function (saved) {
          closeModal(); toast(t("saved"));
          if (opts.onSaved) opts.onSaved(saved); else refresh();
        });
      } else {
        values.createdBy = state.contributor;
        adapter.addPerson(values).then(function (saved) {
          closeModal(); toast(t("saved"));
          if (opts.onSaved) opts.onSaved(saved); else refresh();
        });
      }
    });
  }

  /* ------------------------------------------------------------ */
  /* Add-family flow                                               */
  /* ------------------------------------------------------------ */
  var REL_KINDS = [
    { kind: "father", icon: "👨" }, { kind: "mother", icon: "👩" },
    { kind: "spouse", icon: "💍" }, { kind: "child", icon: "🧒" },
    { kind: "sibling", icon: "👥" }, { kind: "half-sibling", icon: "🧑‍🤝‍🧑" },
    { kind: "stepfather", icon: "👨‍👧" }, { kind: "stepmother", icon: "👩‍👧" },
    { kind: "stepchild", icon: "🧒" }, { kind: "raised-by", icon: "🏠" },
    { kind: "cousin", icon: "🌿" }
  ];

  function kindLabel(kind) {
    switch (kind) {
      case "father": return t("relFather");
      case "mother": return t("relMother");
      case "spouse": return t("relSpouse");
      case "child": return t("relChild");
      case "sibling": return t("relSibling");
      case "half-sibling": return t("relHalfSibling");
      case "stepfather": return t("relStepfather");
      case "stepmother": return t("relStepmother");
      case "stepchild": return t("relStepchild");
      case "raised-by": return t("relRaisedBy");
      case "cousin": return t("relCousin");
      default: return kind;
    }
  }

  function relationFor(kind, anchorId, otherId) {
    switch (kind) {
      case "father": case "mother": return { a: otherId, b: anchorId, type: "parent" };
      case "child": return { a: anchorId, b: otherId, type: "parent" };
      case "spouse": return { a: anchorId, b: otherId, type: "partner" };
      case "sibling": return { a: anchorId, b: otherId, type: "sibling" };
      case "half-sibling": return { a: anchorId, b: otherId, type: "half-sibling" };
      case "stepfather": case "stepmother": return { a: otherId, b: anchorId, type: "step-parent" };
      case "stepchild": return { a: anchorId, b: otherId, type: "step-parent" };
      case "raised-by": return { a: otherId, b: anchorId, type: "raised-by" };
      case "cousin": return { a: anchorId, b: otherId, type: "cousin" };
      default: return null;
    }
  }

  function excludedFor(kind, anchorId) {
    var d = state.data, out = { };
    out[anchorId] = true;
    var add = function (ids) { ids.forEach(function (id) { out[id] = true; }); };
    if (kind === "father" || kind === "mother") add(F.parentsOf(d, anchorId));
    if (kind === "spouse") add(F.partnersOf(d, anchorId));
    if (kind === "child") add(F.childrenOf(d, anchorId));
    if (kind === "sibling") add(F.siblingsOf(d, anchorId).full);
    if (kind === "half-sibling") add(F.siblingsOf(d, anchorId).half);
    if (kind === "cousin") add(F.cousinsOf(d, anchorId));
    return out;
  }

  function finishRelation(anchorId, kind, otherId) {
    var rel = relationFor(kind, anchorId, otherId);
    if (!rel) return;
    rel.createdBy = state.contributor;
    adapter.addRelationship(rel).then(function () {
      closeModal();
      toast(t("saved"));
      state.view = "profile";
      state.selectedId = anchorId;
      refresh();
    });
  }

  function openRelationFlow(anchorId, presetKind) {
    var anchor = person(anchorId);
    if (!anchor) return;
    ensureContributor(function () {
      if (presetKind) { renderRelPicker(anchor, presetKind); return; }
      // The five everyday relations are big buttons, first thing seen.
      // The rest (step, half, raised-by, cousin) sit behind one more tap —
      // an elder should never face eleven choices at once.
      var primary = REL_KINDS.slice(0, 5), more = REL_KINDS.slice(5);
      function kindBtn(k) {
        return '<button class="kind-btn" data-kind="' + k.kind + '"><span class="kind-icon">' + k.icon + "</span>" + esc(kindLabel(k.kind)) + "</button>";
      }
      openModal('<h3>' + esc(t("addRelationTitle")) + " " + esc(anchor.fullName) + "</h3>" +
        '<p class="form-hint">' + esc(t("relationKind")) + '</p><div class="kind-grid">' +
        primary.map(kindBtn).join("") + "</div>" +
        '<button type="button" class="btn btn-more" id="kind-more-btn" aria-expanded="false">' + esc(t("moreRelations")) + "</button>" +
        '<div class="kind-grid" id="kind-more" style="display:none">' + more.map(kindBtn).join("") + "</div>");
      document.querySelectorAll("[data-kind]").forEach(function (btn) {
        btn.addEventListener("click", function () { renderRelPicker(anchor, btn.getAttribute("data-kind")); });
      });
      document.getElementById("kind-more-btn").addEventListener("click", function () {
        var box = document.getElementById("kind-more");
        var open = box.style.display !== "none";
        box.style.display = open ? "none" : "grid";
        this.setAttribute("aria-expanded", String(!open));
      });
    });
  }

  function renderRelPicker(anchor, kind) {
    var excluded = excludedFor(kind, anchor.id);
    openModal('<h3>' + esc(kindLabel(kind)) + " — " + esc(anchor.fullName) + "</h3>" +
      '<p class="form-hint">' + esc(t("pickExisting")) + "</p>" +
      '<input type="search" id="relSearch" class="search-input" placeholder="' + esc(t("searchExisting")) + '">' +
      '<div id="relResults" class="person-list compact"></div>' +
      '<div class="form-actions"><span class="or-new">' + esc(t("orNew")) + '</span>' +
      '<button class="btn btn-primary" id="relCreate">' + esc(t("createNewPerson")) + "</button></div>");

    function draw(query) {
      var q = (query || "").trim().toLowerCase();
      var list = state.data.people.filter(function (p) {
        if (excluded[p.id]) return false;
        if (!q) return true;
        return (p.fullName + " " + (p.nickname || "")).toLowerCase().indexOf(q) >= 0;
      }).sort(function (a, b) { return a.fullName.localeCompare(b.fullName); });
      // When the typed text looks like an existing person, surface them first.
      var similarIds = {};
      if (q.length >= 3) {
        F.findSimilar(state.data, query, anchor.id).forEach(function (s) {
          if (!excluded[s.person.id]) similarIds[s.person.id] = true;
        });
      }
      list.sort(function (a, b) { return (similarIds[b.id] ? 1 : 0) - (similarIds[a.id] ? 1 : 0); });
      document.getElementById("relResults").innerHTML = list.map(function (p) { return personRow(p); }).join("");
      document.querySelectorAll("#relResults [data-id]").forEach(function (row) {
        row.addEventListener("click", function (e) {
          e.stopPropagation(); // the global delegation would open the profile instead
          finishRelation(anchor.id, kind, row.getAttribute("data-id"));
        });
      });
    }
    draw("");
    document.getElementById("relSearch").addEventListener("input", function (e) { draw(e.target.value); });
    document.getElementById("relCreate").addEventListener("click", function () {
      openPersonForm({
        existing: null,
        onSaved: function (saved) { finishRelation(anchor.id, kind, saved.id); },
        onUseExisting: function (found) { finishRelation(anchor.id, kind, found.id); }
      });
    });
  }

  /* ------------------------------------------------------------ */
  /* Passing, suggestions, voice notes                             */
  /* ------------------------------------------------------------ */
  function openPassing(p) {
    ensureContributor(function () {
      var asSuggestion = !!p.death;
      state.formPhoto = p.photo || null;
      openModal('<h3>' + esc(t("passingTitle")) + " " + esc(p.fullName) + "</h3>" +
        '<p class="form-hint">' + esc(asSuggestion ? t("alreadyMemorial") : t("passingHint")) + "</p>" +
        '<div class="form-grid">' +
        '<div class="field"><span>' + esc(t("deathDate")) + "</span>" + datePickerHTML("ps-death", p.death) +
        '<span class="date-hint">' + esc(t("dateHint")) + "</span></div>" +
        '<label class="field"><span>' + esc(t("deathPlace")) + '</span>' +
        '<input type="text" id="ps-place" class="text-input" value="' + esc(p.deathPlace || "") + '"></label>' +
        '<label class="field"><span>' + esc(t("deathPlace")) + " — " + (state.lang === "fr" ? "pays" : "country") + "</span>" +
        countrySelectHTML("ps-country", p.deathCountry) + "</label>" +
        '<label class="field field-wide"><span>' + esc(t("memorialNote")) + '</span>' +
        '<textarea id="ps-note" class="text-input" rows="3">' + esc(p.memorialNote || "") + "</textarea></label>" +
        "</div>" +
        '<div class="form-actions"><button class="btn btn-ghost" data-action="close-modal">' + esc(t("cancel")) + "</button>" +
        '<button class="btn btn-primary" id="ps-save">' + esc(t("save")) + "</button></div>");
      document.getElementById("ps-save").addEventListener("click", function () {
        var proposed = {
          death: readDatePicker("ps-death"),
          deathPlace: document.getElementById("ps-place").value.trim(),
          deathCountry: document.getElementById("ps-country").value || null,
          memorialNote: document.getElementById("ps-note").value.trim(),
          passingRecordedAt: new Date().toISOString()
        };
        if (asSuggestion) {
          adapter.addSuggestion({
            personId: p.id, suggesterName: state.contributor, kind: "passing",
            text: proposed.memorialNote, proposed: proposed
          }).then(function () { closeModal(); toast(t("saved")); refresh(); });
        } else {
          adapter.updatePerson(p.id, proposed).then(function () {
            closeModal(); toast(t("saved")); refresh();
          });
        }
      });
    });
  }

  function openSuggest(p) {
    ensureContributor(function () {
      state.formVoice = null;
      openModal('<h3>' + esc(t("suggestEdit")) + " — " + esc(p.fullName) + "</h3>" +
        '<p class="form-hint">' + esc(t("suggestHint")) + "</p>" +
        '<div class="form-grid">' +
        '<label class="field field-wide"><span>' + esc(t("suggestText")) + '</span>' +
        '<textarea id="sg-text" class="text-input" rows="3" placeholder="' + esc(t("suggestPlaceholder")) + '"></textarea></label>' +
        '<label class="field"><span>' + esc(t("fullName")) + '</span>' +
        '<input type="text" id="sg-name" class="text-input" placeholder="' + esc(p.fullName) + '"></label>' +
        '<div class="field"><span>' + esc(t("birthDate")) + "</span>" + datePickerHTML("sg-birth", null) + "</div>" +
        '<label class="field"><span>' + esc(t("birthPlace")) + '</span>' +
        '<input type="text" id="sg-birthplace" class="text-input" placeholder="' + esc(p.birthPlace || "") + '"></label>' +
        '<div class="field"><span>' + esc(t("voiceNote")) + '</span>' +
        '<button type="button" class="btn" id="sg-record">' + esc(t("addVoiceNote")) + '</button>' +
        '<span id="sg-voice-ok" class="voice-ok"></span></div>' +
        "</div>" +
        '<div class="form-actions"><button class="btn btn-ghost" data-action="close-modal">' + esc(t("cancel")) + "</button>" +
        '<button class="btn btn-primary" id="sg-save">' + esc(t("save")) + "</button></div>");
      makeRecorder(document.getElementById("sg-record"), function (dataUrl) {
        state.formVoice = dataUrl;
        document.getElementById("sg-voice-ok").textContent = "✓";
      }, t("addVoiceNote"));
      document.getElementById("sg-save").addEventListener("click", function () {
        var proposed = {};
        var newName = document.getElementById("sg-name").value.trim();
        if (newName && newName !== p.fullName) proposed.fullName = newName;
        var newBirth = readDatePicker("sg-birth");
        if (newBirth) proposed.birth = newBirth;
        var newPlace = document.getElementById("sg-birthplace").value.trim();
        if (newPlace && newPlace !== p.birthPlace) proposed.birthPlace = newPlace;
        var text = document.getElementById("sg-text").value.trim();
        if (!text && !state.formVoice && !Object.keys(proposed).length) return;
        adapter.addSuggestion({
          personId: p.id, suggesterName: state.contributor, kind: "edit",
          text: text, voice: state.formVoice,
          proposed: Object.keys(proposed).length ? proposed : null
        }).then(function () { closeModal(); toast(t("saved")); refresh(); });
      });
    });
  }

  function openVoiceNote(p) {
    ensureContributor(function () {
      openModal('<h3>' + esc(t("addVoiceNote")) + " — " + esc(p.fullName) + "</h3>" +
        '<p class="form-hint">' + esc(t("voiceNoteHint")) + "</p>" +
        '<div class="voice-record-row"><button class="btn btn-primary" id="vn-record">' + esc(t("addVoiceNote")) + "</button></div>" +
        '<div class="form-actions"><button class="btn btn-ghost" data-action="close-modal">' + esc(t("close")) + "</button></div>");
      makeRecorder(document.getElementById("vn-record"), function (dataUrl) {
        var notes = (p.voiceNotes || []).concat([{
          id: "vn-" + Date.now().toString(36), authorName: state.contributor,
          audio: dataUrl, createdAt: new Date().toISOString()
        }]);
        adapter.updatePerson(p.id, { voiceNotes: notes }).then(function () {
          closeModal(); toast(t("saved")); refresh();
        });
      }, t("addVoiceNote"));
    });
  }

  /* ------------------------------------------------------------ */
  /* Export / import                                               */
  /* ------------------------------------------------------------ */
  function doExport() {
    var blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "famille-cisse-tree.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function doImportFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try { parsed = JSON.parse(reader.result); } catch (e) { toast(t("importFailed")); return; }
      if (!parsed || !Array.isArray(parsed.people)) { toast(t("importFailed")); return; }
      if (!window.confirm(t("confirmImport"))) return;
      adapter.replaceAll(parsed).then(function () {
        toast(t("importDone"));
        state.view = "tree";
        refresh();
      }).catch(function (err) { toast(err.message || t("importFailed")); });
    };
    reader.readAsText(file);
  }

  /* ------------------------------------------------------------ */
  /* Global events + boot                                          */
  /* ------------------------------------------------------------ */
  document.addEventListener("click", function (e) {
    var target = e.target.closest("[data-action]");
    if (!target) return;
    var action = target.getAttribute("data-action");
    var id = target.getAttribute("data-id");
    switch (action) {
      case "backdrop":
        if (e.target === target) closeModal();
        break;
      case "close-modal": closeModal(); break;
      case "lang":
        state.lang = state.lang === "fr" ? "en" : "fr";
        localStorage.setItem("fc.lang", state.lang);
        render();
        break;
      case "nav":
        state.view = target.getAttribute("data-view");
        state.transform = { k: 1, x: 0, y: 0 };
        render();
        window.scrollTo(0, 0);
        break;
      case "set-name":
        state.contributor = "";
        ensureContributor(function () { render(); });
        break;
      case "add-person":
        ensureContributor(function () {
          openPersonForm({
            existing: null,
            onSaved: function (saved) {
              state.view = "profile"; state.selectedId = saved.id; refresh();
            }
          });
        });
        break;
      case "open-person":
        state.view = "profile";
        state.selectedId = id;
        render();
        window.scrollTo(0, 0);
        break;
      case "zoom-in": state.transform.k = Math.min(2.5, state.transform.k * 1.2); applyTransform(); break;
      case "zoom-out": state.transform.k = Math.max(0.25, state.transform.k / 1.2); applyTransform(); break;
      case "zoom-reset": state.transform = { k: 1, x: 0, y: 0 }; applyTransform(); break;
      case "print": window.print(); break;
      case "export": doExport(); break;
      case "import": document.getElementById("importInput").click(); break;
      case "add-relation": {
        var kind = target.getAttribute("data-kind");
        openRelationFlow(id, kind || null);
        break;
      }
      case "suggest": openSuggest(person(id)); break;
      case "voice-note": openVoiceNote(person(id)); break;
      case "add-trait": openTraitPicker(person(id)); break;
      case "trait-pick": {
        var pickedPerson = person(id);
        var pickKey = target.getAttribute("data-key");
        var ownPick = (state.data.traits || []).find(function (tr) {
          return tr.personId === id && tr.traitKey === pickKey &&
            tr.contributorName === state.contributor;
        });
        var pickOp = ownPick
          ? adapter.removeTrait(ownPick.id)
          : adapter.addTrait({ personId: id, traitKey: pickKey, contributorName: state.contributor });
        pickOp.then(function () { return refresh(); })
          .then(function () { if (pickedPerson) openTraitPicker(pickedPerson); });
        break;
      }
      case "trait-who": openTraitWho(person(id), target.getAttribute("data-key")); break;
      case "trait-remove": {
        var whoPerson = person(id);
        var whoKey = target.getAttribute("data-key");
        adapter.removeTrait(target.getAttribute("data-trait")).then(function () {
          return refresh();
        }).then(function () {
          var left = (state.data.traits || []).some(function (tr) {
            return tr.personId === id && tr.traitKey === whoKey;
          });
          if (left && whoPerson) openTraitWho(whoPerson, whoKey);
          else closeModal();
        });
        break;
      }
      case "traits-more":
        state.showAllTraitsFor = state.showAllTraitsFor === id ? null : id;
        render();
        break;
      case "passing": openPassing(person(id)); break;
      case "edit-person":
        openPersonForm({ existing: person(id), onSaved: function () { refresh(); } });
        break;
      case "delete-person":
        if (window.confirm(t("deleteConfirm"))) {
          adapter.deletePerson(id).then(function () {
            toast(t("deleted"));
            state.view = "people";
            refresh();
          });
        }
        break;
      case "delete-rel":
        adapter.deleteRelationship(target.getAttribute("data-rel")).then(function () { refresh(); });
        break;
      case "accept-sugg": {
        var sugg = state.data.suggestions.find(function (s) { return s.id === target.getAttribute("data-sugg"); });
        if (!sugg) break;
        var apply = sugg.proposed
          ? adapter.updatePerson(sugg.personId, sugg.proposed)
          : Promise.resolve();
        apply.then(function () {
          return adapter.updateSuggestion(sugg.id, { status: "accepted" });
        }).then(function () { toast(t("suggestionAccepted")); refresh(); });
        break;
      }
      case "dismiss-sugg":
        adapter.updateSuggestion(target.getAttribute("data-sugg"), { status: "dismissed" })
          .then(function () { toast(t("suggestionDismissed")); refresh(); });
        break;
    }
  });

  document.addEventListener("change", function (e) {
    var target = e.target.closest("[data-action-change]");
    if (!target) return;
    if (target.getAttribute("data-action-change") === "keeper") {
      state.keeper = target.checked;
      localStorage.setItem("fc.keeper", state.keeper ? "1" : "0");
      render();
    }
  });

  document.getElementById("importInput").addEventListener("change", function (e) {
    if (e.target.files && e.target.files[0]) doImportFile(e.target.files[0]);
    e.target.value = "";
  });

  refresh();
})();
