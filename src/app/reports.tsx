import { Placeholder } from '@/components/ui/placeholder';
import { Screen } from '@/components/ui/screen';
import { useTranslation } from '@/hooks/use-translation';

export default function ReportsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder title={t('reports.title')} message={t('reports.placeholder')} />
    </Screen>
  );
}
