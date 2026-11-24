const MAX_NAME_LENGTH = 150;

function shortHash(text: string): string {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (hash >>> 0).toString(36);
}

export function fixtureFileName(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9._=-]+/g, '_').replace(/^_+|_+$/g, '');
  const name = safe.length > MAX_NAME_LENGTH ? `${safe.slice(0, MAX_NAME_LENGTH)}_${shortHash(key)}` : safe;
  return `${name}.json`;
}
