import { useState } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { QueryAuth, QueryMethod, QueryOverride } from '../query-types.ts'
import type { ProviderInfo } from './ProviderCard.tsx'
import { NS } from './locales.ts'
import css from './add-provider-dialog.module.css'

interface ProviderQueryDialogProps extends PropsLocale<typeof NS> {
  provider: ProviderInfo
  onClose: () => void
  onSave: (config: QueryOverride) => Promise<void>
  onReset: () => Promise<void>
}

export function ProviderQueryDialog({ provider, onClose, onSave, onReset, t }: ProviderQueryDialogProps): JSX.Element {
  const current = provider.queryOverride ?? provider.defaultQuery
  const [url, setUrl] = useState(current?.url ?? '')
  const [method, setMethod] = useState<QueryMethod>(current?.method ?? 'GET')
  const [auth, setAuth] = useState<QueryAuth>(current?.auth ?? 'bearer')
  const [remaining, setRemaining] = useState(current?.fields.remaining ?? '')
  const [total, setTotal] = useState(current?.fields.total ?? '')
  const [used, setUsed] = useState(current?.fields.used ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = url.trim() !== '' && (remaining.trim() !== '' || (total.trim() !== '' && used.trim() !== ''))

  async function handleSave() {
    if (!canSubmit || saving) return
    setSaving(true)
    setError('')
    try {
      await onSave({
        url: url.trim(),
        method,
        auth,
        fields: {
          remaining: remaining.trim() || undefined,
          total: total.trim() || undefined,
          used: used.trim() || undefined,
        },
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  async function handleReset() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await onReset()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <div className={css.modal} onClick={onClose}>
      <section className={css.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className={css.header}>
          <div>
            <h3 className={css.title}>{t('editQuery')}</h3>
            <p className={css.dialogHint}>{provider.nameZh || provider.name}</p>
          </div>
          <button type="button" className={css.closeBtn} onClick={onClose}>✕</button>
        </header>
        <div className={css.body}>
          <p className={css.helpText}>{t('queryHelp')}</p>
          <label className={css.field}>
            <span className={css.label}>{t('queryUrl')} <span className={css.required}>*</span></span>
            <input className={css.input} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label className={css.field}>
            <span className={css.label}>{t('queryMethod')}</span>
            <div className={css.radioGroup}>
              <label className={css.radioLabel}><input type="radio" checked={method === 'GET'} onChange={() => setMethod('GET')} />GET</label>
              <label className={css.radioLabel}><input type="radio" checked={method === 'POST'} onChange={() => setMethod('POST')} />POST</label>
            </div>
          </label>
          <label className={css.field}>
            <span className={css.label}>{t('queryAuth')}</span>
            <div className={css.radioGroup}>
              <label className={css.radioLabel}><input type="radio" checked={auth === 'bearer'} onChange={() => setAuth('bearer')} />Bearer</label>
              <label className={css.radioLabel}><input type="radio" checked={auth === 'x-api-key'} onChange={() => setAuth('x-api-key')} />X-API-Key</label>
              <label className={css.radioLabel}><input type="radio" checked={auth === 'none'} onChange={() => setAuth('none')} />{t('noAuth')}</label>
            </div>
          </label>
          <label className={css.field}>
            <span className={css.label}>{t('remainingPath')}</span>
            <input className={css.input} value={remaining} onChange={(e) => setRemaining(e.target.value)} placeholder="data.remaining" />
          </label>
          <div className={css.twoColumns}>
            <label className={css.field}>
              <span className={css.label}>{t('totalPath')}</span>
              <input className={css.input} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="data.total" />
            </label>
            <label className={css.field}>
              <span className={css.label}>{t('usedPath')}</span>
              <input className={css.input} value={used} onChange={(e) => setUsed(e.target.value)} placeholder="data.used" />
            </label>
          </div>
          {error && <p className={css.formError}>{error}</p>}
        </div>
        <footer className={css.footer}>
          {provider.hasOverride && <button type="button" className={css.cancelBtn} onClick={() => void handleReset()} disabled={saving}>{t('resetDefault')}</button>}
          <button type="button" className={css.cancelBtn} onClick={onClose} disabled={saving}>{t('cancel')}</button>
          <button type="button" className={css.submitBtn} onClick={() => void handleSave()} disabled={!canSubmit || saving}>{saving ? '...' : t('save')}</button>
        </footer>
      </section>
    </div>
  )
}
