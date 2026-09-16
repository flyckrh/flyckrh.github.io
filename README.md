# ARCHIVE TERMINAL · 轻量版个人主页

一套**零依赖、零构建**的静态个人主页，视觉语言参考《莱茵生命交互桌面》那类"研究档案终端"：
磨砂白 / 石墨灰双配色、玻璃档案阵列、曲面 HUD、开场序列、工作台（时钟 / 今日事项 / 专注计时 / 正在播放）、可收藏与导出 TXT 的档案详情。

它不依赖任何框架、字体下载或 3D 模型文件——**整站不到 200 KB**，双击 `index.html` 就能在本地打开。

---

## 一、和"RhineLabUI"那版有什么区别

| | 本轻量版 | RhineLabUI 改造版 |
| --- | --- | --- |
| 体积 | 约 0.2 MB | 仓库约 113 MB（含 3D 模型与字体） |
| 运行方式 | 纯 HTML/CSS/JS，无需编译 | 需要 Node + Vite 编译，靠 GitHub Actions |
| 三维效果 | CSS 3D 玻璃阵列（无 WebGL） | Three.js 真实模型、360° 拆解、玻璃折射 |
| 电脑/手机性能 | 很轻，低配设备与手机都流畅 | 需要中端以上显卡体验才完整 |
| 内容更新 | 改 `assets/js/content.js` | 改 `content/archives.json` |
| 条目数量 | 想放几条放几条 | 固定 5 类 × 8 条 = 40 条 |
| 中文显示 | 系统字体（不下载字体文件） | 随包 MiSans 字体 |


---

## 二、本地打开（不需要任何软件）

双击 `index.html` 即可。完全离线可用，不会向任何服务器发请求。

---

## 三、只改一个文件：`assets/js/content.js`

打开它，你会看到分好段落的配置，全部是要改的文字。改完保存、刷新页面即可。

### 1）身份信息 `identity`

| 字段 | 说明 |
| --- | --- |
| `name` / `nameLocal` | 英文名（章鱼开场与页脚） / 中文名 |
| `role` | 身份，例如 `传播学 · 本科在读` |
| `affiliation` | 学校或机构 |
| `location` | 城市 |
| `email` | 邮箱，用于 `links` 里的 mailto 链接 |
| `avatar` | 头像图片路径，例如 `assets/img/avatar.jpg`；留空则显示姓名首字母 |
| `lettering` | 页眉字标，建议 4–14 个字符 |
| `serial` | 页眉右上角的编号，纯装饰 |
| `accessNote` | 页脚"访问记录"那一行 |

### 2）外部链接 `links`

每条写 `label`（显示名）、`href`（网址）、`icon`（图标名）。
可用图标：`github` `mail` `orcid` `scholar` `linkedin` `zhihu` `bilibili` `x` `rss` `link`。

### 3）导航 `nav`

三项：`array`（档案阵列）、`workbench`（工作台）、`links`（联络）。想改名直接改 `label` / `labelEn`。

### 4）档案 = 你的作品 `archives`

这是最常改的部分，**想加几条就加几条**（不像原版需要凑满 40 条）。每条的结构：

```js
{
  code: "P-01",                  // 左上角编号
  title: "作品标题",
  subtitle: "一句话副标题 / 期刊 / 技术栈",
  category: "项目",               // 用于右侧索引图例分组
  date: "2026-05",
  summary: "一句话摘要，显示在标题下方",
  body: [
    "第一段正文。",
    "- 以「- 」开头会变成列表项",
    "> 以「> 」开头会变成引用块"
  ],
  tags: ["标签一", "标签二"],
  links: { repo: "https://…", demo: "https://…" },  // 键名随意，会显示成按钮
  pinned: true                   // 可选，会在面板上标一个小圆点
}
```

### 5）工作台 `workbench`

- `tasks.items`：今日事项，最多建议 3 条，勾选状态存在浏览器本地
- `focus.focusMinutes` / `focus.breakMinutes`：专注与休息时长
- `event.name` / `event.date`：重要日程倒计时，例如 `2026-12-31` 或 `2026-12-31T09:00`
- `media`：读取系统媒体会话（浏览器 / Spotify 等在播放什么）
- 每个模块都能用 `enabled: false` 关掉

### 6）外观 `appearance`

- `defaultTheme`：`light` 或 `dark`
- `autoTheme`：按时间自动切换，默认 19:00 转暗、07:00 转亮
- `grain` / `vignette` / `chromatic`：颗粒、暗角、边缘色散强度，设 `0` 关闭
- `array.panelRadius` / `panelGap` / `visibleSide`：阵列半径、相邻夹角、左右显示几块

### 7）开场 `boot`

`enabled: false` 直接跳过开场；`alwaysReplay: true` 表示每次刷新都播放；`lines` 是逐条浮现的日志文字。

### 8）界面文案 `i18n`

`zh` 和 `en` 两套界面文案（不影响你写的档案内容）。右上角"语言"按钮可切换。

---

## 四、操作方式

- **阵列**：拖动 / 触摸滑动 / 滚轮（横向或按住 Shift）切换；`←` `→` 换一份，`Home` `End` 到头尾，`Enter` 打开
- **档案详情**：点面板打开；`Esc` 或点背景关闭；可复制链接（带 `#编号`，可直接分享单条档案）、导出 TXT
- **地址栏深链**：访问 `你的网址/#P-01` 会直接打开编号为 `P-01` 的档案
- **控制条**：配色（自动 / 亮 / 暗）、语言、曲面视差、音效、高性能模式、重播开场

---

## 五、发布到 GitHub Pages

### 方式 A（推荐，之后更新全自动）

1. 新建一个仓库。名字叫 `<你的用户名>.github.io` 最省事（网址就是 `https://<你的用户名>.github.io/`），叫别的名字也可以，本站在子路径下同样能正常工作。
2. 把这个文件夹里的**全部文件**上传上去（包括隐藏的 `.github` 文件夹；用 GitHub Desktop 或网页端拖拽都行）。
3. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
4. 之后每次提交，`.github/workflows/pages.yml` 会自动把网站发布出去。

### 方式 B（最省事，但每次更新要手动点一下）

1. 把全部文件上传到仓库 `main` 分支。
2. **Settings → Pages → Source** 选 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存。
3. 之后每次改完内容提交即可，GitHub 会自动重新发布（不需要 Actions）。

> 两种方式二选一。方式 A 会留下部署记录，方式 B 更简单。

---

## 六、以后更新（三步）

1. 打开 `assets/js/content.js`（GitHub 网页端可直接点铅笔图标编辑）
2. 改完 `Commit changes`
3. 等 1 分钟刷新网址；手机可下拉刷新

改的规则只有一条：**字符串用引号包住，条目之间用逗号分隔**。写完保存前，页面上如果出现空白，多半是少了一个逗号或引号。

---

## 七、目录结构

```
.
├─ index.html                 页面骨架（一般不用改）
├─ 404.html                   找不到页面时的提示页
├─ assets
│  ├─ css
│  │  ├─ base.css             配色变量、背景、画面质感
│  │  ├─ hud.css              字标、导航、读数、页脚、详情、开场
│  │  ├─ archive.css          玻璃档案阵列
│  │  └─ workbench.css        工作台各模块
│  ├─ img
│  │  ├─ favicon.svg          浏览器标签图标
│  │  └─ app-icon.svg         添加到主屏时的图标
│  └─ js
│     ├─ content.js           ★ 你要维护的内容
│     ├─ core.js              工具：DOM、存储、文案、开关
│     ├─ theme.js             亮暗配色与定时切换
│     ├─ audio.js             交互音效（实时合成，无音频文件）
│     ├─ icons.js             内联图标
│     ├─ hud.js               导航、图例、读数、控制条
│     ├─ archive.js           CSS 3D 阵列与档案详情
│     ├─ workbench.js         时钟 / 事项 / 专注 / 播放 / 日程
│     ├─ boot.js              开场序列
│     └─ app.js               启动装配
└─ .github/workflows/pages.yml  自动发布（可选）
```

---

## 八、可选进阶

- **换配色**：只改 `assets/css/base.css` 顶部 `:root` 与 `[data-theme="dark"]` 里的颜色变量
- **换图标**：把 `assets/img/favicon.svg` 换成你自己的 SVG 即可（建议同时导出一张 512×512 的 PNG 放到 `assets/img/app-icon.svg` 的位置并改名引用）
- **换字体**：本站默认用系统字体，加载最快。想用自定义字体，把他人的授权字体放进 `assets/fonts/`，在 `base.css` 里写 `@font-face`，再改 `--font-sans`
- **加页面**：`body` 里的 `.view` 区块是现成的模式，复制一份并在 `content.js` 的 `nav` 里加一项即可（需要一点前端经验）

---

## 九、许可与说明
- 视觉灵感来自 LBEILC 的开源项目 [RhineLabUI](https://github.com/LBEILC/RhineLabUI)（MIT 许可）。本轻量版是**独立重写**的实现，不包含该项目的任何代码、模型、字体或美术资源；如你在页面上提到灵感来源，建议加一行：

  > 视觉语言参考 LBEILC 的开源项目 RhineLabUI（MIT 许可）。

- 本站所有内容（档案文字、姓名、链接）都由 `content.js` 提供，请自行确保你有权发布这些内容。
