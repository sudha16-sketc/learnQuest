const STORAGE_KEY = 'learnquest_preferred_wallet';

function getProviderInfo(provider) {
  if (!provider) return null;
  const info = provider.info || {};
  const isBridgeKey = !!(provider.isBridgeKey || provider.isBridgeWallet || (info.name && info.name.toLowerCase().includes('bridgekey')) || (info.rdns && info.rdns.includes('bridgekey')));
  const isMetaMask = !!(provider.isMetaMask && !provider.isBraveWallet && !provider.isCoinbaseWallet && !provider.isRabby && !isBridgeKey);
  if (isBridgeKey) {
    return { id: 'bridgekey', name: 'BridgeKey Wallet', provider, rdns: info.rdns, icon: info.icon };
  }
  if (isMetaMask) {
    return { id: 'metamask', name: 'MetaMask', provider, rdns: info.rdns, icon: info.icon };
  }
  if (info.name) {
    return { id: info.rdns || info.name, name: info.name, provider, rdns: info.rdns, icon: info.icon };
  }
  return null;
}

let discoveryInProgress = false;
let lastDiscoveryAt = 0;
const DISCOVERY_COOLDOWN_MS = 2000;

export async function discoverWalletProviders({ force = false } = {}) {
  if (typeof window === 'undefined') return [];
  const now = Date.now();
  if (!force && discoveryInProgress) return [];
  if (!force && now - lastDiscoveryAt < DISCOVERY_COOLDOWN_MS) return [];

  discoveryInProgress = true;
  const providers = [];
  const seen = new Set();

  try {
    try {
      const discovered = [];
      const handler = (event) => {
        try {
          if (event && event.detail) discovered.push(event.detail);
        } catch (err) {
          // ignore handler errors
        }
      };
      try {
        window.addEventListener('eip6963:announceProvider', handler, { once: false });
      } catch (err) {
        // ignore
      }
      try {
        window.dispatchEvent(new Event('eip6963:requestProvider'));
      } catch (err) {
        // ignore dispatch errors (extensions may throw)
      }
      await new Promise(r => setTimeout(r, 80));
      try {
        window.removeEventListener('eip6963:announceProvider', handler);
      } catch (err) {
        // ignore
      }
      for (const detail of discovered) {
        try {
          const info = getProviderInfo(detail.provider);
          if (info && detail.provider && !seen.has(detail.provider)) {
            seen.add(detail.provider);
            providers.push({ ...info, provider: detail.provider, source: 'eip6963' });
          }
        } catch (err) {
          // skip malformed provider
        }
      }
    } catch (e) {
      // swallow eip6963 errors
    }

    try {
      if (window.ethereum) {
        if (Array.isArray(window.ethereum.providers)) {
          for (const p of window.ethereum.providers) {
            try {
              const info = getProviderInfo(p);
              if (info && p && !seen.has(p)) {
                seen.add(p);
                providers.push({ ...info, provider: p, source: 'injected-list' });
              }
            } catch (err) {
              // skip
            }
          }
        } else if (!seen.has(window.ethereum)) {
          try {
            const info = getProviderInfo(window.ethereum);
            if (info) {
              seen.add(window.ethereum);
              providers.push({ ...info, provider: window.ethereum, source: 'window.ethereum' });
            } else {
              providers.push({ id: 'injected', name: 'Injected Wallet', provider: window.ethereum, source: 'window.ethereum' });
            }
          } catch (err) {
            // skip
          }
        }
      }
    } catch (e) {
      // swallow
    }
  } finally {
    discoveryInProgress = false;
    lastDiscoveryAt = Date.now();
  }

  return providers;
}

export function getPreferredWalletId() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setPreferredWalletId(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getProviderById(providers, id) {
  if (!id) return null;
  return providers.find(p => p.id === id) || null;
}
