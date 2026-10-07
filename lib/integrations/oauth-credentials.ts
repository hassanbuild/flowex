import "server-only";

import crypto from "node:crypto";

export type OAuthCredentials = Record<string, unknown>;

type EncryptedCredentials = {
  flowex_oauth_credentials: {
    version: 1;
    iv: string;
    ciphertext: string;
    tag: string;
  };
};

function key() {
  const encoded = process.env.FLOWEX_OAUTH_ENCRYPTION_KEY;
  const value = encoded ? Buffer.from(encoded, "base64") : null;

  if (!value || value.length !== 32) {
    throw new Error("OAuth credential encryption is not configured.");
  }

  return value;
}

export function readOAuthCredentials(value: unknown): OAuthCredentials {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Stored OAuth credentials are invalid.");
  }

  const envelope = (value as Partial<EncryptedCredentials>)
    .flowex_oauth_credentials;

  if (!envelope) {
    return value as OAuthCredentials;
  }

  if (
    envelope.version !== 1 ||
    typeof envelope.iv !== "string" ||
    typeof envelope.ciphertext !== "string" ||
    typeof envelope.tag !== "string"
  ) {
    throw new Error("Stored OAuth credentials are invalid.");
  }

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key(),
      Buffer.from(envelope.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
    const credentials = JSON.parse(plaintext);

    if (!credentials || typeof credentials !== "object" || Array.isArray(credentials)) {
      throw new Error("Stored OAuth credentials are invalid.");
    }

    return credentials as OAuthCredentials;
  } catch {
    throw new Error("Stored OAuth credentials could not be decrypted.");
  }
}

export function encryptOAuthCredentials(
  credentials: OAuthCredentials
): EncryptedCredentials {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);

  return {
    flowex_oauth_credentials: {
      version: 1,
      iv: iv.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
    },
  };
}
