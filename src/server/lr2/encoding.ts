import iconv from 'iconv-lite';

export function decodeShiftJISUrlEncoded(encoded: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '%') {
      bytes.push(parseInt(encoded.substring(i + 1, i + 3), 16));
      i += 2;
    } else if (encoded[i] === '+') {
      bytes.push(0x20);
    } else {
      bytes.push(encoded.charCodeAt(i));
    }
  }
  return iconv.decode(Buffer.from(bytes), 'shift_jis');
}

export function parseFormBody(body: string): Map<string, string> {
  const params = new Map<string, string>();
  for (const pair of body.split('&')) {
    if (!pair) continue;
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.substring(0, eqIdx);
    const value = pair.substring(eqIdx + 1);
    params.set(key, decodeShiftJISUrlEncoded(value));
  }
  return params;
}

export function encodeShiftJIS(text: string): Buffer {
  return iconv.encode(text, 'shift_jis');
}

export function createLR2Response(payload: string): Response {
  const body = encodeShiftJIS(`#${payload}`);
  const bytes = new Uint8Array(body);
  return new Response(bytes, {
    headers: {
      'Content-Type': 'text/plain; charset=shift_jis',
      'Content-Length': bytes.length.toString(),
    },
  });
}
