![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🐳 FoodScroll — Docker

La infraestructura completa de **FoodScroll** corre en **Docker** y esta dividida en dos pilas independientes:

| Pila | Archivo | Que incluye |
|------|---------|-------------|
| **Infraestructura** | `docker-compose.infrastructure.yml` | Bases de datos (MySQL, PostgreSQL, MongoDB, Neo4j, Redis) |
| **Aplicacion** | `docker-compose.application.yml` | Microservicios NestJS, scrapers Python, Nginx, Gateway |

Cada pila puede levantarse por separado. Las bases de datos se levantan primero y los microservicios se conectan a ellas.

---

## 🏗️ Construir todo

### 1. Infraestructura (bases de datos)

```powershell
docker compose -f docker-compose.infrastructure.yml up -d --build
```

Esto levanta:
- **MySQL** (feedgo-mysql) — identidad, clientes, domicilios, pedidos
- **PostgreSQL** (feedgo-postgres) — restaurantes
- **MongoDB** (feedgo-mongodb) — publicaciones, engagement
- **Neo4j** (feedgo-neo4j) — recomendaciones y relaciones
- **Redis** (feedgo-redis) — colas y cache

### 2. Aplicacion (microservicios)

```powershell
docker compose -f docker-compose.application.yml up -d --build
```

Esto levanta:
- **Nginx** (feedgo-nginx) — proxy inverso con SSL
- **Gateway** (feedgo-gateway) — puerta de entrada unica (puerto 3000)
- **Identity Service** (feedgo-identity) — autenticacion (5560)
- **Customer Service** (feedgo-customer) — clientes (5561)
- **Location Service** (feedgo-location) — ubicaciones (5562)
- **Delivery Service** (feedgo-delivery) — repartidores (5563)
- **Restaurant Service** (feedgo-restaurant) — restaurantes (5564)
- **Publications Service** (feedgo-publications) — publicaciones (5565)
- **Engagement Service** (feedgo-engagement) — interacciones (5566)
- **Orders Service** (feedgo-orders) — pedidos (5567)
- **Python Scraper** (feedgo-python-scraper) — consulta vehiculos RUNT (5591)
- **Python License Scraper** (feedgo-python-license-scraper) — consulta licencias RUNT (5592)

---

## 🚀 Comandos principales

### Construir desde cero (sin cache)

```powershell
# Infraestructura
docker compose -f docker-compose.infrastructure.yml build --no-cache

# Aplicacion
docker compose -f docker-compose.application.yml build --no-cache
```

### Construir un servicio especifico

```powershell
docker compose -f docker-compose.application.yml build delivery-service
docker compose -f docker-compose.application.yml up -d --no-deps --force-recreate delivery-service
```

### Iniciar todo

```powershell
# Solo bases de datos
docker compose -f docker-compose.infrastructure.yml up -d

# Todo completo (infra + app)
docker compose -f docker-compose.infrastructure.yml up -d -f docker-compose.infrastructure.yml
docker compose -f docker-compose.application.yml up -d
```

### Detener todo

```powershell
# Solo aplicacion (las bases siguen corriendo)
docker compose -f docker-compose.application.yml down

# Todo (incluye bases de datos — los datos persisten en volumenes)
docker compose -f docker-compose.application.yml down
docker compose -f docker-compose.infrastructure.yml down

# Todo y eliminar volumenes (⚠️ borra TODOS los datos)
docker compose -f docker-compose.application.yml down -v
docker compose -f docker-compose.infrastructure.yml down -v
```

### Reiniciar un servicio

```powershell
# Reconstruir y recrear un servicio especifico
docker compose -f docker-compose.application.yml build delivery-service
docker compose -f docker-compose.application.yml up -d --no-deps --force-recreate delivery-service
```

> ⚠️ `docker compose restart` **NO** recarga las variables de entorno. Usa `up -d --force-recreate` para que los cambios en `.env` surtan efecto.

---

## 📋 Ver logs

### Todos los servicios de la aplicacion

```powershell
docker compose -f docker-compose.application.yml logs -f
```

### Un servicio especifico

```powershell
docker compose -f docker-compose.application.yml logs -f delivery-service
docker compose -f docker-compose.application.yml logs -f python-license-scraper
```

### Ultimas N lineas

```powershell
docker compose -f docker-compose.application.yml logs --tail=50 -f delivery-service
```

### Logs de infraestructura

```powershell
docker compose -f docker-compose.infrastructure.yml logs -f mysql
docker compose -f docker-compose.infrastructure.yml logs -f neo4j
```

---

## 🔍 Monitoreo

### Estado de todos los contenedores

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Uso de recursos

```powershell
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"
```

### Eventos de Docker (OOM, muertes, etc.)

```powershell
docker events --since 30m --filter event=oom
docker events --since 30m --filter event=die
```

### Health check de la aplicacion

```powershell
curl -sk https://localhost/api/health
```

---

## 🔧 Comandos utiles

### Acceder a MySQL desde el contenedor

```powershell
docker exec -i feedgo-mysql mysql -u root -p40781889 <base-de-datos> -e "SELECT * FROM user;"
```

### Inspeccionar variables de entorno de un contenedor

```powershell
docker exec feedgo-delivery sh -c 'echo "URL=$LICENSE_VERIFICATION_SERVICE_URL"'
```

### Ver resolucion DNS entre contenedores

```powershell
docker exec feedgo-delivery sh -c 'getent hosts python-license-scraper'
```

### Recrear solo un servicio (sin cache)

```powershell
docker compose -f docker-compose.application.yml build --no-cache python-license-scraper
docker compose -f docker-compose.application.yml up -d --no-deps --force-recreate python-license-scraper
```

---

## ⚠️ Notas importantes

1. **Primero la infraestructura**: Espera a que las bases de datos esten `healthy` antes de levantar la aplicacion.
2. **Las variables de entorno**: Se cargan desde `docker/.env` (comun) + el `.env` de cada servicio. Los valores en `environment:` del compose **sobrescriben** al `.env`.
3. **Los datos persisten**: Aunque detengas los contenedores, los datos de las bases quedan en volumenes Docker.
4. **SSL**: Los certificados de desarrollo estan en `nginx/certs/`. Se generaron con `mkcert`.
5. **Scrapers Python**: Consumen mucha RAM (~700 MiB cada uno en reposo). Si ves `exitCode=137` es un OOM — aumenta la memoria de Docker Desktop o reduce los modelos cargados.

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
