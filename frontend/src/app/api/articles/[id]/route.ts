import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

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
  },
  {
    type: 'function',
    name: 'unlockArticleX402',
    inputs: [
      { name: 'articleId', type: 'uint256' },
      { name: 'nullifier', type: 'bytes32' },
      { name: 'proof', type: 'bytes32' },
      { name: 'from', type: 'address' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
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
  signature: string; // Full EIP-712 signature (0x + 130 hex chars)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('\n=== x402 Payment Request Started ===');
  console.log('Article ID:', params.id);
  console.log('Timestamp:', new Date().toISOString());

  try {
    const articleId = BigInt(params.id);

    // Fetch article from Arbitrum One
    console.log('📖 Step 1: Fetching article from blockchain...');
    console.log('   Contract:', WIKIPAY_CONTRACT_ADDRESS);
    console.log('   Network: Arbitrum One (42161)');

    const article = await publicClient.readContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'getArticle',
      args: [articleId]
    });

    const [ipfsHash, preview, price, creator, unlocks, timestamp] = article;

    console.log('✅ Article fetched successfully');
    console.log('   IPFS Hash:', ipfsHash);
    console.log('   Price:', price.toString(), 'USDC tokens');
    console.log('   Price USD:', (Number(price) / 1_000_000).toFixed(2));
    console.log('   Creator:', creator);

    // x402 Step 1: Check for payment in X-PAYMENT header
    console.log('\n🔍 Step 2: Checking for payment header...');
    const paymentHeader = request.headers.get('X-PAYMENT');

    if (!paymentHeader) {
      console.log('❌ No X-PAYMENT header found');
      console.log('💳 Returning HTTP 402 Payment Required');
      console.log('=== x402 Request Complete (Payment Required) ===\n');

      // No payment provided → Return HTTP 402 Payment Required
      return new NextResponse(
        JSON.stringify({
          error: 'Payment Required',
          protocol: 'x402',
          payment: {
            contract: WIKIPAY_CONTRACT_ADDRESS,
            chainId: 42161, // Arbitrum One
            network: 'arbitrum',
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
            'X-Payment-Network': 'arbitrum',
            'X-Payment-ChainId': '42161',
            'X-Payment-Token': 'USDC',
            'X-Payment-Amount': price.toString(),
            'X-Payment-Recipient': creator
          }
        }
      );
    }

    // x402 Step 2: Payment provided → Parse and validate
    console.log('✅ X-PAYMENT header found');
    console.log('📦 Payment payload length:', paymentHeader.length, 'bytes');

    let paymentPayload: PaymentPayload;

    console.log('\n🔧 Step 3: Parsing payment payload...');
    try {
      paymentPayload = JSON.parse(paymentHeader);
      console.log('✅ Payment payload parsed successfully');
      console.log('   From:', paymentPayload.from);
      console.log('   Nullifier:', paymentPayload.nullifier);
      console.log('   Article ID:', paymentPayload.articleId);
    } catch (error) {
      console.error('❌ Failed to parse payment payload:', error);
      console.log('=== x402 Request Failed (Parse Error) ===\n');
      return NextResponse.json(
        { error: 'Invalid payment payload format', protocol: 'x402' },
        { status: 400 }
      );
    }

    // Validate payment payload structure
    console.log('\n✔️ Step 4: Validating payment structure...');
    const requiredFields = ['articleId', 'nullifier', 'proof', 'from', 'validAfter', 'validBefore', 'nonce', 'v', 'r', 's', 'signature'];
    const missingFields = requiredFields.filter(field => !(field in paymentPayload));

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      console.log('=== x402 Request Failed (Validation Error) ===\n');
      return NextResponse.json(
        {
          error: 'Invalid payment payload',
          protocol: 'x402',
          missingFields
        },
        { status: 400 }
      );
    }
    console.log('✅ All required fields present');

    // Verify article ID matches
    console.log('\n🔍 Step 5: Verifying article ID match...');
    console.log('   Expected:', params.id);
    console.log('   Received:', paymentPayload.articleId);

    if (paymentPayload.articleId !== Number(params.id)) {
      console.error('❌ Article ID mismatch');
      console.log('=== x402 Request Failed (ID Mismatch) ===\n');
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
    console.log('✅ Article ID matches');

    // Check if nullifier already used (prevent double-unlock)
    console.log('\n🔒 Step 6: Checking nullifier status on-chain...');
    console.log('   Nullifier:', paymentPayload.nullifier);

    const isUsed = await publicClient.readContract({
      address: WIKIPAY_CONTRACT_ADDRESS,
      abi: WIKIPAY_ABI,
      functionName: 'nullifiersUsed',
      args: [paymentPayload.nullifier as `0x${string}`]
    });

    console.log('   Already used:', isUsed);

    if (isUsed) {
      console.error('❌ Nullifier already used (double-unlock attempt)');
      console.log('=== x402 Request Failed (Nullifier Used) ===\n');
      return NextResponse.json(
        {
          error: 'Payment already processed',
          protocol: 'x402',
          details: 'Nullifier already used - content may already be unlocked'
        },
        { status: 409 } // Conflict
      );
    }
    console.log('✅ Nullifier is fresh (not used)');

    // x402 Step 3: Verify payment with facilitator
    console.log('\n🌐 Step 7: Preparing facilitator communication...');
    const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL || process.env.FACILITATOR_URL;
    console.log('   Facilitator URL:', facilitatorUrl);

    if (!facilitatorUrl) {
      console.error('❌ Facilitator URL not configured');
      console.log('=== x402 Request Failed (No Facilitator) ===\n');
      return NextResponse.json(
        {
          error: 'Facilitator not configured',
          protocol: 'x402',
          details: 'Server must configure FACILITATOR_URL to process payments'
        },
        { status: 500 }
      );
    }

    // Step 3a: Verify payment with facilitator (x402 standard format)
    console.log('\n🔧 Step 8: Building x402 verify payload...');

    // Use the full signature from the payload (already properly formatted by viem)
    const fullSignature = paymentPayload.signature as string;
    console.log('   Full signature from payload:', fullSignature.slice(0, 20) + '...' + fullSignature.slice(-4));
    console.log('   Signature length:', fullSignature.length, 'chars (expected: 132)');

    const x402VerifyPayload = {
      paymentPayload: {
        scheme: "exact" as const,
        network: "arbitrum",
        x402Version: 1,
        payload: {
          signature: fullSignature,
          authorization: {
            from: paymentPayload.from,
            to: creator,
            value: price.toString(),
            validAfter: paymentPayload.validAfter,
            validBefore: paymentPayload.validBefore,
            nonce: paymentPayload.nonce
          }
        }
      },
      paymentRequirements: {
        scheme: "exact" as const,
        network: "arbitrum",
        asset: USDC_ADDRESS,
        payTo: creator,
        maxAmountRequired: price.toString()
      }
    };

    console.log('📤 x402 Verify Payload:');
    console.log('   scheme:', x402VerifyPayload.paymentPayload.scheme);
    console.log('   network:', x402VerifyPayload.paymentPayload.network);
    console.log('   x402Version:', x402VerifyPayload.paymentPayload.x402Version);
    console.log('   from:', x402VerifyPayload.paymentPayload.payload.authorization.from);
    console.log('   to:', x402VerifyPayload.paymentPayload.payload.authorization.to);
    console.log('   value:', x402VerifyPayload.paymentPayload.payload.authorization.value);
    console.log('   asset:', x402VerifyPayload.paymentRequirements.asset);

    console.log('\n📡 Step 9: Calling facilitator /verify endpoint...');
    console.log('   URL:', `${facilitatorUrl}/verify`);

    const verifyResponse = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'x402'
      },
      body: JSON.stringify(x402VerifyPayload)
    });

    console.log('📥 Verify response status:', verifyResponse.status);

    if (!verifyResponse.ok) {
      console.error('❌ Facilitator verification failed');
      const error = await verifyResponse.json().catch(() => ({ message: 'Facilitator verification error' }));
      console.error('   Error:', error);
      console.log('=== x402 Request Failed (Verification) ===\n');
      return NextResponse.json(
        {
          error: 'Payment verification failed',
          protocol: 'x402',
          details: error.message || 'Facilitator rejected payment'
        },
        { status: 402 }
      );
    }

    const verifyResult = await verifyResponse.json();
    console.log('✅ Verify response received');
    console.log('   isValid:', verifyResult.isValid);
    console.log('   payer:', verifyResult.payer);

    // x402 standard verification response: { isValid: boolean, payer: string, invalidReason?: string }
    if (!verifyResult.isValid) {
      console.error('❌ Payment verification invalid');
      console.error('   Reason:', verifyResult.invalidReason);
      console.log('=== x402 Request Failed (Invalid Payment) ===\n');
      return NextResponse.json(
        {
          error: 'Payment verification failed',
          protocol: 'x402',
          details: verifyResult.invalidReason || 'Verification failed'
        },
        { status: 402 }
      );
    }

    console.log('✅ Payment verified successfully');

    // Step 3b: Settle payment with facilitator (x402 standard format)
    console.log('\n🔧 Step 10: Building x402 settle payload...');
    // Reuse the same signature we constructed for verification
    const x402SettlePayload = {
      paymentPayload: {
        scheme: "exact" as const,
        network: "arbitrum",
        x402Version: 1,
        payload: {
          signature: fullSignature,
          authorization: {
            from: paymentPayload.from,
            to: creator,
            value: price.toString(),
            validAfter: paymentPayload.validAfter,
            validBefore: paymentPayload.validBefore,
            nonce: paymentPayload.nonce
          }
        }
      },
      paymentRequirements: {
        scheme: "exact" as const,
        network: "arbitrum",
        asset: USDC_ADDRESS,
        payTo: creator,
        maxAmountRequired: price.toString()
      }
    };

    console.log('📤 x402 Settle Payload (same as verify)');

    console.log('\n📡 Step 11: Calling facilitator /settle endpoint...');
    console.log('   URL:', `${facilitatorUrl}/settle`);

    const settleResponse = await fetch(`${facilitatorUrl}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Protocol': 'x402'
      },
      body: JSON.stringify(x402SettlePayload)
    });

    console.log('📥 Settle response status:', settleResponse.status);

    if (!settleResponse.ok) {
      console.error('❌ Facilitator settlement failed');
      const error = await settleResponse.json().catch(() => ({ message: 'Facilitator settlement error' }));
      console.error('   Error:', error);
      console.log('=== x402 Request Failed (Settlement) ===\n');
      return NextResponse.json(
        {
          error: 'Payment settlement failed',
          protocol: 'x402',
          details: error.message || 'Facilitator could not settle payment'
        },
        { status: 402 }
      );
    }

    const facilitatorResult = await settleResponse.json();
    console.log('✅ Settle response received');
    console.log('   success:', facilitatorResult.success);
    console.log('   transaction:', facilitatorResult.transaction);
    console.log('   network:', facilitatorResult.network);
    console.log('   payer:', facilitatorResult.payer);

    // x402 standard settlement response: { success: boolean, transaction: string, network: string, payer: string, errorReason?: string }
    if (!facilitatorResult.success) {
      console.error('❌ Settlement failed');
      console.error('   Error reason:', facilitatorResult.errorReason);
      console.log('=== x402 Request Failed (Settlement Failed) ===\n');
      return NextResponse.json(
        {
          error: 'Payment settlement failed',
          protocol: 'x402',
          details: facilitatorResult.errorReason || 'Unknown error'
        },
        { status: 402 }
      );
    }

    console.log('✅ Payment settled successfully');

    // x402 Step 4a: Call WikiPay contract to mark nullifier as used
    console.log('\n📝 Step 12: Marking nullifier as used on-chain...');
    console.log('   Contract:', WIKIPAY_CONTRACT_ADDRESS);
    console.log('   Nullifier:', paymentPayload.nullifier);
    console.log('   Article ID:', params.id);
    console.log('   Proof:', paymentPayload.proof);

    // Get backend wallet from environment
    const backendPrivateKey = process.env.BACKEND_PRIVATE_KEY?.trim();

    if (!backendPrivateKey) {
      console.warn('⚠️ BACKEND_PRIVATE_KEY not set - skipping on-chain nullifier marking');
      console.warn('   Users will be able to pay again if they reload the page!');
    } else if (!backendPrivateKey.startsWith('0x') || backendPrivateKey.length !== 66) {
      console.error('❌ Invalid BACKEND_PRIVATE_KEY format - must be 0x followed by 64 hex characters');
      console.error(`   Current length: ${backendPrivateKey.length}, starts with 0x: ${backendPrivateKey.startsWith('0x')}`);
    } else {
      try {
        // Create wallet client with backend wallet
        const account = privateKeyToAccount(backendPrivateKey as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          chain: arbitrum,
          transport: http()
        });

        console.log('   Backend wallet:', account.address);

        // Call unlockArticleX402 (payment already done via USDC by facilitator)
        const txHash = await walletClient.writeContract({
          address: WIKIPAY_CONTRACT_ADDRESS,
          abi: WIKIPAY_ABI,
          functionName: 'unlockArticleX402',
          args: [
            BigInt(params.id), // articleId
            paymentPayload.nullifier as `0x${string}`, // nullifier
            paymentPayload.proof as `0x${string}`, // proof
            paymentPayload.from as `0x${string}`, // from (user who signed)
            BigInt(paymentPayload.validAfter), // validAfter
            BigInt(paymentPayload.validBefore), // validBefore
            paymentPayload.nonce as `0x${string}`, // nonce
            paymentPayload.v, // v
            paymentPayload.r as `0x${string}`, // r
            paymentPayload.s as `0x${string}` // s
          ]
        });

        console.log('✅ Contract call submitted:', txHash);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log('✅ Transaction confirmed at block:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed);

      } catch (error: any) {
        console.error('❌ Failed to mark nullifier on-chain:', error.message);
        console.error('   Settlement was successful, but on-chain marking failed');
        console.error('   User may be able to unlock again if page is reloaded');
        // Don't fail the entire request - settlement was successful
      }
    }

    // x402 Step 4b: Payment verified and settled → Return content
    console.log('\n📦 Step 13: Preparing content delivery...');
    console.log('   IPFS Hash:', ipfsHash);
    console.log('   Transaction:', facilitatorResult.transaction);

    console.log('✅ Returning HTTP 200 with content');
    console.log('=== x402 Request Complete (Success) ===\n');

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
          transactionHash: facilitatorResult.transaction,
          blockNumber: null, // x402 standard doesn't return blockNumber
          nullifier: paymentPayload.nullifier,
          paidAmount: price.toString(),
          paidAmountUSD: (Number(price) / 1_000_000).toFixed(2),
          network: facilitatorResult.network,
          payer: facilitatorResult.payer
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
