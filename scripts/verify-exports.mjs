#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const internalPackageDir = path.join(repoRoot, 'packages/ui-bits')

const packageSpecs = [
  { name: 'root package.json', file: path.join(repoRoot, 'package.json'), dir: repoRoot },
  {
    name: 'packages/ui-bits/package.json',
    file: path.join(internalPackageDir, 'package.json'),
    dir: internalPackageDir,
  },
]

const pathFields = ['main', 'module', 'types', 'style']
const errors = []

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

const isLocalPath = (value) => (
  typeof value === 'string' && (value.startsWith('./') || value.startsWith('../'))
)

const resolvePackagePath = (packageDir, target) => path.resolve(packageDir, target)

const assertInsidePackage = (packageDir, target, label) => {
  const resolved = resolvePackagePath(packageDir, target)
  const relative = path.relative(packageDir, resolved)
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return resolved
  }
  errors.push(`${label} points outside its package: ${target}`)
  return resolved
}

const assertExists = (packageDir, target, label) => {
  const resolved = assertInsidePackage(packageDir, target, label)
  if (!existsSync(resolved)) {
    errors.push(`${label} does not exist: ${target}`)
  }
}

const collectExportTargets = (value, label, packageDir) => {
  if (typeof value === 'string') {
    if (isLocalPath(value)) {
      assertExists(packageDir, value, label)
    }
    return
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectExportTargets(entry, `${label}[${index}]`, packageDir))
    return
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => {
      collectExportTargets(entry, `${label}.${key}`, packageDir)
    })
  }
}

const normalizeRootTarget = (target) => {
  if (!isLocalPath(target)) return target
  const packagePrefix = './packages/ui-bits/'
  if (target.startsWith(packagePrefix)) {
    return `./${target.slice(packagePrefix.length)}`
  }
  return target
}

const normalizeRootPaths = (value) => {
  if (typeof value === 'string') return normalizeRootTarget(value)
  if (Array.isArray(value)) return value.map(normalizeRootPaths)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeRootPaths(entry)]),
  )
}

const stableJson = (value) => JSON.stringify(value, null, 2)

const manifests = await Promise.all(packageSpecs.map(async (spec) => ({
  ...spec,
  manifest: await readJson(spec.file),
})))

for (const spec of manifests) {
  for (const field of pathFields) {
    const target = spec.manifest[field]
    if (target !== undefined) {
      if (!isLocalPath(target)) {
        errors.push(`${spec.name}.${field} is not a local package path: ${target}`)
      } else {
        assertExists(spec.dir, target, `${spec.name}.${field}`)
      }
    }
  }

  if (Array.isArray(spec.manifest.files)) {
    spec.manifest.files.forEach((target, index) => {
      if (isLocalPath(target) || typeof target === 'string') {
        assertExists(spec.dir, target, `${spec.name}.files[${index}]`)
      }
    })
  }

  if (spec.manifest.exports) {
    collectExportTargets(spec.manifest.exports, `${spec.name}.exports`, spec.dir)
  }
}

const rootManifest = manifests[0]?.manifest
const internalManifest = manifests[1]?.manifest

if (rootManifest && internalManifest) {
  for (const field of pathFields) {
    const normalizedRoot = normalizeRootTarget(rootManifest[field])
    if (normalizedRoot !== internalManifest[field]) {
      errors.push(
        `root package.json.${field} (${rootManifest[field]}) does not match packages/ui-bits/package.json.${field} (${internalManifest[field]}) after normalization`,
      )
    }
  }

  const normalizedRootExports = normalizeRootPaths(rootManifest.exports)
  if (stableJson(normalizedRootExports) !== stableJson(internalManifest.exports)) {
    errors.push('root package.json exports do not match packages/ui-bits/package.json exports after normalization')
  }
}

if (errors.length > 0) {
  console.error('Export verification failed:')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log('Package exports verified.')
