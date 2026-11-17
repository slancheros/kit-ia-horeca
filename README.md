# Kit IA HORECA · Módulo 1

Herramientas web del taller **«IA para la productividad, el análisis y las decisiones»** (ADISLEV × UPV), para usar durante la sesión y en la actividad autónoma.

| Herramienta | Para qué sirve |
| --- | --- |
| **Inicio** | Explica en 3 pasos cómo usar el kit junto a tu herramienta de IA y cuándo usar cada herramienta. |
| **Guía** | Ruta del taller con temporizador por bloque, reglas de oro, checklist «¿Qué revisarías antes de enviar?», mini-reto en 5 líneas y plan de 7 días. |
| **Prompt C-O-D-F-V** | Construye un prompt con Contexto, Objetivo, Datos, Formato y Verificación, añade límites y cópialo. Incluye plantillas de los laboratorios. |
| **Margen** | Calcula ingresos, coste variable, contribución y margen por línea, y verifica las cifras que te da la IA. |
| **Decisión** | Matriz de decisión con pesos editables (50/30/20 por defecto), ranking en vivo y recomendación condicionada «si…, entonces…». |

Todos los datos de ejemplo son **ficticios**. La aplicación no envía nada a ningún servidor: lo que escribes se guarda solo en el navegador (`localStorage`).

## Uso local

Es una web estática sin dependencias ni paso de compilación.

```bash
npm start          # sirve la carpeta en http://localhost:8080
npm test           # pruebas unitarias de los cálculos (node --test)
```

## Estructura

```
index.html          vistas y marcado
css/styles.css      estilos (tema claro, acentos índigo y verde azulado)
js/app.js           navegación por pestañas (#guia, #prompt, #margen, #decision)
js/lib/calc.js      lógica pura: fórmulas, matriz ponderada, prompt — con pruebas en tests/
js/*.js             una vista por módulo
descargas/          material del estudiante (ZIP) enlazado desde Inicio
```

## Despliegue

Cada `push` a `main` ejecuta las pruebas y publica la web en **GitHub Pages** mediante `.github/workflows/pages.yml`.

## Licencia

MIT © 2026 Sandra Lancheros
