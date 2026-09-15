import crypto from "crypto";

/**
 * Encrypts/decrypts the password someone types on the signup form before
 * they've paid, so it can sit in `pending_signups` for the few minutes
 * between "filled out the form" and "Stripe confirmed payment" without
 * being stored in plain text. AES-256-GCM with a server-only key —
 * PENDING_SIGNUP_SECRET must be a 64-character hex string (32 bytes).
 * Generate one with: `openssl rand -hex 32`
 */
function getKey(): Buffer {
  const secret = process.env.PENDING_SIGNUP_SECRET;
  if (!secret) {
    throw new Error("PENDING_SIGNUP_SECRET is not set");
  }
  const key = Buffer.from(secret, "hex");
  if (key.length !== 32) {
    throw new Error("PENDING_SIGNUP_SECRET must be a 64-character hex string (32 bytes)");
  }
  return key;
}

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSecret({ ciphertext, iv, tag }: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}
