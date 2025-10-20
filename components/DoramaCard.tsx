import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, Platform } from 'react-native';
import { Play, Plus, Check } from 'lucide-react-native';
import { Dorama } from '@/types/database';

interface DoramaCardProps {
  dorama: Dorama;
  onPress: () => void;
  onAddToList?: () => void;
  inMyList?: boolean;
  showProgress?: boolean;
  progress?: number;
  landscape?: boolean;
}

export default function DoramaCard({
  dorama,
  onPress,
  onAddToList,
  inMyList,
  showProgress,
  progress,
  landscape,
}: DoramaCardProps) {
  const imageUri = dorama.poster_url || 'https://via.placeholder.com/300x450';
  
  return (
    <Pressable
      style={({ pressed }) => [
        landscape ? styles.landscapeCard : styles.card,
        pressed && Platform.OS !== 'web' && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={landscape ? styles.landscapeContainer : styles.container}>
        <Image
          source={{ uri: imageUri }}
          style={landscape ? styles.landscapeImage : styles.image}
          resizeMode="cover"
        />
        
        {showProgress && progress !== undefined && progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
        
        <View style={styles.overlay}>
          <View style={styles.playButton}>
            <Play size={24} color="#fff" fill="#fff" />
          </View>
          {onAddToList && (
            <Pressable
              style={styles.listButton}
              onPress={(e) => {
                e.stopPropagation();
                onAddToList();
              }}
            >
              {inMyList ? (
                <Check size={20} color="#fff" />
              ) : (
                <Plus size={20} color="#fff" />
              )}
            </Pressable>
          )}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 12,
  },
  landscapeCard: {
    width: 240,
    marginRight: 12,
  },
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  landscapeContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    aspectRatio: 16 / 9,
  },
  image: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: '#1a1a1a',
  },
  landscapeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    opacity: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  genres: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});