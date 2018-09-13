import { globalEval } from './global-eval'

type MessageCallback = (cmdId: number, name: string, ...args) => number;
interface Libfly {
  send(cmdId: number, name: string, sync: boolean, ...args): any;
  recv(cb: MessageCallback): void;
  log(x: string): void;
}

// declare const libfly: Libfly;

const window = globalEval("this");
// declare function log(...args: any[]);
// log(window);
export const libfly = window.libfly as Libfly;