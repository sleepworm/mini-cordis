import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'
import { MissingDependencyError } from '../src/dependency'

describe('Dependency Check', () => {
  it('依赖存在时，callback 会被执行', () => {
    const ctx = new Context()
    ctx.provide('greeter', { greet: (name: string) => `Hello, ${name}!` })

    let ran = false
    ctx.require(['greeter'], () => {
      ran = true
    })

    expect(ran).toBe(true)
  })

  it('依赖不存在时，抛出 MissingDependencyError，callback 不执行', () => {
    const ctx = new Context()

    let ran = false
    expect(() => {
      ctx.require(['greeter'], () => {
        ran = true
      })
    }).toThrow(MissingDependencyError)

    expect(ran).toBe(false)
  })

  it('错误里列出所有缺失的依赖，不只是第一个', () => {
    const ctx = new Context()
    ctx.provide('greeter', {})
    // 'clock' 和 'logger' 都缺失，'greeter' 存在

    try {
      ctx.require(['greeter', 'clock', 'logger'], () => {})
      expect.unreachable('应该抛出 MissingDependencyError')
    } catch (error) {
      expect(error).toBeInstanceOf(MissingDependencyError)
      expect((error as MissingDependencyError).missing).toEqual(['clock', 'logger'])
    }
  })

  it('callback 收到的 ctx 就是调用 require 的那个 Context', () => {
    const ctx = new Context()
    ctx.provide('greeter', {})

    let received: Context | undefined
    ctx.require(['greeter'], (ctx) => {
      received = ctx
    })

    expect(received).toBe(ctx)
  })
})
