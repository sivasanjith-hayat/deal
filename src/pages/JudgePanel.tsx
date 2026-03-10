import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '@/store/eventStore';
import { DealLockOverlay } from '@/components/DealLockOverlay';

const JUDGE_ID = 'j1'; // In production, from auth

const INVESTMENT_OPTIONS = [500, 1000, 2000, 5000];

const JudgePanel = () => {
  const {
    judges, teams, currentTeamIndex, timerSeconds, status,
    makeDeal, noDeal, setProjectorMode,
  } = useEventStore();

  const judge = judges.find(j => j.id === JUDGE_ID)!;
  const currentTeam = teams[currentTeamIndex];
  const [dealLockActive, setDealLockActive] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const deals = useEventStore(s => s.deals.filter(d => d.judgeId === JUDGE_ID));

  const handleDeal = useCallback(() => {
    setDealLockActive(true);
  }, []);

  const handleConfirmDeal = useCallback((amount: number) => {
    makeDeal(JUDGE_ID, amount);
    setTimeout(() => setDealLockActive(false), 1500);
  }, [makeDeal]);

  const handleNoDeal = useCallback(() => {
    noDeal(JUDGE_ID);
  }, [noDeal]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDealWindow = status === 'deal_window';

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      {/* Deal Lock Overlay */}
      <AnimatePresence>
        {dealLockActive && (
          <DealLockOverlay
            options={INVESTMENT_OPTIONS}
            maxAmount={judge.balance}
            onConfirm={handleConfirmDeal}
            onCancel={() => setDealLockActive(false)}
          />
        )}
      </AnimatePresence>

      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground tracking-widest">JUDGE</p>
          <p className="font-display text-lg text-foreground">{judge.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground tracking-widest">CREDITS</p>
          <p className="font-mono text-lg text-foreground tabular-nums">
            {judge.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex border-b border-border">
        <div className="flex-1 px-4 py-2 border-r border-border">
          <p className="text-[10px] text-muted-foreground tracking-widest">DEALS</p>
          <p className="font-mono text-sm tabular-nums">{judge.totalDeals}</p>
        </div>
        <div className="flex-1 px-4 py-2 border-r border-border">
          <p className="text-[10px] text-muted-foreground tracking-widest">INVESTED</p>
          <p className="font-mono text-sm tabular-nums">{judge.totalInvestment.toLocaleString()}</p>
        </div>
        <button
          onClick={() => setShowPortfolio(!showPortfolio)}
          className="px-4 py-2 text-[10px] text-muted-foreground tracking-widest hover:text-foreground transition-colors"
        >
          PORTFOLIO ▾
        </button>
      </div>

      {/* Portfolio Dropdown */}
      <AnimatePresence>
        {showPortfolio && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-4 space-y-2 max-h-32 overflow-y-auto">
              {deals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No investments yet</p>
              ) : (
                deals.map(d => {
                  const team = teams.find(t => t.id === d.teamId);
                  return (
                    <div key={d.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{team?.name}</span>
                      <span className="font-mono tabular-nums">{d.amount.toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center: Current Team & Timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-xs text-muted-foreground tracking-[0.3em] mb-2">NOW PITCHING</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wide text-foreground mb-4">
          {currentTeam?.name || 'STANDBY'}
        </h1>
        {currentTeam && (
          <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
            {currentTeam.description}
          </p>
        )}
        <div className="font-mono text-5xl sm:text-6xl tabular-nums text-foreground">
          {formatTime(timerSeconds)}
        </div>
        <p className="text-[10px] text-muted-foreground tracking-[0.3em] mt-2 uppercase">
          {status === 'deal_window' ? 'DEAL WINDOW' : status === 'qa' ? 'Q&A' : status === 'pitching' ? 'PITCH' : 'STANDBY'}
        </p>
      </div>

      {/* Bottom: Decision Buttons */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDeal}
            disabled={!isDealWindow || dealLockActive}
            className="h-20 rounded-md font-display text-2xl font-bold tracking-wider bg-deal-green text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            DEAL
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNoDeal}
            disabled={!isDealWindow}
            className="h-20 rounded-md font-display text-2xl font-bold tracking-wider bg-deal-red text-destructive-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            NO DEAL
          </motion.button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!isDealWindow}
            onClick={() => setProjectorMode('negotiate')}
            className="h-14 rounded-md font-display text-lg font-bold tracking-wider bg-deal-yellow text-warning-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            NEGOTIATE
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!isDealWindow}
            className="h-14 rounded-md font-display text-lg font-bold tracking-wider bg-deal-blue text-info-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            MORE INFO
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default JudgePanel;
