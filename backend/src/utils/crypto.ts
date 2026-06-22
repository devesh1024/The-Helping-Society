import crypto from 'crypto';

/**
 * Generates a cryptographically secure random hex token.
 */
export const generateRandomToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Creates a SHA-256 hash of a string token (optional security practice).
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
