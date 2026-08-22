import type { Plugin } from './plugin'
import type { Listener } from './event'
import { MissingDependencyError } from './dependency'

type Cleanup = () => void
type EffectSetup = () => Cleanup | void

interface Injection {
  names: string[]
  callback: (ctx: Context) => void
  // 当前是否处于"激活"状态：非 null 表示激活时开的 scope 的 dispose 函数。
  dispose: (() => void) | null
}

export class Context {
  private services = new Map<string, unknown>()
  private cleanups: Cleanup[] = []
  // 当前"活跃 scope"：effect() 把新的 cleanup 记到这里，而不是永远记到根 cleanups。
  // plugin()/inject() 激活期间会把它临时指向自己的 scope，执行完再指回来。
  private currentScope: Cleanup[] = this.cleanups
  private listeners = new Map<string, Set<Listener>>()
  private injections = new Set<Injection>()

  provide(name: string, service: unknown): void {
    this.services.set(name, service)
    this.reevaluateAll()
  }

  get(name: string): unknown {
    return this.services.get(name)
  }

  has(name: string): boolean {
    return this.services.has(name)
  }

  remove(name: string): void {
    this.services.delete(name)
    this.reevaluateAll()
  }

  effect(setup: EffectSetup): void {
    const cleanup = setup()
    if (cleanup) {
      this.currentScope.push(cleanup)
    }
  }

  // 依次执行 scope 里的 cleanup（LIFO），单个 cleanup 抛错不会中断其余的：
  // 抛错的那个被上报（reportError），循环继续处理剩下的。
  // dispose() 和 runInScope() 返回的 dispose 函数都靠它——一个 scope 的 dispose
  // 本身常常又是父 scope 里的一个 cleanup，如果它自己抛错，父 scope 剩下的
  // 兄弟 cleanup 不应该被连累，所以这个方法保证：teardown() 本身永远不抛错。
  private teardown(scope: Cleanup[]): void {
    while (scope.length) {
      const cleanup = scope.pop()!
      try {
        cleanup()
      } catch (error) {
        this.reportError(error)
      }
    }
  }

  private reportError(error: unknown): void {
    this.emit('error', error)
  }

  // 打开一个新 scope，跑 fn，跑完把 currentScope 指回去，返回可以撤销这个 scope 的 dispose()。
  // plugin() 和 inject() 的"激活"共用这一套机制——对 Context 来说，
  // "安装一个 Plugin"和"依赖满足后激活一段代码"没有本质区别，都是"开一个可撤销的 scope"。
  //
  // 如果 fn 本身抛错（安装/激活失败），已经注册的那部分 effect 会被立刻回滚
  // （尽量执行 cleanup），错误上报给 'error' 事件，返回一个空操作的 dispose——
  // 调用方（plugin()/activate()）不需要单独处理这种情况，还是能正常拿到一个
  // dispose 函数，只是它什么都不用做。
  private runInScope(fn: (ctx: Context) => void): () => void {
    const parentScope = this.currentScope
    const scope: Cleanup[] = []

    this.currentScope = scope
    try {
      fn(this)
    } catch (error) {
      this.currentScope = parentScope
      this.teardown(scope)
      this.reportError(error)
      return () => {}
    }
    this.currentScope = parentScope

    let disposed = false
    return () => {
      if (disposed) return
      disposed = true
      this.teardown(scope)
    }
  }

  plugin(fn: Plugin): () => void {
    const parentScope = this.currentScope
    const dispose = this.runInScope(fn)

    // 把这个 plugin 的 dispose 本身注册成父 scope 的一个 cleanup：
    // 父 scope（可能是根 Context，也可能是外层 plugin）被撤销时，会级联撤销这里。
    parentScope.push(dispose)

    return dispose
  }

  on(event: string, listener: Listener): void {
    // on() 本身就是一个 effect：listener 记到 currentScope，
    // 所以它会随"注册它的那个 plugin"被卸载而自动移除，不需要额外手写 off()。
    this.effect(() => {
      let set = this.listeners.get(event)
      if (!set) {
        set = new Set()
        this.listeners.set(event, set)
      }
      set.add(listener)

      return () => {
        set!.delete(listener)
      }
    })
  }

  emit(event: string, ...args: unknown[]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of set) {
      listener(...args)
    }
  }

  require(names: string[], callback: (ctx: Context) => void): void {
    const missing = names.filter((name) => !this.has(name))
    if (missing.length) {
      throw new MissingDependencyError(missing)
    }
    callback(this)
  }

  // 和 require() 的区别：inject() 不是"此刻检查一次"，而是长期订阅。
  // 依赖满足就激活 callback，依赖消失就撤销 callback 造成的一切，
  // 依赖再次满足会重新激活——完全响应式，调用方不需要自己写轮询或重试。
  inject(names: string[], callback: (ctx: Context) => void): () => void {
    const injection: Injection = { names, callback, dispose: null }
    this.injections.add(injection)
    this.reevaluate(injection)

    let disposed = false
    const dispose = () => {
      if (disposed) return
      disposed = true
      this.deactivate(injection)
      this.injections.delete(injection)
    }

    this.currentScope.push(dispose)

    return dispose
  }

  private isSatisfied(injection: Injection): boolean {
    return injection.names.every((name) => this.has(name))
  }

  private activate(injection: Injection): void {
    if (injection.dispose) return
    injection.dispose = this.runInScope(injection.callback)
  }

  private deactivate(injection: Injection): void {
    if (!injection.dispose) return
    const dispose = injection.dispose
    injection.dispose = null
    dispose()
  }

  private reevaluate(injection: Injection): void {
    if (this.isSatisfied(injection)) {
      this.activate(injection)
    } else {
      this.deactivate(injection)
    }
  }

  private reevaluateAll(): void {
    for (const injection of this.injections) {
      this.reevaluate(injection)
    }
  }

  dispose(): void {
    this.teardown(this.cleanups)
  }
}
