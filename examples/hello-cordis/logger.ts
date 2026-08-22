import type { Plugin } from '../../src/index'

export const logger: Plugin = (ctx) => {
  ctx.on('greet', (name: string) => {
    console.log(`[LOG] greeted ${name}`)
  })
}
