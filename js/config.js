/** Configuración pública: las credenciales se administran exclusivamente en n8n. */
export const API_CONFIG = Object.freeze({
  url: 'https://protoitp.app.n8n.cloud/webhook/asistente-tic-34',
  // Alternativa manual tras diagnosticar OPTIONS/CORS:
  // 'application/x-www-form-urlencoded'. No hay cambio ni reenvío automático.
  contentType: 'application/json',
  timeoutMs: 60000,
});