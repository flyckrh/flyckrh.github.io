/* ============================================================================
 * boot.js · 开场序列（可跳过、可重播、尊重"减少动态"设置）
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var CONTENT = Core.content;
  var el = Core.el;
  var $ = Core.$;

  var config = CONTENT.boot || {};
  var timers = [];
  var playing = false;

  function clearTimers() {
    timers.forEach(function (id) {
      window.clearTimeout(id);
      window.clearInterval(id);
    });
    timers = [];
  }

  function fill() {
    var lettering = $("#boot-lettering");
    if (lettering) {
      lettering.textContent =
        config.lettering || (CONTENT.identity && CONTENT.identity.lettering) || "ARCHIVE TERMINAL";
    }

    var host = $("#boot-lines");
    if (!host) return [];
    host.innerHTML = "";
    var lines = config.lines || [];
    return lines.map(function (line) {
      var label = typeof line === "string" ? "LOG" : line.label || "LOG";
      var text = typeof line === "string" ? line : line.text || "";
      var node = el("div", { class: "boot__line" }, [
        el("b", { text: label }),
        el("span", { text: text })
      ]);
      host.appendChild(node);
      host.appendChild(document.createTextNode("\n"));
      return node;
    });
  }

  function finish(skipped) {
    if (!playing) return;
    playing = false;
    clearTimers();
    var boot = $("#boot");
    if (!boot) return;
    boot.classList.add("is-leaving");
    timers.push(
      window.setTimeout(function () {
        boot.hidden = true;
        boot.classList.remove("is-leaving");
        Core.store.set("bootPlayed", true);
        Core.emit("boot:done", { skipped: !!skipped });
      }, Core.prefersReducedMotion() ? 0 : 520)
    );
  }

  function play() {
    var boot = $("#boot");
    if (!boot) return;
    clearTimers();
    var lines = fill();
    var bar = $("#boot-bar");
    if (bar) bar.style.width = "0%";

    boot.hidden = false;
    boot.classList.remove("is-leaving");
    playing = true;

    if (window.SiteAudio) window.SiteAudio.play("boot");

    if (Core.prefersReducedMotion() || !lines.length) {
      lines.forEach(function (node) {
        node.classList.add("is-on");
      });
      if (bar) bar.style.width = "100%";
      finish(true);
      return;
    }

    var total = lines.length;
    var step = Math.max(220, Math.min(520, 1600 / total));
    lines.forEach(function (node, i) {
      timers.push(
        window.setTimeout(function () {
          node.classList.add("is-on");
          if (bar) bar.style.width = Math.round(((i + 1) / total) * 100) + "%";
          if (window.SiteAudio && i % 1 === 0) window.SiteAudio.play("tick");
        }, i * step)
      );
    });
    timers.push(
      window.setTimeout(function () {
        if (bar) bar.style.width = "100%";
      }, total * step)
    );
    timers.push(
      window.setTimeout(function () {
        finish(false);
      }, total * step + 620)
    );
  }

  function shouldPlay() {
    if (!config.enabled) return false;
    if (config.alwaysReplay) return true;
    return !Core.store.get("bootPlayed", false);
  }

  window.Boot = {
    init: function () {
      var boot = $("#boot");
      if (!boot) return false;

      boot.addEventListener("click", function (event) {
        if (event.target.closest("[data-boot-skip]")) {
          finish(true);
          return;
        }
        if (playing) finish(true);
      });

      document.addEventListener("keydown", function (event) {
        if (!playing) return;
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          finish(true);
        }
      });

      Core.on("boot:done", function () {
        if (window.Workbench) window.Workbench.sync();
      });
      return true;
    },
    play: play,
    shouldPlay: shouldPlay,
    skip: function () {
      finish(true);
    },
    isPlaying: function () {
      return playing;
    }
  };
})();
