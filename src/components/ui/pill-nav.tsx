import { usePathname, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSafeNavigation } from '@/hooks/use-safe-navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { elevation, radius, spacing } from '@/theme';

type PillItem = {
  href: Href;
  labelKey: string;
  icon: SymbolViewProps['name'];
};

const ITEMS: PillItem[] = [
  {
    href: '/',
    labelKey: 'nav.home',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    href: '/measurements',
    labelKey: 'nav.measurements',
    icon: { ios: 'list.bullet', android: 'list', web: 'list' },
  },
  {
    href: '/reports',
    labelKey: 'nav.reports',
    icon: { ios: 'doc.text', android: 'description', web: 'description' },
  },
  {
    href: '/settings',
    labelKey: 'nav.settings',
    icon: { ios: 'gearshape', android: 'settings', web: 'settings' },
  },
];

function isActive(pathname: string, href: Href): boolean {
  const target = href as string;
  return target === '/' ? pathname === '/' : pathname.startsWith(target);
}

export function PillNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useSafeNavigation();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + spacing.lg }]}>
      <View
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isDark ? elevation.dark.elevation1 : elevation.light.elevation2,
        ]}>
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const tint = active ? colors.primary : colors.textTertiary;

          return (
            <Pressable
              key={item.href as string}
              accessibilityRole="button"
              accessibilityLabel={t(item.labelKey)}
              accessibilityState={{ selected: active }}
              onPress={() => navigate(item.href)}
              hitSlop={spacing.sm}
              style={styles.item}>
              <SymbolView name={item.icon} size={24} tintColor={tint} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  item: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
