import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SyncModeCard } from '@/components/sync/sync-mode-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/contexts/toast';
import { useSync } from '@/hooks/use-sync';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Mode = 'send' | 'receive';

function CountStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.count}>
      <Text variant="heading" style={{ color }}>
        {value}
      </Text>
      <Text
        variant="caption"
        color="textSecondary"
        numberOfLines={2}
        style={styles.countLabel}>
        {label}
      </Text>
    </View>
  );
}

export default function SyncScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const sync = useSync();
  const [mode, setMode] = useState<Mode | null>(null);

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.lg,
  };

  const chooseMode = (next: Mode) => {
    sync.reset();
    setMode(next);
  };

  const changeMode = () => {
    sync.reset();
    setMode(null);
  };

  const onExport = async () => {
    const sent = await sync.exportData();
    if (sent) {
      toast.show(t('sync.sent'), 'success');
    }
  };

  const onApply = async () => {
    const applied = await sync.apply();
    if (applied) {
      toast.show(t('sync.applied'), 'success');
    }
  };

  const counts = sync.result?.counts ?? sync.preview?.counts;

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
          <Text variant="title">{t('sync.title')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('sync.subtitle')}
          </Text>
        </View>
      </View>

      {sync.error ? (
        <View
          style={[
            styles.errorCard,
            { backgroundColor: colors.surface, borderColor: colors.danger },
          ]}>
          <Text variant="caption" color="danger">
            {sync.error}
          </Text>
        </View>
      ) : null}

      {sync.result && counts ? (
        <>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.doneHeader}>
              <View
                style={[
                  styles.doneIcon,
                  { backgroundColor: `${colors.success}1A` },
                ]}>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={20}
                  tintColor={colors.success}
                />
              </View>
              <View style={styles.doneText}>
                <Text variant="subtitle">{t('sync.doneTitle')}</Text>
                <Text variant="caption" color="textSecondary">
                  {t('sync.doneHint')}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.counts}>
              <CountStat
                label={t('sync.willAdd')}
                value={counts.added}
                color={colors.success}
              />
              <CountStat
                label={t('sync.willUpdate')}
                value={counts.updated}
                color={colors.primary}
              />
              <CountStat
                label={t('sync.willDelete')}
                value={counts.deleted}
                color={colors.danger}
              />
              <CountStat
                label={t('sync.willKeep')}
                value={counts.unchanged}
                color={colors.textSecondary}
              />
            </View>
          </View>

          <Button label={t('sync.done')} onPress={() => router.back()} />
          <Button
            label={t('sync.syncAgain')}
            variant="ghost"
            onPress={() => {
              sync.reset();
              setMode(null);
            }}
          />
        </>
      ) : sync.preview && counts ? (
        <>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.previewHeader}>
              <View style={styles.previewText}>
                <Text variant="subtitle">
                  {t('sync.receivingFrom', {
                    name: sync.preview.sourceDeviceName,
                  })}
                </Text>
                {sync.sourceFileName ? (
                  <Text
                    variant="caption"
                    color="textTertiary"
                    numberOfLines={1}>
                    {sync.sourceFileName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.counts}>
              <CountStat
                label={t('sync.willAdd')}
                value={counts.added}
                color={colors.success}
              />
              <CountStat
                label={t('sync.willUpdate')}
                value={counts.updated}
                color={colors.primary}
              />
              <CountStat
                label={t('sync.willDelete')}
                value={counts.deleted}
                color={colors.danger}
              />
              <CountStat
                label={t('sync.willKeep')}
                value={counts.unchanged}
                color={colors.textSecondary}
              />
            </View>

            <Text variant="caption" color="textTertiary">
              {t('sync.mergeHint')}
            </Text>
          </View>

          <Button
            label={sync.applying ? t('sync.applying') : t('sync.apply')}
            onPress={onApply}
            disabled={sync.applying}
          />
          <Button
            label={t('sync.cancel')}
            variant="ghost"
            onPress={sync.cancelPreview}
            disabled={sync.applying}
          />
        </>
      ) : mode === null ? (
        <>
          <SyncModeCard
            title={t('sync.sendTitle')}
            description={t('sync.sendDescription')}
            icon={{ ios: 'paperplane', android: 'send', web: 'send' }}
            onPress={() => chooseMode('send')}
          />
          <SyncModeCard
            title={t('sync.receiveTitle')}
            description={t('sync.receiveDescription')}
            icon={{
              ios: 'tray.and.arrow.down',
              android: 'download',
              web: 'download',
            }}
            onPress={() => chooseMode('receive')}
          />
          <Text variant="caption" color="textTertiary" style={styles.hint}>
            {t('sync.localOnlyHint')}
          </Text>
        </>
      ) : mode === 'send' ? (
        <>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <TextInput
              label={t('sync.deviceName')}
              value={sync.deviceName}
              onChangeText={sync.setDeviceName}
              maxLength={40}
              autoCorrect={false}
              accessibilityLabel={t('sync.deviceName')}
            />
            <Text variant="caption" color="textSecondary">
              {t('sync.deviceNameHint')}
            </Text>
          </View>

          <Button
            label={sync.exporting ? t('sync.sending') : t('sync.share')}
            onPress={onExport}
            disabled={sync.exporting}
          />

          {sync.exporting ? (
            <ActivityIndicator color={colors.primary} />
          ) : null}

          <Text variant="caption" color="textTertiary" style={styles.hint}>
            {t('sync.shareHint')}
          </Text>

          <Button
            label={t('sync.changeMode')}
            variant="ghost"
            onPress={changeMode}
            disabled={sync.exporting}
          />
        </>
      ) : (
        <>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text variant="body" color="textSecondary">
              {t('sync.receiveDescription')}
            </Text>
          </View>

          <Button
            label={sync.importing ? t('sync.picking') : t('sync.chooseFile')}
            onPress={() => void sync.pickFile()}
            disabled={sync.importing}
          />

          {sync.importing ? (
            <ActivityIndicator color={colors.primary} />
          ) : null}

          <Text variant="caption" color="textTertiary" style={styles.hint}>
            {t('sync.chooseHint')}
          </Text>

          <Button
            label={t('sync.changeMode')}
            variant="ghost"
            onPress={changeMode}
            disabled={sync.importing}
          />
        </>
      )}
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
  errorCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  divider: { height: StyleSheet.hairlineWidth },
  counts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.md,
  },
  count: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countLabel: {
    textAlign: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  previewText: { flex: 1, gap: spacing.xs },
  doneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  doneIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { flex: 1, gap: spacing.xs },
  hint: { textAlign: 'center' },
});
