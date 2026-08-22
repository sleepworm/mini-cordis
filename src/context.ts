export class Context {
  private services = new Map<string, unknown>()

  provide(name: string, service: unknown): void {
    this.services.set(name, service)
  }

  get(name: string): unknown {
    return this.services.get(name)
  }
}
