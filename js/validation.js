export const TEMAS = Object.freeze(['Inteligencia artificial', 'Redes', 'Programación', 'Bases de datos', 'Internet de las cosas (IoT)']);
export const NIVELES = Object.freeze(['Básico', 'Intermedio', 'Avanzado']);
export const INTEGRACIONES = Object.freeze(['nativo', 'http']);
const text = v => typeof v === 'string' ? v.normalize('NFC') : '';
const compact = v => text(v).trim().replace(/\s+/gu, ' ');
export function validateForm(values) {
  const data = { tema: compact(values.tema), nivel: compact(values.nivel),
    pregunta: text(values.pregunta).replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n').trim(),
    integracion: compact(values.integracion) };
  const errors = {};
  if (!TEMAS.includes(data.tema)) errors.tema = 'Selecciona uno de los temas disponibles.';
  if (!NIVELES.includes(data.nivel)) errors.nivel = 'Selecciona Básico, Intermedio o Avanzado.';
  if (!INTEGRACIONES.includes(data.integracion)) errors.integracion = 'Selecciona OpenAI nativo o HTTP Request.';
  if (!data.pregunta) errors.pregunta = 'Escribe una pregunta; los espacios solos no son válidos.';
  else if (values.pregunta.length > 1000) errors.pregunta = 'La pregunta no puede superar 1000 caracteres.';
  else {
    const characters = data.pregunta.match(/[\p{L}\p{N}]/gu) ?? [];
    if (!/\p{L}/u.test(data.pregunta) || new Set(characters.map(c => c.toLocaleLowerCase('es-MX'))).size < 2 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(data.pregunta))
      errors.pregunta = 'Escribe una pregunta significativa, con letras y sin caracteres de control.';
  }
  return { valid: Object.keys(errors).length === 0, data, errors };
}