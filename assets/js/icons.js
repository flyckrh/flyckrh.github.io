/* ============================================================================
 * icons.js · 内联图标（全部为本站自绘的极简几何图形，无第三方素材）
 * 需要新图标时：在 ICONS 里加一条，键名与 content.js 里的 icon 字段对应即可。
 * ==========================================================================*/

(function () {
  "use strict";

  function wrap(body) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body +
      "</svg>"
    );
  }

  var ICONS = {
    github: wrap(
      '<circle cx="6.5" cy="6" r="2.4"/><circle cx="6.5" cy="18" r="2.4"/>' +
        '<path d="M6.5 8.4v7.2"/><path d="M8.9 6h5.6a3.5 3.5 0 0 1 3.5 3.5v1.2"/>' +
        '<circle cx="17.5" cy="14.5" r="2.4"/>'
    ),
    mail: wrap(
      '<rect x="2.6" y="5.2" width="18.8" height="13.6" rx="1.6"/>' +
        '<path d="M3.4 7l8.6 6 8.6-6"/>'
    ),
    orcid: wrap(
      '<circle cx="12" cy="12" r="9.2"/>' +
        '<path d="M9.2 8.4v7.2"/><circle cx="9.2" cy="6.6" r="0.7" fill="currentColor" stroke="none"/>' +
        '<path d="M13.2 8.4h1.9a3.6 3.6 0 0 1 0 7.2h-1.9z"/>'
    ),
    scholar: wrap(
      '<path d="M12 3.6l8.4 4.2-8.4 4.2L3.6 7.8z"/>' +
        '<path d="M6.4 10.6v4.6c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.6"/>' +
        '<path d="M19.6 8.4v5.2"/>'
    ),
    linkedin: wrap(
      '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="2.4"/>' +
        '<path d="M7.6 10.4v6.4"/><circle cx="7.6" cy="7.6" r="0.8" fill="currentColor" stroke="none"/>' +
        '<path d="M11.6 16.8v-6.4"/><path d="M11.6 12.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3v4.2"/>'
    ),
    zhihu: wrap(
      '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="2.4"/>' +
        '<path d="M7.4 8.6h6.2"/><path d="M10.5 6.4v9.4"/><path d="M8.2 12.4h4.6"/>' +
        '<path d="M14.6 15.4c1.6 0 2.4-.9 2.4-2.4"/>'
    ),
    bilibili: wrap(
      '<rect x="2.8" y="7.4" width="18.4" height="11.4" rx="2.4"/>' +
        '<path d="M6.6 4.6l3 2.8"/><path d="M17.4 4.6l-3 2.8"/>' +
        '<path d="M9 11.6v1.6"/><path d="M15 11.6v1.6"/>'
    ),
    x: wrap('<path d="M4.6 4.6l14.8 14.8"/><path d="M19.4 4.6L4.6 19.4"/>'),
    rss: wrap(
      '<circle cx="6.4" cy="17.6" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M5.2 11.4a7.4 7.4 0 0 1 7.4 7.4"/>' +
        '<path d="M5.2 5.6A13.2 13.2 0 0 1 18.4 18.8"/>'
    ),
    link: wrap(
      '<path d="M10 14a3.6 3.6 0 0 1 0-5.1l2.3-2.3a3.6 3.6 0 0 1 5.1 5.1l-1 1"/>' +
        '<path d="M14 10a3.6 3.6 0 0 1 0 5.1l-2.3 2.3a3.6 3.6 0 0 1-5.1-5.1l1-1"/>'
    ),
    note: wrap(
      '<rect x="4.4" y="3.6" width="15.2" height="16.8" rx="1.8"/>' +
        '<path d="M8 8.4h8"/><path d="M8 12h8"/><path d="M8 15.6h4.6"/>'
    ),
    music: wrap(
      '<circle cx="7" cy="17.4" r="2.6"/><circle cx="17.4" cy="15.6" r="2.6"/>' +
        '<path d="M9.6 17.4V6.6l10.4-2v11"/>'
    ),
    arrow: wrap('<path d="M5 12h13"/><path d="M13 7l5 5-5 5"/>')
  };

  window.SiteIcons = {
    get: function (name) {
      return ICONS[name] || ICONS.link;
    },
    markup: function (name) {
      return ICONS[name] || ICONS.link;
    }
  };
})();
