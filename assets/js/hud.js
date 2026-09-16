/* ============================================================================
 * hud.js · 曲面 HUD：导航、索引图例、系统读数、页脚、控制条、联络视图
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var CONTENT = Core.content;
  var el = Core.el;
  var $ = Core.$;

  var VIEWS = ["array", "workbench", "links"];
  var current = "array";

  function t(key, vars) {
    return Core.i18n.t(key, vars);
  }

  function navLabel(item) {
    return Core.i18n.locale === "en" && item.labelEn ? item.labelEn : item.label;
  }

  /* ------------------------------------------------------------------ 导航 */

  function buildNav() {
    var list = $("#nav-list");
    if (!list) return;
    list.innerHTML = "";
    (CONTENT.nav || []).forEach(function (item, index) {
      var button = el(
        "button",
        {
          type: "button",
          class: "nav__btn",
          "data-view": item.id,
          "aria-current": item.id === current ? "true" : "false"
        },
        [
          el("span", { class: "nav__index", text: "0" + (index + 1) }),
          el("span", { class: "nav__label", text: navLabel(item) })
        ]
      );
      button.addEventListener("click", function () {
        window.Hud.setView(item.id);
      });
      list.appendChild(el("li", { class: "nav__item" }, button));
    });
  }

  function setView(id) {
    if (VIEWS.indexOf(id) < 0) id = "array";
    current = id;
    document.documentElement.setAttribute("data-view", id);

    VIEWS.forEach(function (view) {
      var section = $("#view-" + (view === "links" ? "contact" : view));
      if (!section) return;
      var active = view === id;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
      if (active) {
        // 重新触发入场动画
        section.style.animation = "none";
        void section.offsetWidth;
        section.style.animation = "";
      }
    });

    Core.$$(".nav__btn").forEach(function (button) {
      button.setAttribute("aria-current", button.dataset.view === id ? "true" : "false");
    });

    Core.emit("view", id);
  }

  /* --------------------------------------------------------------- 索引图例 */

  function categoryCounts() {
    var counts = [];
    (CONTENT.archives || []).forEach(function (entry) {
      var found = counts.filter(function (item) {
        return item.name === entry.category;
      })[0];
      if (found) found.count += 1;
      else counts.push({ name: entry.category, count: 1, first: entry });
    });
    return counts;
  }

  function buildLegend() {
    var host = $("#rail-legend");
    if (!host) return;
    host.innerHTML = "";
    categoryCounts().forEach(function (item) {
      var row = el("button", { type: "button", class: "legend__item", "data-category": item.name }, [
        el("span", { class: "legend__dot" }),
        el("span", { class: "legend__name", text: item.name }),
        el("span", { class: "legend__count", text: String(item.count).padStart(2, "0") })
      ]);
      row.addEventListener("click", function () {
        var index = (CONTENT.archives || []).indexOf(item.first);
        if (index < 0) return;
        window.Hud.setView("array");
        window.Archive.setIndex(index, { animate: true });
        if (window.SiteAudio) window.SiteAudio.play("step");
      });
      host.appendChild(row);
    });
  }

  function syncLegend(category) {
    Core.$$(".legend__item").forEach(function (row) {
      row.dataset.active = row.dataset.category === category ? "true" : "false";
    });
  }

  /* ------------------------------------------------------------------ 读数 */

  function buildReadouts() {
    var host = $("#readouts");
    if (!host) return;
    host.innerHTML = "";
    [
      ["total", function () {
        return String((CONTENT.archives || []).length).padStart(2, "0");
      }],
      ["index", function () {
        var entry = window.Archive && window.Archive.current();
        return entry ? entry.code : "--";
      }],
      ["categories", function () {
        return String(categoryCounts().length).padStart(2, "0");
      }],
      ["theme", function () {
        return window.Theme.resolved === "dark" ? "DARK" : "LIGHT";
      }],
      ["mode", function () {
        return Core.getFlag("perf") ? "PERF" : Core.getFlag("tilt") ? "3D" : "FLAT";
      }]
    ].forEach(function (item) {
      host.appendChild(el("dt", { text: labelize(item[0]) }));
      host.appendChild(el("dd", { "data-readout": item[0], text: item[1]() }));
    });
  }

  function labelize(key) {
    var names = {
      total: Core.i18n.locale === "en" ? "Archives" : "档案总数",
      index: Core.i18n.locale === "en" ? "Current" : "当前位置",
      categories: Core.i18n.locale === "en" ? "Categories" : "分类数量",
      theme: Core.i18n.locale === "en" ? "Theme" : "当前配色",
      mode: Core.i18n.locale === "en" ? "Render" : "画面模式"
    };
    return names[key] || key;
  }

  function refreshReadouts() {
    var archive = window.Archive;
    var values = {
      total: String((CONTENT.archives || []).length).padStart(2, "0"),
      index: archive && archive.current() ? archive.current().code : "--",
      categories: String(categoryCounts().length).padStart(2, "0"),
      theme: window.Theme.resolved === "dark" ? "DARK" : "LIGHT",
      mode: Core.getFlag("perf") ? "PERF" : Core.getFlag("tilt") ? "3D" : "FLAT"
    };
    Object.keys(values).forEach(function (key) {
      var node = document.querySelector('[data-readout="' + key + '"]');
      if (node) node.textContent = values[key];
    });
  }

  /* ------------------------------------------------------------------ 页脚 */

  function buildFooter() {
    var identity = CONTENT.identity || {};
    var session = $("#footer-session");
    var log = $("#footer-log");
    var note = $("#footer-note");

    if (session) {
      session.innerHTML = "";
      session.appendChild(document.createTextNode(t("session") + " "));
      session.appendChild(el("strong", { text: identity.name || "—" }));
      if (identity.nameLocal) {
        session.appendChild(document.createTextNode(" · " + identity.nameLocal));
      }
    }
    if (log) {
      var now = new Date();
      log.textContent =
        (identity.accessNote || "SESSION ESTABLISHED") +
        " / " +
        now.getFullYear() +
        "." +
        Core.pad(now.getMonth() + 1) +
        "." +
        Core.pad(now.getDate()) +
        " " +
        Core.pad(now.getHours()) +
        ":" +
        Core.pad(now.getMinutes());
    }
    if (note) {
      note.textContent = identity.role ? identity.role + " · " + t("poweredBy") : t("poweredBy");
    }
  }

  /* --------------------------------------------------------------- 联络视图 */

  function buildContact() {
    var host = $("#contact");
    if (!host) return;
    host.innerHTML = "";

    var identity = CONTENT.identity || {};
    host.appendChild(
      el("div", { class: "contact__head" }, [
        el("h2", { class: "contact__title", text: t("contactTitle") }),
        el("p", { class: "contact__hint", text: t("contactHint") })
      ])
    );

    var lead = el("div", { class: "contact__card contact__card--lead" }, [
      el("span", { class: "contact__icon", html: identity.avatar
        ? '<img src="' + identity.avatar + '" alt="" />'
        : '<b class="contact__initials">' + initials(identity.name) + "</b>" }),
      el("span", { class: "contact__text" }, [
        el("span", { class: "contact__label", text: identity.name || "" }),
        el("span", { class: "contact__value", text: [identity.role, identity.affiliation, identity.location].filter(Boolean).join(" · ") })
      ])
    ]);
    host.appendChild(lead);

    (CONTENT.links || []).forEach(function (link) {
      var isMail = /^mailto:/i.test(link.href || "");
      var card = el("a", {
        class: "contact__card",
        href: link.href,
        target: isMail ? null : "_blank",
        rel: isMail ? null : "noopener"
      }, [
        el("span", { class: "contact__icon", html: window.SiteIcons.markup(link.icon) }),
        el("span", { class: "contact__text" }, [
          el("span", { class: "contact__label", text: link.label }),
          el("span", { class: "contact__value", text: prettyLink(link.href) })
        ])
      ]);
      card.addEventListener("click", function () {
        if (window.SiteAudio) window.SiteAudio.play("tick");
      });
      host.appendChild(card);
    });
  }

  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function prettyLink(href) {
    return String(href || "")
      .replace(/^mailto:/i, "")
      .replace(/^https?:\/\//i, "")
      .replace(/\/$/, "");
  }

  /* --------------------------------------------------------------- 控制条 */

  var THEME_LABELS = ["themeAuto", "themeLight", "themeDark"];

  function syncControls() {
    var themeValue = $("#ctl-theme-val");
    if (themeValue) {
      themeValue.textContent = t(THEME_LABELS[["auto", "light", "dark"].indexOf(window.Theme.pref)]);
    }
    var localeValue = $("#ctl-locale-val");
    if (localeValue) localeValue.textContent = Core.i18n.locale === "en" ? "EN" : "中";

    [["tilt", "tilt"], ["sound", "sound"], ["perf", "perf"]].forEach(function (pair) {
      var button = document.querySelector('[data-ctl="' + pair[0] + '"]');
      var value = $("#ctl-" + pair[0] + "-val");
      var on = Core.getFlag(pair[0]);
      if (button) button.setAttribute("aria-pressed", on ? "true" : "false");
      if (value) value.textContent = on ? t("on") : t("off");
    });

    var themeButton = document.querySelector('[data-ctl="theme"]');
    if (themeButton) themeButton.setAttribute("aria-pressed", window.Theme.pref === "dark" ? "true" : "false");

    var localeButton = document.querySelector('[data-ctl="locale"]');
    if (localeButton && !CONTENT.appearance.allowLocaleSwitch) localeButton.hidden = true;
    if (themeButton && !CONTENT.appearance.allowThemeSwitch) themeButton.hidden = true;
  }

  function wireControls() {
    var themeButton = document.querySelector('[data-ctl="theme"]');
    if (themeButton) {
      themeButton.addEventListener("click", function () {
        window.Theme.cycle();
        if (window.SiteAudio) window.SiteAudio.play("tick");
      });
    }
    var localeButton = document.querySelector('[data-ctl="locale"]');
    if (localeButton) {
      localeButton.addEventListener("click", function () {
        Core.i18n.next();
        if (window.SiteAudio) window.SiteAudio.play("tick");
      });
    }
    [["tilt", "step"], ["sound", "tick"], ["perf", "step"]].forEach(function (pair) {
      var button = document.querySelector('[data-ctl="' + pair[0] + '"]');
      if (!button) return;
      button.addEventListener("click", function () {
        var next = !Core.getFlag(pair[0]);
        if (pair[0] === "sound") {
          window.SiteAudio.setEnabled(next);
        } else {
          Core.setFlag(pair[0], next);
          if (window.SiteAudio) window.SiteAudio.play(pair[1]);
        }
      });
    });
    var replay = document.querySelector('[data-ctl="replay"]');
    if (replay) {
      replay.addEventListener("click", function () {
        window.Boot.play();
      });
    }
  }

  /* ------------------------------------------------------------ 鼠标视差 */

  function wireParallax() {
    if (Core.prefersReducedMotion()) return;
    var root = document.documentElement;
    var apply = Core.rafThrottle(function (x, y) {
      root.style.setProperty("--mx", x.toFixed(3));
      root.style.setProperty("--my", y.toFixed(3));
    });
    window.addEventListener(
      "pointermove",
      function (event) {
        if (!Core.getFlag("tilt")) return;
        var x = (event.clientX / window.innerWidth) * 2 - 1;
        var y = (event.clientY / window.innerHeight) * 2 - 1;
        apply(x, y);
      },
      { passive: true }
    );
    window.addEventListener("pointerleave", function () {
      apply(0, 0);
    });
  }

  /* ------------------------------------------------------------------ 启动 */

  function refreshAll() {
    Core.applyI18n(document);
    buildNav();
    buildLegend();
    buildReadouts();
    buildFooter();
    buildContact();
    syncControls();
    var entry = window.Archive && window.Archive.current();
    if (entry) {
      syncLegend(entry.category);
      window.Archive.renderPlate(entry);
    }
  }

  window.Hud = {
    init: function () {
      refreshAll();
      wireControls();
      wireParallax();
      setView("array");

      Core.on("archive:index", function (detail) {
        if (!detail || !detail.entry) return;
        syncLegend(detail.entry.category);
        refreshReadouts();
      });
      Core.on("theme", function () {
        refreshReadouts();
        syncControls();
      });
      Core.on("flag", function () {
        refreshReadouts();
        syncControls();
      });
      Core.on("locale", function () {
        refreshAll();
        if (window.Workbench) window.Workbench.refresh();
      });
      return current;
    },
    setView: setView,
    getView: function () {
      return current;
    },
    refreshReadouts: refreshReadouts,
    syncLegend: syncLegend
  };
})();
