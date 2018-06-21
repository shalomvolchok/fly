#include <v8.h>
#include <node.h>
#include <nan.h>
#include <isolated_vm.h>
#include <uv.h>

#include <string>
#include <sstream>
#include <iostream>
#include <vector>
#include <algorithm>
#include <thread>

#include <openssl/rand.h>
#include <openssl/sha.h>
#include <openssl/err.h>

#include <openssl/ec.h>      // for EC_GROUP_new_by_curve_name, EC_GROUP_free, EC_KEY_new, EC_KEY_set_group, EC_KEY_generate_key, EC_KEY_free
#include <openssl/ecdsa.h>   // for ECDSA_do_sign, ECDSA_do_verify
#include <openssl/obj_mac.h> // for NID_secp256k1

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

std::string str(Isolate *iso, Local<Value> value)
{
  String::Utf8Value s(iso, value);
  if (s.length() == 0)
  {
    return "";
  }
  return *s;
}

struct DigestCallback : public isolated_vm::Runnable
{
  isolated_vm::RemoteHandle<v8::Context> context;
  isolated_vm::RemoteHandle<v8::Promise::Resolver> pr;
  std::string algo;
  isolated_vm::RemoteHandle<v8::ArrayBuffer> data;

  DigestCallback(
      isolated_vm::RemoteHandle<v8::Context> context,
      isolated_vm::RemoteHandle<v8::Promise::Resolver> pr,
      std::string algo,
      isolated_vm::RemoteHandle<v8::ArrayBuffer> data) : context(std::move(context)),
                                                         pr(std::move(pr)),
                                                         algo(std::move(algo)),
                                                         data(std::move(data)) {}

  void Run() override
  {
    v8::Context::Scope context_scope(*context);
    v8::Local<v8::Promise::Resolver> local_pr = *pr;
    v8::Local<v8::ArrayBuffer> local_data = *data;

    Isolate *isolate = v8::Isolate::GetCurrent();

    Local<ArrayBuffer> res;
    if (algo == "sha1")
    {
      res = ArrayBuffer::New(isolate, SHA_DIGEST_LENGTH);
      SHA_CTX sha;
      SHA1_Init(&sha);
      SHA1_Update(&sha, local_data->GetContents().Data(), local_data->ByteLength());
      SHA1_Final(reinterpret_cast<unsigned char *>(res->GetContents().Data()), &sha);
    }
    else if (algo == "sha256")
    {
      res = ArrayBuffer::New(isolate, SHA256_DIGEST_LENGTH);
      SHA256_CTX sha;
      SHA256_Init(&sha);
      SHA256_Update(&sha, local_data->GetContents().Data(), local_data->ByteLength());
      SHA256_Final(reinterpret_cast<unsigned char *>(res->GetContents().Data()), &sha);
    }
    else if (algo == "sha384")
    {
      res = ArrayBuffer::New(isolate, SHA384_DIGEST_LENGTH);
      SHA512_CTX sha;
      SHA384_Init(&sha);
      SHA384_Update(&sha, local_data->GetContents().Data(), local_data->ByteLength());
      SHA384_Final(reinterpret_cast<unsigned char *>(res->GetContents().Data()), &sha);
    }
    else if (algo == "sha512")
    {
      res = ArrayBuffer::New(isolate, SHA512_DIGEST_LENGTH);
      SHA512_CTX sha;
      SHA512_Init(&sha);
      SHA512_Update(&sha, local_data->GetContents().Data(), local_data->ByteLength());
      SHA512_Final(reinterpret_cast<unsigned char *>(res->GetContents().Data()), &sha);
    }

    auto errcode = ERR_get_error();

    if (errcode != 0)
    {
      local_pr->Reject(*context, Exception::Error(String::NewFromUtf8(isolate, ERR_error_string(errcode, NULL))));
      return;
    }
    local_pr->Resolve(*context, res);
  }

  ~DigestCallback() {}
};

struct ImportKeyCallback : public isolated_vm::Runnable
{
  isolated_vm::RemoteHandle<v8::Context> context;
  isolated_vm::RemoteHandle<v8::Promise::Resolver> pr;
  std::string algo;
  isolated_vm::RemoteHandle<v8::ArrayBuffer> data;

  ImportKeyCallback(
      isolated_vm::RemoteHandle<v8::Context> context,
      isolated_vm::RemoteHandle<v8::Promise::Resolver> pr,
      std::string algo,
      isolated_vm::RemoteHandle<v8::ArrayBuffer> data) : context(std::move(context)),
                                                         pr(std::move(pr)),
                                                         algo(std::move(algo)),
                                                         data(std::move(data)) {}
  void Run()
  {
    EC_KEY *eckey = EC_KEY_new();
    EC_GROUP *ecgroup = EC_GROUP_new_by_curve_name(NID_secp256k1);
    EC_KEY_set_group(eckey, ecgroup);
    EC_KEY_generate_key(eckey);
  }
};

void normalize_algorithm(std::string &algo)
{
  algo.erase(std::remove(algo.begin(), algo.end(), '-'), algo.end());
  std::transform(algo.begin(), algo.end(), algo.begin(), ::tolower);
}

NAN_METHOD(digest)
{
  auto isolate = info.GetIsolate();
  Nan::HandleScope scope;
  auto algo = str(isolate, info[0]);

  Local<Context> ctx = isolate->GetCurrentContext();

  Isolate::Scope iso_scope(isolate);
  v8::Context::Scope ctx_scope(ctx);

  Local<Promise::Resolver> pr = Promise::Resolver::New(ctx).ToLocalChecked();

  info.GetReturnValue().Set(pr->GetPromise());

  normalize_algorithm(algo);

  if (std::find(algos.begin(), algos.end(), algo) == algos.end())
  { //not found
    pr->Reject(ctx, Exception::TypeError(String::NewFromUtf8(isolate, "Unsupported algorithm")));
    return;
  }

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
    pr->Reject(ctx, Exception::Error(String::NewFromUtf8(isolate, "Data argument needs to be an ArrayBuffer or ArrayBufferView (ie: TypedArray).")));
    return;
    // cb->Call(Undefined(isolate), 1, argv);
    // return;
  }

  isolated_vm::IsolateHolder isolate_holder = isolated_vm::IsolateHolder::GetCurrent();
  isolated_vm::RemoteHandle<v8::Context> context(ctx);
  isolated_vm::RemoteHandle<v8::Promise::Resolver> rpr(pr);
  isolated_vm::RemoteHandle<v8::ArrayBuffer> rdata(data);

  std::thread digest_thread([=]() mutable {
    isolate_holder.ScheduleTask(
        std::make_unique<DigestCallback>(std::move(context), std::move(rpr), std::move(algo), std::move(rdata)));
  });

  digest_thread.detach();
}

std::string parse_algorithm(Isolate *isolate, Local<Value> val)
{
  std::string s("");
  if (val->IsString())
  {
    s = str(isolate, val);
  }
  else if (val->IsObject())
  {
    s = str(isolate, Local<Object>::Cast(val)->Get(String::NewFromUtf8(isolate, "name")));
  }
  normalize_algorithm(s);
}

NAN_METHOD(importKey)
{
  auto isolate = info.GetIsolate();

  std::string format(str(isolate, info[0]));

  if (format != "raw")
  {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "only the 'raw' format is supported right now.")));
    return;
  }

  Local<ArrayBuffer> data;
  auto keyDataArg = info[1];

  if (keyDataArg->IsArrayBuffer())
  {
    data = Local<ArrayBuffer>::Cast(keyDataArg);
  }
  else if (keyDataArg->IsArrayBufferView())
  {
    data = Local<ArrayBufferView>::Cast(keyDataArg)->Buffer();
  }
  else
  {
    Nan::ThrowTypeError("keyData needs to be an ArrayBuffer-like instance");
    return;
  }

  auto algo = parse_algorithm(isolate, info[2]);

  Local<Context> ctx = isolate->GetCurrentContext();

  Isolate::Scope iso_scope(isolate);
  v8::Context::Scope ctx_scope(ctx);

  Local<Promise::Resolver> pr = Promise::Resolver::New(ctx).ToLocalChecked();

  info.GetReturnValue().Set(pr->GetPromise());

  if (algo != "hmac")
  {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "only HMAC key types are supported at present")));
    return;
  }

  isolated_vm::IsolateHolder isolate_holder = isolated_vm::IsolateHolder::GetCurrent();
  isolated_vm::RemoteHandle<v8::Context> context(ctx);
  isolated_vm::RemoteHandle<v8::Promise::Resolver> rpr(pr);
  isolated_vm::RemoteHandle<v8::ArrayBuffer> rdata(data);

  std::thread generate_key_thread([=]() mutable {
    isolate_holder.ScheduleTask(
        std::make_unique<ImportKeyCallback>(std::move(context), std::move(rpr), std::move(algo), std::move(rdata)));
  });
  generate_key_thread.detach();
}
} // namespace crypto