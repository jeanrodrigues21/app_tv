import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Info, Plus, Check } from 'lucide-react-native';

interface HeroBannerProps {
  dorama: any;
  onPlay: () => void;
  onInfo: () => void;
  onAddToList: () => void;
  inMyList: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HeroBanner({ 
  dorama, 
  onPlay, 
  onInfo, 
  onAddToList, 
  inMyList 
}: HeroBannerProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de fade in ao carregar
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animação contínua de zoom suave (Ken Burns effect)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 20000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação de movimento horizontal (esquerda para direita)
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateXAnim, {
          toValue: -30,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 30,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 15000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação sutil de movimento vertical
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -15,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 15,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Animated.Image
          source={{ 
            uri: dorama.banner_url || dorama.poster_url || 'https://via.placeholder.com/1280x720' 
          }}
          style={[
            styles.bannerImage,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: translateXAnim },
                { translateY: translateYAnim },
              ],
            },
          ]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', '#000']}
          style={styles.gradient}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {dorama.title}
              </Text>
              
              {dorama.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {dorama.description}
                </Text>
              )}
              
              <View style={styles.info}>
                {!!dorama.year && (
                  <Text style={styles.infoText}>{String(dorama.year)}</Text>
                )}

                {typeof dorama.rating === 'number' && !isNaN(dorama.rating) && (
                  <Text style={styles.infoText}>★ {dorama.rating.toFixed(1)}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.buttons}>
              <Pressable style={styles.playButton} onPress={onPlay}>
                <Play size={20} color="#000" fill="#000" />
                <Text style={styles.playButtonText}>Assistir</Text>
              </Pressable>
              <Pressable style={styles.iconButton} onPress={onAddToList}>
                {inMyList ? (
                  <Check size={24} color="#fff" />
                ) : (
                  <Plus size={24} color="#fff" />
                )}
              </Pressable>
              <Pressable style={styles.iconButton} onPress={onInfo}>
                <Info size={24} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 300,
    overflow: 'hidden',
  },
  bannerImage: {
    position: 'absolute',
    width: '115%',
    height: '115%',
    left: '-7.5%',
    top: '-7.5%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  textContainer: {
    width: SCREEN_WIDTH - 40,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  info: {
    flexDirection: 'row',
    gap: 16,
  },
  infoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});