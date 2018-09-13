// Copyright 2018 the Deno authors. All rights reserved. MIT license.
import { libfly } from "./libfly";
// import { flatbuffers } from "flatbuffers";
// import { fly as fbs } from "./msg_generated";
import * as errors from "./errors";
import * as util from "./util";

let nextCmdId = 0;
const promiseTable = new Map<number, util.Resolvable<any[]>>();

export function handleAsyncMsgFromRust(cmdId: number, name: string, ...args): number {
  // const bb = new flatbuffers.ByteBuffer(ui8);
  // const base = fbs.Base.getRootAsBase(bb);
  // const cmdId = base.cmdId();

  // if (base.msgType() == fbs.Any.HttpRequest) {
  //   // console.log("got an http request!");
  //   const msg = new fbs.HttpRequest();
  //   base.msg(msg);
  //   // console.log("req:", msg.method() == fbs.HttpMethod.Get, msg.url());
  //   for (let i = 0; i < msg.headersLength(); i++) {
  //     const item = msg.headers(i)!;
  //     // console.log("header:", item.key(), "=>", item.value())
  //   }
  //   setTimeout(() => {
  //     try {
  //       // console.log("hello, gonna respond")
  //       const builder = new flatbuffers.Builder();
  //       let body = builder.createString("hello world, woot");
  //       fbs.HttpResponse.startHttpResponse(builder);
  //       fbs.HttpResponse.addId(builder, msg.id());
  //       fbs.HttpResponse.addBody(builder, body);
  //       const startOffset = fbs.HttpResponse.endHttpResponse(builder);
  //       // console.log("ended http response");
  //       const baseRes = sendSync(builder, fbs.Any.HttpResponse, startOffset);
  //       // console.log(baseRes);
  //       // assert(baseRes == null);
  //     } catch (e) {
  //       console.log('got an error:', e.message, e.stack);
  //     }
  //   }, 0)
  //   return
  // }

  if (!cmdId) // 0
    cmdId = nextCmdId++;

  if (name == "http_request") {
    // console.log("http_request");
    // console.log("GOT AN HTTP REQUEST", ...args);

    // setTimeout(() => {
    // console.log("http_request");
    // }, 0)
    setTimeout(() => {
      libfly.send(cmdId, "http_response", false, "woop woop");
    }, 0)
    return cmdId
  }

  const promise = promiseTable.get(cmdId);
  util.assert(promise != null, `Expecting promise in table. ${cmdId}`);
  promiseTable.delete(cmdId);
  // TODO: error
  // const err = errors.maybeError(base);
  // if (err != null) {
  //   promise!.reject(err);
  // } else {
  promise!.resolve(args);
  // }
  return cmdId
}

// @internal
export function sendAsync(name: string, ...args): Promise<any[]> {
  const [cmdId, res] = sendInternal(name, false, args);
  // util.assert(resBuf == null);
  const promise = util.createResolvable<any[]>();
  promiseTable.set(cmdId, promise);
  return promise;
}

// @internal
export function sendSync(name: string, ...args): any {
  const [cmdId, res] = sendInternal(name, true, args);
  util.assert(cmdId >= 0);
  return res;
  // if (res == null) {
  //   return null;
  // } else {
  //   const u8 = new Uint8Array(resBuf!);
  //   // console.log("recv sync message", util.hexdump(u8));
  //   const bb = new flatbuffers.ByteBuffer(u8);
  //   const baseRes = fbs.Base.getRootAsBase(bb);
  //   errors.maybeThrowError(baseRes);
  //   return baseRes;
  // }
}

function sendInternal(
  name: string,
  sync: boolean,
  args: any[],
): [number, any] {
  const cmdId = nextCmdId++;
  // fbs.Base.startBase(builder);
  // fbs.Base.addMsg(builder, msg);
  // fbs.Base.addMsgType(builder, msgType);
  // fbs.Base.addSync(builder, sync);
  // fbs.Base.addCmdId(builder, cmdId);
  // builder.finish(fbs.Base.endBase(builder));

  return [cmdId, libfly.send(cmdId, name, sync, ...args)];
}