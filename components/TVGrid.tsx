import React from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';

interface TVGridProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  numColumns?: number;
  horizontal?: boolean;
  style?: any;
  contentContainerStyle?: any;
}

export default function TVGrid({
  data,
  renderItem,
  numColumns = 6,
  horizontal = false,
  style,
  contentContainerStyle,
}: TVGridProps) {
  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.horizontalScroll, style]}
        contentContainerStyle={[styles.horizontalContent, contentContainerStyle]}
      >
        {data.map((item, index) => (
          <View key={index} style={styles.horizontalItem}>
            {renderItem(item, index)}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={(item, index) => index.toString()}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      style={style}
      contentContainerStyle={[styles.gridContent, contentContainerStyle]}
      columnWrapperStyle={styles.columnWrapper}
    />
  );
}

const styles = StyleSheet.create({
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalContent: {
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  horizontalItem: {
    marginRight: 20,
  },
  gridContent: {
    paddingHorizontal: 48,
    paddingVertical: 20,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
});
