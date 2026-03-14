NATS + JetStream microservice (minimal)

Env
- NATS_URL (ej: nats://localhost:4222)
- SERVICE_SECRET (debe coincidir con el x-service-secret de los microservicios)
- SERVER_PORT (opcional, default 5590)

Start (local development)

1. Instala dependencias: `npm install`
2. Ejecuta: `npm run start`

Descripción
- `NatsModule` expone un provider `NATS_CLIENT` con `{ nc, js, codec }`.
- `StreamService` se asegura que el Stream `APP_STATUS_EVENTS` exista.
- `EventEmitterService.emitEvent(subject, data)` publica mediante JetStream.
- `EventsController` recibe eventos por HTTP y exige `x-service-secret` de forma global (`APP_GUARD`).

Subjects/Stream actuales
- Stream: `APP_STATUS_EVENTS`
- Subject principal: `app.status.updated`

Notas
- Ajusta políticas de retención/replicas y nombres de stream/subjects según infra.
