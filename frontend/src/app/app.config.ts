import { provideEventPlugins } from '@taiga-ui/event-plugins';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideApiConfig } from './core/declarations/providers/api-config.provider';
import { apiConfigUrl } from './core/declarations/constants/url';
import { apiRootUrlInterceptorFn } from './core/interceptor/api-root-url.interceptor';
import { AppInitService } from './core/services/app-init.service';
import { authInterceptor } from './core/interceptor/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiRootUrlInterceptorFn])),
    provideApiConfig({
      rootUrl: apiConfigUrl,
    }),
    provideAppInitializer(() => {
      inject(AppInitService).init();
    }),
    provideTranslateService({
      lang: 'ru',
      fallbackLang: 'ru',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),
    provideEventPlugins(),
  ],
};
