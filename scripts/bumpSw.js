// scripts/bump-sw.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process'; // 🔥 加上这一行，显式引入 process

// 构建路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 指向你的 sw.js (假设在 public 目录下)
const SW_PATH = path.resolve(__dirname, '../public/sw.js');

try {
  // 1. 读取文件
  let content = fs.readFileSync(SW_PATH, 'utf-8');

  // 2. 生成新版本号 (例如: orion-v1734862222123)
  const newVersion = `orion-v${Date.now()}`;

  // 3. 正则替换 CACHE_NAME
  // 匹配 const CACHE_NAME = '...'; 这种格式
  const regex = /const\s+CACHE_NAME\s*=\s*['"`].*?['"`];/;

  if (regex.test(content)) {
    const newContent = content.replace(regex, `const CACHE_NAME = '${newVersion}';`);

    // 4. 写入文件
    fs.writeFileSync(SW_PATH, newContent, 'utf-8');
    console.log(`✅ SW Cache Name updated to: ${newVersion}`);
  } else {
    console.error('❌ Error: Could not find CACHE_NAME variable in sw.js');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Failed to update SW version:', err);
  process.exit(1);
}
