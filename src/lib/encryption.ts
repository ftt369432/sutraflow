import CryptoJS from 'crypto-js';

// Use environment variable for encryption key or fallback to a default (not recommended for production)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key-for-encryption-please-change';

/**
 * Encrypt a string using AES encryption
 * @param data - Data to encrypt
 * @returns Encrypted string
 */
export function encryptData(data: string): string {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt an encrypted string
 * @param encryptedData - Encrypted data to decrypt
 * @returns Decrypted string
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData) return '';
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
} 