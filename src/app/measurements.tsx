import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { useTranslation } from '@/hooks/use-translation';

export default function MeasurementsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder title={t('measurements.title')} message={t('measurements.placeholder')} />
    </Screen>
  );
}
