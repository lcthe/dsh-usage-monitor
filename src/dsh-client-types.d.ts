declare module '@deepseek-ai/cordis' {
  interface Context {
    modelDirectories: {
      directoryFor(sessionId: string): {
        store: {
          subscribe: (fn: () => void) => () => void
          getSnapshot: () => { current?: { provider: string; model: string } | null }
        }
        load(): Promise<unknown>
        select(selection: unknown): Promise<void>
      }
    }
    sessions: {
      subagentAddress(sessionId: string): unknown
    }
  }
}
