// Copias locales con versiones fijas; una carga fallida nunca impide usar texto plano.
let libraries = {};
try {
  const [parser, sanitizer] = await Promise.all([
    import('../assets/vendor/marked-18.2.1.esm.js'),
    import('../assets/vendor/dompurify-3.4.18.es.mjs'),
  ]);
  libraries = { marked: parser.marked, purify: sanitizer.default };
} catch {
  // Sin dependencias disponibles, el formulario conserva su funcionamiento.
}

const SANITIZE_OPTIONS = Object.freeze({
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ALLOWED_ATTR: ['href', 'title', 'start', 'align'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|#)/i,
  RETURN_DOM_FRAGMENT: true,
});

/** No altera el texto original ni desescapa barras invertidas. */
export function renderMarkdown(element, source, dependencies = libraries) {
  const original = typeof source === 'string' ? source : '';
  element.textContent = original;
  element.classList.toggle('markdown-rendered', false);
  try {
    const { marked, purify } = dependencies;
    if (typeof marked?.parse !== 'function' || typeof purify?.sanitize !== 'function' || !purify.isSupported) return false;
    const html = marked.parse(original, { gfm: true, breaks: true, async: false });
    if (typeof html !== 'string') return false;
    const fragment = purify.sanitize(html, SANITIZE_OPTIONS);
    if (fragment?.nodeType !== 11) return false;
    // Solo se agregan atributos constantes a enlaces ya sanitizados.
    for (const link of fragment.querySelectorAll('a')) {
      const href = link.getAttribute('href');
      if (!href) continue;
      if (/^https?:/i.test(href)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    }
    element.replaceChildren(fragment);
    element.classList.toggle('markdown-rendered', true);
    return true;
  } catch {
    element.textContent = original;
    element.classList.toggle('markdown-rendered', false);
    return false;
  }
}
