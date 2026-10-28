import React, { useState, useEffect } from 'react';
import { IconAward, IconExternalLink, IconCheckCircle, IconClock } from '../components/Icons';
import { api } from '../services/api';
import { useWeb3 } from '../context/Web3Context';

export function AchievementsScreen({ isOpen, onClose }) {
  const { contractsConfig } = useWeb3();
  const [available, setAvailable] = useState([]);
  const [myAchievements, setMyAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [availRes, myRes] = await Promise.all([
        api.get('/achievements'),
        api.get('/achievements/me').catch(() => ({ success: true, achievements: [] }))
      ]);
      if (availRes.success) setAvailable(availRes.achievements || []);
      if (myRes.success) setMyAchievements(myRes.achievements || []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
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
              <IconAward className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffffff]">
                Skills & Achievements
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">
                Turn Skills Into Achievements, Achievements Into Opportunities
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] hover:bg-[#17985d] hover:text-[#0d1410]">
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border ${activeTab === 'my' ? 'bg-[#17985d] text-[#ffffff] border-[#17985d]' : 'bg-[#0d1410] text-[#d2fcf8] border-[#17985d]/50'}`}
          >
            My Achievements ({myAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border ${activeTab === 'available' ? 'bg-[#17985d] text-[#ffffff] border-[#17985d]' : 'bg-[#0d1410] text-[#d2fcf8] border-[#17985d]/50'}`}
          >
            Available
          </button>
        </div>

        {loading && <div className="text-center text-[#d2fcf8]/60 py-8">Loading...</div>}

        {activeTab === 'my' && !loading && (
          <div className="space-y-3">
            {myAchievements.length === 0 ? (
              <div className="p-6 text-center text-[#d2fcf8]/60 border border-[#17985d]/40">
                No achievements yet. Complete mastery challenges to earn verifiable achievements.
              </div>
            ) : (
              myAchievements.map((ach, idx) => (
                <div key={idx} className="p-4 border border-[#17985d] bg-[#0d1410]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <IconAward className="w-6 h-6 text-[#17985d] mt-1" />
                      <div>
                        <h3 className="text-sm font-bold text-[#ffffff] uppercase tracking-wider">{ach.title}</h3>
                        <p className="text-xs text-[#d2fcf8]/80 mt-1">{ach.description}</p>
                        {ach.score && <p className="text-xs text-[#6d6499] mt-1">Score: {ach.score}%</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {ach.verifiedOnChain || ach.transactionHash ? (
                        <span className="flex items-center gap-1 text-xs text-[#17985d]">
                          <IconCheckCircle className="w-3 h-3" /> Verified On-Chain
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#6d6499]">
                          <IconClock className="w-3 h-3" /> Issued
                        </span>
                      )}
                      {ach.transactionHash && (
                        <a
                          href={`${explorerBase}/tx/${ach.transactionHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-[#17985d] hover:underline"
                        >
                          View TX <IconExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'available' && !loading && (
          <div className="space-y-3">
            {available.map((ach) => (
              <div key={ach.type} className="p-4 border border-[#17985d]/60 bg-[#0d1410]">
                <div className="flex items-start gap-3">
                  <IconAward className="w-6 h-6 text-[#6d6499] mt-1" />
                  <div>
                    <h3 className="text-sm font-bold text-[#ffffff] uppercase tracking-wider">{ach.title}</h3>
                    <p className="text-xs text-[#d2fcf8]/80 mt-1">{ach.description}</p>
                    <p className="text-xs text-[#6d6499] mt-2">
                      Criteria: {JSON.stringify(ach.criteria)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
