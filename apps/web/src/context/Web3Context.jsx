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
import { discoverWalletProviders, getPreferredWalletId, setPreferredWalletId } from '../utils/walletProviders';

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
  const [activeWalletId, setActiveWalletId] = useState(null);
  const [discoveryStatus, setDiscoveryStatus] = useState('idle'); // idle | discovering | ready
  const listenersRef = useRef({ accountsChanged: null, chainChanged: null, provider: null });
  const connectingRef = useRef(false);

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
    setDiscoveryStatus('discovering');
    discoverWalletProviders({ force: true })
      .then((list) => {
        if (!mounted) return;
        setProviders(Array.isArray(list) ? list : []);
        setDiscoveryStatus('ready');
      })
      .catch(() => {
        if (!mounted) return;
        setProviders([]);
        setDiscoveryStatus('ready');
      });

    if (typeof window !== 'undefined') {
      const handler = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          discoverWalletProviders()
            .then((list) => {
              if (mounted && Array.isArray(list)) {
                setProviders((prev) => {
                  const combined = [...(prev || []), ...(list || [])];
                  const seen = new Set();
                  const out = [];
                  for (const p of combined) {
                    if (p?.provider && !seen.has(p.provider)) {
                      seen.add(p.provider);
                      out.push(p);
                    }
                  }
                  return out;
                });
              }
            })
            .catch(() => {});
        }, 200);
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
    return null;
  }, [selectedProvider]);

  const disconnectWallet = useCallback(() => {
    try {
      const p = listenersRef.current.provider;
      if (p) {
        if (listenersRef.current.accountsChanged) {
          try { p.removeListener?.('accountsChanged', listenersRef.current.accountsChanged); } catch (e) {}
        }
        if (listenersRef.current.chainChanged) {
          try { p.removeListener?.('chainChanged', listenersRef.current.chainChanged); } catch (e) {}
        }
      }
    } catch (e) {}
    listenersRef.current = { accountsChanged: null, chainChanged: null, provider: null };
    setAccount(null);
    setChainId(null);
    setIsMSTNetwork(false);
    setNativeBalance('0.0');
    setTokenBalance('0.0');
    setSelectedProvider(null);
    setSelectedProviderId(null);
    setActiveWalletId(null);
    setError(null);
  }, []);

  const connectWallet = async (walletOption = null) => {
    if (connectingRef.current || isConnecting) return;
    connectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      let providerInstance = walletOption?.provider || null;
      let providerId = walletOption?.id || null;

      if (!providerInstance && Array.isArray(providers) && providers.length > 0) {
        providerInstance = providers[0].provider;
        providerId = providers[0].id;
      }

      if (!providerInstance) {
        setError('No wallet provider available. Please install a compatible wallet.');
        return;
      }

      if (selectedProvider && selectedProvider !== providerInstance) {
        try {
          const prevP = listenersRef.current.provider;
          if (prevP) {
            if (listenersRef.current.accountsChanged) {
              try { prevP.removeListener?.('accountsChanged', listenersRef.current.accountsChanged); } catch (e) {}
            }
            if (listenersRef.current.chainChanged) {
              try { prevP.removeListener?.('chainChanged', listenersRef.current.chainChanged); } catch (e) {}
            }
          }
        } catch (e) {}
        listenersRef.current = { accountsChanged: null, chainChanged: null, provider: null };
      }

      const provider = new ethers.BrowserProvider(providerInstance);
      setSelectedProvider(providerInstance);
      setSelectedProviderId(providerId);
      setActiveWalletId(providerId);
      setPreferredWalletId(providerId);

      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      const selectedAccount = accounts?.[0];
      if (!selectedAccount) {
        throw new Error('No accounts returned by wallet');
      }
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
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      connectingRef.current = false;
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
    if (typeof window === 'undefined' || !eth) return;

    try {
      const prevP = listenersRef.current.provider;
      if (prevP && prevP !== eth) {
        if (listenersRef.current.accountsChanged) {
          try { prevP.removeListener?.('accountsChanged', listenersRef.current.accountsChanged); } catch (e) {}
        }
        if (listenersRef.current.chainChanged) {
          try { prevP.removeListener?.('chainChanged', listenersRef.current.chainChanged); } catch (e) {}
        }
        listenersRef.current = { accountsChanged: null, chainChanged: null, provider: null };
      }
    } catch (e) {}

    if (listenersRef.current.provider === eth) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setNativeBalance('0.0');
        setTokenBalance('0.0');
        return;
      }
      const newAcc = accounts[0];
      setAccount(newAcc);
      try {
        const provider = new ethers.BrowserProvider(eth);
        loadBalances(newAcc, provider);
      } catch (e) {
        console.warn(e.message);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      try {
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
      } catch (e) {
        console.warn(e.message);
      }
    };

    try {
      eth.on?.('accountsChanged', handleAccountsChanged);
      eth.on?.('chainChanged', handleChainChanged);
      listenersRef.current = { accountsChanged: handleAccountsChanged, chainChanged: handleChainChanged, provider: eth };
    } catch (e) {
      console.warn(e.message);
    }

    return () => {
      try {
        if (listenersRef.current.provider === eth) {
          if (listenersRef.current.accountsChanged) {
            try { eth.removeListener?.('accountsChanged', listenersRef.current.accountsChanged); } catch (e) {}
          }
          if (listenersRef.current.chainChanged) {
            try { eth.removeListener?.('chainChanged', listenersRef.current.chainChanged); } catch (e) {}
          }
          listenersRef.current = { accountsChanged: null, chainChanged: null, provider: null };
        }
      } catch (e) {}
    };
  }, [selectedProvider, account, loadBalances, checkNetwork, getActiveProvider]);

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
    disconnectWallet,
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
    discoveryStatus,
    activeWalletId,
    selectedProviderId,
    getActiveProvider
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
