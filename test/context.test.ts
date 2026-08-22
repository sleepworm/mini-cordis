import { describe, expect, it } from 'vitest'
import { Context } from '../src/context'

describe('Context', () => {
  it('can be constructed', () => {
    const ctx = new Context()
    expect(ctx).toBeInstanceOf(Context)
  })
})
