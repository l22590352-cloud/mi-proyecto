import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../services/carrito.service';
import { Auth } from '../services/auth'; // Inyectamos tu archivo Auth

interface CheckoutForm {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  referencia: string;
  metodoPago: string;
  numeroTarjeta: string;
  nombreTarjeta: string;
  expiracion: string;
  cvv: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  carrito: ItemCarrito[] = [];
  cargandoPedido: boolean = false;

  formulario: CheckoutForm = {
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    referencia: '',
    metodoPago: 'Tarjeta',
    numeroTarjeta: '',
    nombreTarjeta: '',
    expiracion: '',
    cvv: '',
  };

  constructor(
    private carritoService: CarritoService,
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef // Inyectado para forzar la actualización de la UI
  ) {}

  ngOnInit(): void {
    this.carritoService.carrito$.subscribe({
      next: (productos) => {
        this.carrito = productos;
      }
    });

    if (this.carrito.length === 0) {
      this.router.navigate(['/carrito']);
      return; // Detenemos la ejecución si redirige
    }

    // ==========================================================
    // AUTO-RELLENO INTELIGENTE DESDE LA BASE DE DATOS
    // ==========================================================
    const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
    const usuario_id = usuarioSesion.id;

    if (usuario_id) {
      // Llamamos a tu servicio centralizado Auth para traer la dirección guardada
      this.authService.obtenerDireccionUsuario(usuario_id).subscribe({
        next: (direccionGuardada) => {
          if (direccionGuardada) {
            // Si Flask encuentra una dirección, pre-llenamos el formulario de envío
            this.formulario.nombre = direccionGuardada.nombre_remitente;
            this.formulario.telefono = direccionGuardada.telefono;
            this.formulario.direccion = direccionGuardada.direccion; // Trae la dirección completa
            this.formulario.ciudad = direccionGuardada.ciudad;
            this.formulario.estado = direccionGuardada.estado;
            this.formulario.codigoPostal = direccionGuardada.codigo_postal;
            this.formulario.referencia = direccionGuardada.notas;
            this.formulario.correo = usuarioSesion.correo || '';
            // Dejamos la colonia vacía porque ya viene guardada e integrada dentro del string 'direccion'
            this.formulario.colonia = 'Registrada'; 
          } else {
            // Si es un usuario nuevo sin direcciones, le ayudamos poniendo sus datos de cuenta base
            this.formulario.nombre = usuarioSesion.nombre || '';
            this.formulario.correo = usuarioSesion.correo || '';
          }
          
          // Forzamos a Angular a redibujar los inputs con los nuevos datos recibidos asíncronamente
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al recuperar la dirección del cliente:', err);
          // Aseguramos refrescar la UI incluso si falla la petición
          this.cdr.detectChanges();
        }
      });
    }
  }

  getSubtotal(): number {
    return this.carritoService.obtenerPrecioTotal();
  }

  getEnvio(): number {
    return this.getSubtotal() >= 999 ? 0 : 99;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getEnvio();
  }

  finalizarCompra(): void {
    if (
      !this.formulario.nombre ||
      !this.formulario.correo ||
      !this.formulario.telefono ||
      !this.formulario.direccion ||
      !this.formulario.colonia ||
      !this.formulario.ciudad ||
      !this.formulario.estado ||
      !this.formulario.codigoPostal ||
      !this.formulario.metodoPago
    ) {
      alert('Completa todos los datos de envío y pago');
      return;
    }

    if (this.formulario.metodoPago === 'Tarjeta') {
      if (
        !this.formulario.numeroTarjeta ||
        !this.formulario.nombreTarjeta ||
        !this.formulario.expiracion ||
        !this.formulario.cvv
      ) {
        alert('Completa todos los datos de la tarjeta');
        return;
      }
    }

    this.cargandoPedido = true;

    const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
    const usuario_id = usuarioSesion.id || 1; 

    // Si es una dirección auto-rellenada no le volvemos a concatenar la palabra ", Col. Registrada"
    const direccionFinal = this.formulario.colonia === 'Registrada' 
      ? this.formulario.direccion 
      : `${this.formulario.direccion}, Col. ${this.formulario.colonia}`;

    const payload = {
      usuario_id: usuario_id,
      total: this.getTotal(),
      nombre_cliente: this.formulario.nombre,
      telefono: this.formulario.telefono,
      direccion: direccionFinal,
      ciudad: this.formulario.ciudad,
      estado_envio: this.formulario.estado,
      codigo_postal: this.formulario.codigoPostal,
      notas: this.formulario.referencia || '',
      productos: this.carrito.map(item => ({
        id: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        tallaSeleccionada: item.tallaSeleccionada || '',
        colorSeleccionado: item.colorSeleccionado || ''
      }))
    };

    // Llamamos a la función de tu servicio Auth
    this.authService.crearPedidoBackend(payload).subscribe({
      next: (res: any) => {
        this.cargandoPedido = false;
        alert(`Pedido realizado con éxito. Folio de Orden: #${res.pedido_id}\n¡Gracias por tu compra ${this.formulario.nombre}!`);
        
        this.carritoService.vaciarCarrito();
        this.router.navigate(['/catalogo']);
      },
      error: (err) => {
        this.cargandoPedido = false;
        console.error('Error al registrar pedido en Flask:', err);
        alert('Hubo un problema al procesar la orden en el servidor.');
      }
    });
  }
}