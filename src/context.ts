import type { Plugin } from './plugin'

type Cleanup = () => void
type EffectSetup = () => Cleanup | void

export class Context {
  private services = new Map<string, unknown>()
  private cleanups: Cleanup[] = []

  provide(name: string, service: unknown): void {
    this.services.set(name, service)
  }

  get(name: string): unknown {
    return this.services.get(name)
  }

  has(name: string): boolean {
    return this.services.has(name)
  }

  remove(name: string): void {
    this.services.delete(name)
  }

  plugin(fn: Plugin): void {
    fn(this)
  }

  effect(setup: EffectSetup): void {
    const cleanup = setup()
    if (cleanup) {
      this.cleanups.push(cleanup)
    }
  }

  dispose(): void {
    // 后进先出：后注册的 effect 先撤销，对称于"后安装的东西依赖先安装的东西"这个常见假设。
    while (this.cleanups.length) {
      const cleanup = this.cleanups.pop()!
      cleanup()
    }
  }
}
