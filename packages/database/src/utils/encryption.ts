import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// Simple encryption utility for sensitive data like webhook secrets
// In production, consider using AWS KMS, Vault, or similar

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-32chars-long!!!';
const ALGORITHM = 'aes-256-gcm';

export function encryptSecret(secret: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);

  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encryptedSecret: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
