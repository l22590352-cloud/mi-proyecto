import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  
  // Lista que se vincula con el *ngFor del HTML
  listaUsuarios: any[] = [];

  // Modelo para el formulario (vinculado con ngModel)
  nuevoUsuario = {
    nombre: '',
    correo: '',
    password: '',
    rol_id: 2 // Por defecto "Cliente"
  };

  constructor(private authService: Auth) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
  }

  // 1. Carga los usuarios desde la API de Flask
  obtenerUsuarios(): void {
    this.authService.getUsuarios().subscribe({
      next: (data) => {
        this.listaUsuarios = data;
        console.log('Usuarios cargados:', data);
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
        alert('No se pudo cargar la lista de usuarios.');
      }
    });
  }

  // 2. Lógica para Guardar (POST)
  onGuardar(): void {
    // Validación básica
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.correo || !this.nuevoUsuario.password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    this.authService.register(this.nuevoUsuario).subscribe({
      next: (res) => {
        alert('¡Usuario registrado exitosamente!');
        this.limpiarFormulario();
        this.obtenerUsuarios(); // Recarga la tabla automáticamente
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        alert('Error al guardar: ' + (err.error?.error || 'Servidor no disponible'));
      }
    });
  }

  // 3. Lógica para Eliminar (DELETE)
  // Nota: Requiere que crees el endpoint @app.route('/usuarios/<id>', methods=['DELETE']) en Flask
  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      // Si aún no tienes el método delete en el servicio, puedes comentar esta parte
      // Pero aquí te dejo cómo sería la implementación lógica:
      /*
      this.authService.deleteUsuario(id).subscribe({
        next: () => {
          alert('Usuario eliminado');
          this.obtenerUsuarios();
        },
        error: (err) => alert('Error al eliminar')
      });
      */
      console.log('Solicitud para eliminar ID:', id);
    }
  }

  // 4. Limpia el objeto para que el modal aparezca vacío
  limpiarFormulario(): void {
    this.nuevoUsuario = {
      nombre: '',
      correo: '',
      password: '',
      rol_id: 2
    };
  }

  // 5. Preparar edición (opcional por si quieres llenar el modal con datos existentes)
  prepararEdicion(user: any): void {
    this.nuevoUsuario = {
      nombre: user.nombre,
      correo: user.correo,
      password: '', // Por seguridad no se carga la password
      rol_id: user.rol_id
    };
  }
}