/**
 * Encryption utilities for WikiPay articles
 *
 * Uses Web Crypto API for client-side encryption
 * Articles are encrypted before uploading to IPFS/Pinata
 */

// Generate a random symmetric key for encrypting article content
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Encrypt article content with a symmetric key
export async function encryptContent(
  content: string,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  // Generate random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Convert content to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  // Convert to base64 for storage
  const encrypted = bufferToBase64(new Uint8Array(encryptedBuffer));
  const ivBase64 = bufferToBase64(iv);

  return { encrypted, iv: ivBase64 };
}

// Decrypt article content
export async function decryptContent(
  encrypted: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  // Convert from base64
  const encryptedBuffer = base64ToBuffer(encrypted);
  const ivBuffer = base64ToBuffer(iv);

  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    encryptedBuffer
  );

  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Export key to base64 string (for storage)
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(new Uint8Array(exported));
}

// Import key from base64 string
export async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(keyBase64);

  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Helper: Convert buffer to base64
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Helper: Convert base64 to buffer
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Simple encryption for MVP
 * In production: Use more sophisticated encryption with key derivation
 */
export async function simpleEncrypt(content: string): Promise<{
  encrypted: string;
  iv: string;
  key: string;
}> {
  const key = await generateEncryptionKey();
  const { encrypted, iv } = await encryptContent(content, key);
  const keyString = await exportKey(key);

  return { encrypted, iv, key: keyString };
}

/**
 * Simple decryption for MVP
 */
export async function simpleDecrypt(
  encrypted: string,
  iv: string,
  keyString: string
): Promise<string> {
  const key = await importKey(keyString);
  return await decryptContent(encrypted, iv, key);
}
