# FeedGo - Microservicios Backend

## Iniciando todos los servicios

### Forma rapica (Recomendado)

Ejecuta el script desde la raiz del proyecto:

```bash
.\start-services.bat
```

Esto abrira **Windows Terminal** con **9 pestañas**, una para cada microservicio.

---

## Requisitos

- **Node.js** y **npm** instalados
- **Python 3.12.0** instalado
- **Windows Terminal** instalado (viene por defecto en Windows 11)
- Estar en la carpeta raiz: `C:\Users\USUARIO\Desktop\FeedGo`

---

## Servicios que se inician

| # | Servicio | Puerto | Comando |
|---|----------|--------|---------|
| 1 | **Gateway** | 3000 | `npm run start` |
| 2 | **Identity Service** | 5560 | `npm run start:dev` |
| 3 | **Customer Service** | 5561 | `npm run start:dev` |
| 4 | **Location Service** | 5562 | `npm run start:dev` |
| 5 | **Delivery Service** | 5563 | `npm run start:dev` |
| 6 | **Restaurant Service** | 5564 | `npm run start:dev` |
| 7 | **Publications Service** | 5565 | `npm run start:dev` |
| 8 | **Python Scraper** | 5591 | `python main.py` |
| 9 | **Python License Scraper** | 5592 | `python main.py` |

---

## Navegacion en Windows Terminal

- **Ctrl+Tab** -> Siguiente pestana
- **Ctrl+Shift+Tab** -> Pestana anterior
- **Haz clic** en el nombre de la pestana para cambiar

---

## Detener los servicios

Cierra la ventana de Windows Terminal o presiona **Ctrl+C** en cualquier pestana para detener ese servicio especifico.

---

## Iniciando servicios individuales

Si prefieres ejecutar un servicio especifico:

### Node.js Services (Gateway, Services)

```bash
cd <nombre-del-servicio>
npm install
npm run start     # o npm run start:dev
```

### Python Services

```bash
cd python-scraper
# o
cd python-license-scraper

python main.py
```

---

## Verificar que los servicios estan corriendo

```bash
netstat -ano | findstr "3000 5560 5561 5562 5563 5564 5565"
```

Deberias ver los puertos como **LISTENING**.

---

## Estructura del Proyecto

```
FeedGo/
├── gateway/                    (API Gateway - Puerto 3000)
├── identity-service/           (Servicio de Identidad - Puerto 5560)
├── customer-service/           (Servicio de Clientes - Puerto 5561)
├── location-service/           (Servicio de Ubicacion - Puerto 5562)
├── delivery-service/           (Servicio de Entregas - Puerto 5563)
├── restaurant-service/         (Servicio de Restaurantes - Puerto 5564)
├── publications-service/       (Servicio de Publicaciones - Puerto 5565)
├── python-scraper/             (Scraper Python - Puerto 5591)
├── python-license-scraper/     (Scraper de Licencias Python - Puerto 5592)
├── flutter_app/                (App Flutter)
├── start-services.bat          (Script para iniciar todos)
└── README.md                   (Este archivo)
```

---

## Reglas de negocio

### Publicaciones

- ** Crear/Editar/Eliminar publicaciones**: Solo usuarios con `isActive: true` pueden realizar estas acciones.
- Un usuario RESTAURANT comienza con `isActive: false` al registrarse.
- `isActive` se pone en `true` automaticamente cuando el usuario completa todo el onboarding (perfil, direccion y horarios).
- Los endpoints GET de publicaciones (listar, obtener) estan disponibles para todos los usuarios autenticados.

### Onboarding RESTAURANT

El flujo de onboarding tiene los siguientes pasos:

1. `REQUIRED_BASIC_CONFIG` -> Crear perfil del restaurante
2. `BASIC_INFO` -> Agregar direccion
3. `ADDRESS_REQUIRED` -> Agregar horarios de apertura
4. `COMPLETED` -> Onboarding completo (`isActive: true`)

---

## Troubleshooting

**Error: "npm run start:dev" no se reconoce**
- Verifica que estes en la carpeta correcta del servicio
- Ejecuta `npm install` primero

**Error: Puerto ya en uso**
- Mata el proceso que ocupa el puerto: `netstat -ano | findstr :3000`
- Luego: `taskkill /PID <PID> /F`

**Error 401 "Unable to validate token"**
- Verifica que el **Identity Service** este corriendo (Puerto 5560)
- Todos los servicios dependen del Identity Service para validar tokens

**Error 403 "Debes completar tu perfil para realizar esta accion"**
- El usuario no ha completado el onboarding (tiene `isActive: false`)
- Debe completar perfil, direccion y horarios para activar su cuenta

**Los servicios no inician**
- Abre las pestanas individualmente y verifica los errores
- Asegurate de tener Node.js y Python instalados

---

**Listo para usar!**
