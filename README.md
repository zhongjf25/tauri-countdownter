<h1 align="center">Tauri Pomodoro Countdown / 番茄计时器</h1>

<p align="center">
  <img src="src-tauri/icons/128x128.png" alt="Logo" width="240" height="240">
</p>

<p align="center">
  ⏲️ A cross-platform Pomodoro countdown app built with <a href="https://tauri.app/">Tauri</a>, <a href="https://vuejs.org/">Vue 3</a>, and <a href="https://element-plus.org/">Element Plus</a>.<br>
  支持个性化闹铃、自动启动、工作/休息时长自定义等功能。
</p>

---

## ✨ Features / 功能特性

- **Pomodoro Countdown** / [番茄工作法](https://zh.wikipedia.org/zh-cn/%E7%95%AA%E8%8C%84%E5%B7%A5%E4%BD%9C%E6%B3%95)倒计时：支持工作/休息时间自定义，自动循环。
- **Custom Alarm** / 个性化闹铃：可选择本地音频作为提醒音，支持路径缓存。
- **Auto Start** / 开机自启动：一键开启/关闭应用随系统启动。
- **Cross-platform Desktop** / 跨平台桌面应用：基于 Tauri，支持 Windows、macOS、Linux。
- **Modern UI** / 现代化界面：采用 Vue3 + Element Plus，界面简洁美观。
- **Local Persistence** / 本地持久化：设置自动保存，无需每次重选。
- **Safe Asset Access** / 安全沙箱：音频等本地资源通过 Tauri asset 协议安全访问。

---

## 📦 Directory Structure / 目录结构

```
tauri-countdown/
├── public/                  # Static assets / 静态资源
├── src/
│   ├── App.vue              # Root component / 根组件
│   ├── main.js              # Entry file / 入口文件
│   ├── assets/              # Frontend static assets / 前端静态资源
│   ├── router/
│   │   └── index.js         # Router config / 路由配置
│   └── views/
│       ├── MainTimer/       # Main timer view / 主计时界面
│       ├── CountdownPage/   # Countdown view / 倒计时运行界面
│       └── TimeUpPage/      # Time up view / 时间到提示界面
├── src-tauri/               # Tauri backend (Rust) / Tauri 后端
│   ├── tauri.conf.json      # Tauri config / 配置
│   └── src/
├── package.json
├── README.md
└── ...
```

---

## 🚀 Quick Start / 快速开始

### 1. Requirements / 环境要求

- Node.js >= 16
- pnpm 或 npm
- Rust (建议使用 [rustup](https://rustup.rs/) 安装)
- Tauri CLI（如未安装，运行 `pnpm dlx tauri@latest tauri dev` 或 `npm install -g @tauri-apps/cli`）

### 2. Install dependencies / 安装依赖

```bash
pnpm install
# or / 或
npm install
```

### 3. Start development / 启动开发模式

```bash
pnpm tauri dev
# or / 或
npm run tauri dev
```

### 4. Build for production / 打包发布

```bash
pnpm run tauri build
# or / 或
npm run tauri build
```

---

## 🖥️ Main Features / 主要功能界面

- **Main Timer** / 主界面：设置工作/休息时长、选择闹铃、开始/暂停/重置倒计时。
- **Countdown** / 倒计时界面：显示剩余时间、进度条、暂停/恢复操作。
- **Time Up** / 时间到界面：弹窗提醒，自动播放闹铃音频，可一键进入下一个周期。

---

## ⚙️ Config & Customization / 配置与自定义

- **Alarm Audio** / 闹铃音频：支持选择本地音频文件，路径自动缓存，下次启动自动加载。
- **Auto Start** / 开机自启动：通过设置菜单一键切换。
- **Window Size** / 窗口大小：可在 `src-tauri/tauri.conf.json` 配置窗口初始/最小/最大尺寸。

---

## 🛠️ Tech Stack / 技术栈

- [Tauri](https://tauri.app/) - Cross-platform desktop framework / 跨平台桌面应用框架
- [Vue 3](https://vuejs.org/) - Frontend UI framework / 前端 UI 框架
- [Element Plus](https://element-plus.org/) - UI component library / 组件库
- [@tauri-apps/api](https://tauri.app/v1/api/js/) - Tauri JS API
- [@tauri-apps/plugin-store](https://tauri.app/v1/plugins/store/) - Settings persistence / 设置持久化
- [@tauri-apps/plugin-autostart](https://tauri.app/v1/plugins/autostart/) - Auto start / 开机自启动

---

## 📋 TODO

- [X] Basic Pomodoro Function / 基本番茄功能
- [X] Custom Alarm / 个性化闹铃
- [X] Auto Start / 开机自启动
- [X] Layout Improvement / 布局优化
- [X] Personalize Pomodoro Time / 个性化番茄时间
- [ ] Multi-theme / 多主题
- [ ] Statistics & History / 统计与历史

---

## 🤝 Contributing / 贡献

受Francesco Cirillo创立的番茄工作法启发，该项目由中山大学软件工程学院大二学生[@Ky1ine](https://github.com/zhongjf25) 和 [@Dunjia](https://github.com/xudong7)自主完成。

欢迎 issue、PR 或建议！如需自定义功能或遇到问题，请在 [GitHub Issues](https://github.com/zhongjf25/tauri-countdownter/issues) 提交。

Inspired by Pomodoro Technique developed by Francesco Cirillo, this project is developed by sophomore students [@Ky1ine](https://github.com/zhongjf25) and [@Dunjia](https://github.com/xudong7) from the School of Software Engineering at Sun Yat-sen University.

Welcome issues, PRs, or suggestions! If you need custom features or encounter problems, please submit them on [GitHub Issues](https://github.com/zhongjf25/tauri-countdownter/issues).

---

## 📄 License / 许可证

MIT License

---

**Enjoy your efficient Pomodoro time! 🍅 / 祝你高效番茄时光！**
