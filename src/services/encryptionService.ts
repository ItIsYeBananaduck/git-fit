// encryptionService.ts
// Service to handle encryption and decryption of data

export class EncryptionService {
  private encryptionKey: CryptoKey | null = null;

  async generateKey(): Promise<void> {
    this.encryptionKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptData(data: any): Promise<ArrayBuffer> {
    if (!this.encryptionKey) {
      await this.generateKey();
    }

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));

    return crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: crypto.getRandomValues(new Uint8Array(12)),
      },
      this.encryptionKey!,
      encodedData
    );
  }

  async decryptData(encryptedData: ArrayBuffer): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: crypto.getRandomValues(new Uint8Array(12)),
      },
      this.encryptionKey!,
      encryptedData
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedData));
  }
}

export default new EncryptionService();