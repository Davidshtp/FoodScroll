![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 📍 FoodScroll — Location Service

El **Location Service** es el mapa interno de **FoodScroll**. Este servicio contiene toda la informacion geografica de Colombia: sus 32 departamentos y mas de 1.100 municipios, ademas de convertir coordenadas en direcciones reales.

Piensa en el como el **guia turistico** de la plataforma: sabe exactamente donde queda cada lugar y puede decirte en que ciudad y departamento estas basado en tu ubicacion.

---

## 🗺️ ¿Que hace?

- **Catalogo de ubicaciones**: Tiene precargados todos los departamentos y ciudades de Colombia para que los usuarios puedan seleccionar su ubicacion al registrarse.
- **Geocodificacion inversa**: Convierte coordenadas GPS (latitud/longitud) en direcciones legibles usando OpenStreetMap. Esto permite que cuando un cliente agrega una direccion, el sistema sepa automaticamente en que ciudad y departamento se encuentra.
- **Referencia para otros servicios**: Los demas microservicios (clientes, restaurantes, repartidores) consultan aqui para validar direcciones y obtener informacion geografica.

---

## 🧩 Flujos que puedes realizar

### 🏙️ Consultar ubicaciones disponibles

| Que puedes hacer | Como |
|-----------------|------|
| Ver todos los departamentos de Colombia | `GET /department` |
| Ver todas las ciudades de un departamento | `GET /city/by-department/:departmentId` |
| Ver informacion de una ciudad especifica | `GET /city/:id` |

### 🌐 Convertir coordenadas a direccion

```
1. Tomas las coordenadas GPS (latitud, longitud)
2. Consultas → GET /geocode/reverse?latitude=...&longitude=...
3. El servicio te devuelve:
   └─ Direccion principal (calle, carrera, numero)
   └─ Ciudad a la que pertenece
   └─ ID interno de la ciudad (para validacion)
```

Esto permite que cuando un cliente marca en el mapa donde quiere recibir su pedido, el sistema sepa exactamente en que ciudad y departamento esta sin que el usuario tenga que escribirlo manualmente.

---

## 🇨🇴 Datos precargados

El servicio ya viene con todos los datos geograficos de Colombia precargados automaticamente la primera vez que se inicia:

| Dato | Cantidad |
|------|----------|
| Departamentos | 32 |
| Ciudades / Municipios | ~1.100 |
| Cobertura | Todo el territorio colombiano |

Esto incluye desde **Amazonas** hasta **Vichada**, pasando por todas las capitales departamentales y municipios principales.

---

## 📡 Conexiones

- **Nominatim (OpenStreetMap)**: Servicio externo de geocodificacion que convierte coordenadas en direcciones reales. Se consulta en espanol para mejor precision con direcciones colombianas.
- **Gateway**: Recibe peticiones a traves del Gateway.
- **Customer Service y Restaurant Service**: Utilizan este servicio para validar y enriquecer direcciones.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **MySQL** y arquitectura **Clean Architecture**:

- **TypeORM** para la base de datos
- **Nominatim API** (OpenStreetMap) para geocodificacion inversa
- **Seed data** automatica al primer inicio con todos los datos de Colombia

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
