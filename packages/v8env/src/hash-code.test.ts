import { hashCode } from "./hash-code"

const cases: Array<[string, number]> = [
  ["", 0],
  ["https://fly.io", 1197017104],
  ["really-long-string".repeat(10000), 535792128]
]

test.each(cases)("generates hash (%#)", (val, expected) => {
  expect(hashCode(val)).toEqual(expected)
})

test.each(cases)("repeated calls generated same value (%#)", (val, expected) => {
  expect(hashCode(val)).toEqual(expected)
  expect(hashCode(val)).toEqual(expected)
})
