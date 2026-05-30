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
- Seeder de barajitas: `npm run seed:stickers`

## Seeder de barajitas

Se agrego un seeder para cargar/actualizar `sticker_catalog` con base en `ALL_CROMOS` y asignar `image_path` automaticamente desde imagenes locales.

Script:

- `server/seed-stickers.js`

### Como funciona

1. Recorre todas las barajitas del album (`ALL_CROMOS`).
2. Hace `upsert` por `id` en `sticker_catalog`.
3. Calcula `rarity` y `weight` con la misma logica del backend.
4. Busca imagenes en carpeta `img` (raiz del proyecto) y guarda `image_path` con prefijo `/img`.
5. El match de imagen es tolerante: ignora guiones/guion_bajo y mayusculas/minusculas.

Ejemplos validos para `MEX01`:

- `MEX01.jpg`
- `mex01.png`
- `MEX-01.webp`
- `mex_01.jpeg`

### Uso

Dry-run (sin escribir en base de datos):

```bash
npm run seed:stickers -- --dry-run
```

Ejecucion real:

```bash
npm run seed:stickers
```

Opciones:

- `--imagesDir <ruta>`: carpeta de imagenes (default: `img`).
- `--publicPrefix <rutaPublica>`: prefijo de `image_path` (default: `/img`).

Ejemplo con ruta personalizada:

```bash
npm run seed:stickers -- --imagesDir public/album --publicPrefix /album
```

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
