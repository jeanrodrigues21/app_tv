import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { iptvApi, IPTVSeries } from '@/lib/iptvApi';
import DoramaCard from '@/components/DoramaCard';
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
      // Carregar IDs salvos localmente
      const saved = await AsyncStorage.getItem(`${MY_LIST_KEY}_${credentials?.username}`);
      const ids: string[] = saved ? JSON.parse(saved) : [];
      setMyListIds(ids);

      // Buscar dados completos das séries
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

  const handleRemoveFromList = async (series: IPTVSeries) => {
    const newIds = myListIds.filter(id => id !== series.series_id);
    setMyListIds(newIds);
    setDoramas(doramas.filter(d => d.series_id !== series.series_id));
    
    await AsyncStorage.setItem(
      `${MY_LIST_KEY}_${credentials?.username}`, 
      JSON.stringify(newIds)
    );
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
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e50914" />
        }
      >
        {doramas.map(series => (
          <View key={series.series_id} style={styles.gridItem}>
            <DoramaCard
              dorama={convertToDorama(series)}
              onPress={() => handleDoramaPress(series)}
              onAddToList={() => handleRemoveFromList(series)}
              inMyList={true}
            />
          </View>
        ))}
        {doramas.length === 0 && !refreshing && (
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
    padding: 16,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  gridItem: {
    width: '33.33%',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    width: '100%',
    lineHeight: 24,
  },
});