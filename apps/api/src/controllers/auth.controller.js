import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';
import { RegisterSchema, LoginSchema, WalletLinkChallengeSchema, WalletLinkVerifySchema } from '@learnquest/validation';

export async function register(req, res, next) {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const { email, username, password } = parseResult.data;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    // Check existing
    if (isPrismaConnected) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
      });
      if (existing) {
        return res.status(409).json({ success: false, error: 'User with this email or username already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, username, passwordHash }
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

      return res.status(201).json({
        success: true,
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, level: user.level }
      });
    } else {
      // Memory fallback
      for (const u of memoryStore.users.values()) {
        if (u.email === email || u.username === username) {
          return res.status(409).json({ success: false, error: 'User with this email or username already exists' });
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = {
        id: `user-${Date.now()}`,
        email,
        username,
        passwordHash,
        role: 'STUDENT',
        level: 1,
        createdAt: new Date()
      };
      memoryStore.users.set(user.id, user);

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry }
      );

      return res.status(201).json({
        success: true,
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role, level: user.level }
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    }

    const { login, password } = parseResult.data;
    const { isPrismaConnected, prisma, memoryStore } = getDb();

    let user;
    if (isPrismaConnected) {
      user = await prisma.user.findFirst({
        where: { OR: [{ email: login }, { username: login }] },
        include: { wallets: true }
      });
    } else {
      for (const u of memoryStore.users.values()) {
        if (u.email === login || u.username === login) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        level: user.level,
        walletAddress: user.wallets?.[0]?.address || memoryStore.wallets.get(user.id)?.address || null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const { isPrismaConnected, prisma, memoryStore } = getDb();
    if (isPrismaConnected) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { wallets: true }
      });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          level: user.level,
          wallets: user.wallets
        }
      });
    } else {
      const user = memoryStore.users.get(req.user.id);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
      const wallet = memoryStore.wallets.get(user.id);
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          level: user.level,
          wallets: wallet ? [wallet] : []
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function requestWalletChallenge(req, res, next) {
  try {
    const parse = WalletLinkChallengeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }
    const { address, chainId } = parse.data;
    const timestamp = Date.now();
    const challenge = `Link wallet ${address.toLowerCase()} to LearnQuest account (User: ${req.user.id}, Nonce: ${timestamp}, ChainId: ${chainId})`;

    res.json({
      success: true,
      challenge,
      timestamp
    });
  } catch (err) {
    next(err);
  }
}

export async function linkWallet(req, res, next) {
  try {
    const parse = WalletLinkVerifySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { address, signature, challenge } = parse.data;

    // Verify cryptographic signature
    const recovered = ethers.verifyMessage(challenge, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Cryptographic signature verification failed' });
    }

    const { isPrismaConnected, prisma, memoryStore } = getDb();
    if (isPrismaConnected) {
      const wallet = await prisma.wallet.upsert({
        where: { address: address.toLowerCase() },
        update: { userId: req.user.id, signatureProof: signature },
        create: {
          userId: req.user.id,
          address: address.toLowerCase(),
          chainId: config.blockchain.chainId,
          signatureProof: signature
        }
      });
      return res.json({ success: true, wallet });
    } else {
      const wallet = {
        id: `wallet-${Date.now()}`,
        userId: req.user.id,
        address: address.toLowerCase(),
        chainId: config.blockchain.chainId,
        signatureProof: signature,
        linkedAt: new Date()
      };
      memoryStore.wallets.set(req.user.id, wallet);
      return res.json({ success: true, wallet });
    }
  } catch (err) {
    next(err);
  }
}
