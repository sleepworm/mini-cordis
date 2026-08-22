import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'

describe('Service Registry', () => {
  it('service 可以注册并取回', () => {
    const ctx = new Context()
    const greeter = { greet: (name: string) => `Hello, ${name}!` }

    ctx.provide('greeter', greeter)

    expect(ctx.get('greeter')).toBe(greeter)
  })

  it('service 可以被调用', () => {
    const ctx = new Context()
    ctx.provide('greeter', {
      greet: (name: string) => `Hello, ${name}!`,
    })

    const greeter = ctx.get('greeter') as { greet(name: string): string }
    expect(greeter.greet('Alex')).toBe('Hello, Alex!')
  })

  it('获取不存在的 service 时返回 undefined', () => {
    const ctx = new Context()
    expect(ctx.get('does-not-exist')).toBeUndefined()
  })

  it('重复 provide 同一个 name 时，后一次覆盖前一次（教学版策略，非真实 Cordis 行为）', () => {
    const ctx = new Context()
    const first = { greet: () => 'first' }
    const second = { greet: () => 'second' }

    ctx.provide('greeter', first)
    ctx.provide('greeter', second)

    expect(ctx.get('greeter')).toBe(second)
  })
})

describe('Service Removal', () => {
  it('has() 在 provide 之后为 true，remove 之后为 false', () => {
    const ctx = new Context()
    const greeter = { greet: (name: string) => `Hello, ${name}!` }

    expect(ctx.has('greeter')).toBe(false)
    ctx.provide('greeter', greeter)
    expect(ctx.has('greeter')).toBe(true)

    ctx.remove('greeter')
    expect(ctx.has('greeter')).toBe(false)
  })

  it('remove 之后 get 返回 undefined', () => {
    const ctx = new Context()
    ctx.provide('greeter', { greet: (name: string) => `Hello, ${name}!` })

    ctx.remove('greeter')

    expect(ctx.get('greeter')).toBeUndefined()
  })

  it('remove 一个从未 provide 过的 name 不报错', () => {
    const ctx = new Context()
    expect(() => ctx.remove('does-not-exist')).not.toThrow()
  })
})
