import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'

declare module '@deepseek-ai/cordis' {
  interface Context {
    effect<T>(effect: () => T, name?: string): T
    credentials: CredentialProvider
    webServer: {
      register(route: {
        kind: 'prefix' | 'exact'
        path: string
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
      }): () => void
    }
  }
}
