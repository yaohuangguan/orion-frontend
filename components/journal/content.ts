import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import katex from 'katex';

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number; pressure: number }[];
}

export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
export const mathPattern =
  /(?<!\\)\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([^\n]+?)\\\)|(?<![\\\d])\$([^$\n]+?)\$(?!\d)/g;

export function mathMarkup(latex: string, display = false) {
  return `<span data-type="journal-math" data-latex="${escapeHtml(latex.trim())}" data-display="${display}">${escapeHtml(latex.trim())}</span>`;
}

const markdown = new Marked({ gfm: true, breaks: true });
markdown.use({
  extensions: [
    {
      name: 'journalMath',
      level: 'inline',
      start: (source) => source.search(/\$|\\[\[(]/),
      tokenizer(source) {
        const match = new RegExp('^(?:' + mathPattern.source + ')').exec(source);
        if (!match) return;
        return {
          type: 'journalMath',
          raw: match[0],
          latex: match[1] || match[2] || match[3] || match[4],
          display: !!(match[1] || match[2])
        };
      },
      renderer: (token) => mathMarkup(token.latex, token.display)
    }
  ]
});

export function parseStrokes(value: unknown): Stroke[] {
  try {
    const strokes = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(strokes) || strokes.length > 2000) return [];
    return strokes.filter(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        /^#[\da-f]{6}$/i.test(s.color) &&
        Number.isFinite(s.width) &&
        s.width >= 1 &&
        s.width <= 12 &&
        Array.isArray(s.points) &&
        s.points.length > 0 &&
        s.points.length <= 20000 &&
        s.points.every(
          (p) =>
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 0 &&
            p.x <= 1200 &&
            p.y >= 0 &&
            p.y <= 900
        )
    );
  } catch {
    return [];
  }
}

export function strokePath(stroke: Stroke) {
  return (
    stroke.points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    (stroke.points.length === 1 ? ' l0.1,0.1' : '')
  );
}

let drawingSerial = 0;
export function drawingSvg(strokes: Stroke[]) {
  const gridId = `journal-grid-${++drawingSerial}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="手写笔记"><defs><pattern id="${gridId}" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d8dfda"/></pattern></defs><rect width="1200" height="900" fill="#fffdf8"/><rect width="1200" height="900" fill="url(#${gridId})"/>${parseStrokes(
    strokes
  )
    .map(
      (s) =>
        `<path d="${strokePath(s)}" stroke="${s.color}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('')}</svg>`;
}

export function renderMath(latex: string, display = false) {
  return katex.renderToString(latex, {
    displayMode: display,
    throwOnError: false,
    trust: false,
    strict: 'ignore',
    maxExpand: 500,
    maxSize: 20,
    output: 'htmlAndMathml'
  });
}

export function safeEmbed(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' &&
      ((['www.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname) &&
        url.pathname.startsWith('/embed/')) ||
        (url.hostname === 'player.bilibili.com' && url.pathname === '/player.html') ||
        (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')))
      ? url.href
      : '';
  } catch {
    return '';
  }
}

/** One import path for the editor, saved entries, and their live preview. Never mutate stored originals. */
export function normalizeContent(content: string, format: 'auto' | 'html' | 'markdown' = 'auto') {
  const isHtml =
    format === 'html' ||
    (format === 'auto' &&
      /<\/?(?:p|div|h[1-6]|ul|ol|li|pre|blockquote|table|img|span|figure|iframe|video|br|strong|b|em|i|a)(?:\s|\/?>)/i.test(
        content
      ));
  const raw = isHtml ? content : (markdown.parse(content) as string);
  const clean = DOMPurify.sanitize(raw, {
    ADD_TAGS: ['iframe', 'code-block'],
    ADD_ATTR: ['allowfullscreen', 'frameborder'],
    FORBID_TAGS: ['style', 'button', 'input', 'form'],
    FORBID_ATTR: ['srcdoc']
  });
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc
    .querySelectorAll('.buttons, mat-icon, .mat-mdc-button-touch-target')
    .forEach((el) => el.remove());
  // Recover the source from equations copied from KaTeX/MathJax pages, rather than duplicate visual text.
  doc.querySelectorAll('.katex, mjx-container').forEach((el) => {
    const source =
      el.querySelector('annotation[encoding="application/x-tex"]')?.textContent ||
      el.getAttribute('data-latex');
    if (source)
      el.outerHTML = mathMarkup(
        source,
        !!el.closest('.katex-display') || el.getAttribute('display') === 'true'
      );
  });
  doc.querySelectorAll('.ql-formula').forEach((el) => {
    el.outerHTML = mathMarkup(el.getAttribute('data-value') || el.textContent || '');
  });
  doc.querySelectorAll('code-block, .ql-code-block-container').forEach((el) => {
    const pre = doc.createElement('pre');
    const code = doc.createElement('code');
    code.textContent =
      el.querySelector('code')?.textContent ||
      Array.from(el.querySelectorAll('.ql-code-block'))
        .map((line) => line.textContent)
        .join('\n') ||
      el.textContent;
    pre.append(code);
    el.replaceWith(pre);
  });
  doc.querySelectorAll<HTMLElement>('[style], [class], font').forEach((el) => {
    const align =
      el.style.textAlign || el.className.match?.(/ql-align-(center|right|justify)/)?.[1];
    const color = el.style.color;
    const size = el.style.fontSize;
    const font = el.style.fontFamily;
    el.removeAttribute('style');
    if (align && /^(left|center|right|justify)$/.test(align)) el.style.textAlign = align;
    if (color) el.style.color = color;
    if (/^\d+(\.\d+)?(px|em|rem|pt|%)$/.test(size)) el.style.fontSize = size;
    if (font) el.style.fontFamily = font;
  });
  doc.querySelectorAll('iframe').forEach((el) => {
    const src = safeEmbed(el.getAttribute('src') || '');
    if (!src) {
      el.remove();
      return;
    }
    el.setAttribute('src', src);
    el.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    el.setAttribute('loading', 'lazy');
    el.setAttribute('title', '嵌入视频');
  });
  doc.querySelectorAll('video').forEach((el) => {
    const src = el.getAttribute('src') || '';
    if (!/^https:\/\//i.test(src)) {
      el.remove();
      return;
    }
    el.removeAttribute('autoplay');
    el.setAttribute('controls', '');
    el.setAttribute('preload', 'metadata');
    el.setAttribute('playsinline', '');
    el.querySelectorAll('source, track').forEach((child) => child.remove());
  });
  doc.querySelectorAll('a').forEach((el) => {
    el.setAttribute('rel', 'noopener noreferrer');
  });
  doc.querySelectorAll('[data-type="journal-drawing"]').forEach((el) => {
    el.setAttribute('data-strokes', JSON.stringify(parseStrokes(el.getAttribute('data-strokes'))));
    el.textContent = '手写笔记';
  });
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (
      node.parentElement?.closest(
        'pre, code, [data-type="journal-math"], [data-type="journal-drawing"]'
      )
    )
      continue;
    const text = node.textContent || '';
    const matches = [...text.matchAll(new RegExp(mathPattern))];
    if (!matches.length) continue;
    const fragment = doc.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      fragment.append(doc.createTextNode(text.slice(cursor, match.index)));
      const template = doc.createElement('template');
      template.innerHTML = mathMarkup(
        match[1] || match[2] || match[3] || match[4],
        !!(match[1] || match[2])
      );
      fragment.append(template.content);
      cursor = match.index! + match[0].length;
    }
    fragment.append(doc.createTextNode(text.slice(cursor)));
    node.replaceWith(fragment);
  }
  return doc.body.innerHTML;
}

export function renderContent(content: string) {
  const doc = new DOMParser().parseFromString(normalizeContent(content), 'text/html');
  doc.querySelectorAll('[data-type="journal-math"]').forEach((el) => {
    el.innerHTML = renderMath(
      el.getAttribute('data-latex') || el.textContent || '',
      el.getAttribute('data-display') === 'true'
    );
  });
  doc.querySelectorAll('[data-type="journal-drawing"]').forEach((el) => {
    el.innerHTML = drawingSvg(parseStrokes(el.getAttribute('data-strokes')));
  });
  doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    if (!el.style.color) return;
    const color = el.style.color;
    el.style.setProperty('--ink-light', readableColor(color, false));
    el.style.setProperty('--ink-dark', readableColor(color, true));
    el.setAttribute('data-journal-ink', '');
  });
  return doc.body.innerHTML;
}

export function contentSummary(html: string) {
  const doc = new DOMParser().parseFromString(normalizeContent(html), 'text/html');
  doc.querySelectorAll('[data-type="journal-math"]').forEach((el) => {
    el.textContent = el.getAttribute('data-latex');
  });
  doc.querySelectorAll('img').forEach((el) => {
    el.replaceWith(doc.createTextNode(el.alt || '[图片]'));
  });
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Preserve the chosen hue while ensuring readable contrast on either paper. */
function readableColor(color: string, dark: boolean) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return dark ? '#dbe4de' : '#35443c';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const rgba = ctx.getImageData(0, 0, 1, 1).data;
  const bg = dark ? [24, 32, 30] : [255, 254, 250];
  const rgb = Array.from(rgba.slice(0, 3)).map(
    (c, i) => (c * rgba[3]) / 255 + bg[i] * (1 - rgba[3] / 255)
  );
  const luminance = (v: number[]) =>
    v
      .map((c) => c / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((n, c, i) => n + c * [0.2126, 0.7152, 0.0722][i], 0);
  const base = luminance(bg);
  let result = rgb;
  for (let step = 0; step <= 100; step++) {
    result = rgb.map((c) => Math.round(c + (((dark ? 255 : 0) - c) * step) / 100));
    const lum = luminance(result);
    if ((Math.max(lum, base) + 0.05) / (Math.min(lum, base) + 0.05) >= 4.5) break;
  }
  return `rgb(${result.join(', ')})`;
}

export function videoFromUrl(value: string): { type: string; attrs: { src: string } } | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return null;
    if (/\.(mp4|webm|ogg)(?:$)/i.test(url.pathname))
      return { type: 'journalVideo', attrs: { src: url.href } };
    let src = safeEmbed(url.href);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
      const id =
        url.hostname === 'youtu.be'
          ? url.pathname.slice(1)
          : url.searchParams.get('v') || url.pathname.split('/')[2];
      if (id && /^[\w-]{11}$/.test(id)) src = `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (['www.bilibili.com', 'bilibili.com'].includes(url.hostname)) {
      const id = url.pathname.match(/\/video\/(BV[\w]+)/)?.[1];
      if (id) src = `https://player.bilibili.com/player.html?bvid=${id}&autoplay=0`;
    }
    if (['vimeo.com', 'www.vimeo.com'].includes(url.hostname) && /^\/\d+$/.test(url.pathname))
      src = `https://player.vimeo.com/video${url.pathname}`;
    return src ? { type: 'journalEmbed', attrs: { src } } : null;
  } catch {
    return null;
  }
}
