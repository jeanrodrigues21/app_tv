// components/WebVideoPlayer.tsx - Player HLS para Web
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react-native';

interface WebVideoPlayerProps {
  url: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export default function WebVideoPlayer({
  url,
  initialTime = 0,
  onTimeUpdate,
  onEnded,
  onError,
}: WebVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPlayer = async () => {
      const video = videoRef.current;
      if (!video) return;

      // Verificar se precisa de HLS.js
      if (url.includes('.m3u8')) {
        // Importar HLS.js dinamicamente
        const Hls = (await import('hls.js')).default;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
          });

          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (initialTime > 0) {
              video.currentTime = initialTime;
            }
            video.play().catch(console.error);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  onError?.('Erro de rede ao carregar o vídeo');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  onError?.('Erro de mídia');
                  hls.recoverMediaError();
                  break;
                default:
                  onError?.('Erro fatal ao reproduzir vídeo');
                  hls.destroy();
                  break;
              }
            }
          });

          hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari nativo
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (initialTime > 0) {
              video.currentTime = initialTime;
            }
            video.play().catch(console.error);
          });
        } else {
          onError?.('HLS não suportado neste navegador');
        }
      } else {
        // Vídeo direto (MP4, etc)
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          if (initialTime > 0) {
            video.currentTime = initialTime;
          }
          video.play().catch(console.error);
        });
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const dur = video.duration;
      setCurrentTime(time);
      setDuration(dur);
      onTimeUpdate?.(time, dur);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [showControls, isPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const seekForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.currentTime + 10, duration);
  };

  const seekBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const seekTo = (percent: number) => {
    const video = videoRef.current;
    if (!video || duration === 0) return;
    video.currentTime = (duration * percent) / 100;
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.videoContainer}
        onPress={() => setShowControls(!showControls)}
      >
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
          }}
          playsInline
          controlsList="nodownload"
        />

        {showControls && (
          <View style={styles.controls}>
            <View style={styles.centerControls}>
              <Pressable onPress={seekBackward} style={styles.seekButton}>
                <RotateCcw size={32} color="#fff" />
                <Text style={styles.seekText}>10s</Text>
              </Pressable>

              <Pressable onPress={togglePlayPause} style={styles.playButton}>
                {isPlaying ? (
                  <Pause size={56} color="#fff" fill="#fff" />
                ) : (
                  <Play size={56} color="#fff" fill="#fff" />
                )}
              </Pressable>

              <Pressable onPress={seekForward} style={styles.seekButton}>
                <RotateCw size={32} color="#fff" />
                <Text style={styles.seekText}>10s</Text>
              </Pressable>
            </View>

            <View style={styles.bottomControls}>
              <Pressable
                style={styles.progressBarContainer}
                onPress={(e: any) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = (x / rect.width) * 100;
                  seekTo(percent);
                }}
              >
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              </Pressable>

              <View style={styles.controlRow}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>

                <Pressable onPress={toggleMute} style={styles.controlButton}>
                  {isMuted ? <VolumeX size={24} color="#fff" /> : <Volume2 size={24} color="#fff" />}
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  seekButton: {
    alignItems: 'center',
    gap: 4,
  },
  seekText: {
    color: '#fff',
    fontSize: 12,
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
    gap: 12,
  },
  progressBarContainer: {
    width: '100%',
    paddingVertical: 8,
    cursor: 'pointer',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
  },
  controlButton: {
    padding: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});