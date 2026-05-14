# ApuestasPRO

Prototipo estático para comparar cuotas americanas pre-juego, registrar recomendaciones y calcular utilidad estimada de la empresa.

## Preview local

```bash
npm start
```

Abre `http://localhost:3000`.

El servidor local (`server.mjs`) sirve los archivos estáticos y expone un proxy seguro para datos públicos de Sportider:

```text
GET /api/sportider/today-events
```

## Datos reales y límites

- **Sportider 365**: se intenta cargar desde el endpoint público `https://365.sportider.com/api/sportevent/today-events`.
- **SportsPick / Fórmula 43, Juancito Sport y Betcris**: quedan como entrada manual/asistida cuando requieren login del encargado.
- El sistema **no inicia sesión**, **no evade bloqueos**, **no resuelve captchas** y **no automatiza apuestas** en cuentas reales.
- Si una casa de apuestas requiere usuario, contraseña, cédula o licencia, la forma segura en esta versión es que el encargado entre manualmente y copie las cuotas al comparador.

## Flujo recomendado

1. Abrir el comparador.
2. Cargar juegos reales de Sportider.
3. Completar manualmente las cuotas de Juancito, SportsPick/Fórmula 43 y Betcris si aplican.
4. Comparar la mejor línea por selección o combinada.
5. Registrar la recomendación con snapshot de cuotas.
6. El encargado coloca la jugada manualmente en la página recomendada.
