/* ============================================================================
 * audio.js · 交互音效
 * 全部用 Web Audio 现场合成，不加载任何音频文件（没有版权素材，也更快）。
 * 浏览器要求先有用户操作才能出声，所以音频上下文是延迟创建的。
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var context = null;
  var master = null;
  var MASTER_VOLUME = 0.075;

  function ensure() {
    if (!Core.getFlag("sound")) return null;
    if (!context) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(context.destination);
    }
    if (context.state === "suspended") context.resume();
    return context;
  }

  /** 单个音：frequency 起始频率，slide 结束频率，duration 秒，type 波形 */
  function tone(options) {
    var ctx = ensure();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var filter = ctx.createBiquadFilter();

    osc.type = options.type || "triangle";
    osc.frequency.setValueAtTime(options.frequency, now);
    if (options.slide) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, options.slide),
        now + (options.duration || 0.09)
      );
    }

    filter.type = "lowpass";
    filter.frequency.value = options.cutoff || 4200;

    var peak = options.gain === undefined ? 1 : options.gain;
    var duration = options.duration || 0.09;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  var RECIPES = {
    tick: function () {
      tone({ frequency: 1180, slide: 900, duration: 0.035, gain: 0.5, type: "square", cutoff: 2600 });
    },
    step: function () {
      tone({ frequency: 520, slide: 760, duration: 0.1, gain: 0.8 });
    },
    open: function () {
      tone({ frequency: 380, slide: 720, duration: 0.16, gain: 0.9 });
      tone({ frequency: 720, slide: 1080, duration: 0.22, gain: 0.5, type: "sine" });
    },
    close: function () {
      tone({ frequency: 640, slide: 280, duration: 0.16, gain: 0.7 });
    },
    confirm: function () {
      tone({ frequency: 660, duration: 0.1, gain: 0.6, type: "sine" });
      window.setTimeout(function () {
        tone({ frequency: 990, duration: 0.16, gain: 0.55, type: "sine" });
      }, 70);
    },
    boot: function () {
      tone({ frequency: 180, slide: 300, duration: 0.5, gain: 0.5, type: "sine", cutoff: 1600 });
    }
  };

  window.SiteAudio = {
    play: function (name) {
      var recipe = RECIPES[name];
      if (!recipe) return;
      try {
        recipe();
      } catch (error) {
        /* 音频不可用时不影响任何功能 */
      }
    },
    setEnabled: function (on) {
      Core.setFlag("sound", on);
      if (!on && context && context.state === "running") context.suspend();
      if (on) {
        ensure();
        window.SiteAudio.play("confirm");
      }
    },
    get enabled() {
      return Core.getFlag("sound");
    }
  };
})();
