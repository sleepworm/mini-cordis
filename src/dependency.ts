export class MissingDependencyError extends Error {
  constructor(public readonly missing: string[]) {
    super(`missing dependency: ${missing.join(', ')}`)
    this.name = 'MissingDependencyError'
  }
}
