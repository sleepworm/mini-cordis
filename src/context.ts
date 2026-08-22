import type { Plugin } from './plugin'

type Cleanup = () => void
type EffectSetup = () => Cleanup | void

export class Context {
  private services = new Map<string, unknown>()
  private cleanups: Cleanup[] = []
  // 当前"活跃 scope"：effect() 把新的 cleanup 记到这里，而不是永远记到根 cleanups。
  // plugin() 执行期间会把它临时指向这个 plugin 自己的 scope，执行完再指回来。
  private currentScope: Cleanup[] = this.cleanups

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

  effect(setup: EffectSetup): void {
    const cleanup = setup()
    if (cleanup) {
      this.currentScope.push(cleanup)
    }
  }

  plugin(fn: Plugin): () => void {
    const parentScope = this.currentScope
    const scope: Cleanup[] = []

    this.currentScope = scope
    try {
      fn(this)
    } finally {
      this.currentScope = parentScope
    }

    let disposed = false
    const dispose = () => {
      if (disposed) return
      disposed = true
      while (scope.length) {
        scope.pop()!()
      }
    }

    // 把这个 plugin 的 dispose 本身注册成父 scope 的一个 cleanup：
    // 父 scope（可能是根 Context，也可能是外层 plugin）被撤销时，会级联撤销这里。
    parentScope.push(dispose)

    return dispose
  }

  dispose(): void {
    while (this.cleanups.length) {
      const cleanup = this.cleanups.pop()!
      cleanup()
    }
  }
}
