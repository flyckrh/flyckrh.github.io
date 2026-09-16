/* ============================================================================
 * content.js  ·  你唯一需要长期维护的文件
 * ----------------------------------------------------------------------------
 * 这个站点的所有文字、项目、链接、配色、开关都集中在这里。
 * 改完保存、刷新页面即可看到效果；推到 GitHub 后线上同样生效。
 *
 * 快速上手：
 *   1. 改 identity 里的姓名、身份、邮箱、社交链接。
 *   2. 改 archives 里的示例条目，换成你自己的项目 / 论文 / 作品。
 *      条目会按你写的顺序从左到右排列，第一条默认被选中。
 *   3. 改 workbench 里的今日事项、专注时长、重要日程。
 *   4. 想加新条目又不熟悉语法：在项目根目录运行
 *        node scripts/add-archive.mjs
 *      它会把模板插入到下面的 ARCHIVES:START 标记后面（不会动其他内容）。
 *
 * 字段说明写在每个小节里；不确定的字段可以整行删掉，站点会自动用默认值。
 * ==========================================================================*/

window.SITE_CONTENT = {
  /* ------------------------------------------------------------------
   * 站点元信息：浏览器标签、分享卡片、搜索引擎用
   * ----------------------------------------------------------------*/
  meta: {
    // 你的线上地址。绑定自定义域名后请一起改掉，分享卡片才会正确显示。
    url: "https://flyckrh.github.io/",
    title: " 漆致远 · ARCHIVE TERMINAL",
    description: "个人档案终端：项目、论文与作品的可交互索引。",
    themeColor: "#e8e5e1",
    // 分享卡片图片，建议 1200×630。留空则用页面主色。
    ogImage: ""
  },

  /* ------------------------------------------------------------------
   * 身份信息：出现在开场、页眉字标、页脚与访问记录
   * ----------------------------------------------------------------*/
  identity: {
    name: "FLY ckrh",          // 英文 / 拼音姓名，开场与页脚使用
    nameLocal: "漆致远",       // 中文名，可留空
    role: "Researcher · Student",
    affiliation: "Nanjing University",
    location: "Somewhere, Earth",
    email: "634295785@qq.com",
    // 头像或照片，放 assets/img/ 下。留空则显示姓名首字母方块。
    avatar: "",
    // 页眉左下角的竖排字标（会用你填的字符串自动排版，建议 4–12 个字符）
    lettering: "DONT SAY MY NAME",
    // 页眉右上角的编号，纯装饰
    serial: "AR-01-2026",
    // 访问记录里显示的一行说明
    accessNote: "SESSION ESTABLISHED"
  },

  /* ------------------------------------------------------------------
   * 外部链接：底部导航 / 联系入口。icon 可选：
   * github | mail | orcid | scholar | linkedin | zhihu | bilibili | x | rss | link
   * ----------------------------------------------------------------*/
  links: [
    { label: "GitHub", href: "https://github.com/flyckrh/", icon: "github" },
    { label: "Email", href: "mailto:634295785@qq.com", icon: "mail" },
    { label: "Steam", href: "https://steamcommunity.com/profiles/76561198798288461/", icon: "link" },
    { label: "Bilibili", href: "https://space.bilibili.com/9668910", icon: "bilibili" },
  ],

  /* ------------------------------------------------------------------
   * 导航：顶部左侧的功能入口。id 必须是 array | workbench | links
   * ----------------------------------------------------------------*/
  nav: [
    { id: "array", label: "档案阵列", labelEn: "Archive array" },
    { id: "workbench", label: "工作台", labelEn: "Workspace" },
    { id: "links", label: "联络", labelEn: "Contact" }
  ],

  /* ------------------------------------------------------------------
   * 档案条目 = 你的项目 / 论文 / 作品 / 经历。想加几条就加几条。
   *
   * code      左上角编号，短、唯一，例如 "P-01" / "PAPER-2026"
   * title     标题
   * subtitle  副标题 / 期刊会议 / 技术栈
   * category  分类，用于右侧图例；建议 3–5 个分类
   * date      日期，写 "2026-05" 或 "2026-05-18"
   * summary   一句话摘要，显示在标题下方
   * body      正文段落数组，支持 Markdown 式的 "- " 列表行与 "> " 引用行
   * tags      标签数组
   * links     相关链接，键名随意（repo / demo / paper / pdf ...），值为网址
   * pinned    true 表示置顶，会在图例中标出
   * ----------------------------------------------------------------*/
  archives: [
    /* ARCHIVES:START */
    {
      code: "P-01",
      title: "总书记关心的人类非遗｜昆腔婉转韵悠长",
      subtitle: "新华社 / 视频报道 · 个人项目",
      category: "项目",
      date: "2026-09",
      summary: "昆剧的传承确实十分困难。",
      body: [
        "第一次的外勤工作，前往苏州昆剧院",
      ],
      tags: ["news", "KUN"],
      links: { video: "https://h.xinhuaxmt.com/vh512/share/13149661?docid=13149661&newstype=1001&d=1352706" },
      pinned: true
    },
    {
      code: "PAPER-02",
      title: "“七一勋章”获得者｜赵亚夫：为农民服务到老",
      subtitle: "News / July, 2026",
      category: "新闻",
      date: "2026-0607",
      summary: "最热的日子，在宿迁的田间地头",
      body: [
        "结果北京方面不让我的名字上去，毕竟我只是个实习生",
      ],
      tags: ["空悲切"],
      links: { video: "https://h.xinhuaxmt.com/vh512/share/13184767?docid=13184767&newstype=1001&d=1352763" }
    },
    {
      code: "W-03",
      title: "江苏南京：高温天里的“10元清凉午餐”",
      subtitle: "独立创作",
      category: "作品",
      date: "2026-07",
      summary: "第一次独立完成作品，从选题到最终的发布",
      body: ["其实真的很实惠，来到现场的还有很多建筑工人。"],
      tags: ["news"],
      links: { video: "https://h.xinhuaxmt.com/vh512/share/13221936?docid=13221936&newstype=1001&d=135277b" }
    },
    {
      code: "N-04",
      title: "占位符",
      subtitle: "持续更新",
      category: "笔记",
      date: "2026-01",
      summary: "暂无",
      body: [
        "你可以把这份档案当成一个小型博客条目；也可以把正文换成一段清单。",
      ],
      tags: ["笔记"],
      links: {}
    },
    {
      code: "X-05",
      title: "暂无",
      subtitle: "Institution, 2025",
      category: "经历",
      date: "2025-07",
      summary: "时间、角色、产出。",
      body: ["负责什么、用了什么方法、结果如何。"],
      tags: ["经历"],
      links: {}
    }
    /* ARCHIVES:END */
  ],

  /* ------------------------------------------------------------------
   * 工作台：时间、今日事项、专注计时、正在播放、重要日程
   * 每个模块都可以用 enabled: false 关掉
   * ----------------------------------------------------------------*/
  workbench: {
    modules: {
      clock: { enabled: true },
      tasks: { enabled: true },
      focus: { enabled: true },
      media: { enabled: true },
      event: { enabled: true }
    },
    // 今日事项：最多建议 3 条；勾选状态保存在浏览器本地
    tasks: {
      enabled: true,
      title: "今日事项",
      // 留空数组则隐藏列表，只显示提示文字
      items: [
        "never show fear no matter the odds",
        "Audentes fortuna iuvat",
        "Time for an adventure+"
      ],
      storageKey: "tasks-2026-09-17"
    },
    focus: {
      enabled: true,
      focusMinutes: 25,
      breakMinutes: 5,
      // 一轮专注结束后是否自动切到休息
      autoSwitch: true
    },
    // 正在播放：读取浏览器 / 系统媒体会话（Spotify、Apple Music、浏览器播放器…）
    media: {
      enabled: true,
      // 没有媒体会话时显示的占位文字
      placeholder: "未检测到媒体会话",
      // 显示进度条（浏览器不提供读取播放进度时，只有状态点会动）
      showTimeline: true
    },
    event: {
      enabled: true,
      name: "重要日程名称",
      // 目标时间，本地时区，格式 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm
      date: "2026-12-31",
      // 过期后显示的下一条回退文案
      passedLabel: "已完成"
    }
  },

  /* ------------------------------------------------------------------
   * 外观与交互
   * ----------------------------------------------------------------*/
  appearance: {
    defaultTheme: "light",        // light | dark
    defaultLocale: "zh",          // zh | en（界面文案，不影响你写的档案内容）
    allowThemeSwitch: true,       // 是否显示明暗切换按钮
    allowLocaleSwitch: true,      // 是否显示中英切换按钮
    allowTilt: true,              // 是否允许 HUD 3D 曲面视差（按钮可开关）
    autoTheme: {
      enabled: true,              // 按时间自动切换明暗
      darkAt: "19:00",
      lightAt: "07:00"
    },
    // 画面质感，0 表示关闭
    grain: 0.35,
    vignette: 0.45,
    chromatic: 0.18,
    // 静止时的轻微呼吸感
    idleDrift: true,
    // 默认是否开启高性能模式（关闭毛玻璃与颗粒，适合低配设备）
    superPerformance: false,
    // 阵列参数：自动按屏幕宽度调整，一般不用改
    array: {
      panelRadius: 620,   // 阵列半径（px），越大越平缓
      panelGap: 17,       // 相邻面板夹角（度）
      visibleSide: 5      // 左右各显示几块面板
    }
  },

  /* ------------------------------------------------------------------
   * 开场序列。enabled: false 可跳过；用户按 Esc / 点击也能跳过。
   * lines 支持 {label, text} 或纯字符串
   * ----------------------------------------------------------------*/
  boot: {
    enabled: true,
    // 每次加载都播放；设为 false 则同一浏览器只播放一次
    alwaysReplay: true,
    lettering: "ARCHIVE TERMINAL",
    lines: [
      { label: "INIT", text: "载入档案终端核心模块 ..." },
      { label: "AUTH", text: "校验访问凭据 ..." },
      { label: "SYNC", text: "同步档案索引 / ARCHIVE INDEX" },
      { label: "OK", text: "访问已授权，正在展开阵列" }
    ]
  },

  /* ------------------------------------------------------------------
   * 界面文案。改这里可以换语言、改措辞；你的档案内容不受影响。
   * ----------------------------------------------------------------*/
  i18n: {
    zh: {
      brandTag: "档案终端",
      railLegend: "阵列索引",
      railStatus: "系统读数",
      railCategory: "分类",
      arrayHint: "拖动浏览 · 点击展开档案 · ← → 切换",
      arrayLabel: "档案阵列",
      workbenchLabel: "工作台",
      openArchive: "展开档案",
      closeArchive: "关闭",
      exportTxt: "导出 TXT",
      prevEntry: "上一份",
      nextEntry: "下一份",
      copyLink: "复制链接",
      copied: "已复制",
      fields: { code: "编号", category: "分类", date: "日期", tags: "标签", index: "位置" },
      tasksTitle: "今日事项",
      tasksDone: "已完成",
      tasksEmpty: "今天还没有安排",
      focusTitle: "专注计时",
      focusStart: "开始",
      focusPause: "暂停",
      focusReset: "重置",
      focusBreak: "休息",
      focusRound: "第 {n} 轮",
      focusIdle: "准备就绪",
      focusRunning: "专注中",
      focusPaused: "已暂停",
      focusBreaking: "休息中",
      mediaTitle: "正在播放",
      mediaIdle: "未检测到媒体会话",
      mediaPlaying: "播放中",
      mediaPaused: "已暂停",
      eventTitle: "重要日程",
      eventDays: "天",
      eventHours: "小时",
      eventMinutes: "分钟",
      eventNow: "就是现在",
      contactTitle: "联络",
      contactHint: "点击任意入口，或复制邮箱",
      theme: "配色",
      themeAuto: "自动",
      themeLight: "亮色",
      themeDark: "暗色",
      tilt: "曲面",
      sound: "音效",
      perf: "高性能",
      replay: "重播开场",
      skip: "跳过",
      session: "登录身份",
      accessLog: "访问记录",
      on: "开",
      off: "关",
      poweredBy: "静态站点 · 零依赖 · GitHub Pages",
      noscript: "本页面需要 JavaScript 才能展开档案阵列。"
    },
    en: {
      brandTag: "Archive terminal",
      railLegend: "Index",
      railStatus: "Readouts",
      railCategory: "Categories",
      arrayHint: "Drag to browse · Click to open · ← → to step",
      arrayLabel: "Archive array",
      workbenchLabel: "Workspace",
      openArchive: "Open archive",
      closeArchive: "Close",
      exportTxt: "Export TXT",
      prevEntry: "Previous",
      nextEntry: "Next",
      copyLink: "Copy link",
      copied: "Copied",
      fields: { code: "Code", category: "Category", date: "Date", tags: "Tags", index: "Index" },
      tasksTitle: "Today's tasks",
      tasksDone: "complete",
      tasksEmpty: "Nothing scheduled yet",
      focusTitle: "Focus timer",
      focusStart: "Start",
      focusPause: "Pause",
      focusReset: "Reset",
      focusBreak: "Break",
      focusRound: "Round {n}",
      focusIdle: "Ready",
      focusRunning: "Focus",
      focusPaused: "Paused",
      focusBreaking: "Break",
      mediaTitle: "Now playing",
      mediaIdle: "No media session detected",
      mediaPlaying: "Playing",
      mediaPaused: "Paused",
      eventTitle: "Upcoming",
      eventDays: "days",
      eventHours: "hrs",
      eventMinutes: "min",
      eventNow: "Right now",
      contactTitle: "Contact",
      contactHint: "Open a channel, or copy the address",
      theme: "Theme",
      themeAuto: "Auto",
      themeLight: "Light",
      themeDark: "Dark",
      tilt: "Depth",
      sound: "Sound",
      perf: "Perf",
      replay: "Replay opening",
      skip: "Skip",
      session: "Session",
      accessLog: "Access log",
      on: "on",
      off: "off",
      poweredBy: "Static site · Zero dependencies · GitHub Pages",
      noscript: "This page needs JavaScript to unfold the archive array."
    }
  }
};
