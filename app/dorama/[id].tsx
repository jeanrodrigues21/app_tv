import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Plus, Check, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iptvApi, IPTVSeriesInfo, IPTVEpisode } from '@/lib/iptvApi';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { useContinueWatching, ContinueWatchingItem } from '@/hooks/useContinueWatching';
import ResumeDialog from '@/components/ResumeDialog';

const MY_LIST_KEY = '@doramaflix:my_list';

export default function DoramaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { credentials } = useIPTVAuth();
  const { items: continueWatchingItems } = useContinueWatching();
  
  const [seriesInfo, setSeriesInfo] = useState<IPTVSeriesInfo | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [inMyList, setInMyList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeData, setResumeData] = useState<ContinueWatchingItem | null>(null);
  const [isMountedRef] = useState({ current: true });

  useEffect(() => {
    isMountedRef.current = true;
    loadSeriesDetails();
    checkMyList();

    return () => {
      isMountedRef.current = false;
    };
  }, [id]);

  const loadSeriesDetails = async () => {
    if (!id) return;

    try {
      const data = await iptvApi.getSeriesInfo(id);
      
      if (!isMountedRef.current) return;
      
      setSeriesInfo(data);
      
      if (data.seasons && data.seasons.length > 0) {
        setSelectedSeason(data.seasons[0].season_number);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const checkMyList = async () => {
    if (!credentials || !id) return;

    try {
      const saved = await AsyncStorage.getItem(`${MY_LIST_KEY}_${credentials.username}`);
      if (saved && isMountedRef.current) {
        const ids: string[] = JSON.parse(saved);
        setInMyList(ids.includes(id));
      }
    } catch (error) {
      console.error('Erro ao verificar lista:', error);
    }
  };

  const handleAddToList = async () => {
    if (!credentials || !id) return;

    try {
      const saved = await AsyncStorage.getItem(`${MY_LIST_KEY}_${credentials.username}`);
      let ids: string[] = saved ? JSON.parse(saved) : [];

      if (inMyList) {
        ids = ids.filter(seriesId => seriesId !== id);
        setInMyList(false);
      } else {
        ids.push(id);
        setInMyList(true);
      }

      await AsyncStorage.setItem(`${MY_LIST_KEY}_${credentials.username}`, JSON.stringify(ids));
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
    }
  };

  const handlePlayButton = () => {
    const savedProgress = continueWatchingItems.find(item => item.seriesId === id);
    
    if (savedProgress && savedProgress.progress > 5 && savedProgress.progress < 95) {
      setResumeData(savedProgress);
      setShowResumeDialog(true);
    } else {
      const firstEpisode = seriesInfo?.episodes[selectedSeason]?.[0];
      if (firstEpisode) {
        playEpisode(firstEpisode, 0);
      }
    }
  };

  const handleResumeFromDialog = () => {
    if (resumeData) {
      setShowResumeDialog(false);
      playEpisode(
        {
          id: resumeData.episodeId,
          episode_num: resumeData.episodeNumber,
          title: resumeData.episodeTitle,
          container_extension: 'm3u8',
          season: resumeData.seasonNumber,
        },
        resumeData.currentTime
      );
    }
  };

  const handleRestartFromDialog = () => {
    if (resumeData) {
      setShowResumeDialog(false);
      playEpisode(
        {
          id: resumeData.episodeId,
          episode_num: resumeData.episodeNumber,
          title: resumeData.episodeTitle,
          container_extension: 'm3u8',
          season: resumeData.seasonNumber,
        },
        0
      );
    }
  };

  const handleEpisodePress = (episode: IPTVEpisode) => {
    const savedProgress = continueWatchingItems.find(item => item.episodeId === episode.id);
    
    if (savedProgress && savedProgress.progress > 5 && savedProgress.progress < 95) {
      setResumeData(savedProgress);
      setShowResumeDialog(true);
    } else {
      playEpisode(episode, 0);
    }
  };

  const playEpisode = (episode: IPTVEpisode, startTime: number = 0) => {
    router.push({
      pathname: '/player',
      params: {
        episodeId: episode.id,
        seriesId: id,
        seasonNumber: (episode.season || selectedSeason).toString(),
        episodeNumber: episode.episode_num.toString(),
        title: episode.title,
        progress: startTime.toString(),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (!seriesInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Série não encontrada</Text>
      </View>
    );
  }

  const info = seriesInfo.info;
  const currentSeasonEpisodes = seriesInfo.episodes[selectedSeason] || [];

  const getEpisodeProgress = (episodeId: string): number => {
    const item = continueWatchingItems.find(i => i.episodeId === episodeId);
    return item?.progress || 0;
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <ImageBackground
          source={{ uri: info.backdrop_path?.[0] || info.cover || '' }}
          style={styles.banner}
          resizeMode="cover"
        >
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000']} style={styles.gradient}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
            <View style={styles.bannerContent}>
              <Text style={styles.title}>{info.name}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.actions}>
            <Pressable style={styles.playButton} onPress={handlePlayButton}>
              <Play size={20} color="#000" fill="#000" />
              <Text style={styles.playText}>
                {continueWatchingItems.find(i => i.seriesId === id) ? 'Continuar' : 'Assistir'}
              </Text>
            </Pressable>
            <Pressable style={styles.listButton} onPress={handleAddToList}>
              {inMyList ? <Check size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
              <Text style={styles.listButtonText}>{inMyList ? 'Na lista' : 'Minha lista'}</Text>
            </Pressable>
          </View>

          <View style={styles.info}>
            <View style={styles.infoRow}>
              {info.releaseDate && <Text style={styles.infoText}>{info.releaseDate}</Text>}
              {seriesInfo.seasons.length > 0 && (
                <Text style={styles.infoText}>{seriesInfo.seasons.length} Temporadas</Text>
              )}
              {info.rating && <Text style={styles.infoText}>★ {info.rating}</Text>}
            </View>
            {info.genre && <Text style={styles.genres}>{info.genre}</Text>}
          </View>

          {info.plot && (
            <View style={styles.description}>
              <Text style={styles.descriptionText}>{info.plot}</Text>
            </View>
          )}

          {info.cast && (
            <View style={styles.description}>
              <Text style={styles.label}>Elenco:</Text>
              <Text style={styles.descriptionText}>{info.cast}</Text>
            </View>
          )}

          <View style={styles.seasonsSection}>
            <Text style={styles.sectionTitle}>Temporadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonButtons}>
              {seriesInfo.seasons.map(season => (
                <Pressable
                  key={season.season_number}
                  style={[
                    styles.seasonButton,
                    selectedSeason === season.season_number && styles.seasonButtonActive,
                  ]}
                  onPress={() => setSelectedSeason(season.season_number)}
                >
                  <Text
                    style={[
                      styles.seasonButtonText,
                      selectedSeason === season.season_number && styles.seasonButtonTextActive,
                    ]}
                  >
                    Temporada {season.season_number}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>Episódios</Text>
            {currentSeasonEpisodes.map(episode => {
              const progress = getEpisodeProgress(episode.id);

              return (
                <Pressable
                  key={episode.id}
                  style={styles.episodeItem}
                  onPress={() => handleEpisodePress(episode)}
                >
                  <View style={styles.episodeNumber}>
                    <Text style={styles.episodeNumberText}>{episode.episode_num}</Text>
                  </View>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle}>{episode.title}</Text>
                    {episode.info?.duration && (
                      <Text style={styles.episodeDuration}>{episode.info.duration}</Text>
                    )}
                    {progress > 0 && (
                      <View style={styles.episodeProgress}>
                        <View style={[styles.episodeProgressFill, { width: `${progress}%` }]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.episodePlayIcon}>
                    <Play size={20} color="#fff" />
                  </View>
                </Pressable>
              );
            })}
            {currentSeasonEpisodes.length === 0 && (
              <Text style={styles.emptyText}>Nenhum episódio disponível nesta temporada</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {resumeData && (
        <ResumeDialog
          visible={showResumeDialog}
          episodeNumber={resumeData.episodeNumber}
          seasonNumber={resumeData.seasonNumber}
          episodeTitle={resumeData.episodeTitle}
          progress={resumeData.progress}
          onResume={handleResumeFromDialog}
          onRestart={handleRestartFromDialog}
          onCancel={() => setShowResumeDialog(false)}
        />
      )}
    </>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  banner: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 400,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bannerContent: {
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 4,
    gap: 8,
  },
  playText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    gap: 8,
  },
  listButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  genres: {
    color: '#999',
    fontSize: 14,
  },
  description: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  seasonsSection: {
    marginBottom: 16,
  },
  seasonButtons: {
    marginTop: 8,
  },
  seasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 8,
  },
  seasonButtonActive: {
    backgroundColor: '#e50914',
  },
  seasonButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  seasonButtonTextActive: {
    color: '#fff',
  },
  episodesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  episodeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeDuration: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  episodeProgress: {
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  episodeProgressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  episodePlayIcon: {
    marginLeft: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});