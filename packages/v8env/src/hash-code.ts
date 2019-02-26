// tslint:disable:no-bitwise

/**
 * Generate a consistent hash code for the provided string.
 */
export function hashCode(val: string): number {
  let nHash = 0
  if (!val.length) {
    return nHash
  }
  for (let i = 0, imax = val.length, n = 0; i < imax; ++i) {
    n = val.charCodeAt(i)
    nHash = (nHash << 5) - nHash + n
    nHash = nHash & nHash
  }
  return Math.abs(nHash)
}
