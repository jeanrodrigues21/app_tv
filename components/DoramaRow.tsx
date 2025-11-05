import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dorama } from '@/types/database';
import DoramaCard from './DoramaCard';
import TVGrid from './TVGrid';

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
  if (doramas.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TVGrid
        data={doramas}
        renderItem={(dorama: Dorama, index: number) => (
          <DoramaCard
            dorama={dorama}
            onPress={() => onDoramaPress(dorama)}
            inMyList={myListIds?.has(dorama.id)}
            showProgress={!!watchProgress}
            progress={watchProgress?.get(dorama.id)}
            focused={index === 0}
          />
        )}
        horizontal
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    paddingHorizontal: 48,
  },
});
