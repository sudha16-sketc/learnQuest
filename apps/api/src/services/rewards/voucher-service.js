import { ethers } from 'ethers';
import { signRewardVoucher } from '@learnquest/contracts-client';
import { config } from '../../config/index.js';

let nonceCounter = Date.now();

export function getRewardSignerAddress() {
  try {
    return new ethers.Wallet(config.blockchain.rewardSignerPrivateKey).address;
  } catch (err) {
    throw new Error(`Invalid REWARD_SIGNER_PRIVATE_KEY: ${err.message}`);
  }
}

export async function createSignedRewardVoucher({
  userWalletAddress,
  tokenAmountDecimal,
  reason,
  nonce: requestedNonce
}) {
  if (!userWalletAddress || !ethers.isAddress(userWalletAddress)) {
    throw new Error('Valid EVM wallet address is required to issue a reward voucher');
  }

  const amountWei = ethers.parseEther(String(tokenAmountDecimal));
  if (amountWei <= 0n) {
    throw new Error('Reward amount must be greater than zero');
  }

  // Reuse the entitlement's nonce when reissuing a failed claim. Reusing the
  // nonce prevents a double mint if an earlier transaction actually landed.
  const nonce = requestedNonce !== undefined && requestedNonce !== null
    ? requestedNonce
    : ++nonceCounter;
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours validity

  const signedResult = await signRewardVoucher({
    signerPrivateKey: config.blockchain.rewardSignerPrivateKey,
    chainId: config.blockchain.chainId,
    rewardsContractAddress: config.blockchain.rewardsAddress,
    userAddress: userWalletAddress,
    amountWei: amountWei.toString(),
    nonce,
    expiryTimestamp,
    reason
  });

  return {
    user: userWalletAddress,
    amount: amountWei.toString(),
    amountFormatted: tokenAmountDecimal,
    nonce: Number(nonce),
    expiry: expiryTimestamp,
    reason,
    signature: signedResult.signature,
    rewardsContractAddress: config.blockchain.rewardsAddress,
    chainId: config.blockchain.chainId
  };
}
