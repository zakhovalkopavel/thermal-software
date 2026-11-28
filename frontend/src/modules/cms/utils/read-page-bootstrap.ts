import type { PageBootstrap } from '../types/page-bootstrap.type';

export class PageBootstrapReader {
  static read(): PageBootstrap | null {
    const element = document.getElementById('page-bootstrap');
    if (!element?.textContent) {
      return null;
    }
    try {
      return JSON.parse(element.textContent) as PageBootstrap;
    } catch {
      return null;
    }
  }
}
