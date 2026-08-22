import type { Plugin } from '../../src/index'

// App 完全不 import 具体的 Greeter 实现，只用 ctx.inject() 声明依赖 'greeter'。
// 依赖满足时自动打招呼、自动 emit('greet')；依赖消失时自动"停摆"——
// 不需要像原版 HelloCordis 那样手写 if (!ctx.greeter) 判断，MiniCordis 的
// 响应式依赖（v0.9）替我们把这件事管起来了。
export const app: Plugin = (ctx) => {
  ctx.inject(['greeter'], (ctx) => {
    const greeter = ctx.get('greeter') as { greet(name: string): string }
    const message = greeter.greet('Alex')
    console.log('[App]', message)
    ctx.emit('greet', 'Alex')

    ctx.effect(() => {
      return () => {
        console.log('[App] deactivated (greeter unavailable)')
      }
    })
  })
}
