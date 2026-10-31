import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { MST_NETWORKS } from '@learnquest/shared';
import {
  LearnQuestUtilityTokenABI,
  LearnQuestRewardsABI,
  LearnQuestGameStoreABI,
  LearnQuestAchievementsABI,
  verifyRewardVoucher
} from '@learnquest/contracts-client';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { discoverWalletProviders, getPreferredWalletId, setPreferredWalletId } from '../utils/walletProviders';
import { getWalletErrorMessage } from '../utils/walletErrors';

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
                  const byWallet = new Map();
                  for (const p of combined) {
                    if (!p?.provider) continue;
                    byWallet.set(p.id || p.rdns || p.name, p);
                  }
                  return Array.from(byWallet.values());
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
      setError(getWalletErrorMessage(err));
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
          setError(`Failed to add MST Network: ${getWalletErrorMessage(addError)}`);
        }
      } else {
        setError(`Failed to switch network: ${getWalletErrorMessage(switchError)}`);
      }
    }
  };

  const claimRewardOnChain = async (voucherData) => {
    const eth = getActiveProvider();
    if (!eth || !account) {
      throw new Error('Please connect your wallet first');
    }
    if (!voucherData?.signature) {
      throw new Error('The reward voucher is missing its signature');
    }

    const rewardsAddress = contractsConfig?.contracts?.rewards;
    if (!rewardsAddress || !ethers.isAddress(rewardsAddress)) {
      throw new Error('The rewards contract address is not configured. Refresh the page and try again.');
    }
    if (!isMSTNetwork) {
      throw new Error('Switch to MST Testnet before claiming rewards');
    }
    if (voucherData.user.toLowerCase() !== account.toLowerCase()) {
      throw new Error(
        `Voucher recipient ${voucherData.user} does not match the connected wallet ${account}. ` +
        'Link the connected wallet to your account before claiming.'
      );
    }
    if (Number(voucherData.chainId) !== Number(chainId)) {
      throw new Error(
        `Voucher chain ID ${voucherData.chainId} does not match the wallet chain ID ${chainId}`
      );
    }
    if (
      voucherData.rewardsContractAddress &&
      voucherData.rewardsContractAddress.toLowerCase() !== rewardsAddress.toLowerCase()
    ) {
      throw new Error(
        `Voucher targets ${voucherData.rewardsContractAddress}, but the app is configured for ${rewardsAddress}`
      );
    }

    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();

    const code = await provider.getCode(rewardsAddress);
    if (!code || code === '0x') {
      throw new Error(
        `No rewards contract exists at ${rewardsAddress} on chain ${chainId}. ` +
        'Check MST_REWARDS_ADDRESS in the API environment.'
      );
    }

    const rewardsContract = new ethers.Contract(rewardsAddress, LearnQuestRewardsABI, signer);
    const onChainSigner = await rewardsContract.signerAddress();
    const recoveredSigner = verifyRewardVoucher({
      chainId: voucherData.chainId,
      rewardsContractAddress: rewardsAddress,
      voucher: {
        user: voucherData.user,
        amount: BigInt(voucherData.amount),
        nonce: BigInt(voucherData.nonce),
        expiry: BigInt(voucherData.expiry),
        reason: voucherData.reason
      },
      signature: voucherData.signature
    });

    if (recoveredSigner.toLowerCase() !== onChainSigner.toLowerCase()) {
      throw new Error(
        `Voucher signer mismatch: the backend signed with ${recoveredSigner}, but the rewards contract ` +
        `only accepts ${onChainSigner}. Set REWARD_SIGNER_PRIVATE_KEY to the authorized signer or update ` +
        'the signer on the rewards contract.'
      );
    }

    const nonceUsed = await rewardsContract.isNonceUsed(voucherData.user, voucherData.nonce);
    if (nonceUsed) {
      throw new Error('This reward has already been claimed on-chain');
    }

    const tx = await rewardsContract.claimReward(
      voucherData.user,
      voucherData.amount,
      voucherData.nonce,
      voucherData.expiry,
      voucherData.reason,
      voucherData.signature
    );
    const receipt = await tx.wait();

    const rewardsInterface = new ethers.Interface(LearnQuestRewardsABI);
    let rewardClaimed = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== rewardsAddress.toLowerCase()) continue;
      try {
        const parsed = rewardsInterface.parseLog({ topics: log.topics, data: log.data });
        if (parsed?.name === 'RewardClaimed') {
          rewardClaimed = true;
          break;
        }
      } catch (e) {
        // Ignore unrelated logs.
      }
    }

    if (!rewardClaimed) {
      throw new Error(
        'The transaction confirmed but did not emit a RewardClaimed event. No LQST was minted. ' +
        'Verify MST_REWARDS_ADDRESS points at the deployed LearnQuestRewards contract.'
      );
    }

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
