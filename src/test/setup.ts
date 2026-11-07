import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never
}
class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver ??= IO
HTMLMediaElement.prototype.load = () => {}
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => {}
