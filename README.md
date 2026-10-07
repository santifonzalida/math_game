<p align="center">
  <img src="frontend/public/favicon.svg" width="88" alt="Math Game" />
</p>

<h1 align="center">Math Game</h1>

<p align="center">
  ¿Qué tan rápido calculás? Respondé 10 preguntas correctas lo más rápido posible y entrá al ranking.
</p>

<p align="center">
  <a href="https://math-game.up.railway.app/"><strong>▶ Jugar ahora</strong></a>
  &nbsp;·&nbsp;
  <a href="https://math-game.up.railway.app/ranking">Ver ranking</a>
</p>

---

## Cómo se juega

1. **Elegí tu nombre, una operación y un nivel.** El juego recuerda tu última elección para la próxima vez.
2. **Preparate.** Una cuenta regresiva de 3, 2, 1 te da tiempo para acomodarte; el cronómetro arranca recién cuando aparece la primera pregunta.
3. **Respondé.** Apenas escribís el resultado correcto, el juego pasa solo a la siguiente pregunta: no hace falta apretar ningún botón.
4. **Si te equivocás**, la pregunta no cambia: tenés que resolverla para avanzar. El error queda anotado, pero lo que realmente te penaliza es el tiempo que perdés.
5. **Llegá a 10 correctas.** Ese es el final de la partida: tu tiempo se guarda y ves en qué puesto quedaste.

La meta es simple: **bajar tu récord**. Cada combinación de operación y nivel tiene su propio ranking.

## Dos modos de juego

- **Competir.** Tu tiempo entra al ranking. Necesitás poner tu nombre.
- **Práctica libre.** Para entrenar sin presión: el tiempo no se guarda en el ranking y el nombre es opcional.
  - **Ver respuesta:** si te equivocás en una pregunta, podés ver la respuesta correcta. Igual tenés que escribirla para avanzar, así la aprendés.
  - **Comparación con el récord:** al terminar, ves cuánto te faltó para el récord del nivel, o si lo superaste.
  - **Tu mejor tiempo:** el juego recuerda tu mejor práctica en cada operación y nivel. Se guarda solo en tu navegador.
  - **Del entrenamiento a la competencia:** con **Competir en este nivel** pasás directo al modo competitivo con la misma operación y nivel.

## Operaciones y niveles

Hay 4 operaciones con 3 niveles cada una, en total 12 desafíos distintos.

| Operación | Bajo | Medio | Alto |
| --- | --- | --- | --- |
| **+ Suma** | números de 0 a 9 | de 0 a 99 | de 0 a 999 |
| **− Resta** | números de 0 a 9 | de 0 a 99 | de 0 a 999 |
| **× Multiplicación** | tablas del 0 al 9 | dos cifras × una cifra (47 × 6) | dos cifras × dos cifras (47 × 36) |
| **÷ División** | inversa de las tablas (56 ÷ 7) | hasta tres cifras ÷ una cifra (423 ÷ 9) | hasta cuatro cifras ÷ dos cifras (1692 ÷ 36) |

- **Las divisiones siempre dan exactas.** Nunca vas a tener que lidiar con decimales ni con divisiones por cero.
- **La resta puede dar negativo** (por ejemplo, 23 − 58 = −35). En el celular, como el teclado numérico no tiene signo menos, aparece un botón **±** para cambiar el signo.

## Ranking

- **Un ranking por desafío.** Muestra el top 10 de cada operación y nivel, ordenado por el menor tiempo.
- **Empates.** Si dos jugadores hacen el mismo tiempo, queda adelante el que lo logró primero.
- **Tu resultado.** Al terminar una partida ves tu puesto, y si quedaste primero, el juego te avisa que es un **nuevo récord**. Desde ahí podés ir al ranking, donde tu fila aparece resaltada.
- **Estadísticas.** La pantalla de ranking muestra cuántas partidas se completaron en total y, en una sección desplegable, cuántas en cada operación y nivel.

## Pensado para jugar en cualquier lado

- **Celular y computadora.** Funciona igual de bien en los dos. En el celular, el teclado numérico se abre solo al empezar la partida.
- **Modo claro y oscuro.** Sigue automáticamente la preferencia de tu dispositivo.
- **Rápido de jugar.** Una partida completa dura menos de un minuto en los niveles bajos.

---

## Para desarrolladores

El proyecto es un monorepo con dos aplicaciones:

| Carpeta | Qué hace | Tecnología |
| --- | --- | --- |
| [`frontend/`](frontend) | La interfaz del juego | Angular 22, Tailwind CSS |
| [`backend/`](backend) | Genera las preguntas y guarda el ranking | NestJS, PostgreSQL |

### Correrlo localmente

Necesitás Node.js 24, [pnpm](https://pnpm.io) y PostgreSQL.

**Backend** (queda en `http://localhost:3000`):

```bash
cd backend
pnpm install
cp .env.example .env   # completá los datos de tu base de datos
pnpm start:dev
```

**Frontend** (queda en `http://localhost:4200`):

```bash
cd frontend
npm install
npm start
```

Para jugar desde el celular en la misma red, levantá el frontend con `npm start -- --host 0.0.0.0` y agregá `http://<ip-de-tu-pc>:4200` a `CORS_ORIGIN` en `backend/.env`.

### Deploy

- **Frontend:** incluye un `Dockerfile` que sirve la app con nginx. La URL del backend se configura con la variable `API_URL` al levantar el contenedor.
- **Backend:** se configura con las variables de [`backend/.env.example`](backend/.env.example).

### Juego limpio

El ranking no confía en el navegador. El servidor crea cada partida, valida cada respuesta en orden y mide el tiempo oficial con su propio reloj. Las partidas con tiempos humanamente imposibles no entran al ranking, y hay un límite de pedidos por IP.
