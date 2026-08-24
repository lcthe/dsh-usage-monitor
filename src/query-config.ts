import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { QueryOverride } from './query-types.ts'

export interface StoredQueryConfig {
  version: 1
  providers: Record<string, QueryOverride>
}

const CONFIG_PATH = join(homedir(), '.dsh', 'usage-monitor', 'config.json')

const EMPTY_CONFIG: StoredQueryConfig = { version: 1, providers: {} }

export function loadQueryConfig(): StoredQueryConfig {
  try {
    const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Partial<StoredQueryConfig>
    if (parsed.version !== 1 || !parsed.providers || typeof parsed.providers !== 'object') {
      return { ...EMPTY_CONFIG, providers: {} }
    }
    return { version: 1, providers: parsed.providers as Record<string, QueryOverride> }
  } catch {
    return { ...EMPTY_CONFIG, providers: {} }
  }
}

export function saveQueryConfig(config: StoredQueryConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true })
  const tempPath = `${CONFIG_PATH}.tmp-${process.pid}-${Date.now()}`
  writeFileSync(tempPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  renameSync(tempPath, CONFIG_PATH)
}

export function getQueryConfigPath(): string {
  return CONFIG_PATH
}
