import { logger } from './logger.ts'

/**
 * @class
 * @param {Object} [init]
 */

/*
typedef (sequence<sequence<ByteString>> or record<ByteString, ByteString>) HeadersInit;

[Constructor(optional HeadersInit init),
 Exposed=(Window,Worker)]
interface Headers {
  void append(ByteString name, ByteString value);
  void delete(ByteString name);
  ByteString? get(ByteString name);
  boolean has(ByteString name);
  void set(ByteString name, ByteString value);
  iterable<ByteString, ByteString>;
};
*/

export interface Header { [s: string]: ByteString }
export interface HeaderMulti { [s: string]: ByteString | ByteString[] }

export type HeadersInit = [[ByteString, ByteString]] | Header

export default class Headers implements Iterable<[ByteString, ByteString] | null> {
  private counter = 0
  private _headerList: [[ByteString, ByteString]]

  constructor() {
    this._headerList = []
  }

  public [Symbol.iterator]() {
    const _this = this
    return {
      next(): IteratorResult<[ByteString, ByteString] | null> {
        if (_this.counter >= _this._headerList.length) {
          return { value: null, done: true }
        } else {
          return { value: _this._headerList[_this.counter++], done: false }
        }
      }
    }
  }

  append(name: ByteString, value: ByteString) {
    name = name.toLowerCase();
    this._headerList.push([name, value]);
  }

  delete(name: ByteString) {
    name = name.toLowerCase();
    var index = 0;
    while (index < this._headerList.length) {
      if (this._headerList[index][0] === name)
        this._headerList.splice(index, 1);
      else
        ++index;
    }
  }

  get(name: ByteString): ByteString | null {
    name = name.toLowerCase();
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name)
        return this._headerList[index][1];
    }
    return null;
  }

  getAll(name: ByteString): ByteString[] {
    name = name.toLowerCase();
    var sequence = [];
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name)
        sequence.push(this._headerList[index][1]);
    }
    return sequence;
  }


  has(name: ByteString): boolean {
    name = name.toLowerCase();
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name)
        return true;
    }
    return false;
  }

  set(name: ByteString, value: ByteString) {
    name = name.toLowerCase();
    for (var index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name) {
        this._headerList[index++][1] = value;
        while (index < this._headerList.length) {
          if (this._headerList[index][0] === name)
            this._headerList.splice(index, 1);
          else
            ++index;
        }
        return;
      }
    }
    this._headerList.push([name, value]);
  }

  /**
   * @returns {Object<string,string[]>}
   */
  toJSON(): HeaderMulti {
    const jsonHeaders: HeaderMulti = {}
    for (let h of this._headerList) {
      if (h[0] === 'host') {
        jsonHeaders[h[0]] = String(this.get(h[0]))
        continue
      }

      logger.debug("setting", h[0], this.getAll(h[0]))
      jsonHeaders[h[0]] = this.getAll(h[0])
    }
    return jsonHeaders
  }
}

function fill(headers: Headers, init: Headers | [[ByteString, ByteString]] | Header) {
  if (init instanceof Headers) {
    init._headerList.forEach(function(header) {
      headers.append(header[0], header[1]);
    });
  } else if (Array.isArray(init)) {
    init.forEach(function(header) {
      if (!Array.isArray(header) || header.length !== 2) throw TypeError();
      headers.append(header[0], header[1]);
    });
  } else {
    init = Object(init);
    Object.keys(init)
      .forEach(function(key) {
        if (Array.isArray(init[key])) {
          init[key].forEach(function(v) {
            headers.append(key, v);
          })
        } else {
          headers.append(key, init[key]);
        }
      });
  }
}

/*
export default function Headers(init) {
  Object.defineProperty(this, "_headerList", {
    enumerable: false,
    value: []
  })
  if (init) {
    fill(this, init)
  }
}
*/
