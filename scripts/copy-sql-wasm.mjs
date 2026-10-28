/**
 * Nitro traces sql.js into `.output/server/node_modules/sql.js` but does not
 * follow the runtime `locateFile('sql-wasm.wasm')` read, so production dies with
 * ENOENT on that wasm. Copy the binary (and a sibling .map, if present) next
 * to the traced entry. If the trace emitted no package, ship a minimal
 * resolvable sql.js so the output folder cannot shadow node_modules with an
 * incomplete directory.
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const scriptDir = dirname(fileURLToPath(import.meta.url))

const WASM_NAME = 'sql-wasm.wasm'

function isInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function sourceFiles() {
  const jsPath = require.resolve('sql.js')
  const srcDir = dirname(jsPath)
  const wasmPath = join(srcDir, WASM_NAME)
  if (!existsSync(wasmPath)) {
    throw new Error(`[copy-sql-wasm] ${wasmPath} not found`)
  }
  const mapPath = join(srcDir, `${WASM_NAME}.map`)
  const pkgDir = dirname(srcDir)
  return {
    jsPath,
    wasmPath,
    mapPath: existsSync(mapPath) ? mapPath : null,
    pkgJsonPath: join(pkgDir, 'package.json')
  }
}

function tracedDestDirs(serverDir) {
  const dirs = new Set()
  const entry = join(serverDir, 'index.mjs')
  if (existsSync(entry)) {
    try {
      const resolved = createRequire(entry).resolve('sql.js')
      const dir = dirname(resolved)
      if (isInside(serverDir, dir)) dirs.add(dir)
    } catch {
      // sql.js is not resolvable from the server bundle yet
    }
  }
  const pkgDir = join(serverDir, 'node_modules', 'sql.js')
  const canonical = join(pkgDir, 'dist')
  if (existsSync(join(pkgDir, 'package.json')) || existsSync(join(canonical, 'sql-wasm.js'))) {
    dirs.add(canonical)
  }
  return [...dirs]
}

export function copySqlWasm(options = {}) {
  const rootDir = options.rootDir ?? resolve(scriptDir, '..')
  const serverDir = options.serverDir ?? join(rootDir, '.output', 'server')
  const strict = options.strict !== false

  if (!existsSync(serverDir)) {
    const message = `[copy-sql-wasm] server output not found: ${serverDir}`
    if (strict) throw new Error(message)
    console.warn(message)
    return { copied: [], expected: null }
  }

  const src = sourceFiles()
  let destDirs = tracedDestDirs(serverDir)

  if (destDirs.length === 0) {
    const pkgDir = join(serverDir, 'node_modules', 'sql.js')
    const distDir = join(pkgDir, 'dist')
    mkdirSync(distDir, { recursive: true })
    copyFileSync(src.pkgJsonPath, join(pkgDir, 'package.json'))
    copyFileSync(src.jsPath, join(distDir, 'sql-wasm.js'))
    destDirs = [distDir]
  }

  const copied = []
  for (const destDir of destDirs) {
    mkdirSync(destDir, { recursive: true })
    const wasmDest = join(destDir, WASM_NAME)
    copyFileSync(src.wasmPath, wasmDest)
    copied.push(wasmDest)
    if (src.mapPath) {
      const mapDest = join(destDir, `${WASM_NAME}.map`)
      copyFileSync(src.mapPath, mapDest)
      copied.push(mapDest)
    }
  }

  const entry = join(serverDir, 'index.mjs')
  let resolvedWasm = null
  if (existsSync(entry)) {
    try {
      resolvedWasm = join(dirname(createRequire(entry).resolve('sql.js')), WASM_NAME)
    } catch {
      resolvedWasm = null
    }
  }

  const expected =
    resolvedWasm && isInside(serverDir, resolvedWasm)
      ? resolvedWasm
      : join(serverDir, 'node_modules', 'sql.js', 'dist', WASM_NAME)

  if (!existsSync(expected) || statSync(expected).size < 1000) {
    throw new Error(`[copy-sql-wasm] wasm missing or empty at ${expected}`)
  }

  console.log(`[copy-sql-wasm] ${expected} (${statSync(expected).size} bytes)`)
  return { copied, expected }
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  try {
    copySqlWasm({ strict: true })
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
