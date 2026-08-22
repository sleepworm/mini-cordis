import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import type { Plugin } from '../src/plugin'

describe('Event Bus', () => {
  it('listener 能收到事件', () => {
    const ctx = new Context()
    let received: string | undefined

    ctx.on('greet', (name: string) => {
      received = name
    })
    ctx.emit('greet', 'Alex')

    expect(received).toBe('Alex')
  })

  it('多个 listener 能同时收到同一个事件', () => {
    const ctx = new Context()
    const calls: string[] = []

    ctx.on('greet', () => calls.push('logger'))
    ctx.on('greet', () => calls.push('analytics'))
    ctx.emit('greet', 'Alex')

    expect(calls).toEqual(['logger', 'analytics'])
  })

  it('emit 一个没有 listener 的事件不报错，也没有任何效果', () => {
    const ctx = new Context()
    expect(() => ctx.emit('nobody-listens')).not.toThrow()
  })

  it('dispose plugin 后，它注册的 listener 自动消失', () => {
    const ctx = new Context()
    const calls: string[] = []

    const loggerPlugin: Plugin = (ctx) => {
      ctx.on('greet', (name: string) => {
        calls.push(`[LOG] greeted ${name}`)
      })
    }

    const disposeLogger = ctx.plugin(loggerPlugin)
    ctx.emit('greet', 'Alex')
    expect(calls).toEqual(['[LOG] greeted Alex'])

    disposeLogger()
    ctx.emit('greet', 'Alex')

    // dispose 之后再 emit，calls 长度不应该增加
    expect(calls).toEqual(['[LOG] greeted Alex'])
  })

  it('Greeter emit greet，Logger 监听 —— 两者互不知道对方存在', () => {
    const ctx = new Context()
    const logs: string[] = []

    const greeterPlugin: Plugin = (ctx) => {
      ctx.effect(() => {
        ctx.provide('greeter', {
          greet(name: string) {
            const message = `Hello, ${name}!`
            ctx.emit('greet', name)
            return message
          },
        })
        return () => ctx.remove('greeter')
      })
    }
    const loggerPlugin: Plugin = (ctx) => {
      ctx.on('greet', (name: string) => {
        logs.push(`[LOG] greeted ${name}`)
      })
    }

    ctx.plugin(greeterPlugin)
    ctx.plugin(loggerPlugin)

    const greeter = ctx.get('greeter') as { greet(name: string): string }
    const message = greeter.greet('Alex')

    expect(message).toBe('Hello, Alex!')
    expect(logs).toEqual(['[LOG] greeted Alex'])
  })
})
