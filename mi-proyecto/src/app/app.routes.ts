import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importa el Guard que creaste
import { authGuard } from './auth-guard';

import { Welcome } from './welcome/welcome';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Catalogo } from './catalogo/catalogo';
import { DetalleProducto } from './detalle-producto/detalle-producto';
import { Carrito } from './carrito/carrito';
import { HistorialPedidos } from './historial-pedidos/historial-pedidos';
import { Productos } from './productos/productos';
import { Clientes } from './clientes/clientes';
import { Checkout } from './checkout/checkout';
import { Registro } from './registro/registro';
import { Usuarios } from './usuarios/usuarios';

export const routes: Routes = [
  // --- RUTAS PUBLICAS ---
  { path: '', component: Welcome },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },

  // --- RUTAS PROTEGIDAS GENERALES (Clientes y Administradores pueden entrar) ---
  { path: 'catalogo', component: Catalogo, canActivate: [authGuard] },
  { path: 'detalle-producto/:id', component: DetalleProducto, canActivate: [authGuard] },
  { path: 'carrito', component: Carrito, canActivate: [authGuard] },
  { path: 'historial-pedidos', component: HistorialPedidos, canActivate: [authGuard] },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },

  // --- RUTAS EXCLUSIVAS DE ADMINISTRADOR (Se requiere estrictamente rol_id === 1) ---
  { 
    path: 'dashboard', 
    component: Dashboard, 
    canActivate: [authGuard], 
    data: { rol: 1 } // Bloquea a Rod e impide el acceso al panel visual
  },
  { 
    path: 'productos', 
    component: Productos, 
    canActivate: [authGuard], 
    data: { rol: 1 } 
  }, 
  { 
    path: 'usuarios', 
    component: Usuarios, 
    canActivate: [authGuard], 
    data: { rol: 1 } 
  }, 
  { 
    path: 'clientes', 
    component: Clientes, 
    canActivate: [authGuard], 
    data: { rol: 1 } 
  },

  // Comodin para rutas no encontradas
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }