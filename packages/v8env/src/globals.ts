// Copyright 2018 the Deno authors. All rights reserved. MIT license.

import { Console } from "./console";
import * as timers from "./timers";
// import * as textEncoding from "./text_encoding";
// import * as fetch_ from "./fetch";
import { libfly } from "./libfly";
import { globalEval } from "./global-eval";
import * as bridge from "./bridge";
import * as textEncoding from "./text-encoding";
import { FlyResponse } from "./response";

declare global {
  interface Window {
    console: Console;
    define: Readonly<unknown>;
  }

  //   const clearTimeout: typeof timers.clearTimer;
  //   const clearInterval: typeof timers.clearTimer;
  const setTimeout: typeof timers.setTimeout;
  const setInterval: typeof timers.setInterval;

  const console: Console;
  const window: Window;

  const addEventListener: typeof bridge.addEventListener;

  const Response: typeof FlyResponse;

  //   const fetch: typeof fetch_.fetch;

  // tslint:disable:variable-name
  let TextEncoder: typeof textEncoding.TextEncoder;
  let TextDecoder: typeof textEncoding.TextDecoder;
  // tslint:enable:variable-name
}

// A reference to the global object.
export const window = globalEval("this");
window.window = window;

window.libfly = null;

window.setTimeout = timers.setTimeout;
window.setInterval = timers.setInterval;
window.Response = FlyResponse;
// window.clearTimeout = timers.clearTimer;
// window.clearInterval = timers.clearTimer;

window.addEventListener = bridge.addEventListener;

window.console = new Console(libfly.print);
window.TextEncoder = textEncoding.TextEncoder;
window.TextDecoder = textEncoding.TextDecoder;

// window.fetch = fetch_.fetch;
