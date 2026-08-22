import { Context } from '../../src/index'
import { englishGreeter } from './english-greeter'
import { chineseGreeter } from './chinese-greeter'
import { logger } from './logger'
import { analytics } from './analytics'
import { app } from './app'

function main() {
  console.log('=== Context start ===')
  const ctx = new Context()

  console.log('\n=== Logger + Analytics installed ===')
  ctx.plugin(logger)
  ctx.plugin(analytics)

  console.log('\n=== App installed (waits for greeter) ===')
  ctx.plugin(app)

  console.log('\n=== EnglishGreeter installed ===')
  const disposeEnglish = ctx.plugin(englishGreeter)

  console.log('\n=== EnglishGreeter unloaded ===')
  disposeEnglish()

  console.log('\n=== ChineseGreeter installed ===')
  ctx.plugin(chineseGreeter)
}

main()
