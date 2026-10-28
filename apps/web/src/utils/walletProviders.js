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

export async function discoverWalletProviders() {
  const providers = [];
  const seen = new Set();

  if (typeof window === 'undefined') return providers;

  try {
    const discovered = [];
    const handler = (event) => {
      if (event.detail) discovered.push(event.detail);
    };
    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    await new Promise(r => setTimeout(r, 60));
    window.removeEventListener('eip6963:announceProvider', handler);
    for (const detail of discovered) {
      const info = getProviderInfo(detail.provider);
      if (info && detail.provider && !seen.has(detail.provider)) {
        seen.add(detail.provider);
        providers.push({ ...info, provider: detail.provider, source: 'eip6963' });
      }
    }
  } catch (e) {}

  if (window.ethereum) {
    if (Array.isArray(window.ethereum.providers)) {
      for (const p of window.ethereum.providers) {
        const info = getProviderInfo(p);
        if (info && p && !seen.has(p)) {
          seen.add(p);
          providers.push({ ...info, provider: p, source: 'injected-list' });
        }
      }
    } else if (!seen.has(window.ethereum)) {
      const info = getProviderInfo(window.ethereum);
      if (info) {
        seen.add(window.ethereum);
        providers.push({ ...info, provider: window.ethereum, source: 'window.ethereum' });
      } else {
        // still allow if no specific info but exists
        providers.push({ id: 'injected', name: 'Injected Wallet', provider: window.ethereum, source: 'window.ethereum' });
      }
    }
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
