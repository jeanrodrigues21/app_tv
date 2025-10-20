import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
  onAddToList,
  myListIds,
  watchProgress,
  landscape,
}: DoramaRowProps) {
  if (doramas.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {doramas.map((dorama) => (
          <DoramaCard
            key={dorama.id}
            dorama={dorama}
            onPress={() => onDoramaPress(dorama)}
            onAddToList={onAddToList ? () => onAddToList(dorama) : undefined}
            inMyList={myListIds?.has(dorama.id)}
            showProgress={!!watchProgress}
            progress={watchProgress?.get(dorama.id)}
            landscape={landscape}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
});
