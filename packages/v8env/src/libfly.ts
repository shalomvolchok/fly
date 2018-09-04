import { globalEval } from './global-eval'

type MessageCallback = (msg: Uint8Array) => void;
interface Libfly {
  send(msg: ArrayBufferView): null | Uint8Array;
  recv(cb: MessageCallback): void;
  log(x: string): void;
}

// declare const libfly: Libfly;

const window = globalEval("this");
// declare function log(...args: any[]);
// log(window);
export const libfly = window.libfly as Libfly;