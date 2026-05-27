import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './services/auth';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Intentamos obtener el rol requerido configurado en las rutas (data: { rol: 1 })
  const rolRequerido = route.data['rol'];

  return authService.usuario$.pipe(
    take(1),
    map(user => {
      // 1. Si no hay ningun usuario autenticado en la app, directo al login
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      // Obtener los datos reales de la sesion almacenada localmente
      const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
      const rolActual = usuarioSesion.rol_id; // 1 para Admin, 2 para Cliente

      // 2. Si la ruta es exclusiva para un rol (como el dashboard que pide rol: 1)
      if (rolRequerido !== undefined) {
        
        // Si el rol del usuario que intenta entrar no coincide con el requerido, lo rebotamos
        if (rolActual !== rolRequerido) {
          console.warn(`Acceso denegado a la ruta: ${state.url}. Tu rol es ${rolActual} y se requiere ${rolRequerido}`);
          
          // Expulsamos al cliente de inmediato mandandolo a la tienda publica
          return router.createUrlTree(['/catalogo']);
        }
      }

      // Si tiene sesion y cumple con el rol (o la ruta es general), permitimos el acceso
      return true;
    })
  );
};