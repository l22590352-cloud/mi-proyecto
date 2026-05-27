import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-historial-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historial-pedidos.html',
  styleUrl: './historial-pedidos.css',
})
export class HistorialPedidos implements OnInit {
  pedidos: any[] = [];
  cargando: boolean = false;
  
  esAdmin: boolean = false;
  usuarioNombre: string = '';
  estadosDisponibles: string[] = ['En preparación', 'En camino', 'Entregado'];

  constructor(
    private authService: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.usuarioNombre = usuarioSesion.nombre || 'Usuario';
    
    // 🔥 CORREGIDO: Filtro estricto para evitar que clientes como Rod hereden la vista de Admin
    this.esAdmin = 
      usuarioSesion.rol_id === 1 || 
      usuarioSesion.rol === 'admin' || 
      usuarioSesion.rol === 'ADMIN' ||
      usuarioSesion.correo?.toLowerCase().includes('admin');

    console.log('--- HistorialPedidos ---');
    console.log('Usuario actual:', usuarioSesion);
    console.log('¿Es Administrador?:', this.esAdmin);

    this.cargarDatos(usuarioSesion.id);
  }

  cargarDatos(usuarioId: number): void {
    this.cargando = true;
    this.cdr.detectChanges();

    if (this.esAdmin) {
      // Endpoint de la Sección 7 para Administradores
      this.authService.getPedidosAdmin().subscribe({
        next: (data) => {
          this.pedidos = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error Admin:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else if (usuarioId) {
      // Endpoint de la Sección 8 para Clientes
      this.authService.getPedidosCliente(usuarioId).subscribe({
        next: (data) => {
          this.pedidos = data;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error Cliente:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  cambiarEstado(pedidoId: number, nuevoEstado: string): void {
    if (!this.esAdmin) return;

    this.authService.actualizarEstadoPedido(pedidoId, nuevoEstado).subscribe({
      next: () => {
        alert(`Pedido #${pedidoId} actualizado correctamente a: ${nuevoEstado}`);
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (pedido) {
          pedido.estado = nuevoEstado;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al cambiar estado logístico:', err)
    });
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'En preparación': return 'status-prep';
      case 'En camino': return 'status-camino';
      case 'Entregado': return 'status-entregado';
      default: return '';
    }
  }
  obtenerPorcentajeProgreso(estado: string): string {
    switch (estado) {
      case 'En preparación': return '0%';
      case 'En camino': return '50%';
      case 'Entregado': return '100%';
      default: return '0%';
    }
  }
}