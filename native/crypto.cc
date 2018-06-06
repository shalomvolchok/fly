#include <v8.h>
#include <node.h>
#include <nan.h>
#include <uv.h>

#include <string>
#include <sstream>
#include <iostream>
#include <vector>
#include <algorithm>

#include <openssl/rand.h>
#include <openssl/sha.h>

using namespace v8;
using namespace node;

namespace crypto
{
NAN_METHOD(getRandomValues)
{
  Local<Value> arg1 = info[0];
  if (!arg1->IsTypedArray() || arg1->IsFloat32Array() || arg1->IsFloat64Array())
  {
    Nan::ThrowTypeError("Argument should be an integer array");
    return;
  }

  Local<TypedArray> tarr = Local<TypedArray>::Cast(arg1);

  if (tarr->ByteLength() > 64 * 1024)
  {
    std::ostringstream stream;
    stream << "The ArrayBufferView's byte length (" << tarr->ByteLength() << ") exceeds the number of bytes of entropy available via this API (65536).";
    Nan::ThrowError(stream.str().c_str());
    return;
  }

  RAND_bytes((unsigned char *)tarr->Buffer()->GetContents().Data(), tarr->ByteLength());
}

static std::vector<std::string> algos = {"sha1", "sha256", "sha384", "sha512"};

struct crypto_job
{
  std::string algo;
  Isolate *isolate;
  Persistent<Context> context;
  Persistent<Function> cb;
  Persistent<ArrayBuffer> data;
};

std::string str(Isolate *iso, Local<Value> value)
{
  String::Utf8Value s(iso, value);
  if (s.length() == 0)
  {
    return "";
  }
  return *s;
}

static void
crypto_work_cb(uv_work_t *req)
{
  std::cout << "IN CRYPTO WORK!\n";
  crypto_job *job = static_cast<crypto_job *>(req->data);

  Locker locker(job->isolate);
  Isolate::Scope iso_scope(job->isolate);
  HandleScope scope(job->isolate);

  Local<Context> context = job->context.Get(job->isolate);
  v8::Context::Scope ctx_scope(context);

  Local<ArrayBuffer> data = job->data.Get(job->isolate);

  // std::cout << "PPR is empty? " << (job->pr.IsEmpty() ? "true" : "false") << "\n";
  Local<Function> cb = job->cb.Get(job->isolate);
  // std::cout << "PR is empty? " << (pr.IsEmpty() ? "true" : "false") << "\n";

  Local<ArrayBuffer> res;
  if (job->algo == "sha1")
  {
    std::cout << "doing sha1\n";
    res = ArrayBuffer::New(job->isolate, 20);
    SHA1((unsigned char *)data->GetContents().Data(), data->ByteLength(), (unsigned char *)res->GetContents().Data());
  }
  int argc = 2;
  Local<Value> argv[argc];
  argv[0] = Null(job->isolate);
  argv[1] = res;
  cb->Call(context, Undefined(job->isolate), argc, argv);
  // Maybe<bool> pr_res = pr->Resolve(context, res);
  // if (pr_res.IsNothing())
  // {
  //   std::cout << "pr_res was nothing!";
  // }
  // else
  // {
  //   std::cout << "pr_res wasn't nothing! " << (pr_res.FromJust() ? "true" : "false") << std::endl;
  // }
  std::cout << "after work cb\n";
}

// static void
// crypto_async_cb(uv_async_t *req)
// {
//   std::cout << "IN CRYPTO WORK!\n";
//   auto job = static_cast<crypto_job *>(req->data);

//   Locker locker(job->isolate);
//   Isolate::Scope iso_scope(job->isolate);
//   HandleScope scope(job->isolate);

//   Local<Context> ctx = job->context.Get(job->isolate);
//   v8::Context::Scope context_scope(ctx);

//   Local<ArrayBuffer> data = job->data.Get(job->isolate);

//   if (job->algo == "sha1")
//   {
//     Local<ArrayBuffer> res = ArrayBuffer::New(job->isolate, 20);
//     SHA1((unsigned char *)data->GetContents().Data(), data->ByteLength(), (unsigned char *)res->GetContents().Data());
//     std::cout << "PPR is empty? " << (job->pr.IsEmpty() ? "true" : "false") << "\n";
//     Local<Promise::Resolver> pr = job->pr.Get(job->isolate);
//     std::cout << "PR is empty? " << (pr.IsEmpty() ? "true" : "false") << "\n";
//     pr->Resolve(ctx, res);
//   }
// }

static void after_crypto_work_cb(uv_work_t *req, int status)
{
  std::cout << "AFTER CRYPTO WORK! status: " << status << "\n";
  auto job = (crypto_job *)req->data;
  job->context.Reset();
  job->cb.Reset();
  job->data.Reset();
  delete job;
}

NAN_METHOD(digest)
{
  auto isolate = info.GetIsolate();
  Nan::HandleScope scope;
  // Local<String::Utf8Value> algoArg(info[0]);
  auto algo = str(isolate, info[0]);

  algo.erase(std::remove(algo.begin(), algo.end(), '-'), algo.end());
  std::transform(algo.begin(), algo.end(), algo.begin(), ::tolower);

  std::cout << "algo: " << algo << "\n";

  auto ctx = isolate->GetCurrentContext();
  // Local<Promise::Resolver> pr = Promise::Resolver::New(ctx).ToLocalChecked();

  // info.GetReturnValue().Set(pr->GetPromise()); // this wants a promise...

  Local<Function> cb = Local<Function>::Cast(info[2]);

  Local<Value> dataArg = info[1];
  Local<ArrayBuffer> data;
  if (dataArg->IsArrayBuffer())
  {
    data = Local<ArrayBuffer>::Cast(dataArg);
  }
  else if (dataArg->IsArrayBufferView())
  {
    data = Local<ArrayBufferView>::Cast(dataArg)->Buffer();
  }
  else
  {
    isolate->ThrowException(String::NewFromUtf8(isolate, "Data argument needs to be an ArrayBuffer or ArrayBufferView (ie: TypedArray)."));
    return;
    // cb->Call(Undefined(isolate), 1, argv);
    // return;
  }

  if (std::find(algos.begin(), algos.end(), algo) == algos.end())
  { //not found
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Unsupported algorithm")));
    return;
  }

  auto job = new crypto_job;
  job->isolate = info.GetIsolate();
  job->context.Reset(isolate, ctx);
  job->cb.Reset(isolate, cb);
  job->data.Reset(isolate, data);
  job->algo = algo;

  // uv_async_t *async = new uv_async_t;
  // async->data = job;
  // uv_async_init(uv_default_loop(), async, crypto_async_cb);
  // uv_async_send(async);

  uv_work_t *work = new uv_work_t;
  work->data = job;
  uv_queue_work(uv_default_loop(), work, crypto_work_cb, after_crypto_work_cb);
}
} // namespace crypto