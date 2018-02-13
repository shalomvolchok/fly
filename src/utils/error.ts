import { ivm } from "../";

export function errorTransferInto(err: Error) {
  return new ivm.ExternalCopy({
    __type: 'error',
    name: err.name,
    message: err.message,
    stack: err.stack
  }).copyInto()
}

export interface TransferredError {
  __type: string,
  name: string,
  message: string,
  stack?: string
}

export function errorTransferFrom(terr: TransferredError) {
  if (terr.__type !== 'error')
    return terr
  let errCtor;
  switch (terr.name) {
    case "TypeError":
      errCtor = TypeError
    case "RangeError":
      errCtor = RangeError
    case "EvalError":
      errCtor = EvalError
    case "ReferenceError":
      errCtor = ReferenceError
    case "SyntaxError":
      errCtor = SyntaxError
    case "URIError":
      errCtor = URIError
    default:
      errCtor = Error
  }
  const err = new errCtor(terr.message)
  err.stack = terr.stack
  return err
}