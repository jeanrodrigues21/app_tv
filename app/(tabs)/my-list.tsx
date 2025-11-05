import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { iptvApi, IPTVSeries } from '@/lib/iptvApi';
import DoramaCard from '@/components/DoramaCard';
import TVGrid from '@/components/TVGrid';
import { Dorama } from '@/types/database';

const MY_LIST_KEY = '@doramaflix:my_list';

export default function MyListScreen() {
  const router = useRouter();
  const { credentials, isAuthenticated } = useIPTVAuth();
  const [myListIds, setMyListIds] = useState<string[]>([]);
  const [doramas, setDoramas] = useState<IPTVSeries[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyList();
  }, [isAuthenticated]);

  const loadMyList = async () => {
    if (!isAuthenticated) return;

    try {
      const saved = await AsyncStorage.getItem(`${MY_LIST_KEY}_${credentials?.username}`);
      const ids: string[] = saved ? JSON.parse(saved) : [];
      setMyListIds(ids);

      if (ids.length > 0) {
        const allSeries = await iptvApi.getSeries();
        const mySeries = allSeries.filter(s => ids.includes(s.series_id));
        setDoramas(mySeries);
      } else {
        setDoramas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar minha lista:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyList();
    setRefreshing(false);
  };

  const handleDoramaPress = (series: IPTVSeries) => {
    router.push(`/dorama/${series.series_id}`);
  };

  const convertToDorama = (series: IPTVSeries): Dorama => ({
    id: series.series_id,
    title: series.name,
    description: series.plot || null,
    poster_url: series.cover || null,
    banner_url: series.backdrop_path?.[0] || series.cover || null,
    year: series.releaseDate ? parseInt(series.releaseDate) : null,
    country: null,
    rating: series.rating ? parseFloat(series.rating) : null,
    total_episodes: 0,
    status: 'ongoing',
    genres: series.genre ? [series.genre] : [],
    created_at: '',
    updated_at: '',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Lista</Text>
        <Text style={styles.subtitle}>{doramas.length} doramas salvos</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e50914" />
        }
      >
        {doramas.length > 0 ? (
          <TVGrid
            data={doramas}
            renderItem={(series: IPTVSeries) => (
              <DoramaCard
                dorama={convertToDorama(series)}
                onPress={() => handleDoramaPress(series)}
                inMyList={true}
              />
            )}
            numColumns={6}
          />
        ) : (
          <Text style={styles.emptyText}>
            Sua lista está vazia.{'\n'}Adicione doramas à sua lista para assistir depois.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 48,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  emptyText: {
    color: '#999',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 32,
  },
});
