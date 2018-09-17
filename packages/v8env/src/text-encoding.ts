
/**
 * @module fly
 * @private
 */
import { sendSync } from './bridge'

export class TextEncoder {
  constructor() { }
  encode(input) {
    return sendSync("encode", input)
  }
}

export class TextDecoder {
  encoding: any
  constructor(encoding) { this.encoding = encoding }
  decode(input) {
    let res = sendSync("decode", input, this.encoding)
    console.log("decoder res:", typeof res, res.length, Array.isArray(res))
    return res[0]
  }
}