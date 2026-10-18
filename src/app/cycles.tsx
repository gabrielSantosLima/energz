import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { useTranslation } from '@/hooks/use-translation';

export default function CyclesScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder title={t('cycles.title')} message={t('cycles.placeholder')} />
    </Screen>
  );
}
