#include <v8.h>
#include <node.h>
#include <nan.h>

#include <stdint.h>
#include <cstring>
#include <vector>
#include <iostream>

#include "text-encoding.h"

using namespace v8;
using namespace node;

namespace textencoding
{
NAN_METHOD(Decode)
{
  Nan::HandleScope scope;

  if (info.Length() == 0)
  {
    Nan::ThrowError("at least 1 argument is required");
    return;
  }

  v8::Local<v8::Value> arg1 = info[0];
  v8::Local<v8::ArrayBuffer> buf;
  if (arg1->IsArrayBuffer())
  {
    buf = v8::Local<v8::ArrayBuffer>::Cast(arg1);
  }
  else if (arg1->IsArrayBufferView())
  { //
    buf = v8::Local<v8::ArrayBufferView>::Cast(arg1)->Buffer();
  }
  else
  {
    Nan::ThrowTypeError("first argument must be an array buffer-like object");
    return;
  }

  size_t length = buf->ByteLength();
  char *data = (char *)buf->GetContents().Data();

  size_t split = 0;
  size_t i = 0;

  Local<String> result = Nan::EmptyString();

  while (i < length)
  {
    if ((data[i] & 0xF0) == 0xF0 && i + 4 <= length)
    {
      result = String::Concat(result, Nan::New<String>(data, i).ToLocalChecked());
      std::cout << "concated\n";

      // Convert 4-byte UTF-8 to Unicode code point
      uint32_t chr = (((data[i] & 0x07) << 18) | ((data[i + 1] & 0x3F) << 12) | ((data[i + 2] & 0x3F) << 6) | (data[i + 3] & 0x3F)) - 0x10000;

      // Write as surrogate pair
      uint16_t surrogate[2] = {static_cast<uint16_t>(0xD800 | (chr >> 10)), static_cast<uint16_t>(0xDC00 | (chr & 0x3FF))};

      // Concatenate to result
      result = String::Concat(result, Nan::New<String>(surrogate, 2).ToLocalChecked());

      data += i + 4;
      length -= (i + 4);
      i = 0;
    }
    else
    {
      i++;
    }
  }

  info.GetReturnValue().Set(String::Concat(result, Nan::New<String>(data + split, length - split).ToLocalChecked()));
}

void replacement_character(std::vector<char> &vector)
{
  vector.push_back(0xEF);
  vector.push_back(0xBB);
  vector.push_back(0xBF);
}

NAN_METHOD(Encode)
{
  Nan::HandleScope scope;

  if (!info[0]->IsString())
  {
    Nan::ThrowTypeError("Argument should be a String.");
  }

  Local<String> string = info[0]->ToString();
  String::Value int16value(info.GetIsolate(), string);
  const uint16_t *data = *int16value;
  const size_t length = string->Length();
  size_t i = 0;

  std::vector<char> accumulator;
  // Reserve enough space for ASCII string
  accumulator.reserve(string->Length());

  while (i < length)
  {
    const uint16_t chr = data[i];
    if (chr < 0x80)
    {
      accumulator.push_back((char)chr);
    }
    else if (chr < 0x800)
    {
      accumulator.push_back(0xC0 | (chr >> 6));
      accumulator.push_back(0x80 | (chr & 0x3F));
    }
    else if (chr < 0xD800 || chr >= 0xE000)
    {
      accumulator.push_back(0xE0 | (chr >> 12));
      accumulator.push_back(0x80 | (chr >> 6 & 0x3F));
      accumulator.push_back(0x80 | (chr & 0x3F));
    }
    else if (chr >= 0xD800 && chr <= 0xDBFF && i + 1 < length)
    {
      const uint16_t next = data[++i];
      if (next < 0xDC00 || next > 0xDFFF)
      {
        replacement_character(accumulator);
        continue;
      }
      const uint32_t unicode = (((chr & 0x3FF) << 10) | (next & 0x3FF)) + 0x10000;
      accumulator.push_back(0xF0 | (unicode >> 18));
      accumulator.push_back(0x80 | (unicode >> 12 & 0x3F));
      accumulator.push_back(0x80 | (unicode >> 6 & 0x3F));
      accumulator.push_back(0x80 | (unicode & 0x3F));
    }
    else
    {
      replacement_character(accumulator);
    }
    i++;
  }

  auto ab = ArrayBuffer::New(info.GetIsolate(), accumulator.size());
  memcpy(ab->GetContents().Data(), &accumulator[0], accumulator.size());
  info.GetReturnValue().Set(ab);
}
} // namespace textencoding