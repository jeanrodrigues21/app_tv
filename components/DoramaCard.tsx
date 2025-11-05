import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import { Dorama } from '@/types/database';
import TVFocusableCard from './TVFocusableCard';

interface DoramaCardProps {
  dorama: Dorama;
  onPress: () => void;
  onAddToList?: () => void;
  inMyList?: boolean;
  showProgress?: boolean;
  progress?: number;
  landscape?: boolean;
  focused?: boolean;
}

export default function DoramaCard({
  dorama,
  onPress,
  showProgress,
  progress,
  focused = false,
}: DoramaCardProps) {
  const imageUri = dorama.poster_url || 'https://via.placeholder.com/300x450';

  return (
    <TVFocusableCard onPress={onPress} style={styles.card} focused={focused}>
      <View style={styles.container}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />

        {showProgress && progress !== undefined && progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.playButton}>
            <Play size={32} color="#fff" fill="#fff" />
          </View>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {dorama.title}
      </Text>
      {dorama.genres && dorama.genres.length > 0 && (
        <Text style={styles.genres} numberOfLines={1}>
          {dorama.genres.join(' • ')}
        </Text>
      )}
    </TVFocusableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    marginRight: 0,
  },
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  genres: {
    color: '#999',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
