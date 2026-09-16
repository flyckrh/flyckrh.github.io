/* ============================================================================
 * workbench.js · 工作台：时钟 / 今日事项 / 专注计时 / 正在播放 / 重要日程
 * 数据全部在本地：事项与专注状态存在 localStorage，媒体信息读系统媒体会话。
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var CONTENT = Core.content;
  var el = Core.el;
  var $ = Core.$;

  var setup = CONTENT.workbench || {};
  var modules = setup.modules || {};
  var host = null;
  var clockTimer = null;
  var slowTimer = null;
  var mediaCache = "";

  var focus = {
    mode: "focus",
    running: false,
    started: false,
    remaining: 0,
    endsAt: 0,
    round: 1
  };

  function t(key, vars) {
    return Core.i18n.t(key, vars);
  }

  function on(name) {
    return !!(modules[name] && modules[name].enabled);
  }

  /* ------------------------------------------------------------------ 时钟 */

  function digitStrip() {
    var strip = el("span", { class: "clock__digit-strip" });
    for (var i = 0; i < 10; i += 1) strip.appendChild(el("b", { text: String(i) }));
    return strip;
  }

  function buildClock() {
    // 滚轮数字是 10 个数字叠在一起靠位移显示，读屏会念出全部数字，
    // 所以视觉部分标记为 aria-hidden，另给一个只读屏可见的真实时间。
    var time = el("div", { class: "clock__time", "aria-hidden": "true" });
    var digits = [];
    [0, 1].forEach(function () {
      var cell = el("span", { class: "clock__digit" }, digitStrip());
      digits.push(cell);
      time.appendChild(cell);
    });
    time.appendChild(el("span", { class: "clock__colon", text: ":" }));
    [0, 1].forEach(function () {
      var cell = el("span", { class: "clock__digit" }, digitStrip());
      digits.push(cell);
      time.appendChild(cell);
    });
    var seconds = el("span", { class: "clock__seconds", text: "00" });
    time.appendChild(seconds);
    var spoken = el("span", { class: "sr-only", role: "timer" });

    var date = el("div", { class: "clock__date" }, [
      el("strong", { class: "clock__date-main" }),
      el("span", { class: "clock__divider" }),
      el("span", { class: "clock__week" })
    ]);

    var card = el("article", { class: "module module--clock" }, [
      el("header", { class: "module__label" }, [
        el("span", { text: Core.i18n.locale === "en" ? "Local time" : "本地时间" }),
        el("span", { class: "module__badge", text: (CONTENT.identity && CONTENT.identity.serial) || "LOCAL" })
      ]),
      time,
      spoken,
      date
    ]);

    card._digits = digits;
    card._seconds = seconds;
    card._spoken = spoken;
    card._colon = time.querySelector(".clock__colon");
    card._dateMain = date.querySelector(".clock__date-main");
    card._week = date.querySelector(".clock__week");
    return card;
  }

  function tickClock(card) {
    if (!card || !card._digits) return;
    var now = new Date();
    var values = [
      Math.floor(now.getHours() / 10),
      now.getHours() % 10,
      Math.floor(now.getMinutes() / 10),
      now.getMinutes() % 10
    ];
    values.forEach(function (value, i) {
      var strip = card._digits[i].firstChild;
      var previous = Number(strip.dataset.value);
      if (previous === value) return;
      strip.dataset.value = String(value);
      strip.style.setProperty("--v", String(value));
    });
    card._seconds.textContent = Core.pad(now.getSeconds());
    card._colon.classList.toggle("is-on", now.getSeconds() % 2 === 0);
    card._spoken.textContent =
      Core.pad(now.getHours()) +
      ":" +
      Core.pad(now.getMinutes()) +
      (Core.i18n.locale === "en" ? "" : " 本地时间");

    if (!card._dateMain.dataset.day || card._dateMain.dataset.day !== String(now.getDate())) {
      card._dateMain.dataset.day = String(now.getDate());
      card._dateMain.textContent =
        Core.i18n.locale === "en"
          ? now.toLocaleDateString("en-US", { month: "long", day: "numeric" })
          : now.getMonth() + 1 + " 月 " + now.getDate() + " 日";
      card._week.textContent = now.toLocaleDateString(Core.i18n.locale === "en" ? "en-US" : "zh-CN", {
        weekday: "long"
      });
    }
  }

  /* -------------------------------------------------------------- 今日事项 */

  function taskState() {
    var config = setup.tasks || {};
    var key = config.storageKey || "tasks";
    var stored = Core.store.get("tasks:" + key, null);
    var items = config.items || [];
    if (!Array.isArray(stored) || stored.length !== items.length) {
      stored = items.map(function () {
        return false;
      });
    }
    return { key: key, items: items, done: stored };
  }

  function buildTasks() {
    var config = setup.tasks || {};
    var state = taskState();
    var list = el("div", { class: "tasks__list", role: "group" });

    if (!state.items.length) {
      list.appendChild(el("p", { class: "tasks__empty", text: t("tasksEmpty") }));
    }

    state.items.forEach(function (text, i) {
      var row = el(
        "button",
        {
          type: "button",
          class: "task",
          role: "checkbox",
          "aria-checked": state.done[i] ? "true" : "false"
        },
        [el("span", { class: "task__box" }), el("span", { class: "task__text", text: text })]
      );
      row.addEventListener("click", function () {
        var next = row.getAttribute("aria-checked") !== "true";
        row.setAttribute("aria-checked", next ? "true" : "false");
        state.done[i] = next;
        Core.store.set("tasks:" + state.key, state.done);
        syncTaskProgress(card);
        if (window.SiteAudio) window.SiteAudio.play("tick");
      });
      list.appendChild(row);
    });

    var count = el("span", { class: "module__badge tasks__count" });
    var bar = el("div", { class: "tasks__bar" }, el("span"));
    var card = el("article", { class: "module module--tasks" }, [
      el("header", { class: "module__label" }, [
        el("span", { text: config.title || t("tasksTitle") }),
        count
      ]),
      list,
      bar
    ]);
    card._count = count;
    card._bar = bar.firstChild;
    card._state = state;
    return card;
  }

  function syncTaskProgress(card) {
    if (!card || !card._state) return;
    var total = card._state.items.length;
    var done = card._state.done.filter(Boolean).length;
    card._count.textContent = done + " / " + total;
    card._bar.style.width = total ? Math.round((done / total) * 100) + "%" : "0%";
  }

  /* -------------------------------------------------------------- 专注计时 */

  function focusDuration(mode) {
    var config = setup.focus || {};
    var minutes = mode === "break" ? config.breakMinutes : config.focusMinutes;
    return Math.max(1, Number(minutes) || 25) * 60 * 1000;
  }

  function loadFocus() {
    var stored = Core.store.get("focus", null);
    if (stored && typeof stored === "object") {
      focus.mode = stored.mode === "break" ? "break" : "focus";
      focus.round = Number(stored.round) || 1;
      focus.remaining = Number(stored.remaining) || 0;
      focus.endsAt = Number(stored.endsAt) || 0;
      focus.running = !!stored.running;
      focus.started = !!stored.started || focus.running;
      if (focus.running && (!focus.endsAt || focus.endsAt - Date.now() > focusDuration(focus.mode))) {
        focus.running = false;
      }
    }
    if (!focus.remaining) focus.remaining = focusDuration(focus.mode);
  }

  function saveFocus() {
    Core.store.set("focus", {
      mode: focus.mode,
      round: focus.round,
      remaining: remainingMs(),
      endsAt: focus.running ? focus.endsAt : 0,
      running: focus.running,
      started: focus.started
    });
  }

  function remainingMs() {
    if (!focus.running) return focus.remaining;
    return Math.max(0, focus.endsAt - Date.now());
  }

  function buildFocus() {
    var config = setup.focus || {};
    var radius = 54;
    var circumference = 2 * Math.PI * radius;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    var track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    track.setAttribute("class", "focus__track");
    track.setAttribute("cx", "60");
    track.setAttribute("cy", "60");
    track.setAttribute("r", String(radius));
    var progress = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progress.setAttribute("class", "focus__progress");
    progress.setAttribute("cx", "60");
    progress.setAttribute("cy", "60");
    progress.setAttribute("r", String(radius));
    progress.setAttribute("stroke-dasharray", circuit(circumference));
    progress.setAttribute("stroke-dashoffset", String(circumference));
    svg.appendChild(track);
    svg.appendChild(progress);

    var readout = el("div", { class: "focus__readout" }, [
      el("span", { class: "focus__time", text: "00:00" }),
      el("span", { class: "focus__mode", text: "FOCUS" })
    ]);

    var start = el("button", { type: "button", class: "btn btn--solid", text: t("focusStart") });
    var reset = el("button", { type: "button", class: "btn", text: t("focusReset") });
    var status = el("span", { class: "focus__status", text: t("focusIdle") });
    var round = el("span", { class: "focus__round", text: t("focusRound", { n: focus.round }) });

    var panel = el("div", { class: "focus__panel" }, [
      status,
      round,
      el("div", { class: "focus__actions" }, [start, reset])
    ]);

    var card = el("article", { class: "module module--focus" }, [
      el("header", { class: "module__label" }, [
        el("span", { text: config.title || t("focusTitle") }),
        el("span", { class: "module__badge", text: (config.focusMinutes || 25) + " / " + (config.breakMinutes || 5) })
      ]),
      el("div", { class: "focus", "data-mode": focus.mode }, [
        el("div", { class: "focus__ring" }, [svg, readout]),
        panel
      ])
    ]);

    card._progress = progress;
    card._circle = circumference;
    card._readout = readout;
    card._time = readout.querySelector(".focus__time");
    card._mode = readout.querySelector(".focus__mode");
    card._status = status;
    card._round = round;
    card._start = start;
    card._wrapper = card.querySelector(".focus");

    start.addEventListener("click", function () {
      focus.running = !focus.running;
      if (focus.running) {
        focus.started = true;
        focus.endsAt = Date.now() + (focus.remaining || focusDuration(focus.mode));
      } else {
        focus.remaining = remainingMs();
      }
      saveFocus();
      renderFocus(card);
      if (window.SiteAudio) window.SiteAudio.play(focus.running ? "confirm" : "tick");
    });

    reset.addEventListener("click", function () {
      focus.running = false;
      focus.started = false;
      focus.remaining = focusDuration(focus.mode);
      saveFocus();
      renderFocus(card);
      if (window.SiteAudio) window.SiteAudio.play("close");
    });

    renderFocus(card);
    return card;
  }

  function circuit(value) {
    return String(value) + " " + String(value);
  }

  function renderFocus(card) {
    if (!card || !card._time) return;
    var left = remainingMs();
    var total = focusDuration(focus.mode);
    var seconds = Math.ceil(left / 1000);
    card._time.textContent = Core.pad(Math.floor(seconds / 60)) + ":" + Core.pad(seconds % 60);
    card._mode.textContent = focus.mode === "break" ? "BREAK" : "FOCUS";
    card._wrapper.dataset.mode = focus.mode;
    card._round.textContent = t("focusRound", { n: focus.round });
    card._start.textContent = focus.running ? t("focusPause") : t("focusStart");
    card._status.textContent = focus.running
      ? focus.mode === "break"
        ? t("focusBreaking")
        : t("focusRunning")
      : focus.mode === "break"
        ? t("focusBreak")
        : focus.started
          ? t("focusPaused")
          : t("focusIdle");

    var ratio = total ? Math.max(0, Math.min(1, 1 - left / total)) : 0;
    card._progress.setAttribute("stroke-dashoffset", String(card._circle * (1 - ratio)));
  }

  function tickFocus(card) {
    if (!card) return;
    if (focus.running && remainingMs() <= 0) {
      var config = setup.focus || {};
      if (focus.mode === "focus") {
        focus.round += 1;
        focus.mode = "break";
        focus.remaining = focusDuration("break");
        focus.running = config.autoSwitch !== false;
        focus.endsAt = focus.running ? Date.now() + focus.remaining : 0;
        Core.toast(t("focusBreak"));
      } else {
        focus.mode = "focus";
        focus.remaining = focusDuration("focus");
        focus.running = false;
        focus.endsAt = 0;
        Core.toast(t("focusTitle"));
      }
      if (window.SiteAudio) window.SiteAudio.play("confirm");
      saveFocus();
    }
    renderFocus(card);
  }

  /* -------------------------------------------------------------- 正在播放 */

  function buildMedia() {
    var config = setup.media || {};
    var art = el("div", { class: "media__art", html: window.SiteIcons.markup("music") });
    var title = el("span", { class: "media__title", text: config.placeholder || t("mediaIdle") });
    var artist = el("span", { class: "media__artist", text: "MEDIA SESSION" });
    var stateText = el("span", { text: "IDLE" });
    var state = el("span", { class: "media__state" }, [
      el("i", { class: "media__dot" }),
      stateText,
      el("span", { class: "media__bars" }, [el("i"), el("i"), el("i"), el("i")])
    ]);

    var row = el("div", { class: "media", "data-playing": "false" }, [
      art,
      el("div", { class: "media__info" }, [title, artist, state])
    ]);

    var card = el("article", { class: "module module--media" }, [
      el("header", { class: "module__label" }, [
        el("span", { text: t("mediaTitle") }),
        el("span", { class: "module__badge", text: "OS" })
      ]),
      row,
      config.showTimeline === false ? null : el("div", { class: "media__timeline" }, el("span"))
    ]);

    card._row = row;
    card._art = art;
    card._title = title;
    card._artist = artist;
    card._stateText = stateText;
    card._placeholder = config.placeholder || t("mediaIdle");
    return card;
  }

  function tickMedia(card) {
    if (!card || !navigator.mediaSession) return;
    var metadata = navigator.mediaSession.metadata;
    var signature =
      (metadata ? metadata.title + "|" + metadata.artist + "|" + (metadata.artwork && metadata.artwork.length ? metadata.artwork[metadata.artwork.length - 1].src : "") : "none") +
      "|" +
      (navigator.mediaSession.playbackState || "");
    if (signature === mediaCache) return;
    mediaCache = signature;

    var playing = navigator.mediaSession.playbackState === "playing";
    card._row.dataset.playing = playing ? "true" : "false";

    if (!metadata || (!metadata.title && !metadata.artist)) {
      card._title.textContent = card._placeholder;
      card._artist.textContent = "MEDIA SESSION";
      card._stateText.textContent = "IDLE";
      card._art.innerHTML = window.SiteIcons.markup("music");
      return;
    }

    card._title.textContent = metadata.title || card._placeholder;
    card._artist.textContent = metadata.artist || metadata.album || "MEDIA SESSION";
    card._stateText.textContent = playing ? t("mediaPlaying").toUpperCase() : t("mediaPaused").toUpperCase();

    var artwork = metadata.artwork && metadata.artwork.length ? metadata.artwork[metadata.artwork.length - 1].src : "";
    card._art.innerHTML = artwork ? '<img alt="" src="' + artwork + '" />' : window.SiteIcons.markup("music");
  }

  /* -------------------------------------------------------------- 重要日程 */

  function buildEvent() {
    var config = setup.event || {};
    var countdown = el("div", { class: "event__countdown" });
    var card = el("article", { class: "module module--event" }, [
      el("header", { class: "module__label" }, [
        el("span", { text: t("eventTitle") }),
        el("span", { class: "module__badge", text: "COUNTDOWN" })
      ]),
      el("p", { class: "event__name", text: config.name || "—" }),
      countdown,
      el("span", { class: "event__date", text: config.date || "" })
    ]);
    card._countdown = countdown;
    card._config = config;
    renderEvent(card);
    return card;
  }

  function renderEvent(card) {
    if (!card) return;
    var config = card._config || {};
    var target = Core.toDate(config.date);
    var host = card._countdown;
    host.innerHTML = "";

    if (!target) {
      host.appendChild(el("span", { class: "event__suffix", text: "—" }));
      return;
    }

    var diff = target.getTime() - Date.now();
    if (diff <= 0) {
      host.appendChild(el("span", { class: "event__num", text: config.passedLabel || t("eventNow") }));
      return;
    }

    var minutes = Math.floor(diff / 60000);
    var days = Math.floor(minutes / 1440);
    var hours = Math.floor((minutes % 1440) / 60);
    var rest = minutes % 60;
    [
      [days, t("eventDays")],
      [hours, t("eventHours")],
      [rest, t("eventMinutes")]
    ].forEach(function (pair) {
      host.appendChild(
        el("span", { class: "event__unit" }, [
          el("span", { class: "event__num", text: Core.pad(pair[0]) }),
          el("span", { class: "event__suffix", text: pair[1] })
        ])
      );
    });
  }

  /* ------------------------------------------------------------------ 装配 */

  var cards = {};

  function build() {
    if (!host) return;
    host.innerHTML = "";
    cards = {};

    if (on("clock")) {
      cards.clock = buildClock();
      host.appendChild(cards.clock);
      tickClock(cards.clock);
    }
    if (on("tasks")) {
      cards.tasks = buildTasks();
      host.appendChild(cards.tasks);
      syncTaskProgress(cards.tasks);
    }
    if (on("focus")) {
      cards.focus = buildFocus();
      host.appendChild(cards.focus);
    }
    if (on("media")) {
      cards.media = buildMedia();
      host.appendChild(cards.media);
    }
    if (on("event")) {
      cards.event = buildEvent();
      host.appendChild(cards.event);
    }
  }

  function startTimers() {
    stopTimers();
    clockTimer = window.setInterval(function () {
      if (document.hidden) return;
      tickClock(cards.clock);
    }, 250);
    slowTimer = window.setInterval(function () {
      if (document.hidden) return;
      tickFocus(cards.focus);
      tickMedia(cards.media);
      renderEvent(cards.event);
    }, 1000);
  }

  function stopTimers() {
    window.clearInterval(clockTimer);
    window.clearInterval(slowTimer);
    clockTimer = null;
    slowTimer = null;
  }

  window.Workbench = {
    init: function () {
      host = $("#modules");
      loadFocus();
      build();
      startTimers();
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stopTimers();
        else startTimers();
      });
      Core.on("view", function (view) {
        if (view === "workbench") startTimers();
      });
      return Object.keys(cards).length;
    },
    refresh: function () {
      build();
      saveFocus();
    },
    /** 供开场结束后重新对表 */
    sync: function () {
      tickClock(cards.clock);
      renderEvent(cards.event);
    },
    focus: focus
  };
})();
