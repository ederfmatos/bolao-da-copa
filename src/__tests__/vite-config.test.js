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

  it('preserves existing Workbox runtime caching configuration', () => {
    expect(configContent).toContain('runtimeCaching')
    expect(configContent).toContain('supabase-requests')
    expect(configContent).toContain('NetworkFirst')
  })

  it('preserves globPatterns for precaching', () => {
    expect(configContent).toContain('globPatterns')
  })

  it('preserves manifest configuration', () => {
    expect(configContent).toContain('manifest:')
    expect(configContent).toContain('Bolão Copa 2026')
  })
})
