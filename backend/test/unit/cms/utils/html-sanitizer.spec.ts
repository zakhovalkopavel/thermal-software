import { HtmlSanitizer } from '../../../../src/modules/cms/utils/html-sanitizer';

describe('HtmlSanitizer', () => {
  it('strips scripts from body html', () => {
    const cleaned = HtmlSanitizer.sanitizeBody(
      '<h2>Title</h2><script>alert(1)</script><p>ok</p>',
    );
    expect(cleaned).toContain('<h2>Title</h2>');
    expect(cleaned).toContain('<p>ok</p>');
    expect(cleaned).not.toContain('script');
  });

  it('returns null for empty body', () => {
    expect(HtmlSanitizer.sanitizeBody('   ')).toBeNull();
    expect(HtmlSanitizer.sanitizeBody(null)).toBeNull();
  });

  it('strips all tags for plain text', () => {
    expect(HtmlSanitizer.sanitizePlainText('<b>Hello</b>')).toBe('Hello');
  });
});
