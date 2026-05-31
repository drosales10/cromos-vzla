# API de Trueques (Intercambio de Barajitas)

## Proponer un trueque
- **Endpoint:** `POST /api/trades/propose`
- **Body:**
  - `to_user_id`: ID del usuario destinatario
  - `give_ids`: Array de IDs de barajitas ofrecidas (solo repetidas, máx. 5)
  - `receive_ids`: Array de IDs de barajitas solicitadas (máx. 5; el destinatario debe tenerlas como repetidas)
  - `note`: (opcional) Nota para el destinatario (máx. 500 caracteres)
- **Validaciones:**
  - IDs deben existir en el catálogo de cromos
  - Solo puedes ofrecer repetidas (`quantity > 1` en inventario)
  - Las repetidas ya comprometidas en otras propuestas `PENDING` no están disponibles
  - El destinatario debe tener repetidas de lo que solicitas en `receive_ids`
- **Respuesta:** Datos del trueque creado con `expires_at`

## Aceptar un trueque
- **Endpoint:** `POST /api/trades/:id/accept`
- **Autorización:** Solo el receptor (`to_user_id`)
- **Respuesta:** ID y estado actualizado del trueque
- **Efecto:** Transfiere inventario de ambos usuarios de forma atómica

## Rechazar un trueque
- **Endpoint:** `POST /api/trades/:id/reject`
- **Autorización:** Solo el receptor
- **Respuesta:** ID y estado actualizado (`REJECTED`)

## Cancelar un trueque
- **Endpoint:** `POST /api/trades/:id/cancel`
- **Autorización:** Solo el emisor (`from_user_id`)
- **Respuesta:** ID y estado actualizado (`CANCELLED`)

## Listar trueques
- **Endpoint:** `GET /api/trades`
- **Query params:**
  - `status`: (opcional) Filtrar por estado (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `EXPIRED`)
- **Respuesta:** Lista de trueques donde el usuario participa, incluyendo perfiles de emisor/receptor

## Notas de negocio
- Solo puedes ofrecer barajitas repetidas.
- El intercambio solo se realiza si ambas partes tienen las barajitas requeridas al aceptar.
- Los trueques expiran automáticamente si no se responden a tiempo (TTL configurable, default 48 h).
- Las propuestas pendientes reservan las repetidas ofrecidas para evitar doble compromiso.
- Las acciones quedan registradas en el log de auditoría (`TRADE_PROPOSED`, `TRADE_ACCEPTED`, `TRADE_REJECTED`, `TRADE_CANCELLED`).
