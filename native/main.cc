#include <v8.h>
#include <nan.h>

#include "text-encoding.h"
#include "crypto.h"

using namespace v8;

extern "C" IVM_DLLEXPORT void InitForContext(Isolate *isolate, Local<Context> context, Local<Object> target)
{
  Local<Object> textEncoding = v8::Object::New(isolate);
  Nan::Set(textEncoding, Nan::New("decode").ToLocalChecked(), Nan::GetFunction(Nan::New<FunctionTemplate>(textencoding::Decode)).ToLocalChecked());
  Nan::Set(textEncoding, Nan::New("encode").ToLocalChecked(), Nan::GetFunction(Nan::New<FunctionTemplate>(textencoding::Encode)).ToLocalChecked());

  Nan::Set(target, Nan::New("textEncoding").ToLocalChecked(), textEncoding);

  Local<Object> cryptoObj = v8::Object::New(isolate);
  Nan::Set(cryptoObj, Nan::New("getRandomValues").ToLocalChecked(), Nan::GetFunction(Nan::New<FunctionTemplate>(crypto::getRandomValues)).ToLocalChecked());
  Nan::Set(cryptoObj, Nan::New("digest").ToLocalChecked(), Nan::GetFunction(Nan::New<FunctionTemplate>(crypto::digest)).ToLocalChecked());

  Nan::Set(target, Nan::New("crypto").ToLocalChecked(), cryptoObj);
}

NAN_MODULE_INIT(init)
{
  Isolate *isolate = Isolate::GetCurrent();
  InitForContext(isolate, isolate->GetCurrentContext(), target);
}
NODE_MODULE(bindings, init);