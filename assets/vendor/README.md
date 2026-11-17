# Bibliotecas de presentación

Copias originales de paquetes npm, fijadas explícitamente:

- Marked 18.2.1: `marked/lib/marked.esm.js` (MIT).
- DOMPurify 3.4.18: `dompurify/dist/purify.es.mjs` (Apache-2.0 o MPL-2.0).

Se conservan las licencias junto a las copias. Las importaciones usan rutas
relativas, sin CDN, backend ni compilación en GitHub Pages. `package-lock.json`
fija los paquetes para reproducir las verificaciones; node_modules no se publica.
jsdom 31.0.1 se utiliza exclusivamente en pruebas locales.

Actualizar las copias requiere revisar versiones, licencias y ejecutar las
pruebas de Markdown y sanitización. No modificar a mano los archivos de terceros.
