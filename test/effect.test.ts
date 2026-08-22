import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import type { Plugin } from '../src/plugin'

describe('Reversible Effect', () => {
  it('effect 的 setup 会立即执行', () => {
    const ctx = new Context()
    let ran = false

    ctx.effect(() => {
      ran = true
    })

    expect(ran).toBe(true)
  })

  it('dispose 会执行 cleanup', () => {
    const ctx = new Context()
    let disposed = false

    ctx.effect(() => {
      return () => {
        disposed = true
      }
    })

    expect(disposed).toBe(false)
    ctx.dispose()
    expect(disposed).toBe(true)
  })

  it('没有返回 cleanup 的 effect，dispose 时安全跳过', () => {
    const ctx = new Context()
    ctx.effect(() => {
      // 没有 return，不需要 cleanup
    })

    expect(() => ctx.dispose()).not.toThrow()
  })

  it('多个 cleanup 按后进先出的顺序执行', () => {
    const ctx = new Context()
    const order: number[] = []

    ctx.effect(() => () => order.push(1))
    ctx.effect(() => () => order.push(2))
    ctx.effect(() => () => order.push(3))

    ctx.dispose()

    expect(order).toEqual([3, 2, 1])
  })

  it('重复调用 dispose 是安全的 no-op', () => {
    const ctx = new Context()
    let count = 0
    ctx.effect(() => () => {
      count += 1
    })

    ctx.dispose()
    ctx.dispose()

    expect(count).toBe(1)
  })

  it('greeter plugin 改造成可逆之后，dispose 会移除它 provide 的 service', () => {
    const ctx = new Context()

    const greeterPlugin: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('greeter', { greet: (name: string) => `Hello, ${name}!` })
        return () => {
          ctx.remove('greeter')
        }
      })
    }

    ctx.plugin(greeterPlugin)
    expect(ctx.has('greeter')).toBe(true)

    ctx.dispose()
    expect(ctx.has('greeter')).toBe(false)
  })
})
