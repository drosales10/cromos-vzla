# Cromos Panini

Aplicacion para control de album, economia de sobres y trueques familiares con backend Express + Prisma + PostgreSQL.

## Requisitos

- Node.js 20+
- PostgreSQL

## Configuracion

1. Crear archivo de entorno desde ejemplo.
2. Ajustar credenciales y secretos.

```bash
copy .env.example .env.local
```

## Comandos principales

- Frontend dev: `npm run dev`
- API dev: `npm run dev:api`
- Build: `npm run build`
- Prisma migrate: `npm run prisma:migrate`
- Prisma generate: `npm run prisma:generate`
- Crear/actualizar superusuario: `npm run superuser:create`

## Superusuario

El superusuario administra:

- privilegios sensibles,
- catalogo/pool de barajitas,
- carga de imagenes de barajitas.

### Crear o actualizar superusuario

Configurar variables `SUPERUSER_*` y ejecutar:

```bash
npm run superuser:create
```

## Como se gestionan las imagenes ahora

- Avatar de usuario: se guarda en `profiles.avatar_url`.
- Imagen de barajita: la gestiona el superusuario en Admin > Album/Pools.
- Se persiste en `sticker_catalog.image_path`.
- La apertura de sobres devuelve `image_path` en cada item para renderizar imagen.

## Documentacion

Ver carpeta docs:

- [docs/README.md](docs/README.md)
- [docs/estado-tecnico.md](docs/estado-tecnico.md)
- [docs/plan-fases.md](docs/plan-fases.md)
- [docs/manual-uso.md](docs/manual-uso.md)
- [docs/superusuario-imagenes.md](docs/superusuario-imagenes.md)
- [docs/api-cromos.md](docs/api-cromos.md)

## Contrato de cromos

El contrato principal de cromos ahora es por inventario con cantidades:

- `inventory`: lista `{ sticker_id, quantity }`
- `quantities`: mapa por sticker

Los campos legacy `have`, `doubles` y `need` fueron retirados del response de `/api/cromos`.
