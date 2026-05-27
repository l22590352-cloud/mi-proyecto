import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Añadido por si acaso para la interactividad del modal
import { CarritoService, ItemCarrito } from '../services/carrito.service'; 
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Aseguramos que tenga los módulos base
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito implements OnInit, OnDestroy {
  carrito: ItemCarrito[] = [];
  totalPagar: number = 0;
  
  // ==========================================
  // AGREGADO: Variable de control para el Modal
  // ==========================================
  mostrarModal: boolean = false; 
  
  private carritoSub!: Subscription;

  constructor(private carritoService: CarritoService) {}

  ngOnInit(): void {
    // Nos suscribimos al BehaviorSubject del servicio para escuchar los cambios en vivo
    this.carritoSub = this.carritoService.carrito$.subscribe({
      next: (productos) => {
        this.carrito = productos;
        this.totalPagar = this.carritoService.obtenerPrecioTotal();
      }
    });
  }

  aumentarCantidad(item: ItemCarrito): void {
    this.carritoService.actualizarCantidad(
      item.id, 
      item.cantidad + 1, 
      item.tallaSeleccionada, 
      item.colorSeleccionado
    );
  }

  disminuirCantidad(item: ItemCarrito): void {
    this.carritoService.actualizarCantidad(
      item.id, 
      item.cantidad - 1, 
      item.tallaSeleccionada, 
      item.colorSeleccionado
    );
  }

  eliminarItem(item: ItemCarrito): void {
    this.carritoService.eliminarDelCarrito(
      item.id, 
      item.tallaSeleccionada, 
      item.colorSeleccionado
    );
  }

  // ==========================================
  // MODIFICADO: Lógica para abrir el Modal de forma segura
  // ==========================================
  confirmarPedido(): void {
    if (this.carrito.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    
    // Si hay artículos en la bolsa, abrimos la ventana flotante
    this.mostrarModal = true;
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones para prevenir fugas de memoria
    if (this.carritoSub) {
      this.carritoSub.unsubscribe();
    }
  }
}