import React from 'react';
import { Award, X, ExternalLink, CheckCircle2, ShieldCheck } from 'lucide-react';
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
      title: 'Smart Contract & EVM Security Practitioner',
      description: 'Successfully identified reentrancy vulnerabilities and executed EIP-712 typed signature verifications.',
      grade: 'Level 2 Required',
      status: 'IN PROGRESS',
      network: 'MST Testnet',
      isUnlocked: false
    }
  ];

  const explorerBase = contractsConfig?.network?.explorerUrl || 'https://testnet.mstscan.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-white">On-Chain Credentials</h2>
              <p className="text-xs text-slate-400">
                Verifiable soulbound diplomas and achievements issued on MST Blockchain.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials List */}
        <div className="space-y-4">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className={`p-5 rounded-2xl border transition-all ${
                cred.isUnlocked
                  ? 'bg-gradient-to-br from-slate-900/90 to-amber-950/30 border-amber-500/40'
                  : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-5 h-5 ${cred.isUnlocked ? 'text-amber-400' : 'text-slate-500'}`} />
                  <h3 className="font-display font-bold text-sm sm:text-base text-white">{cred.title}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    cred.isUnlocked
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cred.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {cred.description}
              </p>

              {cred.isUnlocked && (
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Contract: {cred.contract.slice(0, 10)}...{cred.contract.slice(-6)}
                  </span>
                  <a
                    href={`${explorerBase}/address/${cred.contract}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-semibold"
                  >
                    <span>View Registry</span>
                    <ExternalLink className="w-3 h-3" />
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
