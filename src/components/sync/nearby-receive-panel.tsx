import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { SyncProgress } from '@/components/sync/sync-progress';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { NearbyPeer } from '@/domain/entities/nearby';
import type { SyncEnvelope } from '@/domain/entities/sync';
import { useNearbyReceive } from '@/hooks/use-nearby-receive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Props = {
  deviceName: string;
  onReceived: (envelope: SyncEnvelope, fileName: string) => void;
  onActiveChange?: (active: boolean) => void;
};

function PeerRow({
  peer,
  onPress,
}: {
  peer: NearbyPeer;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const name = peer.name || peer.id;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('sync.nearby.connectTo', { name })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.peer,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <View
        style={[styles.peerIcon, { backgroundColor: colors.surface }]}>
        <SymbolView
          name={{ ios: 'iphone', android: 'smartphone', web: 'smartphone' }}
          size={18}
          tintColor={colors.primary}
        />
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={styles.peerName}>
        {name}
      </Text>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        tintColor={colors.textTertiary}
      />
    </Pressable>
  );
}

export function NearbyReceivePanel({
  deviceName,
  onReceived,
  onActiveChange,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const nearby = useNearbyReceive({ onReceived });

  useEffect(() => {
    onActiveChange?.(nearby.active);
  }, [nearby.active, onActiveChange]);

  useEffect(() => {
    return () => onActiveChange?.(false);
  }, [onActiveChange]);

  if (nearby.status === 'idle') {
    return (
      <View style={styles.wrapper}>
        <Button
          label={t('sync.nearby.find')}
          onPress={() => void nearby.start(deviceName)}
        />
        <Text variant="caption" color="textTertiary" style={styles.hint}>
          {t('sync.nearby.hint')}
        </Text>
      </View>
    );
  }

  if (
    nearby.status === 'starting' ||
    nearby.status === 'discovering'
  ) {
    return (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.searching}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="subtitle">{t('sync.nearby.searching')}</Text>
          </View>

          {nearby.peers.length > 0 ? (
            <View style={styles.peers}>
              <Text variant="label" color="textSecondary">
                {t('sync.nearby.devices')}
              </Text>
              {nearby.peers.map((peer) => (
                <PeerRow
                  key={peer.id}
                  peer={peer}
                  onPress={() => void nearby.connect(peer.id)}
                />
              ))}
            </View>
          ) : (
            <Text variant="caption" color="textTertiary" style={styles.hint}>
              {t('sync.nearby.noPeers')}
            </Text>
          )}
        </View>

        <Button
          label={t('sync.cancel')}
          variant="ghost"
          onPress={() => void nearby.cancel()}
        />
      </View>
    );
  }

  if (nearby.status === 'connecting' && nearby.selectedPeer) {
    return (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="subtitle">
            {t('sync.nearby.connecting', {
              name: nearby.selectedPeer.name || nearby.selectedPeer.id,
            })}
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

  if (nearby.status === 'receiving') {
    return (
      <View style={styles.wrapper}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <SyncProgress
            label={t('sync.nearby.receiving')}
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
    gap: spacing.md,
  },
  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  peers: { gap: spacing.sm },
  peer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  peerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerName: { flex: 1 },
  hint: { textAlign: 'center' },
});
