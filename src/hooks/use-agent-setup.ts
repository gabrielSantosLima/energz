import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAgentSettings } from '@/hooks/use-agent-settings';
import { useSafeNavigation } from '@/hooks/use-safe-navigation';
import { useTranslation } from '@/hooks/use-translation';

export function useAgentSetup(): (onReady: () => void) => void {
  const { t } = useTranslation();
  const { configured, hydrated } = useAgentSettings();
  const navigate = useSafeNavigation();

  return useCallback(
    (onReady: () => void) => {
      if (!hydrated) {
        return;
      }

      if (configured) {
        onReady();
        return;
      }

      Alert.alert(
        t('agentSetup.title'),
        t('agentSetup.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('agentSetup.configure'),
            onPress: () => navigate('/agent-settings'),
          },
        ],
      );
    },
    [configured, hydrated, navigate, t],
  );
}
