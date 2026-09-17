'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const insRef = useRef(null);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (err) {
        console.warn('[AdSenseUnit] Failed to push ad unit:', err);
      }
    }

    const element = insRef.current;
    if (element) {
      const checkStatus = () => {
        if (element.getAttribute('data-ad-status') === 'unfilled') {
          setIsUnfilled(true);
        }
      };
      checkStatus();
      const observer = new MutationObserver(checkStatus);
      observer.observe(element, { attributes: true, attributeFilter: ['data-ad-status'] });
      return () => observer.disconnect();
    }
  }, []);

  if (isUnfilled) {
    return null;
  }

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
        ref={insRef}
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
