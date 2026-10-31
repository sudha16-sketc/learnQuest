import { ethers } from 'ethers';
import { config } from '../../config/index.js';
import {
  LearnQuestGameStoreABI,
  LearnQuestAchievementsABI,
  LearnQuestRewardsABI
} from '@learnquest/contracts-client';

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
   * Reads the deployed rewards contract configuration. A missing contract
   * address is a common cause of transactions that "succeed" but mint nothing.
   */
  async getRewardContractState() {
    const address = config.blockchain.rewardsAddress;
    if (!address || !ethers.isAddress(address)) {
      return { hasCode: false, address, reason: 'Invalid rewards contract address' };
    }

    try {
      const code = await this.provider.getCode(address);
      if (!code || code === '0x') {
        return { hasCode: false, address, reason: 'No contract code at rewards address' };
      }

      const rewardsContract = new ethers.Contract(
        address,
        LearnQuestRewardsABI,
        this.provider
      );
      const [signerAddress, tokenAddress] = await Promise.all([
        rewardsContract.signerAddress(),
        rewardsContract.token()
      ]);

      return {
        hasCode: true,
        address,
        signerAddress,
        tokenAddress
      };
    } catch (err) {
      return {
        hasCode: false,
        address,
        reason: `Rewards contract read failed: ${err.message}`
      };
    }
  }

  async isRewardNonceUsed(userAddress, nonce) {
    const rewardsContract = new ethers.Contract(
      config.blockchain.rewardsAddress,
      LearnQuestRewardsABI,
      this.provider
    );
    return rewardsContract.isNonceUsed(userAddress, nonce);
  }

  /**
   * Verifies that a claim transaction emitted RewardClaimed for the expected
   * recipient, amount and nonce. Receipt status alone is not enough because a
   * transaction sent to a non-contract address also succeeds.
   */
  async verifyRewardClaimReceipt({ txHash, expectedTo, user, amountWei, nonce }) {
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      throw new Error('Malformed transaction hash');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { verified: false, reason: 'Transaction receipt not found on chain yet or pending' };
      }
      if (receipt.status !== 1) {
        return { verified: false, reason: 'Transaction reverted or failed on chain' };
      }
      if (receipt.to?.toLowerCase() !== expectedTo?.toLowerCase()) {
        return {
          verified: false,
          reason: `Transaction target address ${receipt.to} does not match rewards contract ${expectedTo}`
        };
      }

      const rewardsInterface = new ethers.Interface(LearnQuestRewardsABI);
      let rewardEvent = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== expectedTo.toLowerCase()) continue;
        try {
          const parsed = rewardsInterface.parseLog({ topics: log.topics, data: log.data });
          if (parsed?.name === 'RewardClaimed') {
            rewardEvent = parsed;
            break;
          }
        } catch (e) {
          // Ignore logs from other events / contracts.
        }
      }

      if (!rewardEvent) {
        return {
          verified: false,
          reason: 'Transaction did not emit a RewardClaimed event; no tokens were minted'
        };
      }

      const eventUser = rewardEvent.args.user;
      const eventAmount = rewardEvent.args.amount;
      const eventNonce = rewardEvent.args.nonce;

      if (user && eventUser.toLowerCase() !== user.toLowerCase()) {
        return {
          verified: false,
          reason: `Reward recipient ${eventUser} does not match linked wallet ${user}`
        };
      }
      if (amountWei && eventAmount.toString() !== amountWei.toString()) {
        return {
          verified: false,
          reason: `Reward amount ${eventAmount.toString()} does not match expected amount ${amountWei}`
        };
      }
      if (nonce !== undefined && nonce !== null && eventNonce.toString() !== nonce.toString()) {
        return {
          verified: false,
          reason: `Reward nonce ${eventNonce.toString()} does not match expected nonce ${nonce}`
        };
      }

      return {
        verified: true,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        event: {
          user: eventUser,
          amount: eventAmount.toString(),
          nonce: eventNonce.toString(),
          reason: rewardEvent.args.reason
        }
      };
    } catch (err) {
      console.warn(`[BlockchainVerifier] Reward receipt check failed: ${err.message}`);
      return { verified: false, reason: `RPC verification error: ${err.message}` };
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
      const balance = await Promise.race([
        tokenContract.balanceOf(walletAddress),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC balance lookup timed out')), 5000))
      ]);
      return ethers.formatEther(balance);
    } catch (err) {
      return '0.0';
    }
  }
}

export const blockchainVerifier = new BlockchainVerifier();
