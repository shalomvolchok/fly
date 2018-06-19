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
    describe("generateKey", () => {
      const key = bindings.crypto.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
        },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["sign", "verify"] //can be any combination of "sign" and "verify"
      )
      // expect(key.).to.be.instanceof(CryptoKeyPair)
    })

    describe("digest", () => {
      // it("only accepts certain algorithms", (done) => {
      //   bindings.crypto.digest("sadasd", new ArrayBuffer(8))
      //     .then(() => done(new Error("should have been rejected.")))
      //     .catch((err) => {
      //       expect(err.message).to.eq("asdasd")
      //       done()
      //     })
      // })
      it("creates a hash from a string", () => {
        const hash = bindings.crypto.digest("SHA-1", bindings.textEncoding.encode("hello world"))
        expect(hash).to.be.instanceof(ArrayBuffer)
      })
    })
    describe("getRandomValues", () => {
      it("fills the Uint8Array", () => {
        let array = new Uint8Array(24);
        bindings.crypto.getRandomValues(array)
        let zeroCount = 0
        for (let u8 of array) {
          if (u8 == 0) zeroCount++
        }
        expect(zeroCount).to.be.lessThan(array.length)
      })
      it("only accepts 64KB buffers at most", (done) => {
        let array = new Uint8Array(64 * 1024 + 1);
        expect(function () { bindings.crypto.getRandomValues(array) }).to.throw("The ArrayBufferView's byte length (65537) exceeds the number of bytes of entropy available via this API (65536)")
      })
    })
  })
})