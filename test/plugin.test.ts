import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import type { Plugin } from '../src/plugin'

describe('Plugin', () => {
  it('plugin 函数会被调用，并收到 ctx', () => {
    const ctx = new Context()
    let received: Context | undefined

    const plugin: Plugin = (ctx) => {
      received = ctx
    }
    ctx.plugin(plugin)

    expect(received).toBe(ctx)
  })

  it('plugin 可以通过 ctx.provide 向 Context 注册能力', () => {
    const ctx = new Context()

    const greeterPlugin: Plugin = (ctx) => {
      ctx.provide('greeter', {
        greet: (name: string) => `Hello, ${name}!`,
      })
    }

    ctx.plugin(greeterPlugin)

    const greeter = ctx.get('greeter') as { greet(name: string): string }
    expect(greeter.greet('Alex')).toBe('Hello, Alex!')
  })

  it('可以安装多个 plugin，互不干扰', () => {
    const ctx = new Context()

    const greeterPlugin: Plugin = (ctx) => {
      ctx.provide('greeter', { greet: (name: string) => `Hello, ${name}!` })
    }
    const loggerPlugin: Plugin = (ctx) => {
      ctx.provide('logger', { log: (msg: string) => msg })
    }

    ctx.plugin(greeterPlugin)
    ctx.plugin(loggerPlugin)

    expect(ctx.has('greeter')).toBe(true)
    expect(ctx.has('logger')).toBe(true)
  })
})
