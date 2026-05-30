# Superusuario, Pool e Imagenes

## Estado actual

La gestion de barajitas del pool ahora se realiza desde una seccion dedicada para superusuario en el panel Admin:

- pestaña: Album/Pools,
- carga/edicion de barajitas,
- activacion/desactivacion de barajitas para el pool,
- carga de imagen por archivo o pegado de URL/Data URL.

Los datos se guardan en `sticker_catalog`:

- `id`
- `section`
- `number`
- `rarity`
- `weight`
- `image_path`
- `active`

## Como se gestionan las imagenes ahora

Antes solo existia carga de imagen para avatar de usuario (`avatar_url`).

Ahora las imagenes de barajitas se gestionan por superusuario en `sticker_catalog.image_path` y se usan en:

1. lista de barajitas del admin (preview),
2. resultados de apertura de sobres (`open-pack` devuelve `image_path`).

## Endpoints de superusuario

- `GET /api/admin/stickers`
- `POST /api/admin/stickers`
- `PATCH /api/admin/stickers/:id`
- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `PATCH /api/admin/coupons/:code`
- `POST /api/admin/coupons/:code/toggle`
- `POST /api/admin/coupons/auto-event`
- `POST /api/admin/users/:id/superuser`
- `GET /api/admin/audit-logs`

Todos requieren:

- JWT valido,
- usuario con `is_superuser = true`.

### Cambio de rol superusuario

El endpoint `POST /api/admin/users/:id/superuser` recibe:

- `enabled: true` para promover,
- `enabled: false` para degradar.

Reglas de seguridad:

1. No se permite auto-degradarse.
2. Debe existir al menos un superusuario.
3. Al promover superusuario, se asegura `is_admin = true`.

## Auditoria persistente

Las acciones sensibles se registran en tabla `audit_logs` y pueden consultarse desde:

- endpoint `GET /api/admin/audit-logs`,
- pestaña `Auditoría` en Panel Admin para superusuario.

Eventos principales registrados:

1. Cambios de rol superusuario.
2. Alta/edicion de barajitas del pool.
3. Alta/edicion/activacion de cupones.
3. Actualizaciones de privilegios de perfil.
4. Eliminacion de perfiles.

## Gestion de cupones

La administracion de cupones se realiza desde la pestaña `Cupones` en el Panel Admin (solo superusuario):

1. Crear cupones manuales `PACK` o `COINS`.
2. Editar reglas de vigencia y limites de uso.
3. Activar o desactivar cupones sin eliminar historial.
4. Aplicar filtros por tipo, estado y activo.

Reglas clave:

- `COINS` requiere `coins_amount`.
- `PACK` requiere `pack_type_id` y `pack_quantity`.
- Si `max_global_uses` se deja vacio, el cupon no tiene limite global.

## Aprovisionamiento de superusuario

Se incluye script para crear/actualizar superusuario:

```bash
npm run superuser:create
```

Variables recomendadas en entorno:

- `SUPERUSER_EMAIL`
- `SUPERUSER_PASSWORD`
- `SUPERUSER_NAME`
- `SUPERUSER_USERNAME`

## Flujo recomendado de carga

1. Ingresar como superusuario.
2. Ir a Admin > Album/Pools.
3. Crear o editar barajita.
4. Subir imagen o pegar URL.
5. Marcar activa para incluirla en el pool de sobres.
6. Guardar.

## Buenas practicas

1. Usar IDs consistentes por seccion/numero (ejemplo: `CRC01`).
2. Mantener `weight` alineado con la rareza definida.
3. Desactivar barajitas en lugar de borrarlas para trazabilidad.
4. Preferir URL estables para imagenes finales en produccion.
