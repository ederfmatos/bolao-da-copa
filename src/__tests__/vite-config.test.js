import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('vite.config.js', () => {
  const configPath = path.resolve(__dirname, '../../vite.config.js')
  const configContent = fs.readFileSync(configPath, 'utf-8')

  it('uses injectManifest strategy', () => {
    expect(configContent).toContain("strategies: 'injectManifest'")
  })

  it('specifies srcDir: src', () => {
    expect(configContent).toContain("srcDir: 'src'")
  })

  it('specifies filename: service-worker.js', () => {
    expect(configContent).toContain("filename: 'service-worker.js'")
  })

  it('uses autoUpdate registerType', () => {
    expect(configContent).toContain("registerType: 'autoUpdate'")
  })

  it('does not include workbox config (incompatible with injectManifest)', () => {
    expect(configContent).not.toMatch(/workbox:\s*\{/)
  })

  it('preserves manifest configuration', () => {
    expect(configContent).toContain('manifest:')
    expect(configContent).toContain('Bolão Copa 2026')
  })
})
