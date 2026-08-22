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
}

export interface BalanceData {
  supported: boolean
  balance?: {
    total?: number
    used?: number
    remaining?: number
    currency?: string
    available?: boolean
  }
  error?: string
  consoleUrl?: string
}

export interface ProviderCardProps extends PropsLocale<typeof NS> {
  provider: ProviderInfo
  balance: BalanceData | null
  loading: boolean
  onRefresh: () => void
}

function formatAmount(value: number | undefined, currency?: string): string {
  if (value === undefined || value === null) return '--'
  const formatted = value >= 1000
    ? `${(value / 1000).toFixed(1)}k`
    : value >= 1
      ? value.toFixed(2)
      : value.toFixed(4)
  if (currency === 'CNY') return `¥${formatted}`
  if (currency === 'USD') return `$${formatted}`
  return formatted
}

function getBalancePercent(balance: BalanceData['balance']): number | null {
  if (!balance?.total || balance.total <= 0) return null
  if (balance.remaining !== undefined) return Math.min(100, Math.max(0, (balance.remaining / balance.total) * 100))
  return null
}

function getStatusColor(percent: number | null): string {
  if (percent === null) return 'var(--dsw-alias-color-success)'
  if (percent > 50) return 'var(--dsw-alias-color-success)'
  if (percent > 20) return 'var(--dsw-alias-color-warning)'
  return 'var(--dsw-alias-color-error)'
}

export function ProviderCard({ provider, balance, loading, onRefresh, t }: ProviderCardProps): JSX.Element {
  const percent = getBalancePercent(balance?.balance)
  const statusColor = getStatusColor(percent)

  return (
    <div className={css.card}>
      <div className={css.header}>
        <div className={css.titleRow}>
          <h3 className={css.name}>{provider.nameZh || provider.name}</h3>
          <span
            className={css.dot}
            style={{ backgroundColor: provider.configured ? statusColor : 'var(--dsw-alias-color-text-tertiary)' }}
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
            {balance.balance.remaining !== undefined && (
              <div className={css.mainBalance}>
                <span className={css.balanceLabel}>{t('remaining')}</span>
                <span className={css.balanceValue}>{formatAmount(balance.balance.remaining, balance.balance.currency)}</span>
              </div>
            )}
            {balance.balance.total !== undefined && balance.balance.total > 0 && (
              <div className={css.progressRow}>
                <div className={css.progressBar}>
                  <div className={css.progressFill} style={{ width: `${percent ?? 100}%`, backgroundColor: statusColor }} />
                </div>
              </div>
            )}
            <div className={css.detailRow}>
              {balance.balance.total !== undefined && (
                <span className={css.detailItem}>{t('total')}: {formatAmount(balance.balance.total, balance.balance.currency)}</span>
              )}
              {balance.balance.used !== undefined && (
                <span className={css.detailItem}>{t('used')}: {formatAmount(balance.balance.used, balance.balance.currency)}</span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className={css.footer}>
        <a className={css.consoleLink} href={provider.consoleUrl} target="_blank" rel="noopener noreferrer">
          {t('goToConsole')} ↗
        </a>
        {provider.configured && (
          <button className={css.refreshBtn} onClick={onRefresh} disabled={loading}>
            {loading ? '...' : t('refresh')}
          </button>
        )}
      </div>
    </div>
  )
}
