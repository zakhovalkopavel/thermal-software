import { useEffect } from 'react';
import { useSiteSettings } from '../hooks/useSiteSettings';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const settings = useSiteSettings();
  const measurementId = settings.data?.gaMeasurementId?.trim();

  useEffect(() => {
    if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) {
      return;
    }
    if (document.getElementById('ga-gtag')) {
      return;
    }
    const script = document.createElement('script');
    script.id = 'ga-gtag';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
  }, [measurementId]);

  return null;
}
