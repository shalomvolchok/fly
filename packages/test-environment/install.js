require("./lib/global").install()

// 30 second test timeout
jest.setTimeout(30000)

jest.retryTimes(3)
