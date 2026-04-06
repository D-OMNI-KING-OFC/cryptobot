import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Risk Management
  minConfidenceThreshold: number;
  maxSlPercent: number;
  minRR: number;
  
  // Analysis Parameters
  enableFundingRatePenalty: boolean;
  fundingRatePenaltyThreshold: number;
  enableTokenUnlockWarning: boolean;
  tokenUnlockDaysThreshold: number;
  enableCHOCHRequirement: boolean;
  enableFearGreedPenalty: boolean;
  
  // Data Configuration
  defaultWatchlist: string[];
  dataRefreshInterval: number;
  
  // Setters
  setMinConfidenceThreshold: (v: number) => void;
  setMaxSlPercent: (v: number) => void;
  setMinRR: (v: number) => void;
  setEnableFundingRatePenalty: (v: boolean) => void;
  setFundingRatePenaltyThreshold: (v: number) => void;
  setEnableTokenUnlockWarning: (v: boolean) => void;
  setTokenUnlockDaysThreshold: (v: number) => void;
  setEnableCHOCHRequirement: (v: boolean) => void;
  setEnableFearGreedPenalty: (v: boolean) => void;
  setDefaultWatchlist: (v: string[]) => void;
  setDataRefreshInterval: (v: number) => void;
  resetToDefaults: () => void;
}

const DEFAULT_STATE = {
  minConfidenceThreshold: 55,
  maxSlPercent: 8,
  minRR: 2,
  enableFundingRatePenalty: true,
  fundingRatePenaltyThreshold: 0.1,
  enableTokenUnlockWarning: true,
  tokenUnlockDaysThreshold: 7,
  enableCHOCHRequirement: true,
  enableFearGreedPenalty: true,
  defaultWatchlist: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'],
  dataRefreshInterval: 60000,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setMinConfidenceThreshold: (v) => set({ minConfidenceThreshold: v }),
      setMaxSlPercent: (v) => set({ maxSlPercent: v }),
      setMinRR: (v) => set({ minRR: v }),
      setEnableFundingRatePenalty: (v) => set({ enableFundingRatePenalty: v }),
      setFundingRatePenaltyThreshold: (v) => set({ fundingRatePenaltyThreshold: v }),
      setEnableTokenUnlockWarning: (v) => set({ enableTokenUnlockWarning: v }),
      setTokenUnlockDaysThreshold: (v) => set({ tokenUnlockDaysThreshold: v }),
      setEnableCHOCHRequirement: (v) => set({ enableCHOCHRequirement: v }),
      setEnableFearGreedPenalty: (v) => set({ enableFearGreedPenalty: v }),
      setDefaultWatchlist: (v) => set({ defaultWatchlist: v }),
      setDataRefreshInterval: (v) => set({ dataRefreshInterval: v }),
      resetToDefaults: () => set(DEFAULT_STATE),
    }),
    { name: 'cryptobot-settings' }
  )
);
