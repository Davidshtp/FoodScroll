![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🍔 FoodScroll — Restaurant Service

El **Restaurant Service** es el modulo de **FoodScroll** encargado de gestionar todo lo relacionado con los **restaurantes** de la plataforma. Aqui los duenos de restaurantes crean su perfil, configuran su direccion, horarios de atencion y suben su logo y banner.

Piensa en este servicio como el **escaparate digital** de cada restaurante: muestra quien eres, donde quedas, cuando abres y como se ve tu negocio.

---

## 🎯 ¿Que hace?

- **Perfil de restaurante**: Cada restaurante tiene su perfil con nombre, descripcion, telefono, correo, logo y banner.
- **Direccion**: Los restaurantes registran su ubicacion exacta con coordenadas para que los clientes sepan donde estan y los repartidores puedan recoger los pedidos.
- **Horarios de atencion**: Cada restaurante configura sus horarios dia por dia (incluyendo cuales dias cierra).
- **Logo y banner**: Los restaurantes pueden subir su logo y una imagen de portada para personalizar su perfil.
- **Busqueda de restaurantes cercanos**: Los clientes pueden encontrar restaurantes cerca de su ubicacion.
- **Onboarding progresivo**: Guia al restaurante paso a paso para completar su perfil (datos basicos → direccion → horarios).

---

## 🧩 Flujos que puedes realizar

### 🆕 Registro completo de restaurante

```
Paso 1: Creas tu perfil → POST /restaurant
   └─ Nombre, descripcion, telefono, correo
   └─ Se genera un logo automatico con tus iniciales

Paso 2: Agregas tu direccion → PUT /restaurant/address
   └─ Direccion, ciudad, coordenadas (latitud/longitud)

Paso 3: Configuras horarios → PUT /restaurant/opening-hours
   └─ Horario para cada dia de la semana (abre/cierra)
   └─ Puedes marcar dias como cerrados

¡Listo! Cuando tengas direccion y todos los horarios configurados,
tu restaurante estara visible para los clientes.
```

### 🖼️ Personalizar imagen

| Que puedes hacer | Como |
|-----------------|------|
| Subir logo del restaurante | `PATCH /restaurant/logo` (multipart) |
| Eliminar logo (vuelve a iniciales) | `DELETE /restaurant/logo` |
| Subir banner de portada | `PATCH /restaurant/banner` (multipart) |
| Eliminar banner | `DELETE /restaurant/banner` |

### 📍 Configurar ubicacion

| Que puedes hacer | Como |
|-----------------|------|
| Ver tu direccion registrada | `GET /restaurant/address` |
| Crear o actualizar direccion | `PUT /restaurant/address` |

### 🕐 Configurar horarios

| Que puedes hacer | Como |
|-----------------|------|
| Ver tus horarios actuales | `GET /restaurant/opening-hours` |
| Actualizar horarios (los 7 dias) | `PUT /restaurant/opening-hours` |

### 👀 Perfil publico

Cualquier persona (sin necesidad de iniciar sesion) puede ver el perfil publico de un restaurante, incluyendo su direccion y horarios, a traves de:
```
GET /restaurant/public/:restaurantId
```

### 📍 Buscar restaurantes cercanos

Los servicios internos pueden buscar restaurantes cercanos a una ubicacion:
```
GET /restaurant/nearby?latitude=...&longitude=...&radius=10
```
Esto permite que los clientes vean restaurantes cerca de ellos.

---

## 🗺️ Sistema de horarios inteligente

Cada restaurante puede configurar sus horarios de atencion para toda la semana:

| Dia | Puede estar |
|-----|-------------|
| Lunes a Sabado | Abierto con horario definido, o cerrado |
| Domingo | Abierto con horario definido, o cerrado |

El sistema valida que la hora de cierre sea posterior a la hora de apertura.

---

## 📡 Conexiones

- **Cloudinary**: Almacenamiento de logos y banners de restaurantes.
- **Identity Service**: Sincroniza el estado de onboarding del restaurante.
- **Location Service**: Referencia para validar ciudades en las direcciones.
- **Gateway**: Recibe peticiones a traves del Gateway.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **PostgreSQL** y arquitectura **Clean Architecture**:

- **TypeORM** para la base de datos con PostgreSQL
- **Cloudinary** para imagenes (logos y banners)
- **UI Avatars** para logos generados por defecto
- **Unsplash** para banners generados por defecto
- **Formula de Haversine** para busqueda de restaurantes cercanos

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
