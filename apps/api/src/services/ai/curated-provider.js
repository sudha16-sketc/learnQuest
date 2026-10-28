import { IAIProvider } from './ai-provider.interface.js';

/**
 * Verified curated curriculum.
 *
 * Every pool contains at least 14 questions so a single level can request
 * 10-13 distinct standard questions without repeating content.
 * `correctOptionIndex` is the source-of-truth answer key and is always
 * shuffled deterministically before it is exposed to a client.
 */
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
    },
    {
      id: 'q-begin-005',
      concept: 'distributed_ledger',
      type: 'multiple_choice',
      question: 'A distributed ledger differs from a traditional bank database mainly because it is:',
      options: [
        'Replicated and synchronized across many independent nodes instead of one central server',
        'Stored only on the laptop of the company CEO',
        'Updated by a single administrator each night',
        'Always faster and cheaper than every traditional database'
      ],
      correctOptionIndex: 0,
      explanation: 'A distributed ledger is shared across many nodes, each maintaining a copy and validating updates, which removes single points of control and failure.',
      hint: 'Think about who holds a copy of the data.',
      difficultyScore: 1
    },
    {
      id: 'q-begin-006',
      concept: 'transactions',
      type: 'multiple_choice',
      question: 'What must a user provide to authorize a blockchain transaction from their wallet?',
      options: [
        'A digital signature created with their private key',
        'Their email password typed into the block header',
        'A screenshot of their wallet balance',
        'The private key of the recipient'
      ],
      correctOptionIndex: 0,
      explanation: 'Transactions are authorized with a digital signature generated by the sender\'s private key. The private key itself is never transmitted to the network.',
      hint: 'It is a cryptographic proof, not a password or a screenshot.',
      difficultyScore: 2
    },
    {
      id: 'q-begin-007',
      concept: 'nodes',
      type: 'multiple_choice',
      question: 'What is the role of a full node in a blockchain network?',
      options: [
        'Store the full chain and independently validate transactions and blocks',
        'Only display advertisements to wallet users',
        'Mint unlimited tokens without consensus',
        'Replace the need for cryptographic signatures'
      ],
      correctOptionIndex: 0,
      explanation: 'Full nodes download and verify every block, enforcing the network rules and helping honest participants converge on the same canonical chain.',
      hint: 'Independence and validation are the key ideas.',
      difficultyScore: 2
    },
    {
      id: 'q-begin-008',
      concept: 'decentralization',
      type: 'multiple_choice',
      question: 'What is a key benefit of decentralization in a blockchain network?',
      options: [
        'It reduces reliance on a single point of control or failure',
        'It guarantees zero transaction fees forever',
        'It removes the need for any cryptography',
        'It makes all transactions instantly final with no consensus'
      ],
      correctOptionIndex: 0,
      explanation: 'Decentralization spreads control across many participants, improving censorship resistance and resilience compared with a single central operator.',
      hint: 'Think about what happens when one server or company controls everything.',
      difficultyScore: 2
    },
    {
      id: 'q-begin-009',
      concept: 'merkle_root',
      type: 'multiple_choice',
      question: 'What does the Merkle root in a block header summarize?',
      options: [
        'All transactions in the block, combined into a single root hash',
        'Only the first transaction in the block',
        'The wallet addresses of the miners',
        'The total number of blocks in the chain'
      ],
      correctOptionIndex: 0,
      explanation: 'The Merkle root is a single hash derived from all transaction hashes in the block, enabling compact proofs that a transaction is included.',
      hint: 'It is one hash representing a whole tree of transactions.',
      difficultyScore: 3
    },
    {
      id: 'q-begin-010',
      concept: 'genesis_block',
      type: 'multiple_choice',
      question: 'What is the genesis block?',
      options: [
        'The very first block in a blockchain, with no previous block',
        'The most recent block added to the chain',
        'A block that can only be mined by the government',
        'A temporary block deleted after confirmation'
      ],
      correctOptionIndex: 0,
      explanation: 'The genesis block is the foundational block of a chain. It has no parent and defines the starting point for all subsequent blocks.',
      hint: 'Think about the beginning of the chain.',
      difficultyScore: 1
    },
    {
      id: 'q-begin-011',
      concept: 'consensus_basics',
      type: 'multiple_choice',
      question: 'Why does a blockchain network need a consensus mechanism?',
      options: [
        'So independent nodes can agree on a single valid version of history',
        'So a single company can decide which transactions are valid',
        'So hashes can be reversed when needed',
        'So wallets can store private keys on the server'
      ],
      correctOptionIndex: 0,
      explanation: 'Consensus mechanisms let nodes that may not trust each other agree on the canonical chain and prevent double spending without a central authority.',
      hint: 'Agreement among independent participants is the goal.',
      difficultyScore: 2
    },
    {
      id: 'q-begin-012',
      concept: 'public_key',
      type: 'multiple_choice',
      question: 'How is a blockchain address typically derived?',
      options: [
        'From a public key, which itself is derived from a private key',
        'From the user\'s email address and birthday',
        'From the current price of the token',
        'From the number of transactions in the mempool'
      ],
      correctOptionIndex: 0,
      explanation: 'A private key generates a public key, and the public key is hashed/encoded to produce an address. The address can be shared safely.',
      hint: 'Follow the key hierarchy: private to public to address.',
      difficultyScore: 3
    },
    {
      id: 'q-begin-013',
      concept: 'tamper_evidence',
      type: 'multiple_choice',
      question: 'Why is tampering with an old block in a blockchain detected by the network?',
      options: [
        'Changing it changes its hash, breaking every subsequent block link',
        'Old blocks are stored on paper and cannot be edited',
        'Nodes delete all old blocks automatically every day',
        'The timestamp stops updating when a block is edited'
      ],
      correctOptionIndex: 0,
      explanation: 'Each block includes the previous block\'s hash. Altering an old block changes its hash, so all child blocks no longer match and the tampered chain is rejected.',
      hint: 'Focus on the chain of hashes pointing backwards.',
      difficultyScore: 3
    },
    {
      id: 'q-begin-014',
      concept: 'smart_contracts_intro',
      type: 'multiple_choice',
      question: 'What is a smart contract?',
      options: [
        'Self-executing code deployed to a blockchain that runs when conditions are met',
        'A legal document signed with a pen and scanned into the chain',
        'A wallet that automatically invests for you with guaranteed returns',
        'A type of hash function used only for passwords'
      ],
      correctOptionIndex: 0,
      explanation: 'Smart contracts are programs stored on-chain. They execute deterministically and can enforce rules without a central intermediary.',
      hint: 'Think of code that runs automatically on a blockchain.',
      difficultyScore: 3
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
    },
    {
      id: 'q-inter-004',
      concept: 'pow',
      type: 'multiple_choice',
      question: 'What does a miner actually do in a Proof of Work network?',
      options: [
        'Repeatedly hash block candidates until finding a value below a difficulty target',
        'Ask a central server for permission to add a block',
        'Sign transactions on behalf of all users',
        'Store private keys for the whole network'
      ],
      correctOptionIndex: 0,
      explanation: 'Miners perform computational work by hashing block headers with different nonces until the hash meets the network difficulty target.',
      hint: 'It is a brute-force search for a rare hash.',
      difficultyScore: 4
    },
    {
      id: 'q-inter-005',
      concept: 'finality',
      type: 'multiple_choice',
      question: 'What does "probabilistic finality" mean in a blockchain?',
      options: [
        'The chance of a transaction being reversed decreases as more blocks are added on top',
        'A transaction is reversible forever by any user',
        'A transaction is final the instant it is broadcast',
        'Only the miner who created a block can reverse it'
      ],
      correctOptionIndex: 0,
      explanation: 'In probabilistic finality, confidence grows with each additional confirmation. Reorganizing deep blocks becomes exponentially harder.',
      hint: 'Think about confirmations and decreasing risk over time.',
      difficultyScore: 4
    },
    {
      id: 'q-inter-006',
      concept: 'mempool',
      type: 'multiple_choice',
      question: 'What is the mempool?',
      options: [
        'A holding area of broadcast but not yet confirmed transactions',
        'A permanent archive of all private keys',
        'A smart contract that mints new blocks',
        'The wallet used by miners to receive rewards'
      ],
      correctOptionIndex: 0,
      explanation: 'The mempool is where nodes keep pending transactions before validators/miners include them in a block. Fee priority affects selection.',
      hint: 'It is a waiting room for transactions.',
      difficultyScore: 3
    },
    {
      id: 'q-inter-007',
      concept: 'nonce',
      type: 'multiple_choice',
      question: 'In account-based blockchains, what is the purpose of a transaction nonce?',
      options: [
        'It orders transactions from an account and prevents replay of the same transaction',
        'It encrypts the recipient address',
        'It sets the token price for the transfer',
        'It selects which miner validates the block'
      ],
      correctOptionIndex: 0,
      explanation: 'Each account transaction has an incrementing nonce. This ordering prevents replay attacks and duplicate execution of the same signed transaction.',
      hint: 'It is a counter tied to the sender\'s account.',
      difficultyScore: 4
    },
    {
      id: 'q-inter-008',
      concept: 'fork',
      type: 'multiple_choice',
      question: 'What is a chain reorganization (reorg)?',
      options: [
        'Replacing part of the canonical chain with a longer or heavier alternative branch',
        'Deleting every block older than one year',
        'Changing the token name through a wallet setting',
        'Converting a public chain into a private database'
      ],
      correctOptionIndex: 0,
      explanation: 'A reorg happens when nodes adopt a different branch that has more accumulated work or stake, causing recent blocks to be replaced.',
      hint: 'Branches compete and the network picks the strongest one.',
      difficultyScore: 5
    },
    {
      id: 'q-inter-009',
      concept: 'signature_replay',
      type: 'multiple_choice',
      question: 'How does a blockchain prevent a signed transaction from being replayed on another chain?',
      options: [
        'By including a chain ID (and nonce) in the signed transaction data',
        'By hiding the transaction from block explorers',
        'By using the same private key for every chain without any domain separation',
        'By requiring the recipient to re-sign the transaction'
      ],
      correctOptionIndex: 0,
      explanation: 'Domain separation such as EIP-155 chain IDs and nonces ensures a signature is only valid for the intended chain and transaction.',
      hint: 'Think about domain separation and replay protection.',
      difficultyScore: 5
    },
    {
      id: 'q-inter-010',
      concept: 'merkle_proof',
      type: 'multiple_choice',
      question: 'A Merkle inclusion proof for one transaction requires roughly how much data?',
      options: [
        'A logarithmic number of sibling hashes along the path to the root',
        'Every transaction in the entire blockchain',
        'The private keys of all block producers',
        'A full copy of the block plus all future blocks'
      ],
      correctOptionIndex: 0,
      explanation: 'A Merkle proof contains only the sibling hashes along the path from the leaf to the root, giving O(log n) proof size.',
      hint: 'Logarithmic proof size is the advantage.',
      difficultyScore: 5
    },
    {
      id: 'q-inter-011',
      concept: 'block_header',
      type: 'multiple_choice',
      question: 'Which field cryptographically commits a block to its parent?',
      options: [
        'The previous block hash stored in the block header',
        'The token symbol displayed in the wallet',
        'The number of transactions in the mempool',
        'The block explorer website URL'
      ],
      correctOptionIndex: 0,
      explanation: 'The previous block hash in the header creates the cryptographic link to the parent block, forming the chain.',
      hint: 'Look for the backwards-pointing hash.',
      difficultyScore: 4
    },
    {
      id: 'q-inter-012',
      concept: 'events_logs',
      type: 'multiple_choice',
      question: 'Why do smart contracts emit events (logs)?',
      options: [
        'To provide cheap, indexable records that off-chain applications can observe',
        'To permanently store large files on-chain at no cost',
        'To sign transactions on behalf of users',
        'To reset the blockchain state after every call'
      ],
      correctOptionIndex: 0,
      explanation: 'Events are recorded in transaction receipts and are relatively cheap compared with contract storage, making them useful for off-chain indexing.',
      hint: 'Off-chain apps listen for them.',
      difficultyScore: 5
    },
    {
      id: 'q-inter-013',
      concept: 'erc20',
      type: 'multiple_choice',
      question: 'What does the ERC-20 standard define?',
      options: [
        'A common interface for fungible tokens including transfer and allowance functions',
        'A consensus algorithm for private networks',
        'A hardware wallet form factor',
        'A file format for storing seed phrases'
      ],
      correctOptionIndex: 0,
      explanation: 'ERC-20 standardizes fungible token behavior (transfer, approve, transferFrom, balanceOf) so wallets and dApps can interact consistently.',
      hint: 'It is the fungible token interface standard.',
      difficultyScore: 4
    },
    {
      id: 'q-inter-014',
      concept: 'layer2',
      type: 'multiple_choice',
      question: 'What is the main purpose of a Layer 2 rollup?',
      options: [
        'Increase throughput and lower fees by executing transactions off the main chain while settling to it',
        'Replace all cryptography with trust in one operator',
        'Store private keys for users permanently',
        'Remove the need for consensus on Layer 1'
      ],
      correctOptionIndex: 0,
      explanation: 'Rollups execute transactions outside the main chain but post compressed data or proofs back to Layer 1, inheriting its security.',
      hint: 'Scale execution while keeping Layer 1 security.',
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
    },
    {
      id: 'q-adv-003',
      concept: 'oracle_manipulation',
      type: 'multiple_choice',
      question: 'Why is a spot price from a single low-liquidity DEX pool dangerous as a price oracle?',
      options: [
        'An attacker can temporarily manipulate the pool to distort the price and exploit dependent contracts',
        'It always returns the same price regardless of trades',
        'It is cryptographically impossible to read from a contract',
        'It requires no on-chain state so it cannot be attacked'
      ],
      correctOptionIndex: 0,
      explanation: 'Single-pool spot prices are manipulable via flash loans or large trades. Robust designs use time-weighted averages or multiple independent sources.',
      hint: 'Think about flash-loan price manipulation.',
      difficultyScore: 8
    },
    {
      id: 'q-adv-004',
      concept: 'access_control',
      type: 'multiple_choice',
      question: 'A contract has a privileged mint function but no access control. What is the most likely consequence?',
      options: [
        'Anyone can call it and mint unlimited tokens, collapsing the token economy',
        'Gas fees automatically become zero for everyone',
        'The function becomes private after the first call',
        'The compiler refuses to deploy the contract'
      ],
      correctOptionIndex: 0,
      explanation: 'Without modifiers such as onlyOwner or role checks, any external account can invoke the function and mint arbitrary tokens.',
      hint: 'Who can call the function?',
      difficultyScore: 7
    },
    {
      id: 'q-adv-005',
      concept: 'integer_overflow',
      type: 'multiple_choice',
      question: 'In a pre-0.8 Solidity contract, what risk arises from unchecked arithmetic?',
      options: [
        'Integer overflow/underflow can wrap values and corrupt balances or logic',
        'The EVM automatically reverts every transaction',
        'Hashes become reversible',
        'The private key is printed to the console'
      ],
      correctOptionIndex: 0,
      explanation: 'Solidity before 0.8 did not check arithmetic. Overflow could wrap a balance or supply, which is why SafeMath or 0.8+ checked arithmetic matters.',
      hint: 'Think about bounds on uint types.',
      difficultyScore: 7
    },
    {
      id: 'q-adv-006',
      concept: 'front_running',
      type: 'multiple_choice',
      question: 'What is a front-running attack in a public mempool?',
      options: [
        'Observing a pending profitable transaction and submitting a competing transaction with a higher fee to execute first',
        'Mining a block before the network exists',
        'Deleting another user\'s wallet from the chain',
        'Reversing a hash to discover a nonce'
      ],
      correctOptionIndex: 0,
      explanation: 'Because pending transactions are visible, searchers can insert their own transaction ahead of a victim by paying a higher priority fee, profiting from the victim\'s expected trade.',
      hint: 'It exploits transaction ordering and fee priority.',
      difficultyScore: 8
    },
    {
      id: 'q-adv-007',
      concept: 'proxy_upgrade',
      type: 'multiple_choice',
      question: 'In an upgradeable proxy pattern, what should remain unchanged between implementations?',
      options: [
        'The storage layout, so existing state variables are not corrupted',
        'The contract address of the implementation',
        'The number of tokens in circulation',
        'The chain ID of the network'
      ],
      correctOptionIndex: 0,
      explanation: 'Proxies delegate calls while retaining storage. If a new implementation reorders or changes the storage layout, previously written state can be misinterpreted.',
      hint: 'Delegatecall shares storage with the proxy.',
      difficultyScore: 8
    },
    {
      id: 'q-adv-008',
      concept: 'signature_malleability',
      type: 'multiple_choice',
      question: 'Why should contracts use ECDSA recovery libraries that enforce canonical signature values?',
      options: [
        'To prevent malleable signatures from being altered while remaining valid for the same message',
        'To make signatures larger than the message',
        'To remove the need for a message hash',
        'To allow anyone to forge a signature without a private key'
      ],
      correctOptionIndex: 0,
      explanation: 'ECDSA signatures can be malleated. Libraries like OpenZeppelin ECDSA enforce lower-s values and reject invalid v values to prevent replay or bypass bugs.',
      hint: 'Same message, two valid encodings.',
      difficultyScore: 9
    },
    {
      id: 'q-adv-009',
      concept: 'flash_loans',
      type: 'multiple_choice',
      question: 'What makes a flash loan unique?',
      options: [
        'It must be borrowed and repaid within a single transaction or the whole transaction reverts',
        'It requires collateral equal to 200% of the loan',
        'It can only be used by central banks',
        'It has a repayment period of one year'
      ],
      correctOptionIndex: 0,
      explanation: 'Flash loans are uncollateralized because atomicity guarantees repayment in the same transaction. If the borrower cannot repay, the entire transaction reverts.',
      hint: 'Atomicity within one transaction is the key.',
      difficultyScore: 8
    },
    {
      id: 'q-adv-010',
      concept: 'mev',
      type: 'multiple_choice',
      question: 'What is MEV (Maximal Extractable Value)?',
      options: [
        'Profit that block builders or searchers can extract by choosing transaction ordering and inclusion',
        'The maximum number of tokens a wallet can hold',
        'A consensus algorithm used only on private chains',
        'The energy consumed by a single hash computation'
      ],
      correctOptionIndex: 0,
      explanation: 'MEV refers to value captured by reordering, inserting, or censoring transactions within blocks. It includes arbitrage, liquidations, and front-running.',
      hint: 'Value comes from ordering and inclusion.',
      difficultyScore: 9
    },
    {
      id: 'q-adv-011',
      concept: 'zk_proofs',
      type: 'multiple_choice',
      question: 'What does a zero-knowledge proof allow a prover to do?',
      options: [
        'Convince a verifier that a statement is true without revealing the underlying secret data',
        'Reveal every private input to the verifier',
        'Forge signatures without any key',
        'Delete data from an immutable ledger'
      ],
      correctOptionIndex: 0,
      explanation: 'A ZK proof proves knowledge of a witness satisfying a statement while keeping the witness secret. This enables privacy and scalable verification.',
      hint: 'Proof of truth without disclosing the witness.',
      difficultyScore: 9
    },
    {
      id: 'q-adv-012',
      concept: 'account_abstraction',
      type: 'multiple_choice',
      question: 'What problem does account abstraction (ERC-4337) primarily address?',
      options: [
        'Adding programmable validation and gas sponsorship to smart contract accounts',
        'Removing the need for any transaction signatures',
        'Making all blocks the same size',
        'Replacing Layer 1 consensus with a single server'
      ],
      correctOptionIndex: 0,
      explanation: 'ERC-4337 uses UserOperations and bundlers to enable smart accounts with custom validation, paymasters, and social recovery features.',
      hint: 'Smart accounts with programmable validation.',
      difficultyScore: 9
    },
    {
      id: 'q-adv-013',
      concept: 'governance_attack',
      type: 'multiple_choice',
      question: 'Why do many DeFi protocols use time locks on governance actions?',
      options: [
        'To give users time to review and exit before a potentially malicious change executes',
        'To make governance proposals execute instantly',
        'To prevent anyone from voting on proposals',
        'To increase the block time of the chain'
      ],
      correctOptionIndex: 0,
      explanation: 'Time locks delay execution of passed proposals, creating a window for community review and reducing the impact of compromised governance keys.',
      hint: 'Delay creates a safety window.',
      difficultyScore: 8
    },
    {
      id: 'q-adv-014',
      concept: 'cross_chain',
      type: 'multiple_choice',
      question: 'What is the core security tradeoff of many cross-chain bridges?',
      options: [
        'They introduce trust assumptions about validators or lock-and-mint custody of assets',
        'They eliminate the need for consensus on either chain',
        'They make all assets natively available on every chain without any risk',
        'They guarantee instant finality on all connected chains'
      ],
      correctOptionIndex: 0,
      explanation: 'Bridges often rely on committees, multisigs, or light clients. The security of the bridge depends on those trust assumptions and is a common exploit target.',
      hint: 'Who is trusted to move the assets?',
      difficultyScore: 9
    }
  ]
};

/**
 * Boss questions are scenario-driven and deliberately harder than the
 * standard pool. They combine multiple concepts from the level.
 */
export const CURATED_BOSS_QUESTIONS = {
  1: {
    id: 'q-boss-001',
    concept: 'blockchain_fundamentals',
    type: 'multiple_choice',
    question: 'A malicious actor edits a transaction inside block 900 of a 10,000-block chain and recalculates block 900\'s hash. Why does the rest of the network still reject the change?',
    options: [
      'Every later block stores the previous block hash, so all 9,100 descendants become invalid and would need to be recomputed faster than the honest network',
      'The transaction is encrypted and cannot be edited by anyone',
      'Block 900 is automatically deleted after 1,000 confirmations',
      'The wallet provider centrally reverts any edit request'
    ],
    correctOptionIndex: 0,
    explanation: 'Immutability comes from hash linking plus distributed consensus. Editing block 900 changes its hash, invalidating all descendant blocks. The attacker would need to redo all subsequent work and outpace the majority of honest nodes.',
    hint: 'Trace the previous-hash chain forward from the edited block.',
    difficultyScore: 10
  },
  2: {
    id: 'q-boss-002',
    concept: 'blockchain_architecture',
    type: 'multiple_choice',
    question: 'A network has 100 nodes. 40 are controlled by an attacker who wants to finalize a conflicting chain. Under a typical BFT assumption, what is the most accurate outcome?',
    options: [
      'Honest nodes can still reach consensus because the attacker controls less than the one-third threshold; the conflicting chain should not finalize',
      'The attacker can finalize any chain because 40 nodes is a majority',
      'The network automatically shuts down and deletes all blocks',
      'Consensus is impossible because there is more than one node'
    ],
    correctOptionIndex: 0,
    explanation: 'Classic BFT consensus tolerates up to roughly one-third Byzantine faults. With 40/100 attackers (40%), safety assumptions are stressed; the honest majority must follow the protocol\'s fork-choice and finality rules rather than accept the conflicting chain. The key principle is that finality requires a supermajority, not a simple count of any 40 nodes.',
    hint: 'Compare the attacker share to the one-third Byzantine threshold.',
    difficultyScore: 10
  },
  3: {
    id: 'q-boss-003',
    concept: 'transactions_blocks_hashing',
    type: 'multiple_choice',
    question: 'A block contains transactions T1, T2, T3, T4. Its Merkle root is R. An attacker swaps T3 for a different transaction T3\'. What is the minimum set of commitments that must change for a valid block header?',
    options: [
      'The Merkle path hashes for T3 and the Merkle root R in the header, which then changes the block hash and all later block links',
      'Only the transaction T3\' itself; the Merkle root and block hash stay valid',
      'Only the block timestamp, because Merkle roots are constant',
      'Nothing changes because Merkle trees only store the first transaction'
    ],
    correctOptionIndex: 0,
    explanation: 'Changing a leaf changes its parent hashes up the Merkle path and therefore the Merkle root. The header commits to the root, so the header hash changes and every subsequent block link breaks.',
    hint: 'Follow the changed leaf upward to the root.',
    difficultyScore: 10
  },
  4: {
    id: 'q-boss-004',
    concept: 'consensus',
    type: 'multiple_choice',
    question: 'A PoS chain claims "deterministic finality." A validator set with 2/3 of stake finalizes block B. Then a whale acquires enough stake to attempt a conflicting block B\'. What should a correctly implemented client do?',
    options: [
      'Reject B\' as a finality violation and possibly slash the validators that signed conflicting finalized blocks',
      'Immediately switch to B\' because the whale has more stake',
      'Delete block B and restart the chain from genesis',
      'Accept both B and B\' as equally valid forever'
    ],
    correctOptionIndex: 0,
    explanation: 'Deterministic finality means a finalized block cannot be reverted without violating the protocol. Conflicting finalized votes are slashable evidence of Byzantine behavior. Cumulative stake alone does not override finality.',
    hint: 'Finality is a safety guarantee, not a popularity contest.',
    difficultyScore: 10
  },
  5: {
    id: 'q-boss-005',
    concept: 'smart_contracts',
    type: 'multiple_choice',
    question: 'A DeFi contract sends ETH to a user before subtracting their internal balance. An attacker\'s fallback function re-enters withdraw. Which fix most directly prevents the exploit?',
    options: [
      'Update the internal balance before the external call (Checks-Effects-Interactions) and/or add a reentrancy mutex',
      'Increase the gas limit so the transaction completes faster',
      'Make the withdraw function public without any guard',
      'Store user balances in the frontend localStorage instead of contract storage'
    ],
    correctOptionIndex: 0,
    explanation: 'Reentrancy exploits state that is updated after an external call. Updating effects before interactions ensures the attacker sees a zero balance on re-entry; a mutex adds defense in depth.',
    hint: 'When should state be updated relative to the external call?',
    difficultyScore: 10
  },
  6: {
    id: 'q-boss-006',
    concept: 'wallets_keys_signatures',
    type: 'multiple_choice',
    question: 'A phishing site asks you to sign an EIP-712 message that authorizes a token transfer to an unknown address. The site never asks for your seed phrase. Why can this still drain your wallet?',
    options: [
      'A valid signature authorizes the transfer without exposing the private key, and a malicious spender contract can execute it',
      'Signing automatically uploads the private key to the site',
      'EIP-712 signatures are always harmless because they are not transactions',
      'It cannot drain the wallet unless the seed phrase is entered'
    ],
    correctOptionIndex: 0,
    explanation: 'Signatures are authorization. A malicious EIP-712 payload can approve or transfer assets even though the private key stays secret. Users must read the typed fields and avoid blind signing.',
    hint: 'What does a signature actually authorize?',
    difficultyScore: 10
  }
};

export function getBossQuestion(levelNumber) {
  const known = CURATED_BOSS_QUESTIONS[levelNumber];
  if (known) return known;
  const fallbackKey = ((levelNumber - 1) % 6) + 1;
  const template = CURATED_BOSS_QUESTIONS[fallbackKey];
  return {
    ...template,
    id: `q-boss-${String(levelNumber).padStart(3, '0')}`
  };
}

export class CuratedProvider extends IAIProvider {
  async generateQuestions({ topic, difficulty = 'beginner', count = 3 }) {
    const questionsPool = CURATED_BLOCKCHAIN_CURRICULUM[difficulty] || CURATED_BLOCKCHAIN_CURRICULUM.beginner;
    // Shuffle the pool without mutating the source, then take the requested count.
    const shuffled = [...questionsPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return {
      topic: topic || 'Blockchain Fundamentals',
      difficulty,
      questions: selected,
      source: 'curated_curriculum'
    };
  }

  async generateBossQuestion({ levelNumber = 1 }) {
    return {
      ...getBossQuestion(levelNumber),
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
      id: `${match.id}-remedial-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      question: `[Retry Opportunity] ${match.question}`
    };
  }
}
