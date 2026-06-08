# FoodScroll

Plataforma de delivery de comida basada en arquitectura de microservicios.

---

## Requisitos

- **Node.js** y **npm**
- **Python 3.12**
- **Windows Terminal** (viene por defecto en Windows 11)
- **MySQL** (puerto 3306)
- **PostgreSQL** (puerto 5432)
- **MongoDB** (puerto 27017)
- **Neo4j** (puerto 7697)
- **Redis** (puerto 6379)

---

## Servicios

| # | Servicio | Puerto | Tecnologia | Base de datos |
|---|----------|--------|------------|---------------|
| 1 | **Gateway** | 3000 | NestJS (TS) | - |
| 2 | **Identity Service** | 5560 | NestJS (TS) | MySQL |
| 3 | **Customer Service** | 5561 | NestJS (TS) | MySQL |
| 4 | **Location Service** | 5562 | NestJS (TS) | MySQL |
| 5 | **Delivery Service** | 5563 | NestJS (TS) | MySQL |
| 6 | **Restaurant Service** | 5564 | NestJS (TS) | PostgreSQL |
| 7 | **Publications Service** | 5565 | NestJS (TS) | MongoDB |
| 8 | **Engagement Service** | 5566 | NestJS (TS) | Neo4j + Redis + MongoDB |
| 9 | **Orders Service** | 5567 | NestJS (TS) | MySQL + Socket.IO |
| 10 | **Python Scraper (RUNT)** | 5591 | FastAPI (Python) | - |
| 11 | **Python License Scraper** | 5592 | FastAPI (Python) | - |

**Flutter App** se encuentra en `flutter_app/`.

---

## Inicio rapido

Desde la carpeta raiz ejecuta:

```bash
.\start-services.bat
```

Esto abrira **Windows Terminal** con **11 pestañas**, una para cada microservicio.

---

## Servicios individuales

### Node.js (NestJS)

```bash
cd <nombre-del-servicio>
npm install
npm run start:dev
```

### Python

```bash
cd python-scraper
python main.py
```

---

## Estructura del proyecto

```
FoodScroll/
├── gateway/                    (API Gateway - Puerto 3000)
├── identity-service/           (Identidad - Puerto 5560)
├── customer-service/           (Clientes - Puerto 5561)
├── location-service/           (Ubicacion - Puerto 5562)
├── delivery-service/           (Entregas - Puerto 5563)
├── restaurant-service/         (Restaurantes - Puerto 5564)
├── publications-service/       (Publicaciones - Puerto 5565)
├── engagement-service/         (Likes/Seguidores/Comentarios - Puerto 5566)
├── orders-service/             (Pedidos - Puerto 5567)
├── python-scraper/             (Scraper RUNT - Puerto 5591)
├── python-license-scraper/     (Scraper Licencias - Puerto 5592)
├── flutter_app/                (App movil Flutter)
├── start-service.bat           (Iniciar todos los servicios)
└── README.md
```
