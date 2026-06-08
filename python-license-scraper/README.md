![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🤖 FoodScroll — Python License Scraper (Licencias)

El **Python License Scraper** es un microservicio especializado en **FastAPI** que automatiza la consulta de **licencias de conducir** en el portal publico del **RUNT** (Registro Unico Nacional de Transito) de Colombia.

Piensa en este servicio como un **verificador de antecedentes** que, dada una foto de la licencia de conducir de una persona, puede confirmar si esta activa y vigente consultando directamente la base de datos oficial del gobierno.

---

## 🎯 ¿Que hace?

- **OCR de licencias**: Lee automaticamente el tipo y numero de documento desde una foto de la licencia de conducir usando PaddleOCR.
- **Consulta automatica al RUNT**: Navega el portal del RUNT, resuelve los captchas y extrae la informacion de la licencia.
- **Verificacion de estado**: Determina si la licencia esta ACTIVA o INACTIVA, su fecha de expedicion, numero y oficina que la expidio.
- **Resolucion de captchas**: Utiliza inteligencia artificial (CNN entrenada con PaddlePaddle) para resolver los captchas del portal RUNT.
- **Fallback manual**: Si el sistema no puede resolver el captcha, permite intervencion manual.

---

## 🧩 Flujos disponibles

### 🤖 Verificacion automatica completa

```
POST /runt/verify-full-auto-licencia
1. Envias una foto de la licencia (o tipo/nro de documento)
2. El sistema hace OCR para extraer tipo y numero de documento
3. Crea una sesion en el RUNT
4. Resuelve el captcha con IA (modelo CNN)
5. Consulta los datos de la licencia
6. Devuelve:
   └─ Numero de licencia
   └─ Fecha de expedicion
   └─ Oficina que la expidio
   └─ Estado (ACTIVA / INACTIVA)
```

### ✍️ Verificacion manual

```
POST /runt/verify-licencia
1. Si el captcha automatico falla, recibes un sessionId
2. Ves la imagen del captcha y escribes el texto
3. Envias el texto del captcha
4. El sistema completa la consulta
```

---

## 🧠 Modelo de resolucion de captchas

El servicio utiliza un **modelo CNN por caracter** entrenado especificamente para los captchas del RUNT:

- **Red convolucional** de 3 capas con PaddlePaddle
- **62 caracteres** (0-9, A-Z, a-z)
- **Captchas de 5 caracteres** de longitud fija
- **Precision reportada**: ~90.5% en validacion
- **Preprocesamiento**: Escala de grises, recorte de banda de texto, segmentacion en 5 partes

---

## 🔄 Diferencia con el otro scraper

| Aspecto | License Scraper (5592) | Vehicle Scraper (5591) |
|---------|----------------------|----------------------|
| **Que consulta** | Licencias de conducir | Vehiculos, SOAT, RTM |
| **Puerto** | 5592 | 5591 |
| **Seccion RUNT** | Consulta por documento | Consulta por placa |
| **Datos obtenidos** | Numero licencia, estado, fecha | Marca, linea, SOAT, tecnomecanica |
| **OCR** | Documento de identidad | Placa del vehiculo |

---

## 🛡️ Circuit Breaker

Implementa el patron **Circuit Breaker** para manejar caidas del portal RUNT:

- **5 fallos consecutivos** → abre el circuito
- **60 segundos de espera** → intenta recuperacion
- Evita saturar el sistema cuando el RUNT esta caido

---

## 📡 Conexiones

- **Delivery Service**: El servicio de repartidores lo consulta para verificar licencias durante el registro.
- **RUNT (Gobierno de Colombia)**: Portal publico de consulta de documentos.
- **Gateway**: Recibe peticiones a traves del Delivery Service.

---

## 📦 Tecnologia

Construido con **FastAPI** (Python 3.12) y tecnicas avanzadas de automatizacion:

- **Playwright** para automatizacion de navegador Chromium
- **PaddleOCR** para reconocimiento de texto en imagenes
- **PaddlePaddle** para modelo CNN de resolucion de captchas
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
