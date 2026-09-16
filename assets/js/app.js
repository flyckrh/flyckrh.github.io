/* ============================================================================
 * app.js · 启动装配：写入页面元信息，按顺序初始化各模块
 * 所有内容都来自 content.js，这里只负责把它们挂到界面上。
 * ==========================================================================*/

(function () {
  "use strict";

  var Core = window.Core;
  var CONTENT = Core.content;
  var $ = Core.$;

  /** 把 content.js 里的站点信息写进 <head>，并生成分享卡片与结构化数据 */
  function applyMeta() {
    var meta = CONTENT.meta || {};
    var identity = CONTENT.identity || {};

    if (meta.title) document.title = meta.title;
    var description = $('meta[name="description"]');
    if (description && meta.description) description.setAttribute("content", meta.description);
    var themeColor = $('meta[name="theme-color"]');
    if (themeColor && meta.themeColor) themeColor.setAttribute("content", meta.themeColor);

    var head = document.head;
    function property(name, content) {
      if (!content) return;
      var node = document.createElement("meta");
      node.setAttribute("property", name);
      node.setAttribute("content", content);
      head.appendChild(node);
    }
    property("og:type", "website");
    property("og:title", meta.title || identity.name);
    property("og:description", meta.description);
    property("og:url", meta.url);
    property("og:image", meta.ogImage);
    property("twitter:card", meta.ogImage ? "summary_large_image" : "summary");
    property("twitter:title", meta.title || identity.name);
    property("twitter:description", meta.description);

    if (meta.url) {
      var canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", meta.url);
      head.appendChild(canonical);
    }

    var data = document.createElement("script");
    data.type = "application/ld+json";
    data.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: identity.name,
      alternateName: identity.nameLocal || undefined,
      jobTitle: identity.role || undefined,
      affiliation: identity.affiliation ? { "@type": "Organization", name: identity.affiliation } : undefined,
      email: identity.email ? "mailto:" + identity.email : undefined,
      url: meta.url || undefined,
      sameAs: (CONTENT.links || [])
        .filter(function (link) {
          return /^https?:/i.test(link.href || "");
        })
        .map(function (link) {
          return link.href;
        })
    });
    head.appendChild(data);
  }

  function applyBrand() {
    var identity = CONTENT.identity || {};
    var name = $("#brand-name");
    if (name) name.textContent = identity.lettering || identity.name || "ARCHIVE TERMINAL";
    var serial = $("#brand-serial");
    if (serial && identity.serial) serial.textContent = identity.serial;
    var title = $('meta[name="apple-mobile-web-app-title"]');
    if (title) title.setAttribute("content", identity.name || "Archive Terminal");
  }

  function afterBoot() {
    var stage = $("#array-stage");
    if (stage && !location.hash) {
      try {
        stage.focus({ preventScroll: true });
      } catch (error) {
        /* 部分浏览器不支持 preventScroll，忽略 */
      }
    }
    if (location.hash && window.Archive) {
      var entry = null;
      (CONTENT.archives || []).forEach(function (item) {
        if ("#" + item.code === location.hash) entry = item;
      });
      if (entry) {
        window.Archive.open(entry);
        window.Hud.setView("array");
      }
    }
    Core.emit("site:ready");
  }

  function init() {
    applyMeta();
    applyBrand();

    Core.i18n.init();
    Core.syncFlag("tilt");
    Core.syncFlag("perf");
    Core.applyI18n(document);

    window.Theme.init();
    window.Hud.init();
    window.Archive.init();
    window.Workbench.init();
    window.Boot.init();

    Core.on("boot:done", afterBoot);

    if (window.Boot.shouldPlay()) window.Boot.play();
    else afterBoot();

    // 便于在控制台里检查状态
    window.Site = {
      content: CONTENT,
      core: Core,
      theme: window.Theme,
      archive: window.Archive,
      workbench: window.Workbench,
      version: "1.0.0"
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
