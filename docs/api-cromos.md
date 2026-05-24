# API de Cromos (Contrato Actual)

## Fuente de verdad

El inventario por usuario se gestiona con cantidades exactas por barajita:

- `inventory`: lista de objetos `{ sticker_id, quantity }`
- `quantities`: mapa `{ [stickerId]: number }`

La logica de negocio (sobres, trueques, resumen de album) debe consumir estas dos estructuras.

## Endpoints

- `GET /api/cromos`
- `GET /api/cromos/:userId`
- `PUT /api/cromos/:userId`
- `DELETE /api/cromos/:userId`

## Respuesta recomendada para consumo

```json
{
  "user_id": "...",
  "inventory": [
    { "sticker_id": "TUR14", "quantity": 2 },
    { "sticker_id": "FRA2", "quantity": 1 }
  ],
  "quantities": {
    "TUR14": 2,
    "FRA2": 1
  }
}
```

## Campos legacy retirados

Los campos `have`, `doubles` y `need` fueron retirados del response de `/api/cromos`.
El consumo debe realizarse unicamente con `inventory` y `quantities`.

## Reglas de interpretacion

- `quantity = 0`: falta
- `quantity = 1`: pegada
- `quantity >= 2`: repetidas

## Notas de migracion

- El backend hace backfill automatico desde datos antiguos cuando detecta usuario sin inventario.
- Las escrituras actuales de cromos persisten sobre inventario por cantidades.
- La salida legacy de `have/doubles/need` ya no forma parte del contrato de API.