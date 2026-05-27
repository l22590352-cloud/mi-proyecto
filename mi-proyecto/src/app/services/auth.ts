import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs'; // Importamos BehaviorSubject
import { tap } from 'rxjs/operators'; // Para interceptar la respuesta

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private API_URL = 'http://136.112.132.103:5000';


  // 1. Creamos el "emisor" de datos del usuario
  // Lee el localStorage al inicio por si el usuario ya estaba logueado
  private usuarioSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('usuario') || 'null'));
  
  // 2. Exponemos el "canal" para que el Navbar se suscriba
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credentials).pipe(
      tap((res: any) => {
        // 3. Si el login es exitoso, guardamos y avisamos a todos los componentes
        if (res && res.usuario) {
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.usuarioSubject.next(res.usuario); // ¡Aquí es donde el Navbar se entera!
        }
      })
    );
  }

  // 4. Función para cerrar sesión y avisar al Navbar que se limpie
  logout() {
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
  }

  // En tu archivo Auth
  registrarUsuarioPorAdmin(userData: any): Observable<any> {
    // Usamos el mismo endpoint que tu registro normal o uno específico
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  // Opcional: Método para obtener la lista que mostrarás en la tabla
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/usuarios`);
  }

  // --- MÉTODOS PARA PRODUCTOS ---

  // 1. Obtener todos los productos (incluye sus tallas y colores desde el backend)
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/productos`);
  }

  // 2. Crear producto completo (incluye lógica para tablas relacionales)
  registrarProducto(productoData: any): Observable<any> {
    /* productoData debe llevar:
      { nombre, descripcion, precio, stock, imagen, tallas: [{id, stock}], colores: [id, id] }
    */
    return this.http.post(`${this.API_URL}/productos`, productoData);
  }

  // 3. Editar producto
  actualizarProducto(id: number, productoData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/productos/${id}`, productoData);
  }

  // 4. Eliminar producto (borra en cascada en el backend)
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/productos/${id}`);
  }

  // 5. Catálogos para los Selects del Modal
  getTallas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/tallas`);
  }

  getColores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/colores`);
  }

  // --- MÉTODOS PARA LOGÍSTICA, COMPRAS Y DIRECCIONES ---

  // Crea el pedido y descuenta existencias
  crearPedidoBackend(payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/api/pedidos/crear`, payload);
  }

  // NUEVO: Recupera la dirección guardada del usuario de la tabla relacional
  obtenerDireccionUsuario(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/api/usuarios/${usuarioId}/direccion`);
  }

  // SECCIÓN 8: Trae el historial exclusivo de un cliente
  getPedidosCliente(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/api/usuarios/${usuarioId}/pedidos`);
  }

  // SECCIÓN 7: Trae el listado completo para el Administrador
  getPedidosAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/api/admin/pedidos`);
  }

  // SECCIÓN 7 (PUT): Cambia el flujo de entrega
  actualizarEstadoPedido(pedidoId: number, estado: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/api/admin/pedidos/${pedidoId}/estado`, { estado });
  }
}