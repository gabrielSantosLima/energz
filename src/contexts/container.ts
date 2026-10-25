import 'reflect-metadata';

import { container } from 'tsyringe';

import { AgentSettingsStorage } from '@/domain/services/agent-settings-storage';
import { BackupSettingsStorage } from '@/domain/services/backup-settings-storage';
import { BackgroundBackupService } from '@/domain/services/background-backup-service';
import { BillImageProcessor } from '@/domain/services/bill-image-processor';
import { Database } from '@/domain/services/database';
import { DatabaseBackupService } from '@/domain/services/database-backup-service';
import { EnergyBillRepository } from '@/domain/services/energy-bill-repository';
import { IdGenerator } from '@/domain/services/id-generator';
import { ImageCapturer } from '@/domain/services/image-capturer';
import { MeasurementRepository } from '@/domain/services/measurement-repository';
import { NotificationService } from '@/domain/services/notification-service';
import { NotificationSettingsStorage } from '@/domain/services/notification-settings-storage';
import { PreferencesStorage } from '@/domain/services/preferences-storage';
import { ReportExporter } from '@/domain/services/report-exporter';
import { GetAgentSettingsUseCase } from '@/domain/useCases/agents/get-agent-settings';
import { ParseEnergyBillUseCase } from '@/domain/useCases/agents/parse-energy-bill';
import { SaveAgentSettingsUseCase } from '@/domain/useCases/agents/save-agent-settings';
import { GetBackupSettingsUseCase } from '@/domain/useCases/backup/get-backup-settings';
import { GetBackupStatusUseCase } from '@/domain/useCases/backup/get-backup-status';
import { RunDatabaseBackupUseCase } from '@/domain/useCases/backup/run-database-backup';
import { SetAutoBackupEnabledUseCase } from '@/domain/useCases/backup/set-auto-backup-enabled';
import { DeleteEnergyBillUseCase } from '@/domain/useCases/bills/delete-energy-bill';
import { DeleteEnergyBillsUseCase } from '@/domain/useCases/bills/delete-energy-bills';
import { GetEnergyBillUseCase } from '@/domain/useCases/bills/get-energy-bill';
import { ListEnergyBillsUseCase } from '@/domain/useCases/bills/list-energy-bills';
import { SaveEnergyBillUseCase } from '@/domain/useCases/bills/save-energy-bill';
import { UpdateEnergyBillUseCase } from '@/domain/useCases/bills/update-energy-bill';
import { DeleteCyclesUseCase } from '@/domain/useCases/cycles/delete-cycles';
import { GetCycleDetailUseCase } from '@/domain/useCases/cycles/get-cycle-detail';
import { ListCyclesUseCase } from '@/domain/useCases/cycles/list-cycles';
import { CreateMeasurementUseCase } from '@/domain/useCases/measurements/create-measurement';
import { DeleteMeasurementUseCase } from '@/domain/useCases/measurements/delete-measurement';
import { DeleteMeasurementsUseCase } from '@/domain/useCases/measurements/delete-measurements';
import { GetMeasurementUseCase } from '@/domain/useCases/measurements/get-measurement';
import { ListMeasurementsUseCase } from '@/domain/useCases/measurements/list-measurements';
import { UpdateMeasurementUseCase } from '@/domain/useCases/measurements/update-measurement';
import { GetNotificationSettingsUseCase } from '@/domain/useCases/notifications/get-notification-settings';
import { SetMeasurementReminderEnabledUseCase } from '@/domain/useCases/notifications/set-measurement-reminder-enabled';
import { GetPreferencesUseCase } from '@/domain/useCases/preferences/get-preferences';
import { SetLocaleUseCase } from '@/domain/useCases/preferences/set-locale';
import { SetThemePreferenceUseCase } from '@/domain/useCases/preferences/set-theme-preference';
import { CaptureImageUseCase } from '@/domain/useCases/reports/capture-image';
import { ExportReportImageUseCase } from '@/domain/useCases/reports/export-report-image';
import { ExportReportPdfUseCase } from '@/domain/useCases/reports/export-report-pdf';
import { GenerateReportUseCase } from '@/domain/useCases/reports/generate-report';

container.registerSingleton(Database);
container.registerSingleton(PreferencesStorage);
container.registerSingleton(NotificationSettingsStorage);
container.registerSingleton(MeasurementRepository);
container.registerSingleton(EnergyBillRepository);
container.registerSingleton(IdGenerator);
container.registerSingleton(NotificationService);
container.registerSingleton(BillImageProcessor);
container.registerSingleton(AgentSettingsStorage);
container.registerSingleton(BackupSettingsStorage);
container.registerSingleton(DatabaseBackupService);
container.registerSingleton(BackgroundBackupService);
container.registerSingleton(ReportExporter);
container.registerSingleton(ImageCapturer);

container.registerSingleton(GetPreferencesUseCase);
container.registerSingleton(SetLocaleUseCase);
container.registerSingleton(SetThemePreferenceUseCase);

container.registerSingleton(GetAgentSettingsUseCase);
container.registerSingleton(SaveAgentSettingsUseCase);
container.registerSingleton(ParseEnergyBillUseCase);

container.registerSingleton(GetBackupSettingsUseCase);
container.registerSingleton(GetBackupStatusUseCase);
container.registerSingleton(SetAutoBackupEnabledUseCase);
container.registerSingleton(RunDatabaseBackupUseCase);

container.registerSingleton(GetNotificationSettingsUseCase);
container.registerSingleton(SetMeasurementReminderEnabledUseCase);

container.registerSingleton(ListMeasurementsUseCase);
container.registerSingleton(GetMeasurementUseCase);
container.registerSingleton(CreateMeasurementUseCase);
container.registerSingleton(UpdateMeasurementUseCase);
container.registerSingleton(DeleteMeasurementUseCase);
container.registerSingleton(DeleteMeasurementsUseCase);

container.registerSingleton(ListEnergyBillsUseCase);
container.registerSingleton(GetEnergyBillUseCase);
container.registerSingleton(SaveEnergyBillUseCase);
container.registerSingleton(UpdateEnergyBillUseCase);
container.registerSingleton(DeleteEnergyBillUseCase);
container.registerSingleton(DeleteEnergyBillsUseCase);

container.registerSingleton(ListCyclesUseCase);
container.registerSingleton(GetCycleDetailUseCase);
container.registerSingleton(DeleteCyclesUseCase);

container.registerSingleton(GenerateReportUseCase);
container.registerSingleton(CaptureImageUseCase);
container.registerSingleton(ExportReportPdfUseCase);
container.registerSingleton(ExportReportImageUseCase);

export { container };
