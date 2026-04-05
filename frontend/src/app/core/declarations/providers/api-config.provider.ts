import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ApiConfig } from '../interfaces/api-config.interface';
import { API_CONFIG } from '../tokens/api-config.token';

export function provideApiConfig(config: ApiConfig): EnvironmentProviders {
  const providers = [{ provide: API_CONFIG, useValue: config }];

  return makeEnvironmentProviders(providers);
}
