import CookieJar from './cookie_jar.ts'
import BodyMixin, { BodySource } from './body_mixin.ts'

export type ResponseInit = {
  status: number,
  statusText: ByteString,
  headers: HeadersInit
}

export type ResponseType =
  'basic' |
  'cors' |
  'default' |
  'error' |
  'opaque' |
  'opaqueredirect'

/**
 * Class representing a fetch response.
 * @param {Blob|String} [body]
 * @param {Object} [init]
 * @param {Number} [init.status]
 * @param {String} [init.statusText]
 * @param {String} [init.url]
 * @mixes Body
 */
class Response extends BodyMixin {
  readonly type: ResponseType
  readonly url: USVString
  readonly redirected: boolean
  readonly status: number
  readonly ok: boolean
  readonly statusText: ByteString
  readonly headers: Headers
  private cookieJar: CookieJar | null

  constructor(body: BodyInit = '', init?: ResponseInit) {
    super(body)


    if (init) {
      this.headers = new Headers(init.headers);
      this.status = init.status ? ushort(init.status) : 200
      this.statusText = init.statusText || 'OK'
    } else {
      this.headers = new Headers()
      this.status = 200
      this.statusText = 'OK'
    }
    // TODO: implement?
    this.url = ''

    if (this.status < 200 || this.status > 599) throw RangeError();
    if (/[^\x00-\xFF]/.test(this.statusText)) throw TypeError();

    this.ok = 200 <= this.status && this.status <= 299;
    this.redirected = 300 <= this.status && this.status <= 399;


    // readonly attribute Headers headers;
    // if ('headers' in init) fill(this.headers, init);

    // TODO: Implement these
    this.type = 'basic'; // TODO: ResponseType
  }

  get cookies(): CookieJar {
    if (this.cookieJar === null) {
      const cj = new CookieJar(this)
      this.cookieJar = cj
      return cj
    } else {
      return this.cookieJar
    }
  }

  /*
  clone() {
    if (this.bodyUsed)
      throw new Error("Body has already been used")
    let body2 = this.bodySource
    if (this.bodySource instanceof ReadableStream) {
      const tees = this.body.tee()
      this.stream = this.bodySource = tees[0]
      body2 = tees[1]
    }
    return new Response(body2, this)
  }
  */
}

function ushort(x: number): number { return x & 0xFFFF; }

