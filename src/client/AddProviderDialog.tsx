import { useState } from 'react'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './add-provider-dialog.module.css'

export interface CustomProvider {
  id: string
  name: string
  nameZh: string
  baseUrl: string
  apiKeyEnv: string
  consoleUrl: string
  limitType: 'credit' | 'time' | 'usage'
}

interface AddProviderDialogProps extends PropsLocale<typeof NS> {
  onClose: () => void
  onAdd: (provider: CustomProvider) => void
}

export function AddProviderDialog({ t, onClose, onAdd }: AddProviderDialogProps): JSX.Element {
  const [name, setName] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [limitType, setLimitType] = useState<'credit' | 'time' | 'usage'>('credit')
  const [consoleUrl, setConsoleUrl] = useState('')
  const [apiKeyEnv, setApiKeyEnv] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')

  const canSubmit = name.trim() !== '' && apiKeyEnv.trim() !== '' && baseUrl.trim() !== ''

  async function handleTest() {
    setTestState('testing')
    try {
      const envVar = apiKeyEnv.trim()
      const base = baseUrl.trim().replace(/\/$/, '')
      const url = `${base}${/\/v1$/i.test(base) ? '/models' : '/v1/models'}`
      const res = await fetch('/dsh-usage-monitor-api/test-provider', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ envVar, url }),
      })
      const data = await res.json()
      setTestState(data.ok ? 'ok' : 'fail')
    } catch {
      setTestState('fail')
    }
    setTimeout(() => setTestState('idle'), 3000)
  }

  function handleSubmit() {
    if (!canSubmit) return
    const id = `custom-${name.trim().toLowerCase().replace(/\s+/g, '-')}`
    onAdd({
      id,
      name: name.trim(),
      nameZh: nameZh.trim() || name.trim(),
      baseUrl: baseUrl.trim(),
      apiKeyEnv: apiKeyEnv.trim(),
      consoleUrl: consoleUrl.trim(),
      limitType,
    })
    onClose()
  }

  return (
    <div className={css.modal} onClick={onClose}>
      <section className={css.dialog} role="dialog" aria-modal="true" aria-labelledby="add-provider-title" onClick={(e) => e.stopPropagation()}>
        <header className={css.header}>
          <h3 id="add-provider-title" className={css.title}>{t('addCustomProvider')}</h3>
          <button type="button" className={css.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div className={css.body}>
          <label className={css.field}>
            <span className={css.label}>{t('providerName')} <span className={css.required}>*</span></span>
            <input className={css.input} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My LLM Provider" />
          </label>

          <label className={css.field}>
            <span className={css.label}>{t('providerNameZh')}</span>
            <input className={css.input} type="text" value={nameZh} onChange={(e) => setNameZh(e.target.value)} placeholder="e.g. 我的供应商" />
          </label>

          <label className={css.field}>
            <span className={css.label}>{t('billingType')} <span className={css.required}>*</span></span>
            <div className={css.radioGroup}>
              <label className={css.radioLabel}>
                <input type="radio" name="limitType" value="credit" checked={limitType === 'credit'} onChange={() => setLimitType('credit')} />
                <span>{t('creditLimit')}</span>
              </label>
              <label className={css.radioLabel}>
                <input type="radio" name="limitType" value="time" checked={limitType === 'time'} onChange={() => setLimitType('time')} />
                <span>{t('timeLimit')}</span>
              </label>
            </div>
          </label>

          <label className={css.field}>
            <span className={css.label}>{t('apiKeyEnvVar')} <span className={css.required}>*</span></span>
            <div className={css.inputRow}>
              <input className={css.input} type="text" value={apiKeyEnv} onChange={(e) => setApiKeyEnv(e.target.value)} placeholder="e.g. MY_API_KEY" />
              <button
                type="button"
                className={`${css.testBtn} ${testState === 'ok' ? css.testOk : ''} ${testState === 'fail' ? css.testFail : ''}`}
                onClick={handleTest}
                disabled={!apiKeyEnv.trim() || !baseUrl.trim() || testState === 'testing'}
              >
                {testState === 'testing' ? '...' : testState === 'ok' ? '✓' : testState === 'fail' ? '✗' : t('test')}
              </button>
            </div>
          </label>

          <label className={css.field}>
            <span className={css.label}>{t('consoleUrl')}</span>
            <input className={css.input} type="url" value={consoleUrl} onChange={(e) => setConsoleUrl(e.target.value)} placeholder="https://..." />
          </label>

          <label className={css.field}>
            <span className={css.label}>{t('baseUrl')} <span className={css.required}>*</span></span>
            <input className={css.input} type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
          </label>
        </div>

        <footer className={css.footer}>
          <button type="button" className={css.cancelBtn} onClick={onClose}>{t('cancel')}</button>
          <button type="button" className={css.submitBtn} disabled={!canSubmit} onClick={handleSubmit}>{t('add')}</button>
        </footer>
      </section>
    </div>
  )
}
