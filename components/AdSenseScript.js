import Script from 'next/script';

export default function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8272185392622222';

  return (
    <Script
      id="google-adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
