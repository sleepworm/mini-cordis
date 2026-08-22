import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import type { Plugin } from '../src/plugin'

describe('Reactive Dependency Lifecycle', () => {
  it('依赖缺失时，inject 的 callback 不会执行', () => {
    const ctx = new Context()
    let active = false

    ctx.inject(['greeter'], () => {
      active = true
    })

    expect(active).toBe(false)
  })

  it('依赖满足时（先注册 inject，后 provide），callback 自动激活', () => {
    const ctx = new Context()
    let active = false

    ctx.inject(['greeter'], () => {
      active = true
    })
    expect(active).toBe(false)

    ctx.provide('greeter', { greet: (n: string) => `Hello, ${n}!` })
    expect(active).toBe(true)
  })

  it('依赖已经满足时（先 provide，后 inject），callback 立即激活', () => {
    const ctx = new Context()
    ctx.provide('greeter', {})

    let active = false
    ctx.inject(['greeter'], () => {
      active = true
    })

    expect(active).toBe(true)
  })

  it('依赖被 remove 后，callback 内部注册的 effect 会被自动 cleanup（deactivate）', () => {
    const ctx = new Context()
    ctx.provide('greeter', {})

    let cleaned = false
    ctx.inject(['greeter'], (ctx) => {
      ctx.effect(() => {
        return () => {
          cleaned = true
        }
      })
    })

    expect(cleaned).toBe(false)
    ctx.remove('greeter')
    expect(cleaned).toBe(true)
  })

  it('依赖重新 provide 后，callback 会重新激活', () => {
    const ctx = new Context()
    const log: string[] = []

    ctx.inject(['greeter'], () => {
      log.push('active')
    })

    ctx.provide('greeter', {})
    ctx.remove('greeter')
    ctx.provide('greeter', {})

    expect(log).toEqual(['active', 'active'])
  })

  it('完整生命周期：missing → added → active → removed → disposed → added again → active again', () => {
    const ctx = new Context()
    const log: string[] = []

    // missing
    const dispose = ctx.inject(['greeter'], (ctx) => {
      log.push('active')
      ctx.effect(() => () => log.push('disposed'))
    })
    expect(log).toEqual([])

    // added → active
    ctx.provide('greeter', {})
    expect(log).toEqual(['active'])

    // removed → disposed
    ctx.remove('greeter')
    expect(log).toEqual(['active', 'disposed'])

    // added again → active again
    ctx.provide('greeter', {})
    expect(log).toEqual(['active', 'disposed', 'active'])

    dispose()
  })

  it('dispose() 之后，即使依赖重新满足，callback 也不会再被激活', () => {
    const ctx = new Context()
    const log: string[] = []

    const dispose = ctx.inject(['greeter'], () => {
      log.push('active')
    })
    ctx.provide('greeter', {})
    expect(log).toEqual(['active'])

    dispose()
    ctx.remove('greeter')
    ctx.provide('greeter', {})

    expect(log).toEqual(['active'])
  })

  it('App inject greeter，Greeter 通过 plugin 加载/卸载/重新加载，App 自动跟着变化', () => {
    const ctx = new Context()
    const log: string[] = []

    ctx.inject(['greeter'], (ctx) => {
      const greeter = ctx.get('greeter') as { greet(name: string): string }
      log.push(greeter.greet('Alex'))
    })

    const greeterPlugin: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('greeter', { greet: (name: string) => `Hello, ${name}!` })
        return () => ctx.remove('greeter')
      })
    }

    expect(log).toEqual([])

    const disposeGreeter = ctx.plugin(greeterPlugin)
    expect(log).toEqual(['Hello, Alex!'])

    disposeGreeter()
    ctx.plugin(greeterPlugin)
    expect(log).toEqual(['Hello, Alex!', 'Hello, Alex!'])
  })
})
