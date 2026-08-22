import type { Plugin } from '../../src/index'

export const analytics: Plugin = (ctx) => {
  ctx.on('greet', (name: string) => {
    console.log(`[ANALYTICS] ${name} said hi`)
  })
}
