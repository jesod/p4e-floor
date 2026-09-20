# P4E Floor

Web app para la **P4E Fall Job Fair 2026** (RIM Park, Waterloo · miércoles 23 de septiembre).
160 empleadores sobre el plano real del recinto, pensada para usarse **con una mano, de pie, en un gimnasio**.

## Correr en local

```bash
npm install
npm run dev        # http://localhost:3000
```

## Subir a Vercel

El proyecto es Next.js 16 (App Router) y **prerenderiza las 167 páginas como estáticas**.
No necesita base de datos, variables de entorno ni configuración extra.

```bash
npx vercel          # preview
npx vercel --prod   # producción
```

O conectá el repo desde el dashboard de Vercel: detecta Next.js solo.

> El estado del usuario (recorrido, notas, visitados) vive en `localStorage` del teléfono.
> No hay backend, así que no hay nada que aprovisionar — ver "Siguiente nivel" abajo.

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Directorio. Búsqueda con evidencia, filtros, tres órdenes |
| `/e/[id]` | Ficha del empleador. 160 páginas estáticas, cada una compartible |
| `/plano` | Plano real del recinto, con tu recorrido numerado encima |
| `/ruta` | Recorrido en orden de barrido + modo turn-by-turn |
| `/fuentes` | De dónde sale cada dato y qué decidimos no mostrar |

## Decisiones de diseño

**Mobile-first de verdad.** El caso de uso duro no es leer en casa: es estar parado en un
gimnasio ruidoso con currículums en la otra mano. De ahí salen la navegación inferior al
alcance del pulgar, los targets de 46px, el modo turn-by-turn de una parada por pantalla y
los datos embebidos (funciona sin señal).

**Paleta de marcas de cancha.** RIM Park es un gimnasio; las líneas pintadas del piso son el
material propio del lugar. Azul de línea de cancha para lo interactivo, ámbar de alta
visibilidad **solo** para la advertencia de elegibilidad legal — el color no se gasta en nada más.

**El riel de pasillos es información, no decoración.** Cada segmento es un pasillo real del
recinto y su ancho es cuántas paradas tuyas caen ahí.

**Sin puntaje de match.** Cuando una empresa aparece en tu búsqueda, la app te dice qué texto
exacto la hizo aparecer y linkea a la fuente. Ver `/fuentes` y `../MATCHING.md`.

## Datos

`src/data/employers.json` se genera desde el pipeline en `../data/`. Regenerar:

```bash
cp ../data/app-payload.json src/data/employers.json
```

Regla del dataset: **si un dato no tiene fuente citable, no se muestra.** Ver `../RESEARCH.md`.
