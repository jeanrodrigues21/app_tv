import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { iptvApi, IPTVSeries } from '@/lib/iptvApi';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import DoramaCard from '@/components/DoramaCard';
import TVGrid from '@/components/TVGrid';
import { Dorama } from '@/types/database';

const GENRES = ['Romance', 'Comédia', 'Drama', 'Ação', 'Fantasia', 'Histórico', 'Suspense', 'Thriller'];

export default function SearchScreen() {
  const router = useRouter();
  const { isAuthenticated } = useIPTVAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [allSeries, setAllSeries] = useState<IPTVSeries[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<IPTVSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeries();
  }, [isAuthenticated]);

  useEffect(() => {
    filterSeries();
  }, [searchQuery, selectedGenre, allSeries]);

  const loadSeries = async () => {
    if (!isAuthenticated) return;

    try {
      const series = await iptvApi.getSeries();
      setAllSeries(series);
    } catch (error) {
      console.error('Erro ao carregar séries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSeries = () => {
    let filtered = allSeries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.plot?.toLowerCase().includes(query) ||
          s.genre?.toLowerCase().includes(query)
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(s =>
        s.genre?.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    setFilteredSeries(filtered);
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

  const handleDoramaPress = (series: IPTVSeries) => {
    router.push(`/dorama/${series.series_id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <View style={styles.searchContainer}>
          <SearchIcon size={28} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar doramas..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.genresContainer}
        contentContainerStyle={styles.genresContent}
      >
        <Pressable
          style={[styles.genreButton, !selectedGenre && styles.genreButtonActive]}
          onPress={() => setSelectedGenre(null)}
        >
          <Text style={[styles.genreText, !selectedGenre && styles.genreTextActive]}>
            Todos
          </Text>
        </Pressable>
        {GENRES.map(genre => (
          <Pressable
            key={genre}
            style={[styles.genreButton, selectedGenre === genre && styles.genreButtonActive]}
            onPress={() => setSelectedGenre(genre)}
          >
            <Text style={[styles.genreText, selectedGenre === genre && styles.genreTextActive]}>
              {genre}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {filteredSeries.length > 0 ? (
          <TVGrid
            data={filteredSeries}
            renderItem={(series: IPTVSeries) => (
              <DoramaCard
                dorama={convertToDorama(series)}
                onPress={() => handleDoramaPress(series)}
                inMyList={false}
              />
            )}
            numColumns={6}
          />
        ) : (
          <Text style={styles.emptyText}>Nenhum dorama encontrado</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 48,
    paddingTop: 40,
    paddingBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 20,
    height: 64,
    gap: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
  },
  genresContainer: {
    maxHeight: 70,
    marginBottom: 20,
  },
  genresContent: {
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  genreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    marginRight: 16,
    height: 50,
    justifyContent: 'center',
  },
  genreButtonActive: {
    backgroundColor: '#e50914',
  },
  genreText: {
    color: '#999',
    fontSize: 18,
    fontWeight: '600',
  },
  genreTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  emptyText: {
    color: '#999',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 60,
    width: '100%',
  },
});
