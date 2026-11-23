import path from 'node:path';
import { extractClientIp } from './geolocation.js';

/**
 * AARAA Infrastructure — Centralized Security Validation Library
 * Handles:
 * 1. Distributed/Hybrid IP Rate Limiting (Vercel KV/Redis support with memory fallback)
 * 2. Strict MIME & Extension Whitelisting
 * 3. Deep Magic-Number Binary Signature Verification (PDF, PNG, JPEG, DOCX, DOC)
 * 4. Safe Payload Size Guards (4.5 MB Vercel Serverless compatibility)
 */

/* =========================================================================
   1. HYBRID DISTRIBUTED / IN-MEMORY RATE LIMITER
   ========================================================================= */

// In-memory sliding window store (active fallback per serverless container)
const memoryRateLimitStore = new Map();

// Periodic cleanup of stale memory entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryRateLimitStore.entries()) {
      if (now - record.resetTime > 60000) {
        memoryRateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Extracts the real client IP address securely, prioritizing trusted proxy headers.
 * Avoids trusting spoofable client-supplied headers directly.
 */
export function getClientIp(request) {
  return extractClientIp(request.headers);
}

function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  // Basic IPv4 / IPv6 validation
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  const ipv6 = /^[0-9a-fA-F:]{3,39}$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

/**
 * Checks rate limit for a client IP using distributed storage if configured,
 * or serverless in-memory sliding window fallback.
 *
 * @param {string} ip Client IP
 * @param {string} routeKey Prefix identifier for the route
 * @param {number} maxRequests Max allowed requests in the window
 * @param {number} windowMs Window duration in milliseconds
 * @returns {Promise<{ allowed: boolean, remaining: number, retryAfter: number }>}
 */
export async function checkRateLimit(ip, routeKey = 'api', maxRequests = 5, windowMs = 10 * 60 * 1000) {
  const key = `ratelimit:${routeKey}:${ip}`;
  const now = Date.now();

  // 1. Try Distributed Redis/KV via REST if environment variables exist
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      // Atomic INCR + EXPIRE via Redis REST pipeline
      const res = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec]
        ]),
        cache: 'no-store'
      });

      if (res.ok) {
        const results = await res.json();
        const currentCount = results[0]?.result || 1;
        if (currentCount > maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            retryAfter: windowSec
          };
        }
        return {
          allowed: true,
          remaining: Math.max(0, maxRequests - currentCount),
          retryAfter: 0
        };
      }
    } catch (err) {
      console.warn('[RateLimiter Distributed Warning] Falling back to local tier:', err.message);
    }
  }

  // 2. Local Sliding-Window Fallback (Per serverless container instance)
  let record = memoryRateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    record = {
      timestamps: [],
      resetTime: now + windowMs
    };
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter(t => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter)
    };
  }

  record.timestamps.push(now);
  memoryRateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    retryAfter: 0
  };
}

/* =========================================================================
   2. DEEP FILE SIGNATURE & MAGIC NUMBER VALIDATION
   ========================================================================= */

/**
 * Validates binary signature and internal structure of uploaded file buffer.
 * Rejects fake extensions, disguised executables, and malformed files.
 */
export function verifyBinarySignature(buffer, ext) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    return { valid: false, reason: 'File buffer too small or empty.' };
  }

  const cleanExt = ext.toLowerCase();

  // --- PDF Validation ---
  if (cleanExt === '.pdf') {
    // Magic: %PDF- (0x25 0x50 0x44 0x46)
    const isPdfHeader = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (!isPdfHeader) {
      return { valid: false, reason: 'Missing %PDF- header signature.' };
    }
    // Must NOT start with Windows PE executable header MZ
    if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
      return { valid: false, reason: 'Disguised executable detected (MZ header).' };
    }
    // Deep check: Look for %%EOF in the last 2048 bytes
    const searchTail = buffer.subarray(Math.max(0, buffer.length - 2048)).toString('latin1');
    if (!searchTail.includes('%%EOF') && !searchTail.includes('%EOF')) {
      return { valid: false, reason: 'Malformed PDF: Missing EOF marker.' };
    }
    return { valid: true };
  }

  // --- PNG Validation ---
  if (cleanExt === '.png') {
    // Standard 8-byte PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    for (let i = 0; i < 8; i++) {
      if (buffer[i] !== pngSignature[i]) {
        return { valid: false, reason: 'Invalid PNG header signature.' };
      }
    }
    // First chunk must be IHDR (at offset 12: 49 48 44 52)
    const chunkType = buffer.subarray(12, 16).toString('ascii');
    if (chunkType !== 'IHDR') {
      return { valid: false, reason: 'Malformed PNG: First chunk is not IHDR.' };
    }
    // Verify width & height in IHDR are non-zero
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width === 0 || height === 0) {
      return { valid: false, reason: 'Malformed PNG: Invalid dimensions.' };
    }
    return { valid: true };
  }

  // --- JPEG Validation ---
  if (cleanExt === '.jpg' || cleanExt === '.jpeg') {
    // SOI: FF D8
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      return { valid: false, reason: 'Missing JPEG SOI marker (0xFFD8).' };
    }
    // Third byte must be 0xFF (start of marker)
    if (buffer[2] !== 0xFF) {
      return { valid: false, reason: 'Invalid JPEG marker structure.' };
    }
    // Valid marker types: E0 (JFIF), E1 (Exif), E2-EF (App), DB (DQT), C0-C3 (SOF)
    const marker = buffer[3];
    const isValidMarker = (marker >= 0xE0 && marker <= 0xEF) || marker === 0xDB || (marker >= 0xC0 && marker <= 0xCF) || marker === 0xFE;
    if (!isValidMarker) {
      return { valid: false, reason: 'Invalid JPEG application marker.' };
    }
    return { valid: true };
  }

  // --- DOCX / Modern Office Validation (ZIP Container) ---
  if (cleanExt === '.docx' || cleanExt === '.xlsx') {
    // ZIP Header: PK\x03\x04
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isZip) {
      return { valid: false, reason: 'Invalid DOCX: Missing PK Zip container header.' };
    }
    // Deep inspection: Scan for standard Office XML parts: [Content_Types].xml or word/ or _rels/
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
    const hasOfficeParts = sample.includes('[Content_Types].xml') || sample.includes('word/') || sample.includes('_rels/');
    if (!hasOfficeParts) {
      return { valid: false, reason: 'Invalid DOCX: Missing Office Open XML package structure.' };
    }
    return { valid: true };
  }

  // --- Legacy DOC Validation ---
  if (cleanExt === '.doc') {
    // OLE Compound File: D0 CF 11 E0 A1 B1 1A E1
    const isOle = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
    // Or modern DOCX saved with .doc extension
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isOle && !isZip) {
      return { valid: false, reason: 'Invalid DOC: Missing OLE or Zip signature.' };
    }
    return { valid: true };
  }

  return { valid: false, reason: `Unsupported extension: ${cleanExt}` };
}

/* =========================================================================
   3. COMPREHENSIVE FILE SECURITY VALIDATOR
   ========================================================================= */

/**
 * Validates filename, extension, MIME type, size, and binary signature.
 * Enforces 4.5 MB maximum limit to guarantee zero 413 drops at Vercel Edge.
 */
export function validateUploadedFile(fileInfo, allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']) {
  const { originalname, mimetype, size, buffer } = fileInfo;

  if (!originalname || typeof originalname !== 'string') {
    return { valid: false, status: 400, message: 'Invalid or missing file name.' };
  }

  // 1. Extension Whitelist
  const ext = path.extname(originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      status: 400,
      message: `File extension '${ext}' is not permitted. Allowed: ${allowedExts.join(', ')}`
    };
  }

  // 2. MIME Whitelist
  const MIME_MAP = {
    '.pdf': ['application/pdf'],
    '.png': ['image/png'],
    '.jpg': ['image/jpeg', 'image/pjpeg'],
    '.jpeg': ['image/jpeg', 'image/pjpeg'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream'
    ],
    '.doc': [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream'
    ]
  };

  const expectedMimes = MIME_MAP[ext] || [];
  if (mimetype && expectedMimes.length > 0 && !expectedMimes.includes(mimetype.toLowerCase())) {
    return {
      valid: false,
      status: 400,
      message: `Declared MIME type '${mimetype}' does not match file extension '${ext}'.`
    };
  }

  // 3. Size Enforcement (4.5 MB Vercel Serverless Gateway Safe Limit)
  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB = 4,718,592 bytes
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      status: 413,
      message: 'File size exceeds maximum permitted limit (4.5 MB).'
    };
  }

  // 4. Deep Binary Signature Inspection
  if (buffer) {
    const sigCheck = verifyBinarySignature(buffer, ext);
    if (!sigCheck.valid) {
      return {
        valid: false,
        status: 400,
        message: `File verification failed: ${sigCheck.reason}`
      };
    }
  }

  return { valid: true };
}
