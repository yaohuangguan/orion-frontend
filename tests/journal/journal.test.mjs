import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const output = process.env.JOURNAL_OUTPUT || 'test-results/journal';
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (process.platform === 'win32'
      ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
      : undefined),
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => {
  errors.push(error.message);
  console.error('BROWSER', error.stack);
});
let published = null;
let uploads = 0;
let failUpload = false;
await page.setRequestInterception(true);
page.on('request', async (req) => {
  const url = req.url();
  if (url.includes('/api/')) {
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*'
    };
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
    if (url.endsWith('/upload')) {
      uploads++;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return req.respond({
        status: failUpload ? 500 : 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ url: 'https://journal-test.invalid/image.png' })
      });
    }
    if (url.includes('/cloudinary/'))
      return req.respond({ status: 500, headers, body: 'test upload failure' });
    if (
      (url.includes('/posts') || url.includes('/todo')) &&
      ['POST', 'PUT'].includes(req.method())
    ) {
      published = JSON.parse(req.postData());
      return req.respond({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    }
    return req.respond({
      status: 200,
      headers,
      contentType: 'application/json',
      body:
        url.includes('/posts') || url.includes('/todo')
          ? JSON.stringify({
              data: [],
              pagination: { currentPage: 1, totalPages: 0, totalPosts: 0, perPage: 10 }
            })
          : '[]'
    });
  }
  if (url === 'https://journal-test.invalid/image.png')
    return req.respond({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJawAAAAASUVORK5CYII=',
        'base64'
      )
    });
  return req.continue();
});
const checks = [];
const check = (name, ok = true) => {
  assert.ok(ok, name);
  checks.push(name);
  console.log('PASS', name);
};
const click = async (label) => {
  await page.locator(`button[aria-label="${label}"]`).click();
};
const textClick = async (text) => {
  await page.locator(`::-p-text(${text})`).click();
};
const paste = async (text, html = '') =>
  page.$eval(
    '[aria-label="日记正文"]',
    (el, data) => {
      el.focus();
      const dt = new DataTransfer();
      dt.setData('text/plain', data.text);
      if (data.html) dt.setData('text/html', data.html);
      el.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
      );
    },
    { text, html }
  );
try {
  await page.goto('http://127.0.0.1:5178/tests/journal/index.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('[aria-label="日记正文"]');
  check('Editor loads without an overlay', !(await page.$('vite-error-overlay')));
  await page.type('[aria-label="日记标题"]', '把今天写下来 · A quiet Sunday');
  await page.type('[aria-label="日记标签"]', 'Life Science');
  const source = String.raw`## 一点思考，一点生活

算毫瓦（mW）：$$P(\text{mW}) = 10^{\frac{\text{dBm}}{10}}$$

行内公式 $\log_{10}(1000)=3$，以及 \(x^2 + y^2\)。

> 今天的收获：把复杂的事，慢慢写清楚。

- 一起散步
- 留下一张照片

\`\`\`text
price = "$10"; $$not_math$$
\`\`\``.replaceAll('\\`', '`');
  await paste(source);
  await page.waitForSelector('.journal-reader .katex');
  check(
    'Pasted display + inline LaTeX renders in editor and reader',
    await page.$$eval('.journal-reader .katex', (els) => els.length >= 3)
  );
  check(
    'Power formula has a real fraction and exponent',
    await page.$eval(
      '.journal-reader',
      (el) => !!el.querySelector('.mfrac') && !!el.querySelector('.msupsub')
    )
  );
  check(
    'Code block preserves dollar delimiters',
    await page.$eval(
      '.journal-reader pre',
      (el) => el.textContent.includes('$$not_math$$') && !el.querySelector('.katex')
    )
  );
  const before = await page.$eval('[aria-label="日记正文"]', (el) => {
    window.originalEditor = el;
    return el.innerHTML;
  });
  await page.type('[aria-label="日记标题"]', ' ✨');
  check(
    'Changing title preserves the same editor DOM and document',
    await page.$eval(
      '[aria-label="日记正文"]',
      (el, before) => el === window.originalEditor && el.innerHTML === before,
      before
    )
  );
  await page.click('[aria-label="日记正文"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('End');
  await page.keyboard.up('Control');
  await page.keyboard.press('Enter');
  await click('插入手写画布');
  await page.waitForSelector('svg[aria-label="手写画板"]');
  const rect = await page.$eval('svg[aria-label="手写画板"]', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page.mouse.move(rect.x + 45, rect.y + 70);
  await page.mouse.down();
  await page.mouse.move(rect.x + 170, rect.y + 140, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector('.journal-reader figure svg path'));
  check('Handwriting updates the shared reader as vector paths');
  await click('撤销笔画');
  check(
    'Handwriting undo works',
    await page.$$eval('.journal-reader figure svg path', (els) => els.length === 0)
  );
  await click('重做笔画');
  await textClick('编辑保存内容');
  await page.waitForSelector('svg[aria-label="手写画板"] path');
  check(
    'Serialized handwriting reopens as editable strokes',
    await page.$$eval('svg[aria-label="手写画板"] path', (els) => els.length === 1)
  );
  await page.screenshot({ path: `${output}/journal-light.png`, fullPage: true });
  await textClick('切换主题');
  check(
    'Cabin editor stays light while the external reader follows dark mode',
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('.journal-writing-scroll .journal-prose')).color !==
        getComputedStyle(document.querySelector('.journal-reader .journal-prose')).color
    )
  );
  check(
    'Paper remains legible in dark mode',
    await page.$eval(
      '.drawing-paper',
      (el) => getComputedStyle(el).backgroundColor === 'rgb(255, 253, 248)'
    )
  );
  await page.screenshot({ path: `${output}/journal-dark.png`, fullPage: true });
  await page.click('[aria-label="日记正文"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('End');
  await page.keyboard.up('Control');
  await page.keyboard.press('Enter');
  await page.$eval('[aria-label="日记正文"]', (el) => {
    const dt = new DataTransfer();
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    canvas.getContext('2d').fillRect(0, 0, 20, 20);
    const bytes = Uint8Array.from(atob(canvas.toDataURL().split(',')[1]), (c) => c.charCodeAt(0));
    dt.items.add(new File([bytes], 'clipboard.png', { type: 'image/png' }));
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
    );
  });
  await page.waitForSelector('.journal-reader img');
  check('Clipboard image uses existing upload endpoint', uploads === 1);
  check(
    'Reader persists R2-style remote URL, not a blob',
    await page.$eval(
      '.journal-reader img',
      (el) => el.getAttribute('src') === 'https://journal-test.invalid/image.png'
    )
  );
  await textClick('保存修改');
  await page.waitForFunction(() => document.querySelector('[aria-label="日记标题"]').value === '');
  check(
    'Save payload retains private visibility and structured formula + drawing HTML',
    published?.isPrivate === true &&
      published.content.includes('data-latex') &&
      published.content.includes('data-strokes') &&
      published.content.includes('https://journal-test.invalid/image.png') &&
      !published.content.includes('blob:')
  );
  const clean = await page.evaluate(() =>
    window.journalTest.renderContent(
      '<p onclick="alert(1)">safe</p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil.invalid"></iframe><span data-type="journal-math" data-latex="\\\\href{javascript:alert(1)}{x}"></span>'
    )
  );
  check(
    'Reader strips executable pasted HTML and untrusted embeds',
    !/onclick=|onerror=|<script|evil.invalid/.test(clean)
  );
  await page.type('[aria-label="日记标题"]', '私密草稿');
  await paste('刷新后继续写');
  await textClick('保存草稿');
  await textClick('重新打开');
  check(
    'Existing-entry draft restores after remount',
    await page.$eval('[aria-label="日记标题"]', (el) => el.value === '私密草稿')
  );
  await textClick('切换账号');
  check(
    'Partner account cannot inherit this account’s local draft',
    await page.$eval('[aria-label="日记标题"]', (el) => el.value === '')
  );
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await paste(String.raw`移动端公式 $$P = 10^{\frac{x}{10}}$$`);
  check(
    'Mobile page has no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  );
  await page.screenshot({ path: `${output}/journal-mobile.png`, fullPage: true });
  await page.goto('http://127.0.0.1:5178/tests/journal/index.html?store', {
    waitUntil: 'networkidle0'
  });
  check(
    'App Store includes the independent Note Learn app',
    await page.evaluate(() => document.body.innerText.includes('Note Learn'))
  );
  await page.goto('http://127.0.0.1:5178/tests/journal/index.html?cabin', {
    waitUntil: 'networkidle0'
  });
  await page.waitForSelector('[aria-label="日记正文"]');
  await paste(String.raw`真实 Journal 页面：$$P(\text{mW})=10^{\frac{\text{dBm}}{10}}$$`);
  await page.waitForSelector('.journal-reader .katex');
  check(
    'Actual JournalSpace integrates the editor and live reader',
    !!(await page.$('.journal-space .journal-composer'))
  );
  check(
    'Actual JournalSpace fits mobile',
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
  );
  await page.type('[aria-label="日记标题"]', '公开公式日记');
  await page.type('[aria-label="日记标签"]', 'Science');
  await page.click('[role="switch"][aria-label="私密日记"]');
  await textClick('发布公开日记');
  await page.waitForFunction(() => document.body.innerText.includes('Public Log'));
  check(
    'Publishing public journal sends public visibility and opens the public list',
    published?.isPrivate === false && published.content.includes('data-latex')
  );
  check(
    'Next new entry defaults back to private',
    await page.$eval(
      '[role="switch"][aria-label="私密日记"]',
      (el) => el.getAttribute('aria-checked') === 'true'
    )
  );
  await page.goto('http://127.0.0.1:5178/tests/journal/index.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('[aria-label="日记正文"]');
  const legacy = await page.evaluate(() =>
    window.journalTest.renderContent(
      '<h2>旧日记</h2><p style="color: black; background: white">旧段落 <strong>加粗</strong></p><div class="ql-code-block-container"><div class="ql-code-block">const x = 1;</div><div class="ql-code-block">console.log(x);</div></div><table><tr><td>数据</td></tr></table><img src="https://example.invalid/old.jpg"><span class="ql-formula" data-value="x^2"></span>'
    )
  );
  check(
    'Legacy HTML, Quill code, tables, images and formulas survive rendering',
    legacy.includes('旧日记') &&
      legacy.includes('console.log(x);') &&
      legacy.includes('<table>') &&
      legacy.includes('old.jpg') &&
      legacy.includes('katex')
  );
  await page.click('[aria-label="日记正文"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('End');
  await page.keyboard.up('Control');
  await page.keyboard.press('Enter');
  await paste('Before image');
  const pasteImage = async () =>
    page.$eval('[aria-label="日记正文"]', (el) => {
      el.focus();
      const dt = new DataTransfer();
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 20;
      const bytes = Uint8Array.from(atob(canvas.toDataURL().split(',')[1]), (c) => c.charCodeAt(0));
      dt.items.add(new File([bytes], 'clipboard.png', { type: 'image/png' }));
      el.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
      );
    });
  await pasteImage();
  await page.waitForSelector('.journal-upload-placeholder');
  check(
    'Publishing is disabled while uploading',
    await page.$eval('footer button:last-child', (el) => el.disabled)
  );
  await page.type('[aria-label="日记正文"]', 'Keep typing');
  await page.waitForSelector('.journal-reader img');
  check(
    'Typing while uploading is retained',
    await page.$eval('.journal-reader', (el) => el.textContent.includes('Keep typing'))
  );
  await click('撤销文字');
  await click('重做文字');
  check(
    'Image undo/redo never revives a revoked blob URL',
    !(await page.$('.journal-prose img[src^="blob:"]'))
  );
  failUpload = true;
  await pasteImage();
  await page.waitForSelector('.journal-upload-placeholder');
  await page.waitForFunction(() => !document.querySelector('.journal-upload-placeholder'));
  check(
    'Failed upload clears its placeholder and restores publishing',
    await page.$eval('footer button:last-child', (el) => !el.disabled)
  );
  check(
    'Failed upload preserves existing writing',
    await page.$eval('.journal-reader', (el) => el.textContent.includes('Before image'))
  );
  check('No uncaught browser errors', errors.length === 0);
  await fs.writeFile(
    `${output}/journal-verification.json`,
    JSON.stringify(
      {
        checks,
        errors,
        screenshots: ['journal-light.png', 'journal-dark.png', 'journal-mobile.png'],
        api: 'Intercepted test API; no production writes'
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
