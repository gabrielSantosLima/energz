import { useEffect, useRef, useState } from 'react';
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
  const [layouts, setLayouts] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const targetId = selectedId ?? cycles[cycles.length - 1]?.id;
    if (!targetId || viewportWidth <= 0) {
      return;
    }

    const item = layouts[targetId];
    if (!item) {
      return;
    }

    const maxOffset = Math.max(0, contentWidth - viewportWidth);
    const offset = Math.min(
      maxOffset,
      Math.max(0, item.x + item.width / 2 - viewportWidth / 2),
    );
    scrollRef.current?.scrollTo({ x: offset, animated: false });
  }, [cycles, selectedId, viewportWidth, contentWidth, layouts]);

  if (cycles.length === 0) {
    return null;
  }

  const firstWidth = layouts[cycles[0].id]?.width ?? 0;
  const lastWidth = layouts[cycles[cycles.length - 1].id]?.width ?? 0;
  const resolvedViewport = viewportWidth > 0 ? viewportWidth : 0;
  const paddingLeft = Math.max(
    spacing.lg,
    firstWidth > 0 ? resolvedViewport / 2 - firstWidth / 2 : resolvedViewport / 2,
  );
  const paddingRight = Math.max(
    spacing.lg,
    lastWidth > 0 ? resolvedViewport / 2 - lastWidth / 2 : resolvedViewport / 2,
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onContentSizeChange={(width) => setContentWidth(width)}
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingLeft, paddingRight },
      ]}>
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
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setLayouts((current) => {
                const existing = current[cycle.id];
                if (existing && existing.x === x && existing.width === width) {
                  return current;
                }
                return { ...current, [cycle.id]: { x, width } };
              });
            }}
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
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
