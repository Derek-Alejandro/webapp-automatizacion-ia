import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// DOM real de jsdom y copias de producción de ambas bibliotecas; sin red.
const dom = new JSDOM('<!doctype html><div id="answer"></div>', { url: 'https://example.test/practica/' });
globalThis.window = dom.window;
const { renderMarkdown } = await import('../js/markdown.js');
const element = dom.window.document.getElementById('answer');

test('renderiza todos los formatos requeridos usando las dependencias locales', () => {
  const source = '# Concepto\n\n**Negrita** y *cursiva*, `x < 2`.\nOtra línea.\n\n## Funcionamiento\n\n- Uno\n- Dos\n\n1. Primero\n2. Segundo\n\n```python\nprint("áéíóú, ñ")\n```\n\n[Documentación](https://example.com/docs)\n\n| Tema | Nivel |\n| --- | --- |\n| Redes | Básico |';
  assert.equal(renderMarkdown(element, source), true);
  for (const selector of ['h1', 'h2', 'strong', 'em', 'code', 'br', 'ul li', 'ol li', 'pre code', 'a', 'table th', 'table td']) assert.ok(element.querySelector(selector), selector);
  assert.equal(element.querySelector('strong').textContent, 'Negrita');
  assert.equal(element.querySelector('pre code').textContent, 'print("áéíóú, ñ")\n');
  assert.equal(element.querySelector('a').getAttribute('target'), '_blank');
  assert.equal(element.querySelector('a').getAttribute('rel'), 'noopener noreferrer');
  assert.equal(element.classList.contains('markdown-rendered'), true);
});
test('retira scripts, atributos de evento, SVG, MathML, formularios y contenido activo', () => {
  const source = '**Texto válido**\n\n<script>window.pwned=1</script><img src=x onerror="window.pwned=1"><svg onload="window.pwned=1"><a href="javascript:alert(1)">x</a></svg><math><mtext>x</mtext></math><iframe srcdoc="<script>alert(1)</script>"></iframe><form><input autofocus onfocus="alert(1)"></form><style>body{display:none}</style><p onclick="alert(1)" style="color:red" id="location" data-x="1">Seguro</p>';
  assert.equal(renderMarkdown(element, source), true);
  assert.equal(element.querySelector('script,img,svg,math,iframe,form,input,style'), null);
  for (const node of element.querySelectorAll('*')) {
    for (const attr of node.attributes) assert.ok(!/^on|^style$|^id$|^data-/i.test(attr.name), attr.name);
  }
  assert.equal(element.querySelector('strong').textContent, 'Texto válido');
  assert.equal(dom.window.pwned, undefined);
});
test('elimina enlaces peligrosos y conserva HTTPS y mailto', () => {
  for (const href of ['javascript:alert(1)', 'java&#x73;cript:alert(1)', 'java&#10;script:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', 'vbscript:msgbox(1)', '//evil.example/path']) {
    assert.equal(renderMarkdown(element, `<a href="${href}" target="_blank">Enlace</a>`), true);
    assert.equal(element.querySelector('a').hasAttribute('href'), false, href);
  }
  renderMarkdown(element, '[Correo](mailto:docente@example.com)');
  assert.equal(element.querySelector('a').getAttribute('href'), 'mailto:docente@example.com');
});
test('no elimina escapes deliberados ni barras invertidas en código', () => {
  const source = String.raw`\*\*Concepto\*\*` + '\n\n' + '`' + String.raw`C:\Users\Derek` + '`';
  assert.equal(renderMarkdown(element, source), true);
  assert.equal(element.querySelector('strong'), null);
  assert.ok(element.textContent.includes('**Concepto**'));
  assert.equal(element.querySelector('code').textContent, String.raw`C:\Users\Derek`);
});
test('HTML de ejemplo en bloques de código queda como texto, no como elementos', () => {
  renderMarkdown(element, '```html\n<script>alert(1)</script>\n```');
  assert.equal(element.querySelector('script'), null);
  assert.equal(element.querySelector('code').textContent, '<script>alert(1)</script>\n');
});
test('fallback exacto cuando faltan bibliotecas o falla el procesamiento', () => {
  const source = '**Concepto**\n<img src=x onerror=alert(1)>\n' + String.raw`C:\Users\Derek`;
  for (const dependencies of [{}, { marked: { parse() { throw Error('Parser roto'); } }, purify: { isSupported: true, sanitize() {} } }, { marked: { parse() { return '<b>x</b>'; } }, purify: { isSupported: true, sanitize() { throw Error('Sanitizador roto'); } } }]) {
    assert.equal(renderMarkdown(element, source, dependencies), false);
    assert.equal(element.textContent, source);
    assert.equal(element.children.length, 0);
    assert.equal(element.classList.contains('markdown-rendered'), false);
  }
});
test('respuestas consecutivas reemplazan el contenido anterior', () => {
  renderMarkdown(element, '# Anterior');
  renderMarkdown(element, '**Nueva**');
  assert.equal(element.querySelector('h1'), null);
  assert.equal(element.querySelector('strong').textContent, 'Nueva');
});
