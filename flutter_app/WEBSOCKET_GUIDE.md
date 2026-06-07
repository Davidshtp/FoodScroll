# 📡 Guía de WebSocket (Tiempo Real) — Frontend

## ¿Qué es esto?

Es un sistema de **notificaciones en tiempo real**. Cada vez que una orden cambia de estado (ej: de PENDING → CONFIRMED), el servidor emite un evento y todos los clientes conectados a esa orden lo reciben al instante, sin necesidad de recargar la página ni hacer polling.

## Arquitectura

```
App Flutter          Gateway (puerto 3000)         Orders Service (puerto 5567)
   │                       │                              │
   │── WebSocket ─────────►│── proxy /socket.io ─────────►│
   │                       │                              │
   │◄── order.status.updated ─────────────────────────────│
```

> **Importante**: La conexión WebSocket se hace SIEMPRE al **gateway** (`localhost:3000`), NUNCA directo al orders-service. El gateway se encarga de reenviar el tráfico.

## 1. Instalación

### Flutter (Dart)

Agregar al `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.0
```

### Web (JavaScript/TypeScript)

```bash
npm install socket.io-client
# o
yarn add socket.io-client
```

## 2. Conectar al WebSocket

### Requisito: tener un token JWT válido

Primero el usuario debe iniciar sesión:

```
POST http://localhost:3000/api/auth/login
Body: {
  "email": "correo@ejemplo.com",
  "password": "Test123!",
  "client": "customer"
}
Respuesta: {
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  ...
}
```

Ese `access_token` es el que usaremos para autenticar el WebSocket.

### Conectar (Flutter)

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebSocketService {
  late IO.Socket socket;
  final String token; // el access_token del login

  WebSocketService(this.token) {
    socket = IO.io(
      'http://localhost:3000', // SIEMPRE el gateway
      IO.OptionBuilder()
        .setAuth({'token': token})
        .setTransports(['websocket']) // evitar polling largo
        .build(),
    );

    socket.onConnect((_) {
      print('Conectado al WebSocket');
    });

    socket.onDisconnect((_) {
      print('Desconectado del WebSocket');
    });

    socket.onConnectError((error) {
      print('Error de conexión: $error');
    });

    socket.connect();
  }

  void dispose() {
    socket.disconnect();
  }
}
```

### Conectar (Web / JS)

```js
import { io } from 'socket.io-client';

const token = localStorage.getItem('access_token');

const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket'],
});

socket.on('connect', () => console.log('Conectado'));
socket.on('disconnect', () => console.log('Desconectado'));
socket.on('connect_error', (err) => console.error('Error:', err.message));
```

## 3. Unirse al canal de una orden

Para recibir eventos de una orden específica, **primero debes unirte a su sala (room)**.

Hazlo cuando el usuario entre a la pantalla de detalle de la orden:

```dart
// Flutter
socket.emit('joinOrderRoom', {'orderId': 'e7c4d832-d9a7-4a80-8f5c-0c2a2442bbcd'});
```

```js
// Web
socket.emit('joinOrderRoom', { orderId: 'e7c4d832-d9a7-4a80-8f5c-0c2a2442bbcd' });
```

Y cuando el usuario salga de la pantalla, **abandona la sala** para no recibir eventos innecesarios:

```dart
// Flutter
socket.emit('leaveOrderRoom', {'orderId': 'e7c4d832-d9a7-4a80-8f5c-0c2a2442bbcd'});
```

```js
// Web
socket.emit('leaveOrderRoom', { orderId: 'e7c4d832-d9a7-4a80-8f5c-0c2a2442bbcd' });
```

> **Tip**: Si el usuario es restaurante y quiere escuchar TODAS sus órdenes activas, llama a `joinOrderRoom` por cada orden al cargar la lista.

## 4. Escuchar los eventos

Una vez unido al room, escuchas el evento `order.status.updated`:

### Flutter

```dart
socket.on('order.status.updated', (data) {
  final payload = data as Map<String, dynamic>;
  final event = payload['event'];          // "order.status.updated"
  final orderData = payload['data'];       // los datos de la orden
  final status = orderData['status'];      // ej: "CONFIRMED"
  final orderId = orderData['orderId'];

  print('Orden $orderId cambió a $status');

  // Actualizar UI, mostrar notificación, etc.
  // Ej con Riverpod:
  // ref.read(orderStatusProvider.notifier).updateStatus(orderId, status);
});
```

### Web (JS)

```js
socket.on('order.status.updated', (payload) => {
  const { event, data } = payload;
  const { orderId, status, timestamp } = data;

  console.log(`Orden ${orderId} cambió a ${status}`);

  // Actualizar UI, mostrar toast, etc.
  showNotification(`Tu orden ${status.toLowerCase()}`);
});
```

## 5. Payload completo que recibes

Cuando llega `order.status.updated`, esto es lo que trae adentro:

```json
{
  "event": "order.status.updated",
  "data": {
    "orderId": "e7c4d832-d9a7-4a80-8f5c-0c2a2442bbcd",
    "status": "CONFIRMED",
    "customerId": "6c0b410c-8d13-4d6f-8d65-df305665d866",
    "restaurantId": "a1b2c3d4-...",
    "deliveryId": null,
    "totalAmount": 350.00,
    "orderItems": [
      {
        "menuItemId": "item-001",
        "name": "Hamburguesa Clásica",
        "quantity": 2,
        "unitPrice": 150.00
      }
    ],
    "timestamp": "2026-06-07T14:28:20.000Z"
  }
}
```

### Mapeo del status

| Valor | Significado | Qué hacer en UI |
|-------|-------------|----------------|
| `PENDING` | Pendiente | Mostrar reloj de espera |
| `CONFIRMED` | Confirmado por restaurante | Mostrar "Orden confirmada" |
| `PREPARING` | En preparación | Mostrar "Cocinando..." |
| `READY_FOR_PICKUP` | Listo para recoger | Botón "Marcar como entregado" (delivery) |
| `ACCEPTED` | Delivery aceptó | Mostrar "Delivery asignado" |
| `OUT_FOR_DELIVERY` | En camino | Mostrar mapa / tracking |
| `DELIVERED` | Entregado | Mostrar "¡Recibido!" |
| `CANCELLED` | Cancelado | Mostrar motivo de cancelación |
| `REFUNDED` | Reembolsado | Mostrar "Reembolso procesado" |

## 6. Ciclo de vida completo del WebSocket

```
Conectar
   │
   ├─ on('connect')         →  Conectado exitosamente
   ├─ on('connect_error')   →  Token inválido / servidor caído
   ├─ on('disconnect')      →  Perdiste conexión
   │
   ├─ EMITIR: joinOrderRoom     →  Unirse al canal de una orden
   ├─ EMITIR: leaveOrderRoom    →  Salir del canal
   │
   └─ ESCUCHAR: order.status.updated  →  Cambio de estado en tiempo real
```

## 7. Implementación recomendada en Flutter

### Estructura de carpetas sugerida

```
lib/
├── services/
│   └── websocket_service.dart     # Servicio singleton de conexión
├── models/
│   └── order_event.dart           # Modelo para los eventos
└── providers/
    └── order_provider.dart        # Riverpod que escucha eventos y actualiza estado
```

### Ejemplo con Riverpod

```dart
// websocket_service.dart
class WebSocketService {
  IO.Socket? _socket;

  void connect(String token) {
    _socket = IO.io('http://localhost:3000', IO.OptionBuilder()
        .setAuth({'token': token})
        .setTransports(['websocket'])
        .build());
    _socket!.connect();
  }

  void joinOrder(String orderId) {
    _socket?.emit('joinOrderRoom', {'orderId': orderId});
  }

  void leaveOrder(String orderId) {
    _socket?.emit('leaveOrderRoom', {'orderId': orderId});
  }

  void onOrderUpdate(void Function(Map<String, dynamic>) callback) {
    _socket?.on('order.status.updated', (data) {
      callback(data as Map<String, dynamic>);
    });
  }

  void disconnect() {
    _socket?.disconnect();
  }
}

// order_provider.dart
final webSocketService = WebSocketService();

final orderStatusProvider = StateNotifierProvider<OrderStatusNotifier, Map<String, String>>((ref) {
  return OrderStatusNotifier();
});

class OrderStatusNotifier extends StateNotifier<Map<String, String>> {
  OrderStatusNotifier() : super({}) {
    webSocketService.onOrderUpdate((data) {
      final orderId = data['data']['orderId'] as String;
      final status = data['data']['status'] as String;
      state = {...state, orderId: status};
    });
  }
}
```

## 8. Posibles errores y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `connect_error: jwt expired` | Token expiró | Pedir nuevo token con refresh o re-login |
| `connect_error: No token provided` | No enviaste token | Agregar `auth: { token }` en la conexión |
| No llegan eventos | No te uniste al room | Llamar `joinOrderRoom` con el ID correcto |
| `disconnect` | Servidor cerró conexión | Socket.IO reconecta automáticamente |
| Error de CORS | Usaste URL incorrecta | Asegúrate de conectar a `localhost:3000` (gateway) |
