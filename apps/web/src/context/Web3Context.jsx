import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MST_NETWORKS } from '@learnquest/shared';
import {
  LearnQuestUtilityTokenABI,
  LearnQuestRewardsABI,
  LearnQuestGameStoreABI,
  LearnQuestAchievementsABI
} from '@learnquest/contracts-client';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isMSTNetwork, setIsMSTNetwork] = useState(false);
  const [nativeBalance, setNativeBalance] = useState('0.0');
  const [tokenBalance, setTokenBalance] = useState('0.0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [contractsConfig, setContractsConfig] = useState(null);

  // Fetch contracts configuration from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.getBlockchainConfig();
        if (res.success) {
          setContractsConfig(res);
        }
      } catch (err) {
        console.warn('Could not fetch blockchain config:', err.message);
      }
    }
    loadConfig();
  }, []);

  const checkNetwork = useCallback((currentChainId) => {
    const targetChainId = contractsConfig?.network?.chainId || MST_NETWORKS.TESTNET.chainId;
    const isTarget = Number(currentChainId) === targetChainId;
    setIsMSTNetwork(isTarget);
    return isTarget;
  }, [contractsConfig]);

  const loadBalances = useCallback(async (walletAddress, provider) => {
    if (!walletAddress || !provider) return;
    try {
      // 1. Native balance (tMSTC)
      const balance = await provider.getBalance(walletAddress);
      setNativeBalance(parseFloat(ethers.formatEther(balance)).toFixed(4));

      // 2. Token balance (LQST)
      if (contractsConfig?.contracts?.token) {
        const tokenContract = new ethers.Contract(
          contractsConfig.contracts.token,
          LearnQuestUtilityTokenABI,
          provider
        );
        const lqst = await tokenContract.balanceOf(walletAddress);
        setTokenBalance(parseFloat(ethers.formatEther(lqst)).toFixed(2));
      }
    } catch (e) {
      console.warn('Error reading balances:', e.message);
    }
  }, [contractsConfig]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask not detected. Please install the MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      const selectedAccount = accounts[0];
      setAccount(selectedAccount);
      setChainId(Number(network.chainId));

      const isMst = checkNetwork(network.chainId);
      if (!isMst) {
        await switchToMSTNetwork();
      }

      await loadBalances(selectedAccount, provider);

      // If user is logged in, link wallet with signature challenge if not already linked
      if (user && !user.wallets?.some(w => w.address.toLowerCase() === selectedAccount.toLowerCase())) {
        try {
          const signer = await provider.getSigner();
          const challengeRes = await api.requestWalletChallenge(selectedAccount, Number(network.chainId));
          if (challengeRes.success) {
            const signature = await signer.signMessage(challengeRes.challenge);
            await api.linkWallet(selectedAccount, signature, challengeRes.challenge);
            await refreshUser();
          }
        } catch (linkErr) {
          console.warn('Wallet linking skipped or rejected:', linkErr.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToMSTNetwork = async () => {
    if (!window.ethereum) return;
    const target = contractsConfig?.network || MST_NETWORKS.TESTNET;
    const chainIdHex = target.chainIdHex || `0x${target.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      setIsMSTNetwork(true);
    } catch (switchError) {
      // 4902 error indicates network is not yet in MetaMask, add it
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: target.name,
              rpcUrls: [target.rpcUrl],
              nativeCurrency: {
                name: target.currencySymbol,
                symbol: target.currencySymbol,
                decimals: 18
              },
              blockExplorerUrls: [target.explorerUrl]
            }]
          });
          setIsMSTNetwork(true);
        } catch (addError) {
          setError(`Failed to add MST Network to MetaMask: ${addError.message}`);
        }
      } else {
        setError(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  // Claim EIP-712 reward voucher on chain
  const claimRewardOnChain = async (voucherData) => {
    if (!window.ethereum || !account) {
      throw new Error('Please connect your MetaMask wallet first');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const rewardsContract = new ethers.Contract(
      contractsConfig.contracts.rewards,
      LearnQuestRewardsABI,
      signer
    );

    const tx = await rewardsContract.claimReward(
      voucherData.user,
      voucherData.amount,
      voucherData.nonce,
      voucherData.expiry,
      voucherData.reason,
      voucherData.signature
    );

    const receipt = await tx.wait();
    await loadBalances(account, provider);
    return receipt;
  };

  // Purchase item from store on chain
  const purchaseStoreItemOnChain = async (sku, priceTokens) => {
    if (!window.ethereum || !account) {
      throw new Error('Please connect your MetaMask wallet first');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const priceWei = ethers.parseEther(String(priceTokens));

    // 1. Approve store to spend LQST
    const tokenContract = new ethers.Contract(
      contractsConfig.contracts.token,
      LearnQuestUtilityTokenABI,
      signer
    );
    const approveTx = await tokenContract.approve(contractsConfig.contracts.store, priceWei);
    await approveTx.wait();

    // 2. Call purchaseItem on store
    const storeContract = new ethers.Contract(
      contractsConfig.contracts.store,
      LearnQuestGameStoreABI,
      signer
    );
    const purchaseTx = await storeContract.purchaseItem(sku);
    const receipt = await purchaseTx.wait();

    // 3. Confirm with backend
    await api.confirmStorePurchase(sku, receipt.hash);
    await loadBalances(account, provider);

    return receipt;
  };

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          loadBalances(accounts[0], provider);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (newChainId) => {
        const id = parseInt(newChainId, 16);
        setChainId(id);
        checkNetwork(id);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [checkNetwork, loadBalances]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isMSTNetwork,
        nativeBalance,
        tokenBalance,
        isConnecting,
        error,
        contractsConfig,
        connectWallet,
        switchToMSTNetwork,
        claimRewardOnChain,
        purchaseStoreItemOnChain,
        refreshBalances: () => {
          if (account && window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            loadBalances(account, provider);
          }
        }
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
