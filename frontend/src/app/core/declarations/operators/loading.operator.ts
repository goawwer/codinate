import { defer, finalize, Observable } from 'rxjs';

export const withLoading =
  <T>(setLoadingFn: (loading: boolean) => void) =>
  (src$: Observable<T>) =>
    defer(() => {
      setLoadingFn(true);

      return src$.pipe(finalize(() => setLoadingFn(false)));
    });
