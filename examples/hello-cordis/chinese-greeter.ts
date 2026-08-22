import type { Plugin } from '../../src/index'

export const chineseGreeter: Plugin = (ctx) => {
  ctx.effect(() => {
    ctx.provide('greeter', {
      greet(name: string) {
        return `你好，${name}！`
      },
    })
    return () => ctx.remove('greeter')
  })
}
