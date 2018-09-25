import { globalEval } from './global-eval'

type MessageCallback = (msg: Uint8Array, raw: Uint8Array) => void;
interface Libfly {
  recv(cb: MessageCallback): void;
  send(msg: ArrayBufferView, raw: ArrayBufferView | ArrayBufferLike): null | Uint8Array;
  print(x: string): void;
}

const window = globalEval("this");
export const libfly = window.libfly as Libfly;