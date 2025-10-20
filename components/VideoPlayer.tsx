import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react-native';
import { Episode, UserPreferences } from '@/types/database';

interface VideoPlayerProps {
  episode: Episode;
  preferences: UserPreferences;
  initialProgress?: number;
  onProgressUpdate: (seconds: number) => void;
  onComplete: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export default function VideoPlayer({
  episode,
  preferences,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
  onNextEpisode,
  hasNextEpisode,
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Criar o player de vídeo
  const player = useVideoPlayer(episode.video_url, (player) => {
    player.loop = false;
    player.muted = false;
    player.play();
  });

  // Configurar position inicial
  useEffect(() => {
    if (player && initialProgress > 0) {
      player.currentTime = initialProgress;
    }
  }, [initialProgress]);

  // Listener para status do player
  useEffect(() => {
    if (!player) return;

    const statusListener = player.addListener('statusChange', (status) => {
      setIsLoading(!status.isPlaying && status.isBuffering);
      
      if (status.error) {
        console.error('Video error:', status.error);
      }
    });

    const playingListener = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        setIsLoading(false);
      }
    });

    return () => {
      statusListener.remove();
      playingListener.remove();
    };
  }, [player]);

  // Listener para progresso e tempo
  useEffect(() => {
    if (!player) return;

    const timeUpdateInterval = setInterval(() => {
      const time = player.currentTime;
      const dur = player.duration;
      
      setCurrentTime(time);
      setDuration(dur);

      if (time > 0) {
        const currentSeconds = Math.floor(time);
        onProgressUpdate(currentSeconds);

        // Auto skip intro
        if (preferences.auto_skip_intro && episode.intro_start && episode.intro_end) {
          if (currentSeconds >= episode.intro_start && currentSeconds < episode.intro_end) {
            setShowSkipIntro(true);
          } else {
            setShowSkipIntro(false);
          }
        }

        // Auto skip outro
        if (preferences.auto_skip_outro && episode.outro_start) {
          if (currentSeconds >= episode.outro_start) {
            setShowSkipOutro(true);
          } else {
            setShowSkipOutro(false);
          }
        }

        // Verificar se terminou
        if (dur > 0 && time >= dur - 1) {
          onComplete();
          if (preferences.auto_play_next && hasNextEpisode && onNextEpisode) {
            setTimeout(() => {
              onNextEpisode();
            }, 2000);
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(timeUpdateInterval);
    };
  }, [player, preferences, episode, onProgressUpdate, onComplete, hasNextEpisode, onNextEpisode]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && player?.playing) {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [showControls, player?.playing]);

  const togglePlayPause = () => {
    if (player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      player.muted = !player.muted;
    }
  };

  const skipIntro = () => {
    if (player && episode.intro_end) {
      player.currentTime = episode.intro_end;
      setShowSkipIntro(false);
    }
  };

  const skipToNext = () => {
    if (onNextEpisode) {
      onNextEpisode();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => setShowControls(!showControls)}
    >
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {showControls && (
        <View style={styles.controls}>
          <View style={styles.topControls}>
            <Text style={styles.episodeTitle}>
              Ep {episode.episode_number}: {episode.title}
            </Text>
          </View>

          <View style={styles.centerControls}>
            <Pressable onPress={togglePlayPause} style={styles.playButton}>
              {player?.playing ? (
                <Pause size={48} color="#fff" fill="#fff" />
              ) : (
                <Play size={48} color="#fff" fill="#fff" />
              )}
            </Pressable>
          </View>

          <View style={styles.bottomControls}>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>

            <View style={styles.controlButtons}>
              <Pressable onPress={toggleMute} style={styles.controlButton}>
                {player?.muted ? (
                  <VolumeX size={24} color="#fff" />
                ) : (
                  <Volume2 size={24} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showSkipIntro && (
        <Pressable style={styles.skipButton} onPress={skipIntro}>
          <Text style={styles.skipText}>Pular Introdução</Text>
        </Pressable>
      )}

      {showSkipOutro && hasNextEpisode && (
        <Pressable style={styles.skipButton} onPress={skipToNext}>
          <SkipForward size={20} color="#fff" />
          <Text style={styles.skipText}>Próximo Episódio</Text>
        </Pressable>
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
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topControls: {
    padding: 16,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
  skipButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    gap: 8,
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});