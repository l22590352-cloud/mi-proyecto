from flask import Flask, request, jsonify
from config import get_connection
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================================
# SECCIÓN 1: AUTENTICACIÓN (LOGIN Y REGISTRO PÚBLICO)
# ==========================================================

@app.route('/register', methods=['POST'])
def register():
    """Registra un nuevo usuario (usado por Admin y por Registro Público)"""
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO usuarios (nombre, correo, telefono, password, rol_id) 
            VALUES (?, ?, ?, ?, ?)
        """
        cursor.execute(query, (
            data['nombre'], 
            data['correo'], 
            data.get('telefono'), 
            data['password'], 
            data.get('rol_id', 2) # Por defecto 2 (Cliente)
        ))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Usuario registrado exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    """Verifica credenciales y devuelve datos del usuario"""
    data = request.get_json()
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT id, nombre, correo, rol_id FROM usuarios WHERE correo = ? AND password = ?"
    cursor.execute(query, (data['correo'], data['password']))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            'mensaje': 'Login exitoso',
            'usuario': {
                'id': row[0],
                'nombre': row[1],
                'correo': row[2],
                'rol_id': row[3]
            }
        }), 200
    return jsonify({'mensaje': 'Credenciales incorrectas'}), 401


# ==========================================================
# SECCIÓN 2: GESTIÓN DE USUARIOS (PANEL ADMINISTRADOR)
# ==========================================================

@app.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    """Obtiene la lista de todos los usuarios para la tabla del Dashboard"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, correo, rol_id, fecha_registro FROM usuarios")
        usuarios = []
        for row in cursor.fetchall():
            usuarios.append({
                'id': row[0],
                'nombre': row[1],
                'correo': row[2],
                'rol_id': row[3],
                'fecha_registro': row[4]
            })
        conn.close()
        return jsonify(usuarios), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================================
# SECCIÓN 3: GESTIÓN DE ROLES
# ==========================================================

@app.route('/roles', methods=['GET'])
def obtener_roles():
    """Trae los roles disponibles (Admin, Cliente, etc.)"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre FROM roles")
    roles = [{'id': row[0], 'nombre': row[1]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(roles)


# ==========================================================
# SECCIÓN 4: ESTADÍSTICAS DEL DASHBOARD (KPIs)
# ==========================================================

@app.route('/dashboard/stats', methods=['GET'])
def obtener_stats():
    """Devuelve los números para las tarjetitas del Dashboard"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Contar usuarios
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        total_usuarios = cursor.fetchone()[0]
        
        # Contar productos (Suponiendo que tienes la tabla 'productos')
        cursor.execute("SELECT COUNT(*) FROM productos")
        total_productos = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'usuarios': total_usuarios,
            'productos': total_productos,
            'ventas': 42, # Dato estático por ahora
            'alertas': 5  # Dato estático por ahora
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
    
    
# ==========================================================
# SECCIÓN 5: GESTIÓN DE PRODUCTOS
# ==========================================================
@app.route('/productos', methods=['GET'])
def obtener_productos():
    """Trae todos los productos con sus tallas, colores y categoría."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Consulta principal: Incluimos 'categoria' para el filtrado en Angular
        cursor.execute("SELECT id, nombre, descripcion, precio, stock, imagen, categoria FROM productos")
        productos = []
        
        for row in cursor.fetchall():
            p_id = row[0]
            
            # Consultar Tallas relacionadas
            cursor.execute("""
                SELECT t.nombre, pt.stock 
                FROM tallas t 
                JOIN producto_tallas pt ON t.id = pt.talla_id 
                WHERE pt.producto_id = ?
            """, (p_id,))
            tallas = [{'nombre': t[0], 'stock': t[1]} for t in cursor.fetchall()]
            
            # Consultar Colores relacionados
            cursor.execute("""
                SELECT c.nombre 
                FROM colores c 
                JOIN producto_colores pc ON c.id = pc.color_id 
                WHERE pc.producto_id = ?
            """, (p_id,))
            colores = [c[0] for c in cursor.fetchall()]

            # Armar objeto final
            productos.append({
                'id': p_id,
                'nombre': row[1],
                'descripcion': row[2],
                'precio': float(row[3]),
                'stock': row[4],
                'imagen': row[5],
                'categoria': row[6] or 'Accesorios', # Fallback si es null
                'tallas': tallas,
                'colores': colores
            })
            
        conn.close()
        return jsonify(productos), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/productos', methods=['POST'])
def crear_producto():
    """Registra un nuevo producto y sus relaciones de tallas/colores."""
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Insertar producto base
        cursor.execute("""
            INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('nombre'), 
            data.get('descripcion', ''), 
            data.get('precio', 0), 
            data.get('stock', 0), 
            data.get('imagen', ''),
            data.get('categoria', 'Accesorios')
        ))
        
        # Obtener el ID generado (MySQL)
        cursor.execute("SELECT LAST_INSERT_ID()")
        producto_id = cursor.fetchone()[0]

        # 2. Insertar tallas
        for t in data.get('tallas', []):
            cursor.execute("""
                INSERT INTO producto_tallas (producto_id, talla_id, stock) 
                VALUES (?, ?, ?)
            """, (producto_id, t.get('id'), t.get('stock', 0)))

        # 3. Insertar colores
        for c_id in data.get('colores', []):
            cursor.execute("""
                INSERT INTO producto_colores (producto_id, color_id) 
                VALUES (?, ?)
            """, (producto_id, c_id))

        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Producto creado con éxito', 'id': producto_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/productos/<int:id>', methods=['PUT', 'OPTIONS'])
def actualizar_producto(id):
    """Actualiza la información de un producto existente."""
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # 1. Actualizar tabla principal
        cursor.execute("""
            UPDATE productos 
            SET nombre=?, descripcion=?, precio=?, stock=?, imagen=?, categoria=?
            WHERE id=?
        """, (
            data.get('nombre'), 
            data.get('descripcion'), 
            data.get('precio'), 
            data.get('stock'), 
            data.get('imagen'),
            data.get('categoria'),
            id
        ))
        
        # 2. Refrescar Tallas (borrar e insertar)
        cursor.execute("DELETE FROM producto_tallas WHERE producto_id = ?", (id,))
        for t in data.get('tallas', []):
            cursor.execute("""
                INSERT INTO producto_tallas (producto_id, talla_id, stock) 
                VALUES (?, ?, ?)
            """, (id, t.get('id'), t.get('stock')))
            
        # 3. Refrescar Colores (borrar e insertar)
        cursor.execute("DELETE FROM producto_colores WHERE producto_id = ?", (id,))
        for c_id in data.get('colores', []):
            cursor.execute("""
                INSERT INTO producto_colores (producto_id, color_id) 
                VALUES (?, ?)
            """, (id, c_id))
            
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Producto actualizado con éxito'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/productos/<int:id>', methods=['DELETE'])
def eliminar_producto(id):
    """Borra un producto y limpia sus relaciones en otras tablas."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # Borrar primero las relaciones (por integridad referencial)
        cursor.execute("DELETE FROM producto_tallas WHERE producto_id = ?", (id,))
        cursor.execute("DELETE FROM producto_colores WHERE producto_id = ?", (id,))
        # Borrar el producto
        
        
        cursor.execute("DELETE FROM productos WHERE id = ?", (id,))
        
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Producto eliminado correctamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ==========================================================
# SECCIÓN 6: PROCESAMIENTO DE COMPRAS Y PEDIDOS (CHECKOUT)
# ==========================================================

@app.route('/api/usuarios/<int:usuario_id>/direccion', methods=['GET'])
def obtener_direccion_usuario(usuario_id):
    """Busca la dirección de envío auto-guardada del perfil del cliente"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Se prioriza la dirección marcada como principal, sino se obtiene el último registro activo
        query = """
            SELECT nombre_remitente, telefono, direccion, ciudad, estado, codigo_postal, notas
            FROM direcciones_usuario
            WHERE usuario_id = ?
            ORDER BY es_principal DESC, id DESC
            LIMIT 1
        """
        cursor.execute(query, (usuario_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify({
                'nombre_remitente': row[0],
                'telefono': row[1],
                'direccion': row[2],
                'ciudad': row[3],
                'estado': row[4],
                'codigo_postal': row[5],
                'notas': row[6]
            }), 200
        else:
            return jsonify(None), 200 # El usuario no posee direcciones registradas todavía
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/crear', methods=['POST'])
def crear_pedido():
    """Procesa la transacción del carrito, reduce existencias y persiste la dirección de entrega"""
    data = request.json
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Registrar Orden Principal
        query_pedido = "INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, 'En preparación')"
        cursor.execute(query_pedido, (data.get('usuario_id'), data.get('total')))
        
        cursor.execute("SELECT LAST_INSERT_ID()")
        pedido_id = cursor.fetchone()[0]

        # 2. Registrar los Datos de Envío Fijos del Pedido Actual
        query_envio = """
            INSERT INTO envios (pedido_id, nombre_cliente, telefono, direccion, ciudad, estado, codigo_postal, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query_envio, (
            pedido_id, data.get('nombre_cliente'), data.get('telefono'), data.get('direccion'),
            data.get('ciudad'), data.get('estado_envio'), data.get('codigo_postal'), data.get('notas', '')
        ))

        # 3. Guardar Desglose y Descontar Stock Relacional
        productos = data.get('productos', [])
        for item in productos:
            query_detalle = """
                INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario, talla, color)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            cursor.execute(query_detalle, (
                pedido_id, item['id'], item['cantidad'], item['precio'],
                item.get('tallaSeleccionada', ''), item.get('colorSeleccionado', '')
            ))

            talla_nombre = item.get('tallaSeleccionada')
            if talla_nombre:
                cursor.execute("SELECT id FROM tallas WHERE nombre = ?", (talla_nombre,))
                res_talla = cursor.fetchone()
                if res_talla:
                    talla_id = res_talla[0]
                    cursor.execute("""
                        UPDATE producto_tallas 
                        SET stock = stock - ? 
                        WHERE producto_id = ? AND talla_id = ?
                    """, (item['cantidad'], item['id'], talla_id))

        # 4. Guardar Automáticamente la Dirección si no se encuentra Duplicada
        usuario_id = data.get('usuario_id')
        direccion_capturada = data.get('direccion')

        cursor.execute(
            "SELECT id FROM direcciones_usuario WHERE usuario_id = ? AND direccion = ?", 
            (usuario_id, direccion_capturada)
        )
        existe_direccion = cursor.fetchone()

        if not existe_direccion:
            # Si es el primer registro de dirección para este cliente, la definimos como la principal
            cursor.execute("SELECT COUNT(*) FROM direcciones_usuario WHERE usuario_id = ?", (usuario_id,))
            cuenta_direcciones = cursor.fetchone()[0]
            es_primera = 1 if cuenta_direcciones == 0 else 0

            query_nueva_dir = """
                INSERT INTO direcciones_usuario 
                (usuario_id, nombre_remitente, telefono, direccion, ciudad, estado, codigo_postal, notas, es_principal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(query_nueva_dir, (
                usuario_id,
                data.get('nombre_cliente'),
                data.get('telefono'),
                direccion_capturada,
                data.get('ciudad'),
                data.get('estado_envio'),
                data.get('codigo_postal'),
                data.get('notas', ''),
                es_primera
            ))

        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Pedido completado con éxito', 'pedido_id': pedido_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================================
# SECCIÓN 7: LOGÍSTICA (PANEL DE ADMINISTRACIÓN DE ENVÍOS)
# ==========================================================

@app.route('/api/admin/pedidos', methods=['GET'])
def obtener_pedidos_admin():
    """Trae el listado logístico completo combinando información de envío"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT p.id, p.total, p.estado, p.fecha, u.nombre AS cliente,
                   e.direccion, e.ciudad, e.estado AS provincia, e.codigo_postal, e.telefono, e.notas
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            JOIN envios e ON p.id = e.pedido_id
            ORDER BY p.fecha DESC;
        """
        cursor.execute(query)
        
        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row[0],
                'total': float(row[1]),
                'estado': row[2],
                'fecha': row[3],
                'cliente': row[4],
                'direccion': row[5],
                'ciudad': row[6],
                'provincia': row[7],
                'codigo_postal': row[8],
                'telefono': row[9],
                'notas': row[10] # CORREGIDO: Indexación reparada de row[1] a row[10]
            })
        conn.close()
        return jsonify(pedidos), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/pedidos/<int:pedido_id>/estado', methods=['PUT'])
def actualizar_estado_pedido(pedido_id):
    """Permite al Admin cambiar los flujos de entrega"""
    data = request.json
    nuevo_estado = data.get('estado')
    
    if nuevo_estado not in ['En preparación', 'En camino', 'Entregado']:
        return jsonify({'error': 'Estado inválido'}), 400
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE pedidos SET estado = ? WHERE id = ?", (nuevo_estado, pedido_id))
        conn.commit()
        conn.close()
        return jsonify({'mensaje': 'Estado actualizado correctamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================================
# SECCIÓN 8: LOGÍSTICA (ENVIOS CLIENTES)
# ==========================================================

@app.route('/api/usuarios/<int:usuario_id>/pedidos', methods=['GET'])
def obtener_pedidos_usuario(usuario_id):
    """Obtiene el historial de compras de un cliente específico con su detalle de envío"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT p.id, p.total, p.estado, p.fecha, e.direccion, e.ciudad
            FROM pedidos p
            JOIN envios e ON p.id = e.pedido_id
            WHERE p.usuario_id = ?
            ORDER BY p.fecha DESC
        """
        cursor.execute(query, (usuario_id,))
        
        historial = []
        for row in cursor.fetchall():
            historial.append({
                'id': row[0],
                'total': float(row[1]),
                'estado': row[2],
                'fecha': row[3],
                'direccion': row[4],
                'ciudad': row[5]
            })
        conn.close()
        return jsonify(historial), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
if __name__ == '__main__':
   app.run(host='0.0.0.0', port=5000, debug=True)