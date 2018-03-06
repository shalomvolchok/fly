import { logger } from './logger.ts'
import CookieJar from './cookie_jar.ts'
import BodyMixin from './body_mixin.ts'
import Headers from './body_mixin.ts'


function byteUpperCase(s: string) {
  return String(s)
    .replace(/[a-z]/g, function(c) {
      return c.toUpperCase();
    });
}

function normalizeMethod(m: string) {
  var u = byteUpperCase(m);
  if (u === 'DELETE' || u === 'GET' || u === 'HEAD' || u === 'OPTIONS' ||
    u === 'POST' || u === 'PUT') return u;
  return m;
}

export type RequestInit = {
  method?: ByteString,
  headers?: HeadersInit,
  body?: BodyInit,
  referrer?: USVString,
  credentials?: RequestCredentials,
  mode?: RequestMode,
  remoteAddr?: string // Fly.io property
}
export type RequestInfo = Request | USVString
export type RequestCredentials = 'omit' | 'same-origin' | 'include'
export type RequestMode = 'navigate' | 'same-origin' | 'no-cors' | 'cors'
export type ReferrerPolicy =
  '' |
  'no-referrer' |
  'no-referrer-when-downgrade' |
  'same-origin' |
  'origin' |
  'strict-origin' |
  'origin-when-cross-origin' |
  'strict-origin-when-cross-origin' |
  'unsafe-url'

/**
 * An HTTP request
 * @param {Blob|String} [body]
 * @param {Object} [init]
 * @mixes Body
 */
export default class Request extends BodyMixin {
  readonly method: ByteString
  readonly url: USVString
  readonly headers: Headers
  readonly referrer: USVString
  readonly referrerPolicy: ReferrerPolicy
  readonly credentials: RequestCredentials
  readonly mode: RequestMode
  readonly remoteAddr?: string // Fly.io property
  private cookieJar: CookieJar

  /*
  readonly attribute RequestDestination destination;

  readonly attribute ReferrerPolicy referrerPolicy;
  readonly attribute RequestMode mode;
  readonly attribute RequestCache cache;
  readonly attribute RequestRedirect redirect;
  readonly attribute DOMString integrity;
  readonly attribute boolean keepalive;
  readonly attribute AbortSignal signal;
  */

  constructor(input: RequestInfo, init?: RequestInit) {
    if (arguments.length < 1) throw TypeError('Not enough arguments');

    let body = null
    if (init && init.body) {
      body = init.body
    }
    if (!body && input instanceof Request) {
      if (input.bodyUsed()) throw TypeError();
      // grab request body if we can
      body = input.bodySource
    }
    super(body)

    this.method = 'GET';
    this.url = '';
    this.referrer = ''
    this.mode = 'no-cors'
    this.credentials = 'omit'
    this.referrerPolicy = ''

    if (input instanceof Request) {
      if (input.bodyUsed()) throw TypeError();
      this.method = input.method;
      this.url = input.url;
      this.headers = new Headers(input.headers);
      this.credentials = input.credentials;
      this.stream = input.stream;
      this.remoteAddr = input.remoteAddr;
      this.referrer = input.referrer;
      this.mode = input.mode;
    } else {
      this.url = input
    }

    if (init) {
      if (init.remoteAddr) {
        this.remoteAddr = init.remoteAddr
      }

      if (init.method) {
        this.method = normalizeMethod(init.method)
      }

      if (init.headers) {
        this.headers = new Headers(init.headers);
      }

      if (init.credentials) {
        this.credentials = init.credentials;
      }
    }

    if (!this.headers) {
      this.headers = new Headers()
    }
  }

  get cookies() {
    if (this.cookieJar)
      return this.cookieJar
    this.cookieJar = new CookieJar(this)
    return this.cookieJar
  }

  clone() {
    if (this.bodyUsed())
      throw new Error("body has already been used")
    let body2 = this.bodySource

    if (this.bodySource instanceof ReadableStream) {
      const tees = this.body().tee()
      this.stream = this.bodySource = tees[0]
      body2 = tees[1]
    }
    const cloned = new Request(this.url, {
      body: body2,
      remoteAddr: this.remoteAddr,
      method: this.method,
      headers: this.headers,
      credentials: this.credentials
    })
    return cloned
  }
}
