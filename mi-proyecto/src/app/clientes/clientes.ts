import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface ClienteAdmin {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  ciudad: string;
  compras: number;
  totalGastado: number;
  estado: 'Activo' | 'Inactivo';
  avatar: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  busqueda: string = '';
  estadoSeleccionado: string = 'Todos';

  estados: string[] = ['Todos', 'Activo', 'Inactivo'];

  clientes: ClienteAdmin[] = [
    {
      id: 1,
      nombre: 'María López',
      correo: 'maria.lopez@gmail.com',
      telefono: '5512345678',
      ciudad: 'Ciudad de México',
      compras: 8,
      totalGastado: 5200,
      estado: 'Activo',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 2,
      nombre: 'Fernanda Ruiz',
      correo: 'fernanda.ruiz@gmail.com',
      telefono: '5587654321',
      ciudad: 'Guadalajara',
      compras: 3,
      totalGastado: 1890,
      estado: 'Activo',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 3,
      nombre: 'Andrea Gómez',
      correo: 'andrea.gomez@gmail.com',
      telefono: '5544455566',
      ciudad: 'Monterrey',
      compras: 1,
      totalGastado: 499,
      estado: 'Inactivo',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 4,
      nombre: 'Sofía Hernández',
      correo: 'sofia.hernandez@gmail.com',
      telefono: '5533344455',
      ciudad: 'Puebla',
      compras: 12,
      totalGastado: 8450,
      estado: 'Activo',
      avatar:
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 5,
      nombre: 'Valeria Torres',
      correo: 'valeria.torres@gmail.com',
      telefono: '5577788899',
      ciudad: 'Querétaro',
      compras: 0,
      totalGastado: 0,
      estado: 'Inactivo',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    },
  ];

  get clientesFiltrados(): ClienteAdmin[] {
    return this.clientes.filter((cliente) => {
      const texto = this.busqueda.toLowerCase();

      const coincideBusqueda =
        cliente.nombre.toLowerCase().includes(texto) ||
        cliente.correo.toLowerCase().includes(texto) ||
        cliente.ciudad.toLowerCase().includes(texto) ||
        cliente.telefono.includes(texto);

      const coincideEstado =
        this.estadoSeleccionado === 'Todos' ||
        cliente.estado === this.estadoSeleccionado;

      return coincideBusqueda && coincideEstado;
    });
  }

  get totalClientes(): number {
    return this.clientes.length;
  }

  get clientesActivos(): number {
    return this.clientes.filter((cliente) => cliente.estado === 'Activo').length;
  }

  get clientesInactivos(): number {
    return this.clientes.filter((cliente) => cliente.estado === 'Inactivo').length;
  }

  get mejoresClientes(): number {
    return this.clientes.filter((cliente) => cliente.totalGastado >= 5000).length;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.estadoSeleccionado = 'Todos';
  }

  nuevoCliente(): void {
    alert('Ir al formulario para registrar un nuevo cliente');
  }

  verCliente(cliente: ClienteAdmin): void {
    alert(`Ver cliente: ${cliente.nombre}`);
  }

  editarCliente(cliente: ClienteAdmin): void {
    alert(`Editar cliente: ${cliente.nombre}`);
  }

  eliminarCliente(id: number): void {
    const confirmado = confirm('¿Seguro que deseas eliminar este cliente?');

    if (!confirmado) {
      return;
    }

    this.clientes = this.clientes.filter((cliente) => cliente.id !== id);
  }

  getClaseCompras(compras: number): string {
    if (compras === 0) {
      return 'badge-compras-vacio';
    }

    if (compras <= 3) {
      return 'badge-compras-bajo';
    }

    return 'badge-compras-top';
  }

  getTextoCompras(compras: number): string {
    if (compras === 0) {
      return 'Sin compras';
    }

    if (compras <= 3) {
      return 'Ocasional';
    }

    return 'Frecuente';
  }
}