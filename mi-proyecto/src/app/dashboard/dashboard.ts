import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { Auth } from '../services/auth'; // Asegúrate de que la ruta a tu servicio sea correcta

@Component({
  selector: 'app-dashboard',
  standalone: true, 
  imports: [
    CommonModule, 
    RouterModule 
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // Variables para almacenar los contadores del sistema
  totalUsuarios: number = 0;
  totalProductos: number = 0;
  totalPedidos: number = 0;
  alertasStock: number = 0; // Opcional por si deseas manejarlo después

  constructor(
    private authService: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    // 1. Obtener total de usuarios
    if (typeof this.authService.getUsuarios === 'function') {
      this.authService.getUsuarios().subscribe({
        next: (data: any[]) => {
          this.totalUsuarios = data.length;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al obtener usuarios:', err)
      });
    }

    // 2. Obtener total de productos
    if (typeof this.authService.getProductos === 'function') {
      this.authService.getProductos().subscribe({
        next: (data: any[]) => {
          this.totalProductos = data.length;
          
          // Lógica opcional para contar alertas de stock (ejemplo: productos con menos de 5 unidades)
          this.alertasStock = data.filter((p: any) => p.stock <= 5).length;
          
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al obtener productos:', err)
      });
    }

    // 3. Obtener total de pedidos (utiliza el endpoint administrativo global)
    if (typeof this.authService.getPedidosAdmin === 'function') {
      this.authService.getPedidosAdmin().subscribe({
        next: (data: any[]) => {
          this.totalPedidos = data.length;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al obtener pedidos:', err)
      });
    }
  }
}