import { create } from 'zustand';
import type { MarketAsset, MacroSentimentData } from '../types/market.types';

interface MarketState {
  assets: MarketAsset[];
  macroData: MacroSentimentData | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  setAssets: (assets: MarketAsset[]) => void;
  setMacroData: (data: MacroSentimentData) => void;
  setIsLoading: (v: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (ts: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  assets: [],
  macroData: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
  setAssets: (assets) => set({ assets }),
  setMacroData: (macroData) => set({ macroData }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (error) => set({ error }),
  setLastUpdated: (ts) => set({ lastUpdated: ts }),
}));
