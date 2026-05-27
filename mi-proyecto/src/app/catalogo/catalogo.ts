import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 👈 IMPORTANTE: Añadido ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router'; 
import { CarritoService } from '../services/carrito.service'; 
import { Auth } from '../services/auth'; 

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], 
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css'],
})
export class Catalogo implements OnInit {
  productosOriginales: any[] = []; // Guarda lo que viene de Flask
  productosFiltrados: any[] = [];  // Lo que se muestra en pantalla

  categoriaSeleccionada: string = 'Todos';

  // ========================================================
  // LISTA ESTÁTICA DE CATEGORÍAS (ESTILO SHEIN)
  // ========================================================
  categoriasVisuales = [
    {
      nombre: 'Todos',
      imagen: 'https://cdn-icons-png.flaticon.com/512/3710/3710209.png'
    },
    {
      nombre: 'Mujer',
      imagen: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=150&auto=format&fit=crop'
    },
    {
      nombre: 'Vestidos',
      imagen: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=150&auto=format&fit=crop'
    },
    {
      nombre: 'Blusas',
      imagen: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=150&auto=format&fit=crop'
    },
    {
      nombre: 'Zapatos',
      imagen: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=150&auto=format&fit=crop'
    }
  ];

  constructor(
    private authService: Auth, 
    private carritoService: CarritoService,
    private cdr: ChangeDetectorRef // 👈 Inyectamos el detector de cambios aquí
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.authService.getProductos().subscribe({
      next: (data) => {
        // Guardamos los productos reales de la base de datos
        this.productosOriginales = data;
        this.productosFiltrados = data;

        // 🔥 OBLIGA A ANGULAR: Renderiza la cuadrícula de productos en cuanto Flask responda
        this.cdr.detectChanges(); 
        console.log('Catálogo cargado y renderizado con éxito:', this.productosOriginales);
      },
      error: (err) => {
        console.error('Error al conectar con Flask:', err);
        // Descongelamos el estado por si hay algún esqueleto o spinner de carga puesto en el HTML
        this.cdr.detectChanges(); 
      }
    });
  }

  filtrarPorCategoria(catNombre: string) {
    this.categoriaSeleccionada = catNombre;
    if (catNombre === 'Todos') {
      this.productosFiltrados = this.productosOriginales;
    } else {
      // Filtra buscando que el campo 'categoria' coincida exactamente con el nombre de la burbuja
      this.productosFiltrados = this.productosOriginales.filter(
        p => p.categoria?.toLowerCase() === catNombre.toLowerCase()
      );
    }

    // 🔥 OBLIGA A ANGULAR: Redibuja las tarjetas filtradas inmediatamente al hacer click
    this.cdr.detectChanges(); 
    console.log(`Filtro aplicado para: ${catNombre}. Mostrando ${this.productosFiltrados.length} productos.`);
  }
}