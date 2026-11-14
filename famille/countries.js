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

  global.FC_COUNTRIES = {
    PINNED: PINNED,
    ALL: ALL,
    flag: flag,
    name: name,
    countryForCity: countryForCity
  };
})(typeof window !== "undefined" ? window : globalThis);
