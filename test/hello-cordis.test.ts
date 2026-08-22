import { describe, expect, it, vi } from 'vitest'
import { Context } from '../src/index'
import { englishGreeter } from '../examples/hello-cordis/english-greeter'
import { chineseGreeter } from '../examples/hello-cordis/chinese-greeter'
import { logger } from '../examples/hello-cordis/logger'
import { analytics } from '../examples/hello-cordis/analytics'
import { app } from '../examples/hello-cordis/app'

function captureConsole() {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.join(' '))
  })
  return { lines, restore: () => spy.mockRestore() }
}

describe('HelloCordis（建立在 MiniCordis 上）', () => {
  it('greeter 不存在时，App 不激活，Logger/Analytics 也没有任何输出', () => {
    const ctx = new Context()
    const { lines, restore } = captureConsole()

    ctx.plugin(logger)
    ctx.plugin(analytics)
    ctx.plugin(app)

    expect(lines).toEqual([])
    restore()
  })

  it('EnglishGreeter 加载后，App 自动激活，Logger 和 Analytics 都收到 greet 事件', () => {
    const ctx = new Context()
    const { lines, restore } = captureConsole()

    ctx.plugin(logger)
    ctx.plugin(analytics)
    ctx.plugin(app)
    ctx.plugin(englishGreeter)

    expect(lines).toEqual([
      '[App] Hello, Alex!',
      '[LOG] greeted Alex',
      '[ANALYTICS] Alex said hi',
    ])
    restore()
  })

  it('卸载 EnglishGreeter 后 App 自动 deactivate；重新装 ChineseGreeter 后 App 自动 reactivate', () => {
    const ctx = new Context()
    const { lines, restore } = captureConsole()

    ctx.plugin(logger)
    ctx.plugin(analytics)
    ctx.plugin(app)
    const disposeEnglish = ctx.plugin(englishGreeter)
    lines.length = 0 // 只关心接下来发生的事

    disposeEnglish()
    expect(lines).toEqual(['[App] deactivated (greeter unavailable)'])

    lines.length = 0
    ctx.plugin(chineseGreeter)
    expect(lines).toEqual([
      '[App] 你好，Alex！',
      '[LOG] greeted Alex',
      '[ANALYTICS] Alex said hi',
    ])

    restore()
  })

  it('App 全程没有 import 任何具体 Greeter 实现', async () => {
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('../examples/hello-cordis/app.ts', import.meta.url), 'utf-8'),
    )
    expect(source).not.toContain('english-greeter')
    expect(source).not.toContain('chinese-greeter')
  })
})
