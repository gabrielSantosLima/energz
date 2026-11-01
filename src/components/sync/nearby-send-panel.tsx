import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { SyncProgress } from '@/components/sync/sync-progress';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useNearbySend } from '@/hooks/use-nearby-send';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Props = {
  deviceName: string;
  onActiveChange?: (active: boolean) => void;
};

export function NearbySendPanel({ deviceName, onActiveChange }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const nearby = useNearbySend();

  useEffect(() => {
    onActiveChange?.(nearby.active);
  }, [nearby.active, onActiveChange]);

  useEffect(() => {
    return () => onActiveChange?.(false);
  }, [onActiveChange]);

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

  if (nearby.status === 'idle') {
    return (
      <View style={styles.wrapper}>
        <Button
          label={t('sync.nearby.send')}
          onPress={() => void nearby.start(deviceName)}
        />
        <Text variant="caption" color="textTertiary" style={styles.hint}>
          {t('sync.nearby.hint')}
        </Text>
      </View>
    );
  }

  if (nearby.status === 'starting' || nearby.status === 'waiting') {
    return (
      <View style={styles.wrapper}>
        <View style={cardStyle}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="subtitle">{t('sync.nearby.waiting')}</Text>
          <Text variant="caption" color="textSecondary" style={styles.hint}>
            {t('sync.nearby.hint')}
          </Text>
        </View>
        <Button
          label={t('sync.cancel')}
          variant="ghost"
          onPress={() => void nearby.cancel()}
        />
      </View>
    );
  }

  if (nearby.status === 'invitation' && nearby.peer) {
    return (
      <View style={styles.wrapper}>
        <View style={cardStyle}>
          <Text variant="subtitle">
            {t('sync.nearby.invitation', { name: nearby.peer.name })}
          </Text>
          <Text variant="caption" color="textSecondary">
            {t('sync.nearby.invitationHint')}
          </Text>
        </View>
        <Button
          label={t('sync.nearby.accept')}
          onPress={() => void nearby.accept()}
        />
        <Button
          label={t('sync.nearby.reject')}
          variant="ghost"
          onPress={() => void nearby.reject()}
        />
      </View>
    );
  }

  if (nearby.status === 'connecting' && nearby.peer) {
    return (
      <View style={styles.wrapper}>
        <View style={cardStyle}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="subtitle">
            {t('sync.nearby.connecting', { name: nearby.peer.name })}
          </Text>
        </View>
        <Button
          label={t('sync.cancel')}
          variant="ghost"
          onPress={() => void nearby.cancel()}
        />
      </View>
    );
  }

  if (nearby.status === 'sending') {
    return (
      <View style={styles.wrapper}>
        <View style={cardStyle}>
          <SyncProgress
            label={t('sync.nearby.sending')}
            progress={nearby.progress}
          />
        </View>
        <Button
          label={t('sync.cancel')}
          variant="ghost"
          onPress={() => void nearby.cancel()}
        />
      </View>
    );
  }

  if (nearby.status === 'sent') {
    return (
      <View style={styles.wrapper}>
        <View style={cardStyle}>
          <View style={styles.successRow}>
            <View
              style={[
                styles.successIcon,
                { backgroundColor: `${colors.success}1A` },
              ]}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={20}
                tintColor={colors.success}
              />
            </View>
            <View style={styles.successText}>
              <Text variant="subtitle">{t('sync.nearby.sentTitle')}</Text>
              <Text variant="caption" color="textSecondary">
                {t('sync.nearby.sentHint')}
              </Text>
            </View>
          </View>
        </View>
        <Button
          label={t('sync.syncAgain')}
          onPress={nearby.reset}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.danger },
        ]}>
        <Text variant="caption" color="danger">
          {nearby.error ?? t('sync.nearby.errors.transfer')}
        </Text>
      </View>
      <Button
        label={t('sync.nearby.tryAgain')}
        onPress={() => void nearby.start(deviceName)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  hint: { textAlign: 'center' },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: { flex: 1, gap: spacing.xs },
});
