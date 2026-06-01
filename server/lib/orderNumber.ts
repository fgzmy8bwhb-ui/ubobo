// Crockford Base32-ish alphabet (no ambiguous chars like 0/O, 1/I, etc.)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateOrderNumber(): string {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return `UB-${suffix}`
}
