import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
// Each invocation owns its server and chooses a free port, including in CI.
const server = await createServer({ root, server: { host: '127.0.0.1', port: 0, open: false } });
try {
  await server.listen();
  const address = server.httpServer.address();
  const env = { ...process.env, JOURNAL_BASE_URL: `http://127.0.0.1:${address.port}` };
  for (const test of ['journal.test.mjs', 'media.test.mjs']) {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [fileURLToPath(new URL(test, import.meta.url))], {
        cwd: root,
        env,
        stdio: 'inherit'
      });
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(`${test} exited with ${code}`))
      );
    });
  }
} finally {
  await server.close();
}
