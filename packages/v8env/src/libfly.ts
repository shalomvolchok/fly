import { globalEval } from './global-eval'

type MessageCallback = (name: string, ...args: any[]) => void;
interface Libfly {
  send(name: string, ...args: any[]): null | Uint8Array;
  recv(cb: MessageCallback): void;
  log(x: string): void;
}

// declare const libfly: Libfly;

const window = globalEval("this");
// declare function log(...args: any[]);
// log(window);
export const libfly = window.libfly as Libfly;