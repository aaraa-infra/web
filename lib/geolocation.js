/**
 * AARAA Infrastructure — Centralized IP Detection & Geolocation Enrichment
 *
 * Implements server-side IP extraction from trusted proxy headers (Cloudflare, Vercel),
 * public IPv4/IPv6 validation, in-memory TTL caching, and resilient fail-open
 * geolocation enrichment.
 */

// In-memory LRU/TTL cache for IP geolocation (reduces external API calls)
const geoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 10000;
const LOOKUP_TIMEOUT_MS = 1500; // 1.5 seconds fail-open timeout

/**
 * Checks if an IP is a valid public IPv4 or IPv6 address.
 * Rejects private, loopback, link-local, multicast, and reserved addresses.
 */
export function isPublicIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const clean = ip.trim();

  // IPv4 validation
  const ipv4Match = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1, 5).map(Number);
    if (octets.some(o => o < 0 || o > 255)) return false;

    // Loopback 127.0.0.0/8
    if (octets[0] === 127) return false;
    // Private 10.0.0.0/8
    if (octets[0] === 10) return false;
    // Private 172.16.0.0/12
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false;
    // Private 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) return false;
    // Link-local 169.254.0.0/16
    if (octets[0] === 169 && octets[1] === 254) return false;
    // Broadcast / Zero
    if (octets[0] === 0 || octets[0] >= 224) return false;

    return true;
  }

  // IPv6 validation
  if (clean.includes(':')) {
    const lower = clean.toLowerCase();
    // Loopback ::1
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return false;
    // Unique local fc00::/7
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false;
    // Link-local fe80::/10
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return false;
    // Multicast ff00::/8
    if (lower.startsWith('ff')) return false;

    return true;
  }

  return false;
}

/**
 * Extracts the trusted client IP address from request headers in strict priority order.
 * 1. cf-connecting-ip (Cloudflare edge)
 * 2. x-vercel-forwarded-for / x-vercel-ip (Vercel serverless edge)
 * 3. x-forwarded-for (leftmost public IP)
 * 4. x-real-ip
 */
export function extractClientIp(headers) {
  if (!headers) return '127.0.0.1';

  const getHeader = (name) => {
    if (typeof headers.get === 'function') return headers.get(name);
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  // 1. Cloudflare
  const cfIp = getHeader('cf-connecting-ip');
  if (cfIp && isPublicIp(cfIp.trim())) return cfIp.trim();

  // 2. Vercel Forwarded
  const vercelForwarded = getHeader('x-vercel-forwarded-for');
  if (vercelForwarded) {
    const firstIp = vercelForwarded.split(',')[0].trim();
    if (isPublicIp(firstIp)) return firstIp;
  }

  const vercelIp = getHeader('x-vercel-ip');
  if (vercelIp && isPublicIp(vercelIp.trim())) return vercelIp.trim();

  // 3. Standard x-forwarded-for (iterate from leftmost to find first valid public IP)
  const xForwardedFor = getHeader('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(s => s.trim());
    for (const candidate of ips) {
      if (isPublicIp(candidate)) return candidate;
    }
  }

  // 4. x-real-ip
  const realIp = getHeader('x-real-ip');
  if (realIp && isPublicIp(realIp.trim())) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Clean cache eviction helper.
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of geoCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      geoCache.delete(key);
    }
  }
}

/**
 * Performs server-side approximate geolocation lookup with in-memory caching and fail-open timeout.
 * Never throws — always returns a safe, consistent metadata object.
 */
export async function getIpGeolocation(ip) {
  const fallback = {
    visitor_ip: ip || 'Unavailable',
    visitor_country: 'Unavailable',
    visitor_country_code: 'Unavailable',
    visitor_state: 'Unavailable',
    visitor_city: 'Unavailable',
    visitor_postal_code: 'Unavailable',
    visitor_latitude: 'Unavailable',
    visitor_longitude: 'Unavailable',
    visitor_isp: 'Unavailable',
    visitor_asn: 'Unavailable',
    visitor_timezone: 'Unavailable'
  };

  if (!ip || !isPublicIp(ip)) {
    return {
      ...fallback,
      visitor_ip: ip || 'Unavailable',
      visitor_city: ip === '127.0.0.1' || ip === '::1' ? 'Local Development' : 'Unavailable'
    };
  }

  // Check in-memory cache
  const cached = geoCache.get(ip);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

    let data = null;

    // Primary: IPinfo (if token configured or public free)
    const ipinfoToken = process.env.IPINFO_TOKEN;
    const ipinfoUrl = ipinfoToken
      ? `https://ipinfo.io/${ip}/json?token=${ipinfoToken}`
      : `https://ipinfo.io/${ip}/json`;

    try {
      const res = await fetch(ipinfoUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      // IPinfo attempt failed or timed out
    }

    // Secondary fallback: ip-api.com if IPinfo did not return valid data
    if (!data || data.bogon) {
      try {
        const fallbackRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        if (fallbackRes.ok) {
          const fbJson = await fallbackRes.json();
          if (fbJson && fbJson.status === 'success') {
            data = {
              ip: fbJson.query,
              country: fbJson.country,
              country_code: fbJson.countryCode,
              region: fbJson.regionName,
              city: fbJson.city,
              postal: fbJson.zip,
              loc: fbJson.lat && fbJson.lon ? `${fbJson.lat},${fbJson.lon}` : null,
              org: fbJson.org || fbJson.isp || fbJson.as,
              timezone: fbJson.timezone
            };
          }
        }
      } catch (e) {}
    }

    clearTimeout(timeoutId);

    if (data && !data.bogon) {
      let lat = 'Unavailable';
      let lon = 'Unavailable';
      if (data.loc && data.loc.includes(',')) {
        const parts = data.loc.split(',');
        lat = `${parts[0].trim()} (approx)`;
        lon = `${parts[1].trim()} (approx)`;
      }

      // Extract ASN and ISP
      let orgStr = data.org || 'Unavailable';
      let asnStr = 'Unavailable';
      let ispStr = orgStr;
      if (orgStr && orgStr.startsWith('AS')) {
        const spaceIdx = orgStr.indexOf(' ');
        if (spaceIdx > 0) {
          asnStr = orgStr.slice(0, spaceIdx);
          ispStr = orgStr.slice(spaceIdx + 1);
        } else {
          asnStr = orgStr;
        }
      }

      const result = {
        visitor_ip: ip,
        visitor_country: data.country || 'Unavailable',
        visitor_country_code: data.country_code || data.countryCode || 'Unavailable',
        visitor_state: data.region || 'Unavailable',
        visitor_city: data.city || 'Unavailable',
        visitor_postal_code: data.postal || data.zip || 'Unavailable',
        visitor_latitude: lat,
        visitor_longitude: lon,
        visitor_isp: ispStr || 'Unavailable',
        visitor_asn: asnStr || 'Unavailable',
        visitor_timezone: data.timezone || 'Unavailable'
      };

      // Store in cache
      if (geoCache.size >= MAX_CACHE_ENTRIES) cleanExpiredCache();
      geoCache.set(ip, { timestamp: Date.now(), data: result });

      return result;
    }
  } catch (err) {
    // Fail-open: Never throw, return fallback
  }

  return fallback;
}
