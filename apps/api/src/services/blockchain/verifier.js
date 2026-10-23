import { ethers } from 'ethers';
import { config } from '../../config/index.js';
import { LearnQuestGameStoreABI, LearnQuestAchievementsABI } from '@learnquest/contracts-client';

export class BlockchainVerifier {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl, {
      chainId: config.blockchain.chainId,
      name: config.blockchain.networkName
    });
  }

  /**
   * Independently verifies an on-chain transaction receipt and event.
   */
  async verifyTransactionReceipt({ txHash, expectedTo, expectedEventName }) {
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      throw new Error('Malformed transaction hash');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return {
          verified: false,
          reason: 'Transaction receipt not found on chain yet or pending'
        };
      }

      if (receipt.status !== 1) {
        return {
          verified: false,
          reason: 'Transaction reverted or failed on chain'
        };
      }

      // Check destination address
      if (expectedTo && receipt.to.toLowerCase() !== expectedTo.toLowerCase()) {
        return {
          verified: false,
          reason: `Transaction target address ${receipt.to} does not match expected contract ${expectedTo}`
        };
      }

      return {
        verified: true,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (err) {
      console.warn(`[BlockchainVerifier] RPC check failed: ${err.message}`);
      return {
        verified: false,
        reason: `RPC verification error: ${err.message}`
      };
    }
  }

  /**
   * Fetches real on-chain token balance.
   */
  async getTokenBalance(walletAddress) {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return '0.0';
    }
    try {
      const tokenContract = new ethers.Contract(
        config.blockchain.tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        this.provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);
      return ethers.formatEther(balance);
    } catch (err) {
      return '0.0';
    }
  }
}

export const blockchainVerifier = new BlockchainVerifier();
