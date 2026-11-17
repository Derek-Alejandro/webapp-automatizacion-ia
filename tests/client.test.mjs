import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateForm, TEMAS, NIVELES } from '../js/validation.js';
import { requestAnswer } from '../js/api.js';
import { API_CONFIG } from '../js/config.js';

// Todo Fetch se sustituye; estas pruebas nunca contactan n8n u OpenAI.
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const input = { tema: 'Programación', nivel: 'Básico', pregunta: '¿Qué es una variable en Python?', integracion: 'nativo' };
const success = { ok: true, respuesta: 'Concepto\nEjemplo: áéíóú, ñ. <script>texto</script>', tema: input.tema, nivel: input.nivel, integracion: input.integracion };
const config = { ...API_CONFIG, url: 'https://example.invalid/test' };

test('acepta todos los catálogos y ambas integraciones', () => {
  for (const tema of TEMAS) for (const nivel of NIVELES) for (const integracion of ['http','nativo']) {
    assert.equal(validateForm({ ...input, tema, nivel, integracion }).valid, true);
  }
});
test('normaliza NFC y espacios sin destruir saltos, indentación o símbolos', () => {
  const result = validateForm({ ...input, tema: '  Programacio\u0301n  ', pregunta: '  ¿Qué hace x < 2?  \r\n    print("ñ")  \n' });
  assert.equal(result.valid, true);
  assert.equal(result.data.tema, 'Programación');
  assert.equal(result.data.pregunta, '¿Qué hace x < 2?\n    print("ñ")');
});
test('rechaza campos faltantes, tipos incorrectos y valores ajenos al catálogo', () => {
  for (const field of Object.keys(input)) {
    for (const bad of [undefined, null, 10, {}, '   ', ...(field === 'pregunta' ? [] : ['no permitido'])]) {
      assert.ok(validateForm({ ...input, [field]: bad }).errors[field]);
    }
  }
});
test('rechaza preguntas vacías, símbolos, repeticiones y controles', () => {
  for (const pregunta of ['', ' \n\t ', '!!!', 'aaaa', '¿Hola?\u0000']) assert.ok(validateForm({ ...input, pregunta }).errors.pregunta);
});
test('acepta 1000 caracteres y rechaza 1001 antes de recortar', () => {
  assert.equal(validateForm({ ...input, pregunta: 'Ab' + 'x'.repeat(998) }).valid, true);
  assert.ok(validateForm({ ...input, pregunta: 'Ab' + 'x'.repeat(999) }).errors.pregunta);
});
test('envía cuatro campos exactos, un POST JSON y ninguna credencial', async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, config.url);
    assert.equal(options.method, 'POST');
    assert.equal(options.mode, 'cors');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), input);
    return new Response(JSON.stringify(success));
  };
  assert.deepEqual(await requestAnswer({ ...input, extra: 'omitido' }, config), success);
  assert.equal(calls, 1);
});
test('form-urlencoded se elige explícitamente y preserva acentos', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
    assert.deepEqual(Object.fromEntries(new URLSearchParams(options.body)), input);
    return new Response(JSON.stringify(success));
  };
  await requestAnswer(input, { ...config, contentType: 'application/x-www-form-urlencoded' });
});
for (const status of [400,401,403,404,429,500,502,503]) {
  test(`HTTP ${status}: mensaje sanitizado y sin reintentos`, async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response('INTERNAL_SECRET_STACK', { status }); };
    await assert.rejects(requestAnswer(input, config), error => error.status === status && error.code === 'HTTP' && !error.message.includes('INTERNAL_SECRET'));
    assert.equal(calls, 1);
  });
}
test('JSON inválido genera diagnóstico seguro', async () => {
  globalThis.fetch = async () => new Response('<html>no es JSON</html>');
  await assert.rejects(requestAnswer(input, config), { code: 'INVALID_JSON' });
});
test('rechaza cuerpos sin contrato, vacíos, campos extra y metadatos distintos', async () => {
  for (const result of [null, [], {}, { ok: true }, { ...success, respuesta: ' ' }, { ...success, extra: 1 }, { ...success, integracion: 'http' }, { ...success, nivel: 'Avanzado' }]) {
    globalThis.fetch = async () => new Response(JSON.stringify(result));
    await assert.rejects(requestAnswer(input, config), { code: 'CONTRACT' });
  }
});
test('ok false no expone el mensaje interno recibido', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: false, error: 'SECRET_STACK' }));
  await assert.rejects(requestAnswer(input, config), error => error.code === 'SERVICE' && !error.message.includes('SECRET_STACK'));
});
test('error Fetch no afirma que CORS sea la causa confirmada', async () => {
  globalThis.fetch = async () => { throw new TypeError('SECRET_NETWORK_DETAILS'); };
  await assert.rejects(requestAnswer(input, config), error => error.code === 'NETWORK' && error.message.includes('puede deberse') && !error.message.includes('SECRET_NETWORK'));
});
test('timeout aborta sin reintentar', async () => {
  let calls = 0;
  globalThis.fetch = async (_url, { signal }) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted','AbortError')), { once: true }));
  };
  await assert.rejects(requestAnswer(input, { ...config, timeoutMs: 5 }), { code: 'TIMEOUT' });
  assert.equal(calls, 1);
});
test('timeout también cubre la lectura del cuerpo', async () => {
  globalThis.fetch = async (_url, { signal }) => ({ ok: true, status: 200, text: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('aborted','AbortError')), { once: true })) });
  await assert.rejects(requestAnswer(input, { ...config, timeoutMs: 5 }), { code: 'TIMEOUT' });
});
test('configuración inválida no llama Fetch', async () => {
  globalThis.fetch = async () => { assert.fail('No debe enviarse ninguna solicitud'); };
  await assert.rejects(requestAnswer(input, { ...config, contentType: 'text/plain' }), { code: 'CONFIG' });
});
