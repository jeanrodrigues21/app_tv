import React from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { ContinueWatchingItem } from '@/hooks/useContinueWatching';

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
  onRemove: (episodeId: string) => void;
  onPress?: (item: ContinueWatchingItem) => void;
}

export default function ContinueWatchingRow({
  items,
  onRemove,
  onPress,
}: ContinueWatchingRowProps) {
  if (items.length === 0) {
    return null;
  }

  const handlePress = (item: ContinueWatchingItem) => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continue Assistindo</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {items.map(item => (
          <Pressable
            key={item.episodeId}
            style={styles.card}
            onPress={() => handlePress(item)}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.seriesCover }}
                style={styles.image}
                resizeMode="cover"
              />
              
              <View style={styles.overlay}>
                <View style={styles.playIcon}>
                  <Text style={styles.playText}>▶</Text>
                </View>
              </View>

              {item.progress > 0 && item.progress < 95 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${item.progress}%` }]}
                    />
                  </View>
                </View>
              )}

              <Pressable
                style={styles.removeButton}
                onPress={() => onRemove(item.episodeId)}
              >
                <X size={20} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.info}>
              <Text style={styles.seriesName} numberOfLines={1}>
                {item.seriesName}
              </Text>
              <Text style={styles.episodeText} numberOfLines={1}>
                T{item.seasonNumber}E{item.episodeNumber}: {item.episodeTitle}
              </Text>
              <Text style={styles.progressText}>
                {Math.floor(item.progress)}% assistido
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    marginLeft: 4,
  },
  scroll: {
    marginHorizontal: 0,
  },
  card: {
    marginRight: 16,
    marginBottom: 8,
    width: 160,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 8,
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
    borderRadius: 8,
  },
  playIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e50914',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    paddingHorizontal: 4,
  },
  seriesName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  progressText: {
    color: '#e50914',
    fontSize: 11,
    fontWeight: '600',
  },
});