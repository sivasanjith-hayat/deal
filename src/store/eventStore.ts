import { create } from 'zustand';

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
  logoUrl?: string;
}

export interface Deal {
  id: string;
  teamId: string;
  judgeId: string;
  amount: number;
  timestamp: number;
}

export type EventStatus = 'waiting' | 'pitching' | 'qa' | 'deal_window' | 'paused' | 'ended';
export type ProjectorMode = 'waiting' | 'countdown' | 'deal' | 'no_deal' | 'negotiate';

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
  
  // Timers
  pitchDuration: number;
  qaDuration: number;
  dealWindowDuration: number;
  timerSeconds: number;
  timerRunning: boolean;
  
  // Settings
  minInvestment: number;
  maxInvestment: number;
  multiInvestorMode: boolean;
  
  // Last deal for projector
  lastDeal: { judgeName: string; amount: number; teamName: string } | null;

  // Actions
  setStatus: (status: EventStatus) => void;
  setProjectorMode: (mode: ProjectorMode) => void;
  setTimerSeconds: (seconds: number) => void;
  setTimerRunning: (running: boolean) => void;
  addTeam: (team: Team) => void;
  removeTeam: (id: string) => void;
  setCurrentTeamIndex: (index: number) => void;
  nextTeam: () => void;
  makeDeal: (judgeId: string, amount: number) => Deal | null;
  noDeal: (judgeId: string) => void;
  setLastDeal: (deal: { judgeName: string; amount: number; teamName: string } | null) => void;
  adjustCredits: (judgeId: string, amount: number) => void;
  resetEvent: () => void;
}

const DEFAULT_JUDGES: Judge[] = [
  { id: 'j1', name: 'SHARK 1', balance: 10000, totalInvestment: 0, totalDeals: 0, isOnline: true },
  { id: 'j2', name: 'SHARK 2', balance: 10000, totalInvestment: 0, totalDeals: 0, isOnline: true },
  { id: 'j3', name: 'SHARK 3', balance: 10000, totalInvestment: 0, totalDeals: 0, isOnline: false },
  { id: 'j4', name: 'SHARK 4', balance: 10000, totalInvestment: 0, totalDeals: 0, isOnline: true },
];

const DEFAULT_TEAMS: Team[] = [
  { id: 't1', name: 'NEXAGEN', description: 'AI-powered drug discovery platform' },
  { id: 't2', name: 'SOLARVAULT', description: 'Decentralized solar energy storage' },
  { id: 't3', name: 'FEEDLOOP', description: 'Autonomous vertical farming systems' },
  { id: 't4', name: 'CRYOSHIFT', description: 'Cold-chain logistics optimization' },
];

export const useEventStore = create<EventState>((set, get) => ({
  status: 'waiting',
  projectorMode: 'waiting',
  teams: DEFAULT_TEAMS,
  currentTeamIndex: 0,
  judges: DEFAULT_JUDGES,
  deals: [],
  pitchDuration: 300,
  qaDuration: 180,
  dealWindowDuration: 20,
  timerSeconds: 0,
  timerRunning: false,
  minInvestment: 500,
  maxInvestment: 5000,
  multiInvestorMode: false,
  lastDeal: null,

  setStatus: (status) => set({ status }),
  setProjectorMode: (mode) => set({ projectorMode: mode }),
  setTimerSeconds: (seconds) => set({ timerSeconds: seconds }),
  setTimerRunning: (running) => set({ timerRunning: running }),
  addTeam: (team) => set((s) => ({ teams: [...s.teams, team] })),
  removeTeam: (id) => set((s) => ({ teams: s.teams.filter(t => t.id !== id) })),
  setCurrentTeamIndex: (index) => set({ currentTeamIndex: index }),
  nextTeam: () => set((s) => ({
    currentTeamIndex: Math.min(s.currentTeamIndex + 1, s.teams.length - 1),
    status: 'pitching',
    timerSeconds: s.pitchDuration,
    timerRunning: true,
  })),
  makeDeal: (judgeId, amount) => {
    const state = get();
    const judge = state.judges.find(j => j.id === judgeId);
    const team = state.teams[state.currentTeamIndex];
    if (!judge || !team || judge.balance < amount) return null;

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
    }));

    return deal;
  },
  noDeal: (_judgeId) => {
    set({ projectorMode: 'no_deal' });
  },
  setLastDeal: (deal) => set({ lastDeal: deal }),
  adjustCredits: (judgeId, amount) => set((s) => ({
    judges: s.judges.map(j => j.id === judgeId ? { ...j, balance: j.balance + amount } : j),
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
  }),
}));
