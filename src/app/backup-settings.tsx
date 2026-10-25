import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useToast } from '@/contexts/toast';
import { useDatabaseBackup } from '@/hooks/use-database-backup';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatBytes, formatDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

export default function BackupSettingsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    settings,
    databaseBytes,
    backups,
    saving,
    progress,
    setAutoBackup,
    backupNow,
  } = useDatabaseBackup();
  const [pending, setPending] = useState(false);

  const enabled = settings?.autoBackupEnabled ?? false;
  const lastBackup = backups[0]?.modifiedAt
    ? new Date(backups[0].modifiedAt)
    : null;

  const onToggle = async (value: boolean) => {
    setPending(true);
    try {
      const result = await setAutoBackup(value);
      if (value && !result.notificationGranted) {
        Alert.alert(
          t('backup.permissionTitle'),
          t('backup.permissionMessage'),
        );
      }
    } finally {
      setPending(false);
    }
  };

  const onBackupNow = async () => {
    try {
      await backupNow();
      toast.show(t('backup.completed'), 'success');
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    }
  };

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.lg,
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, padding]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={colors.textPrimary}
          />
        </Pressable>
        <View style={styles.headerText}>
          <Text variant="title">{t('backup.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('backup.subtitle')}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text variant="caption" color="textTertiary">
              {t('backup.databaseSize')}
            </Text>
            <Text variant="heading">{formatBytes(databaseBytes, locale)}</Text>
          </View>
          <View style={[styles.stat, styles.alignEnd]}>
            <Text variant="caption" color="textTertiary">
              {t('backup.versions')}
            </Text>
            <Text variant="heading">
              {t('backup.versionsValue', { count: backups.length })}
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statsRow}>
          <Text variant="caption" color="textSecondary">
            {t('backup.lastBackup')}
          </Text>
          <Text variant="caption">
            {lastBackup ? formatDate(lastBackup, locale) : t('backup.never')}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text variant="bodyStrong">{t('backup.auto')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('backup.autoDescription')}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            disabled={saving || pending}
          />
        </View>
      </View>

      {progress !== null ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text variant="caption" color="textSecondary">
              {t('backup.inProgress')}
            </Text>
            <Text variant="caption" color="textSecondary">
              {`${Math.round(progress * 100)}%`}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.max(2, progress * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      <Button
        label={t('backup.backupNow')}
        onPress={onBackupNow}
        disabled={saving}
      />

      <Text variant="caption" color="textTertiary" style={styles.hint}>
        {t('backup.hint')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: spacing.xs },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stat: { gap: spacing.xs },
  alignEnd: { alignItems: 'flex-end' },
  divider: { height: StyleSheet.hairlineWidth },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleInfo: { flex: 1, gap: spacing.xs },
  progressBlock: { gap: spacing.xs },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: radius.pill,
  },
  hint: { textAlign: 'center' },
});
