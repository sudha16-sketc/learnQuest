import { ethers } from 'ethers';
import { signRewardVoucher } from '@learnquest/contracts-client';
import { config } from '../../config/index.js';

let nonceCounter = Date.now();

export async function createSignedRewardVoucher({
  userWalletAddress,
  tokenAmountDecimal,
  reason
}) {
  if (!userWalletAddress || !ethers.isAddress(userWalletAddress)) {
    throw new Error('Valid EVM wallet address is required to issue a reward voucher');
  }

  const nonce = ++nonceCounter;
  const expiryTimestamp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours validity
  const amountWei = ethers.parseEther(String(tokenAmountDecimal));

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
    nonce,
    expiry: expiryTimestamp,
    reason,
    signature: signedResult.signature,
    rewardsContractAddress: config.blockchain.rewardsAddress,
    chainId: config.blockchain.chainId
  };
}
