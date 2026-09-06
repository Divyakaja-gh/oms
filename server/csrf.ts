import crypto from 'crypto';
import express from 'express';

// Secret key for generating state-changing HMAC CSRF tokens
const CSRF_SECRET = process.env.CSRF_SECRET || 'soc2-caoms-csrf-protection-secret-key-2026';

// Issue an anti-CSRF token
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', CSRF_SECRET)
    .update(`${timestamp}:${random}`)
    .digest('hex').slice(0, 24);
  return `${timestamp}.${random}.${signature}`;
}

// Verify an anti-CSRF token
export function verifyCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [timestamp, random, signature] = parts;
  const expected = crypto.createHmac('sha256', CSRF_SECRET)
    .update(`${timestamp}:${random}`)
    .digest('hex').slice(0, 24);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Extract and validate request origin / referer against server host and trusted domains
export function isAllowedOrigin(originHeader?: string, hostHeader?: string): boolean {
  if (!originHeader) return true; // Non-browser or same-origin direct request
  try {
    const url = new URL(originHeader);
    const originHostname = url.hostname.toLowerCase();

    // Allow local development and standard dev container loopbacks
    if (originHostname === 'localhost' || originHostname === '127.0.0.1') return true;

    // Allow Google Cloud Run / AI Studio preview URLs
    if (
      originHostname.endsWith('.run.app') ||
      originHostname.endsWith('.google.com') ||
      originHostname.endsWith('.web.app') ||
      originHostname.endsWith('.firebaseapp.com')
    ) {
      return true;
    }

    // Match host header if provided
    if (hostHeader) {
      const hostWithoutPort = hostHeader.split(':')[0].toLowerCase();
      if (originHostname === hostWithoutPort) return true;
    }

    return false;
  } catch {
    return false;
  }
}

// SOC2-Compliant CSRF Protection Middleware for state-changing HTTP requests
export function csrfProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  const method = req.method.toUpperCase();

  // Safe HTTP methods do not require CSRF validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // 1. Origin Header Verification (Defense-in-depth against cross-site forms & scripts)
  const origin = (req.headers['origin'] || req.headers['referer']) as string | undefined;
  const host = req.headers['host'];

  if (origin && !isAllowedOrigin(origin, host)) {
    return res.status(403).json({
      error: 'CSRF_ORIGIN_REJECTED',
      message: 'Cross-origin request blocked by SOC2 CSRF policy. Untrusted origin.',
      origin
    });
  }

  // 2. Custom header or Bearer Token checks
  // Standard browsers enforce that cross-origin HTML form POSTs cannot attach custom headers
  const authHeader = req.headers['authorization'];
  const hasBearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
  const csrfToken = req.headers['x-csrf-token'] as string | undefined;
  const customClientHeader = req.headers['x-requested-with'];

  if (hasBearerToken) {
    // Authenticated API requests via custom Authorization header cannot be initiated via CSRF
    return next();
  }

  if (csrfToken && verifyCsrfToken(csrfToken)) {
    return next();
  }

  if (customClientHeader === 'XMLHttpRequest' || customClientHeader === 'CAOMS-Client') {
    return next();
  }

  // If request is same-origin (checked via Sec-Fetch-Site if available)
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
    return next();
  }

  // If in development preview and no Sec-Fetch-Site is present, allow if origin matches host
  if (origin && isAllowedOrigin(origin, host)) {
    return next();
  }

  return res.status(403).json({
    error: 'CSRF_VALIDATION_FAILED',
    message: 'State-changing request rejected: Missing anti-CSRF token or valid Authorization header.'
  });
}
