'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function AdSenseScript() {
  const pathname = usePathname() || '';
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8272185392622222';

  // Exclude AdSense on non-content, admin, form, thin location, or legal policy routes to prevent AdSense Policy Violations
  // Also exclude on homepage to eliminate 1.1s of third-party script execution on corporate landing
  const isExcluded =
    pathname === '/' ||
    pathname === '' ||
    pathname.startsWith('/careers/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/location/') ||
    pathname.includes('privacy') ||
    pathname.includes('copyright') ||
    pathname.includes('policy') ||
    pathname.includes('404');

  if (isExcluded) {
    return null;
  }

  return (
    <Script
      id="google-adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
