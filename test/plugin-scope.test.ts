import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import type { Plugin } from '../src/plugin'

describe('Plugin Scope', () => {
  it('ctx.plugin() 返回一个只属于这个 plugin 的 dispose 函数', () => {
    const ctx = new Context()

    const greeterPlugin: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('greeter', { greet: (n: string) => `Hello, ${n}!` })
        return () => ctx.remove('greeter')
      })
    }

    const disposeGreeter = ctx.plugin(greeterPlugin)
    expect(ctx.has('greeter')).toBe(true)

    disposeGreeter()
    expect(ctx.has('greeter')).toBe(false)
  })

  it('卸载 A 不影响 B（Effect Scope 是独立的）', () => {
    const ctx = new Context()

    const pluginA: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('a', 'service-a')
        return () => ctx.remove('a')
      })
    }
    const pluginB: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('b', 'service-b')
        return () => ctx.remove('b')
      })
    }

    const disposeA = ctx.plugin(pluginA)
    ctx.plugin(pluginB)

    disposeA()

    expect(ctx.has('a')).toBe(false)
    expect(ctx.has('b')).toBe(true)
  })

  it('单个 plugin 的 dispose 重复调用是安全的 no-op', () => {
    const ctx = new Context()
    let count = 0
    const plugin: Plugin = (ctx) => {
      ctx.effect(() => () => {
        count += 1
      })
    }

    const dispose = ctx.plugin(plugin)
    dispose()
    dispose()

    expect(count).toBe(1)
  })

  it('ctx.dispose() 仍然会级联撤销所有 plugin 的 effect（不只是根级别的）', () => {
    const ctx = new Context()

    const pluginA: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('a', 'service-a')
        return () => ctx.remove('a')
      })
    }
    const pluginB: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('b', 'service-b')
        return () => ctx.remove('b')
      })
    }

    ctx.plugin(pluginA)
    ctx.plugin(pluginB)

    ctx.dispose()

    expect(ctx.has('a')).toBe(false)
    expect(ctx.has('b')).toBe(false)
  })

  it('先手动 dispose 一个 plugin，之后 ctx.dispose() 不会重复执行它的 cleanup', () => {
    const ctx = new Context()
    let count = 0
    const plugin: Plugin = (ctx) => {
      ctx.effect(() => () => {
        count += 1
      })
    }

    const dispose = ctx.plugin(plugin)
    dispose()
    ctx.dispose()

    expect(count).toBe(1)
  })
})
