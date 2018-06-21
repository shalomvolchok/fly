#include "utils/base64.h"
#include <nan.h>
#include <v8.h>

using namespace v8;

namespace base64
{

NAN_METHOD(btoa)
{
  String::Utf8Value s(info[0]->ToString());
  auto iso = info.GetIsolate();
  auto encoded = base64_encode(reinterpret_cast<unsigned char *>(*s), s.length());

  info.GetReturnValue().Set(Nan::New<String>(encoded).ToLocalChecked());
}

} // namespace base64