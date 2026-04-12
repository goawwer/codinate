import { InjectionToken } from '@angular/core';
import { TuiSizeS, TuiSizeXXL } from '@taiga-ui/core';

export type AppSize = TuiSizeS | TuiSizeXXL;

export const APP_SIZE = new InjectionToken<AppSize>('APP_SIZE', {
  factory: () => 'm',
});
