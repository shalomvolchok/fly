/**
 * @module fetch
 */
// import { logger } from './logger'
// import refToStream, { isFlyStream } from './fly/streams'
import { RequestInit, RequestInfo, HeadersInit } from './dom_types';
import { FlyResponse } from './response';
import { FlyRequest } from './request';
import { sendAsync, sendSync, streams } from './bridge';

import * as fbs from "./msg_generated";
import * as errors from "./errors";
import * as util from "./util";
import { flatbuffers } from "flatbuffers"
import { ReadableStream } from '@stardazed/streams';


export interface FlyRequestInit extends RequestInit {
	timeout?: number,
	readTimeout?: number
}

/**
 * Starts the process of fetching a network request.
 * 
 * See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
 * @global
 * @param req - The direct URL or Request for the resource you wish to fetch
 * @param init - Options for the request
 * @return A Promise that resolves to a {@linkcode Response} object
 */

export function fetch(info: RequestInfo, init?: FlyRequestInit): Promise<FlyResponse> {
	return new Promise(function fetchPromise(resolve, reject) {
		try {
			const req = new FlyRequest(info, init)
			const url = req.url

			const fbb = new flatbuffers.Builder();
			const urlStr = fbb.createString(url);

			let headersArr = Array.from(req.headers[Symbol.iterator]());
			const headersLength = headersArr.length;
			let fbbHeaders = Array<number>();

			// console.log("trying stuff")
			for (let i = 0; i < headersLength; i++) {
				// console.log("doing header:", headerKeys[i]);
				const key = fbb.createString(headersArr[i].name);
				const value = fbb.createString(headersArr[i].value);
				fbs.HttpHeader.startHttpHeader(fbb);
				fbs.HttpHeader.addKey(fbb, key);
				fbs.HttpHeader.addValue(fbb, value);
				fbbHeaders[i] = fbs.HttpHeader.endHttpHeader(fbb);
			}
			// console.log(fbbHeaders);
			let reqHeaders = fbs.HttpRequest.createHeadersVector(fbb, fbbHeaders);
			fbs.HttpRequest.startHttpRequest(fbb);
			fbs.HttpRequest.addUrl(fbb, urlStr);
			fbs.HttpRequest.addMethod(fbb, fbs.HttpMethod.Get);
			fbs.HttpRequest.addHeaders(fbb, reqHeaders);
			// let now = Date.now()
			sendAsync(fbb, fbs.Any.HttpRequest, fbs.HttpRequest.endHttpRequest(fbb)).then((base) => {
				// console.log(`got fetch base in ${Date.now() - now}ms`)
				let msg = new fbs.FetchHttpResponse();
				base.msg(msg);
				const body = msg.body() ?
					new ReadableStream({
						start(controller) {
							streams.set(msg.id(), (chunkMsg: fbs.StreamChunk, raw: Uint8Array) => {
								// console.log(`got a chunk after ${Date.now() - now}ms`);
								// console.log("\nGOT BYTES:", raw.byteLength, raw.length);
								// let s = "";
								// raw.slice(0, 30).forEach((v, idx, arr) => s += v.toString(16) + " ")
								// console.log(s)
								controller.enqueue(raw);
								if (chunkMsg.done()) {
									controller.close()
									streams.delete(chunkMsg.id())
								}
							})
						}
					}) : null
				const headersInit: string[][] = [];
				// console.log("headers len:", msg.headersLength());
				for (let i = 0; i < msg.headersLength(); i++) {
					const h = msg.headers(i);
					// console.log("header:", h.key(), h.value());
					headersInit.push([h.key(), h.value()]);
				}

				resolve(new FlyResponse(body, { headers: headersInit }))
			});
			// sendSync()
			// init = {
			// 	method: req.method,
			// 	headers: req.headers && req.headers.toJSON() || {},
			// 	timeout: init && init.timeout,
			// 	readTimeout: init && init.readTimeout || 30 * 1000
			// }

			// let body = req.body;

			// sendAsync()	

			// if (!req.bodySource)
			// 	bridge.dispatch("fetch", url, init, null, fetchCb)
			// else if (typeof req.bodySource === 'string')
			// 	bridge.dispatch("fetch", url, init, req.bodySource, fetchCb)
			// else
			// 	req.arrayBuffer().then(function fetchArrayBufferPromise(body) {
			// 		bridge.dispatch("fetch", url, init, body, fetchCb)
			// 	}).catch(reject)

		} catch (err) {
			console.debug("err applying nativeFetch", err.toString())
			reject(err)
		}
		// function fetchCb(err, nodeRes, nodeBody) {
		// 	if (err && typeof err === "string" && err.includes("timeout"))
		// 		return reject(new TimeoutError(err))
		// 	if (err)
		// 		return reject(new Error(err))
		// 	resolve(new Response(isFlyStream(nodeBody) ? refToStream(nodeBody) : nodeBody,
		// 		nodeRes))
		// }
	})
};

export class TimeoutError extends Error { }