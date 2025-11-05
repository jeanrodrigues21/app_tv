import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface TVFocusableCardProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  focusedScale?: number;
  focused?: boolean;
}

export default function TVFocusableCard({
  children,
  onPress,
  style,
  focusedScale = 1.08,
  focused = false,
}: TVFocusableCardProps) {
  const [isFocused, setIsFocused] = useState(focused);
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    return {
      opacity: borderOpacity.value,
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(focusedScale, {
      damping: 15,
      stiffness: 150,
    });
    borderOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    borderOpacity.value = withTiming(0, { duration: 200 });
  };

  return (
    <Pressable
      onPress={onPress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[styles.container, style]}
      hasTVPreferredFocus={focused}
    >
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        {children}
        <Animated.View style={[styles.focusBorder, borderStyle]} />
      </Animated.View>
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
    position: 'relative',
  },
  focusBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 4,
    borderColor: '#e50914',
    borderRadius: 12,
    pointerEvents: 'none',
  },
});
