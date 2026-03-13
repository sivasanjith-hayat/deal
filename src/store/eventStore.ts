import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Judge {
  id: string;
  name: string;
  balance: number;
  totalInvestment: number;
  totalDeals: number;
  isOnline: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members?: string;
  logoUrl?: string;
}

export interface Deal {
  id: string;
  teamId: string;
  judgeId: string;
  amount: number;
  timestamp: number;
}

export interface JudgeNote {
  id: string;
  judgeId: string;
  teamId: string;
  text: string;
  timestamp: number;
}

export interface EventLog {
  id: string;
  action: string;
  detail?: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export type EventStatus = 'waiting' | 'pitching' | 'deal_window' | 'paused' | 'ended';
export type ProjectorMode = 'waiting' | 'countdown' | 'deal' | 'no_deal' | 'war_room';

export interface EventState {
  // Event
  status: EventStatus;
  projectorMode: ProjectorMode;

  // Teams
  teams: Team[];
  currentTeamIndex: number;

  // Judges
  judges: Judge[];

  // Deals
  deals: Deal[];

  // Notes
  judgeNotes: JudgeNote[];

  // Event Log
  eventLog: EventLog[];

  // Notifications (for judges)
  notifications: Notification[];

  // Timers
  pitchDuration: number;
  dealWindowDuration: number;
  timerSeconds: number;
  timerRunning: boolean;

  // Settings
  minInvestment: number;
  maxInvestment: number;
  multiInvestorMode: boolean;

  // Last deal for projector
  lastDeal: { judgeName: string; amount: number; teamName: string } | null;

  // Status before pause
  statusBeforePause: EventStatus | null;

  // Actions
  setStatus: (status: EventStatus) => void;
  setProjectorMode: (mode: ProjectorMode) => void;
  setTimerSeconds: (seconds: number) => void;
  setTimerRunning: (running: boolean) => void;
  addTeam: (team: Team) => void;
  removeTeam: (id: string) => void;
  updateTeam: (id: string, updates: Partial<Omit<Team, 'id'>>) => void;
  reorderTeams: (fromIndex: number, toIndex: number) => void;
  setCurrentTeamIndex: (index: number) => void;
  nextTeam: () => void;
  setNextTeam: (teamId: string) => void;
  selectTeam: (index: number) => void;

  // Judge management
  addJudge: (judge: Judge) => void;
  removeJudge: (id: string) => void;
  updateJudge: (id: string, updates: Partial<Omit<Judge, 'id'>>) => void;
  toggleJudgeOnline: (id: string) => void;

  makeDeal: (judgeId: string, amount: number) => Deal | null;
  noDeal: (judgeId: string) => void;
  setLastDeal: (deal: { judgeName: string; amount: number; teamName: string } | null) => void;
  adjustCredits: (judgeId: string, amount: number) => void;
  resetEvent: () => void;

  // Notes
  addJudgeNote: (judgeId: string, teamId: string, text: string) => void;

  // Event log
  logEvent: (action: string, detail?: string) => void;

  // Notifications
  pushNotification: (message: string, type: Notification['type']) => void;
  clearNotifications: () => void;

  // End
  endEvent: () => void;

  // Emergency overrides
  forceDeal: (judgeId: string, teamId: string, amount: number) => void;
  cancelDeal: (dealId: string) => void;
  reopenDealWindow: () => void;

  // Settings
  setMinInvestment: (amount: number) => void;
  setMaxInvestment: (amount: number) => void;
  setMultiInvestorMode: (enabled: boolean) => void;
  setPitchDuration: (seconds: number) => void;
  setDealWindowDuration: (seconds: number) => void;
}

// default participants for the war‑room – only two sharks currently
const DEFAULT_JUDGES: Judge[] = [
  {
    id: 'j1',
    name: 'Sheik Abdul Rahuman M (Founder, BROSKIESHUB LLP)',
    balance: 10000,
    totalInvestment: 0,
    totalDeals: 0,
    isOnline: true,
  },
  {
    id: 'j2',
    name: 'Shafqat Ameen Mir (Founder, BROSKIESHUB LLP / Co‑Founder Retro Tech Pvt Ltd)',
    balance: 10000,
    totalInvestment: 0,
    totalDeals: 0,
    isOnline: true,
  },
];

const DEFAULT_TEAMS: Team[] = [
  { id: 't1', name: 'NEXAGEN', description: 'AI-powered drug discovery platform', members: 'Alice S., Bob R.' },
  { id: 't2', name: 'SOLARVAULT', description: 'Decentralized solar energy storage', members: 'Charlie D.' },
  { id: 't3', name: 'FEEDLOOP', description: 'Autonomous vertical farming systems', members: 'Eve E., Frank W.' },
  { id: 't4', name: 'CRYOSHIFT', description: 'Cold-chain logistics optimization', members: 'Grace T.' },
];

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      status: 'waiting',
      projectorMode: 'waiting',
      teams: DEFAULT_TEAMS,
      currentTeamIndex: 0,
      judges: DEFAULT_JUDGES,
      deals: [],
      judgeNotes: [],
      eventLog: [],
      notifications: [],
      pitchDuration: 300,
      dealWindowDuration: 20,
      timerSeconds: 0,
      timerRunning: false,
      minInvestment: 500,
      maxInvestment: 5000,
      multiInvestorMode: true,
      lastDeal: null,
      statusBeforePause: null,

      setStatus: (status) => set({ status }),
      setProjectorMode: (mode) => set({ projectorMode: mode }),
      setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),
      setTimerRunning: (running) => set({ timerRunning: running }),

      addTeam: (team) => set((s) => ({ teams: [...s.teams, team] })),
      removeTeam: (id) => set((s) => ({ teams: s.teams.filter(t => t.id !== id) })),
      updateTeam: (id, updates) => set((s) => ({
        teams: s.teams.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      reorderTeams: (fromIndex, toIndex) => set((s) => {
        const newTeams = [...s.teams];
        const [moved] = newTeams.splice(fromIndex, 1);
        newTeams.splice(toIndex, 0, moved);
        return { teams: newTeams };
      }),

      // judge management
      addJudge: (judge) => set((s) => ({ judges: [...s.judges, judge] })),
      removeJudge: (id) => set((s) => ({ judges: s.judges.filter(j => j.id !== id) })),
      updateJudge: (id, updates) => set((s) => ({
        judges: s.judges.map(j => j.id === id ? { ...j, ...updates } : j),
      })),
      toggleJudgeOnline: (id) => set((s) => ({
        judges: s.judges.map(j => j.id === id ? { ...j, isOnline: !j.isOnline } : j),
      })),

      setCurrentTeamIndex: (index) => set({ currentTeamIndex: index }),
      nextTeam: () => set((s) => ({
        currentTeamIndex: Math.min(s.currentTeamIndex + 1, s.teams.length - 1),
        status: 'pitching',
        timerSeconds: s.pitchDuration,
        timerRunning: true,
      })),

      setNextTeam: (teamId) => set((s) => {
        const teamIndex = s.teams.findIndex(t => t.id === teamId);
        if (teamIndex === -1 || teamIndex === s.currentTeamIndex) return s;

        const newTeams = [...s.teams];
        const [moved] = newTeams.splice(teamIndex, 1);
        const insertAt = s.currentTeamIndex + 1;
        newTeams.splice(insertAt, 0, moved);

        return {
          teams: newTeams,
          eventLog: [...s.eventLog, {
            id: `e${Date.now()}`,
            action: 'SET_NEXT_TEAM',
            detail: moved.name,
            timestamp: Date.now(),
          }],
        };
      }),

      selectTeam: (index: number) => set((s) => ({
        currentTeamIndex: Math.min(index, s.teams.length - 1),
        status: 'pitching',
        timerSeconds: s.pitchDuration,
        timerRunning: true,
        projectorMode: 'countdown',
        eventLog: [...s.eventLog, {
          id: `e${Date.now()}`,
          action: 'SELECT_TEAM',
          detail: s.teams[index]?.name,
          timestamp: Date.now(),
        }],
      })),

      makeDeal: (judgeId, amount) => {
        const state = get();
        const judge = state.judges.find(j => j.id === judgeId);
        const team = state.teams[state.currentTeamIndex];
        if (!judge || !team || judge.balance < amount) return null;
        if (amount < state.minInvestment || amount > state.maxInvestment) return null;

        // Single investor mode check
        if (!state.multiInvestorMode) {
          const existingDeal = state.deals.find(d => d.teamId === team.id);
          if (existingDeal) return null;
        }

        const deal: Deal = {
          id: `d${Date.now()}`,
          teamId: team.id,
          judgeId,
          amount,
          timestamp: Date.now(),
        };

        set((s) => ({
          deals: [...s.deals, deal],
          judges: s.judges.map(j => j.id === judgeId ? {
            ...j,
            balance: j.balance - amount,
            totalInvestment: j.totalInvestment + amount,
            totalDeals: j.totalDeals + 1,
          } : j),
          lastDeal: { judgeName: judge.name, amount, teamName: team.name },
          projectorMode: 'deal' as ProjectorMode,
          eventLog: [...s.eventLog, {
            id: `e${Date.now()}`,
            action: 'DEAL',
            detail: `${judge.name} → ${team.name}: ${amount}`,
            timestamp: Date.now(),
          }],
          notifications: [...s.notifications, {
            id: `n${Date.now()}`,
            message: `${judge.name} invested ${amount} in ${team.name}`,
            type: 'success',
            timestamp: Date.now(),
          }],
        }));

        return deal;
      },

      noDeal: (_judgeId) => {
        const state = get();
        const judge = state.judges.find(j => j.id === _judgeId);
        set((s) => ({
          projectorMode: 'no_deal',
          eventLog: [...s.eventLog, {
            id: `e${Date.now()}`,
            action: 'NO_DEAL',
            detail: judge?.name,
            timestamp: Date.now(),
          }],
        }));
      },

      setLastDeal: (deal) => set({ lastDeal: deal }),

      adjustCredits: (judgeId, amount) => set((s) => ({
        judges: s.judges.map(j => j.id === judgeId ? { ...j, balance: j.balance + amount } : j),
        eventLog: [...s.eventLog, {
          id: `e${Date.now()}`,
          action: 'CREDIT_ADJUST',
          detail: `${s.judges.find(j => j.id === judgeId)?.name}: ${amount > 0 ? '+' : ''}${amount}`,
          timestamp: Date.now(),
        }],
      })),

      resetEvent: () => set({
        status: 'waiting',
        projectorMode: 'waiting',
        currentTeamIndex: 0,
        deals: [],
        timerSeconds: 0,
        timerRunning: false,
        judges: DEFAULT_JUDGES,
        lastDeal: null,
        judgeNotes: [],
        eventLog: [],
        notifications: [],
        statusBeforePause: null,
      }),

      // Notes
      addJudgeNote: (judgeId, teamId, text) => set((s) => ({
        judgeNotes: [...s.judgeNotes, {
          id: `note${Date.now()}`,
          judgeId,
          teamId,
          text,
          timestamp: Date.now(),
        }],
      })),

      // Event log
      logEvent: (action, detail) => set((s) => ({
        eventLog: [...s.eventLog, {
          id: `e${Date.now()}`,
          action,
          detail,
          timestamp: Date.now(),
        }],
      })),

      // Notifications
      pushNotification: (message, type) => set((s) => ({
        notifications: [...s.notifications, {
          id: `n${Date.now()}`,
          message,
          type,
          timestamp: Date.now(),
        }],
      })),
      clearNotifications: () => set({ notifications: [] }),

      // End
      endEvent: () => set((s) => ({
        status: 'ended',
        timerRunning: false,
        projectorMode: 'war_room',
        eventLog: [...s.eventLog, { id: `e${Date.now()}`, action: 'END', timestamp: Date.now() }],
      })),

      // Emergency overrides
      forceDeal: (judgeId, teamId, amount) => {
        const state = get();
        const judge = state.judges.find(j => j.id === judgeId);
        const team = state.teams.find(t => t.id === teamId);
        if (!judge || !team) return;

        const deal: Deal = {
          id: `d${Date.now()}`,
          teamId,
          judgeId,
          amount,
          timestamp: Date.now(),
        };

        set((s) => ({
          deals: [...s.deals, deal],
          judges: s.judges.map(j => j.id === judgeId ? {
            ...j,
            balance: j.balance - amount,
            totalInvestment: j.totalInvestment + amount,
            totalDeals: j.totalDeals + 1,
          } : j),
          lastDeal: { judgeName: judge.name, amount, teamName: team.name },
          projectorMode: 'deal' as ProjectorMode,
          eventLog: [...s.eventLog, {
            id: `e${Date.now()}`,
            action: 'FORCE_DEAL',
            detail: `${judge.name} → ${team.name}: ${amount}`,
            timestamp: Date.now(),
          }],
        }));
      },

      cancelDeal: (dealId) => {
        const state = get();
        const deal = state.deals.find(d => d.id === dealId);
        if (!deal) return;

        set((s) => ({
          deals: s.deals.filter(d => d.id !== dealId),
          judges: s.judges.map(j => j.id === deal.judgeId ? {
            ...j,
            balance: j.balance + deal.amount,
            totalInvestment: j.totalInvestment - deal.amount,
            totalDeals: j.totalDeals - 1,
          } : j),
          eventLog: [...s.eventLog, {
            id: `e${Date.now()}`,
            action: 'CANCEL_DEAL',
            detail: `Deal ${dealId} reversed`,
            timestamp: Date.now(),
          }],
        }));
      },

      reopenDealWindow: () => set((s) => ({
        status: 'deal_window',
        timerSeconds: s.dealWindowDuration,
        timerRunning: true,
        projectorMode: 'countdown',
        eventLog: [...s.eventLog, {
          id: `e${Date.now()}`,
          action: 'REOPEN_DEAL',
          timestamp: Date.now(),
        }],
      })),

      // Settings
      setMinInvestment: (amount) => set({ minInvestment: amount }),
      setMaxInvestment: (amount) => set({ maxInvestment: amount }),
      setMultiInvestorMode: (enabled) => set({ multiInvestorMode: enabled }),
      setPitchDuration: (seconds) => set({ pitchDuration: seconds }),
      setDealWindowDuration: (seconds) => set({ dealWindowDuration: seconds }),
    }),
    {
      name: 'dealmaker-event-storage',
    }
  ));
