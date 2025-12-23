// .puppeteerrc.cjs
const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // 把 Chrome 下载到项目目录下的 .cache 文件夹
  // 这样无论是在你本地，还是在 Vercel 上，路径都是可控的
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};