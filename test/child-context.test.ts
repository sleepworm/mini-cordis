import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'

describe('Child Context', () => {
  it('child 继承 parent 的 service', () => {
    const root = new Context()
    root.provide('shared', 'root-value')

    const child = root.fork()

    expect(child.has('shared')).toBe(true)
    expect(child.get('shared')).toBe('root-value')
  })

  it('child 可以注册自己的 service，不影响 parent', () => {
    const root = new Context()
    const child = root.fork()

    child.provide('child-only', 'value')

    expect(child.has('child-only')).toBe(true)
    expect(root.has('child-only')).toBe(false)
  })

  it('child 的同名 service 覆盖 parent 的（child 优先）', () => {
    const root = new Context()
    root.provide('greeter', { greet: () => 'Hello from root' })

    const child = root.fork()
    child.provide('greeter', { greet: () => 'Hello from child' })

    const childGreeter = child.get('greeter') as { greet(): string }
    const rootGreeter = root.get('greeter') as { greet(): string }

    expect(childGreeter.greet()).toBe('Hello from child')
    expect(rootGreeter.greet()).toBe('Hello from root') // root 完全没被改动
  })

  it('child remove 掉本地覆盖之后，重新看到 parent 的版本', () => {
    const root = new Context()
    root.provide('greeter', 'root-greeter')

    const child = root.fork()
    child.provide('greeter', 'child-greeter')
    expect(child.get('greeter')).toBe('child-greeter')

    child.remove('greeter')
    expect(child.get('greeter')).toBe('root-greeter')
  })

  it('dispose child 不影响 parent', () => {
    const root = new Context()
    root.provide('shared', 'root-value')

    const child = root.fork()
    child.provide('child-only', 'value')

    child.dispose()

    expect(root.has('shared')).toBe(true)
    expect(root.has('child-only')).toBe(false) // 本来就不在 root 上
  })

  it('dispose parent 时，child 也会被级联 dispose', () => {
    const root = new Context()
    const child = root.fork()

    let childCleaned = false
    child.effect(() => {
      return () => {
        childCleaned = true
      }
    })

    root.dispose()

    expect(childCleaned).toBe(true)
  })

  it('parent 之后再 provide 新 service，已经 fork 出去的 child 也能读到（因为 get 是实时往上问的）', () => {
    const root = new Context()
    const child = root.fork()

    expect(child.has('later')).toBe(false)

    root.provide('later', 'value')

    expect(child.has('later')).toBe(true)
    expect(child.get('later')).toBe('value')
  })
})
