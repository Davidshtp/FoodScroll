![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 👤 FoodScroll — Customer Service

El **Customer Service** es el modulo de **FoodScroll** encargado de todo lo relacionado con los **clientes** de la plataforma. Aqui se gestionan los perfiles de cada cliente, sus direcciones de entrega y sus avatares.

Piensa en este servicio como la **cartera digital** de cada cliente: guarda quien eres, donde vives y como contactarte para que puedas recibir tus pedidos sin problema.

---

## 🎯 ¿Que hace?

- **Perfil de cliente**: Cada cliente tiene un perfil con su nombre, telefono, fecha de nacimiento, genero y foto de avatar.
- **Direcciones de entrega**: Los clientes pueden registrar una o varias direcciones con ubicacion geografica (latitud/longitud) para que los repartidores sepan exactamente donde entregar.
- **Avatares personalizados**: Los clientes pueden subir una foto de perfil que se almacena en Cloudinary, o usar un avatar generado automaticamente con sus iniciales.
- **Prevencion de direcciones duplicadas**: No permite registrar dos direcciones que esten a menos de 30 metros una de la otra (ideal para evitar confusiones).
- **Onboarding progresivo**: Acompania al cliente en su registro inicial, guiandolo paso a paso para completar su perfil.

---

## 🧩 Flujos que puedes realizar

### 🆕 Registro de perfil

```
1. Te registras en la plataforma (Identity Service)
2. Creas tu perfil de cliente → POST /customer-profile
   └─ Nombre, apellido, telefono, fecha de nacimiento, genero
   └─ Se genera un avatar automatico con tus iniciales
3. Agregas tu primera direccion → POST /address
   └─ Direccion, barrio, coordenadas, ciudad
   └─ ¡Listo! Ya puedes empezar a pedir
```

### 📍 Gestionar direcciones

| Que puedes hacer | Como |
|-----------------|------|
| Agregar una nueva direccion | `POST /address` |
| Ver todas tus direcciones guardadas | `GET /address` |
| Editar una direccion (alias, barrio, detalles) | `PATCH /address/:id` |
| Eliminar una direccion | `DELETE /address/:id` |

### 🖼️ Personalizar avatar

| Que puedes hacer | Como |
|-----------------|------|
| Subir una foto de perfil | `PATCH /customer-profile/avatar` (multipart) |
| Eliminar tu foto y volver al avatar por defecto | `DELETE /customer-profile/avatar` |

### 👀 Consultar perfil publico

Otros servicios (como el de pedidos o restaurantes) pueden consultar tu perfil publico para mostrar tu nombre y foto sin necesidad de compartir informacion sensible.

---

## 🗺️ Sistema de direcciones inteligente

Cada direccion registrada incluye:
- **Coordenadas exactas** (latitud / longitud)
- **Direccion escrita** (calle, carrera, etc.)
- **Barrio** para referencia
- **Alias** personalizado (ej: "Casa", "Trabajo", "Apartamento")

El sistema **no permite** registrar dos direcciones que esten a menos de 30 metros una de la otra, evitando direcciones duplicadas que podrian causar confusion en las entregas.

---

## 📡 Conexiones

- **Cloudinary**: Almacenamiento de avatares (imagenes de perfil).
- **Identity Service**: Consulta y actualiza el estado de onboarding del cliente (perfil completado, direcciones registradas).
- **Gateway**: Recibe las peticiones de los clientes a traves del Gateway.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **MySQL** y arquitectura **Clean Architecture**:

- **TypeORM** para la base de datos
- **Cloudinary** para almacenamiento de imagenes
- **ui-avatares.com** para avatares generados por defecto
- **Formula de Haversine** para deteccion de direcciones duplicadas por proximidad geografica

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
