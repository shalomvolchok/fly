import * as path from 'path'

import { root } from './root'

interface ServerOptions {
  port?: string
}

root
  .subCommand<ServerOptions, any>("server")
  .description("Run the local Fly development server")
  .option("-p, --port <port>", "Port to bind to")
  .action((opts, args, rest) => {
    const { parseConfig } = require('../config')
    const { FileStore } = require('../app/stores/file')
    const { Server } = require('../server')
    const cwd = process.cwd()
    let conf = parseConfig(cwd)

    if (opts.port && opts.port.length) { conf.port = opts.port }

    conf.appStore = new FileStore(cwd, { build: true })

    new Server(conf).start()
  })
