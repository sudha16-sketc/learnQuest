import React, { useState, useEffect } from 'react';
import { IconTarget, IconExternalLink, IconUsers } from '../components/Icons';
import { api } from '../services/api';
import { useWeb3 } from '../context/Web3Context';

export function SponsorsScreen({ isOpen, onClose }) {
  const { contractsConfig } = useWeb3();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadChallenges();
    }
  }, [isOpen]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sponsors/challenges?status=active');
      if (res.success) {
        setChallenges(res.challenges || []);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const explorerBase = contractsConfig?.network?.explorerUrl || 'https://testnet.mstscan.com';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/95 pointer-events-auto select-none">
      <div className="w-full max-w-4xl bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-mono">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#17985d]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconTarget className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffffff]">
                Sponsored Skill Challenges
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">
                Skill-based opportunities funded by sponsors
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]">
            ×
          </button>
        </div>

        {loading && <div className="text-center text-[#d2fcf8]/60 py-8">Loading...</div>}

        {!loading && challenges.length === 0 && (
          <div className="p-6 text-center text-[#d2fcf8]/60 border border-[#17985d]/40">
            <IconUsers className="w-8 h-8 mx-auto mb-2 text-[#6d6499]" />
            <p>No active sponsored challenges at this time.</p>
            <p className="text-xs mt-2">Check back soon for skill-based opportunities.</p>
          </div>
        )}

        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="p-4 border border-[#17985d] bg-[#0d1410]">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#ffffff] uppercase tracking-wider">{challenge.title}</h3>
                  <p className="text-xs text-[#d2fcf8]/80 mt-1">{challenge.description}</p>
                </div>
                <span className="px-2 py-1 text-xs border border-[#17985d] text-[#17985d] uppercase">
                  {challenge.difficulty}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                <div>
                  <span className="text-[#6d6499]">Rewards:</span>
                  <span className="text-[#ffffff] ml-2">{challenge.rewards?.xp || 0} XP, {challenge.rewards?.tokens || '0'} LQST</span>
                </div>
                <div>
                  <span className="text-[#6d6499]">Type:</span>
                  <span className="text-[#ffffff] ml-2">{challenge.type}</span>
                </div>
              </div>

              {challenge.eligibilityCriteria && Object.keys(challenge.eligibilityCriteria).length > 0 && (
                <div className="mb-3 p-2 bg-[#0d1410] border border-[#17985d]/40 text-xs">
                  <span className="text-[#6d6499]">Eligibility:</span>
                  <span className="text-[#d2fcf8]/80 ml-2">{JSON.stringify(challenge.eligibilityCriteria)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6d6499]">
                  Sponsor-funded on MST Testnet
                </span>
                <a
                  href={`${explorerBase}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#17985d] hover:underline"
                >
                  View on MST Explorer <IconExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
