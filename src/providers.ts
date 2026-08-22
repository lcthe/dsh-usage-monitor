/**
 * Provider configuration for balance/usage monitoring.
 * Each entry defines how to query the provider's balance API (if available).
 */

export interface BalanceInfo {
  /** Total balance (original currency) */
  total?: number
  /** Used balance */
  used?: number
  /** Remaining balance */
  remaining?: number
  /** Currency code (CNY, USD, etc.) */
  currency?: string
  /** Whether the account is available */
  available?: boolean
  /** Raw response for debugging */
  raw?: unknown
}

export type LimitType = 'credit' | 'time' | 'usage'

export interface ProviderConfig {
  /** Unique provider identifier (matches DSH provider IDs) */
  id: string
  /** Display name (English) */
  name: string
  /** Display name (Chinese) */
  nameZh: string
  /** API base URL */
  baseUrl: string
  /** Environment variable name for the API key */
  apiKeyEnv: string
  /** Console/dashboard URL for manual checking */
  consoleUrl: string
  /** Limit type: credit (balance), time (subscription with time windows), usage (pay-per-use) */
  limitType?: LimitType
  /** Balance API configuration (undefined if not supported) */
  balanceApi?: {
    /** Endpoint URL or function to build it from baseUrl */
    url: string | ((baseUrl: string) => string)
    /** HTTP method */
    method: 'GET' | 'POST'
    /** Custom headers (beyond Authorization) */
    headers?: Record<string, string>
    /** Parse the response into BalanceInfo */
    parse: (data: unknown) => BalanceInfo
  }
}

export const PROVIDERS: ProviderConfig[] = [
  // === Providers with balance API ===
  {
    id: 'deepseek',
    limitType: 'credit',
    name: 'DeepSeek',
    nameZh: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    consoleUrl: 'https://platform.deepseek.com',
    balanceApi: {
      url: (base) => `${base}/user/balance`,
      method: 'GET',
      parse: (data: unknown) => {
        const d = data as { is_available?: boolean; balance_infos?: Array<{ currency?: string; total_balance?: string; granted_balance?: string; topped_up_balance?: string }> }
        const info = d.balance_infos?.[0]
        const total = info?.total_balance ? parseFloat(info.total_balance) : undefined
        return {
          total,
          remaining: total,
          currency: info?.currency ?? 'CNY',
          available: d.is_available,
          raw: data,
        }
      },
    },
  },
  {
    id: 'moonshotai',
    limitType: 'credit',
    name: 'Moonshot AI',
    nameZh: '月之暗面',
    baseUrl: 'https://api.moonshot.ai/v1',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    consoleUrl: 'https://platform.moonshot.cn',
    balanceApi: {
      url: (base) => {
        const url = base.replace(/\/v1\/?$/, '')
        return `${url}/v1/users/me/balance`
      },
      method: 'GET',
      parse: (data: unknown) => {
        const d = data as { code?: number; data?: { available_balance?: number; voucher_balance?: number; cash_balance?: number } }
        const balance = d.data?.available_balance
        return {
          total: balance,
          remaining: balance,
          currency: 'CNY',
          available: balance !== undefined && balance > 0,
          raw: data,
        }
      },
    },
  },
  {
    id: 'moonshotai-cn',
    name: 'Moonshot AI CN',
    nameZh: '月之暗面 (国内)',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    consoleUrl: 'https://platform.moonshot.cn',
    balanceApi: {
      url: (base) => {
        const url = base.replace(/\/v1\/?$/, '')
        return `${url}/v1/users/me/balance`
      },
      method: 'GET',
      parse: (data: unknown) => {
        const d = data as { code?: number; data?: { available_balance?: number; voucher_balance?: number; cash_balance?: number } }
        const balance = d.data?.available_balance
        return {
          total: balance,
          remaining: balance,
          currency: 'CNY',
          available: balance !== undefined && balance > 0,
          raw: data,
        }
      },
    },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    consoleUrl: 'https://openrouter.ai',
    balanceApi: {
      url: 'https://openrouter.ai/api/v1/credits',
      method: 'GET',
      parse: (data: unknown) => {
        const d = data as { data?: { total_credits?: number; total_usage?: number } }
        const total = d.data?.total_credits
        const used = d.data?.total_usage
        const remaining = total !== undefined && used !== undefined ? total - used : undefined
        return { total, used, remaining, currency: 'USD', raw: data }
      },
    },
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    nameZh: 'Fireworks AI',
    baseUrl: 'https://api.fireworks.ai/inference',
    apiKeyEnv: 'FIREWORKS_API_KEY',
    consoleUrl: 'https://fireworks.ai',
    balanceApi: {
      url: 'https://api.fireworks.ai/v1/accounts/-/billingUsage',
      method: 'GET',
      parse: (data: unknown) => {
        const d = data as { serverlessCosts?: Array<{ cost?: number }> }
        const used = d.serverlessCosts?.reduce((sum, item) => sum + (item.cost ?? 0), 0)
        return { used, currency: 'USD', raw: data }
      },
    },
  },
  // === Providers without balance API ===
  {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    consoleUrl: 'https://platform.openai.com',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    nameZh: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    consoleUrl: 'https://console.anthropic.com',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    nameZh: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnv: 'GEMINI_API_KEY',
    consoleUrl: 'https://aistudio.google.com',
  },
  {
    id: 'groq',
    name: 'Groq',
    nameZh: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    consoleUrl: 'https://console.groq.com',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    nameZh: 'Mistral',
    baseUrl: 'https://api.mistral.ai',
    apiKeyEnv: 'MISTRAL_API_KEY',
    consoleUrl: 'https://console.mistral.ai',
  },
  {
    id: 'xai',
    name: 'xAI',
    nameZh: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    apiKeyEnv: 'XAI_API_KEY',
    consoleUrl: 'https://console.x.ai',
  },
  {
    id: 'together',
    name: 'Together AI',
    nameZh: 'Together AI',
    baseUrl: 'https://api.together.ai/v1',
    apiKeyEnv: 'TOGETHER_API_KEY',
    consoleUrl: 'https://api.together.ai',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    nameZh: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyEnv: 'CEREBRAS_API_KEY',
    consoleUrl: 'https://cloud.cerebras.ai',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    nameZh: 'NVIDIA',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKeyEnv: 'NVIDIA_API_KEY',
    consoleUrl: 'https://build.nvidia.com',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    nameZh: 'Hugging Face',
    baseUrl: 'https://router.huggingface.co/v1',
    apiKeyEnv: 'HF_TOKEN',
    consoleUrl: 'https://huggingface.co',
  },
  {
    id: 'qwen-token-plan',
    name: 'Qwen Token Plan',
    nameZh: '通义千问',
    baseUrl: 'https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'QWEN_TOKEN_PLAN_API_KEY',
    consoleUrl: 'https://dashscope.console.aliyun.com',
  },
  {
    id: 'qwen-token-plan-cn',
    name: 'Qwen Token Plan CN',
    nameZh: '通义千问 (国内)',
    baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'QWEN_TOKEN_PLAN_CN_API_KEY',
    consoleUrl: 'https://dashscope.console.aliyun.com',
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    nameZh: '小米',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    apiKeyEnv: 'XIAOMI_API_KEY',
    consoleUrl: 'https://dev.mi.com',
  },
  {
    id: 'zai',
    name: 'Z.AI',
    nameZh: '智谱',
    baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    apiKeyEnv: 'ZAI_API_KEY',
    consoleUrl: 'https://open.bigmodel.cn',
  },
  {
    id: 'zai-coding-cn',
    name: 'Z.AI Coding CN',
    nameZh: '智谱 (国内)',
    baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
    apiKeyEnv: 'ZAI_CODING_CN_API_KEY',
    consoleUrl: 'https://open.bigmodel.cn',
  },
  {
    id: 'kimi-coding',
    name: 'Kimi For Coding',
    nameZh: 'Kimi 编程助手',
    baseUrl: 'https://api.kimi.com/coding',
    apiKeyEnv: 'KIMI_API_KEY',
    consoleUrl: 'https://kimi.moonshot.cn',
  },
  {
    id: 'ant-ling',
    name: 'Ant Ling',
    nameZh: '蚂蚁灵',
    baseUrl: 'https://api.ant-ling.com/v1',
    apiKeyEnv: 'ANT_LING_API_KEY',
    consoleUrl: 'https://ant-ling.com',
  },
  {
    id: 'opencode',
    name: 'OpenCode Zen',
    nameZh: 'OpenCode Zen',
    baseUrl: 'https://opencode.ai/zen/v1',
    apiKeyEnv: 'OPENCODE_API_KEY',
    consoleUrl: 'https://opencode.ai/console',
    limitType: 'credit',
  },
  {
    id: 'opencode-go',
    name: 'OpenCode Go',
    nameZh: 'OpenCode Go',
    baseUrl: 'https://opencode.ai/zen/go/v1',
    apiKeyEnv: 'OPENCODE_API_KEY',
    consoleUrl: 'https://opencode.ai/console',
    limitType: 'time',
  },
]

/** Map from environment variable name to provider configs */
export const ENV_TO_PROVIDERS = new Map<string, ProviderConfig[]>()
for (const p of PROVIDERS) {
  const list = ENV_TO_PROVIDERS.get(p.apiKeyEnv) ?? []
  list.push(p)
  ENV_TO_PROVIDERS.set(p.apiKeyEnv, list)
}
