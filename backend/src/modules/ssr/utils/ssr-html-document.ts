import { SSR_CONSTANTS } from '../constants/ssr.constants';

export type SsrDocumentInput = {
  path: string;
  title: string;
  description: string;
  keywords?: string | null;
  ogImageUrl?: string | null;
  canonicalPath?: string | null;
  bodyHtml?: string | null;
  gaMeasurementId?: string;
  siteName?: string;
  bootstrapJson: string;
  assetMode: 'vite-dev' | 'static';
  staticScripts?: string[];
  staticStyles?: string[];
};

export class SsrHtmlDocument {
  static render(input: SsrDocumentInput): string {
    const title = this.escapeAttr(input.title || SSR_CONSTANTS.DEFAULT_TITLE);
    const description = this.escapeAttr(
      input.description || SSR_CONSTANTS.DEFAULT_DESCRIPTION,
    );
    const canonical = this.escapeAttr(input.canonicalPath || input.path);
    const keywords = input.keywords
      ? `<meta name="keywords" content="${this.escapeAttr(input.keywords)}" />`
      : '';
    const ogImage = input.ogImageUrl
      ? `<meta property="og:image" content="${this.escapeAttr(input.ogImageUrl)}" />`
      : '';
    const ga = this.renderGa(input.gaMeasurementId);
    const assets = this.renderAssets(input);
    const content = input.bodyHtml
      ? `<div id="ssr-content">${input.bodyHtml}</div>`
      : '';

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    ${keywords}
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    ${ogImage}
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    ${ga}
    ${assets.styles}
  </head>
  <body>
    ${content}
    <div id="root"></div>
    <script type="application/json" id="${SSR_CONSTANTS.BOOTSTRAP_ELEMENT_ID}">${input.bootstrapJson}</script>
    ${assets.scripts}
  </body>
</html>`;
  }

  private static renderGa(measurementId?: string): string {
    if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) {
      return '';
    }
    const id = this.escapeAttr(measurementId);
    return `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    </script>`;
  }

  private static renderAssets(input: SsrDocumentInput): {
    styles: string;
    scripts: string;
  } {
    if (input.assetMode === 'static') {
      const styles = (input.staticStyles ?? [])
        .map((href) => `<link rel="stylesheet" href="${this.escapeAttr(href)}" />`)
        .join('\n');
      const scripts = (input.staticScripts ?? [])
        .map(
          (src) =>
            `<script type="module" crossorigin src="${this.escapeAttr(src)}"></script>`,
        )
        .join('\n');
      return { styles, scripts };
    }
    return {
      styles: '',
      scripts: `
    <script type="module">
      import RefreshRuntime from "/@react-refresh";
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="/@vite/client"></script>
    <script type="module" src="/src/main.tsx"></script>`,
    };
  }

  private static escapeAttr(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
