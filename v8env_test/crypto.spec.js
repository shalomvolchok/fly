import { expect } from 'chai'

describe("crypto", () => {
  //   describe("hashing", () => {
  //     it("creates a hash", async () => {
  //       let hash = await crypto.subtle.digest("SHA-1", (new TextEncoder('utf-8')).encode("hello world"))
  //       expect(hash).to.be.instanceof(ArrayBuffer)
  //     })

  //     it("creates a hash from a string", async () => {
  //       let hash = await crypto.subtle.digest("SHA-1", "hello world")
  //       expect(hash).to.be.instanceof(ArrayBuffer)
  //     })

  //     it("creates a hash synchronously", () => {
  //       let hash = crypto.subtle.digestSync("SHA-1", (new TextEncoder('utf-8')).encode("hello world"))
  //       expect(hash).to.be.instanceof(ArrayBuffer)
  //     })

  //     it("creates a hash synchronously from a string", () => {
  //       let hash = crypto.subtle.digestSync("SHA-1", "hello world")
  //       expect(hash).to.be.instanceof(ArrayBuffer)
  //     })

  //     it("produces a string with encoding", async () => {
  //       let hash = await crypto.subtle.digest("SHA-1", "hello world", "hex")
  //       expect(typeof hash).to.equal("string")
  //     })

  //     it("produces a string with encoding synchronously", () => {
  //       let hash = crypto.subtle.digestSync("SHA-1", "hello world", "hex")
  //       expect(typeof hash).to.equal("string")
  //     })

  //     it("errors on bad algo", (done) => {
  //       let ret = crypto.subtle.digest("SHA-123", '')
  //         .then(() => { done(new Error("should've thrown!")) })
  //         .catch((e) => {
  //           expect(e).to.be.instanceof(Error)
  //           done()
  //         })
  //     })

  //     it("errors on bad algo (sync)", () => {
  //       expect(function () { crypto.subtle.digestSync("SHA-123", '') }).to.throw("Digest method not supported")
  //     })
  //   })
  //   describe("getRandomValues", () => {
  //     it("fills the Uint8Array", () => {
  //       let array = new Uint8Array(24);
  //       crypto.getRandomValues(array)
  //       let zeroCount = 0
  //       for (let u8 of array) {
  //         if (u8 == 0) zeroCount++
  //       }
  //       expect(zeroCount).to.be.lessThan(array.length)
  //     })
  //   })
  // })

  describe("crypto native", () => {
    // describe("generateKey", () => {
    //   const key = await bindings.crypto.generateKey(
    //     {
    //       name: "ECDSA",
    //       namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
    //     },
    //     false, //whether the key is extractable (i.e. can be used in exportKey)
    //     ["sign", "verify"] //can be any combination of "sign" and "verify"
    //   )
    //   // expect(key.).to.be.instanceof(CryptoKeyPair)
    // })

    describe("digest", () => {
      it("only accepts certain algorithms", (done) => {
        bindings.crypto.digest("sadasd", new ArrayBuffer(8))
          .then(() => {
            done(new Error("should've thrown."))
          })
          .catch((err) => {
            expect(err).to.be.instanceof(TypeError)
            expect(err.message).to.eq("Unsupported algorithm")
            done()
          })
      })
      it("creates a sha1 hash", async () => {
        const hash = await bindings.crypto.digest("SHA-1", bindings.textEncoding.encode("hello world"))
        expect(hash).to.be.instanceof(ArrayBuffer)
        expect(hash.byteLength).to.eq(20)
        expect(hex(hash)).to.eq("2aae6c35c94fcfb415dbe95f408b9ce91ee846ed")
      })
      it("creates a sha256 hash", async () => {
        const hash = await bindings.crypto.digest("SHA-256", bindings.textEncoding.encode("hello world"))
        expect(hash).to.be.instanceof(ArrayBuffer)
        expect(hash.byteLength).to.eq(32)
        expect(hex(hash)).to.eq("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9")
      })
      it("creates a sha384 hash", async () => {
        const hash = await bindings.crypto.digest("SHA-384", bindings.textEncoding.encode("hello world"))
        expect(hash).to.be.instanceof(ArrayBuffer)
        expect(hash.byteLength).to.eq(48)
        expect(hex(hash)).to.eq("fdbd8e75a67f29f701a4e040385e2e23986303ea10239211af907fcbb83578b3e417cb71ce646efd0819dd8c088de1bd")
      })
      it("creates a sha512 hash", async () => {
        const hash = await bindings.crypto.digest("SHA-512", bindings.textEncoding.encode("hello world"))
        expect(hash).to.be.instanceof(ArrayBuffer)
        expect(hash.byteLength).to.eq(64)
        expect(hex(hash)).to.eq("309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f")
      })
    })
    describe("getRandomValues", () => {
      [
        Uint8Array,
        Uint16Array,
        Uint32Array,
        Int8Array,
        Int16Array,
        Int32Array,
      ].forEach((ctor) => {
        it(`fills a ${ctor.name}`, () => {
          let array = new ctor(24);
          bindings.crypto.getRandomValues(array)
          let zeroCount = 0
          for (let u8 of array) {
            if (u8 == 0) zeroCount++
          }
          expect(zeroCount).to.be.lessThan(array.length)
        })
      })

      it("only accepts 64KB buffers at most", () => {
        let array = new Uint8Array(64 * 1024 + 1);
        expect(function () { bindings.crypto.getRandomValues(array) }).to.throw("The ArrayBufferView's byte length (65537) exceeds the number of bytes of entropy available via this API (65536)")
      })
    })
  })
})

function hex(buffer) {
  var digest = ''
  var view = new DataView(buffer)
  for (var i = 0; i < view.byteLength; i += 4) {
    // We use getUint32 to reduce the number of iterations (notice the `i += 4`)
    var value = view.getUint32(i)
    // toString(16) will transform the integer into the corresponding hex string
    // but will remove any initial "0"
    var stringValue = value.toString(16)
    // One Uint32 element is 4 bytes or 8 hex chars (it would also work with 4
    // chars for Uint16 and 2 chars for Uint8)
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    digest += paddedValue
  }

  return digest
}