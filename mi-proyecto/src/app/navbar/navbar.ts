import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router'; 
import { Auth } from '../services/auth'; 

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  // Variable para almacenar los datos del usuario logueado
  usuario: any = null;

  constructor(
    private router: Router, 
    private authService: Auth,
    private cd: ChangeDetectorRef // Inyectado para forzar la actualización visual
  ) {}

  ngOnInit() {
    // Suscripción al observable para reaccionar al inicio de sesión en tiempo real
    this.authService.usuario$.subscribe(user => {
      this.usuario = user;
      
      // Forzamos a Angular a detectar el cambio para que los botones con *ngIf aparezcan
      this.cd.detectChanges();
      
      if (this.usuario) {
        console.log('Usuario detectado en Navbar:', this.usuario.nombre, 'Rol:', this.usuario.rol_id);
      }
    });
  }

  /**
   * Cierra la sesión del usuario, limpia el estado global y redirige al login.
   */
  cerrarSesion() {
    // Llama al método logout del servicio para notificar a todos los componentes
    this.authService.logout(); 
    
    // Redirige al usuario a la pantalla de bienvenida o login
    this.router.navigate(['/login']);
    
    // Asegura que el estado visual se limpie inmediatamente
    this.usuario = null;
    this.cd.detectChanges();
  }

  /**
   * Determina si la barra de navegación debe mostrarse según la ruta actual.
   */
  mostrarNavbar(): boolean {
    const rutasOcultas = ['/login', '/registro', '/welcome'];
    return !rutasOcultas.includes(this.router.url);
  }

  /**
   * Helper para verificar roles en el HTML de forma limpia
   */
  esAdmin(): boolean {
    return this.usuario?.rol_id === 1; // Rol 1 definido como Administrador
  }

  esCliente(): boolean {
    return this.usuario?.rol_id === 2; // Rol 2 definido como Cliente
  }
}