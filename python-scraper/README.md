![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🤖 FoodScroll — Python RUNT Scraper (Vehiculos)

El **Python RUNT Scraper** es un microservicio especializado en **FastAPI** que automatiza la consulta de informacion vehicular en el portal publico del **RUNT** (Registro Unico Nacional de Transito) de Colombia.

Piensa en este servicio como un **investigador automatico** que, dada una foto de la tarjeta de propiedad de un vehiculo, puede obtener toda la informacion del RUNT: datos del vehiculo, estado del SOAT y revision tecnomecanica.

---

## 🎯 ¿Que hace?

- **OCR de tarjeta de propiedad**: Lee automaticamente la placa y el numero de documento del dueno desde una foto de la tarjeta de propiedad usando PaddleOCR.
- **Consulta automatica al RUNT**: Navega el portal del RUNT, resuelve los captchas automaticamente y extrae la informacion del vehiculo.
- **Verificacion de SOAT**: Obtiene el historial completo del SOAT del vehiculo (vigente o vencido).
- **Verificacion de RTM**: Obtiene el historial de la revision tecnomecanica.
- **Resolucion de captchas**: Utiliza inteligencia artificial (CNN entrenada con PaddlePaddle) para resolver los captchas del portal RUNT automaticamente.
- **Fallback manual**: Si el sistema no puede resolver el captcha automaticamente, permite que un humano lo resuelva.

---

## 🧩 Flujos disponibles

### 🤖 Verificacion automatica completa

```
POST /runt/verify-full-auto
1. Envias una foto de la tarjeta de propiedad (o datos manuales)
2. El sistema hace OCR para extraer placa y documento
3. Crea una sesion en el RUNT automaticamente
4. Resuelve el captcha con IA (modelo CNN)
5. Consulta los datos del vehiculo
6. Devuelve:
   └─ Datos del vehiculo (marca, linea, modelo, color)
   └─ Estado del SOAT (vigente/vencido) + historial
   └─ Estado de la revision tecnomecanica + historial
```

### ✍️ Verificacion manual

```
POST /runt/verify-manual
1. Si el captcha automatico falla, recibes un sessionId
2. Ves la imagen del captcha y escribes el texto
3. Envias el texto del captcha
4. El sistema completa la consulta
```

---

## 🧠 Sistema de resolucion de captchas

El servicio utiliza un **pipeline de 3 etapas** para resolver captchas:

| Etapa | Tecnologia | Precision |
|-------|-----------|-----------|
| **1. Modelo CNN por caracter** | PaddlePaddle - Red convolucional | ~89% por caracter |
| **2. Modelo CNN de secuencia** | PaddlePaddle - Red convolucional | Variable (4-7 caracteres) |
| **3. Fallback OCR** | PaddleOCR / Tesseract | Rescue |

Si las 3 etapas fallan, el sistema devuelve la sesion para resolucion manual.

---

## 🔧 Scripts de entrenamiento

El repositorio incluye scripts completos para entrenar y mejorar los modelos de resolucion de captchas:

| Script | Proposito |
|--------|-----------|
| `collect_captcha_dataset.py` | Descarga captchas del RUNT para crear dataset |
| `live_captcha_label_loop.py` | Etiquetado interactivo de captchas |
| `train_captcha_char_model.py` | Entrena el modelo CNN por caracter |
| `evaluate_captcha_solver.py` | Evalua la precision del solver |
| `license_ocr_worker.py` | Worker de OCR para subprocesos |

---

## 🛡️ Circuit Breaker

El servicio implementa un **patron Circuit Breaker** para manejar caidas del portal RUNT:

```
🟢 CERRADO → Normal, las peticiones pasan
🟡 ABIERTO → 5 fallos consecutivos, rechaza peticiones inmediatamente
🔵 SEMI-ABIERTO → Despues de 60s, intenta una peticion de prueba
```

Esto evita que el sistema se sature cuando el RUNT esta caido.

---

## 📡 Conexiones

- **Delivery Service**: El servicio de repartidores lo consulta para verificar vehiculos durante el registro.
- **RUNT (Gobierno de Colombia)**: Portal publico de consulta vehicular.
- **Gateway**: Recibe peticiones a traves del Delivery Service.

---

## 📦 Tecnologia

Construido con **FastAPI** (Python 3.12) y tecnicas avanzadas de automatizacion:

- **Playwright** para automatizacion de navegador Chromium
- **PaddleOCR** para reconocimiento de texto en imagenes
- **PaddlePaddle** para modelos CNN de resolucion de captchas
- **OpenCV** para preprocesamiento de imagenes
- **Page Pool** para reutilizar paginas del navegador

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
