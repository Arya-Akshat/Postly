import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
// Convert the 64-character hex string into a 32-byte Buffer
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
};

export const decrypt = (stored: string): string => {
  const [ivHex, authTagHex, ciphertext] = stored.split(':');
  
  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
};

// IV is a random 16-byte Buffer for AES-GCM
