import { useState, useEffect, useCallback } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsRuntime, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from './locales.ts'
import { usageRpc } from './index.ts'
import { ProviderCard, type ProviderInfo, type BalanceData } from './ProviderCard.tsx'
import { AddProviderDialog, type CustomProvider } from './AddProviderDialog.tsx'
import { ProviderQueryDialog } from './ProviderQueryDialog.tsx'
import type { QueryOverride } from '../query-types.ts'
import css from './usage-section.module.css'

type UsageSectionProps = PropsRuntime<'settings.section'> & PropsLocale<typeof NS>

type BalanceState = Record<string, { data: BalanceData | null; loading: boolean }>

export function UsageSection({ t }: UsageSectionProps): JSX.Element | null {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>(() => {
    try { return JSON.parse(localStorage.getItem('dsh-usage-monitor-custom') ?? '[]') }
    catch { return [] }
  })
  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<BalanceState>({})
  const [filter, setFilter] = useState<'all' | 'configured' | 'supported'>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProviderInfo | null>(null)

  const loadProviders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await usageRpc<ProviderInfo[]>('providers')
      setProviders(result)
    } catch {
      // silent fail on load
    } finally {
      setLoading(false)
    }
  }, [])

  const queryBalance = useCallback(async (providerId: string) => {
    setBalances(prev => ({
      ...prev,
      [providerId]: { data: prev[providerId]?.data ?? null, loading: true },
    }))
    try {
      const result = await usageRpc<BalanceData>('balance', { providerId })
      setBalances(prev => ({ ...prev, [providerId]: { data: result, loading: false } }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setBalances(prev => ({
        ...prev,
        [providerId]: { data: { supported: true, error: message }, loading: false },
      }))
    }
  }, [])

  // Load providers on mount
  useEffect(() => { void loadProviders() }, [loadProviders])

  // Auto-query balances for configured providers that support it
  useEffect(() => {
    for (const p of providers) {
      if (p.configured && p.supportBalance && !balances[p.id]) {
        void queryBalance(p.id)
      }
    }
  }, [providers, balances, queryBalance])

  const saveCustomProviders = useCallback((list: CustomProvider[]) => {
    setCustomProviders(list)
    localStorage.setItem('dsh-usage-monitor-custom', JSON.stringify(list))
  }, [])

  const handleEditSave = useCallback(async (providerId: string, config: QueryOverride) => {
    await usageRpc('query-config', { action: 'save', providerId, config })
    setEditingProvider(null)
    setBalances(prev => {
      const next = { ...prev }
      delete next[providerId]
      return next
    })
    await loadProviders()
  }, [loadProviders])

  const handleEditReset = useCallback(async (providerId: string) => {
    await usageRpc('query-config', { action: 'reset', providerId })
    setEditingProvider(null)
    setBalances(prev => {
      const next = { ...prev }
      delete next[providerId]
      return next
    })
    await loadProviders()
  }, [loadProviders])

  const handleAddCustom = useCallback((p: CustomProvider) => {
    saveCustomProviders([...customProviders, p])
    setShowAddDialog(false)
  }, [customProviders, saveCustomProviders])

  const handleRemoveCustom = useCallback((id: string) => {
    saveCustomProviders(customProviders.filter(p => p.id !== id))
  }, [customProviders, saveCustomProviders])

  const refreshAll = useCallback(() => {
    setBalances({})
    void loadProviders()
  }, [loadProviders])

  const filtered = providers.filter(p => {
    if (filter === 'configured') return p.configured
    if (filter === 'supported') return p.configured && p.supportBalance
    return true
  })

  const configuredCount = providers.filter(p => p.configured).length

  if (loading) {
    return (
      <div className={css.root}>
        <div className={css.loadingState}>{t('loading')}</div>
      </div>
    )
  }

  const allProviders = [...providers, ...customProviders.map(cp => ({
    ...cp,
    configured: false,
    supportBalance: false,
  }))]

  const filteredAll = allProviders.filter(p => {
    if (filter === 'configured') return p.configured
    if (filter === 'supported') return p.configured && p.supportBalance
    return true
  })

  return (
    <div className={css.root}>
      <div className={css.header}>
        <div className={css.titleGroup}>
          <h2 className={css.title}>{t('title')}</h2>
          <p className={css.subtitle}>{t('subtitle')}</p>
        </div>
        <div className={css.actions}>
          <button className={css.refreshAllBtn} onClick={refreshAll}>{t('refreshAll')}</button>
        </div>
      </div>

      <div className={css.toolbar}>
        <div className={css.filters}>
          <button
            className={`${css.filterBtn} ${filter === 'all' ? css.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('allProviders')} ({allProviders.length})
          </button>
          <button
            className={`${css.filterBtn} ${filter === 'configured' ? css.filterActive : ''}`}
            onClick={() => setFilter('configured')}
          >
            {t('configured')} ({configuredCount})
          </button>
          <button
            className={`${css.filterBtn} ${filter === 'supported' ? css.filterActive : ''}`}
            onClick={() => setFilter('supported')}
          >
            {t('withBalance')} ({providers.filter(p => p.configured && p.supportBalance).length})
          </button>
        </div>
      </div>

      <div className={css.grid}>
        {filteredAll.map(p => (
          <ProviderCard
            key={p.id}
            provider={p}
            balance={balances[p.id]?.data ?? null}
            loading={balances[p.id]?.loading ?? false}
            onRefresh={() => void queryBalance(p.id)}
            onEdit={!p.id.startsWith('custom-') ? () => setEditingProvider(p) : undefined}
            onRemove={p.id.startsWith('custom-') ? () => handleRemoveCustom(p.id) : undefined}
            t={t}
          />
        ))}
        <button className={css.addCard} onClick={() => setShowAddDialog(true)}>
          <span className={css.addIcon}>+</span>
          <span className={css.addLabel}>{t('addCustomProvider')}</span>
        </button>
      </div>

      {showAddDialog && (
        <AddProviderDialog t={t} onClose={() => setShowAddDialog(false)} onAdd={handleAddCustom} />
      )}
      {editingProvider && (
        <ProviderQueryDialog
          t={t}
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSave={(config) => handleEditSave(editingProvider.id, config)}
          onReset={() => handleEditReset(editingProvider.id)}
        />
      )}
    </div>
  )
}
