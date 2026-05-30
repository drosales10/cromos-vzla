# Plan por Fases: Sobres, Economia y Trueques

## Objetivo General

Construir un sistema privado familiar de sobres de 5 barajitas con pool ponderado infinito, economia hibrida (monedas + cupones) y trueque confirmado entre miembros.

## Fase 1: Catalogo y Pool

1. Definir entidad canonica de barajita: id, seccion, numero, rareza, imagen, peso, activa.
2. Consolidar fuente de verdad compartida frontend/backend.
3. Preparar seed inicial 2026 desde `ALL_CROMOS`.
4. Definir distribucion de rareza y pesos configurable por admin.

## Fase 2: Modelo de Datos Prisma

1. Extender esquema para wallets, inventario de sobres, aperturas y cupones.
2. Modelar ledger transaccional para auditoria.
3. Modelar trueque confirmado con estados y timestamps.
4. Agregar indices y restricciones de unicidad.
5. Generar migraciones y seeds de parametros economicos.

## Fase 3: Reglas de Negocio Backend

1. Apertura atomica de sobres (5 items) con validaciones y actualizacion de cromos.
2. Endpoints de economia: bono, compra, canje, historial.
3. Motor de cupones/eventos automaticos.
4. Trueque confirmado con locks para evitar doble gasto de repetidas.
5. Endpoints protegidos por JWT y roles para acciones admin.

## Fase 4: Frontend UX

1. Pantalla Sobres con saldo, compra, canje y bono diario.
2. Resultado de apertura con nuevas vs repetidas.
3. Flujo de trueque en grupos (proponer, aceptar, rechazar, cancelar).
4. Fallback visual para barajitas sin imagen final.

## Fase 5: Seguridad y Observabilidad

1. Rate limits en login, cupones y aperturas.
2. Validacion estricta y manejo de errores.
3. Idempotencia en operaciones criticas de compra/apertura.
4. Auditoria minima de eventos sensibles.

## Fase 6: Migracion y Adopcion

1. Backfill desde `user_cromos` a inventario consistente.
2. Feature flags para despliegue gradual.
3. Guia operativa familiar para uso diario.

## Verificacion Recomendada

1. Ejecutar migraciones Prisma y validar integridad referencial.
2. Probar E2E: registro, login, bono, compra, apertura, cupon, trueque.
3. Simular aperturas masivas y comparar distribucion observada vs esperada.
4. Probar concurrencia en trueques para confirmar atomicidad.
5. Validar UX en escritorio y movil.
