![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🚴 FoodScroll — Delivery Service

El **Delivery Service** es el modulo de **FoodScroll** encargado de gestionar todo lo relacionado con los **repartidores**. Aqui se registran, verifican sus documentos, registran sus vehiculos y se asegura de que cumplen con todos los requisitos para empezar a repartir.

Piensa en este servicio como el **departamento de recursos humanos** de los repartidores: verifica que tengan todo en regla (licencia, vehiculo, SOAT, tecnomecanica) antes de salir a la calle.

---

## 🎯 ¿Que hace?

- **Perfil de repartidor**: Cada repartidor crea su perfil con datos personales, tipo de documento y tipo de vehiculo.
- **Registro de vehiculo**: El repartidor puede registrar su moto o carro escaneando la placa con la camara. El sistema consulta automaticamente la base de datos del RUNT (Registro Unico Nacional de Transito) para verificar los datos del vehiculo, el SOAT y la revision tecnomecanica.
- **Verificacion de licencia**: Se verifica que la licencia de conducir del repartidor este activa y vigente, tambien consultando el RUNT.
- **Control de onboarding**: Guia al repartidor paso a paso: primero datos basicos, luego vehiculo, luego licencia. No puede trabajar hasta completar todo.
- **Avatares**: Los repartidores pueden subir su foto de perfil.

---

## 🧩 Flujos que puedes realizar

### 🆕 Registro completo de repartidor

```
Paso 1: Creas tu perfil → POST /delivery-profile
   └─ Tus datos personales (nombre, documento, fecha de nacimiento, genero)
   └─ Tipo de vehiculo (bicicleta, moto, carro, a pie)
   └─ Si elegiste bicicleta o a pie → ¡ya puedes trabajar!
   
Paso 2: Registras tu vehiculo → POST /vehicle/register-from-image
   └─ Tomas foto de la placa o ingresas los datos manualmente
   └─ El sistema consulta el RUNT y obtiene:
       ├─ Marca, linea, modelo, color
       ├─ Estado del SOAT (vigente o vencido)
       └─ Estado de la revision tecnomecanica
   └─ Si el RUNT pide captcha → lo resuelves manualmente

Paso 3: Verificas tu licencia → POST /license/verify
   └─ Tomas foto de tu licencia o ingresas datos manualmente
   └─ El sistema consulta el RUNT para verificar que este activa

¡Listo! Cuando tengas vehiculo y licencia validos, podras empezar a recibir pedidos.
```

### 🖼️ Gestionar avatar

| Que puedes hacer | Como |
|-----------------|------|
| Subir foto de perfil | `PATCH /delivery-profile/avatar` (multipart) |
| Eliminar foto (vuelve a iniciales) | `DELETE /delivery-profile/avatar` |

### 🚗 Gestionar vehiculo

| Que puedes hacer | Como |
|-----------------|------|
| Ver tu vehiculo registrado | `GET /vehicle` |
| Eliminar vehiculo | `DELETE /vehicle` |
| Resolver captcha del RUNT | `POST /vehicle/resolve-captcha` |

### 📄 Gestionar licencia

| Que puedes hacer | Como |
|-----------------|------|
| Ver tu licencia | `GET /license` |
| Eliminar licencia | `DELETE /license` |
| Resolver captcha del RUNT | `POST /license/resolve-captcha` |

---

## 🔗 Integracion con el RUNT (Gobierno de Colombia)

Este servicio se conecta con dos scrapers Python especializados que consultan el portal publico del RUNT:

| Scraper | Puerto | Que verifica |
|---------|--------|-------------|
| **Python Scraper (RUNT)** | 5591 | Datos del vehiculo, SOAT y revision tecnomecanica |
| **Python License Scraper** | 5592 | Licencia de conducir (estado y vigencia) |

Estos scrapers utilizan **Playwright** para navegar el sitio web del gobierno, **PaddleOCR** para reconocer texto de imagenes y un **modelo CNN** para resolver captchas automaticamente.

---

## 🛡️ Seguridad y validaciones

- El repartidor debe ser **mayor de edad** (18+ anos) para registrarse.
- El numero de telefono debe ser **colombiano** (formato 3xx-xxx-xxxx).
- No se permite tener dos vehiculos activos al mismo tiempo.
- La licencia se verifica contra la base de datos oficial del RUNT.
- El sistema revisa automaticamente que el SOAT y la tecnomecanica esten **vigentes** para permitir trabajar.

---

## 📡 Conexiones

- **Cloudinary**: Almacenamiento de avatares de repartidores.
- **Identity Service**: Sincroniza el estado de onboarding del repartidor.
- **Python Scraper (RUNT)**: Verificacion de vehiculos (puerto 5591).
- **Python License Scraper**: Verificacion de licencias (puerto 5592).
- **Gateway**: Recibe peticiones a traves del Gateway.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **MySQL** y arquitectura **Clean Architecture**:

- **TypeORM** para la base de datos
- **Cloudinary** para imagenes de perfil
- **RUNT API** via scrapers Python para verificacion de documentos
- **Haversine formula** para calculos de distancia

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
