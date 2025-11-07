import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Dorama } from '@/types/database';
import DoramaCard from './DoramaCard';

interface DoramaRowProps {
  title: string;
  doramas: Dorama[];
  onDoramaPress: (dorama: Dorama) => void;
  onAddToList?: (dorama: Dorama) => void;
  myListIds?: Set<string>;
  watchProgress?: Map<string, number>;
  landscape?: boolean;
}

export default function DoramaRow({
  title,
  doramas,
  onDoramaPress,
  myListIds,
  watchProgress,
}: DoramaRowProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (doramas.length === 0) return null;

  const handleCardFocus = (index: number) => {
    setFocusedIndex(index);
    const cardWidth = 260;
    const gap = 20;
    const offset = Math.max(0, (index * (cardWidth + gap)) - 100);

    scrollViewRef.current?.scrollTo({
      x: offset,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {doramas.map((dorama, index) => (
          <View key={dorama.id} style={styles.cardWrapper}>
            <DoramaCard
              dorama={dorama}
              onPress={() => onDoramaPress(dorama)}
              inMyList={myListIds?.has(dorama.id)}
              showProgress={!!watchProgress}
              progress={watchProgress?.get(dorama.id)}
              focused={focusedIndex === index}
              onFocus={() => handleCardFocus(index)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 60,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    paddingHorizontal: 48,
  },
  scrollContent: {
    paddingHorizontal: 48,
    paddingRight: 100,
    alignItems: 'center',
  },
  cardWrapper: {
    marginRight: 20,
    justifyContent: 'center',
  },
});
