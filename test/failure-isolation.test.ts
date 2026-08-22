import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import type { Plugin } from '../src/plugin'

describe('Plugin Failure Isolation', () => {
  it('plugin 安装时抛错，会被上报为 error 事件，不会让调用方的代码崩溃', () => {
    const ctx = new Context()
    const errors: unknown[] = []
    ctx.on('error', (error: unknown) => errors.push(error))

    const brokenPlugin: Plugin = () => {
      throw new Error('plugin failed')
    }

    expect(() => ctx.plugin(brokenPlugin)).not.toThrow()
    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe('plugin failed')
  })

  it('Plugin A 安装失败，不影响 Plugin B 正常安装', () => {
    const ctx = new Context()
    ctx.on('error', () => {}) // 消费掉错误，避免测试输出里出现未处理异常的噪音

    const brokenPlugin: Plugin = () => {
      throw new Error('plugin A failed')
    }
    const goodPlugin: Plugin = (ctx) => {
      ctx.provide('b', 'service-b')
    }

    ctx.plugin(brokenPlugin)
    ctx.plugin(goodPlugin)

    expect(ctx.has('b')).toBe(true)
  })

  it('plugin 安装时半途抛错，之前已经注册的 effect 会被回滚', () => {
    const ctx = new Context()
    ctx.on('error', () => {})

    const partiallyBrokenPlugin: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('a', 'service-a')
        return () => ctx.remove('a')
      })
      throw new Error('boom after registering a')
    }

    ctx.plugin(partiallyBrokenPlugin)

    // 'a' 应该已经被回滚撤销了，不会遗留在 Context 上
    expect(ctx.has('a')).toBe(false)
  })

  it('dispose 阶段某个 cleanup 抛错，不影响同一个 scope 里其他 cleanup 执行', () => {
    const ctx = new Context()
    ctx.on('error', () => {})

    const order: string[] = []
    const plugin: Plugin = (ctx) => {
      ctx.effect(() => () => order.push('cleanup 1'))
      ctx.effect(() => () => {
        throw new Error('cleanup 2 failed')
      })
      ctx.effect(() => () => order.push('cleanup 3'))
    }

    const dispose = ctx.plugin(plugin)
    dispose()

    // cleanup 3 和 cleanup 1 都应该执行了（LIFO：3 先于 1），只是 cleanup 2 抛错被跳过
    expect(order).toEqual(['cleanup 3', 'cleanup 1'])
  })

  it('dispose 阶段某个 plugin 的 cleanup 抛错，不影响另一个 plugin 的 cleanup 执行', () => {
    const ctx = new Context()
    ctx.on('error', () => {})

    const cleaned: string[] = []
    const brokenPlugin: Plugin = (ctx) => {
      ctx.effect(() => () => {
        throw new Error('A cleanup failed')
      })
    }
    const goodPlugin: Plugin = (ctx) => {
      ctx.effect(() => () => cleaned.push('B cleaned up'))
    }

    ctx.plugin(brokenPlugin)
    ctx.plugin(goodPlugin)

    ctx.dispose()

    expect(cleaned).toEqual(['B cleaned up'])
  })

  it('inject callback 激活时抛错，同样被隔离且上报', () => {
    const ctx = new Context()
    const errors: unknown[] = []
    ctx.on('error', (error: unknown) => errors.push(error))

    ctx.inject(['greeter'], () => {
      throw new Error('injection activation failed')
    })

    expect(() => ctx.provide('greeter', {})).not.toThrow()
    expect(errors).toHaveLength(1)
  })
})
