/* countries.js — ISO 3166 alpha-2 country codes, flags, localized names.
   Names come from the browser's own Intl data, so nothing is downloaded
   and names always match the current UI language. */
(function (global) {
  "use strict";

  // Pinned first in every picker, per the family's geography.
  var PINNED = ["ML", "FR", "SN", "US", "CA"];

  var ALL = ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU " +
    "ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
    "NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ " +
    "TC TD TF TG TH TJ TK TL TM TN TO TR TT TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" ");

  function flag(code) {
    if (!code || code.length !== 2) return "";
    return String.fromCodePoint.apply(null,
      code.toUpperCase().split("").map(function (c) { return 127397 + c.charCodeAt(0); }));
  }

  var displayNamesCache = {};
  function name(code, lang) {
    if (!code) return "";
    try {
      var key = lang || "en";
      if (!displayNamesCache[key]) {
        displayNamesCache[key] = new Intl.DisplayNames([key], { type: "region" });
      }
      return displayNamesCache[key].of(code.toUpperCase()) || code;
    } catch (e) {
      return code;
    }
  }

  // City -> country inference used only for the v1 seed data (Bamako, Dakar).
  var CITY_COUNTRY = { "bamako": "ML", "dakar": "SN" };
  function countryForCity(city) {
    if (!city) return null;
    return CITY_COUNTRY[String(city).trim().toLowerCase()] || null;
  }

  // Approximate country centers [lat, lon] for the Globe view — just the
  // family's plausible geography (pinned five first), not an atlas.
  var COORDS = {
    ML: [17.6, -4.0], SN: [14.4, -14.5], FR: [46.6, 2.5], US: [39.8, -98.6], CA: [57.0, -101.0],
    GN: [9.9, -11.5], CI: [7.6, -5.6], MR: [19.0, -12.9], BF: [12.3, -1.7], NE: [16.6, 9.5],
    NG: [9.1, 8.7], CM: [5.7, 12.4], TD: [15.5, 18.7], MA: [31.8, -6.0], DZ: [28.0, 2.6],
    TN: [33.9, 9.6], GB: [53.5, -2.0], DE: [51.1, 10.4], BE: [50.5, 4.5], ES: [40.2, -3.6],
    IT: [42.8, 12.8], NL: [52.2, 5.3], CH: [46.8, 8.2], PT: [39.6, -8.0], LU: [49.8, 6.1],
    AT: [47.6, 14.1], SE: [62.0, 15.0], NO: [64.5, 11.5], IE: [53.2, -8.2]
  };
  function coords(code) {
    if (!code) return null;
    return COORDS[String(code).toUpperCase()] || null;
  }

  global.FC_COUNTRIES = {
    PINNED: PINNED,
    ALL: ALL,
    flag: flag,
    name: name,
    countryForCity: countryForCity,
    COORDS: COORDS,
    coords: coords
  };
})(typeof window !== "undefined" ? window : globalThis);
