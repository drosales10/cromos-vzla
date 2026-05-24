# Manual de Uso de la Aplicacion

## 1. Introduccion

Cromos Panini es una aplicacion para llevar control del album, abrir sobres, administrar monedas y coordinar/intercambiar barajitas con grupos familiares.

## 2. Registro e Inicio de Sesion

1. Abrir la aplicacion.
2. Ir a Registrarse.
3. Completar nombre, usuario, ciudad, contacto y credenciales.
4. Aceptar terminos.
5. Entrar con email y contrasena.

## 3. Pantalla Mi Album

En Mi Album puedes marcar tus barajitas:

- toque normal: marcar como pegada (have),
- segundo toque/accion de doble: marcar como repetida (doubles),
- al desmarcar se elimina de pegadas y repetidas.

Recomendacion: mantener este estado actualizado para que los match de trueque sean precisos.

## 4. Seccion Sobres y Economia

Funciones principales:

1. Ver saldo de monedas.
2. Reclamar bono diario.
3. Comprar sobres.
4. Abrir sobres (5 barajitas por sobre).
5. Canjear cupones.

Al abrir un sobre, la app clasifica resultados en nuevas y repetidas y actualiza automaticamente tu inventario de cromos.

## 5. Grupos

### Crear grupo

1. Ir a Grupos.
2. Crear grupo con nombre/tipo.
3. Compartir codigo con la familia.

### Unirse a grupo

1. Ir a Grupos.
2. Elegir Unirse.
3. Ingresar codigo del grupo.

## 6. Trueques

En el detalle del grupo hay una pestana de trueques con:

- propuestas pendientes,
- historial por estado,
- filtros: ALL, PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED,
- badge de pendientes para acciones recibidas.

### Flujo recomendado

1. Ir a Intercambios posibles.
2. Revisar sugerencias (que das / que recibes).
3. Enviar propuesta de trueque.
4. El receptor acepta o rechaza.
5. Si acepta, el intercambio se aplica automaticamente.

## 7. Expiracion de Trueques

- Cada propuesta nueva expira en 48 horas (configurable en backend).
- Los trueques vencidos pasan a estado EXPIRED.
- La UI muestra:
  - fecha/hora de expiracion,
  - countdown en vivo,
  - etiqueta URGENTE cuando faltan menos de 15 minutos.

## 8. Chat y Coordinacion

Puedes usar chat privado y, cuando exista numero de contacto, abrir WhatsApp para coordinacion rapida.

## 9. Perfil

En Perfil puedes:

1. actualizar datos personales,
2. subir/cambiar avatar,
3. cerrar sesion.

## 10. Buenas Practicas de Uso

1. Marca cromos al dia para mejores sugerencias.
2. No aceptes trueques sin revisar que entregas y recibes.
3. Reclama bono diario para mantener flujo de monedas.
4. Usa cupones en ventanas activas.
5. Revisa trueques pendientes antes de que expiren.

## 11. Solucion de Problemas Rapida

### No puedo iniciar sesion

- Verifica email y contrasena.
- Si tu cuenta esta bloqueada, contactar administrador.

### No veo cambios en trueques

- La vista se refresca automaticamente cada 30s.
- Al volver a una pestana inactiva, se fuerza recarga.

### Error Prisma en Windows (EPERM)

1. Cerrar procesos Node en ejecucion.
2. Ejecutar `npx prisma generate`.

## 12. Comandos Basicos para Desarrollo

- Iniciar frontend: `npm run dev`
- Iniciar API: `npm run dev:api`
- Build produccion: `npm run build`
- Migraciones: `npx prisma migrate dev`
