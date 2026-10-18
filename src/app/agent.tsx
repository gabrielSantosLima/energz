import { ComingSoon } from '@/components/ui/coming-soon';
import { Screen } from '@/components/ui/screen';
import { useTranslation } from '@/hooks/use-translation';

export default function AgentScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <ComingSoon
        title={t('agent.title')}
        message={t('agent.message')}
        icon={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
      />
    </Screen>
  );
}
