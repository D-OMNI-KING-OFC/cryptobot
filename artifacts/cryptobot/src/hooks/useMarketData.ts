import { useQuery } from '@tanstack/react-query';
import { fetchTop20Assets, fetchSingleAssetPrice, fetchOHLCV, fetchFundingRate, fetchOpenInterest } from '../api/marketData';
import { fetchMacroSentiment } from '../api/sentiment';
import { useMarketStore } from '../store/useMarketStore';
import { useEffect } from 'react';

export function useMarketOverview() {
  const { setAssets, setMacroData, setIsLoading, setError, setLastUpdated } = useMarketStore();

  const assetsQuery = useQuery({
    queryKey: ['market-assets'],
    queryFn: fetchTop20Assets,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const macroQuery = useQuery({
    queryKey: ['macro-sentiment'],
    queryFn: () => fetchMacroSentiment('BTC'),
    refetchInterval: 300000,
    staleTime: 60000,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (assetsQuery.data) {
      setAssets(assetsQuery.data);
      setLastUpdated(new Date().toISOString());
    }
  }, [assetsQuery.data, setAssets, setLastUpdated]);

  useEffect(() => {
    if (macroQuery.data) setMacroData(macroQuery.data);
  }, [macroQuery.data, setMacroData]);

  useEffect(() => {
    setIsLoading(assetsQuery.isLoading || macroQuery.isLoading);
  }, [assetsQuery.isLoading, macroQuery.isLoading, setIsLoading]);

  useEffect(() => {
    const err = assetsQuery.error || macroQuery.error;
    setError(err ? (err as Error).message : null);
  }, [assetsQuery.error, macroQuery.error, setError]);

  return { assetsQuery, macroQuery };
}

export function useSingleAsset(pair: string) {
  return useQuery({
    queryKey: ['asset-price', pair],
    queryFn: () => fetchSingleAssetPrice(pair),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useOHLCV(pair: string, timeframe: string) {
  return useQuery({
    queryKey: ['ohlcv', pair, timeframe],
    queryFn: () => fetchOHLCV(pair, timeframe, 200),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useFundingRate(pair: string) {
  return useQuery<number | null>({
    queryKey: ['funding-rate', pair],
    queryFn: () => fetchFundingRate(pair),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useOpenInterest(pair: string) {
  return useQuery({
    queryKey: ['open-interest', pair],
    queryFn: () => fetchOpenInterest(pair),
    refetchInterval: 300000,
    staleTime: 240000,
  });
}
