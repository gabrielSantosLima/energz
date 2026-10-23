import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/contexts/toast';
import {
  AGENT_MODEL_OPTIONS,
  DEFAULT_AGENT_PROVIDER_NAME,
  type AgentModel,
  type AgentSettings,
} from '@/domain/entities/agent-settings';
import { useAgentSettings } from '@/hooks/use-agent-settings';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type FormProps = {
  initialSettings: AgentSettings | null;
  onSave: (settings: AgentSettings) => Promise<AgentSettings>;
};

function AgentSettingsForm({ initialSettings, onSave }: FormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [providerName, setProviderName] = useState(
    initialSettings?.providerName ?? DEFAULT_AGENT_PROVIDER_NAME,
  );
  const [apiKey, setApiKey] = useState(initialSettings?.apiKey ?? '');
  const [model, setModel] = useState<AgentModel>(
    initialSettings?.model ?? AGENT_MODEL_OPTIONS[0].value,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmedProvider = providerName.trim();
    const trimmedKey = apiKey.trim();

    if (!trimmedProvider || !trimmedKey) {
      setError(t('agentSettings.required'));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({
        providerName: trimmedProvider,
        apiKey: trimmedKey,
        model,
      });
      toast.show(t('agentSettings.saved'), 'success');
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.lg,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, padding]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.surfaceMuted }]}>
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'arrow_back',
                web: 'arrow_back',
              }}
              size={20}
              tintColor={colors.textPrimary}
            />
          </Pressable>
          <View style={styles.headerText}>
            <Text variant="title">{t('agentSettings.title')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('agentSettings.subtitle')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.notice,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
          ]}>
          <Text variant="caption" color="textSecondary">
            {t('agentSettings.notice')}
          </Text>
        </View>

        <TextInput
          label={t('agentSettings.providerName')}
          value={providerName}
          onChangeText={setProviderName}
          placeholder={DEFAULT_AGENT_PROVIDER_NAME}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <TextInput
          label={t('agentSettings.apiKey')}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={t('agentSettings.apiKeyPlaceholder')}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.field}>
          <Text variant="label" color="textSecondary">
            {t('agentSettings.model')}
          </Text>
          <Select options={AGENT_MODEL_OPTIONS} value={model} onChange={setModel} />
        </View>

        {error ? (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label={t('agentSettings.save')}
          onPress={submit}
          disabled={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function AgentSettingsScreen() {
  const { settings, save } = useAgentSettings();

  return (
    <AgentSettingsForm
      key={settings?.apiKey ?? 'unconfigured'}
      initialSettings={settings}
      onSave={save}
    />
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
  notice: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  field: { gap: spacing.xs },
});
