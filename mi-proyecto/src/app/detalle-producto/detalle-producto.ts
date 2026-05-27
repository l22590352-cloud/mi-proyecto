import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 👈 IMPORTANTE: Inyectamos ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CarritoService } from '../services/carrito.service'; 
import { Auth } from '../services/auth'; 

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css']
})
export class DetalleProducto implements OnInit {
  producto: any = null;
  tallaSeleccionada: string = '';
  colorSeleccionado: string = '';
  cantidad: number = 1;

  constructor(
    private route: ActivatedRoute,
    private authService: Auth,
    private carritoService: CarritoService,
    private cdr: ChangeDetectorRef // 👈 Inyectamos el detector de cambios en el constructor
  ) {}

  ngOnInit(): void {
    // Escucha los cambios en la URL en tiempo real sin congelar la pantalla
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      
      if (idParam) {
        console.log('¡La URL cambió o se inició! ID detectado:', idParam);
        
        // Reseteamos el estado para que aparezca el spinner limpio mientras Flask responde
        this.producto = null;
        this.tallaSeleccionada = '';
        this.colorSeleccionado = '';
        this.cantidad = 1;
        this.cdr.detectChanges(); // Forzamos el render inicial del estado limpio (o spinner)

        // Cargamos el nuevo producto
        this.cargarDetalleProducto(Number(idParam));
      } else {
        console.error('No se pudo obtener el parámetro "id" desde la URL.');
      }
    });
  }

  cargarDetalleProducto(id: number) {
    this.authService.getProductos().subscribe({
      next: (productos: any[]) => {
        console.log('Catálogo completo recibido de Flask:', productos);
        console.log('Buscando coincidencia para el ID:', id);

        // Usamos "==" para evitar problemas estrictos de tipado entre String y Number
        const productoEncontrado = productos.find(p => p.id == id);

        if (productoEncontrado) {
          this.producto = productoEncontrado;
          console.log('¡Producto encontrado y asignado con éxito!', this.producto);
          
          // 🔥 LA MAGIA AQUÍ: Obliga a Angular a pintar la información, imágenes, tallas y colores de inmediato
          this.cdr.detectChanges(); 
        } else {
          console.error(`Error: No existe ningún producto con el ID ${id} en tu base de datos.`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al obtener la lista de productos desde Flask:', err);
        this.cdr.detectChanges(); // Evita que la interfaz se quede congelada si falla la API
      }
    });
  }

  seleccionarTalla(tallaNombre: string) {
    this.tallaSeleccionada = tallaNombre;
    // Reseteamos la cantidad a 1 al cambiar de talla para evitar que se quede un valor 
    // superior al stock de la nueva talla elegida
    this.cantidad = 1;
    this.cdr.detectChanges(); // 👈 Le da un empujón para actualizar los estilos visuales de los botones de tallas
  }

  seleccionarColor(colorNombre: string) {
    this.colorSeleccionado = colorNombre;
    this.cdr.detectChanges(); // 👈 Actualiza el botón del color activo en el HTML al hacer clic
  }

  aumentarCantidad() {
    if (!this.producto) return;

    // Buscamos el tope real de la talla que tiene seleccionada en el momento
    const tallaInfo = this.producto.tallas?.find((t: any) => t.nombre === this.tallaSeleccionada);
    
    // Si ya eligió talla, el límite es el de la talla; si no, usamos el stock total general
    const limiteStock = tallaInfo ? tallaInfo.stock : (this.producto.stock || 0);

    if (this.cantidad < limiteStock) {
      this.cantidad++;
      this.cdr.detectChanges(); // 👈 Fuerza a que el número cambie instantáneamente en pantalla
    } else {
      if (!this.tallaSeleccionada) {
        alert('Por favor, selecciona una talla primero para comprobar las existencias.');
      } else {
        alert(`No puedes agregar más. Solo quedan ${limiteStock} unidades disponibles en talla ${this.tallaSeleccionada}.`);
      }
    }
  }

  disminuirCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.cdr.detectChanges(); // 👈 Actualiza el contador dinámicamente al restar unidades
    }
  }

  agregarAlBolsa() {
    if (!this.producto) return;

    // Validamos usando las propiedades del arreglo real de Flask
    if (this.producto.tallas && this.producto.tallas.length > 0 && !this.tallaSeleccionada) {
      alert('Por favor selecciona una talla.');
      return;
    }

    if (this.producto.colores && this.producto.colores.length > 0 && !this.colorSeleccionado) {
      alert('Por favor selecciona un color.');
      return;
    }

    // Buscar el stock específico de la Talla Seleccionada
    const tallaInfo = this.producto.tallas?.find((t: any) => t.nombre === this.tallaSeleccionada);
    const stockRealDisponible = tallaInfo ? tallaInfo.stock : (this.producto.stock || 0);

    // Mandamos los 5 parámetros en el orden exacto que espera el CarritoService
    this.carritoService.agregarAlCarrito(
      this.producto, 
      this.cantidad, 
      this.tallaSeleccionada, 
      this.colorSeleccionado,
      stockRealDisponible // <-- Quinto parámetro fundamental para frenar compras infinitas
    );
    
    alert(`¡${this.producto.nombre} añadido a la bolsa con éxito!`);
  }
}