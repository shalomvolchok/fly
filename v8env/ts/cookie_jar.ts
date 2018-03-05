import * as cookie from 'cookie'

const cookieAttributeNames = ['Max-Age', 'Expires', 'HttpOnly', 'Secure', 'Path', 'SameSite', 'Domain']

/**
 * A jar for storing delicious cookies.
 * @class
 * @param {Response|Request} [parent] Underlying resource that contains cookies in headers
 */
export default class CookieJar {
  private parent: Request | Response
  private cookies: any[]

  constructor(parent: Request | Response) {
    this.parent = parent
    if (parent instanceof Request)
      this.cookies = parseCookies(parent.headers.get('Cookie'))
    else if (parent instanceof Response)
      this.cookies = parseCookies(parent.headers.get('Set-Cookie'))
  }

	/**
	 * Gets a cookie by name
	 * @param {String} name
	 */
  get(name: string) {
    return this.cookies.find((c) => c.name === name)
  }

	/**
	 * Sets a cookie, and applies it to the underlying {@linkcode Request} or {@linkcode Response}
	 * @param {String} name
	 * @param {String} value
	 * @param {Object} [options]
	 */
  append(name: string, value: string, options: Object) {
    const cookieStr = cookie.serialize(name, value, options)
    this.cookies = this.cookies.concat(parseCookie(cookieStr))
    if (this.parent instanceof Request)
      this.parent.headers.append("Cookie", cookieStr)
    else if (this.parent instanceof Response)
      this.parent.headers.append("Set-Cookie", cookieStr)
  }
}

function parseCookies(rawCookies: string | null): Object[] {
  let cookies: Object[] = []
  if (rawCookies === null) {
    return cookies
  }

  for (let c of rawCookies.split(',')) {
    cookies = cookies.concat(parseCookie(c))
  }
  return cookies
}

function parseCookie(cookieStr: string): Object[] {
  let options = {}
  let cookies = []
  let parsed = cookie.parse(cookieStr)
  for (let k in parsed) {
    if (cookieAttributeNames.indexOf(k) != -1) {
      options[k] = parsed[k]
      continue
    }
    cookies.push({ name: k, value: parsed[k] })
  }
  return cookies.map((c) => Object.assign(c, options))
}
