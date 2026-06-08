![FoodScroll Logo](../flutter_app/assets/images/FOODSCROLLPNG.png)

# 🪪 FoodScroll — Identity Service

El **Identity Service** es el guardian de la plataforma **FoodScroll**. Se encarga de todo lo relacionado con la identidad digital de los usuarios: registrar nuevas cuentas, iniciar sesion, verificar que eres quien dices ser, y proteger el acceso a la plataforma.

Es como el **departamento de identificacion** de FoodScroll: aqui se crean las cedulas digitales de cada usuario, se reparten las llaves de acceso (tokens JWT) y se aseguran de que nadie entre suplantando a otro.

---

## 🔐 ¿Que hace?

- **Registro de usuarios**: Crea cuentas para clientes, repartidores y restaurantes con correo electronico y contrasena.
- **Inicio de sesion**: Verifica credenciales y entrega un token de acceso (como una llave temporal) que permite usar la plataforma por 1 hora.
- **Inicio de sesion con Google**: Permite entrar con tu cuenta de Google de forma rapida y segura.
- **Recuperacion de contrasena**: Si olvidaste tu contrasena, te enviamos un codigo de 6 digitos a tu correo para restablecerla.
- **Verificacion de correo**: Confirmamos que tu correo electronico es real enviando un codigo de verificacion.
- **Cierre de sesion**: Invalida todas las sesiones activas al instante (si cambias la contrasena o te desactivan, todos tus dispositivos se desconectan).
- **Gestion de usuarios internamente**: Los otros microservicios consultan aqui para saber si un usuario existe y que rol tiene.

---

## 🧩 Flujos que puedes realizar

### 📝 Registro y primer inicio

```
1. Creas tu cuenta → POST /auth/register (email, password, rol)
2. Inicias sesion → POST /auth/login → recibes un token de acceso
3. Completa tu perfil en el servicio correspondiente
4. Verifica tu correo electronico (opcional pero recomendado)
```

### 🔄 Recuperar contrasena

```
1. Solicitas codigo de recuperacion → POST /code/request-reset-code (email)
2. Revisas tu correo y obtienes el codigo de 6 digitos
3. Verificas el codigo y cambias la contrasena → POST /code/verify-reset-code
4. Inicias sesion con tu nueva contrasena
```

### 📧 Verificar correo electronico

```
1. Solicitas verificacion → POST /code/request-confirm-email
2. Ingresas el codigo recibido → POST /code/verify-confirm-email
3. Tu cuenta queda verificada y puedes acceder a todas las funciones
```

### 🚪 Cierre de sesion

```
1. POST /auth/logout → todas tus sesiones se cierran
2. Tu token queda invalidado → ya no puedes hacer peticiones hasta que inicies sesion de nuevo
```

---

## 🛡️ Seguridad

- Las contrasenas se guardan **encriptadas** con bcrypt (nunca en texto plano).
- Los tokens de acceso expiran en **1 hora**; los tokens de refresco duran **30 dias**.
- Cada vez que usas un token de refresco, se genera uno **nuevo** (el anterior deja de servir).
- Si cambias tu contrasena o te desactivan, **todas las sesiones activas se revocan al instante**.
- Los codigos de verificacion tienen **3 intentos maximos** y expiran a los **15 minutos**.
- Este servicio solo acepta peticiones internas de los otros microservicios (no se expone directamente a internet).

---

## 📡 Conexiones

- **Brevo (Sendinblue)**: Servicio de correo electronico para enviar codigos de verificacion y recuperacion.
- **Google OAuth**: Permite inicio de sesion con cuentas de Google (Web y Android).
- **Gateway**: Recibe peticiones del Gateway y responde con tokens de acceso.

---

## 📦 Tecnologia

Construido con **NestJS 11** (TypeScript), base de datos **MySQL** y arquitectura **Clean Architecture** (Hexagonal):

- **TypeORM** para la base de datos
- **bcrypt** para encriptacion de contrasenas
- **Passport + JWT** para autenticacion
- **google-auth-library** para verificacion de tokens de Google
- **Brevo API** para envio de correos

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
