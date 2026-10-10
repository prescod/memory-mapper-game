declare module '@micropython/micropython-webassembly-pyscript' {
  export function loadMicroPython(options?: {
    /** Location of `micropython.wasm`; defaults to beside the script. */
    url?: string
    heapsize?: number
    stdout?: (line: string) => void
    stderr?: (line: string) => void
  }): Promise<{
    runPython(code: string): unknown
    globals: { get(name: string): unknown; set(name: string, value: unknown): void }
  }>
}
