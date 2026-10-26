# TUQO · Founder Portfolio

Sitio web estático (HTML + CSS + JS, sin build) que cuenta la historia de TUQO para admisiones universitarias.

## Estructura de la historia

| Sección | Para qué sirve |
|---|---|
| **Cover** | Gancho de 5 segundos: quién eres, qué es TUQO y 3 cifras |
| **30 sec** | La historia completa en 5 líneas, para el lector que no tiene tiempo |
| **01 Spark** | Quién eres y el momento en que empezó todo |
| **02 Problem** | El problema que viste y tu primer intento fallido |
| **03 Build** | Línea de tiempo + lo que construiste (scroll horizontal en escritorio) |
| **04 Case** | Una automatización paso a paso: antes / después / tu rol |
| **05 Next** | Resultados, lecciones, por qué esa universidad y contacto |

## Cómo completarlo

1. Abre `index.html` y busca `[` para encontrar todos los placeholders (`[Your Name]`, `[##]`, `[University]`…).
2. **Fotos y capturas:** guarda tus imágenes en una carpeta `assets/` y reemplaza cada bloque
   `<div class="ph">[...]</div>` por `<img src="assets/mi-foto.jpg" alt="Descripción">`.
3. **Cifras:** escribe números reales en los `[##]`. Si el texto es un número (por ejemplo `24` o `$1,200`), se anima contando al hacer scroll.
4. Cambia el enlace `https://example.com` del bloque de contacto por la web real de TUQO.

## Verlo en local

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Deploy en Vercel

1. En vercel.com → **Add New → Project** → importa este repositorio.
2. Framework preset: **Other**. Sin build command; output directory: la raíz (`.`).
3. Deploy. Cada push a la rama principal vuelve a publicar el sitio.

## Tecnología

- [GSAP 3.12.5 + ScrollTrigger](https://gsap.com) para las animaciones con scroll.
- [Lenis 1.1.13](https://lenis.darkroom.engineering) para el scroll suave.
- Fuentes de Google Fonts: Bricolage Grotesque, Silkscreen y Caveat.
- Respeta `prefers-reduced-motion`: si el visitante tiene las animaciones desactivadas, el sitio se muestra estático.
