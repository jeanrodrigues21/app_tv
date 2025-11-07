import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { 
  View, StyleSheet, ActivityIndicator, Text, Pressable, BackHandler, StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { ChevronLeft, Play, Pause, Volume2, VolumeX, RotateCw, RotateCcw } from 'lucide-react-native';
import { iptvApi, IPTVSeriesInfo, IPTVEpisode } from '@/lib/iptvApi';
import { useIPTVAuth } from '@/contexts/IPTVAuthContext';
import { useContinueWatching } from '@/hooks/useContinueWatching';

// ✅ Componente de Vídeo Memoizado (evita re-renders)
const MemoizedVideoView = memo(({ player }: { player: any }) => (
  <VideoView
    player={player}
    style={styles.video}
    allowsPictureInPicture={false}
    nativeControls={false}
    contentFit="contain"
  />
));

// ✅ Componente de Controles Separado (isola re-renders)
const VideoControls = memo(({ 
  showControls,
  title,
  seasonNumber,
  episodeNumber,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  progressPercent,
  onBack,
  onTogglePlay,
  onToggleMute,
  onSeekForward,
  onSeekBackward,
  onProgressBarPress,
  onProgressBarPressIn,
  onProgressBarPressOut,
  progressBarRef,
  seekPreview,
}: any) => {
  if (!showControls) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
                  : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.controls, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}>
      <View style={styles.topControls}>
        <Pressable style={styles.closeButton} onPress={onBack}>
          <ChevronLeft size={32} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <View style={styles.episodeInfo}>
          <Text style={styles.episodeTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.episodeSubtitle}>
            Temporada {seasonNumber} • Episódio {episodeNumber}
          </Text>
        </View>
      </View>

      <View style={styles.centerControls}>
        <Pressable onPress={onSeekBackward} style={styles.seekButton}>
          <RotateCcw size={36} color="#fff" strokeWidth={2} />
          <Text style={styles.seekText}>10</Text>
        </Pressable>

        <Pressable onPress={onTogglePlay} style={styles.playButton}>
          {isPlaying ? (
            <Pause size={60} color="#fff" fill="#fff" strokeWidth={0} />
          ) : (
            <Play size={60} color="#fff" fill="#fff" strokeWidth={0} style={{ marginLeft: 4 }} />
          )}
        </Pressable>

        <Pressable onPress={onSeekForward} style={styles.seekButton}>
          <RotateCw size={36} color="#fff" strokeWidth={2} />
          <Text style={styles.seekText}>10</Text>
        </Pressable>
      </View>

      <View style={styles.bottomControls}>
        <View ref={progressBarRef} style={styles.progressBarContainer}>
          <Pressable
            style={styles.progressBarTouchArea}
            onPress={onProgressBarPress}
            onPressIn={onProgressBarPressIn}
            onPressOut={onProgressBarPressOut}
          >
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              <View style={[styles.progressThumb, { left: `${progressPercent}%` }]} />
              {seekPreview !== null && (
                <View style={[styles.seekIndicator, { left: `${seekPreview}%` }]} />
              )}
            </View>
          </Pressable>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>

          <View style={styles.controlButtons}>
            <Pressable onPress={onToggleMute} style={styles.controlButton}>
              {isMuted ? 
                <VolumeX size={26} color="#fff" strokeWidth={2} /> : 
                <Volume2 size={26} color="#fff" strokeWidth={2} />
              }
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
});

// ✅ Componente de Próximo Episódio Separado
const NextEpisodeCard = memo(({ 
  nextEpisode, 
  countdown, 
  onCancel, 
  onPlayNow 
}: any) => (
  <View style={styles.nextEpisodeOverlay}>
    <View style={styles.nextEpisodeCard}>
      <Text style={styles.nextEpisodeTitle}>Próximo Episódio</Text>
      <Text style={styles.nextEpisodeSubtitle} numberOfLines={2}>
        E{nextEpisode.episode_num}: {nextEpisode.title}
      </Text>
      <Text style={styles.countdownText}>Iniciando em {countdown}s</Text>
      <View style={styles.nextEpisodeButtons}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable style={styles.playNowButton} onPress={onPlayNow}>
          <Play size={18} color="#fff" fill="#fff" strokeWidth={0} />
          <Text style={styles.playNowText}>Assistir Agora</Text>
        </Pressable>
      </View>
    </View>
  </View>
));

export default function PlayerScreen() {
  const { episodeId, seriesId, seasonNumber, episodeNumber, title, progress } = useLocalSearchParams<{
    episodeId: string;
    seriesId: string;
    seasonNumber: string;
    episodeNumber: string;
    title: string;
    progress: string;
  }>();

  const router = useRouter();
  const { credentials } = useIPTVAuth();
  const { addOrUpdateItem } = useContinueWatching();
  
  const [videoUrl, setVideoUrl] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [seriesInfo, setSeriesInfo] = useState<IPTVSeriesInfo | null>(null);
  const [nextEpisode, setNextEpisode] = useState<IPTVEpisode | null>(null);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [screenReady, setScreenReady] = useState(false);

  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const progressBarRef = useRef<View>(null);
  const lastProgressSaveRef = useRef(0);
  const orientationSubscriptionRef = useRef<any>(null);

  const player = useVideoPlayer(videoUrl, (player) => {
    if (!videoUrl) return;
    player.loop = false;
    player.muted = false;
    if (progress && parseInt(progress) > 0) {
      player.currentTime = parseInt(progress);
    }
  });

  // ✅ OTIMIZAÇÃO: requestAnimationFrame ao invés de setInterval
  useEffect(() => {
    if (!player) return;

    let animationFrameId: number;
    let lastUpdateTime = 0;

    const updateProgress = (timestamp: number) => {
      if (!isMountedRef.current) return;

      if (timestamp - lastUpdateTime >= 500) {
        const time = player.currentTime;
        const dur = player.duration;
        
        setCurrentTime(time);
        setDuration(dur);
        setIsPlaying(player.playing);
        setIsMuted(player.muted);

        if (time - lastProgressSaveRef.current >= 10 && seriesInfo) {
          lastProgressSaveRef.current = time;
          addOrUpdateItem(
            seriesId!,
            seriesInfo.info.name,
            seriesInfo.info.cover || '',
            episodeId!,
            title!,
            parseInt(seasonNumber!),
            parseInt(episodeNumber!),
            time,
            dur
          ).catch(err => console.error('Erro ao salvar progresso:', err));
        }

        if (nextEpisode && dur > 0 && (dur - time) <= 30 && !showNextEpisode) {
          setShowNextEpisode(true);
        }

        if (dur > 0 && time >= dur - 1) {
          handleEpisodeComplete();
        }

        lastUpdateTime = timestamp;
      }

      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [player, seriesInfo, nextEpisode, showNextEpisode, episodeId, seriesId, seasonNumber, episodeNumber, title]);

  // ✅ Setup de tela com listener de orientação
  useEffect(() => {
    const setupScreen = async () => {
      try {
        StatusBar.setHidden(true);
        
        orientationSubscriptionRef.current = ScreenOrientation.addOrientationChangeListener(
          ({ orientationInfo }) => {
            if (orientationInfo.orientation >= 3) {
              setScreenReady(true);
            }
          }
        );
        
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        
        // ✅ Esconder navigation bar sem usar setBehaviorAsync
        await NavigationBar.setVisibilityAsync('hidden');
        
        setTimeout(() => setScreenReady(true), 500);
        
      } catch (error) {
        console.warn('Erro ao configurar modo imersivo:', error);
        setScreenReady(true);
      }
    };

    isMountedRef.current = true;
    setupScreen();
    loadVideoUrl();
    loadSeriesInfo();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => {
      backHandler.remove();
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (orientationSubscriptionRef.current) {
        orientationSubscriptionRef.current.remove();
      }
      
      if (isMountedRef.current) {
        ScreenOrientation.unlockAsync().catch(console.warn);
        StatusBar.setHidden(false);
        NavigationBar.setVisibilityAsync('visible').catch(console.warn);
      }
    };
  }, [episodeId]);

  // Auto-play
  useEffect(() => {
    if (!player || !videoUrl || !screenReady) return;
    
    const timer = setTimeout(() => {
      try {
        player.play();
      } catch (err) {
        console.warn('Erro ao iniciar reprodução:', err);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [player, videoUrl, screenReady]);

  // Countdown
  useEffect(() => {
    if (showNextEpisode && countdown > 0) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setCountdown(countdown - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showNextEpisode && countdown === 0) {
      playNextEpisode();
    }
  }, [showNextEpisode, countdown]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowControls(false);
        }
      }, 4000);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [showControls, isPlaying]);

  const loadSeriesInfo = async () => {
    if (!seriesId) return;
    try {
      const info = await iptvApi.getSeriesInfo(seriesId);
      if (!isMountedRef.current) return;
      
      setSeriesInfo(info);

      const currentSeason = parseInt(seasonNumber!);
      const currentEp = parseInt(episodeNumber!);
      const episodes = info.episodes[currentSeason] || [];
      
      const nextEp = episodes.find(ep => ep.episode_num === currentEp + 1);
      if (nextEp) {
        setNextEpisode(nextEp);
      } else {
        const nextSeasonEps = info.episodes[currentSeason + 1];
        if (nextSeasonEps && nextSeasonEps.length > 0) {
          setNextEpisode(nextSeasonEps[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar info da série:', err);
    }
  };

  const loadVideoUrl = () => {
    if (!episodeId) {
      setError('ID do episódio não fornecido');
      setIsLoading(false);
      return;
    }

    try {
      const url = iptvApi.getStreamUrl(episodeId);
      setVideoUrl(url);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vídeo');
      setIsLoading(false);
    }
  };

  const handleEpisodeComplete = async () => {
    if (seriesInfo && credentials && isMountedRef.current) {
      await addOrUpdateItem(
        seriesId!,
        seriesInfo.info.name,
        seriesInfo.info.cover || '',
        episodeId!,
        title!,
        parseInt(seasonNumber!),
        parseInt(episodeNumber!),
        duration,
        duration
      ).catch(err => console.error('Erro ao marcar como completo:', err));
    }
  };

  const playNextEpisode = async () => {
    if (!nextEpisode || !isMountedRef.current) return;

    const nextSeason = nextEpisode.season || parseInt(seasonNumber!);
    
    if (player && duration > 0 && seriesInfo) {
      await addOrUpdateItem(
        seriesId!,
        seriesInfo.info.name,
        seriesInfo.info.cover || '',
        episodeId!,
        title!,
        parseInt(seasonNumber!),
        parseInt(episodeNumber!),
        duration,
        duration
      ).catch(err => console.error('Erro ao salvar progresso:', err));
    }

    if (player) {
      player.pause();
      player.currentTime = 0;
    }
    isMountedRef.current = false;

    router.replace({
      pathname: '/player',
      params: {
        episodeId: nextEpisode.id,
        seriesId: seriesId,
        seasonNumber: nextSeason.toString(),
        episodeNumber: nextEpisode.episode_num.toString(),
        title: nextEpisode.title,
        progress: '0',
      },
    });
  };

  const togglePlayPause = useCallback(() => {
    if (player) {
      player.playing ? player.pause() : player.play();
    }
  }, [player]);

  const toggleMute = useCallback(() => {
    if (player) {
      player.muted = !player.muted;
    }
  }, [player]);

  const seekForward = useCallback(() => {
    if (player) {
      player.currentTime = Math.min(player.currentTime + 10, duration);
    }
  }, [player, duration]);

  const seekBackward = useCallback(() => {
    if (player) {
      player.currentTime = Math.max(player.currentTime - 10, 0);
    }
  }, [player]);

  const seekTo = useCallback((percent: number) => {
    if (player && duration > 0) {
      const clampedPercent = Math.max(0, Math.min(100, percent));
      player.currentTime = (duration * clampedPercent) / 100;
    }
  }, [player, duration]);

  const handleProgressBarPress = useCallback((event: any) => {
    if (!progressBarRef.current || !duration) return;

    progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
      const touchX = event.nativeEvent.pageX - pageX;
      const percent = (touchX / width) * 100;
      seekTo(percent);
      setSeekPreview(null);
    });
  }, [duration, seekTo]);

  const handleProgressBarPressIn = useCallback((event: any) => {
    if (!progressBarRef.current || !duration) return;

    progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
      const touchX = event.nativeEvent.pageX - pageX;
      const percent = Math.max(0, Math.min(100, (touchX / width) * 100));
      setSeekPreview(percent);
    });
  }, [duration]);

  const handleProgressBarPressOut = useCallback(() => {
    setSeekPreview(null);
  }, []);

  const handleBack = useCallback(async () => {
    if (player && duration > 0 && seriesInfo && player.currentTime > 30) {
      const time = player.currentTime;
      await addOrUpdateItem(
        seriesId!,
        seriesInfo.info.name,
        seriesInfo.info.cover || '',
        episodeId!,
        title!,
        parseInt(seasonNumber!),
        parseInt(episodeNumber!),
        time,
        duration
      ).catch(err => console.error('Erro ao salvar progresso final:', err));
    }
    router.back();
  }, [player, duration, seriesInfo, episodeId, seriesId, seasonNumber, episodeNumber, title]);

  const progressPercent = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading || !videoUrl || !screenReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Carregando episódio...</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.container}
      onPress={() => setShowControls(!showControls)}
    >
      <MemoizedVideoView player={player} />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <VideoControls
        showControls={showControls}
        title={title}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        isPlaying={isPlaying}
        isMuted={isMuted}
        currentTime={currentTime}
        duration={duration}
        progressPercent={progressPercent}
        onBack={handleBack}
        onTogglePlay={togglePlayPause}
        onToggleMute={toggleMute}
        onSeekForward={seekForward}
        onSeekBackward={seekBackward}
        onProgressBarPress={handleProgressBarPress}
        onProgressBarPressIn={handleProgressBarPressIn}
        onProgressBarPressOut={handleProgressBarPressOut}
        progressBarRef={progressBarRef}
        seekPreview={seekPreview}
      />

      {showNextEpisode && nextEpisode && (
        <NextEpisodeCard
          nextEpisode={nextEpisode}
          countdown={countdown}
          onCancel={() => setShowNextEpisode(false)}
          onPlayNow={playNextEpisode}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
  video: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: '#fff', 
    fontSize: 16, 
    marginTop: 16,
    fontWeight: '500',
  },
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.7)' 
  },
  errorContainer: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  errorText: { 
    color: '#fff', 
    fontSize: 18, 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  backButton: { 
    backgroundColor: '#e50914', 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 6 
  },
  backButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  controls: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topControls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16,
  },
  episodeInfo: { 
    flex: 1,
    paddingRight: 16,
  },
  episodeTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700',
    marginBottom: 4,
  },
  episodeSubtitle: { 
    color: '#d0d0d0', 
    fontSize: 14,
    fontWeight: '500',
  },
  centerControls: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 60,
    paddingVertical: 40,
  },
  seekButton: { 
    alignItems: 'center', 
    gap: 6,
    width: 70,
    height: 70,
    justifyContent: 'center',
    borderRadius: 35,
  },
  seekText: { 
    color: '#fff', 
    fontSize: 13,
    fontWeight: '600',
  },
  playButton: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomControls: { 
    paddingBottom: 20,
    gap: 12,
  },
  progressBarContainer: { 
    width: '100%',
  },
  progressBarTouchArea: { 
    paddingVertical: 14,
  },
  progressBar: { 
    height: 5, 
    backgroundColor: 'rgba(255, 255, 255, 0.25)', 
    borderRadius: 2.5, 
    overflow: 'visible', 
    position: 'relative',
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#e50914',
    borderRadius: 2.5,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#e50914',
    marginLeft: -7.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  seekIndicator: { 
    position: 'absolute', 
    top: -6, 
    width: 17, 
    height: 17, 
    borderRadius: 8.5, 
    backgroundColor: '#fff',
    marginLeft: -8.5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 4, 
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e50914',
  },
  controlRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  timeText: { 
    color: '#fff', 
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controlButtons: { 
    flexDirection: 'row', 
    gap: 12,
  },
  controlButton: { 
    padding: 10,
    borderRadius: 24,
  },
  nextEpisodeOverlay: { 
    position: 'absolute', 
    bottom: 80, 
    right: 20, 
    left: 20, 
    alignItems: 'flex-end',
  },
  nextEpisodeCard: { 
    backgroundColor: 'rgba(20, 20, 20, 0.95)', 
    borderRadius: 12, 
    padding: 20, 
    maxWidth: 420, 
    borderWidth: 2, 
    borderColor: '#e50914',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nextEpisodeTitle: { 
    color: '#fff', 
    fontSize: 17, 
    fontWeight: '700', 
    marginBottom: 6,
  },
  nextEpisodeSubtitle: { 
    color: '#ccc', 
    fontSize: 15, 
    marginBottom: 10,
    lineHeight: 20,
  },
  countdownText: { 
    color: '#e50914', 
    fontSize: 15, 
    fontWeight: '700', 
    marginBottom: 14,
  },
  nextEpisodeButtons: { 
    flexDirection: 'row', 
    gap: 12,
  },
  cancelButton: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 6, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700',
  },
  playNowButton: { 
    flex: 1, 
    flexDirection: 'row', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 6, 
    backgroundColor: '#e50914', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  playNowText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700',
  },
});