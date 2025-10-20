import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { iptvApi, IPTVSeries, IPTVSeriesInfo } from '@/lib/iptvApi';

const CONTINUE_WATCHING_KEY = '@doramaflix:continue_watching';
const WATCH_PROGRESS_KEY = '@doramaflix:watch_progress';

export interface ContinueWatchingItem {
  seriesId: string;
  seriesName: string;
  seriesCover: string;
  episodeId: string;
  episodeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  progress: number;
  timestamp: number;
  duration: number;
  currentTime: number;
}

export function useContinueWatching() {
  const { credentials } = useIPTVAuth();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContinueWatching();
  }, [credentials]);

  const loadContinueWatching = async () => {
    if (!credentials) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const key = `${CONTINUE_WATCHING_KEY}_${credentials.username}`;
      const saved = await AsyncStorage.getItem(key);
      
      if (saved) {
        const data: ContinueWatchingItem[] = JSON.parse(saved);
        const sorted = data
          .filter(item => item.progress < 95 && item.progress > 1)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        
        setItems(sorted);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Erro ao carregar continue assistindo:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateItem = useCallback(
    async (
      seriesId: string,
      seriesName: string,
      seriesCover: string,
      episodeId: string,
      episodeTitle: string,
      seasonNumber: number,
      episodeNumber: number,
      currentTime: number,
      duration: number
    ): Promise<void> => {
      if (!credentials) {
        console.warn('Sem credenciais para salvar progresso');
        return;
      }

      try {
        const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
        
        // Não salvar se progresso < 5% (apenas clicou)
        if (progress < 1) {
          return;
        }

        // Não salvar se já completou (>= 95%)
        if (progress >= 95) {
          // Remover do continue watching se estava lá
          const key = `${CONTINUE_WATCHING_KEY}_${credentials.username}`;
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            let data: ContinueWatchingItem[] = JSON.parse(saved);
            data = data.filter(item => item.episodeId !== episodeId);
            await AsyncStorage.setItem(key, JSON.stringify(data));
          }
          return;
        }

        const key = `${CONTINUE_WATCHING_KEY}_${credentials.username}`;
        const saved = await AsyncStorage.getItem(key);
        let data: ContinueWatchingItem[] = saved ? JSON.parse(saved) : [];

        // Remover item antigo do mesmo episódio
        data = data.filter(item => item.episodeId !== episodeId);

        const newItem: ContinueWatchingItem = {
          seriesId,
          seriesName,
          seriesCover,
          episodeId,
          episodeTitle,
          seasonNumber,
          episodeNumber,
          progress,
          timestamp: Date.now(),
          duration,
          currentTime,
        };

        // Adicionar no início
        data.unshift(newItem);

        // Remover duplicatas da mesma série (manter apenas episódio mais recente)
        const seriesMap = new Map<string, ContinueWatchingItem>();
        data.forEach(item => {
          if (!seriesMap.has(item.seriesId)) {
            seriesMap.set(item.seriesId, item);
          }
        });
        data = Array.from(seriesMap.values());

        // Limitar a 10 séries diferentes
        data = data.slice(0, 10);

        await AsyncStorage.setItem(key, JSON.stringify(data));
        
        // Recarregar imediatamente
        await loadContinueWatching();
      } catch (error) {
        console.error('Erro ao atualizar continue assistindo:', error);
      }
    },
    [credentials]
  );

  const removeItem = useCallback(
    async (episodeId: string): Promise<void> => {
      if (!credentials) return;

      try {
        const key = `${CONTINUE_WATCHING_KEY}_${credentials.username}`;
        const saved = await AsyncStorage.getItem(key);
        
        if (saved) {
          let data: ContinueWatchingItem[] = JSON.parse(saved);
          data = data.filter(item => item.episodeId !== episodeId);
          await AsyncStorage.setItem(key, JSON.stringify(data));
          await loadContinueWatching();
        }
      } catch (error) {
        console.error('Erro ao remover item:', error);
      }
    },
    [credentials]
  );

  const clearAll = useCallback(
    async (): Promise<void> => {
      if (!credentials) return;

      try {
        const key = `${CONTINUE_WATCHING_KEY}_${credentials.username}`;
        await AsyncStorage.removeItem(key);
        setItems([]);
      } catch (error) {
        console.error('Erro ao limpar continue assistindo:', error);
      }
    },
    [credentials]
  );

  return {
    items,
    loading,
    addOrUpdateItem,
    removeItem,
    clearAll,
    refresh: loadContinueWatching,
  };
}