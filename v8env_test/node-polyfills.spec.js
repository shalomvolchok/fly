import { expect } from 'chai'

const globals = ["process", "__filename", "__dirname", "Buffer", "setImmediate"]
const libs = ["crypto"]
describe("webpack.node", () => {

  for (const g of globals) {
    it(`should not define ${g}`, async () => {
      let r = global[g]

      let notDefined = r === undefined || r == global._fly[g] // either not defined, or one of the _fly globals
      expect(notDefined).to.eq(true, `${g} = ${r}`)
    })
  }

  for (const l of libs) {
    it(`should not be able to import ${l}`, async () => {
      try {
        const imported = require(l)
        // shouldn't get here
        expect(imported).to.be.undefined
      } catch (err) {
        expect(err).to.match(/Cannot find module/)
      }
    })
  }
})