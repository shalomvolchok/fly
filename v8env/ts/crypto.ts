/**
 * @private
 * @module fly
 * @hidden
 */
type CryptoData = BufferSource | string

declare var bindings: any

// export class CryptoKey {
//   readonly algorithm: KeyAlgorithm;
//   readonly extractable: boolean;
//   readonly type: string;
//   readonly usages: string[];

//   constructor(algorithm: KeyAlgorithm, extractable: boolean, type: string, usages: string[]){
//     this.algorithm = algorithm
//     this.extractable = extractable
//     this.type = type
//     this.usages = usages
//   }
// }

/** @hidden */
export const crypto = {
  subtle: {
    generateKey(algorithm: RsaHashedKeyGenParams | EcKeyGenParams | DhKeyGenParams, extractable: boolean, keyUsages: string[]): CryptoKeyPair {

    },

    digest(algo: string, data: CryptoData, encoding?: string): Promise<ArrayBuffer | string> {
      return new Promise((resolve, reject) => {

      })
      return bridge.dispatch("digestHash", algo, data, encoding)
    },
    digestSync(algo: string, data: CryptoData, encoding?: string): ArrayBuffer | string {
      return bindings.crypto.digest(algo, data, encoding)
    }
  },
  getRandomValues(typedArray: Uint8Array): void {
    if (!(typedArray instanceof Uint8Array)) {
      throw new Error("Only Uint8Array are supported at present")
    }
    const newArr = new Uint8Array(bridge.dispatchSync("getRandomValues", typedArray.length))
    typedArray.set(newArr)
    return
  }
}