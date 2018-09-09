// /**
//  * @module timers
//  */

// declare var bridge: any

// /**
//  * Fires a callback function after the specified time elapses.
//  * @param cb function to execute after time elapses
//  * @param ms milliseconds to wait before executing
//  * @return an ID for the newly created timeout
//  */
// export function setTimeout(cb, ms) {
//   const ref = bridge.wrapFunction(cb)
//   return bridge.dispatchSync("setTimeout", ref, ms)
// }

// /**
//  * Cancels a previously specified timeout
//  * @param id the id of the timeout to cancel
//  */
// export function clearTimeout(id) {
//   bridge.dispatch("clearTimeout", id)
// }

// /**
//  * Fires a callback after the current task yields
//  * @param cb The callback to fire asynchronously
//  */
// export function setImmediate(cb) {
//   setTimeout(cb, 0)
// }

// /**
//  * Fires a callback over and over
//  * @param cb The callback to fire every <ms> milliseconds
//  * @param ms Milliseconds to wait between intervals
//  * @return id of newly created interval
//  */
// export function setInterval(cb, ms) {
//   const ref = bridge.wrapFunction(cb)
//   return bridge.dispatchSync("setInterval", ref, ms)
// }

// /**
//  * Cancels the previously created interval
//  * @param id The interval ID to cancel
//  */
// export function clearInterval(id) {
//   bridge.dispatch("clearInterval", id)
// }


// Copyright 2018 the Deno authors. All rights reserved. MIT license.
import { libfly } from './libfly';
import { assert } from "./util";
import { fly as fbs } from "./msg_generated";
import { flatbuffers } from "flatbuffers";
import { send } from "./fbs_util";

let nextTimerId = 1;

// tslint:disable-next-line:no-any
export type TimerCallback = (...args: any[]) => void;

interface Timer {
  id: number;
  cb: TimerCallback;
  interval: boolean;
  // tslint:disable-next-line:no-any
  args: any[];
  delay: number; // milliseconds
}

const timers = new Map<number, Timer>();

/** @internal */
export function onMessage(msg: fbs.TimerReady) {
  const timerReadyId = msg.id();
  const timerReadyDone = msg.done();
  const timer = timers.get(timerReadyId);
  if (!timer) {
    return;
  }
  timer.cb(...timer.args);
  if (timerReadyDone) {
    timers.delete(timerReadyId);
  }
}

function startTimer(
  cb: TimerCallback,
  delay: number,
  interval: boolean,
  // tslint:disable-next-line:no-any
  args: any[]
): number {
  const timer = {
    id: nextTimerId++,
    interval,
    delay,
    args,
    cb
  };
  timers.set(timer.id, timer);

  console.log("timers.ts startTimer");
  let now = Date.now()

  // Send TimerStart message
  const builder = new flatbuffers.Builder();
  fbs.TimerStart.startTimerStart(builder);
  fbs.TimerStart.addId(builder, timer.id);
  fbs.TimerStart.addInterval(builder, timer.interval);
  fbs.TimerStart.addDelay(builder, timer.delay);
  const msg = fbs.TimerStart.endTimerStart(builder);
  const baseRes = send(builder, fbs.Any.TimerStart, msg);
  console.log("timers.ts startTimer end:", Date.now() - now);
  assert(baseRes == null);
  return timer.id;
}

export function setTimeout(
  cb: TimerCallback,
  delay: number,
  // tslint:disable-next-line:no-any
  ...args: any[]
): number {
  return startTimer(cb, delay, false, args);
}

export function setInterval(
  cb: TimerCallback,
  delay: number,
  // tslint:disable-next-line:no-any
  ...args: any[]
): number {
  return startTimer(cb, delay, true, args);
}

export function clearTimer(id: number) {
  timers.delete(id);

  const builder = new flatbuffers.Builder();
  fbs.TimerClear.startTimerClear(builder);
  fbs.TimerClear.addId(builder, id);
  const msg = fbs.TimerClear.endTimerClear(builder);
  const res = send(builder, fbs.Any.TimerClear, msg);
  assert(res == null);
}
