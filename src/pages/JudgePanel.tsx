import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { DealLockOverlay } from '@/components/DealLockOverlay';
import { useNavigate } from 'react-router-dom';

const JudgePanel = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const logout = useAuthStore(s => s.logout);

  const {
    judges, teams, currentTeamIndex, timerSeconds, status, minInvestment, maxInvestment,
    makeDeal, noDeal, setProjectorMode, addJudgeNote, notifications,
  } = useEventStore();

  const [adminSelectedJudgeId, setAdminSelectedJudgeId] = useState<string | null>(null);

  // Auto-select judge based on logged-in shark user, or allow admin to view and select
  const isViewAdmin = currentUser?.role === 'admin';
  const effectiveJudgeId = isViewAdmin ? (adminSelectedJudgeId || judges[0]?.id) : (currentUser?.judgeId || null);
  const judgeId = effectiveJudgeId;
  const judge = judgeId ? judges.find(j => j.id === judgeId) : null;

  const [dealLockActive, setDealLockActive] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const currentTeam = teams[currentTeamIndex];
  const allDeals = useEventStore(s => s.deals);
  const allNotes = useEventStore(s => s.judgeNotes);
  const deals = allDeals.filter(d => d.judgeId === judgeId);
  const myNotes = allNotes.filter(n => n.judgeId === judgeId);

  const investmentOptions = [minInvestment, 1000, 2000, maxInvestment].filter(
    (v, i, a) => a.indexOf(v) === i && v >= minInvestment && v <= maxInvestment
  ).sort((a, b) => a - b);

  // Watch for new notifications
  const notifCount = notifications.length;
  useEffect(() => {
    if (notifCount > 0) {
      const latest = notifications[notifCount - 1];
      setNotification(latest.message);
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notifCount]);

  const handleDeal = useCallback(() => {
    setDealLockActive(true);
  }, []);

  const handleConfirmDeal = useCallback((amount: number) => {
    if (!judgeId) return;
    makeDeal(judgeId, amount);
    setTimeout(() => setDealLockActive(false), 1500);
  }, [makeDeal, judgeId]);

  const handleNoDeal = useCallback(() => {
    if (!judgeId) return;
    noDeal(judgeId);
  }, [noDeal, judgeId]);

  const handleSaveNote = useCallback(() => {
    if (!judgeId || !currentTeam || !noteText.trim()) return;
    addJudgeNote(judgeId, currentTeam.id, noteText.trim());
    setNoteText('');
  }, [judgeId, currentTeam, noteText, addJudgeNote]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDealWindow = status === 'deal_window';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // If no judge found for this user, show an error state
  if (!judge) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center px-4">
        <h1 className="font-display text-3xl font-bold text-foreground tracking-wider mb-4">NO SEAT ASSIGNED</h1>
        <p className="text-sm text-muted-foreground mb-6">Your account is not linked to a judge seat.</p>
        <button
          onClick={handleLogout}
          className="px-6 py-2 rounded-md bg-deal-red font-mono text-sm text-destructive-foreground tracking-wider"
        >
          LOGOUT
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-40 p-3 bg-deal-green text-primary-foreground text-center font-mono text-sm tracking-wider"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deal Lock Overlay */}
      <AnimatePresence>
        {dealLockActive && (
          <DealLockOverlay
            options={investmentOptions}
            maxAmount={judge.balance}
            onConfirm={handleConfirmDeal}
            onCancel={() => setDealLockActive(false)}
          />
        )}
      </AnimatePresence>

      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <button
            onClick={isViewAdmin ? () => window.close() : handleLogout}
            className="text-[10px] text-muted-foreground tracking-widest hover:text-foreground transition-colors"
          >
            {isViewAdmin ? '← CLOSE VIEW' : '← LOGOUT'}
          </button>

          {isViewAdmin ? (
            <div className="mt-1 flex items-center gap-2">
              <select
                value={judgeId || ''}
                onChange={(e) => setAdminSelectedJudgeId(e.target.value)}
                className="bg-transparent text-lg font-display text-deal-yellow outline-none uppercase tracking-wider appearance-none cursor-pointer"
              >
                {judges.map(j => (
                  <option key={j.id} value={j.id} className="bg-background text-foreground font-mono text-sm">
                    {j.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] bg-deal-yellow/20 text-deal-yellow px-1.5 py-0.5 rounded-sm font-mono tracking-widest">
                ADMIN VIEW
              </span>
            </div>
          ) : (
            <p className="font-display text-lg text-foreground mt-1">{judge.name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground tracking-widest">CREDITS</p>
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
          onClick={() => { setShowPortfolio(!showPortfolio); setShowNotes(false); }}
          className={`px-4 py-2 text-[10px] tracking-widest transition-colors border-r border-border ${showPortfolio ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          PORTFOLIO
        </button>
        <button
          onClick={() => { setShowNotes(!showNotes); setShowPortfolio(false); }}
          className={`px-4 py-2 text-[10px] tracking-widest transition-colors ${showNotes ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          NOTES
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

      {/* Notes Dropdown */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {currentTeam && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                    placeholder={`Note about ${currentTeam.name}...`}
                    className="flex-1 bg-secondary border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:border-deal-green/50"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-2 bg-deal-green rounded-sm text-primary-foreground text-[10px] font-mono tracking-wider"
                  >
                    SAVE
                  </button>
                </div>
              )}
              {myNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No notes yet</p>
              ) : (
                [...myNotes].reverse().map(n => {
                  const team = teams.find(t => t.id === n.teamId);
                  return (
                    <div key={n.id} className="p-2 bg-secondary rounded-sm">
                      <p className="text-[10px] text-muted-foreground">{team?.name} · {new Date(n.timestamp).toLocaleTimeString()}</p>
                      <p className="text-xs text-foreground mt-1">{n.text}</p>
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
        {status === 'paused' && (
          <div className="mb-4 px-4 py-1 rounded-sm bg-deal-yellow">
            <span className="font-mono text-[10px] text-warning-foreground tracking-widest">EVENT PAUSED</span>
          </div>
        )}
        {status === 'ended' && (
          <div className="mb-4 px-4 py-1 rounded-sm bg-deal-red">
            <span className="font-mono text-[10px] text-destructive-foreground tracking-widest">EVENT ENDED</span>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground tracking-[0.3em] mb-2">NOW PITCHING</p>
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
          {status === 'deal_window' ? 'DEAL WINDOW' : status === 'pitching' ? 'PITCH' : status === 'paused' ? 'PAUSED' : status === 'ended' ? 'ENDED' : 'STANDBY'}
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
        <div className="grid grid-cols-1 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!isDealWindow}
            onClick={() => setShowNotes(true)}
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
