import { SsrHtmlDocument } from '../../../../src/modules/ssr/utils/ssr-html-document';

describe('SsrHtmlDocument', () => {
  it('renders title, description and bootstrap payload', () => {
    const html = SsrHtmlDocument.render({
      path: '/about',
      title: 'About — Thermal Software',
      description: 'Developer contact',
      bodyHtml: '<h2>About</h2>',
      bootstrapJson: '{"path":"/about"}',
      assetMode: 'vite-dev',
      gaMeasurementId: 'G-TEST123',
    });

    expect(html).toContain('<title>About — Thermal Software</title>');
    expect(html).toContain('name="description" content="Developer contact"');
    expect(html).toContain('id="ssr-content"><h2>About</h2></div>');
    expect(html).toContain('id="page-bootstrap">{"path":"/about"}</script>');
    expect(html).toContain('gtag/js?id=G-TEST123');
    expect(html).toContain('/@vite/client');
  });

  it('omits gtag when measurement id is empty', () => {
    const html = SsrHtmlDocument.render({
      path: '/',
      title: 'Home',
      description: 'Home',
      bootstrapJson: '{}',
      assetMode: 'vite-dev',
      gaMeasurementId: '',
    });
    expect(html).not.toContain('googletagmanager');
  });
});
