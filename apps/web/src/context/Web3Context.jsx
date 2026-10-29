import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
import { discoverWalletProviders, getPreferredWalletId, setPreferredWalletId, getProviderById } from '../utils/walletProviders';

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
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const listenersAttachedRef = useRef(false);

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

  useEffect(() => {
    let mounted = true;
    let debounceTimer = null;
    discoverWalletProviders({ force: true }).then((list) => {
      if (mounted) setProviders(list);
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      const handler = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          discoverWalletProviders().then((list) => {
            if (mounted) setProviders(list);
          }).catch(() => {});
        }, 150);
      };
      try {
        window.addEventListener('eip6963:announceProvider', handler);
      } catch (e) {}
      return () => {
        mounted = false;
        if (debounceTimer) clearTimeout(debounceTimer);
        try {
          window.removeEventListener('eip6963:announceProvider', handler);
        } catch (e) {}
      };
    }
    return () => { mounted = false; };
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
      const balance = await provider.getBalance(walletAddress);
      setNativeBalance(parseFloat(ethers.formatEther(balance)).toFixed(4));
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

  const getActiveProvider = useCallback(() => {
    if (selectedProvider) return selectedProvider;
    const preferred = getPreferredWalletId();
    const p = getProviderById(providers, preferred) || providers[0];
    return p?.provider || null;
  }, [selectedProvider, providers]);

  const connectWallet = async (walletOption = null) => {
    let providerInstance = walletOption?.provider || null;
    let providerId = walletOption?.id || null;

    if (!providerInstance) {
      const preferred = getPreferredWalletId();
      const preferredProv = getProviderById(providers, preferred);
      providerInstance = preferredProv?.provider || providers[0]?.provider || null;
      providerId = preferredProv?.id || providers[0]?.id || null;
    }

    if (!providerInstance) {
      setError('No wallet detected. Install BridgeKey or MetaMask and try again.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(providerInstance);
      setSelectedProvider(providerInstance);
      setSelectedProviderId(providerId);
      setPreferredWalletId(providerId);

      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      const selectedAccount = accounts[0];
      setAccount(selectedAccount);
      setChainId(Number(network.chainId));

      const isMst = checkNetwork(network.chainId);
      if (!isMst) {
        await switchToMSTNetwork(providerInstance);
      }

      await loadBalances(selectedAccount, provider);

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

  const switchToMSTNetwork = async (providerOverride = null) => {
    const eth = providerOverride || getActiveProvider();
    if (!eth) return;
    const target = contractsConfig?.network || MST_NETWORKS.TESTNET;
    const chainIdHex = target.chainIdHex || `0x${target.chainId.toString(16)}`;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      setIsMSTNetwork(true);
    } catch (switchError) {
      if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
        try {
          await eth.request({
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
          setError(`Failed to add MST Network: ${addError.message}`);
        }
      } else {
        setError(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  const claimRewardOnChain = async (voucherData) => {
    const eth = getActiveProvider();
    if (!eth || !account) {
      throw new Error('Please connect your wallet first');
    }
    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();
    const rewardsContract = new ethers.Contract(
      contractsConfig?.contracts?.rewards || MST_NETWORKS.TESTNET,
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

  const purchaseStoreItemOnChain = async (sku, priceTokens) => {
    const eth = getActiveProvider();
    if (!eth || !account) {
      throw new Error('Please connect your wallet first');
    }
    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();
    const priceWei = ethers.parseEther(String(priceTokens));
    const tokenContract = new ethers.Contract(
      contractsConfig?.contracts?.token,
      LearnQuestUtilityTokenABI,
      signer
    );
    const approveTx = await tokenContract.approve(contractsConfig?.contracts?.store, priceWei);
    await approveTx.wait();
    const storeContract = new ethers.Contract(
      contractsConfig?.contracts?.store,
      LearnQuestGameStoreABI,
      signer
    );
    const tx = await storeContract.purchaseItem(sku);
    const receipt = await tx.wait();
    await loadBalances(account, provider);
    return receipt;
  };

  const confirmAchievementOnChain = async (achievementType) => {
    const eth = getActiveProvider();
    if (!eth || !account) {
      throw new Error('Please connect your wallet first');
    }
    if (!isMSTNetwork) {
      await switchToMSTNetwork(eth);
    }
    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();
    const achievementsContract = new ethers.Contract(
      contractsConfig?.contracts?.achievements,
      LearnQuestAchievementsABI,
      signer
    );
    const tx = await achievementsContract.recordAchievement(account, achievementType, 'LearnQuest Achievement', 100);
    const receipt = await tx.wait();
    return receipt;
  };

  useEffect(() => {
    const eth = getActiveProvider();
    if (typeof window === 'undefined' || !eth || listenersAttachedRef.current) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setNativeBalance('0.0');
        setTokenBalance('0.0');
        return;
      }
      setAccount(accounts[0]);
      try {
        const provider = new ethers.BrowserProvider(eth);
        loadBalances(accounts[0], provider);
      } catch (e) {
        console.warn(e.message);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      checkNetwork(newChainId);
      if (account) {
        try {
          const provider = new ethers.BrowserProvider(eth);
          loadBalances(account, provider);
        } catch (e) {
          console.warn(e.message);
        }
      }
    };

    try {
      eth.on?.('accountsChanged', handleAccountsChanged);
      eth.on?.('chainChanged', handleChainChanged);
      listenersAttachedRef.current = true;
    } catch (e) {
      console.warn(e.message);
    }

    return () => {
      try {
        eth.removeListener?.('accountsChanged', handleAccountsChanged);
        eth.removeListener?.('chainChanged', handleChainChanged);
      } catch (e) {}
      listenersAttachedRef.current = false;
    };
  }, [selectedProvider, providers, account, loadBalances, checkNetwork, getActiveProvider]);

  const value = {
    account,
    chainId,
    isMSTNetwork,
    nativeBalance,
    tokenBalance,
    isConnecting,
    error,
    setError,
    contractsConfig,
    connectWallet,
    switchToMSTNetwork,
    claimRewardOnChain,
    purchaseStoreItemOnChain,
    confirmAchievementOnChain,
    refreshBalances: () => {
      const eth = getActiveProvider();
      if (account && eth) {
        try {
          const provider = new ethers.BrowserProvider(eth);
          loadBalances(account, provider);
        } catch (e) {
          console.warn(e.message);
        }
      }
    },
    providers,
    discoverWalletProviders,
    selectedProviderId
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
