import { HTML_SANITIZE_OPTIONS } from '../constants/html-sanitize.constants';

export class HtmlSanitizer {
  static sanitizeBody(html: string | null | undefined): string | null {
    if (html == null || html.trim() === '') {
      return null;
    }
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

    const allowedTags = new Set<string>(HTML_SANITIZE_OPTIONS.allowedTags);
    const allowedSchemes = new Set<string>(HTML_SANITIZE_OPTIONS.allowedSchemes);
    const attributeMap = HTML_SANITIZE_OPTIONS.allowedAttributes as Record<
      string,
      readonly string[]
    >;

    cleaned = cleaned.replace(
      /<\/?([a-z0-9]+)(\s[^>]*)?>/gi,
      (match, tag: string, attrs: string = '') => {
        const lower = tag.toLowerCase();
        const closing = match.startsWith('</');
        if (!allowedTags.has(lower)) {
          return '';
        }
        if (closing) {
          return `</${lower}>`;
        }
        const allowedNames = new Set<string>([
          ...(attributeMap['*'] ?? []),
          ...(attributeMap[lower] ?? []),
        ]);
        const safeAttrs = (
          attrs.match(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(".*?"|'.*?'|[^\s>]+)/g) ??
          []
        )
          .map((part) => {
            const eq = part.indexOf('=');
            const name = part.slice(0, eq).trim().toLowerCase();
            if (!allowedNames.has(name)) {
              return '';
            }
            let value = part.slice(eq + 1).trim();
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1);
            }
            if (name === 'href' || name === 'src') {
              const scheme = value.split(':', 1)[0]?.toLowerCase();
              if (value.includes(':') && scheme && !allowedSchemes.has(scheme)) {
                return '';
              }
            }
            return ` ${name}="${value.replace(/"/g, '&quot;')}"`;
          })
          .join('');
        return `<${lower}${safeAttrs}>`;
      },
    );

    return cleaned.trim() || null;
  }

  static sanitizePlainText(value: string | null | undefined): string {
    if (value == null) {
      return '';
    }
    return value.replace(/<[^>]*>/g, '').trim();
  }
}
