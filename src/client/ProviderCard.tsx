import type { QueryOverride } from '../query-types.ts'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { UsageMonitorLocaleKey } from './locales.ts'
import { NS } from './locales.ts'
import css from './provider-card.module.css'

export interface ProviderInfo {
  id: string
  name: string
  nameZh: string
  configured: boolean
  supportBalance: boolean
  consoleUrl: string
  apiKeyEnv: string
  limitType?: 'credit' | 'time' | 'usage'
  displayMode?: 'currency-cny' | 'currency-usd' | 'token' | 'time-window' | 'usage-only' | null
  hasOverride?: boolean
  queryOverride?: QueryOverride | null
  defaultQuery?: QueryOverride | null
}

export interface BalanceData {
  supported: boolean
  balance?: {
    total?: number
    used?: number
    remaining?: number
    currency?: string
    available?: boolean
    timeWindows?: Array<{
      label: string
      status: string
      percent: number
      resetsAt?: string
    }>
  }
  error?: string
  consoleUrl?: string
}

export interface ProviderCardProps extends PropsLocale<typeof NS> {
  provider: ProviderInfo
  balance: BalanceData | null
  loading: boolean
  onRefresh: () => void
  onEdit?: () => void
  onRemove?: () => void
}

function formatAmount(value: number | undefined, displayMode?: string | null): string {
  if (value === undefined || value === null) return '--'
  if (displayMode === 'token') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
    return String(Math.round(value))
  }
  const formatted = value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : value >= 1
      ? value.toFixed(2)
      : value.toFixed(4)
  if (displayMode === 'currency-cny') return `¥${formatted}`
  if (displayMode === 'currency-usd') return `$${formatted}`
  return formatted
}

function formatResetTime(iso: string): string {
  const d = new Date(iso)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${h}:${m}`
}

function getBalancePercent(balance: BalanceData['balance']): number | null {
  if (!balance?.total || balance.total <= 0) return null
  if (balance.remaining !== undefined) return Math.min(100, Math.max(0, (balance.remaining / balance.total) * 100))
  return null
}

function getStatusColor(percent: number | null): string {
  if (percent === null) return 'var(--dsw-alias-state-success-primary)'
  if (percent > 50) return 'var(--dsw-alias-state-success-primary)'
  if (percent > 20) return 'var(--dsw-alias-state-warn-primary)'
  return 'var(--dsw-alias-state-error-primary)'
}

export function ProviderCard({ provider, balance, loading, onRefresh, onEdit, onRemove, t }: ProviderCardProps): JSX.Element {
  const percent = getBalancePercent(balance?.balance)
  const statusColor = getStatusColor(percent)

  return (
    <div className={css.card}>
      <div className={css.header}>
        <div className={css.titleRow}>
          <h3 className={css.name}>{provider.nameZh || provider.name}</h3>
          <span
            className={css.dot}
            style={{ backgroundColor: provider.configured ? statusColor : 'var(--dsw-alias-label-dimmed)' }}
          />
        </div>
        <span className={css.subtitle}>{provider.name}</span>
      </div>

      <div className={css.body}>
        {!provider.configured ? (
          <div className={css.notConfigured}>
            <span className={css.muted}>{t('noApiKey')}</span>
            <span className={css.envHint}>{t('apiKeyEnv')}: {provider.apiKeyEnv}</span>
          </div>
        ) : loading ? (
          <div className={css.loading}>
            <span className={css.spinner} />
            <span>{t('querying')}</span>
          </div>
        ) : provider.limitType === 'time' && balance?.balance?.timeWindows ? (
          <div className={css.timeWindows}>
            {balance.balance.timeWindows.map((w) => {
              const isExceeded = w.status !== 'ok'
              const color = isExceeded
                ? 'var(--dsw-alias-state-error-primary)'
                : w.percent > 80
                  ? 'var(--dsw-alias-state-warn-primary)'
                  : 'var(--dsw-alias-state-success-primary)'
              return (
                <div key={w.label} className={css.timeWindow}>
                  <div className={css.twHeader}>
                    <span className={css.twLabel}>
                      {t(w.label) || w.label}
                      {w.resetsAt && <span className={css.twReset}> ({formatResetTime(w.resetsAt)} 重置)</span>}
                    </span>
                    <span className={css.twPercent} style={{ color }}>
                      {isExceeded ? t('exceeded') : `${w.percent}%`}
                    </span>
                  </div>
                  <div className={css.twBar}>
                    <div className={css.twBarFill} style={{ width: `${Math.min(100, w.percent)}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : provider.limitType === 'time' ? (
          <div className={css.timeLimit}>
            <span className={css.timeLimitBadge}>{t('timeLimit')}</span>
            <span className={css.muted}>{t('timeLimitHint')}</span>
          </div>
        ) : !provider.supportBalance ? (
          <div className={css.notSupported}>
            <span className={css.muted}>{t('notSupported')}</span>
          </div>
        ) : balance?.error ? (
          <div className={css.error}>
            <span className={css.errorText}>{balance.error}</span>
          </div>
        ) : balance?.balance ? (
          <div className={css.balanceInfo}>
            {provider.displayMode === 'usage-only' ? (
              <>
                {balance.balance.used !== undefined && (
                  <div className={css.mainBalance}>
                    <span className={css.balanceLabel}>{t('used')}</span>
                    <span className={css.balanceValue}>{formatAmount(balance.balance.used, provider.displayMode)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {balance.balance.remaining !== undefined && (
                  <div className={css.mainBalance}>
                    <span className={css.balanceLabel}>{t('balance')}</span>
                    <span className={css.balanceValue}>{formatAmount(balance.balance.remaining, provider.displayMode)}</span>
                  </div>
                )}
                {balance.balance.used !== undefined && percent !== null && (
                  <div className={css.progressRow}>
                    <div className={css.progressBar}>
                      <div className={css.progressFill} style={{ width: `${percent}%`, backgroundColor: statusColor }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className={css.footer}>
        {provider.consoleUrl && (
          <a className={css.consoleLink} href={provider.consoleUrl} target="_blank" rel="noopener noreferrer">
            {t('goToConsole')} ↗
          </a>
        )}
        <div className={css.footerActions}>
          {provider.configured && provider.supportBalance && (
            <button className={css.refreshBtn} onClick={onRefresh} disabled={loading}>
              {loading ? '...' : t('refresh')}
            </button>
          )}
          {onEdit && (
            <button className={css.editBtn} onClick={onEdit}>{t('edit')}</button>
          )}
          {onRemove && (
            <button className={css.removeBtn} onClick={onRemove}>{t('remove')}</button>
          )}
        </div>
      </div>
    </div>
  )
}
