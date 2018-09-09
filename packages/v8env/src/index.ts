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
import { send } from "./fbs_util"
import { fly as fbs } from './msg_generated'
import { flatbuffers } from 'flatbuffers'
import * as timers from './timers'

import './globals'

// window.bootstrap = function bootstrap() {
libfly.recv(onMessage)
// sendStart();
// }

function sendStart(): fbs.StartRes {
	const builder = new flatbuffers.Builder();
	fbs.Start.startStart(builder);
	const startOffset = fbs.Start.endStart(builder);
	const baseRes = send(builder, fbs.Any.Start, startOffset);
	assert(baseRes != null);
	assert(fbs.Any.StartRes === baseRes!.msgType());
	const startRes = new fbs.StartRes();
	assert(baseRes!.msg(startRes) != null);
	return startRes;
}

function assert(cond: boolean, msg = "assert") {
	if (!cond) {
		throw Error(msg);
	}
}

function onMessage(ui8: Uint8Array) {
	libfly.log("ON MESSAGE")
	let now = Date.now()
	const bb = new flatbuffers.ByteBuffer(ui8);
	const base = fbs.Base.getRootAsBase(bb);
	switch (base.msgType()) {
		case fbs.Any.TimerReady: {
			const msg = new fbs.TimerReady();
			assert(base.msg(msg) != null);
			timers.onMessage(msg);
			break;
		}
		// case fbs.Any.TimerReady: {
		// 	libfly.log("TIMER READY")
		// 	const msg = new fbs.TimerReady();
		// 	assert(base.msg(msg) != null);
		// 	timers.onMessage(msg);
		// 	break;
		// }
		default: {
			assert(false, "Unhandled message type");
			break;
		}
	}
	libfly.log("ON MESSAGE ENDED IN: " + (Date.now() - now));
}