import React from 'react';
import { IconAward, IconX, IconExternalLink, IconShieldCheck } from '../components/Icons';
import { useWeb3 } from '../context/Web3Context';

export function AchievementsModal({ isOpen, onClose }) {
  const { contractsConfig } = useWeb3();

  if (!isOpen) return null;

  const credentials = [
    {
      id: 'cred-1',
      title: 'Certified Blockchain Foundations Explorer',
      description: 'Demonstrated mastery of distributed blocks, cryptographic hashes, and consensus state machines.',
      grade: '98%',
      status: 'VERIFIED ON-CHAIN',
      network: 'MST Testnet',
      contract: contractsConfig?.contracts?.achievements || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      isUnlocked: true
    },
    {
      id: 'cred-2',
      title: 'Smart Contract and EVM Security Practitioner',
      description: 'Successfully identified reentrancy vulnerabilities and executed EIP-712 typed signature verifications.',
      grade: 'Level 2 Required',
      status: 'IN PROGRESS',
      network: 'MST Testnet',
      contract: contractsConfig?.contracts?.achievements || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      isUnlocked: false
    }
  ];

  const explorerBase = contractsConfig?.network?.explorerUrl || 'https://testnet.mstscan.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto select-none">
      <div className="w-full max-w-xl bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#17985d]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconAward className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffffff]">
                On-Chain Credentials
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">
                Verifiable soulbound diplomas and achievements issued on MST Blockchain.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials List */}
        <div className="space-y-4">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className={`p-4 border ${
                cred.isUnlocked
                  ? 'bg-[#0d1410] border-[#17985d]'
                  : 'bg-[#0d1410] border-[#6d6499]/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <IconShieldCheck className={`w-5 h-5 ${cred.isUnlocked ? 'text-[#17985d]' : 'text-[#6d6499]'}`} />
                  <h3 className="font-bold text-sm text-[#ffffff] uppercase">{cred.title}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                    cred.isUnlocked
                      ? 'bg-[#0d1410] border-[#17985d] text-[#17985d]'
                      : 'bg-[#0d1410] border-[#6d6499] text-[#6d6499]'
                  }`}
                >
                  {cred.status}
                </span>
              </div>

              <p className="text-xs text-[#d2fcf8]/80 mb-4 leading-relaxed">
                {cred.description}
              </p>

              {cred.isUnlocked && (
                <div className="pt-3 border-t border-[#17985d]/30 flex items-center justify-between text-xs">
                  <span className="text-[#6d6499] text-[11px]">
                    Contract: {cred.contract.slice(0, 10)}...{cred.contract.slice(-6)}
                  </span>
                  <a
                    href={`${explorerBase}/address/${cred.contract}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#17985d] hover:underline font-bold"
                  >
                    <span>View Registry</span>
                    <IconExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
