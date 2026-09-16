/* ============================================================================
 * archive.js · 玻璃档案阵列（纯 CSS 3D，无 WebGL）与档案详情
 * 面板排在一个圆柱面上：正面朝向镜头，越远越斜、越小、越淡并循环环绕。
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var CONTENT = Core.content;
  var el = Core.el;
  var $ = Core.$;

  var entries = CONTENT.archives || [];
  var setup = (CONTENT.appearance && CONTENT.appearance.array) || {};
  var RADIUS = setup.panelRadius || 620;
  var GAP = setup.panelGap || 17;
  var SIDE = setup.visibleSide || 5;

  var stage = null;
  var plate = null;
  var panels = [];
  var index = 0;          // 可为小数：拖动时连续变化
  var selectedIndex = 0;  // 最近的整数条目
  var dragging = false;
  var dragStartX = 0;
  var dragStartIndex = 0;
  var dragMoved = 0;
  var pressedPanel = null;
  var wheelAcc = 0;
  var readerReturnFocus = null;

  function t(key, vars) {
    return Core.i18n.t(key, vars);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  /** 把任意整数映射到 [-n/2, n/2)，用于判断环绕后的相对位置 */
  function shortest(offset, total) {
    var value = ((offset % total) + total) % total;
    if (value > total / 2) value -= total;
    return value;
  }

  /* ------------------------------------------------------------------ 面板 */

  function buildPanels() {
    // 只清掉旧面板，保留 stage 里的装饰元素（例如脚下那条台面线）
    Core.$$(".panel", stage).forEach(function (panel) {
      panel.remove();
    });
    panels = [];
    entries.forEach(function (entry, i) {
      var panel = el(
        "button",
        {
          type: "button",
          class: "panel",
          role: "option",
          "data-index": String(i),
          "aria-label": entry.code + " " + entry.title,
          "aria-selected": "false"
        },
        [
          el("span", { class: "panel__glass" }, [
            el("span", { class: "panel__code", text: entry.code }),
            el("span", { class: "panel__rule" }),
            el("span", { class: "panel__title", text: entry.title }),
            el("span", { class: "panel__cat", text: entry.category }),
            entry.pinned ? el("span", { class: "panel__pin", title: "pinned" }) : null
          ]),
          el("span", { class: "panel__plate" }, [
            el("span", { class: "panel__plate-index", text: pad(i + 1) }),
            el("span", { class: "panel__plate-name", text: entry.code })
          ])
        ]
      );
      panel.addEventListener("click", function (event) {
        // 键盘回车/空格触发的 click（detail 为 0）与拖动后的点击区分处理
        if (event.detail !== 0) return;
        activate(i);
      });
      stage.appendChild(panel);
      panels.push(panel);
    });
  }

  function layout(activeIndex) {
    var total = panels.length;
    if (!total) return;
    panels.forEach(function (panel, i) {
      var offset = shortest(i - activeIndex, total);
      var abs = Math.abs(offset);

      if (abs > SIDE + 0.6) {
        panel.style.setProperty("--o", "0");
        panel.style.visibility = "hidden";
        panel.setAttribute("aria-hidden", "true");
        panel.dataset.selected = "false";
        return;
      }

      var angle = offset * GAP;
      var radians = (angle * Math.PI) / 180;
      var x = Math.sin(radians) * RADIUS;
      var z = Math.cos(radians) * RADIUS - RADIUS;
      var scale = Math.max(0.58, 1 - abs * 0.055) * (abs < 0.5 ? 1.05 : 1);
      var opacity = Math.max(0, 1 - (abs / (SIDE + 1)) * 1.02);

      panel.style.visibility = "visible";
      panel.removeAttribute("aria-hidden");
      panel.style.setProperty("--tx", x.toFixed(2) + "px");
      panel.style.setProperty("--ty", (-abs * 3).toFixed(2) + "px");
      panel.style.setProperty("--tz", z.toFixed(2) + "px");
      panel.style.setProperty("--ry", angle.toFixed(2) + "deg");
      panel.style.setProperty("--scale", scale.toFixed(3));
      panel.style.setProperty("--o", opacity.toFixed(3));
      panel.style.zIndex = String(120 - Math.round(abs * 12));

      var selected = abs < 0.5;
      panel.dataset.selected = selected ? "true" : "false";
      panel.setAttribute("aria-selected", selected ? "true" : "false");
      panel.tabIndex = selected ? 0 : -1;
    });
  }

  /** 更新位置；caption 与事件按"最近的一条"触发 */
  function update(value, options) {
    var total = panels.length;
    if (!total) return;
    options = options || {};
    index = value;
    layout(index);

    var nearest = ((Math.round(index) % total) + total) % total;
    if (nearest !== selectedIndex || options.force) {
      selectedIndex = nearest;
      renderPlate(entries[nearest]);
      Core.emit("archive:index", { index: nearest, entry: entries[nearest] });
    }
  }

  function setIndex(value, options) {
    var total = panels.length;
    if (!total) return;
    options = options || {};
    var next = Number(value) || 0;
    // 选择最近的等价位置，避免绕远路
    next = Math.round(index) + shortest(next - Math.round(index), total);
    update(next, options);
  }

  function step(delta) {
    update(Math.round(index) + delta);
    wrap();
  }

  /** 把 index 收进 [0, n)，避免长时间拖动后数值过大 */
  function wrap() {
    var total = panels.length;
    if (!total) return;
    var rounded = Math.round(index);
    index = ((rounded % total) + total) % total;
    selectedIndex = index;
    layout(index);
  }

  function renderPlate(entry) {
    if (!plate || !entry) return;
    var i = entries.indexOf(entry);
    plate.innerHTML = "";
    plate.appendChild(
      el("span", { class: "plate__index", text: pad(i + 1) + " / " + pad(entries.length) })
    );
    plate.appendChild(el("h2", { class: "plate__title", text: entry.title }));
    plate.appendChild(
      el("p", {
        class: "plate__meta",
        text: [entry.category, entry.date, (entry.tags || []).join(" / ")].filter(Boolean).join("  ·  ")
      })
    );
  }

  /* ------------------------------------------------------------ 交互：拖动 */

  function panelStepPx() {
    var width = panels[0] ? panels[0].getBoundingClientRect().width : 160;
    return Math.max(60, width * 0.72);
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragging = true;
    dragMoved = 0;
    dragStartX = event.clientX;
    dragStartIndex = index;
    pressedPanel = event.target && event.target.closest ? event.target.closest(".panel") : null;
    stage.classList.add("is-dragging");
    if (stage.setPointerCapture) {
      try {
        stage.setPointerCapture(event.pointerId);
      } catch (error) {
        /* 某些浏览器在指针已释放时抛错，忽略 */
      }
    }
  }

  function onPointerMove(event) {
    if (!dragging) return;
    var delta = event.clientX - dragStartX;
    dragMoved = Math.max(dragMoved, Math.abs(delta));
    update(dragStartIndex - delta / panelStepPx());
  }

  function onPointerUp(event) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");

    var wasTap = dragMoved < 6;
    if (wasTap && pressedPanel) {
      var i = Number(pressedPanel.dataset.index);
      activate(i);
    } else {
      update(Math.round(index));
      wrap();
    }
    pressedPanel = null;
    if (wasTap) window.setTimeout(function () {
      dragMoved = 0;
    }, 0);
  }

  function activate(i) {
    var total = panels.length;
    if (!(i >= 0 && i < total)) return;
    var offset = shortest(i - index, total);
    if (Math.abs(offset) < 0.35) {
      open(entries[i]);
    } else {
      setIndex(i, { animate: true });
      if (window.SiteAudio) window.SiteAudio.play("step");
    }
  }

  function normalizeIndex() {
    var total = panels.length;
    if (!total) return;
    var rounded = ((Math.round(index) % total) + total) % total;
    if (rounded !== selectedIndex || index !== rounded) {
      index = rounded;
      selectedIndex = rounded;
      layout(index);
    }
  }

  /* ------------------------------------------------------- 交互：滚轮 / 键盘 */

  function onWheel(event) {
    var delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
    if (!delta) {
      if (!event.shiftKey) return; // 纵向滚动留给页面
      delta = event.deltaY;
    }
    event.preventDefault();
    wheelAcc += delta;
    if (Math.abs(wheelAcc) < 42) return;
    step(wheelAcc > 0 ? 1 : -1);
    wheelAcc = 0;
    if (window.SiteAudio) window.SiteAudio.play("tick");
  }

  function onKeyDown(event) {
    var handled = true;
    switch (event.key) {
      case "ArrowRight":
        step(1);
        break;
      case "ArrowLeft":
        step(-1);
        break;
      case "Home":
        setIndex(0);
        break;
      case "End":
        setIndex(entries.length - 1);
        break;
      case "Enter":
      case " ":
        open(entries[selectedIndex]);
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    if (handled && window.SiteAudio) window.SiteAudio.play("step");
  }

  /* --------------------------------------------------------------- 档案详情 */

  function renderBody(lines) {
    var host = $("#reader-body");
    if (!host) return;
    host.innerHTML = "";
    var list = null;
    (lines || []).forEach(function (raw) {
      var text = String(raw === null || raw === undefined ? "" : raw);
      var trimmed = text.trim();
      if (!trimmed) {
        list = null;
        return;
      }
      if (trimmed.indexOf("- ") === 0) {
        if (!list) {
          list = el("ul");
          host.appendChild(list);
        }
        list.appendChild(el("li", { text: trimmed.slice(2).trim() }));
        return;
      }
      list = null;
      if (trimmed.indexOf("> ") === 0) {
        host.appendChild(el("blockquote", { text: trimmed.slice(2).trim() }));
        return;
      }
      host.appendChild(el("p", { text: trimmed }));
    });
  }

  function renderMeta(entry) {
    var host = $("#reader-meta");
    if (!host) return;
    host.innerHTML = "";
    var i = entries.indexOf(entry);
    var rows = [
      [t("fields.code"), entry.code],
      [t("fields.category"), entry.category],
      [t("fields.date"), entry.date],
      [t("fields.tags"), (entry.tags || []).join(" / ")],
      [t("fields.index"), pad(i + 1) + " / " + pad(entries.length)]
    ];
    rows.forEach(function (row) {
      if (!row[1]) return;
      host.appendChild(el("div", null, [el("dt", { text: row[0] }), el("dd", { text: row[1] })]));
    });
  }

  function renderLinks(entry) {
    var host = $("#reader-links");
    if (!host) return;
    host.innerHTML = "";
    var links = entry.links || {};
    Object.keys(links).forEach(function (key) {
      if (!links[key]) return;
      host.appendChild(
        el("a", {
          class: "btn",
          href: links[key],
          target: "_blank",
          rel: "noopener",
          text: key.toUpperCase() + " ↗"
        })
      );
    });
  }

  function entryText(entry) {
    var i = entries.indexOf(entry);
    var lines = [
      (CONTENT.identity.name || "ARCHIVE TERMINAL") + " · ARCHIVE TERMINAL",
      "FILE " + entry.code + " / " + entry.title,
      entry.subtitle || "",
      "",
      t("fields.category") + "：" + (entry.category || ""),
      t("fields.date") + "：" + (entry.date || ""),
      t("fields.tags") + "：" + (entry.tags || []).join(" / "),
      t("fields.index") + "：" + pad(i + 1) + " / " + pad(entries.length),
      "",
      entry.summary || ""
    ];

    var body = (entry.body || []).filter(function (line) {
      return String(line || "").trim();
    });
    if (body.length) {
      lines.push("", Core.i18n.locale === "en" ? "Notes" : "正文");
      body.forEach(function (line) {
        var text = String(line).trim();
        if (text.indexOf("- ") === 0) lines.push("· " + text.slice(2).trim());
        else if (text.indexOf("> ") === 0) lines.push("> " + text.slice(2).trim());
        else lines.push(text);
      });
    }

    var links = entry.links || {};
    var keys = Object.keys(links).filter(function (key) {
      return links[key];
    });
    if (keys.length) {
      lines.push("", Core.i18n.locale === "en" ? "Links" : "相关链接");
      keys.forEach(function (key) {
        lines.push(key.toUpperCase() + "：" + links[key]);
      });
    }

    return lines.join("\n") + "\n";
  }

  function open(entry) {
    if (!entry) return;
    var reader = $("#reader");
    if (!reader) return;
    var i = entries.indexOf(entry);
    if (i >= 0) {
      selectedIndex = i;
      index = i;
      layout(index);
    }

    $("#reader-code").textContent = entry.code;
    $("#reader-title").textContent = entry.title;
    $("#reader-subtitle").textContent = [entry.subtitle, entry.summary]
      .filter(Boolean)
      .join(" — ");
    renderMeta(entry);
    renderBody(entry.body);
    renderLinks(entry);

    readerReturnFocus = document.activeElement;
    reader.hidden = false;
    window.requestAnimationFrame(function () {
      reader.dataset.open = "true";
    });
    document.body.classList.add("is-reading");
    var doc = $(".reader__doc");
    if (doc) doc.focus();

    if (history.replaceState) history.replaceState(null, "", "#" + entry.code);
    if (window.SiteAudio) window.SiteAudio.play("open");
  }

  function close() {
    var reader = $("#reader");
    if (!reader || reader.hidden) return;
    reader.dataset.open = "false";
    document.body.classList.remove("is-reading");
    window.setTimeout(function () {
      reader.hidden = true;
    }, 260);
    if (readerReturnFocus && readerReturnFocus.focus) readerReturnFocus.focus();
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    if (window.SiteAudio) window.SiteAudio.play("close");
  }

  function wireReader() {
    Core.$$("[data-reader-close]").forEach(function (node) {
      node.addEventListener("click", close);
    });
    Core.$$("[data-reader-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var entry = entries[selectedIndex];
        if (!entry) return;
        var action = button.dataset.readerAction;
        if (action === "copy") {
          var url = (CONTENT.meta.url || location.href.split("#")[0]) + "#" + entry.code;
          Core.copyText(url).then(function () {
            Core.toast(t("copied"));
          });
        } else if (action === "export") {
          Core.downloadText("ARCHIVE-" + entry.code + ".txt", entryText(entry));
          if (window.SiteAudio) window.SiteAudio.play("tick");
        } else if (action === "next") {
          var i = (selectedIndex + 1) % entries.length;
          setIndex(i, { animate: true });
          open(entries[i]);
        }
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  function hashIndex() {
    var hash = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!hash) return -1;
    for (var i = 0; i < entries.length; i += 1) {
      if (entries[i].code === hash) return i;
    }
    return -1;
  }

  /* ------------------------------------------------------------------ 启动 */

  window.Archive = {
    init: function () {
      stage = $("#array-stage");
      plate = $("#array-plate");
      if (!stage) return;

      buildPanels();
      layout(0);
      index = 0;
      selectedIndex = 0;
      renderPlate(entries[0]);
      Core.emit("archive:index", { index: 0, entry: entries[0] });

      var deep = hashIndex();
      if (deep >= 0) {
        setIndex(deep);
        wrap();
      }

      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointermove", onPointerMove);
      stage.addEventListener("pointerup", onPointerUp);
      stage.addEventListener("pointercancel", onPointerUp);
      stage.addEventListener("wheel", onWheel, { passive: false });
      stage.addEventListener("keydown", onKeyDown);
      window.addEventListener("hashchange", function () {
        var i = hashIndex();
        if (i >= 0) setIndex(i);
      });

      wireReader();
      window.addEventListener("resize", Core.rafThrottle(function () {
        layout(index);
      }));
      return entries.length;
    },
    setIndex: setIndex,
    step: step,
    current: function () {
      return entries[selectedIndex];
    },
    renderPlate: renderPlate,
    open: open,
    close: close,
    count: function () {
      return entries.length;
    },
    /** 语言切换后重新渲染铭牌与详情 */
    refresh: function () {
      renderPlate(entries[selectedIndex]);
      var reader = $("#reader");
      if (reader && !reader.hidden) {
        renderMeta(entries[selectedIndex]);
        renderBody(entries[selectedIndex].body);
        renderLinks(entries[selectedIndex]);
      }
    }
  };
})();
