export function ok<T>(data: T, code = 200) {
  return { statusCode: code, intOpCode: `SxTK${code}`, data };
}

export function fail(code: number, message?: string) {
  return { statusCode: code, intOpCode: `SxTK${code}`, data: null };
}
