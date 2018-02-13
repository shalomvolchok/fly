import { parseConfig } from './config'
import { createHash } from 'crypto';

export interface ReleaseInfo {
  app_id: string
  version: number
  source: string
  source_hash: string
  source_map?: string
  config: any
  secrets: any
}

export class App {
  id: string
  releaseInfo: ReleaseInfo
  private _config: any

  constructor(releaseInfo: ReleaseInfo) {
    this.id = releaseInfo.app_id
    this.releaseInfo = releaseInfo
  }

  get config() {
    if (this._config)
      return this._config
    this._config = this.releaseInfo.config
    parseConfig(this._config, this.releaseInfo.secrets)
    return this._config
  }

  get source() {
    return this.releaseInfo.source
  }

  get sourceHash() {
    if (this.releaseInfo.source_hash)
      return this.releaseInfo.source_hash
    const hash = createHash("sha1")
    hash.update(this.source)
    return hash.digest("hex")
  }

  get sourceMap() {
    return this.releaseInfo.source_map
  }
}