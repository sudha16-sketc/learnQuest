const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('learnquest_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('learnquest_token', token);
    } else {
      localStorage.removeItem('learnquest_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    const res = await fetch(url, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }

    return data;
  }

  // Auth
  async register(email, username, password) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async login(login, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async requestWalletChallenge(address, chainId) {
    return this.request('/api/auth/wallet-challenge', {
      method: 'POST',
      body: JSON.stringify({ address, chainId })
    });
  }

  async linkWallet(address, signature, challenge) {
    return this.request('/api/auth/link-wallet', {
      method: 'POST',
      body: JSON.stringify({ address, signature, challenge })
    });
  }

  // Learning
  async getTopics() {
    return this.request('/api/topics');
  }

  async startSession(topicId, difficulty) {
    return this.request('/api/learning/sessions', {
      method: 'POST',
      body: JSON.stringify({ topicId, difficulty })
    });
  }

  async submitAnswer(sessionId, payload) {
    return this.request(`/api/learning/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: {
        'x-idempotency-key': payload.idempotencyKey
      },
      body: JSON.stringify(payload)
    });
  }

  async completeSession(sessionId) {
    return this.request(`/api/learning/sessions/${sessionId}/complete`, {
      method: 'POST'
    });
  }

  async getProgress() {
    return this.request('/api/learning/progress');
  }

  // AI
  async generateQuestions(topic, difficulty, count = 3) {
    return this.request('/api/ai/questions', {
      method: 'POST',
      body: JSON.stringify({ topic, difficulty, count })
    });
  }

  async generateHint(concept, question) {
    return this.request('/api/ai/hints', {
      method: 'POST',
      body: JSON.stringify({ concept, question })
    });
  }

  // Rewards
  async getRewardBalance() {
    return this.request('/api/rewards/balance');
  }

  async getRewardLedger() {
    return this.request('/api/rewards/ledger');
  }

  async getPendingRewards() {
    return this.request('/api/rewards/pending');
  }

  async claimRewardVoucher(entitlementId) {
    return this.request('/api/rewards/claim-voucher', {
      method: 'POST',
      body: JSON.stringify({ entitlementId })
    });
  }

  // Store
  async getStoreItems() {
    return this.request('/api/store/items');
  }

  async confirmStorePurchase(sku, transactionHash) {
    return this.request('/api/store/confirm', {
      method: 'POST',
      body: JSON.stringify({ sku, transactionHash })
    });
  }

  async equipAccessory(sku) {
    return this.request('/api/store/equip', {
      method: 'POST',
      body: JSON.stringify({ sku })
    });
  }

  // Blockchain
  async getBlockchainConfig() {
    return this.request('/api/blockchain/config');
  }

  async getBlockchainTransactions() {
    return this.request('/api/blockchain/transactions');
  }

  async confirmAchievement(achievementType, transactionHash) {
    return this.request('/api/blockchain/achievements/confirm', {
      method: 'POST',
      body: JSON.stringify({ achievementType, transactionHash })
    });
  }
}

export const api = new ApiService();
