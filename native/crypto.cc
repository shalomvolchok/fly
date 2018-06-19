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
#include <openssl/err.h>

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

NAN_METHOD(digest)
{
  auto isolate = info.GetIsolate();
  Nan::HandleScope scope;
  auto algo = str(isolate, info[0]);

  algo.erase(std::remove(algo.begin(), algo.end(), '-'), algo.end());
  std::transform(algo.begin(), algo.end(), algo.begin(), ::tolower);

  std::cout << "algo: " << algo << "\n";

  auto ctx = isolate->GetCurrentContext();

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

  Isolate::Scope iso_scope(isolate);
  v8::Context::Scope ctx_scope(ctx);

  Local<ArrayBuffer> res;
  if (algo == "sha1")
  {
    std::cout << "doing sha1\n";
    res = ArrayBuffer::New(isolate, 20);
    SHA1((unsigned char *)data->GetContents().Data(), data->ByteLength(), (unsigned char *)res->GetContents().Data());
  }

  auto errcode = ERR_get_error();

  if (errcode == 0)
  {
    std::cout << "no error" << std::endl;
  }
  else
  {
    isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate, ERR_error_string(errcode, NULL))));
    return;
  }

  info.GetReturnValue().Set(res);
}
} // namespace crypto