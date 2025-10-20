import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { iptvApi, IPTVSeries } from '@/lib/iptvApi';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import HeroBanner from '@/components/HeroBanner';
import DoramaRow from '@/components/DoramaRow';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';


const ROTATION_INTERVAL = 45000; // 45 segundos (tempo do ciclo completo de animação)

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useIPTVAuth();
  const { items: continueWatchingItems, loading: cwLoading, removeItem, refresh } = useContinueWatching();
  
  const [featuredDorama, setFeaturedDorama] = useState<IPTVSeries | null>(null);
  const [featuredList, setFeaturedList] = useState<IPTVSeries[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allSeries, setAllSeries] = useState<IPTVSeries[]>([]);
  const [trending, setTrending] = useState<IPTVSeries[]>([]);
  const [newReleases, setNewReleases] = useState<IPTVSeries[]>([]);
  const [byGenre, setByGenre] = useState<Map<string, IPTVSeries[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isMountedRef] = useState({ current: true });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !isMountedRef.current) return;

    try {
      setError('');
      const series = await iptvApi.getSeries();

      if (!isMountedRef.current) return;

      setAllSeries(series);

      // Criar lista de séries em destaque (com backdrop)
      const withBackdrop = series.filter(s => s.backdrop_path && s.backdrop_path.length > 0);
      const featured = withBackdrop.length > 0 ? withBackdrop.slice(0, 10) : series.slice(0, 10);
      
      setFeaturedList(featured);
      if (featured.length > 0) {
        setFeaturedDorama(featured[0]);
      }

      setTrending(series.slice(0, 15));

      const sorted = [...series].sort((a, b) => {
        const dateA = a.releaseDate ? parseInt(a.releaseDate) : 0;
        const dateB = b.releaseDate ? parseInt(b.releaseDate) : 0;
        return dateB - dateA;
      });
      setNewReleases(sorted.slice(0, 15));

      const genreMap = new Map<string, IPTVSeries[]>();
      series.forEach(s => {
        if (s.genre) {
          const genres = s.genre.split(',').map(g => g.trim());
          genres.forEach(genre => {
            if (genre) {
              const existing = genreMap.get(genre) || [];
              if (existing.length < 15) {
                existing.push(s);
                genreMap.set(genre, existing);
              }
            }
          });
        }
      });
      setByGenre(genreMap);

    } catch (err: any) {
      console.error('Erro ao carregar séries:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Erro ao carregar catálogo');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Rotação automática do banner em destaque
  useEffect(() => {
    if (featuredList.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredList.length;
        setFeaturedDorama(featuredList[nextIndex]);
        return nextIndex;
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [featuredList]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await refresh();
    setRefreshing(false);
  }, [loadData, refresh]);

  const handleDoramaPress = (dorama: IPTVSeries) => {
    router.push(`/dorama/${dorama.series_id}`);
  };

  const handleContinueWatchingPress = (item: any) => {
    router.push({
      pathname: '/player',
      params: {
        episodeId: item.episodeId,
        seriesId: item.seriesId,
        seasonNumber: item.seasonNumber.toString(),
        episodeNumber: item.episodeNumber.toString(),
        title: item.episodeTitle,
        progress: item.currentTime.toString(),
      },
    });
  };

  const convertToDorama = (series: IPTVSeries) => ({
    id: series.series_id,
    title: series.name,
    description: series.plot || null,
    poster_url: series.cover || null,
    banner_url: Array.isArray(series.backdrop_path)
    ? series.backdrop_path[0]
    : series.backdrop_path || series.cover || null,
    year: series.releaseDate ? parseInt(series.releaseDate) : null,
    country: null,
    rating: series.rating ? parseFloat(series.rating) : null,
    total_episodes: 0,
    status: 'ongoing' as const,
    genres: series.genre ? series.genre.split(',').map(g => g.trim()) : [],
    created_at: '',
    updated_at: '',
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Carregando catálogo...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e50914" />
        }
      >
        {featuredDorama && (
          <HeroBanner
            key={featuredDorama.series_id}
            dorama={convertToDorama(featuredDorama)}
            onPlay={() => handleDoramaPress(featuredDorama)}
            onInfo={() => handleDoramaPress(featuredDorama)}
            onAddToList={() => {}}
            inMyList={false}
          />
        )}

        {!cwLoading && continueWatchingItems.length > 0 && (
          <ContinueWatchingRow 
            items={continueWatchingItems} 
            onRemove={removeItem}
            onPress={handleContinueWatchingPress}
          />
        )}

        <DoramaRow
          title="Em Alta"
          doramas={trending.map(convertToDorama)}
          onDoramaPress={(d) => router.push(`/dorama/${d.id}`)}
          onAddToList={() => {}}
          myListIds={new Set()}
        />

        <DoramaRow
          title="Novos Lançamentos"
          doramas={newReleases.map(convertToDorama)}
          onDoramaPress={(d) => router.push(`/dorama/${d.id}`)}
          onAddToList={() => {}}
          myListIds={new Set()}
        />

        {Array.from(byGenre.entries()).map(([genre, series]) => (
          <DoramaRow
            key={genre}
            title={genre}
            doramas={series.map(convertToDorama)}
            onDoramaPress={(d) => router.push(`/dorama/${d.id}`)}
            onAddToList={() => {}}
            myListIds={new Set()}
          />
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#e50914',
    fontSize: 16,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 24,
  },
});