import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type ToastVariant = 'success' | 'error' | 'info';

type ToastAction = {
  label: string;
  onPress: () => void;
};

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
};

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, SymbolViewProps['name']> = {
  success: {
    ios: 'checkmark.circle.fill',
    android: 'check_circle',
    web: 'check_circle',
  },
  error: {
    ios: 'exclamationmark.circle.fill',
    android: 'error',
    web: 'error',
  },
  info: {
    ios: 'info.circle.fill',
    android: 'info',
    web: 'info',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(
      () => setToast(null),
      toast.action ? 5000 : 2600,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      action?: ToastAction,
    ) => {
      setToast({ id: Date.now(), message, variant, action });
    },
    [],
  );

  const tint = toast
    ? toast.variant === 'success'
      ? colors.success
      : toast.variant === 'error'
        ? colors.danger
        : colors.primary
    : colors.primary;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(150)}
          pointerEvents={toast.action ? 'auto' : 'none'}
          style={[styles.wrapper, { top: insets.top + spacing.sm }]}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <SymbolView name={ICONS[toast.variant]} size={20} tintColor={tint} />
            <Text variant="bodyStrong" style={styles.message}>
              {toast.message}
            </Text>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.action?.onPress();
                  setToast(null);
                }}>
                <Text variant="label" color="primary">
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 520,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  message: {
    flex: 1,
  },
});
