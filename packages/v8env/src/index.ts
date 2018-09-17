/**
 * @module fly
 * @private
 */

// // import dispatcherInit from './fly/dispatcher'
// import bridgeInit from './bridge'

// import { fireFetchEvent, addEventListener, dispatchEvent, FetchEvent } from "./events"
// import { ReadableStream, WritableStream, TransformStream } from './streams'

// import { console } from './console'
// import flyInit from './fly/index'

// import { URL, URLSearchParams } from 'universal-url-lite'//'whatwg-url'
// import Headers from './headers'

// import { TextEncoder, TextDecoder } from './text-encoding'
// import { fetch, TimeoutError } from './fetch'
// import Body from './body_mixin'
// import Blob from './blob'
// import FormData from './form_data'
// import { crypto } from './crypto'
// import { Response } from './response'
// import { Request } from './request'
// import cache from './cache'
// // import { setTimeout, setImmediate, clearTimeout, setInterval, clearInterval } from './timers'

// import { Document, Element } from './document'

// import { MiddlewareChain } from './middleware'

// global.middleware = {}

// global.bootstrapBridge = function bootstrapBridge(ivm, dispatch) {
// 	delete global.bootstrapBridge
// 	bridgeInit(ivm, dispatch)
// }

// global.bootstrap = function bootstrap() {
// 	// Cleanup, early!
// 	delete global.bootstrap

// 	// Sets up `Error.prepareStacktrace`, for source map support
// 	require('./error')

// 	global.fly = flyInit()

// 	global.console = console

// 	Object.assign(global, {
// 		// setTimeout, clearTimeout, setImmediate, setInterval, clearInterval,
// 		ReadableStream, WritableStream, TransformStream,
// 		TextEncoder, TextDecoder,
// 		Headers, Request, Response, fetch, Body,
// 		Blob, FormData, URL, URLSearchParams,
// 		cache, crypto, TimeoutError,
// 		MiddlewareChain // ugh
// 	})

// 	// Events
// 	global.fireFetchEvent = fireFetchEvent
// 	global.addEventListener = addEventListener
// 	global.dispatchEvent = dispatchEvent

// 	global.FetchEvent = FetchEvent

// 	// DOM
// 	global.Document = Document
// 	global.Element = Element

// 	global.getHeapStatistics = function getHeapStatistics() {
// 		return new Promise((resolve, reject) => {
// 			global.bridge.dispatch("getHeapStatistics", function getHeapStatisticsPromise(err, heap) {
// 				if (err) {
// 					reject(err)
// 					return
// 				}
// 				resolve(heap)
// 			})
// 		})
// 	}
// }

import { libfly } from './libfly'
import { handleAsyncMsgFromRust } from "./bridge"
import "./globals";
// import { fly as fbs } from './msg_generated'
// import { flatbuffers } from 'flatbuffers'
// import * as timers from './timers'

// import './globals'
// import { globalEval } from './global-eval';

// const window = globalEval("this");
// declare function log(...args: any[]);
// log(window);
// window.TextDecoder = TextDecoder;

export default function flyMain() {
  libfly.recv(handleAsyncMsgFromRust)
}

// function onMessage(ui8: Uint8Array) {
// 	// libfly.log("ON MESSAGE")
// 	let now = Date.now()
// 	const bb = new flatbuffers.ByteBuffer(ui8);
// 	const base = fbs.Base.getRootAsBase(bb);
// 	switch (base.msgType()) {
// 		case fbs.Any.TimerReady: {
// 			const msg = new fbs.TimerReady();
// 			assert(base.msg(msg) != null);
// 			timers.onMessage(msg);
// 			break;
// 		}
// 		case fbs.Any.HttpRequest: {
// 			const msg = new fbs.HttpRequest();
// 			base.msg(msg);
// 			console.log("req:", msg.method() == fbs.HttpMethod.Get, msg.url());
// 			for (let i = 0; i < msg.headersLength(); i++) {
// 				const item = msg.headers(i)!;
// 				console.log("header:", item.key(), "=>", item.value())
// 			}
// 			setTimeout(() => {
// 				const builder = new flatbuffers.Builder();
// 				fbs.HttpResponse.startHttpResponse(builder);
// 				fbs.HttpResponse.addId(builder, msg.id());
// 				fbs.HttpResponse.addBody(builder, builder.createString("hello world, woot"));
// 				const startOffset = fbs.HttpResponse.endHttpResponse(builder);
// 				const baseRes = send(builder, fbs.Any.HttpResponse, startOffset);
// 				assert(baseRes == null);
// 			}, 1000)
// 			break;
// 		}
// 		default: {
// 			assert(false, "Unhandled message type");
// 			break;
// 		}
// 	}
// 	// libfly.log("ON MESSAGE ENDED IN: " + (Date.now() - now));
// }