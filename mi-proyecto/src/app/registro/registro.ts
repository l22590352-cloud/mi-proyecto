import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 1. Para que funcione el formulario
import { Router, RouterModule } from '@angular/router'; // 2. Para navegar al login
// 3. Tu servicio mensajero
import { Auth } from '../services/auth'; 
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Agregamos los permisos aquí
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  // Este objeto guarda lo que el usuario escribe en el HTML
  nuevoUsuario = {
    nombre: '',
    correo: '',
    telefono: '', // Puedes dejarlo vacío si no lo pides en el HTML
    password: '',
    rol_id: 2     // Rol de cliente por defecto
  };

  confirmarPass = ''; // Variable extra para validar la contraseña

  constructor(
    private authService: Auth, // Inyectamos el servicio que creamos
    private router: Router      // Para mandar al usuario al login después
  ) {}

  // Función que se activa al dar clic en "Crear Cuenta"
  registrar() {
    // Validación rápida: ¿Las contraseñas coinciden?
    if (this.nuevoUsuario.password !== this.confirmarPass) {
      alert('Las contraseñas no coinciden. Revisa de nuevo.');
      return;
    }

    // Llamamos al servicio para enviar los datos a Flask
    this.authService.register(this.nuevoUsuario).subscribe({
      next: (res) => {
        console.log('Respuesta de Flask:', res);
        alert('¡Usuario registrado con éxito!');
        this.router.navigate(['/login']); // Redirigimos al login
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        // Si Flask manda un error (ej: correo ya existe), lo mostramos
        alert('Error: ' + (err.error?.error || 'No se pudo completar el registro'));
      }
    });
  }
}