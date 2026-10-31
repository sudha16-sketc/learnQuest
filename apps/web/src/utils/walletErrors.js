const WALLET_REFRESH_PATTERN =
  /(bridgekey|bridge key|metamask|wallet extension)\s+was\s+updated|refresh this page, then click connect wallet again/i;

export function getWalletErrorText(error) {
  if (typeof error === 'string') return error;
  return error?.message || '';
}

export function isWalletRefreshError(error) {
  const message = getWalletErrorText(error);
  return WALLET_REFRESH_PATTERN.test(message);
}

export function getWalletErrorMessage(error) {
  const message = getWalletErrorText(error);
  if (isWalletRefreshError(error)) {
    return 'Your wallet extension was updated. Refresh this page, then click Connect Wallet again.';
  }
  if (error?.code === 4001 || /user rejected|user denied/i.test(message)) {
    return 'Wallet request was rejected.';
  }
  return message || 'Wallet request failed.';
}
