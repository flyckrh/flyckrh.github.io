/* ============================================================================
 * theme.js · 亮色 / 暗色 / 按时间自动切换
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var APPEARANCE = Core.content.appearance || {};
  var SCHEDULE = APPEARANCE.autoTheme || {};
  var PREFS = ["auto", "light", "dark"];

  var pref = "auto";
  var resolved = "light";
  var timer = null;

  var systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function parseClock(value, fallback) {
    var match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return fallback;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function resolveAuto() {
    if (!SCHEDULE.enabled) {
      return systemQuery && systemQuery.matches ? "dark" : "light";
    }
    var now = new Date();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var darkAt = parseClock(SCHEDULE.darkAt, 19 * 60);
    var lightAt = parseClock(SCHEDULE.lightAt, 7 * 60);
    if (darkAt === lightAt) return "light";
    // 跨零点（例如 19:00 → 07:00）时的区间判断
    var isDark = darkAt > lightAt
      ? minutes >= darkAt || minutes < lightAt
      : minutes >= darkAt && minutes < lightAt;
    return isDark ? "dark" : "light";
  }

  function paint() {
    resolved = pref === "auto" ? resolveAuto() : pref;
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-pref", pref);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var color = getComputedStyle(root).getPropertyValue("--bg").trim();
      if (color) meta.setAttribute("content", color);
    }
    Core.emit("theme", { pref: pref, resolved: resolved });
  }

  function schedule() {
    window.clearInterval(timer);
    if (pref !== "auto" || !SCHEDULE.enabled) return;
    // 每分钟校验一次，跨过切换时刻时自动重绘
    timer = window.setInterval(paint, 60 * 1000);
  }

  function applyVisuals() {
    var root = document.documentElement.style;
    var grain = APPEARANCE.grain === undefined ? 0.35 : Number(APPEARANCE.grain);
    var vignette = APPEARANCE.vignette === undefined ? 0.45 : Number(APPEARANCE.vignette);
    var chroma = APPEARANCE.chromatic === undefined ? 0.18 : Number(APPEARANCE.chromatic);
    root.setProperty("--grain", String(isFinite(grain) ? grain : 0.35));
    root.setProperty("--vignette", String(isFinite(vignette) ? vignette : 0.45));
    root.setProperty("--chroma", String(isFinite(chroma) ? chroma : 0.18));

    // 高性能模式下压低部分质感
    Core.on("flag", function (detail) {
      if (detail.name !== "perf") return;
      root.setProperty("--vignette", detail.value ? "0.25" : String(vignette));
    });
  }

  var Theme = {
    get pref() {
      return pref;
    },
    get resolved() {
      return resolved;
    },
    isDark: function () {
      return resolved === "dark";
    },
    init: function () {
      applyVisuals();
      var stored = Core.store.get("theme", "auto");
      pref = PREFS.indexOf(stored) >= 0 ? stored : "auto";
      paint();
      schedule();
      if (systemQuery) {
        var listener = function () {
          if (pref === "auto" && !SCHEDULE.enabled) paint();
        };
        if (systemQuery.addEventListener) systemQuery.addEventListener("change", listener);
        else if (systemQuery.addListener) systemQuery.addListener(listener);
      }
      return pref;
    },
    set: function (next) {
      if (PREFS.indexOf(next) < 0) return;
      pref = next;
      Core.store.set("theme", next);
      paint();
      schedule();
    },
    cycle: function () {
      var index = PREFS.indexOf(pref);
      Theme.set(PREFS[(index + 1) % PREFS.length]);
      return pref;
    }
  };

  window.Theme = Theme;
})();
