/**
 * Crypto utilities for encrypting sensitive data at rest (PII such as
 * employee personal numbers).
 *
 * Fixes vs previous version:
 * - No insecure hardcoded fallback key — env.encryptionKey() throws at
 *   startup (via assertEnv) if ENCRYPTION_KEY is missing or not a valid
 *   32-byte base64 value.
 * - Key bytes are derived correctly via base64 decode, not a JS string
 *   .substring() (which operates on UTF-16 code units and silently breaks
 *   for non-ASCII keys).
 * - A 1-byte key version prefix is stored alongside the ciphertext so keys
 *   can be rotated later without breaking decryption of old records.
 */

import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const CURRENT_KEY_VERSION = 1;

function getKey(): Buffer {
    return env.encryptionKey();
}

export function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: [1 byte version][16 byte iv][16 byte authTag][ciphertext], base64
    const combined = Buffer.concat([Buffer.from([CURRENT_KEY_VERSION]), iv, authTag, encrypted]);

    return combined.toString('base64');
}

export function decrypt(encoded: string): string {
    const combined = Buffer.from(encoded, 'base64');

    const version = combined.readUInt8(0);
    if (version !== CURRENT_KEY_VERSION) {
        // When you rotate keys, branch here on `version` to select the right key.
        throw new Error(`Unsupported encryption key version: ${version}`);
    }

    const iv = combined.subarray(1, 17);
    const authTag = combined.subarray(17, 33);
    const ciphertext = combined.subarray(33);

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);

    try {
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('utf-8');
    } catch {
        throw new Error('Failed to decrypt data — wrong key or tampered ciphertext');
    }
}

export function hashSensitive(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
}
