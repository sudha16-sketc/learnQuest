export const LEVEL_BRIEFINGS = {
  1: {
    level: 1,
    title: 'Level 1: Blockchain Fundamentals',
    objective: 'Learn the building blocks of blockchain technology before entering the level.',
    concepts: [
      {
        name: 'Blocks',
        definition: 'Blocks are containers that bundle verified transactions together with metadata.',
        explanation: 'Each block contains transaction data, a timestamp, a nonce, the previous block hash, and a Merkle root.',
        example: 'Think of a block like a page in a digital ledger that gets sealed and chained to the previous page.'
      },
      {
        name: 'Cryptographic Hashes',
        definition: 'A hash is a fixed-length string produced by a one-way cryptographic function.',
        explanation: 'Even tiny changes to input produce completely different hashes (avalanche effect), making tampering detectable.',
        example: 'SHA-256 turns any data into a unique 256-bit fingerprint.'
      },
      {
        name: 'Distributed Ledger',
        definition: 'A distributed ledger is shared and synchronized across a network of independent nodes.',
        explanation: 'No single authority controls the ledger; all participants maintain copies.',
        example: 'Instead of one bank database, thousands of computers hold the same record.'
      },
      {
        name: 'Immutability',
        definition: 'Once confirmed, data on a blockchain is extremely difficult to alter.',
        explanation: 'Changing old blocks requires rewriting all subsequent blocks and outpacing the honest network.',
        example: 'Historical transactions remain permanently recorded.'
      }
    ],
    learningObjectives: [
      'Understand what a block contains',
      'Explain why hashes make data tamper-evident',
      'Describe distributed vs centralized ledgers',
      'Explain blockchain immutability'
    ],
    estimatedReadingTime: '2-3 min'
  },
  2: {
    level: 2,
    title: 'Level 2: Blockchain Architecture',
    objective: 'Understand how blockchain components work together as a system.',
    concepts: [
      {
        name: 'Nodes',
        definition: 'Nodes are computers that participate in the blockchain network.',
        explanation: 'Full nodes store the entire blockchain history and validate transactions/blocks.',
        example: 'Anyone can run a node to independently verify the chain.'
      },
      {
        name: 'Transactions',
        definition: 'Transactions are signed instructions to transfer value or update state.',
        explanation: 'They are broadcast to the network, verified, and grouped into blocks.',
        example: 'Sending tokens from one wallet to another is a transaction.'
      },
      {
        name: 'Consensus Mechanisms',
        definition: 'Rules that allow distributed nodes to agree on the valid state of the chain.',
        explanation: 'Mechanisms like PoW or PoS prevent double-spending without a central authority.',
        example: 'Miners/validators compete to add the next valid block.'
      },
      {
        name: 'Distributed Ledgers',
        definition: 'The shared record maintained across all participating nodes.',
        explanation: 'All honest nodes eventually converge to the same canonical chain.',
        example: 'Redundancy across nodes provides resilience and transparency.'
      }
    ],
    learningObjectives: [
      'Identify key components of blockchain architecture',
      'Explain the role of nodes',
      'Describe how transactions flow through the system',
      'Understand why consensus is needed'
    ],
    estimatedReadingTime: '2-3 min'
  },
  3: {
    level: 3,
    title: 'Level 3: Transactions, Blocks, and Hashing',
    objective: 'Deep dive into how transactions become immutable blocks.',
    concepts: [
      {
        name: 'Block Structure',
        definition: 'Blocks have headers and transaction lists linked cryptographically.',
        explanation: 'The header includes previous hash, Merkle root, timestamp, nonce/difficulty.',
        example: 'Each new block points back to its parent via previous hash.'
      },
      {
        name: 'Merkle Trees',
        definition: 'A tree of hashes that efficiently summarizes all transactions in a block.',
        explanation: 'The Merkle root allows efficient verification of transaction inclusion.',
        example: 'You can prove a transaction is in a block without downloading all transactions.'
      },
      {
        name: 'Hash Linking',
        definition: 'Blocks are chained together by including the previous block\'s hash.',
        explanation: 'This creates a tamper-evident chain where changing any block breaks all links.',
        example: 'Like a linked list secured by cryptographic hashes.'
      },
      {
        name: 'Digital Signatures',
        definition: 'Cryptographic proof that a transaction was authorized by the private key holder.',
        explanation: 'Signatures prove authenticity without revealing the private key.',
        example: 'Your wallet signs transactions to authorize transfers.'
      }
    ],
    learningObjectives: [
      'Explain block header components',
      'Understand Merkle trees and roots',
      'Describe hash linking and chain integrity',
      'Explain how digital signatures authorize transactions'
    ],
    estimatedReadingTime: '3-4 min'
  },
  4: {
    level: 4,
    title: 'Level 4: Consensus Mechanisms',
    objective: 'Compare different approaches to reaching agreement in decentralized networks.',
    concepts: [
      {
        name: 'Proof of Work (PoW)',
        definition: 'Miners solve computational puzzles to propose blocks.',
        explanation: 'Energy-intensive but provides strong security through work.',
        example: 'Bitcoin uses PoW to secure its network.'
      },
      {
        name: 'Proof of Stake (PoS)',
        definition: 'Validators are selected based on staked tokens as collateral.',
        explanation: 'More energy-efficient; bad actors risk losing their stake.',
        example: 'Many modern chains use PoS for consensus.'
      },
      {
        name: 'Byzantine Fault Tolerance',
        definition: 'Ability to reach consensus even if some nodes are malicious.',
        explanation: 'Blockchains must tolerate up to ~1/3 Byzantine actors in many systems.',
        example: 'Consensus algorithms ensure honest majority determines the chain.'
      },
      {
        name: 'Finality',
        definition: 'The point at which a block becomes irreversible.',
        explanation: 'Different mechanisms offer probabilistic or deterministic finality.',
        example: 'After enough confirmations, transactions are considered final.'
      }
    ],
    learningObjectives: [
      'Compare PoW and PoS',
      'Explain Byzantine fault tolerance',
      'Understand the concept of finality',
      'Know tradeoffs between consensus mechanisms'
    ],
    estimatedReadingTime: '3-4 min'
  },
  5: {
    level: 5,
    title: 'Level 5: Smart Contracts',
    objective: 'Learn about programmable blockchain applications.',
    concepts: [
      {
        name: 'Smart Contracts',
        definition: 'Self-executing programs stored on a blockchain.',
        explanation: 'Code runs deterministically when conditions are met, without intermediaries.',
        example: 'A vending machine logic encoded as a smart contract.'
      },
      {
        name: 'EVM (Ethereum Virtual Machine)',
        definition: 'A runtime environment for executing smart contract bytecode.',
        explanation: 'All EVM-compatible chains run the same type of smart contracts.',
        example: 'Deploying code to the EVM enables decentralized applications.'
      },
      {
        name: 'Gas',
        definition: 'A measure of computational cost for executing operations.',
        explanation: 'Users pay gas to prevent spam and infinite loops.',
        example: 'Simple transfers cost less gas than complex contract calls.'
      },
      {
        name: 'Decentralized Applications (dApps)',
        definition: 'Applications that run on a blockchain backend.',
        explanation: 'Frontends interact with smart contracts for trustless functionality.',
        example: 'DeFi protocols, NFT marketplaces, and games as dApps.'
      }
    ],
    learningObjectives: [
      'Define smart contracts and their purpose',
      'Explain how the EVM works',
      'Understand gas and transaction costs',
      'Identify examples of dApps'
    ],
    estimatedReadingTime: '3-4 min'
  },
  6: {
    level: 6,
    title: 'Level 6: Wallets, Keys, and Digital Signatures',
    objective: 'Master the security foundations of Web3.',
    concepts: [
      {
        name: 'Private Keys',
        definition: 'A secret cryptographic key that controls access to funds.',
        explanation: 'Never share your private key - anyone with it can control your assets.',
        example: 'Like the master key to your digital bank account.'
      },
      {
        name: 'Public Keys & Addresses',
        definition: 'Public keys are derived from private keys; addresses are derived from public keys.',
        explanation: 'Share your address to receive funds; keep your private key secret.',
        example: 'Address is like your account number, private key is your signature authority.'
      },
      {
        name: 'Wallets',
        definition: 'Software/hardware that manages keys and signs transactions.',
        explanation: 'Wallets don\'t store coins - they store the keys to access them on-chain.',
        example: 'MetaMask is a non-custodial wallet you control.'
      },
      {
        name: 'Digital Signatures',
        definition: 'Cryptographic proof of authorization using private keys.',
        explanation: 'Signatures verify authenticity without exposing the private key.',
        example: 'Signing a transaction proves you authorized it.'
      }
    ],
    learningObjectives: [
      'Distinguish public/private keys and addresses',
      'Explain how non-custodial wallets work',
      'Understand digital signatures',
      'Learn key security best practices'
    ],
    estimatedReadingTime: '3-4 min'
  }
};

export function getLevelBriefing(levelNumber) {
  if (LEVEL_BRIEFINGS[levelNumber]) {
    return LEVEL_BRIEFINGS[levelNumber];
  }
  // Generate fallback briefing for levels beyond predefined ones
  return {
    level: levelNumber,
    title: `Level ${levelNumber}: Advanced Blockchain Concepts`,
    objective: 'Review key concepts that will be tested in this level.',
    concepts: [
      {
        name: 'Blockchain Fundamentals',
        definition: 'Core principles of decentralized ledgers.',
        explanation: 'Blocks, hashes, and consensus form the foundation.',
        example: 'Apply what you\'ve learned to new scenarios.'
      },
      {
        name: 'Security & Immutability',
        definition: 'How cryptography ensures data integrity.',
        explanation: 'Hash chaining and distributed validation prevent tampering.',
        example: 'Each block secures the history before it.'
      }
    ],
    learningObjectives: [
      'Review level-appropriate concepts',
      'Prepare for mixed question types',
      'Apply knowledge to reasoning scenarios'
    ],
    estimatedReadingTime: '2-3 min'
  };
}
