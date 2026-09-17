'use client';

import React, { useEffect, useRef } from 'react';

export default function AdSenseUnit({
  slot,
  format = 'auto',
  responsive = 'true',
  style = {},
  className = '',
  label = 'ADVERTISEMENT'
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-8272185392622222';
  const pushedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pushedRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch (err) {
      console.warn('[AdSenseUnit] Failed to push ad unit:', err);
    }
  }, []);

  return (
    <div
      className={`aaraa-adsense-wrapper ${className}`.trim()}
      style={{
        margin: '28px 0',
        padding: '16px',
        background: 'rgba(245, 247, 250, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {label && (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#888888',
            marginBottom: '10px',
            display: 'block'
          }}
        >
          {label}
        </span>
      )}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          ...style
        }}
        data-ad-client={client}
        {...(slot ? { 'data-ad-slot': slot } : {})}
        {...(format ? { 'data-ad-format': format } : {})}
        {...(responsive ? { 'data-full-width-responsive': responsive } : {})}
      />
    </div>
  );
}
