/**
 * Type representing values that can be coerced to/from Base64 or ArrayBuffer
 */
type CoercibleValue =
  | string
  | ArrayBuffer
  | ArrayBufferView
  | Uint8Array
  | number[]
  | ArrayLike<number>
  | ArrayBufferLike;

export function coerceToBase64Url(thing: CoercibleValue, name: string) {
  // Array or ArrayBuffer to Uint8Array
  if (Array.isArray(thing)) {
    thing = Uint8Array.from(thing);
  }

  if (thing instanceof ArrayBuffer) {
    thing = new Uint8Array(thing);
  }

  // Uint8Array to base64
  if (thing instanceof Uint8Array) {
    let str = "";
    const len = thing.byteLength;

    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(thing[i]);
    }
    thing = window.btoa(str);
  }

  if (typeof thing !== "string") {
    throw new Error("could not coerce '" + name + "' to string");
  }

  // base64 to base64url
  // NOTE: "=" at the end of challenge is optional, strip it off here
  thing = thing.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");

  return thing;
}

export function coerceToArrayBuffer(thing: CoercibleValue, name: string) {
  if (typeof thing === "string") {
    // base64url to base64
    thing = thing.replace(/-/g, "+").replace(/_/g, "/");

    // base64 to Uint8Array
    const str = window.atob(thing);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    thing = bytes;
  }

  // Array to Uint8Array
  if (Array.isArray(thing)) {
    thing = new Uint8Array(thing);
  }

  // Uint8Array to ArrayBuffer
  if (thing instanceof Uint8Array) {
    thing = thing.buffer;
  }

  // error if none of the above worked
  if (!(thing instanceof ArrayBuffer)) {
    throw new TypeError("could not coerce '" + name + "' to ArrayBuffer");
  }

  return thing;
}
