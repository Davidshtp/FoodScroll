# FoodScroll

![FoodScroll Logo](flutter_app/assets/images/FOODSCROLLPNG.png)

**FoodScroll** es una plataforma integral de **domicilios de comida** desarrollada como proyecto integrador. Conecta **clientes** que quieren pedir comida, **restaurantes** que quieren vender sus platos y **repartidores** que realizan las entregas, todo en un solo ecosistema digital.

---

## ¿Que es FoodScroll?

FoodScroll nace con la idea de simplificar la experiencia de pedir domicilios en Colombia. No es solo una aplicacion de delivery: es una **plataforma completa** donde:

- 👤 **Los clientes** pueden descubrir restaurantes cercanos, ver sus publicaciones, armar un carrito, hacer pedidos y rastrear a su repartidor en tiempo real.
- 🍔 **Los restaurantes** pueden crear su perfil, publicar fotos de sus platos, gestionar sus horarios y recibir pedidos entrantes para aceptarlos o rechazarlos.
- 🚴 **Los repartidores** pueden registrarse con su vehiculo y licencia (verificados contra la base de datos del gobierno colombiano RUNT), ver pedidos disponibles cerca y entregar comida.
- 🔐 **Todo seguro**: con autenticacion JWT, roles de usuario bien definidos y comunicacion interna protegida entre servicios.

---

## ¿Para quien es?

| Para | Beneficio |
|------|-----------|
| **Usuarios finales** | App movil facil de usar para pedir comida de sus restaurantes favoritos |
| **Restaurantes** | Una vitrina digital para mostrar sus platos y recibir pedidos sin comisiones abusivas |
| **Repartidores** | Oportunidad de trabajo con registro sencillo y verificacion automatica de documentos |
| **Desarrolladores** | Arquitectura de microservicios lista para escalar y mejorar |

---

## ¿Que la hace especial?

A diferencia de otras plataformas de delivery, FoodScroll:

- **Verifica documentos automaticamente**: Los repartidores registran su vehiculo y licencia escaneandolos con la camara. El sistema consulta el RUNT (Registro Unico Nacional de Transito) para validar que todo este en regla.
- **Usa inteligencia artificial**: Resuelve captchas del gobierno colombiano automaticamente con modelos CNN entrenados a medida.
- **Tecnologia de punta**: 11 microservicios backend (NestJS + FastAPI), app movil Flutter, 5 bases de datos diferentes (MySQL, PostgreSQL, MongoDB, Neo4j, Redis) y comunicacion en tiempo real con Socket.IO.
- **Escalable**: Cada microservicio es independiente con su propia base de datos, permitiendo escalar solo lo que se necesita.

---

## Arquitectura

```
Cliente (Flutter App / HTTP) → Gateway (Puerto 3000) → Microservicios Backend
                                                          ↓
                                                  Bases de datos:
                                           MySQL | PostgreSQL | MongoDB | Neo4j | Redis
```

- **API Gateway** centraliza autenticacion JWT, rate limiting, y enruta peticiones a cada servicio
- **Comunicacion interna** via HTTP con `SERVICE_SECRET` compartido
- **Tiempo real** con Socket.IO para tracking de pedidos
- **Hexagonal Architecture** en servicios NestJS.

---

## Servicios

| # | Servicio | Puerto | Tecnologia | Base de datos | Proposito |
|---|----------|--------|------------|---------------|-----------|
| 1 | **Gateway** | 3000 | NestJS 11 (TS) | - | API gateway, JWT auth, rate limiting, WebSocket proxy |
| 2 | **Identity Service** | 5560 | NestJS 11 (TS) | MySQL | Autenticacion (email/password + Google OAuth), JWT, verificacion email |
| 3 | **Customer Service** | 5561 | NestJS 11 (TS) | MySQL | Perfiles de clientes, direcciones, avatares |
| 4 | **Location Service** | 5562 | NestJS 11 (TS) | MySQL | Departamentos, ciudades, geocodificacion inversa (Nominatim) |
| 5 | **Delivery Service** | 5563 | NestJS 11 (TS) | MySQL | Perfiles de repartidores, vehiculos, licencias, documentos |
| 6 | **Restaurant Service** | 5564 | NestJS 11 (TS) | PostgreSQL | Perfiles de restaurantes, direcciones, horarios, imagenes |
| 7 | **Publications Service** | 5565 | NestJS 11 (TS) | MongoDB | Publicaciones de restaurantes, generacion de feed |
| 8 | **Engagement Service** | 5566 | NestJS 11 (TS) | Neo4j + Redis + MongoDB | Likes, seguidores, comentarios (grafo social) |
| 9 | **Orders Service** | 5567 | NestJS 11 (TS) | MySQL + Redis | Carrito, pedidos, tracking en tiempo real via Socket.IO |
| 10 | **Python Scraper (RUNT)** | 5591 | FastAPI (Python) | - | Verificacion vehiculos via RUNT gobierno colombiano |
| 11 | **Python License Scraper** | 5592 | FastAPI (Python) | - | Verificacion licencias de conducir via RUNT |
| 12 | **Flutter App** | - | Flutter (Dart) | - | App movil multirol (Customer/Delivery/Restaurant) |

---

## Infraestructura de Bases de Datos

| Base de datos | Puerto | Usado por | Proposito |
|---------------|--------|-----------|-----------|
| **MySQL** | 3306 | Identity, Customer, Location, Delivery, Orders | Datos relacionales |
| **PostgreSQL** | 5432 | Restaurant | Datos relacionales con PostGIS |
| **MongoDB** | 27017 | Publications, Engagement | Documentos (publicaciones, comentarios) |
| **Neo4j** | 7697 | Engagement | Grafo social (likes, seguidores) |
| **Redis** | 6379 | Engagement, Orders | Cache y datos en tiempo real |

---

## Servicios Externos

| Servicio | Uso |
|----------|-----|
| **Cloudinary** | Hosting de imagenes (avatares, logos, banners, posts) |
| **Brevo (Sendinblue)** | Envio de emails (verificacion, recuperacion contrasena) |
| **Nominatim (OpenStreetMap)** | Geocodificacion inversa (coordenadas → direccion) |
| **Google OAuth** | Inicio de sesion con Google |
| **RUNT (Gobierno Colombia)** | Verificacion de vehiculos y licencias de conducir |

---

## Flujo de Autenticacion

1. El cliente se autentica via **Identity Service** (email/password o Google)
2. Se emite un **JWT** con el rol y ID del usuario
3. El **Gateway** valida el JWT y reenvia la peticion al servicio correspondiente
4. La comunicacion entre servicios usa la cabecera `SERVICE_SECRET`
5. Todos los servicios backend validan tanto JWT como service secret

---

## App Movil (Flutter)

- **Framework:** Flutter (Dart ^3.11.0)
- **Estado:** Riverpod (flutter_riverpod)
- **Routing:** go_router con redirects por autenticacion
- **HTTP:** Dio con interceptors JWT
- **Tiempo real:** socket_io_client
- **Mapas:** flutter_map (OpenStreetMap) + geolocator
- **Almacenamiento:** flutter_secure_storage, shared_preferences
- **Auth:** google_sign_in

### Roles de usuario
- **Customer:** Buscar restaurantes, ver publicaciones, carrito, pedidos, tracking
- **Delivery:** Ver pedidos disponibles, aceptar entregas, actualizar estado
- **Restaurant:** Gestionar perfil, crear publicaciones, gestionar pedidos

---

## Scrapers Python (Verificacion RUNT)

Ambos scrapers automatizan la verificacion de documentos en el portal publico del RUNT colombiano:

- **FastAPI** como framework web
- **Playwright** para automatizacion de navegador
- **PaddleOCR + PaddlePaddle** para reconocimiento de texto
- **CNN personalizado** para resolver captchas
- **Circuit Breaker** para tolerancia a fallos
- **Page Pool** para gestion de instancias de Playwright

### Endpoints
- `/runt/verify-full-auto` - Verificacion automatica completa
- `/runt/verify-manual` - Verificacion con captcha manual
- `/health` - Health check

---

## Inicio Rapido

### Prerrequisitos

- **Node.js** y **npm**
- **Python 3.12**
- **MySQL** (puerto 3306)
- **PostgreSQL** (puerto 5432)
- **MongoDB** (puerto 27017)
- **Neo4j** (puerto 7687)
- **Redis** (puerto 6379)
- **Windows Terminal** (para el script de inicio)

### Iniciar todos los servicios

```bash
.\start-services.bat
```

Esto abre **Windows Terminal** con **11 pestanas**, una para cada microservicio.

### Servicios individuales

**Node.js (NestJS):**
```bash
cd <servicio>
npm install
npm run start:dev
```

**Python (FastAPI):**
```bash
cd python-scraper
pip install -r requirements.txt
python main.py
```

**Flutter App:**
```bash
cd flutter_app
flutter pub get
flutter run
```

---

## Estructura del Proyecto

```
FoodScroll/
│
├── gateway/                        # API Gateway (NestJS) - Puerto 3000
├── identity-service/               # Autenticacion (NestJS) - Puerto 5560
├── customer-service/               # Clientes (NestJS) - Puerto 5561
├── location-service/               # Ubicacion (NestJS) - Puerto 5562
├── delivery-service/               # Repartidores (NestJS) - Puerto 5563
├── restaurant-service/             # Restaurantes (NestJS) - Puerto 5564
├── publications-service/           # Publicaciones (NestJS) - Puerto 5565
├── engagement-service/             # Likes/Seguidores/Comentarios (NestJS) - Puerto 5566
├── orders-service/                 # Pedidos (NestJS) - Puerto 5567
├── python-scraper/                 # Scraper RUNT Vehiculos (FastAPI) - Puerto 5591
├── python-license-scraper/         # Scraper RUNT Licencias (FastAPI) - Puerto 5592
├── flutter_app/                    # App movil Flutter
│
├── start-services.bat              # Script para iniciar todos los servicios
└── README.md
```

---

## 👥 Creditos

**FoodScroll** — Plataforma de delivery de comida desarrollada como proyecto integrador.

| Rol | Responsable |
|-----|-------------|
| **Desarrollo Backend** | David Medina, Edwin Agudelo |
| **Desarrollo Mobile** | Jose Pantoja, Felipe Fajardo |
| **Arquitectura** | David Medina, Edwin Agudelo, Jose Pantoja, Felipe Fajardo |
| **Scrapers Python** | David Medina |
