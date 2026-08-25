# dsh-usage-monitor

DSH Usage Monitor — View API credit balance and usage status across all configured LLM providers.

[English](README.md) | [简体中文](README.zh.md)

## 🎯 Overview

A DSH plugin that adds a **Usage** page to the settings UI. It automatically reads your configured API keys from the DSH credential system and queries each provider's balance API, displaying the results in a clean card-based layout.

## ✨ Features

- **Auto-detect configured providers** — reads API keys from DSH credentials, no manual input needed
- **Card-based UI** — DSH unified card style, responsive grid layout
- **Multiple display modes** — currency (¥/$), token count, time-window progress bars
- **Custom providers** — add and remove display-only provider cards; Base URL is required and the console URL is optional
- **Built-in query overrides** — edit query URL, method, authentication, and response field paths for third-party balance endpoints
- **Input capsule** — balance in composer toolbar, refreshes on provider switch, message send, or click
- **Console links** — one-click access to provider dashboards
- **Filtering** — filter by All / Configured / Balance Supported
- **i18n** — Chinese and English

### Screenshots

#### 1. Balance capsule in the composer

![Balance capsule](1.png)

#### 2. Usage overview

![Usage overview](2.png)

#### 3. Query configuration editor

![Query configuration editor](3.png)

#### 4. Custom provider form

![Custom provider form](4.png)

## 📐 Requirements

Requires a DSH deployment with a **browser client**, including the **Desktop** or **Web** version with Web UI.

## 📦 Installation

```sh
pnpm add @lcthe/dsh-usage-monitor
```

Add the plugin to your `cordis.yml` at the same include level as other bundles:

```yaml
- insert:
    - id: dsh-usage-monitor
      name: '@lcthe/dsh-usage-monitor'
```

Start the DSH Web client:

```sh
pnpm dsh web
```

After DSH starts, open **Settings → Usage** to view your provider balances.

## 🔑 Provider Support

> **已稳定测试：** DeepSeek、OpenCode Go。其他供应商的余额查询接口未经完整测试，欢迎反馈。

### 余额查询支持

| 供应商 | 余额接口 | 计费模式 | 显示方式 | 控制台 | 状态 |
|---|---|---|---|---|---|
| DeepSeek | `GET /user/balance` | 按量付费 | ¥ 余额 | [platform.deepseek.com](https://platform.deepseek.com) | ✅ 已验证 |
| OpenCode Go | `GET /v1/usage` | 订阅制 | 5h/周/月 进度条 | [opencode.ai/workspace/go](https://opencode.ai/workspace/go) | ✅ 已验证 |
| Moonshot AI | `GET /v1/users/me/balance` | 按量付费 | ¥ 余额 | [platform.moonshot.cn](https://platform.moonshot.cn) | ⚠️ 未测试 |
| Moonshot AI CN | `GET /v1/users/me/balance` | 按量付费 | ¥ 余额 | [platform.moonshot.cn](https://platform.moonshot.cn) | ⚠️ 未测试 |
| OpenRouter | `GET /api/v1/credits` | 按量付费 | $ 余额 | [openrouter.ai](https://openrouter.ai) | ⚠️ 需 Management Key |
| Fireworks AI | `GET /v1/accounts/-/billingUsage` | 后付费 | $ 已用费用 | [fireworks.ai](https://fireworks.ai) | ⚠️ 未测试 |
| Z.AI（智谱） | `GET /user/rights` | 按量付费 | token 余量 | [open.bigmodel.cn](https://open.bigmodel.cn) | ⚠️ 未测试 |
| Z.AI CN | `GET /user/rights` | 按量付费 | token 余量 | [open.bigmodel.cn](https://open.bigmodel.cn) | ⚠️ 未测试 |

### 不支持余额查询

以下供应商暂无公开的余额查询 API，显示控制台链接供手动查看：

| 供应商 | 控制台 |
|---|---|
| OpenAI | [chatgpt.com](https://chatgpt.com/) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) |
| Groq | [console.groq.com](https://console.groq.com) |
| Mistral | [console.mistral.ai](https://console.mistral.ai) |
| xAI | [console.x.ai](https://console.x.ai) |
| Together AI | [api.together.ai](https://api.together.ai) |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| NVIDIA | [build.nvidia.com](https://build.nvidia.com) |
| Hugging Face | [huggingface.co](https://huggingface.co) |
| Qwen（通义千问） | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com) |
| Xiaomi（小米） | [platform.xiaomimimo.com](https://platform.xiaomimimo.com/console/plan-manage) |
| Kimi For Coding | [kimi.moonshot.cn](https://kimi.moonshot.cn) |
| Ant Ling（蚂蚁灵） | [ant-ling.com](https://ant-ling.com) |
| OpenCode Zen | [opencode.ai/workspace](https://opencode.ai/workspace) |

## Query overrides

Built-in provider cards can be edited from the **Edit** action. Overrides are stored globally by the DSH host in `~/.dsh/usage-monitor/config.json` and do not contain API key values. The editor supports HTTPS query URLs, GET/POST, Bearer Token, X-API-Key, no authentication, and safe dot-separated response field paths. Localhost, private-network, loopback, and cloud metadata addresses are rejected.


Issues and PRs are welcome!

## 📄 License

MIT
