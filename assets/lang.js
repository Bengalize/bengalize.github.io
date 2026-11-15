/* bengalycisse.com — language toggle behavior + small page enhancements.
   The toggle itself is plain <a> links (works with JS off); this script only
   records the choice and applies the home-page entry rule from the spec. */
(function () {
  "use strict";
  var KEY = "bc.lang";

  /* Record the visitor's choice when they use the toggle. */
  document.querySelectorAll(".langtoggle a").forEach(function (a) {
    a.addEventListener("click", function () {
      try { localStorage.setItem(KEY, a.getAttribute("lang") === "fr" ? "fr" : "en"); } catch (e) {}
    });
  });

  /* Home entry rule: a saved FR choice (or a French browser on first visit)
     sends / to /fr/. Deep links are never redirected — a shared French link
     opens in French, a shared English link in English. */
  var path = location.pathname;
  if (path === "/" || path === "/index.html") {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var browserFr = (navigator.language || "").toLowerCase().indexOf("fr") === 0;
    if (saved === "fr" || (!saved && browserFr)) {
      location.replace("/fr/");
      return;
    }
  }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Animated counters in stat bands. */
  var counters = document.querySelectorAll("[data-count]");
  function fmt(el, v) {
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var loc = document.documentElement.lang === "fr" ? "fr-FR" : "en-US";
    return v.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (reduce || isNaN(target)) { el.textContent = fmt(el, target); return; }
    var t0 = null, dur = 1200;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* Reveal-on-scroll for .reveal blocks; counters fire when visible. */
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          if (en.target.hasAttribute("data-count")) runCounter(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    counters.forEach(function (el) { runCounter(el); });
  }
})();
