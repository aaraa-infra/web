import { extractClientIp, getIpGeolocation } from '@/lib/geolocation';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const ip = extractClientIp(request.headers);
    const geo = await getIpGeolocation(ip);
    return Response.json({
      success: true,
      ...geo
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return Response.json({
      success: false,
      visitor_ip: 'Unavailable',
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
    }, { status: 200 });
  }
}
