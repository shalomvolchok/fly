import * as fbs from "./msg_generated";
import * as errors from "./errors";
import * as util from "./util";
import { flatbuffers } from "flatbuffers"
import { sendAsync } from "./bridge";

export function resolv(req: DNSQuery | string): Promise<DNSResponse> {
  let query: DNSQuery = typeof req === "string" ? {
    name: req,
    type: fbs.DnsRecordType.A,
    dns_class: fbs.DnsClass.IN
  } : req

  return new Promise(function resolvPromise(resolve, reject) {
    const fbb = new flatbuffers.Builder();
    const nameStr = fbb.createString(query.name)
    fbs.DnsQuery.startDnsQuery(fbb);
    fbs.DnsQuery.addName(fbb, nameStr);
    fbs.DnsQuery.addDnsClass(fbb, query.dns_class);
    fbs.DnsQuery.addType(fbb, query.type);
    sendAsync(fbb, fbs.Any.DnsQuery, fbs.DnsQuery.endDnsQuery(fbb)).then(baseRes => {
      console.log("hello from resolv response")
      let msg = new fbs.DnsResponse()
      baseRes.msg(msg);
      const answers: DNSRecord[] = [];
      for (let i = 0; i < msg.answersLength(); i++) {
        const ans = msg.answers(i);
        console.log("parsing answer!", i, fbs.DnsRecordData[ans.rdataType()])
        let data: DNSRecordData;
        switch (ans.rdataType()) {
          case fbs.DnsRecordData.DnsA: {
            const d = new fbs.DnsA()
            ans.rdata(d);
            data = d.ip();
            break;
          }
          case fbs.DnsRecordData.DnsAAAA: {
            const d = new fbs.DnsAAAA()
            ans.rdata(d);
            data = d.ip();
            break;
          }
          case fbs.DnsRecordData.DnsNS: {
            const d = new fbs.DnsNS()
            ans.rdata(d)
            data = d.name()
            break;
          }
          default:
            break;
          // return reject(new Error("unhandled record type: " + fbs.DnsRecordData[ans.type()]))
        }
        answers.push({
          name: ans.name(),
          type: ans.type(),
          dns_class: ans.dnsClass(),
          ttl: ans.ttl(),
          data: data,
        })
      }
      resolve({
        id: msg.id(),
        opCode: msg.opCode(),
        type: msg.type(),
        authoritative: msg.authoritative(),
        responseCode: msg.responseCode(),
        answers: answers
      })
    }).catch(reject)
  })
}

export type DNSClass = fbs.DnsClass

export type DNSRecordType = fbs.DnsRecordType

export interface DNSQuery {
  name: string,
  dns_class: DNSClass,
  type: DNSRecordType,
}

export type DNSMessageType = fbs.DnsMessageType

export type DNSOpCode = fbs.DnsOpCode

export type DNSResponseCode = fbs.DnsResponseCode

export interface DNSMessage {
  id: number,
  type: DNSMessageType,
  op_code: DNSOpCode,
  authoritative: boolean,
  truncated: boolean,
  response_code: DNSResponseCode,
  queries: DNSQuery[],
  answers: DNSRecord[],
}

export type DNSRecordData = string

export interface DNSRecord {
  name: string,
  type: DNSRecordType,
  dns_class: DNSClass,
  ttl: number,
  data: DNSRecordData,
}

export interface DNSResponse {
  id: number,
  opCode: DNSOpCode,
  type: DNSMessageType,
  authoritative: boolean,
  responseCode: DNSResponseCode,
  answers: DNSRecord[]
}