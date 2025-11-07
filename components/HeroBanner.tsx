import React, { useEffect, useRef, useState } from 'react';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [focusedButton, setFocusedButton] = useState<string | null>('play');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 30000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 30000,
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
            uri: dorama.banner_url || dorama.poster_url || 'https://via.placeholder.com/1920x1080'
          }}
          style={[
            styles.bannerImage,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', '#000']}
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
              <Text style={styles.title} numberOfLines={3}>
                {dorama.title}
              </Text>

              {dorama.description && (
                <Text style={styles.description} numberOfLines={4}>
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
              <Pressable
                style={[
                  styles.playButton,
                  focusedButton === 'play' && styles.buttonFocused
                ]}
                onPress={onPlay}
                onFocus={() => setFocusedButton('play')}
                onBlur={() => setFocusedButton(null)}
                hasTVPreferredFocus={true}
              >
                <Play size={28} color={focusedButton === 'play' ? '#000' : '#000'} fill="#000" />
                <Text style={styles.playButtonText}>Assistir</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.iconButton,
                  focusedButton === 'list' && styles.buttonFocused
                ]}
                onPress={onAddToList}
                onFocus={() => setFocusedButton('list')}
                onBlur={() => setFocusedButton(null)}
              >
                {inMyList ? (
                  <Check size={32} color="#fff" />
                ) : (
                  <Plus size={32} color="#fff" />
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.iconButton,
                  focusedButton === 'info' && styles.buttonFocused
                ]}
                onPress={onInfo}
                onFocus={() => setFocusedButton('info')}
                onBlur={() => setFocusedButton(null)}
              >
                <Info size={32} color="#fff" />
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
    marginBottom: 40,
  },
  banner: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 400,
    overflow: 'hidden',
  },
  bannerImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 48,
    paddingBottom: 48,
    paddingTop: 60,
  },
  textContainer: {
    marginBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  description: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  info: {
    flexDirection: 'row',
    gap: 24,
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 4,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  playButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 9, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonFocused: {
    backgroundColor: '#e50914',
    elevation: 12,
    shadowOpacity: 0.6,
  },
});
