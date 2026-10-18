import 'reflect-metadata';

import { container } from 'tsyringe';

import { IdGenerator } from '@/domain/services/id-generator';
import { ImageCapturer } from '@/domain/services/image-capturer';
import { MeasurementRepository } from '@/domain/services/measurement-repository';
import { PreferencesStorage } from '@/domain/services/preferences-storage';
import { ReportExporter } from '@/domain/services/report-exporter';
import { GetCycleDetailUseCase } from '@/domain/useCases/cycles/get-cycle-detail';
import { ListCyclesUseCase } from '@/domain/useCases/cycles/list-cycles';
import { CreateMeasurementUseCase } from '@/domain/useCases/measurements/create-measurement';
import { DeleteMeasurementUseCase } from '@/domain/useCases/measurements/delete-measurement';
import { GetMeasurementUseCase } from '@/domain/useCases/measurements/get-measurement';
import { ListMeasurementsUseCase } from '@/domain/useCases/measurements/list-measurements';
import { UpdateMeasurementUseCase } from '@/domain/useCases/measurements/update-measurement';
import { GetPreferencesUseCase } from '@/domain/useCases/preferences/get-preferences';
import { SetLocaleUseCase } from '@/domain/useCases/preferences/set-locale';
import { SetThemePreferenceUseCase } from '@/domain/useCases/preferences/set-theme-preference';
import { CaptureImageUseCase } from '@/domain/useCases/reports/capture-image';
import { ExportReportImageUseCase } from '@/domain/useCases/reports/export-report-image';
import { ExportReportPdfUseCase } from '@/domain/useCases/reports/export-report-pdf';
import { GenerateReportUseCase } from '@/domain/useCases/reports/generate-report';

container.registerSingleton(PreferencesStorage);
container.registerSingleton(MeasurementRepository);
container.registerSingleton(IdGenerator);
container.registerSingleton(ReportExporter);
container.registerSingleton(ImageCapturer);

container.registerSingleton(GetPreferencesUseCase);
container.registerSingleton(SetLocaleUseCase);
container.registerSingleton(SetThemePreferenceUseCase);

container.registerSingleton(ListMeasurementsUseCase);
container.registerSingleton(GetMeasurementUseCase);
container.registerSingleton(CreateMeasurementUseCase);
container.registerSingleton(UpdateMeasurementUseCase);
container.registerSingleton(DeleteMeasurementUseCase);

container.registerSingleton(ListCyclesUseCase);
container.registerSingleton(GetCycleDetailUseCase);

container.registerSingleton(GenerateReportUseCase);
container.registerSingleton(CaptureImageUseCase);
container.registerSingleton(ExportReportPdfUseCase);
container.registerSingleton(ExportReportImageUseCase);

export { container };
