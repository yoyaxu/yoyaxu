# ApuestasPRO

Prototipo estático para comparar cuotas americanas pre-juego, registrar recomendaciones y calcular utilidad estimada de la empresa.

## Preview local

```bash
npm start
```

Abre `http://localhost:3000`.

El servidor local (`server.mjs`) sirve los archivos estáticos y expone endpoints locales para proveedores:

```text
GET  /api/sportider/today-events
GET  /api/betcris/status
POST /api/betcris/login
GET  /api/betcris/pregame-events
POST /api/betcris/logout
```

## Betcris: fase 1 login asistido

Betcris se integra en modo **solo lectura**. La idea es que puedas probar con una cuenta sin saldo para leer cuotas y llenar el comparador.

1. Instala dependencias opcionales cuando quieras probar Betcris:

   ```bash
   npm install
   npm run install:browsers
   ```

2. Inicia el preview:

   ```bash
   npm start
   ```

3. En el comparador, pulsa **Login Betcris**.
4. Escribe usuario y contraseña en el sistema local.
5. El servidor abre una sesión local de navegador con Playwright, intenta entrar a Betcris y luego intenta leer cuotas visibles.

### Seguridad de credenciales

- La contraseña se envía solo al servidor local (`localhost`) para intentar abrir la sesión.
- No se guarda en `app.js`, `localStorage`, Git ni logs.
- La sesión del navegador se guarda en `.auth/betcris` para reusar cookies si Betcris lo permite.
- `.auth/`, `.env` y `node_modules/` están en `.gitignore`.

## Datos reales y límites

- **Sportider 365**: se intenta cargar desde el endpoint público `https://365.sportider.com/api/sportevent/today-events`.
- **Betcris**: se intenta cargar por login asistido local, de solo lectura, con Playwright.
- **SportsPick / Fórmula 43 y Juancito Sport**: quedan como entrada manual/asistida cuando requieren login del encargado.
- El sistema **no coloca apuestas**, **no evade bloqueos**, **no resuelve captchas** y **no intenta saltar protecciones**.
- Si aparece captcha, bloqueo o validación extra, el flujo correcto es intervención manual o entrada manual de cuotas.

## Flujo recomendado

1. Abrir el comparador.
2. Cargar juegos reales de Sportider.
3. Iniciar sesión Betcris si quieres probar esa fuente.
4. Completar manualmente las cuotas de Juancito y SportsPick/Fórmula 43 si aplican.
5. Comparar la mejor línea por selección o combinada.
6. Registrar la recomendación con snapshot de cuotas.
7. El encargado coloca la jugada manualmente en la página recomendada.
