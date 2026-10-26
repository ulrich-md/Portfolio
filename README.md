# TUQO · Founder Portfolio

Sitio web estático (HTML + CSS + JS, sin build) que cuenta la historia de TUQO para admisiones universitarias.

## Estructura de la historia

| Sección | Para qué sirve |
|---|---|
| **Cover** (carpeta kraft) | Gancho de 5 segundos: qué es TUQO, ficha con cifras, credencial con tu nombre |
| **Impact** (pizarra) | El impacto primero: 4 cifras con notas de tiza + pruebas (premio, cliente, prensa, web en vivo) |
| **30 sec** (call sheet) | La historia completa en 5 líneas, para el lector sin tiempo |
| **01 Problem** (corcho) | El momento en que empezó, el problema y tu primer intento fallido |
| **02 Build** (escritorio de noche) | 6 proyectos como objetos sobre el escritorio (monitor, celular, hoja de automatización, cuaderno, recorte de prensa, sobre). La lámpara se arrastra y se apaga; todo se puede mover |
| **03 Case** (expediente) | Un proyecto con hilo rojo: antes → lo que construiste → después → lo que dijo el cliente |
| **04 Next** | Lecciones, por qué esa universidad y contacto |

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
- Fuentes de Google Fonts: Bricolage Grotesque, Instrument Serif, Gochi Hand y Courier Prime.
- Respeta `prefers-reduced-motion`: si el visitante tiene las animaciones desactivadas, el sitio se muestra estático.
