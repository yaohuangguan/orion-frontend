import { run } from 'react-snap';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import process from 'process';

(async () => {
  try {
    // 1. 获取原始路径 (Windows下是反斜杠)
    // 例如: E:\Coding\...\chrome.exe
    let rawPath = puppeteer.executablePath();

    // 使用 path.resolve 确保它是绝对路径且规范化
    let standardPath = path.resolve(rawPath);

    console.log(`🔍 Checking existence of: ${standardPath}`);

    // 2. 🔥 关键修改：在转换斜杠之前，先检查文件是否存在
    // 这样使用的是 Windows 最喜欢的原生路径格式
    if (!fs.existsSync(standardPath)) {
      console.error(`❌ Chrome file NOT found at: ${standardPath}`);
      console.error(`💡 Suggestion: Run 'npx puppeteer browsers install chrome' manually.`);
      throw new Error('Chrome executable missing');
    }

    console.log('✅ Chrome executable found!');

    // 3. 准备传给 react-snap 的路径
    let snapPath = standardPath;

    // 🩹 Windows 兼容：react-snap 内部调用 shell 时不喜欢反斜杠
    if (process.platform === 'win32') {
      snapPath = standardPath.split(path.sep).join('/');
    }

    console.log(`🚀 Feeding react-snap with: ${snapPath}`);

    // 4. 运行 react-snap
    await run({
      puppeteerExecutablePath: snapPath,

      source: 'dist',
      destination: 'dist',

      include: ['/', '/blogs'],

      puppeteerArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],

      pageLoadTimeout: 60000
    });

    console.log('✅ Pre-rendering complete!');
  } catch (error) {
    console.error('⚠️ Pre-rendering failed, but continuing build...', error.message);
    process.exit(0);
  }
})();
