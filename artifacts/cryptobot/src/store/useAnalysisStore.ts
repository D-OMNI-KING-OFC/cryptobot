import { create } from 'zustand';
import type { AnalysisOutput } from '../types/signal.types';
import type { AnalysisPhase } from '../types/analysis.types';

interface AnalysisState {
  currentPair: string;
  phase: AnalysisPhase;
  phaseProgress: Record<string, 'pending' | 'running' | 'complete' | 'error'>;
  result: AnalysisOutput | null;
  error: string | null;
  isAnalyzing: boolean;
  setCurrentPair: (pair: string) => void;
  setPhase: (phase: AnalysisPhase) => void;
  setPhaseProgress: (phaseKey: string, status: 'pending' | 'running' | 'complete' | 'error') => void;
  setResult: (result: AnalysisOutput | null) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  resetAnalysis: () => void;
}

const defaultProgress = {
  phase1: 'pending' as const,
  phase2: 'pending' as const,
  phase3: 'pending' as const,
  phase4: 'pending' as const,
  phase5: 'pending' as const,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentPair: 'BTC/USDT',
  phase: 'idle',
  phaseProgress: defaultProgress,
  result: null,
  error: null,
  isAnalyzing: false,
  setCurrentPair: (pair) => set({ currentPair: pair }),
  setPhase: (phase) => set({ phase }),
  setPhaseProgress: (phaseKey, status) =>
    set((state) => ({ phaseProgress: { ...state.phaseProgress, [phaseKey]: status } })),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  resetAnalysis: () => set({
    phase: 'idle',
    phaseProgress: defaultProgress,
    result: null,
    error: null,
    isAnalyzing: false,
  }),
}));
