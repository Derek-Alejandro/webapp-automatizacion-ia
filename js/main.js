import { validateForm } from './validation.js';
import { requestAnswer, ApiError } from './api.js';
import { createUI } from './ui.js';
const ui = createUI();
let inFlight = false;
let hasValidated = false;
const update = () => {
  ui.updateControls();
  if (hasValidated && !inFlight) ui.showValidation(validateForm(ui.readValues()).errors);
};
ui.form.addEventListener('input', update);
ui.form.addEventListener('change', update);
ui.form.addEventListener('reset', event => {
  if (inFlight) { event.preventDefault(); return; }
  hasValidated = false;
  queueMicrotask(() => ui.resetView());
});
ui.form.addEventListener('submit', async event => {
  event.preventDefault();
  if (inFlight) return;
  const result = validateForm(ui.readValues());
  hasValidated = true; ui.showValidation(result.errors, !result.valid);
  if (!result.valid) return;
  inFlight = true; ui.setBusy(true);
  try { ui.showResult(await requestAnswer(result.data)); }
  catch (error) { ui.showError(error instanceof ApiError ? error.message : 'No fue posible mostrar la respuesta. Intenta más tarde.'); }
  finally { ui.setBusy(false); inFlight = false; }
});