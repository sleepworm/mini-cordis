import type { Plugin } from '../../src/index'

export const englishGreeter: Plugin = (ctx) => {
  ctx.effect(() => {
    ctx.provide('greeter', {
      greet(name: string) {
        return `Hello, ${name}!`
      },
    })
    return () => ctx.remove('greeter')
  })
}
