import React, { useRef } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface TVFocusableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  focusedScale?: number;
}

export default function TVFocusable({
  children,
  onPress,
  style,
  focusedScale = 1.1,
}: TVFocusableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleFocus = () => {
    scale.value = withSpring(focusedScale);
  };

  const handleBlur = () => {
    scale.value = withSpring(1);
  };

  if (Platform.isTV) {
    return (
      <Pressable
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[styles.container, style]}
      >
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  animatedContainer: {
    width: '100%',
    height: '100%',
  },
});
