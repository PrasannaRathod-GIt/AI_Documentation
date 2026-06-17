import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies GitHub webhook signature using timing-safe comparison.
 * GitHub sends X-Hub-Signature-256 header with HMAC SHA-256 of the raw request body.
 * Format: sha256=<hash>
 */
export function verifyGitHubSignature(
  signature: string | undefined,
  payload: Buffer,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    // Extract the hash from the signature header (format: sha256=<hash>)
    const [algorithm, hash] = signature.split('=');

    if (algorithm !== 'sha256') {
      return false;
    }

    // Compute the expected hash
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    const expected = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expected, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');

    // Ensure both buffers are the same length before comparison
    if (expectedBuffer.length !== hashBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, hashBuffer);
  } catch (error) {
    // If any error occurs during verification, return false
    return false;
  }
}
