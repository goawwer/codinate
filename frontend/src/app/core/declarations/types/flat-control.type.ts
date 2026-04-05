import { FormControl } from '@angular/forms';

export type FlatControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: FormControl<T[K]>;
};
