import { AppConfig } from "@fly/test-server"
import * as path from "path"

declare function setupApps(appConfig: AppConfig): void

setupApps({ "edge.test": path.resolve(__dirname, "body.js") })

const methods = ["POST", "PUT", "PATCH", "DELETE"]

describe("Request body", () => {
  test.each(methods)(`from %s request`, async (method) => {
    const response = await fetch(`http://edge.test`, {
      method: method,
      body: "this is a body"
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("this is a body")
  })

  test("cloning", async () => {
    const response = await fetch(`http://edge.test/clone`, { method: "POST", body: "hello" })
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual(`res1: hellohello\nres2: hellohello`)
  })
})