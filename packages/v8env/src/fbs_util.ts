import { libfly } from "./libfly";
import { flatbuffers } from "flatbuffers";
// import { maybeThrowError } from "./errors";
import { fly as fbs } from "./msg_generated";

export function send(
  builder: flatbuffers.Builder,
  msgType: fbs.Any,
  msg: flatbuffers.Offset
): null | fbs.Base {
  fbs.Base.startBase(builder);
  fbs.Base.addMsg(builder, msg);
  fbs.Base.addMsgType(builder, msgType);
  builder.finish(fbs.Base.endBase(builder));

  libfly.log(builder.asUint8Array().length.toString());

  const resBuf = libfly.send(builder.asUint8Array());
  if (resBuf == null) {
    return null;
  } else {
    const bb = new flatbuffers.ByteBuffer(new Uint8Array(resBuf!));
    const baseRes = fbs.Base.getRootAsBase(bb);
    // maybeThrowError(baseRes);
    return baseRes;
  }
}