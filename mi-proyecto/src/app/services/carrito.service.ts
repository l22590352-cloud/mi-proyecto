import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Estructura de cómo se verá un producto dentro del carrito
export interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  tallaSeleccionada?: string;
  colorSeleccionado?: string;
  stockDisponible: number; // Límite de existencias reales en la base de datos
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // 1. Leemos si ya había un carrito guardado en el navegador, si no, empezamos vacío []
  private listaCarrito: ItemCarrito[] = JSON.parse(localStorage.getItem('carrito') || '[]');
  
  // 2. Canal dinámico para notificar los cambios en tiempo real
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>(this.listaCarrito);
  carrito$ = this.carritoSubject.asObservable();

  constructor() {}

  // 3. Función para agregar un producto desde la tienda / detalle-producto
  agregarAlCarrito(producto: any, cantidad: number = 1, talla?: string, color?: string, stockDisponibleMaximo: number = 0) {
    // Buscamos si ya existe exactamente el mismo producto con la misma talla y color
    const itemExistente = this.listaCarrito.find(item => 
      item.id === producto.id && 
      item.tallaSeleccionada === talla && 
      item.colorSeleccionado === color
    );

    if (itemExistente) {
      // VALIDACIÓN: ¿Sumar más cantidad supera el inventario real?
      if (itemExistente.cantidad + cantidad > itemExistente.stockDisponible) {
        alert(`¡Inventario insuficiente! Solo quedan ${itemExistente.stockDisponible} piezas en esta talla.`);
        // Lo dejamos al tope máximo permitido
        itemExistente.cantidad = itemExistente.stockDisponible;
      } else {
        itemExistente.cantidad += cantidad;
      }
    } else {
      // VALIDACIÓN: Si es nuevo pero piden más del stock que hay disponible
      let cantidadInicial = cantidad;
      if (cantidadInicial > stockDisponibleMaximo) {
        alert(`Ajustado automáticamente: solo hay ${stockDisponibleMaximo} piezas disponibles.`);
        cantidadInicial = stockDisponibleMaximo;
      }

      // Si es nuevo, lo agregamos a la lista asignando correctamente el stock disponible
      this.listaCarrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad: cantidadInicial,
        tallaSeleccionada: talla,
        colorSeleccionado: color,
        stockDisponible: stockDisponibleMaximo // Asignación corregida sin errores de sintaxis
      });
    }
    
    // Guardamos los cambios en LocalStorage y notificamos
    this.actualizarCarrito();
  }

  // 4. Eliminar un producto específico considerando su ID, talla y color
  eliminarDelCarrito(id: number, talla?: string, color?: string) {
    this.listaCarrito = this.listaCarrito.filter(item => 
      !(item.id === id && item.tallaSeleccionada === talla && item.colorSeleccionado === color)
    );
    this.actualizarCarrito();
  }

  // 5. Modificar la cantidad directamente desde los botones + y - de la vista del Carrito
  actualizarCantidad(id: number, nuevaCantidad: number, talla?: string, color?: string) {
    const item = this.listaCarrito.find(item => 
      item.id === id && item.tallaSeleccionada === talla && item.colorSeleccionado === color
    );

    if (item) {
      // VALIDACIÓN CRÍTICA: Detener al usuario si spamea el botón '+' superando las existencias
      if (nuevaCantidad > item.stockDisponible) {
        alert(`¡No puedes agregar más piezas! El stock actual de esta talla es de ${item.stockDisponible} unidades.`);
        return; // Detiene la ejecución en seco y no altera el carrito
      }

      item.cantidad = nuevaCantidad;

      // Si por error o diseño la cantidad baja a 0, lo removemos por completo
      if (item.cantidad <= 0) {
        this.eliminarDelCarrito(id, talla, color);
      } else {
        this.actualizarCarrito();
      }
    }
  }

  // 6. Vaciar todo el carrito (Ideal para cuando terminen de pagar en el checkout)
  vaciarCarrito() {
    this.listaCarrito = [];
    this.actualizarCarrito();
  }

  // 7. Calcular el precio total a pagar de todos los productos de la cesta
  obtenerPrecioTotal(): number {
    return this.listaCarrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  // 8. Calcular el total de prendas en el carrito (Para colocar la burbuja de número en tu Navbar)
  obtenerTotalPrendas(): number {
    return this.listaCarrito.reduce((total, item) => total + item.cantidad, 0);
  }

  // 9. Guarda en el navegador de manera persistente y le avisa a los componentes
  private actualizarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(this.listaCarrito));
    this.carritoSubject.next(this.listaCarrito);
  }

 
}