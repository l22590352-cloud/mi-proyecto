import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Auth } from '../services/auth'; 

interface ProductoAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;         
  imagen: string;         
  categoria: string; 
  tallas: any[];         
  colores: any[];         
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  // --- Datos ---
  productos: ProductoAdmin[] = [];
  categorias: string[] = ['Todas', 'Vestidos', 'Blusas', 'Faldas', 'Pantalones', 'Accesorios'];
  
  listaTallasMaster = [
    { id: 1, nombre: 'S' }, { id: 2, nombre: 'M' }, { id: 3, nombre: 'L' }, { id: 4, nombre: 'XL' }
  ];

  listaColoresMaster = [
    { id: 1, nombre: 'Negro' }, { id: 2, nombre: 'Blanco' }, { id: 3, nombre: 'Rojo' }, { id: 4, nombre: 'Azul' }
  ];

  // --- Estado ---
  busqueda: string = '';
  categoriaSeleccionada: string = 'Todas';
  esEdicion: boolean = false;
  idProductoEditar: number | null = null;

  nuevoProductoData: any = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen: '',
    categoria: 'Vestidos',
    tallas: [],
    colores: []
  };

  // Se inyecta ChangeDetectorRef para solucionar el problema de carga visual
  constructor(
    private authService: Auth,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.authService.getProductos().subscribe({
      next: (data: ProductoAdmin[]) => {
        // Mapeo de datos con fallback para categorías nulas
        this.productos = [...data.map(p => ({
          ...p,
          categoria: p.categoria || 'Accesorios'
        }))];
        
        // Forzamos a Angular a detectar los cambios inmediatamente
        this.cd.detectChanges();
        console.log('Productos cargados:', this.productos.length);
      },
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  // Getter optimizado para filtrado reactivo
  get productosFiltrados(): ProductoAdmin[] {
    if (!this.productos || this.productos.length === 0) return [];

    return this.productos.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const coincideBusqueda = nombre.includes(this.busqueda.toLowerCase());
      const coincideCategoria = this.categoriaSeleccionada === 'Todas' || 
                                p.categoria === this.categoriaSeleccionada;
      return coincideBusqueda && coincideCategoria;
    });
  }

  // --- Operaciones de Tallas ---
  actualizarStockTalla(id: number, event: any): void {
    const stock = Number(event.target.value);
    const indice = this.nuevoProductoData.tallas.findIndex((t: any) => t.id === id);

    if (stock > 0) {
      if (indice > -1) {
        this.nuevoProductoData.tallas[indice].stock = stock;
      } else {
        this.nuevoProductoData.tallas.push({ id: id, stock: stock });
      }
    } else if (indice > -1) {
      this.nuevoProductoData.tallas.splice(indice, 1);
    }
  }

  esTallaSeleccionada(id: number): boolean {
    return this.nuevoProductoData.tallas.some((t: any) => t.id === id);
  }

  getStockActualTalla(tallaId: number): number | string {
    const t = this.nuevoProductoData.tallas.find((x: any) => x.id === tallaId);
    return t ? t.stock : '';
  }

  // --- Operaciones de Colores ---
  toggleColor(id: number): void {
    const indice = this.nuevoProductoData.colores.indexOf(id);
    if (indice > -1) {
      this.nuevoProductoData.colores.splice(indice, 1);
    } else {
      this.nuevoProductoData.colores.push(id);
    }
  }

  esColorSeleccionado(id: number): boolean {
    return this.nuevoProductoData.colores.includes(id);
  }

  // --- Guardar y CRUD ---
  guardarProducto(): void {
    const payload = {
      ...this.nuevoProductoData,
      precio: Number(this.nuevoProductoData.precio),
      stock: Number(this.nuevoProductoData.stock)
    };

    if (!payload.nombre || payload.precio <= 0) {
      alert('Por favor, ingresa un nombre y un precio válido.');
      return;
    }

    if (this.esEdicion && this.idProductoEditar) {
      this.authService.actualizarProducto(this.idProductoEditar, payload).subscribe({
        next: () => {
          alert('Producto actualizado con éxito');
          this.cargarProductos();
          this.cerrarModal();
        },
        error: (err) => alert('Error al actualizar: ' + err.error?.error)
      });
    } else {
      this.authService.registrarProducto(payload).subscribe({
        next: () => {
          alert('Producto creado con éxito');
          this.cargarProductos();
          this.cerrarModal();
        },
        error: (err) => alert('Error al crear: ' + err.error?.error)
      });
    }
  }

  // --- UI Helpers ---
  nuevoProducto(): void {
    this.limpiarFormulario();
  }

  prepararEdicion(producto: ProductoAdmin): void {
    this.esEdicion = true;
    this.idProductoEditar = producto.id;
    this.nuevoProductoData = JSON.parse(JSON.stringify(producto));
  }

  limpiarFormulario(): void {
    this.nuevoProductoData = { 
      nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '', categoria: 'Vestidos', tallas: [], colores: [] 
    };
    this.esEdicion = false;
    this.idProductoEditar = null;
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('modalProducto');
    if (modalElement) {
      const btnClose = modalElement.querySelector('.btn-close') as HTMLElement;
      btnClose?.click();
    }
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionada = 'Todas';
    this.cd.detectChanges(); // Refrescar vista al limpiar
  }

  // --- KPIs del Dashboard ---
  get totalProductos(): number { return this.productos.length; }
  get productosActivos(): number { return this.productos.filter(p => p.stock > 0).length; }
  get stockBajo(): number { return this.productos.filter(p => p.stock > 0 && p.stock <= 5).length; }
  get agotados(): number { return this.productos.filter(p => p.stock === 0).length; }

  getClaseStock(stock: number): string {
    if (stock === 0) return 'badge-stock-agotado';
    if (stock <= 5) return 'badge-stock-bajo';
    return 'badge-stock-ok';
  }

  getTextoStock(stock: number): string {
    if (stock === 0) return 'Agotado';
    if (stock <= 5) return 'Stock bajo';
    return 'Disponible';
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Deseas eliminar este producto?')) {
      this.authService.eliminarProducto(id).subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.id !== id);
          this.cd.detectChanges();
          alert('Eliminado');
        }
      });
    }
  }

  verProducto(producto: ProductoAdmin): void {
    console.log('Detalle del producto:', producto);
  }
}