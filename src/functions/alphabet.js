export function foldASCII(value) {
  let result = '';
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      result += value.slice(start, i) + String.fromCharCode(code + 32);
      start = i + 1;
    }
  }
  return start === 0 ? value : result + value.slice(start);
}
export function validateParams({patterns, ignoreCase = false}) {
  if (!Array.isArray(patterns) || !patterns.length || Array.from(patterns).some(p => typeof p !== 'string' || p.length === 0)) {
    throw new TypeError('Provide one or more nonempty patterns.');
  }
  if (typeof ignoreCase !== 'boolean') throw new TypeError('ignoreCase must be a boolean.');
}
