import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import type { Cycle } from '@/domain/entities/cycle';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

type Props = {
  cycles: Cycle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CycleSelector({ cycles, selectedId, onSelect }: Props) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  if (cycles.length === 0) {
    return null;
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      style={styles.scroll}
      contentContainerStyle={styles.content}>
      {cycles.map((cycle, index) => {
        const active = cycle.id === selectedId;
        const label = cycle.closed
          ? t('cycles.tag', {
              n: index + 1,
              date: formatShortDate(cycle.end.measuredAt, locale),
            })
          : t('cycles.currentChip');

        return (
          <Pressable
            key={cycle.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(cycle.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surfaceMuted,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}>
            <Text
              variant="label"
              style={{ color: active ? colors.onPrimary : colors.textSecondary }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
