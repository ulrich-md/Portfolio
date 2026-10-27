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

## Proyectos reales que ya están en el sitio

| Proyecto | Tipo | Enlace | Dónde aparece |
|---|---|---|---|
| Ángeles Mastretta | Sitio oficial de la autora | https://angelesmastretta.com | Portada, Impact, monitor, expediente |
| Archivo Nexos | Chatbot sobre 32,942 textos (1978–2026) | https://www.archivonexos.online | Portada, Impact, celular, hoja, expediente |
| Casa Balseca | Vino de Ribera del Duero | https://casa-balseca.vercel.app | Impact, cuaderno |
| Manzanita Balseca | Refresco embotellado desde 1929 | https://manzanita-balseca-landing.lovable.app | Portada, Impact, cuaderno |
| Marco Balseca | Página de un político | https://marco-balseca.vercel.app | Impact, cuaderno |
| Peer Tutoring | Proyecto escolar, UWC Costa Rica | https://peer-tutoring-henna.vercel.app | Impact, recorte de periódico |

Las capturas están en `assets/proof/`. Las tomé de los sitios en vivo; si cambias un sitio, vuelve a tomarlas.

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

## Créditos de imágenes

Las capturas de `assets/proof/` son de proyectos de TUQO.


Todas las imágenes son de dominio público (CC0 / Public Domain Mark): se pueden usar sin pedir permiso ni dar crédito, pero aquí van sus fuentes.

- Texturas (kraft, corcho, madera, papel, metal): [ambientCG](https://ambientcg.com), CC0 — Cardboard002, Cork004, Wood051, Wood092, Paper001, PaintedMetal004.
- Pizarra (Impact, call sheet): [Chalkboard Chalk](https://stocksnap.io/photo/chalkboard-chalk-FQCCUDQ3N0) — Flat Lay Photos, CC0.
- Taza de café: [Top View Coffee Desk](https://www.rawpixel.com/image/5967272/top-view-coffee-desk) — autor desconocido, CC0. Fondo recortado con rembg.
- Terrario: [Terrarium in a glass bowl](https://www.rawpixel.com/image/430735/free-photo-image-terrarium-wooden-bloom) — Scott Webb, CC0. Fondo recortado con rembg.
- Teclado (portada): [Keyboard Desk](https://stocksnap.io/photo/keyboard-desk-XACD6BTT0S) — Lenharth Systems, CC0. Fondo recortado con rembg.
- Clip negro: [Binder clip clipart, stationery illustration](https://www.rawpixel.com/image/6588392/image-public-domain-black-illustrations) — autor desconocido, CC0. Fondo recortado con rembg.
- Casilleros (01 Problem, teñidos de verde en CSS): [School locker](https://www.rawpixel.com/image/6021920/school-locker-free-public-domain-cc0-photo) — autor desconocido, CC0.
- Recorte de periódico: [newspaper](https://www.rawpixel.com/image/5942351/free-public-domain-cc0-photo) — autor desconocido, CC0.

Para tus propias fotos (capturas, fotos con clientes, tu retrato) usa siempre imágenes tuyas.
