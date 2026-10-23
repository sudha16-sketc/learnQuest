import { IAIProvider } from './ai-provider.interface.js';

export const CURATED_BLOCKCHAIN_CURRICULUM = {
  beginner: [
    {
      id: 'q-begin-001',
      concept: 'blocks',
      type: 'multiple_choice',
      question: 'What fundamental data does a standard blockchain block contain?',
      options: [
        'A cryptographic hash, the previous block hash, and a batch of verified transactions',
        'Only the user profile pictures and private keys',
        'Raw executable game assets and 3D textures',
        'A single centralized database index pointer'
      ],
      correctOptionIndex: 0,
      explanation: 'A block consists of a header (containing the timestamp, nonce, previous block hash, and Merkle root) along with a list of cryptographically validated transactions.',
      hint: 'Think about how blocks link together backwards and what user activities they record.',
      difficultyScore: 1
    },
    {
      id: 'q-begin-002',
      concept: 'hashing',
      type: 'multiple_choice',
      question: 'Why are cryptographic hash functions like SHA-256 or Keccak-256 crucial to blockchain immutability?',
      options: [
        'Any tiny change to transaction data produces a completely different hash output',
        'They compress large video files for decentralized streaming',
        'They automatically print paper receipts for every user',
        'They allow anyone to reverse the hash and reveal secret passwords'
      ],
      correctOptionIndex: 0,
      explanation: 'Cryptographic hash functions are one-way and exhibit the avalanche effect: modifying even a single character in a block invalidates all downstream block hashes.',
      hint: 'Recall the property of one-way mathematical functions where output changes drastically on any input alteration.',
      difficultyScore: 2
    },
    {
      id: 'q-begin-003',
      concept: 'wallets',
      type: 'multiple_choice',
      question: 'What is the primary difference between a public address and a private key in Web3?',
      options: [
        'The public address is like an account number to receive assets, while the private key signs transactions and must remain secret',
        'The public address is secret while the private key is shared with everyone on social media',
        'Both can be freely posted online without any security risk',
        'The public address generates new Bitcoin, while the private key deletes it'
      ],
      correctOptionIndex: 0,
      explanation: 'Your public address is derived from your public key and acts as your recipient address. Your private key signs digital messages to authorize outgoing transfers and must never be exposed.',
      hint: 'Think of one as your home mailbox address and the other as the physical key that opens the lock.',
      difficultyScore: 2
    },
    {
      id: 'q-begin-004',
      concept: 'immutability',
      type: 'multiple_choice',
      question: 'What makes records on a decentralized blockchain considered "immutable"?',
      options: [
        'Once confirmed and buried under subsequent blocks, historical records cannot be altered without rewriting the entire chain',
        'The government passes a law forbidding computers from deleting files',
        'All data is encrypted so thoroughly that nobody can ever read it',
        'Files are permanently stored on read-only optical discs in Switzerland'
      ],
      correctOptionIndex: 0,
      explanation: 'Because every block cryptographically links to the previous block hash across thousands of independent nodes, changing an old block requires recalculating all subsequent blocks and outpacing the honest network.',
      hint: 'Focus on distributed consensus and cryptographic linking across the entire network.',
      difficultyScore: 2
    }
  ],
  intermediate: [
    {
      id: 'q-inter-001',
      concept: 'consensus',
      type: 'multiple_choice',
      question: 'In Proof of Stake (PoS), how are validators selected to propose new blocks?',
      options: [
        'Pseudo-randomly weighted by the proportion of native cryptocurrency tokens they have locked up as collateral',
        'By whoever can afford the highest electricity bill for heavy graphics cards',
        'By a committee of central bank governors voting once a week',
        'By the order in which users create their social media accounts'
      ],
      correctOptionIndex: 0,
      explanation: 'Proof of Stake replaces computation-heavy mining with economic collateral (staking). Validators lock tokens to secure the network and face slashing penalties if they act maliciously.',
      hint: 'Think about economic skin-in-the-game rather than physical computational hardware.',
      difficultyScore: 4
    },
    {
      id: 'q-inter-002',
      concept: 'gas',
      type: 'multiple_choice',
      question: 'What purpose does "Gas" serve in the Ethereum Virtual Machine (EVM)?',
      options: [
        'It measures computational effort required to execute operations, preventing infinite loops and spam',
        'It cools down the physical servers in mining data centers',
        'It is a physical fuel burned by cryptocurrency ATMs',
        'It guarantees that transactions are guaranteed to execute in under one millisecond'
      ],
      correctOptionIndex: 0,
      explanation: 'Gas is the unit of computational measurement on EVM networks. Requiring gas prevents denial-of-service attacks like infinite loops, since any computational instruction consumes finite gas paid by the sender.',
      hint: 'Halting problem in computer science: how does a global computer stop someone from writing an infinite while loop?',
      difficultyScore: 4
    },
    {
      id: 'q-inter-003',
      concept: 'eip712',
      type: 'multiple_choice',
      question: 'Why is EIP-712 typed structured data signing preferred over generic message signing?',
      options: [
        'It displays human-readable parameter fields in wallet prompts, preventing blind signing phishing attacks',
        'It makes transactions completely gasless on all layer 1 chains without validators',
        'It automatically sends the private key to the receiving contract',
        'It bypasses blockchain cryptographic signature verification'
      ],
      correctOptionIndex: 0,
      explanation: 'EIP-712 defines a standard for hashing and signing typed structured data. Instead of signing an opaque hex blob, users can clearly see the recipient, token amount, nonce, and domain separation.',
      hint: 'Think about transparency and what you see on the MetaMask popup before clicking "Sign".',
      difficultyScore: 5
    }
  ],
  advanced: [
    {
      id: 'q-adv-001',
      concept: 'reentrancy',
      type: 'multiple_choice',
      question: 'What pattern effectively protects a Solidity smart contract against reentrancy attacks?',
      options: [
        'Checks-Effects-Interactions pattern combined with a ReentrancyGuard mutex lock',
        'Sending external ether calls before updating local balances',
        'Making all functions public without any access control',
        'Storing all user balances in off-chain browser localStorage'
      ],
      correctOptionIndex: 0,
      explanation: 'The Checks-Effects-Interactions pattern mandates verifying conditions, updating internal state variables (effects), and only then performing external transfers (interactions).',
      hint: 'Update internal ledger state before interacting with external untrusted contracts.',
      difficultyScore: 7
    },
    {
      id: 'q-adv-002',
      concept: 'merkle_trees',
      type: 'multiple_choice',
      question: 'How do Merkle Trees enable efficient cryptographic verification in Web3 airdrops and state validation?',
      options: [
        'They allow proving an element exists in a massive set with a compact logarithmic proof (O(log n)) using only sibling hashes',
        'They store full SQL database tables inside contract bytecode at zero gas cost',
        'They automatically double the supply of tokens every block cycle',
        'They eliminate the need for digital signatures entirely'
      ],
      correctOptionIndex: 0,
      explanation: 'With a Merkle root stored on-chain (32 bytes), any user can prove inclusion in an allowlist of millions of addresses by submitting a small branch of hashes without storing the list on-chain.',
      hint: 'Think of binary tree root hashes and logarithmic proof sizes.',
      difficultyScore: 8
    }
  ]
};

export class CuratedProvider extends IAIProvider {
  async generateQuestions({ topic, difficulty = 'beginner', count = 3 }) {
    const questionsPool = CURATED_BLOCKCHAIN_CURRICULUM[difficulty] || CURATED_BLOCKCHAIN_CURRICULUM.beginner;
    // Shuffle and pick requested count
    const shuffled = [...questionsPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return {
      topic: topic || 'Blockchain Fundamentals',
      difficulty,
      questions: selected,
      source: 'curated_curriculum'
    };
  }

  async generateExplanation({ concept, chosenAnswer, correctAnswer }) {
    return {
      explanation: `The concept "${concept}" requires distinguishing between verified consensus mechanisms and common misconceptions. Your answer "${chosenAnswer}" is inaccurate because transactions must be deterministically verifiable. The correct principle is: ${correctAnswer}.`,
      keyTakeaway: `Remember: Cryptographic validity and decentralized consensus enforce integrity without central intermediaries.`
    };
  }

  async generateHint({ concept, question }) {
    return {
      hint: `Recall how "${concept}" operates in a decentralized network: focus on cryptographic immutability and peer-to-peer verification.`
    };
  }

  async generateRemedialQuestion({ concept, difficulty = 'beginner' }) {
    const pool = CURATED_BLOCKCHAIN_CURRICULUM[difficulty] || CURATED_BLOCKCHAIN_CURRICULUM.beginner;
    const match = pool.find(q => q.concept === concept) || pool[0];
    return {
      ...match,
      id: `${match.id}-remedial`,
      question: `[Retry Opportunity] ${match.question}`
    };
  }
}
