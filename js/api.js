import { API_CONFIG } from './config.js';
import { TEMAS, NIVELES, INTEGRACIONES } from './validation.js';
const HTTP_MESSAGES = Object.freeze({
  400: 'La consulta no fue aceptada. Revisa los campos e intenta de nuevo.',
  401: 'El servicio no pudo autorizar la consulta. Solicita al responsable revisar la configuración.',
  403: 'El servicio no permite esta solicitud. Solicita al responsable revisar el acceso.',
  404: 'El endpoint no está disponible. El workflow podría seguir sin publicar.',
  429: 'Se alcanzó el límite de consultas. Espera antes de intentar nuevamente.',
  500: 'El asistente tuvo un problema interno. Intenta más tarde.',
  502: 'El proveedor de IA no pudo completar la respuesta. Intenta más tarde.',
  503: 'El servicio está temporalmente fuera de servicio. Intenta más tarde.',
});
export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN', status = null } = {}) {
    super(message); this.name = 'ApiError'; this.code = code; this.status = status;
  }
}
/** Una sola solicitud; nunca cambia el formato ni reintenta automáticamente. */
export async function requestAnswer(values, config = API_CONFIG) {
  const payload = { tema: values.tema, nivel: values.nivel, pregunta: values.pregunta, integracion: values.integracion };
  if (!['application/json', 'application/x-www-form-urlencoded'].includes(config.contentType) || !Number.isFinite(config.timeoutMs) || config.timeoutMs <= 0)
    throw new ApiError('La configuración del cliente no es válida.', { code: 'CONFIG' });
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeoutMs);
  try {
    const response = await fetch(config.url, {
      method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': config.contentType, Accept: 'application/json' },
      body: config.contentType === 'application/json' ? JSON.stringify(payload) : new URLSearchParams(payload).toString(),
      signal: controller.signal,
    });
    const raw = await response.text();
    // No se muestran mensajes internos devueltos por n8n o por el proveedor.
    if (!response.ok) throw new ApiError(HTTP_MESSAGES[response.status] ?? 'No fue posible completar la consulta. Intenta más tarde.', { code: 'HTTP', status: response.status });
    let result;
    try { result = JSON.parse(raw); }
    catch { throw new ApiError('El servicio devolvió una respuesta que no es JSON válido.', { code: 'INVALID_JSON', status: response.status }); }
    if (!result || Array.isArray(result) || typeof result !== 'object' || typeof result.ok !== 'boolean')
      throw new ApiError('La respuesta del servicio no tiene el formato esperado.', { code: 'CONTRACT', status: response.status });
    if (result.ok === false) throw new ApiError('El asistente no pudo resolver la consulta. Revisa los campos o intenta más tarde.', { code: 'SERVICE', status: response.status });
    const keys = ['ok', 'respuesta', 'tema', 'nivel', 'integracion'];
    if (Object.keys(result).length !== keys.length || !keys.every(k => Object.hasOwn(result, k)) ||
        typeof result.respuesta !== 'string' || !result.respuesta.trim() ||
        !TEMAS.includes(result.tema) || !NIVELES.includes(result.nivel) || !INTEGRACIONES.includes(result.integracion) ||
        result.tema !== payload.tema || result.nivel !== payload.nivel || result.integracion !== payload.integracion)
      throw new ApiError('La respuesta recibida no corresponde al formato o a la consulta enviada.', { code: 'CONTRACT', status: response.status });
    return result;
  } catch (error) {
    if (timedOut) throw new ApiError('Se agotó el tiempo de espera. La consulta podría seguir procesándose; no se ha reenviado.', { code: 'TIMEOUT' });
    if (error instanceof ApiError) throw error;
    throw new ApiError('No fue posible conectar con el asistente. Revisa tu conexión. También puede deberse a CORS, al endpoint o a un bloqueo del navegador; consulta la pestaña Red para diagnosticarlo.', { code: 'NETWORK' });
  } finally { clearTimeout(timer); }
}