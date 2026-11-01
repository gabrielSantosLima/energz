import { StyleSheet, View } from 'react-native';

import { ReportTypeRow } from '@/components/reports/report-type-row';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useSafeNavigation } from '@/hooks/use-safe-navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

export default function ReportsHubScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigate = useSafeNavigation();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title">{t('reports.title')}</Text>
        <Text variant="caption" color="textSecondary">
          {t('reports.subtitle')}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <ReportTypeRow
          title={t('reports.measurementsTitle')}
          description={t('reports.measurementsDescription')}
          icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
          onPress={() => navigate('/reports/measurements')}
        />
        <ReportTypeRow
          title={t('reports.billsTitle')}
          description={t('reports.billsDescription')}
          icon={{ ios: 'bolt', android: 'bolt', web: 'bolt' }}
          badge={t('common.comingSoon')}
          divider
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
