export function scrubSensitiveData(code: string): string {
  let scrubbedCode = code;

  // API keys and tokens (apikey, api_key, auth_token, access_token)
  scrubbedCode = scrubbedCode.replace(/([a-zA-Z0-9_-]*(api_key|apikey|auth_token|access_token)[a-zA-Z0-9_-]*["']?[:=]["']?)[a-zA-Z0-9\-_\/.+=@]{10,}/g, '$1[REDACTED]');
  
  // Secrets and private keys
  scrubbedCode = scrubbedCode.replace(/(secret|private_key|privateKey)["']?[:=]["']?[a-zA-Z0-9\-_\/.+=@]{10,}/g, '$1[REDACTED]');
  
  // Passwords in key=value format
  scrubbedCode = scrubbedCode.replace(/(password|pass)["']?[:=]["']?[a-zA-Z0-9\-_\/.+=@]{6,}/g, '$1[REDACTED]');
  
  // Database URLs: postgresql://, mysql://, mongodb:// with credentials
  scrubbedCode = scrubbedCode.replace(/(postgresql|mysql|mongodb):\/\/[^:@\/\s]+:[^@\s]+@/g, '$1://[REDACTED]:[REDACTED]@');
  
  // AWS access keys starting with AKIA
  scrubbedCode = scrubbedCode.replace(/(AKIA[0-9A-Z]{16})/g, '[REDACTED]');
  
  // Bearer tokens
  scrubbedCode = scrubbedCode.replace(/(Bearer\s+)[a-zA-Z0-9\-_\.]{20,}/g, '$1[REDACTED]');
  
  // Email addresses (PII)
  scrubbedCode = scrubbedCode.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');

  return scrubbedCode;
}

export function auditScrubbing(original: string, scrubbed: string): {
  changed: boolean;
  redactionCount: number;
} {
  const changed = original !== scrubbed;
  const redactionCount = (scrubbed.match(/\[REDACTED\]/g) || []).length;
  return { changed, redactionCount };
}
