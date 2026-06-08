![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🚪 FoodScroll — API Gateway

El **API Gateway** es la puerta de entrada única a toda la plataforma **FoodScroll**. Todos los clientes —ya sea la app movil, un navegador o cualquier integracion externa— pasan por aqui para llegar a los microservicios internos.

Piensa en el Gateway como el **recepcionista** del edificio FoodScroll: verifica tu identificacion, se fija a que piso quieres ir, y te redirige al lugar correcto sin que tengas que saber como llegar por ti mismo.

---

## 🔐 ¿Que hace?

- **Autenticacion centralizada**: Valida que cada usuario sea quien dice ser mediante JWT (tokens de acceso). Si no tienes sesion, te deja pasar solo a los puntos publicos (registro, login, departamentos/ciudades).
- **Control de roles**: No es lo mismo un cliente que un repartidor o un restaurante. El Gateway sabe que tipo de usuario eres y te deja hacer solo lo que te corresponde.
- **Redireccion inteligente**: Cada peticion se reenvia al microservicio adecuado sin que el cliente tenga que conocer la arquitectura interna.
- **Proteccion contra abusos**: Limita la cantidad de peticiones por minuto para evitar usos malintencionados (por ejemplo, solo 5 intentos de registro por minuto, 10 de login).
- **Trazabilidad**: Asigna un ID unico (correlation-id) a cada solicitud para poder seguir el rastro de principio a fin.
- **Tiempo real**: Soporta conexiones WebSocket (Socket.IO) para actualizaciones en vivo del estado de los pedidos.

---

## 🧩 Flujos que puedes realizar

### 👤 Como visitante (sin sesion)

| Que puedes hacer | Como |
|-----------------|------|
| Crear una cuenta | `POST /api/auth/register` |
| Iniciar sesion | `POST /api/auth/login` |
| Iniciar sesion con Google | `POST /api/auth/google` |
| Recuperar contrasena | `POST /api/code/request-reset-code` |
| Ver departamentos y ciudades de Colombia | `GET /api/location/department` y `GET /api/location/city/...` |
| Verificar que el servidor esta vivo | `GET /api/health` |

### 🛒 Como Cliente

| Que puedes hacer | Como |
|-----------------|------|
| Gestionar tu perfil y direcciones | `POST/GET/PATCH /api/customer/profile` |
| Ver el feed de publicaciones de restaurantes | `GET /api/publications/feed` |
| Dar like, comentar y seguir restaurantes | `POST /api/engagement/likes/...`, `/comments/...`, `/followers/...` |
| Agregar productos al carrito | `POST /api/orders/cart/items` |
| Hacer checkout y crear pedidos | `POST /api/orders/cart/checkout` y `POST /api/orders` |
| Rastrear tu pedido en tiempo real | `GET /api/orders/:id/track` + WebSocket |

### 🚴 Como Repartidor

| Que puedes hacer | Como |
|-----------------|------|
| Registrar tu perfil, vehiculo y licencia | `POST /api/delivery/profile`, `/vehicle`, `/license/verify` |
| Ver pedidos disponibles cerca de ti | `GET /api/orders/available` |
| Aceptar un pedido y actualizar su estado | `POST /api/orders/:id/accept`, `/pickup`, `/deliver` |
| Ver tu historial de entregas | `GET /api/orders/delivery/history` |

### 🍔 Como Restaurante

| Que puedes hacer | Como |
|-----------------|------|
| Gestionar tu perfil, logo, banner y horarios | `POST/GET/PATCH /api/restaurant/profile` |
| Crear y administrar publicaciones | `POST/GET/PATCH/DELETE /api/restaurant/publications` |
| Ver pedidos entrantes y gestionarlos | `GET /api/orders/restaurant`, `POST /api/orders/:id/confirm` |
| Ver historial de pedidos | `GET /api/orders/restaurant/history` |

---

## 🛡️ Seguridad

- Todas las rutas requieren autenticacion **excepto** las marcadas como publicas (registro, login, ubicaciones).
- Los tokens JWT expiran y pueden ser revocados si el usuario cierra sesion.
- La comunicacion entre servicios se protege con una **clave secreta interna** (`x-service-secret`) que solo los microservicios conocen.
- Hay un **filtro global de errores** que normaliza las respuestas de error para que sean consistentes y no filtren informacion sensible.

---

## 📡 ¿Como se conecta con los demas servicios?

```
App Movil / Web
       │
       ▼
┌─────────────────────────────────────────────┐
│           API GATEWAY (Puerto 3000)          │
│  Autentica → Autoriza → Redirige → Responde │
└──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬─────┘
   │  │  │  │  │  │  │  │  │  │  │  │  │
   ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼
 ID  CU  LO  DE  RE  PU  EN  OR  PY  PY
     ST  CA  LI  ST  BL  GA  DE  -   -LI
     OM   T  VE  AU  IC  GE  RS  SC  CEN
     ER      RY  RA  AT  ME   -  RA  CE
               NT  IO  NT   SE  PE  NS
                    NS     RV  R   E-
                               ICE     SCR
                                        APE
                                        R
```

Cada microservicio vive independientemente con su propia base de datos. El Gateway es el unico que sabe donde queda cada uno.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), utiliza:
- **Passport + JWT** para autenticacion
- **Axios** para las llamadas entre servicios
- **Socket.IO** para comunicacion en tiempo real
- **Throttler** para limitacion de tasa

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
