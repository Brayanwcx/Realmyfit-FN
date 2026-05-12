import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor de autenticación JWT.
 * Inyecta automáticamente el token Bearer en todas las peticiones HTTP.
 * Elimina la necesidad de llamar a getAuthHeaders() manualmente en cada servicio.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('gym_token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
