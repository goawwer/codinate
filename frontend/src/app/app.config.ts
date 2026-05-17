import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { TUI_LANGUAGE, TUI_RUSSIAN_LANGUAGE, TUI_ENGLISH_LANGUAGE } from '@taiga-ui/i18n';
import { TranslateService } from '@ngx-translate/core';
import { of, switchMap, startWith } from 'rxjs';
import { APP_SIZE } from './core/declarations/tokens/size.token';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideApiConfig } from './core/declarations/providers/api-config.provider';
import { apiConfigUrl } from './core/declarations/constants/url';
import { AppInitService } from './core/services/app-init.service';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { apiRootUrlInterceptorFn } from './core/interceptor/api-root-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiRootUrlInterceptorFn, authInterceptor])),
    provideApiConfig({
      rootUrl: apiConfigUrl,
    }),
    provideAppInitializer(() => inject(AppInitService).init()),
    provideTranslateService({
      fallbackLang: 'ru',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),
    provideEventPlugins(),
    { provide: APP_SIZE, useValue: 'm' },
    {
      provide: TUI_LANGUAGE,
      useFactory: () => {
        const translate = inject(TranslateService);
        return translate.onLangChange.pipe(
          startWith(null),
          switchMap(() => {
            const lang = translate.currentLang ?? translate.defaultLang ?? 'ru';
            return lang === 'ru' ? of(TUI_RUSSIAN_LANGUAGE) : of(TUI_ENGLISH_LANGUAGE);
          }),
        );
      },
    },
  ],
};
