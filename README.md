# 3.4 Web app para automatización IA

| Datos académicos | Información |
| --- | --- |
| Institución | Instituto Tecnológico de Pachuca |
| Carrera | Ingeniería en Tecnologías de la Información y Comunicaciones |
| Asignatura | Inteligencia Artificial Aplicada a las TIC |
| Autor | Derek Alejandro Vargas Meneses |
| Número de control | 22200792 |
| Fecha | 16 de noviembre de 2026 |
| Versión | v.01 |

**Estado:** aplicación funcional en navegador local, según las pruebas reportadas
por el autor. Preparada para publicación; GitHub Pages todavía no se ha desplegado
ni verificado. Este repositorio contiene exclusivamente el frontend estático.

## 1. Descripción general del proyecto

Aplicación web académica que recibe consultas sobre tecnologías de la información
y presenta explicaciones generadas por OpenAI, adaptadas al tema y nivel elegidos.
El navegador consume un Webhook HTTPS de n8n Cloud; n8n valida la entrada,
ejecuta una sola integración y devuelve JSON para su presentación.

La interfaz ofrece un dashboard responsivo con formulario y panel de respuestas,
estados de carga y error, Markdown sanitizado y favicon personalizado.
No requiere backend propio, funciones serverless ni compilación.

## 2. Objetivo de la práctica

Desarrollar e integrar una aplicación web externa con una automatización de IA,
aplicando validación de datos, comunicación HTTP asíncrona, control de errores,
protección de credenciales y presentación segura de contenido generado.
Comparar la integración nativa de OpenAI con el acceso mediante Responses API.

## 3. Tecnologías utilizadas

| Tecnología | Uso |
| --- | --- |
| HTML5 y CSS3 | Estructura semántica, estilos y diseño responsivo |
| Bootstrap 5.3.9 | Rejilla y controles; CSS por CDN con integridad SRI |
| JavaScript ES Modules | Separación de configuración, API, validación e interfaz |
| Fetch API y Async/Await | Solicitudes POST sin recargar la página |
| AbortController | Timeout configurable de 60 segundos |
| n8n Cloud | Webhook, validaciones, enrutamiento y respuesta unificada |
| OpenAI y Responses API | Generación de respuestas; modelo configurado gpt-4o-mini |
| Marked 18.2.1 | Interpretación de Markdown |
| DOMPurify 3.4.18 | Sanitización del contenido antes de insertarlo |
| GitHub Pages | Alojamiento estático previsto |
| Node.js 26 y jsdom 31.0.1 | Verificación local; no necesarios para servir el sitio |

Marked y DOMPurify se incluyen como copias locales con versiones fijas y
licencias en `assets/vendor/`. Bootstrap requiere conexión a su CDN.

## 4. Arquitectura

```text
GitHub Pages (HTML, CSS y JavaScript)
    → Fetch POST HTTPS
    → Webhook de n8n Cloud
    → Validación → Edit Fields → Switch
        ├─ OpenAI nativo
        └─ HTTP Request → OpenAI Responses API
    → Normalización → Respond to Webhook JSON
    → Navegador → Markdown → DOMPurify → Panel de respuesta
```

Workflow: **3.4 Web app para automatización IA - API**  
ID: `tyLB2QnbZxjZGVzx`.

La web inicia una solicitud por consulta. El Switch ejecuta únicamente la
integración seleccionada. El repositorio no contiene las credenciales del workflow.

## 5. Integraciones OpenAI

### Nodo OpenAI nativo

La opción `nativo` utiliza el nodo OpenAI integrado en n8n.
El workflow construye instrucciones académicas con tema y nivel, solicita una
respuesta en español de México y recibe el resultado del proveedor.
En las pruebas registradas se utilizó Gateway credits para esta rama.

### HTTP Request / Responses API

La opción `http` utiliza HTTP Request con POST a la Responses API oficial.
n8n construye dinámicamente `model`, `instructions` e `input`, y se autentica
mediante una credencial almacenada. Extrae el texto de los elementos
`output_text` contenidos en `output[].content[]`.

Ambas rutas incluyen concepto, funcionamiento, ejemplo y recomendación técnica.
El frontend procesa el mismo contrato JSON para las dos integraciones.

## 6. Funcionalidades implementadas

- Selección de tema, nivel e integración.
- Pregunta obligatoria, contador en tiempo real y límite de 1000 caracteres.
- Normalización Unicode NFC, espacios y finales de línea, preservando acentos.
- Validaciones por campo y mensajes accesibles con foco y aria-invalid.
- Envío sin recarga; bloqueo de controles y de solicitudes duplicadas.
- Estados de carga, resultado, error y limpieza para una nueva consulta.
- Metadatos visibles de tema, nivel e integración efectivamente utilizada.
- Markdown con negritas, cursivas, encabezados, listas, enlaces, código y tablas.
- Sanitización y respaldo en texto plano si falla el renderizado.
- Respuestas largas con scroll en escritorio y lectura adaptada a móvil.
- Sin respuestas simuladas como funcionamiento de la aplicación.

## 7. Estructura de carpetas y archivos

```text
webapp-automatizacion-ia/
├── index.html
├── .gitignore
├── .nojekyll
├── README.md
├── package.json
├── package-lock.json
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── validation.js
│   ├── ui.js
│   ├── main.js
│   └── markdown.js
├── assets/
│   ├── favicon.png
│   ├── README.md
│   └── vendor/
│       ├── marked-18.2.1.esm.js
│       ├── marked-LICENSE
│       ├── dompurify-3.4.18.es.mjs
│       ├── dompurify-LICENSE.txt
│       └── README.md
└── tests/
    ├── client.test.mjs
    ├── ui.test.mjs
    └── markdown.test.mjs
```

Los cinco módulos funcionales originales se conservan; `markdown.js` es el
sexto módulo, dedicado exclusivamente a la presentación segura.
`node_modules/` es una dependencia local de desarrollo y está excluida de Git.
Las pruebas no se cargan en la página. Las licencias de terceros deben conservarse.

El script PowerShell de pruebas de n8n está fuera de esta carpeta y **no forma
parte del repositorio del frontend**.

## 8. Instrucciones de uso

1. Abrir la aplicación con JavaScript habilitado.
2. Seleccionar tema y nivel.
3. Elegir OpenAI nativo o HTTP Request.
4. Escribir una pregunta concreta, de hasta 1000 caracteres.
5. Pulsar **Consultar con IA** y esperar sin volver a enviar.
6. Leer la respuesta y sus etiquetas de tema, nivel e integración.
7. Contrastar la información con fuentes académicas.
8. Pulsar **Limpiar** para iniciar otra consulta.

Las consultas reales pueden consumir créditos del proveedor.
Un timeout del cliente no garantiza que el servidor haya dejado de procesar.

## 9. Configuración de la Production URL del Webhook

La URL se configura únicamente en `js/config.js`:

```javascript
export const API_CONFIG = Object.freeze({
  url: 'https://protoitp.app.n8n.cloud/webhook/asistente-tic-34',
  contentType: 'application/json',
  timeoutMs: 60000,
});
```

Es la URL pública del Webhook, no una API Key. No usar la Test URL para la web
publicada. El endpoint de producción debe estar disponible en n8n.
No se requiere cambiar la URL al desplegar en GitHub Pages.

JSON es el formato preferido. Si un diagnóstico confirma incompatibilidad con
OPTIONS, puede cambiarse manualmente `contentType` a
`application/x-www-form-urlencoded`. No hay cambio automático ni reintentos.

## 10. Ejecución local

Servir esta carpeta mediante HTTP, por ejemplo con Live Server de VS Code si
ya está instalado. Abrir `index.html` desde la URL del servidor local.
Evitar abrir mediante `file://`, porque los módulos ES requieren un contexto
de carga compatible.

No es necesario ejecutar npm para visualizar la aplicación. Para reproducir
las pruebas automatizadas con Node.js 26:

```text
npm ci --ignore-scripts
npm test
```

Las dependencias npm son herramientas de desarrollo. GitHub Pages utiliza
directamente los archivos estáticos y las bibliotecas de `assets/vendor/`.

## 11. Despliegue en GitHub Pages

**Configuración prevista, todavía no aplicada:**

| Elemento | Valor |
| --- | --- |
| Usuario | Derek-Alejandro |
| Repositorio | webapp-automatizacion-ia |
| Rama | main |
| Carpeta de publicación | /(root) |
| URL esperada, no verificada | https://derek-alejandro.github.io/webapp-automatizacion-ia/ |

Cuando se autorice la publicación:

1. Crear el repositorio `webapp-automatizacion-ia` en la cuenta indicada.
2. Colocar **el contenido de esta carpeta** en la raíz de `main`; `index.html`
   debe estar en la raíz del repositorio, sin otra carpeta contenedora.
3. Incluir CSS, todos los módulos, favicon, bibliotecas y licencias. Conservar
   README, pruebas y archivos de dependencias para reproducibilidad.
4. Excluir `node_modules/`, archivos de entorno, credenciales, temporales y el
   script PowerShell externo. No subir la carpeta completa de prácticas.
5. En **Settings → Pages → Build and deployment**, seleccionar
   **Deploy from a branch**, **main** y **/(root)**; guardar.
6. Esperar la ejecución de Pages y revisar su resultado en GitHub.
7. Abrir la URL publicada y realizar las verificaciones pendientes.

`.nojekyll` indica que el proyecto es estático y no necesita procesamiento
Jekyll. Todas las rutas propias son relativas y soportan la subruta del repositorio.
No hacen falta backend ni un workflow personalizado de GitHub Actions.

Referencia: [configurar la fuente de publicación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### CORS en el dominio publicado

La prueba local no demuestra CORS desde GitHub Pages. En el navegador publicado,
revisar Red y Consola: OPTIONS, POST, estado HTTP y JSON.
Si n8n restringe orígenes, el origen que corresponde a este sitio es
`https://derek-alejandro.github.io`, sin la ruta del repositorio.
Revisar permisos para POST y Content-Type. No utilizar `no-cors`.
Solo tras diagnosticar un fallo, decidir si hace falta ajustar n8n o cambiar
manualmente el formato de envío. Esos cambios no se realizaron en esta preparación.

## 12. Validaciones y manejo de errores

| Campo | Valores aceptados |
| --- | --- |
| tema | Inteligencia artificial, Redes, Programación, Bases de datos, Internet de las cosas (IoT) |
| nivel | Básico, Intermedio, Avanzado |
| integracion | nativo, http |
| pregunta | Texto significativo obligatorio, máximo 1000 caracteres; no solo espacios |

Entrada: exactamente `tema`, `nivel`, `pregunta`, `integracion`.

Respuesta exitosa:

```json
{
  "ok": true,
  "respuesta": "Texto generado por OpenAI",
  "tema": "Programación",
  "nivel": "Básico",
  "integracion": "nativo"
}
```

Respuesta de error:

```json
{
  "ok": false,
  "error": "Mensaje comprensible"
}
```

Los JSON anteriores ilustran el contrato; no son respuestas incorporadas a la app.
El cliente exige cinco campos en el éxito y que los metadatos coincidan con la
consulta enviada.

Se manejan HTTP 400, 401, 403, 404, 429, 500, 502 y 503, fallos de red, timeout,
JSON inválido y contrato incorrecto. Los mensajes internos del proveedor no se
muestran directamente. Un error Fetch no identifica por sí solo un fallo CORS:
también puede ser conectividad, endpoint o bloqueo del navegador.

## 13. Seguridad y protección de credenciales

- Las credenciales de OpenAI están exclusivamente en n8n, nunca en el navegador.
- El cliente usa HTTPS, omite credenciales del navegador y no registra secretos.
- `.gitignore` excluye dependencias, archivos de entorno, claves y temporales.
- La URL pública del Webhook no es un mecanismo de autenticación. CORS tampoco
  sustituye la autenticación ni el control de consumo del endpoint.
- El contenido Markdown se convierte con Marked y se sanitiza con DOMPurify
  mediante una lista de etiquetas y atributos permitidos.
- Solo se inserta el DocumentFragment sanitizado con `replaceChildren`.
  La aplicación no asigna HTML generado a `innerHTML`.
- Se eliminan scripts, eventos, iframes, SVG, formularios y estilos del contenido.
  Los enlaces HTTP(S) usan `noopener noreferrer`; se permiten también mailto
  y anclas. El código se presenta como texto.
- Si falla el procesamiento, se muestra la respuesta original con `textContent`.
  No se eliminan barras invertidas ni se altera el contenido generado.
- Antes de cualquier subida, revisar los archivos incluidos y el historial Git:
  `.gitignore` no elimina secretos que ya estuvieran versionados.

## 14. Pruebas y resultados comprobados

| Verificación | Evidencia y alcance | Estado |
| --- | --- | --- |
| OpenAI nativo | Ejecución n8n 44: respuesta real, solo rama nativa, gpt-4o-mini | Verificada previamente |
| HTTP / Responses API | Ejecución n8n 45: respuesta real, solo rama HTTP, gpt-4o-mini | Verificada previamente |
| Entrada inválida externa | Ejecución 49: POST con pregunta vacía, HTTP 400 y JSON de error recibidos por cliente externo | Verificada previamente |
| Navegador local, ambas integraciones | Funcionamiento confirmado por el autor durante el desarrollo | Reportada por el autor |
| Diseño responsivo y favicon local | Funcionamiento confirmado por el autor | Reportada por el autor |
| Pruebas automatizadas | 30 pruebas: validación, HTTP, contrato, timeout, duplicados, estados, Markdown y XSS | Aprobadas en la revisión local |
| Rutas y módulos | Recursos relativos, imports locales y sintaxis revisados | Revisados localmente |
| Despliegue main / root | Repositorio y Pages todavía no publicados | Pendiente |
| CORS desde GitHub Pages | OPTIONS y POST desde el origen definitivo | Pendiente |
| Ambas respuestas exitosas en Pages | HTTP 200, JSON, Markdown y metadatos correctos | Pendiente |
| Recursos y responsividad en Pages | CSS, módulos, bibliotecas, favicon y vista móvil | Pendiente |

Las pruebas automatizadas usan Fetch sustituido y DOM simulado; las de Markdown
emplean jsdom y las bibliotecas reales. Comprueban sanitización de HTML malicioso,
enlaces peligrosos, bloques de código, escapes y fallback. No consumen créditos
ni sustituyen una prueba en navegador real.

Esta etapa de documentación no realizó nuevas consultas a OpenAI ni modificó
el workflow. No se afirma que GitHub Pages funcione antes de su despliegue.

## 15. Autor y créditos académicos

**Desarrollado por Derek Alejandro Vargas Meneses**  
Ingeniería en Tecnologías de la Información y Comunicaciones (ITIC)  
Número de control: **22200792**  
Instituto Tecnológico de Pachuca — TecNM  
Asignatura: **Inteligencia Artificial Aplicada a las TIC**  
16 de noviembre de 2026 — **v.01**