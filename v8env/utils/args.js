import { errorTransferInto } from './error'

export function transferrableArgs(ivm, args) {
  return args.map((arg) => {
    if (arg instanceof Error)
      arg = new ivm.ExternalCopy(errorTransferInto(arg)).copyInto()
    else if (arg instanceof ivm.Reference)
      arg = arg
    else
      arg = new ivm.ExternalCopy(arg).copyInto()
    return arg // maybe bomb
  })
}
