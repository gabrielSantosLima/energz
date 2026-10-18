import { ComingSoon } from '@/components/ui/coming-soon';
import { Screen } from '@/components/ui/screen';
import { useTranslation } from '@/hooks/use-translation';

export default function BillsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <ComingSoon title={t('bills.title')} message={t('bills.message')} />
    </Screen>
  );
}
