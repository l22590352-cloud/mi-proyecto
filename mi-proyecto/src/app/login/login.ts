import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // 1. Agregamos RouterModule aquí
import { Auth } from '../services/auth'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // 2. Lo declaramos aquí para darle permisos al HTML
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  credenciales = {
    correo: '',
    password: ''
  };

  constructor(
    private authService: Auth, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ingresar() {
    if (!this.credenciales.correo || !this.credenciales.password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    this.authService.login(this.credenciales).subscribe({
      next: (res) => {
        console.log('Login exitoso, procesando redireccion segun rol...');
        this.cdr.detectChanges();

        if (res.usuario && res.usuario.rol_id === 1) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/catalogo']);
        }
      },
      error: (err) => {
        const mensajeError = err.error?.mensaje || 'Credenciales incorrectas';
        alert('Ups! ' + mensajeError);
        this.cdr.detectChanges();
      }
    });
  }
}