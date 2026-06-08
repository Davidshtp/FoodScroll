![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# ❤️ FoodScroll — Engagement Service

El **Engagement Service** es el modulo social de **FoodScroll**. Aqui se gestionan los **likes**, los **seguidores** y los **comentarios** de la plataforma. Es lo que hace que FoodScroll no sea solo un servicio de domicilios, sino una red social donde los usuarios interactuan con los restaurantes y entre si.

Piensa en este servicio como el **corazon social** de FoodScroll: permite que los clientes muestren aprecio por las publicaciones, sigan a sus restaurantes favoritos y comenten los platos que les gustan.

---

## 🎯 ¿Que hace?

- **Likes**: Los clientes y restaurantes pueden dar "me gusta" a las publicaciones. Cada publicacion muestra cuantos likes tiene y si el usuario actual le dio like.
- **Seguidores**: Los clientes pueden seguir a otros usuarios (restaurantes u otros clientes) para ver su contenido en el feed.
- **Comentarios**: Los usuarios pueden comentar las publicaciones, con soporte para respuestas en hilos.
- **Recomendacion social**: El sistema puede decir que publicaciones les gustaron a los usuarios que sigues (para el feed).

---

## 🧩 Flujos que puedes realizar

### ❤️ Likes

| Que puedes hacer | Como |
|-----------------|------|
| Dar o quitar "me gusta" a una publicacion | `POST /likes/toggle/:publicationId` |
| Ver cuantos likes tiene una publicacion | `GET /likes/count/:publicationId` |
| Ver si ya le diste like | `GET /likes/check/:publicationId` |

```
💡 Dar like: 1 click → se activa ❤️ → el contador sube
💡 Quitar like: 1 click → se desactiva 🤍 → el contador baja
```

### 👥 Seguidores

| Que puedes hacer | Como |
|-----------------|------|
| Seguir a un usuario | `POST /followers/:userId` |
| Dejar de seguir | `DELETE /followers/:userId` |
| Ver seguidores de alguien | `GET /followers/:userId` |
| Ver a quien sigues | `GET /followers/following/:userId` |
| Ver seguidores en comun | `GET /followers/mutual/:userId` |

```
💡 Ejemplo: Si sigues a "Pizza House" y a "Sushi Roll",
           las publicaciones de ambos apareceran en tu feed
```

### 💬 Comentarios

| Que puedes hacer | Como |
|-----------------|------|
| Comentar una publicacion | `POST /comments` |
| Ver comentarios de una publicacion | `GET /comments/:publicationId` |
| Ver cuantos comentarios tiene | `GET /comments/:publicationId/count` |
| Eliminar tu comentario | `DELETE /comments/:id` |

Los comentarios soportan **respuestas en hilo**: puedes responder a un comentario existente usando el `parentId`.

---

## 🗄️ ¿Como almacena los datos?

Este servicio usa **3 bases de datos diferentes**, cada una optimizada para lo que hace:

| Base de datos | Que guarda | Por que |
|---------------|-----------|---------|
| **Neo4j** 🕸️ | Likes y seguidores | Es una base de datos de grafos, ideal para relaciones: "A le gusta B", "A sigue a B" |
| **Redis** ⚡ | Contadores y cache | Para que los likes y seguidores se actualicen al instante sin esperar |
| **MongoDB** 📄 | Comentarios | Los comentarios son documentos con texto, fechas y jerarquia (respuestas) |

Esto hace que las operaciones sean **rapidisimas**: cuando alguien da like, se actualiza Neo4j y Redis al mismo tiempo, y el contador se ve al instante.

---

## 📡 Conexiones

- **Customer Service**: Obtiene informacion del cliente (nombre, avatar) para mostrarla en los comentarios.
- **Restaurant Service**: Obtiene informacion del restaurante (nombre, logo) para los comentarios.
- **Publications Service**: Consultada para saber de que publicaciones obtener likes.
- **Gateway**: Recibe peticiones a traves del Gateway.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript) y **3 bases de datos**:

- **Neo4j** (grafos) — Likes y relaciones de seguimiento
- **Redis** (cache) — Contadores en tiempo real
- **MongoDB** (documentos) — Comentarios con soft-delete

Arquitectura **Clean Architecture** con puertos y adaptadores para cada base de datos.

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
