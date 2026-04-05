import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { IS_NEED_API_ROOT_URL } from '../declarations/tokens/api-url.token';
import { API_CONFIG } from '../declarations/tokens/api-config.token';
import { inject } from '@angular/core';

export const apiRootUrlInterceptorFn: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const isAssetRequest = request.url.startsWith('assets/') || request.url.startsWith('/assets/');

  if (isAssetRequest || !request.context.get(IS_NEED_API_ROOT_URL)) {
    return next(request);
  }

  const url = `${inject(API_CONFIG).rootUrl}${request.url}`;

  return next(request.clone({ url }));
};
