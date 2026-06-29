declare module 'js-dos' {
  export type DosPlayer = {
    run: (bundleUrl: string) => Promise<unknown> | void
    stop: () => void
  }

  export type DosPlayerFactoryType = (root: HTMLElement) => DosPlayer
}
