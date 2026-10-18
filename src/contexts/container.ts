import 'reflect-metadata';

import { container } from 'tsyringe';

import { PreferencesStorage } from '@/domain/services/preferences-storage';
import { GetPreferencesUseCase } from '@/domain/useCases/preferences/get-preferences';
import { SetLocaleUseCase } from '@/domain/useCases/preferences/set-locale';
import { SetThemePreferenceUseCase } from '@/domain/useCases/preferences/set-theme-preference';

container.registerSingleton(PreferencesStorage);
container.registerSingleton(GetPreferencesUseCase);
container.registerSingleton(SetLocaleUseCase);
container.registerSingleton(SetThemePreferenceUseCase);

export { container };
