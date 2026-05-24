# Estado Tecnico Actual

## Resumen

La aplicacion funciona con frontend React + Vite y backend Express + Prisma sobre PostgreSQL.
El flujo sensible de negocio (auth, sobres, economia, trueques) ya esta en el backend con transacciones.

## Stack

- Frontend: React, Vite.
- Backend: Express.
- ORM: Prisma 6.x.
- Base de datos: PostgreSQL.
- Auth: JWT + bcrypt.

## Decisiones Importantes

1. Prisma 6.x se mantiene fijo en este repositorio.
2. Variables de conexion y prisma se manejan en `.env.local`.
3. Se centralizo la API en `server/index.js` y cliente en `src/api.js`.
4. Se migro auth a PostgreSQL con `password_hash` y endpoints JWT:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `GET /api/auth/me`

## Economia (Fase 1)

Modelos incorporados:

- `sticker_catalog`
- `pack_types`
- `user_wallets`
- `wallet_ledger`
- `user_pack_inventory`
- `pack_openings`
- `pack_opening_items`
- `coupons`
- `coupon_redemptions`

Capacidades activas:

- bono diario de monedas,
- compra de sobres,
- apertura de sobres de 5,
- canje de cupones,
- gestion de cupones por superusuario (CRUD + activacion/desactivacion),
- registro en ledger.

### Cupones (operacion de superusuario)

Endpoints administrativos disponibles:

- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `PATCH /api/admin/coupons/:code`
- `POST /api/admin/coupons/:code/toggle`
- `POST /api/admin/coupons/auto-event`

Todos requieren JWT valido y rol `is_superuser = true`.

## Trueques y Expiracion

- Estado `EXPIRED` agregado para propuestas de trueque.
- `trade_proposals.expires_at` ya es obligatorio (NOT NULL).
- TTL por defecto: 48 horas para nuevas propuestas.
- Expiracion automatica en backend:
  - al listar trueques,
  - por barrido periodico (`TRADE_EXPIRY_SWEEP_MS`, default 5 min).

## Inventario de Cromos (Modelo Actual)

La fuente de verdad del album es el inventario por cantidades por usuario y barajita.

- Tabla principal: `user_sticker_inventory`.
- Contrato recomendado de API: `inventory` y `quantities`.
- Regla de estado: `0` falta, `1` pegada, `2+` repetidas.

Sobres y trueques ya actualizan cantidades de inventario directamente.

### Contrato limpio de cromos

Los campos `have`, `doubles` y `need` fueron retirados del response de `/api/cromos`.
El frontend y la logica de negocio consumen `inventory` y `quantities` como contrato unico.

## Migraciones Relevantes

- `20260524114547_init`
- `20260524115355_auth_password_hash`
- `20260524122727_packs_economy_phase1`
- `20260524123241_trades_phase1`
- `20260524123528_trades_expiry`
- `20260524123915_trades_expiry_required_backfill`

## Nota Operativa en Windows

En Windows puede ocurrir `EPERM` al regenerar cliente Prisma si procesos Node bloquean el engine.
Si pasa:

1. detener procesos Node,
2. ejecutar `npx prisma generate`.
