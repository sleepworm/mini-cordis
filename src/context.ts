import type { Plugin } from './plugin'

export class Context {
  private services = new Map<string, unknown>()

  provide(name: string, service: unknown): void {
    this.services.set(name, service)
  }

  get(name: string): unknown {
    return this.services.get(name)
  }

  has(name: string): boolean {
    return this.services.has(name)
  }

  remove(name: string): void {
    this.services.delete(name)
  }

  plugin(fn: Plugin): void {
    fn(this)
  }
}
