# dsh-usage-monitor

DSH 用量监控 — 查看各 LLM 供应商的 API 余额和用量状态。

[English](README.md) | [简体中文](README.zh.md)

## 🎯 项目简介

一个 DSH 插件，在设置界面添加「用量」页面。自动从 DSH 凭据系统读取已配置的 API Key，查询各供应商余额 API，以卡片式网格布局展示结果。

## ✨ 核心功能

- **自动检测已配置供应商** — 从 DSH 凭据系统读取 API Key，无需手动输入
- **余额查询支持** — DeepSeek、Moonshot/Kimi、OpenRouter、Fireworks AI
- **卡片式 UI** — 响应式网格布局，余额可视化
- **进度条** — 根据剩余余额显示绿/黄/红色
- **控制台链接** — 不支持查询的供应商一键跳转控制台
- **筛选功能** — 全部 / 已配置 / 支持查询
- **国际化** — 中英文双语

### 截图

![用量监控](docs/1.png)

## 📐 系统要求

需要使用带有**浏览器客户端**的 DeepSeek Harness 部署方式，包括带 Web UI 的**桌面版**或 **Web 版**。

## 📦 安装

```sh
pnpm add @lcthe/dsh-usage-monitor
```

在 `cordis.yml` 中、与其他 bundle 项目相同的 include 层级添加插件：

```yaml
- insert:
    - id: dsh-usage-monitor
      name: '@lcthe/dsh-usage-monitor'
```

启动 DSH Web 客户端：

```sh
pnpm dsh web
```

DSH 启动后，打开**设置 → 用量**即可查看各供应商余额。

## 🔑 支持的供应商

### 支持余额查询

| 供应商 | API 端点 | 说明 |
|---|---|---|
| DeepSeek | `GET /user/balance` | 支持 CNY/USD |
| Moonshot AI / Kimi | `GET /v1/users/me/balance` | CNY |
| OpenRouter | `GET /api/v1/credits` | 需要 Management API Key |
| Fireworks AI | `GET /v1/accounts/-/billingUsage` | USD |

### 不支持余额查询（显示控制台链接）

OpenAI、Anthropic、Google Gemini、Groq、Mistral、xAI、Together AI、Cerebras、NVIDIA、Hugging Face、Qwen（通义千问）、Xiaomi（小米）、Z.AI（智谱）、Kimi For Coding、Ant Ling（蚂蚁灵）

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT
