# 🚀 FeedGo - Microservicios Backend

## Iniciando todos los servicios

### Forma rápida (Recomendado)

Ejecuta el script desde la raíz del proyecto:

```bash
.\start-services.bat
```

Esto abrirá **Windows Terminal** con **7 pestañas**, una para cada microservicio.

---

## 📋 Requisitos

- **Node.js** y **npm** instalados
- **Python 3.12.0 instalado
- **Windows Terminal** instalado (viene por defecto en Windows 11)
- Estar en la carpeta raíz: `C:\Users\USUARIO\Desktop\FeedGo`

---

## 🏗️ Servicios que se inician

| # | Servicio | Puerto | Comando |
|---|----------|--------|---------|
| 1 | **Gateway** | 3000 | `npm run start` |
| 2 | **Customer Service** | 3001 | `npm run start:dev` |
| 3 | **Delivery Service** | 3002 | `npm run start:dev` |
| 4 | **Identity Service** | 3003 | `npm run start:dev` |
| 5 | **Location Service** | 3004 | `npm run start:dev` |
| 6 | **Python Scraper** | 5591 | `python main.py` |
| 7 | **Python License Scraper** | 5592 | `python main.py` |

---

## ⌨️ Navegación en Windows Terminal

- **Ctrl+Tab** → Siguiente pestaña
- **Ctrl+Shift+Tab** → Pestaña anterior
- **Haz clic** en el nombre de la pestaña para cambiar

---

## 🛑 Detener los servicios

Cierra la ventana de Windows Terminal o presiona **Ctrl+C** en cualquier pestaña para detener ese servicio específico.

---

## 📝 Iniciando servicios individuales

Si prefieres ejecutar un servicio específico:

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

## ✅ Verificar que los servicios están corriendo

```bash
netstat -ano | findstr "3000\|3001\|3002\|3003\|3004"
```

Deberías ver los puertos como **LISTENING**.

---

## 🔧 Troubleshooting

**Error: "npm run start:dev" no se reconoce**
- Verifica que estés en la carpeta correcta del servicio
- Ejecuta `npm install` primero

**Error: Puerto ya en uso**
- Mata el proceso que ocupa el puerto: `netstat -ano | findstr :3000`
- Luego: `taskkill /PID <PID> /F`

**Los servicios no inician**
- Abre las pestañas individualmente y verifica los errores
- Asegúrate de tener Node.js y Python instalados

---

## 📚 Estructura del Proyecto

```
FeedGo/
├── gateway/                    (API Gateway - Puerto 3000)
├── customer-service/           (Servicio de Clientes - Puerto 3001)
├── delivery-service/           (Servicio de Entregas - Puerto 3002)
├── identity-service/           (Servicio de Identidad - Puerto 3003)
├── location-service/           (Servicio de Ubicación - Puerto 3004)
├── python-scraper/             (Scraper Python)
├── python-license-scraper/     (Scraper de Licencias Python)
├── flutter_app/                (App Flutter)
├── start-services.bat          (Script para iniciar todos)
└── README.md                   (Este archivo)
```

---

## 🎯 Próximos pasos

1. Ejecuta `.\start-services.bat`
2. Verifica que todos los servicios estén listos
3. Prueba los endpoints en: `http://localhost:3000`

---

**¡Listo para usar!** 🎉
