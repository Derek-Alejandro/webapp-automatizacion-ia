import { renderMarkdown } from './markdown.js';

const ROUTE_LABELS = Object.freeze({ nativo: 'OpenAI nativo', http: 'HTTP Request · Responses API' });
const FIELDS = ['tema', 'nivel', 'pregunta', 'integracion'];
export function createUI() {
  const get = id => document.getElementById(id);
  const form = get('consultation-form');
  const controls = [...form.querySelectorAll('input, select, textarea, button')];
  const states = { empty: get('response-empty'), loading: get('response-loading'), error: get('response-error'), result: get('response-result') };
  const showState = name => {
    for (const [key, element] of Object.entries(states)) element.hidden = key !== name;
    get('response-panel').setAttribute('data-state', name);
  };
  const readValues = () => {
    const fields = new FormData(form);
    return Object.fromEntries(FIELDS.map(name => [name, fields.get(name) ?? '']));
  };
  const updateControls = () => {
    const length = get('pregunta').value.length;
    get('character-count').textContent = String(length);
    get('question-counter').classList.toggle('counter-limit', length >= 950);
    get('selected-route').textContent = ROUTE_LABELS[form.querySelector('[name="integracion"]:checked')?.value] ?? 'Sin seleccionar';
  };
  const showValidation = (errors = {}, focus = false) => {
    for (const name of FIELDS) {
      const message = errors[name] ?? '';
      const hint = get(name + '-error');
      hint.textContent = message; hint.hidden = !message;
      for (const control of form.querySelectorAll('[name="' + name + '"]')) {
        control.classList.toggle('is-invalid', Boolean(message));
        control.setAttribute('aria-invalid', String(Boolean(message)));
      }
    }
    if (focus) {
      const first = FIELDS.find(name => errors[name]);
      if (first) form.querySelector('[name="' + first + '"]').focus();
      get('ui-message').textContent = 'Revisa los campos marcados antes de enviar.';
    }
  };
  const setBusy = busy => {
    controls.forEach(control => { control.disabled = busy; });
    get('response-panel').setAttribute('aria-busy', String(busy));
    get('submit-spinner').hidden = !busy;
    get('submit-label').textContent = busy ? 'Consultando el asistente...' : 'Consultar con IA';
    if (busy) {
      showState('loading'); get('response-status').textContent = 'Consultando';
      get('ui-message').textContent = 'Consultando el asistente...';
      get('response-text').textContent = ''; get('response-metadata').replaceChildren();
      get('response-error').textContent = '';
    }
  };
  const showResult = result => {
    renderMarkdown(get('response-text'), result.respuesta);
    const metadata = get('response-metadata'); metadata.replaceChildren();
    for (const [label, value] of [['Tema', result.tema], ['Nivel', result.nivel], ['Integración utilizada', ROUTE_LABELS[result.integracion]]]) {
      const pair = document.createElement('div');
      const term = document.createElement('dt'); const detail = document.createElement('dd');
      term.textContent = label; detail.textContent = value;
      pair.append(term, detail); metadata.append(pair);
    }
    showState('result'); get('response-status').textContent = 'Respuesta recibida';
    get('ui-message').textContent = 'Respuesta recibida. Puedes leerla en el panel de resultados.';
  };
  const showError = message => {
    get('response-error').textContent = message; showState('error');
    get('response-status').textContent = 'Consulta no completada'; get('ui-message').textContent = '';
  };
  const resetView = () => {
    showValidation(); showState('empty');
    get('response-text').textContent = ''; get('response-error').textContent = '';
    get('response-metadata').replaceChildren(); get('response-status').textContent = 'Sin consulta';
    get('ui-message').textContent = 'Formulario limpio. Puedes preparar una nueva pregunta.';
    updateControls(); get('tema').focus();
  };
  form.noValidate = true;
  get('availability-note').textContent = 'Las consultas se envían al asistente configurado. La disponibilidad depende del servicio.';
  showState('empty'); updateControls(); setBusy(false);
  return { form, readValues, updateControls, showValidation, setBusy, showResult, showError, resetView };
}
