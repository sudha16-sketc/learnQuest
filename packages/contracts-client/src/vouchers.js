import { ethers } from 'ethers';

export const REWARD_VOUCHER_TYPE = {
  RewardVoucher: [
    { name: 'user', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'reason', type: 'string' }
  ]
};

export function getEIP712Domain(chainId, verifyingContract) {
  return {
    name: 'LearnQuestRewards',
    version: '1',
    chainId: Number(chainId),
    verifyingContract
  };
}

/**
 * Creates and signs an EIP-712 reward voucher using the server's private key.
 */
export async function signRewardVoucher({
  signerPrivateKey,
  chainId,
  rewardsContractAddress,
  userAddress,
  amountWei,
  nonce,
  expiryTimestamp,
  reason
}) {
  const signer = new ethers.Wallet(signerPrivateKey);
  const domain = getEIP712Domain(chainId, rewardsContractAddress);
  const value = {
    user: userAddress,
    amount: BigInt(amountWei),
    nonce: BigInt(nonce),
    expiry: BigInt(expiryTimestamp),
    reason: String(reason)
  };

  const signature = await signer.signTypedData(domain, REWARD_VOUCHER_TYPE, value);
  return {
    voucher: value,
    signature,
    signerAddress: signer.address
  };
}

/**
 * Verifies an EIP-712 reward voucher signature.
 */
export function verifyRewardVoucher({
  chainId,
  rewardsContractAddress,
  voucher,
  signature
}) {
  const domain = getEIP712Domain(chainId, rewardsContractAddress);
  const recoveredAddress = ethers.verifyTypedData(domain, REWARD_VOUCHER_TYPE, voucher, signature);
  return recoveredAddress;
}
