# 大富翁辅助网站

一个专为大富翁游戏设计的辅助工具网站，帮助玩家管理游戏中的各种数据和功能。

## 功能特性

- 🏠 **首页** - 游戏概览和快速导航
- 📈 **股票市场** - 股票价格管理和交易记录
- 👥 **玩家管理** - 玩家信息和资产管理
- 💳 **欠债管理** - 债务记录和还款跟踪
- 🎲 **七星彩** - 彩票游戏功能
- ✨ **机会命运** - 随机事件卡片管理

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式框架
- React Router 路由管理
- Zustand 状态管理
- Lucide React 图标库

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173/cl/` 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 部署

本项目已配置 GitHub Actions 自动部署到 GitHub Pages。

- **仓库地址**: https://github.com/opeensf/cl
- **在线访问**: https://opeensf.github.io/cl/

每次推送到 `main` 分支时，会自动触发构建和部署流程。

## 项目结构

```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── router/        # 路由配置
├── store/         # 状态管理
├── hooks/         # 自定义 Hooks
├── lib/           # 工具函数
└── assets/        # 静态资源
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！
