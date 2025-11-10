/**
 * Pinata IPFS upload utilities for WikiPay
 *
 * Handles uploading encrypted articles to IPFS via Pinata
 */

import { PinataSDK } from "pinata-web3";

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud"
});

export interface ArticleMetadata {
  title: string;
  encrypted: string;
  iv: string;
  encryptionKey: string;
  creator: string;
  timestamp: number;
  preview: string;
}

/**
 * Upload encrypted article to Pinata IPFS
 * Returns IPFS hash (CID)
 */
export async function uploadToPinata(metadata: ArticleMetadata): Promise<string> {
  try {
    console.log("📤 Uploading to Pinata IPFS...");

    // Upload JSON metadata
    const upload = await pinata.upload.json({
      title: metadata.title,
      encrypted: metadata.encrypted,
      iv: metadata.iv,
      encryptionKey: metadata.encryptionKey,
      creator: metadata.creator,
      timestamp: metadata.timestamp,
      preview: metadata.preview,
    });

    const ipfsHash = upload.IpfsHash;
    console.log("✅ Uploaded to IPFS:", ipfsHash);
    console.log("📍 Gateway URL:", `https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${ipfsHash}`);

    return ipfsHash;
  } catch (error: any) {
    console.error("❌ Pinata upload failed:", error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

/**
 * Fetch article from Pinata IPFS gateway
 */
export async function fetchFromPinata(ipfsHash: string): Promise<ArticleMetadata> {
  try {
    console.log("📥 Fetching from IPFS:", ipfsHash);

    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
    const url = `https://${gateway}/ipfs/${ipfsHash}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Fetched from IPFS");

    return data as ArticleMetadata;
  } catch (error: any) {
    console.error("❌ IPFS fetch failed:", error);
    throw new Error(`Failed to fetch from IPFS: ${error.message}`);
  }
}

/**
 * Check Pinata connection and JWT validity
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    // Test by uploading a small test file
    const testData = { test: "WikiPay connection test", timestamp: Date.now() };
    const upload = await pinata.upload.json(testData);

    console.log("✅ Pinata connection successful");
    console.log("Test IPFS hash:", upload.IpfsHash);

    return true;
  } catch (error: any) {
    console.error("❌ Pinata connection failed:", error);
    console.error("Make sure NEXT_PUBLIC_PINATA_JWT is set in .env.local");
    return false;
  }
}

/**
 * Get upload statistics (optional, requires Pinata API key)
 */
export async function getPinataStats() {
  try {
    // This would require additional Pinata API endpoints
    // For now, just return basic info
    return {
      gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud",
      configured: !!process.env.NEXT_PUBLIC_PINATA_JWT,
    };
  } catch (error) {
    console.error("Failed to get Pinata stats:", error);
    return null;
  }
}
