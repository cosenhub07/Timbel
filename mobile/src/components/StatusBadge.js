import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../theme';

export default function StatusBadge({ status }) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'free':
        return {
          label: 'Vacant',
          bg: colors.freeLight,
          color: colors.free,
          dot: colors.free,
        };
      case 'busy-soon':
        return {
          label: 'Occupied Soon',
          bg: colors.soonLight,
          color: colors.soon,
          dot: colors.soon,
        };
      case 'in-use':
        return {
          label: 'Occupied',
          bg: colors.busyLight,
          color: colors.busy,
          dot: colors.busy,
        };
      case 'concluded':
        return {
          label: 'Concluded',
          bg: 'rgba(99, 91, 255, 0.15)',
          color: colors.primaryHover,
          dot: colors.primary,
        };
      default:
        return {
          label: status || 'Unknown',
          bg: colors.cardSecondary,
          color: colors.textSecondary,
          dot: colors.textMuted,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.color }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

