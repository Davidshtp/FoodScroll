![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🛵 FoodScroll — Orders Service

El **Orders Service** es el modulo mas importante de **FoodScroll**: gestiona todo el ciclo de vida de los pedidos, desde que el cliente agrega productos al carrito hasta que el repartidor entrega la comida en la puerta de su casa.

Piensa en este servicio como el **centro de operaciones** de FoodScroll: coordina clientes, restaurantes y repartidores en tiempo real para que cada pedido llegue a donde tiene que llegar.

---

## 🎯 ¿Que hace?

- **Carrito de compras**: Los clientes agregan productos al carrito, pueden modificar cantidades, agregar observaciones y hacer checkout.
- **Ciclo de vida del pedido**: Cada pedido pasa por estados: Pendiente → Confirmado → Preparando → Listo → Aceptado por repartidor → En camino → Entregado.
- **Tracking en tiempo real**: Los clientes pueden ver en el mapa donde esta su repartidor mientras se acerca.
- **Gestion para restaurantes**: Los restaurantes ven los pedidos entrantes y pueden confirmarlos, rechazarlos o marcar cuando estan listos.
- **Gestion para repartidores**: Los repartidores ven pedidos disponibles cerca, los aceptan y actualizan el estado mientras entregan.

---

## 🧩 Flujos que puedes realizar

### 🛒 Como Cliente

```
1. Agregas productos al carrito → POST /cart/items
2. Revisas tu carrito → GET /cart
3. Haces checkout → POST /cart/checkout
   └─ Se crea un pedido por cada restaurante
4. Ves tus pedidos activos → GET /orders
5. Rastreas tu pedido en vivo → GET /orders/:id/track
   └─ Ves en el mapa donde esta tu repartidor
6. Recibes tu comida 🎉
7. Ves tu historial → GET /orders/history
```

### 🍔 Como Restaurante

```
1. Ves los pedidos entrantes → GET /orders/restaurant
2. Confirmas el pedido → POST /orders/:id/confirm
3. Preparas la comida → POST /orders/:id/preparing
4. Marcas como listo → POST /orders/:id/ready
   └─ Ahora un repartidor puede recogerlo
5. Ves historial → GET /orders/restaurant/history
```

### 🚴 Como Repartidor

```
1. Ves pedidos disponibles cerca → GET /orders/available
2. Aceptas un pedido → POST /orders/:id/accept
3. Recoges el pedido → POST /orders/:id/pickup
4. Vas en camino → tu ubicacion se comparte en vivo
5. Entregas el pedido → POST /orders/:id/deliver
6. Ves historial → GET /orders/delivery/history
```

---

## 🔄 Ciclo de vida de un pedido

```
Pendiente ─┬─> Confirmado ─> Preparando ─> Listo ─> Aceptado ─> En camino ─> Entregado
            │                                                              
            └─> Cancelado (cliente o restaurante)
```

Cada cambio de estado se refleja **al instante** en la aplicacion gracias a WebSockets (Socket.IO).

---

## 🗺️ Tracking en tiempo real

Cuando un repartidor acepta un pedido y va hacia el restaurante (y luego hacia el cliente), su ubicacion GPS se comparte en vivo:

```
📍 Repartidor se mueve → cada segundo se actualiza su posicion
   └─ Solo si se movio mas de 5 metros del punto anterior
   └─ Maximo 1 actualizacion por segundo
   
📱 Cliente ve en el mapa:
   └─ Donde esta el repartidor ahora
   └─ Ruta completa que ha recorrido
   └─ Distancia restante estimada
```

El historial de ruta se guarda en **Redis** por 24 horas.

---

## 🛡️ Seguridad

- Cada rol solo puede hacer lo que le corresponde:
  - **Cliente**: carrito, crear pedidos, cancelar, ver tracking
  - **Restaurante**: ver pedidos entrantes, confirmar, preparar, marcar listo
  - **Repartidor**: ver disponibles, aceptar, recoger, entregar
- No puedes ver pedidos que no te pertenecen
- El tracking solo lo ven los participantes del pedido

---

## 📡 Conexiones

- **Identity Service**: Verifica identidad de los usuarios.
- **Customer Service**: Obtiene datos del cliente y direccion de entrega.
- **Restaurant Service**: Obtiene informacion del restaurante y direccion.
- **Publications Service**: Obtiene datos de los productos (publicaciones).
- **Delivery Service**: Obtiene datos del repartidor asignado.
- **Location Service**: Obtiene nombres de ciudades.
- **Redis**: Almacena datos de tracking en tiempo real.
- **Gateway**: Recibe peticiones REST y WebSocket a traves del Gateway.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **MySQL** y **Redis**:

- **TypeORM** para MySQL (pedidos, carrito)
- **Socket.IO** para comunicacion en tiempo real
- **Redis** para tracking de ubicaciones GPS
- **ioredis** como cliente de Redis
- **Formula de Haversine** para calcular distancias

---

## 👥 Creditos

**FoodScroll** — Plataforma de delivery de comida desarrollada como proyecto integrador.

| Rol | Responsable |
|-----|-------------|
| **Desarrollo Backend** | David Medina, Edwin Agudelo |
| **Desarrollo Mobile** | Jose Pantoja, Felipe Fajardo |
| **Arquitectura** | David Medina, Edwin Agudelo, Jose Pantoja, Felipe Fajardo |
| **Scrapers Python** | David Medina |

---
*Documentacion generada para desarrolladores y colaboradores del proyecto.*
