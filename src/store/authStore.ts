import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'shark' | 'team';

export interface AuthUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  isFirstLogin: boolean;
  /** For shark users, maps to a judge id in eventStore */
  judgeId?: string;
  /** For team users, maps to a team id in eventStore */
  teamId?: string;
}

interface AuthState {
  users: AuthUser[];
  currentUser: AuthUser | null;

  login: (username: string, password: string) => AuthUser | null;
  logout: () => void;
  changePassword: (userId: string, newPassword: string) => boolean;
  registerTeam: (teamId: string, teamName: string) => void;
}

// Helper to reverse a string (used for default passwords)
const reverse = (s: string) => s.split('').reverse().join('');

const SEED_USERS: AuthUser[] = [
  // Admin — fixed credentials
  {
    id: 'u-admin',
    username: 'ENEXUS',
    password: 'SHARKTANK',
    role: 'admin',
    displayName: 'Event Admin',
    isFirstLogin: true,
  },
  // Sharks (password = reversed username)
  {
    id: 'u-shark-1',
    username: 'SHARK1',
    password: reverse('SHARK1'),
    role: 'shark',
    displayName: 'Sheik Abdul Rahuman M',
    isFirstLogin: true,
    judgeId: 'j1',
  },
  {
    id: 'u-shark-2',
    username: 'SHARK2',
    password: reverse('SHARK2'),
    role: 'shark',
    displayName: 'Shafqat Ameen Mir',
    isFirstLogin: true,
    judgeId: 'j2',
  },
  // Teams (password = reversed team name)
  {
    id: 'u-team-1',
    username: 'NEXAGEN',
    password: reverse('NEXAGEN'),
    role: 'team',
    displayName: 'Team NEXAGEN',
    isFirstLogin: true,
    teamId: 't1',
  },
  {
    id: 'u-team-2',
    username: 'SOLARVAULT',
    password: reverse('SOLARVAULT'),
    role: 'team',
    displayName: 'Team SOLARVAULT',
    isFirstLogin: true,
    teamId: 't2',
  },
  {
    id: 'u-team-3',
    username: 'FEEDLOOP',
    password: reverse('FEEDLOOP'),
    role: 'team',
    displayName: 'Team FEEDLOOP',
    isFirstLogin: true,
    teamId: 't3',
  },
  {
    id: 'u-team-4',
    username: 'CRYOSHIFT',
    password: reverse('CRYOSHIFT'),
    role: 'team',
    displayName: 'Team CRYOSHIFT',
    isFirstLogin: true,
    teamId: 't4',
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: SEED_USERS,
      currentUser: null,

      login: (username: string, password: string) => {
        const user = get().users.find(
          (u) => u.username.toUpperCase() === username.toUpperCase() && u.password === password,
        );
        if (!user) return null;
        set({ currentUser: user });
        return user;
      },

      logout: () => set({ currentUser: null }),

      changePassword: (userId: string, newPassword: string) => {
        const state = get();
        const user = state.users.find((u) => u.id === userId);
        if (!user) return false;

        const updatedUsers = state.users.map((u) =>
          u.id === userId ? { ...u, password: newPassword, isFirstLogin: false } : u,
        );
        const updatedCurrent =
          state.currentUser?.id === userId
            ? { ...state.currentUser, password: newPassword, isFirstLogin: false }
            : state.currentUser;

        set({ users: updatedUsers, currentUser: updatedCurrent });
      },

      registerTeam: (teamId: string, teamName: string) => {
        const username = teamName.replace(/\s+/g, '').toUpperCase();
        const password = reverse(username);
        const newUser: AuthUser = {
          id: `u-team-${Date.now()}`,
          username,
          password,
          role: 'team',
          displayName: `Team ${teamName}`,
          isFirstLogin: true,
          teamId,
        };
        set((state) => ({ users: [...state.users, newUser] }));
      },
    }),
    {
      name: 'dealmaker-auth-storage',
    }
  ));
