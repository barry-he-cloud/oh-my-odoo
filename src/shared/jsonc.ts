import { parse, ParseError, printParseErrorCode } from "jsonc-parser"

export function parseJsonc<T = unknown>(content: string): T {
  const stripped = content.replace(/^\uFEFF/, "")
  const errors: ParseError[] = []
  const result = parse(stripped, errors, { allowTrailingComma: true })
  if (errors.length > 0) {
    const msg = errors.map(e => `${printParseErrorCode(e.error)} at offset ${e.offset}`).join(", ")
    throw new Error(`JSONC parse error: ${msg}`)
  }
  return result as T
}
