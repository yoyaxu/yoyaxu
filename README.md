# Registro de compras y gastos

Aplicación web estática para registrar compras y gastos personales en el navegador.

## Funciones

- Alta de movimientos con descripción, monto, categoría, fecha, método de pago y notas.
- Resumen con total acumulado, cantidad de compras del mes y categoría con mayor gasto.
- Búsqueda por texto y filtro por categoría.
- Eliminación de movimientos individuales.
- Exportación a CSV.
- Persistencia local usando `localStorage`.

## Uso local

Como es una app estática, basta abrir `index.html` en el navegador o servir el directorio con un servidor simple:

```bash
python3 -m http.server 8000
```

Luego visita `http://localhost:8000`.
