import test from 'node:test';
import assert from 'node:assert/strict';

test('interfaz y coordinación: validación, carga, duplicados, resultado seguro y limpieza sin red real', async () => {
  const originalDocument = globalThis.document;
  const originalFormData = globalThis.FormData;
  const originalFetch = globalThis.fetch;
  const elements = new Map();
  const events = {};
  const makeElement = () => ({
    value: '', hidden: false, disabled: false, textContent: '', children: [], attributes: {}, classes: new Set(),
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    get classList() { return { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) }; },
  });
  const get = id => { if (!elements.has(id)) elements.set(id, makeElement()); return elements.get(id); };
  const form = get('consultation-form');
  const radios = [makeElement(), makeElement()];
  radios[0].value = 'nativo'; radios[1].value = 'http';
  let selected = radios[0];
  const controls = [get('tema'), get('nivel'), get('pregunta'), ...radios, get('submit-button'), makeElement()];
  form.querySelectorAll = selector => {
    if (selector === 'input, select, textarea, button') return controls;
    const name = selector.match(/name="([^"]+)"/)[1];
    return name === 'integracion' ? radios : [get(name)];
  };
  form.querySelector = selector => selector.includes(':checked') ? selected : form.querySelectorAll(selector)[0];
  form.addEventListener = (type, callback) => { events[type] = callback; };
  globalThis.document = { getElementById: get, createElement: makeElement };
  globalThis.FormData = class { get(name) { return name === 'integracion' ? selected.value : get(name).value; } };
  let calls = 0;
  let resolveFetch;
  globalThis.fetch = () => { calls++; return new Promise(resolve => { resolveFetch = resolve; }); };
  const submitEvent = () => ({ prevented: false, preventDefault() { this.prevented = true; } });
  try {
    await import('../js/main.js');
    assert.equal(get('submit-button').disabled, false);
    await events.submit(submitEvent());
    assert.equal(calls, 0);
    assert.equal(get('tema-error').hidden, false);
    assert.equal(get('tema').attributes['aria-invalid'], 'true');
    assert.equal(get('tema').focused, true);
    get('tema').value = 'Redes'; get('nivel').value = 'Intermedio'; get('pregunta').value = '¿Cómo funciona TCP?';
    selected = radios[1]; events.input();
    assert.equal(get('character-count').textContent, String(get('pregunta').value.length));
    assert.match(get('selected-route').textContent, /HTTP/);
    assert.equal(get('tema-error').hidden, true);
    const first = events.submit(submitEvent());
    assert.equal(get('response-loading').hidden, false);
    assert.equal(get('response-panel').attributes['aria-busy'], 'true');
    assert.equal(get('submit-button').disabled, true);
    assert.equal(get('submit-label').textContent, 'Consultando el asistente...');
    await events.submit(submitEvent());
    assert.equal(calls, 1);
    const resetDuringRequest = submitEvent(); events.reset(resetDuringRequest);
    assert.equal(resetDuringRequest.prevented, true);
    const answer = '<img src=x onerror=alert(1)>\nSegunda línea: ñ';
    resolveFetch(new Response(JSON.stringify({ ok: true, respuesta: answer, tema: 'Redes', nivel: 'Intermedio', integracion: 'http' })));
    await first;
    assert.equal(get('response-text').textContent, answer);
    assert.equal(get('response-text').children.length, 0);
    assert.equal(get('response-result').hidden, false);
    assert.equal(get('response-panel').attributes['aria-busy'], 'false');
    assert.equal(get('submit-button').disabled, false);
    assert.equal(get('response-metadata').children.length, 3);
    get('tema').value = ''; get('nivel').value = ''; get('pregunta').value = ''; selected = radios[0];
    events.reset(submitEvent()); await new Promise(resolve => queueMicrotask(resolve));
    assert.equal(get('response-empty').hidden, false);
    assert.equal(get('response-text').textContent, '');
    assert.equal(get('character-count').textContent, '0');
    assert.equal(get('response-metadata').children.length, 0);
    get('tema').value = 'Redes'; get('nivel').value = 'Intermedio';
    get('pregunta').value = 'Ab' + 'x'.repeat(948); events.input();
    assert.equal(get('question-counter').classes.has('counter-limit'), true);
    const failed = events.submit(submitEvent());
    resolveFetch(new Response('Detalles internos', { status: 503 }));
    await failed;
    assert.equal(get('response-error').hidden, false);
    assert.equal(get('response-error').textContent.includes('Detalles internos'), false);
    assert.equal(get('submit-button').disabled, false);
    assert.equal(get('response-panel').attributes['aria-busy'], 'false');
  } finally {
    globalThis.document = originalDocument; globalThis.FormData = originalFormData; globalThis.fetch = originalFetch;
  }
});
