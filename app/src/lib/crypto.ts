// Encryption/Decryption utilities for OAuth tokens
// Uses Web Crypto API with fallback for environments without crypto support

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

// Get encryption key from environment or generate one
let encryptionKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (encryptionKey) {
    return encryptionKey;
  }

  const keyMaterial = process.env.OAUTH_ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!!';
  
  const keyBuffer = new TextEncoder().encode(keyMaterial.padEnd(32, '0').slice(0, 32));
  
  encryptionKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
  
  return encryptionKey;
}

// Encrypt sensitive data (OAuth tokens)
export async function encrypt(plaintext: string): Promise<string> {
  try {
    if (!crypto?.subtle) {
      console.warn('Web Crypto API not available, storing token in plain text (DEV ONLY)');
      return `plain:${plaintext}`;
    }

    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const data = new TextEncoder().encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return base64 encoded result
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

// Decrypt sensitive data (OAuth tokens)
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    // Handle plain text fallback for development
    if (encryptedData.startsWith('plain:')) {
      return encryptedData.slice(6);
    }

    if (!crypto?.subtle) {
      throw new Error('Web Crypto API not available for decryption');
    }

    const key = await getEncryptionKey();
    
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

// Generate secure random string for PKCE code verifier
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Generate PKCE code challenge from verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API required for PKCE');
  }
  
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64URLEncode(new Uint8Array(hash));
}

// Generate secure random state parameter
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Base64 URL-safe encoding (without padding)
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Hash IP address for privacy-compliant logging
export async function hashIPAddress(ipAddress: string): Promise<string> {
  if (!crypto?.subtle) {
    return 'hashed-ip-not-available';
  }
  
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ipAddress));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16); // First 16 characters for space efficiency
}

// Validate encryption key strength
export function validateEncryptionSetup(): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;

  if (!crypto?.subtle) {
    warnings.push('Web Crypto API not available - tokens will not be encrypted');
    isValid = false;
  }

  const key = process.env.OAUTH_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    warnings.push('OAUTH_ENCRYPTION_KEY should be at least 32 characters long');
    isValid = false;
  }

  if (key === 'default-dev-key-32-chars-long!!!') {
    warnings.push('Using default encryption key - change OAUTH_ENCRYPTION_KEY in production');
    isValid = false;
  }

  return { isValid, warnings };
}