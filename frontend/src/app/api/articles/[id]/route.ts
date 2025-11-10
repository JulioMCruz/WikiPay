import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';

// Arbitrum One mainnet addresses
const WIKIPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WIKIPAY_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

const WIKIPAY_ABI = [
  {
    type: 'function',
    name: 'getArticle',
    inputs: [{ name: 'articleId', type: 'uint256' }],
    outputs: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'preview', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'unlocks', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'nullifiersUsed',
    inputs: [{ name: 'nullifier', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  }
] as const;

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http()
});

/**
 * x402 Protocol Implementation - Resource Server
 *
 * GET /api/articles/:id
 *
 * x402 Flow:
 * 1. Request without payment → HTTP 402 Payment Required
 * 2. Request with X-PAYMENT header → Verify payment via facilitator
 * 3. Return content if payment verified
 *
 * Reference: https://x402.gitbook.io/x402/core-concepts/client-server
 */

interface PaymentPayload {
  articleId: number;
  nullifier: string;
  proof: string;
  from: string;
  validAfter: number;
  validBefore: number;
  nonce: string;
  v: number;
  r: string;
  s: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = BigInt(params.id);

    // Fetch article from Arbitrum One
    const article = await publicClient.readContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'getArticle',
      args: [articleId]
    });

    const [ipfsHash, preview, price, creator, unlocks, timestamp] = article;

    // x402 Step 1: Check for payment in X-PAYMENT header
    const paymentHeader = request.headers.get('X-PAYMENT');

    if (!paymentHeader) {
      // No payment provided → Return HTTP 402 Payment Required
      return new NextResponse(
        JSON.stringify({
          error: 'Payment Required',
          protocol: 'x402',
          payment: {
            contract: WIKIPAY_CONTRACT_ADDRESS,
            chainId: 42161, // Arbitrum One
            network: 'arbitrum-one',
            usdc: USDC_ADDRESS,
            articleId: params.id,
            price: price.toString(),
            priceUSD: (Number(price) / 1_000_000).toFixed(2), // USDC 6 decimals
            creator: creator,
            facilitator: process.env.NEXT_PUBLIC_FACILITATOR_URL || 'https://facilitator.wikipay.org'
          },
          preview: preview,
          instructions: {
            description: 'x402 Protocol - Payment Required',
            step1: 'Create payment payload with USDC authorization (EIP-3009)',
            step2: 'Sign payment payload with your wallet',
            step3: 'Retry this request with X-PAYMENT header',
            step4: 'Facilitator will verify and settle payment on blockchain',
            step5: 'Content will be returned upon successful payment verification'
          }
        }),
        {
          status: 402, // HTTP 402 Payment Required
          headers: {
            'Content-Type': 'application/json',
            // x402 protocol headers
            'X-Protocol': 'x402',
            'X-Payment-Required': 'true',
            'X-Payment-Network': 'arbitrum-one',
            'X-Payment-ChainId': '42161',
            'X-Payment-Token': 'USDC',
            'X-Payment-Amount': price.toString(),
            'X-Payment-Recipient': creator
          }
        }
      );
    }

    // x402 Step 2: Payment provided → Parse and validate
    let paymentPayload: PaymentPayload;

    try {
      paymentPayload = JSON.parse(paymentHeader);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid payment payload format', protocol: 'x402' },
        { status: 400 }
      );
    }

    // Validate payment payload structure
    const requiredFields = ['articleId', 'nullifier', 'proof', 'from', 'validAfter', 'validBefore', 'nonce', 'v', 'r', 's'];
    const missingFields = requiredFields.filter(field => !(field in paymentPayload));

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid payment payload',
          protocol: 'x402',
          missingFields
        },
        { status: 400 }
      );
    }

    // Verify article ID matches
    if (paymentPayload.articleId !== Number(params.id)) {
      return NextResponse.json(
        {
          error: 'Payment article ID mismatch',
          protocol: 'x402',
          expected: params.id,
          received: paymentPayload.articleId
        },
        { status: 400 }
      );
    }

    // Check if nullifier already used (prevent double-unlock)
    const isUsed = await publicClient.readContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'nullifiersUsed',
      args: [paymentPayload.nullifier as `0x${string}`]
    });

    if (isUsed) {
      return NextResponse.json(
        {
          error: 'Payment already processed',
          protocol: 'x402',
          details: 'Nullifier already used - content may already be unlocked'
        },
        { status: 409 } // Conflict
      );
    }

    // x402 Step 3: Verify payment with facilitator
    const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL || process.env.FACILITATOR_URL;

    if (!facilitatorUrl) {
      return NextResponse.json(
        {
          error: 'Facilitator not configured',
          protocol: 'x402',
          details: 'Server must configure FACILITATOR_URL to process payments'
        },
        { status: 500 }
      );
    }

    const facilitatorResponse = await fetch(`${facilitatorUrl}/api/verify-and-settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'x402'
      },
      body: JSON.stringify({
        payment: paymentPayload,
        resource: {
          articleId: params.id,
          price: price.toString(),
          creator: creator,
          contract: WIKIPAY_CONTRACT_ADDRESS,
          chainId: 42161
        }
      })
    });

    if (!facilitatorResponse.ok) {
      const error = await facilitatorResponse.json().catch(() => ({ message: 'Facilitator error' }));
      return NextResponse.json(
        {
          error: 'Payment verification failed',
          protocol: 'x402',
          details: error.message || 'Facilitator rejected payment'
        },
        { status: 402 } // Still requires valid payment
      );
    }

    const facilitatorResult = await facilitatorResponse.json();

    if (!facilitatorResult.success) {
      return NextResponse.json(
        {
          error: 'Payment settlement failed',
          protocol: 'x402',
          details: facilitatorResult.error || 'Unknown error'
        },
        { status: 402 }
      );
    }

    // x402 Step 4: Payment verified → Return content
    // Note: In production, you would decrypt content from IPFS here
    // For now, return IPFS hash and metadata

    return NextResponse.json(
      {
        success: true,
        protocol: 'x402',
        content: {
          ipfsHash: ipfsHash,
          preview: preview,
          // In production: decrypted content here
          decryptionKey: paymentPayload.nullifier // Client can use nullifier to decrypt
        },
        metadata: {
          articleId: params.id,
          creator: creator,
          unlocks: unlocks.toString(),
          timestamp: timestamp.toString()
        },
        payment: {
          verified: true,
          transactionHash: facilitatorResult.transactionHash,
          blockNumber: facilitatorResult.blockNumber,
          nullifier: paymentPayload.nullifier,
          paidAmount: price.toString(),
          paidAmountUSD: (Number(price) / 1_000_000).toFixed(2)
        }
      },
      {
        status: 200, // Success
        headers: {
          'Content-Type': 'application/json',
          'X-Protocol': 'x402',
          'X-Payment-Verified': 'true',
          'X-Transaction-Hash': facilitatorResult.transactionHash || '',
          'X-Block-Number': facilitatorResult.blockNumber?.toString() || ''
        }
      }
    );

  } catch (error: any) {
    console.error('x402 API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        protocol: 'x402',
        message: error.message
      },
      { status: 500 }
    );
  }
}
