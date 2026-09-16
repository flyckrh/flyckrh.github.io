/* ============================================================================
 * core.js · 公共工具：DOM、本地存储、事件总线、文案、开关
 * 这一层不需要为了更新内容而改动。
 * ==========================================================================*/

(function () {
  "use strict";

  var CONTENT = window.SITE_CONTENT || {};

  /* ------------------------------------------------------------- DOM 工具 */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key === "html") node.innerHTML = value;
        else if (key === "style" && typeof value === "object") {
          Object.keys(value).forEach(function (prop) {
            node.style.setProperty(prop, value[prop]);
          });
        } else if (key === "dataset" && typeof value === "object") {
          Object.keys(value).forEach(function (prop) {
            node.dataset[prop] = value[prop];
          });
        } else if (key.indexOf("on") === 0 && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          node.setAttribute(key, value === true ? "" : String(value));
        }
      });
    }
    append(node, children);
    return node;
  }

  function append(parent, children) {
    if (children === null || children === undefined || children === false) return parent;
    if (Array.isArray(children)) {
      children.forEach(function (child) {
        append(parent, child);
      });
    } else if (children instanceof Node) {
      parent.appendChild(children);
    } else {
      parent.appendChild(document.createTextNode(String(children)));
    }
    return parent;
  }

  function svg(markup) {
    var wrap = document.createElement("div");
    wrap.innerHTML = markup.trim();
    return wrap.firstElementChild;
  }

  /**
   * 按坐标找元素。个别渲染路径下浏览器会把点击派发给外层元素，
   * 这时用坐标自己判断，交互就不会因为"命中检测"失灵而失效。
   */
  function elementAtPoint(selector, x, y, root) {
    var nodes = $$(selector, root);
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      if (node.hidden) continue;
      var rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return node;
    }
    return null;
  }

  /**
   * 兜底点击：只有在浏览器**没有**派发 click 事件时才执行（等 160ms 判断）。
   * 个别渲染路径下命中检测会失灵、事件落到外层元素，这时用坐标补一次；
   * 正常情况浏览器会派发 click，兜底自动取消，不会重复触发。
   */
  function deferIfNoClick(handler, handled) {
    var timer = null;
    document.addEventListener(
      "click",
      function (event) {
        if (!timer) return;
        // 只有当这次点击确实落在目标控件上时才取消兜底；
        // 如果点击被派发到无关的外层元素，就继续用坐标兜底。
        var target = event.target;
        var isTarget = handled && target && target.closest ? !!handled(event) : true;
        if (!isTarget) return;
        window.clearTimeout(timer);
        timer = null;
      },
      true
    );
    document.addEventListener(
      "pointerup",
      function (event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
        var point = { x: event.clientX, y: event.clientY, target: event.target };
        timer = window.setTimeout(function () {
          timer = null;
          handler(point);
        }, 160);
      },
      true
    );
  }

  /* --------------------------------------------------------- 本地存储封装 */

  var PREFIX = "site.";

  var store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (error) {
        /* 隐私模式或存储已满时静默失败，站点仍可正常使用 */
      }
      return value;
    },
    remove: function (key) {
      try {
        window.localStorage.removeItem(PREFIX + key);
      } catch (error) {
        /* 同上 */
      }
    }
  };

  /* ------------------------------------------------------------- 事件总线 */

  var BUS = "site:";

  function on(name, handler) {
    document.addEventListener(BUS + name, function (event) {
      handler(event.detail);
    });
  }

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(BUS + name, { detail: detail }));
  }

  /* ------------------------------------------------------------ 系统偏好 */

  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function prefersReducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  /* ------------------------------------------------------------------ 文案 */

  var STRINGS = (CONTENT.i18n || {});
  var locale = null;
  var listeners = [];

  function readPath(object, path) {
    return path.split(".").reduce(function (acc, key) {
      if (acc && typeof acc === "object" && key in acc) return acc[key];
      return undefined;
    }, object);
  }

  var i18n = {
    available: function () {
      return Object.keys(STRINGS);
    },
    get locale() {
      return locale;
    },
    init: function () {
      var fallback = (CONTENT.appearance && CONTENT.appearance.defaultLocale) || "zh";
      var stored = store.get("locale", null);
      locale = STRINGS[stored] ? stored : STRINGS[fallback] ? fallback : Object.keys(STRINGS)[0];
      document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
      return locale;
    },
    set: function (next) {
      if (!STRINGS[next] || next === locale) return;
      locale = next;
      store.set("locale", next);
      document.documentElement.lang = next === "en" ? "en" : "zh-CN";
      apply(document);
      emit("locale", next);
    },
    next: function () {
      var keys = Object.keys(STRINGS);
      if (keys.length < 2) return;
      var index = keys.indexOf(locale);
      i18n.set(keys[(index + 1) % keys.length]);
    },
    t: function (key, vars) {
      var dict = STRINGS[locale] || {};
      var value = readPath(dict, key);
      if (value === undefined) value = readPath(STRINGS.zh || {}, key);
      if (value === undefined) return key;
      if (vars) {
        Object.keys(vars).forEach(function (name) {
          value = value.replace(new RegExp("\\{" + name + "\\}", "g"), vars[name]);
        });
      }
      return value;
    }
  };

  /** 把 [data-i18n] / [data-i18n-title] / [data-i18n-aria] 换成当前语言的文案 */
  function apply(root) {
    $$("[data-i18n]", root).forEach(function (node) {
      node.textContent = i18n.t(node.dataset.i18n);
    });
    $$("[data-i18n-title]", root).forEach(function (node) {
      node.title = i18n.t(node.dataset.i18nTitle);
    });
    $$("[data-i18n-aria]", root).forEach(function (node) {
      node.setAttribute("aria-label", i18n.t(node.dataset.i18nAria));
    });
  }

  /* ------------------------------------------------------------ 开关（标志位） */

  var FLAGS = {
    tilt: {
      attribute: "data-tilt",
      on: "on",
      off: "off",
      default: (CONTENT.appearance && CONTENT.appearance.allowTilt) !== false
    },
    perf: {
      attribute: "data-perf",
      on: "on",
      off: "off",
      default: !!(CONTENT.appearance && CONTENT.appearance.superPerformance)
    },
    sound: { attribute: null, default: true }
  };

  function getFlag(name) {
    var spec = FLAGS[name];
    if (!spec) return false;
    var value = store.get(name, spec.default);
    return value === true || value === "1" || value === 1;
  }

  function setFlag(name, value) {
    var spec = FLAGS[name];
    if (!spec) return;
    var on = !!value;
    store.set(name, on);
    if (spec.attribute) {
      document.documentElement.setAttribute(spec.attribute, on ? spec.on : spec.off);
    }
    emit("flag", { name: name, value: on });
    return on;
  }

  function syncFlag(name) {
    var spec = FLAGS[name];
    if (spec && spec.attribute) {
      document.documentElement.setAttribute(spec.attribute, getFlag(name) ? spec.on : spec.off);
    }
  }

  /* ------------------------------------------------------------- 日期与数字 */

  /** 支持 "2026-12-31" 与 "2026-12-31T23:59"，按本地时区解析 */
  function toDate(input) {
    if (input instanceof Date) return input;
    if (typeof input !== "string" || !input.trim()) return null;
    var match = input.trim().match(
      /^(\d{4})-(\d{2})(?:-(\d{2}))?(?:[T ](\d{2}):(\d{2}))?$/
    );
    if (!match) {
      var parsed = new Date(input);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      match[3] ? Number(match[3]) : 1,
      match[4] ? Number(match[4]) : 0,
      match[5] ? Number(match[5]) : 0
    );
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDate(input, localeOverride) {
    var date = toDate(input);
    if (!date) return input ? String(input) : "";
    var useEn = (localeOverride || locale) === "en";
    if (useEn) {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    return date.getFullYear() + " 年 " + (date.getMonth() + 1) + " 月 " + date.getDate() + " 日";
  }

  /** 复制文本，优先用剪贴板 API，失败时退回 execCommand */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var area = el("textarea", { style: { position: "fixed", opacity: "0" } });
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch (error) {
      /* 忽略：部分浏览器禁用同步复制 */
    }
    document.body.removeChild(area);
  }

  function downloadText(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = el("a", { href: url, download: filename });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function rafThrottle(fn) {
    var queued = false;
    var lastArgs = null;
    return function () {
      lastArgs = arguments;
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        fn.apply(null, lastArgs);
      });
    };
  }

  function toast(message) {
    var node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    window.clearTimeout(node._timer);
    window.requestAnimationFrame(function () {
      node.classList.add("is-on");
    });
    node._timer = window.setTimeout(function () {
      node.classList.remove("is-on");
      window.setTimeout(function () {
        node.hidden = true;
      }, 240);
    }, 1800);
  }

  window.Core = {
    content: CONTENT,
    $: $,
    $$: $$,
    el: el,
    append: append,
    svg: svg,
    elementAtPoint: elementAtPoint,
    deferIfNoClick: deferIfNoClick,
    store: store,
    on: on,
    emit: emit,
    i18n: i18n,
    applyI18n: apply,
    getFlag: getFlag,
    setFlag: setFlag,
    syncFlag: syncFlag,
    prefersReducedMotion: prefersReducedMotion,
    toDate: toDate,
    pad: pad,
    formatDate: formatDate,
    copyText: copyText,
    downloadText: downloadText,
    rafThrottle: rafThrottle,
    toast: toast
  };
})();
