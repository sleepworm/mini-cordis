import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/index'

describe('smoke', () => {
  it('project can run', () => {
    expect(VERSION).toBe('0.10.0')
  })
})
