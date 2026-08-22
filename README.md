# dsh-usage-monitor

DSH Usage Monitor — View API credit balance and usage status across all configured LLM providers.

[English](README.md) | [简体中文](README.zh.md)

## 🎯 Overview

A DSH plugin that adds a **Usage** page to the settings UI. It automatically reads your configured API keys from the DSH credential system and queries each provider's balance API, displaying the results in a clean card-based layout.

## ✨ Features

- **Auto-detect configured providers** — reads API keys from DSH credentials, no manual input needed
- **Balance query support** — DeepSeek, Moonshot/Kimi, OpenRouter, Fireworks AI
- **Card-based UI** — responsive grid layout with balance visualization
- **Progress bar** — color-coded (green/yellow/red) based on remaining balance
- **Console links** — one-click access to provider dashboards for unsupported providers
- **Filtering** — filter by All / Configured / Balance Supported
- **i18n** — Chinese and English

### Screenshots

![Usage Monitor](docs/1.png)

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

## 🔑 Supported Providers

### With Balance API

| Provider | Endpoint | Type | Notes |
|---|---|---|---|
| DeepSeek | `GET /user/balance` | credit | CNY/USD |
| Moonshot AI / Kimi | `GET /v1/users/me/balance` | credit | CNY |
| OpenRouter | `GET /api/v1/credits` | credit | Requires Management API Key |
| Fireworks AI | `GET /v1/accounts/-/billingUsage` | credit | USD |
| OpenCode Go | `GET /v1/usage` | time | 5h/weekly/monthly limits with ring progress |

### Without Balance API (shows console link)

OpenAI, Anthropic, Google Gemini, Groq, Mistral, xAI, Together AI, Cerebras, NVIDIA, Hugging Face, Qwen, Xiaomi, Z.AI, Kimi For Coding, Ant Ling

## 🤝 Contributing

Issues and PRs are welcome!

## 📄 License

MIT
