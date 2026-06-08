![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 📸 FoodScroll — Publications Service

El **Publications Service** es el modulo de **FoodScroll** donde los restaurantes crean y comparten publicaciones (como posts de redes sociales) con sus platos y promociones. Tambien es el encargado de generar el **feed personalizado** que ve cada cliente.

Piensa en este servicio como el **Instagram de FoodScroll**: los restaurantes publican fotos de su comida y los clientes descubren que pedir a traves de un feed inteligente.

---

## 🎯 ¿Que hace?

- **Publicaciones de restaurantes**: Los restaurantes crean publicaciones con fotos (hasta 10 imagenes), titulo, descripcion, tipo y precio.
- **Feed personalizado**: Genera un timeline unico para cada cliente combinando:
  - Restaurantes cercanos a su ubicacion
  - Restaurantes que sigue
  - Publicaciones que le gustaron a gente que sigue
  - Explorar (publicaciones recientes de los ultimos 7 dias)
- **Enriquecimiento**: Cada publicacion en el feed muestra el nombre del restaurante, su logo, la distancia y la ciudad.

---

## 🧩 Flujos que puedes realizar

### 🍔 Como Restaurante

| Que puedes hacer | Como |
|-----------------|------|
| Crear una publicacion con fotos | `POST /publications` (multipart, hasta 10 imagenes) |
| Ver tus publicaciones | `GET /publications` |
| Ver una publicacion especifica | `GET /publications/:id` |
| Editar una publicacion | `PATCH /publications/:id` |
| Eliminar una publicacion | `DELETE /publications/:id` |

### 👀 Como Cliente

| Que puedes hacer | Como |
|-----------------|------|
| Ver tu feed personalizado | `GET /feed?page=1&limit=20&latitude=...&longitude=...` |

El feed se compila automaticamente combinando 4 fuentes:

1. **Cercanos** 🏪 — Restaurantes a menos de 10km de tu ubicacion
2. **Seguidos** 👥 — Publicaciones de restaurantes que sigues
3. **Gustados** ❤️ — Publicaciones que les gustaron a quienes sigues
4. **Explorar** 🔍 — Publicaciones recientes de restaurantes que aun no descubres

---

## 🖼️ Gestion de imagenes

Cada publicacion puede tener entre **1 y 10 imagenes**. Las imagenes se almacenan en **Cloudinary** y se pueden reemplazar individualmente al editar la publicacion.

```
Al crear: subes las fotos → se guardan en Cloudinary → se crea la publicacion
Al editar: puedes eliminar imagenes especificas y subir nuevas
Al eliminar: la publicacion se oculta (soft delete), las imagenes permanecen
```

---

## 📡 Conexiones

- **Cloudinary**: Almacenamiento de imagenes de publicaciones.
- **Restaurant Service**: Obtiene informacion del restaurante (nombre, logo, ubicacion).
- **Engagement Service**: Consulta likes y seguidores para personalizar el feed.
- **Location Service**: Obtiene nombres de ciudades para enriquecer el feed.
- **Gateway**: Recibe peticiones a traves del Gateway.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **MongoDB** y arquitectura **Clean Architecture**:

- **Mongoose** para MongoDB
- **Cloudinary** para almacenamiento de imagenes
- **Formula de Haversine** para calcular distancias en el feed
- **In-memory cache** para consultas frecuentes de ciudades

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
