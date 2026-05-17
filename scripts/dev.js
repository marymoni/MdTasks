import { spawn } from 'node:child_process';
import path from 'node:path';

const viteBin = path.join('node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

const commands = [
  ['server', 'node', ['server/index.js']],
  ['client', viteBin, ['--host', '127.0.0.1']],
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
});

const shutdown = () => {
  for (const child of children) {
    child.kill();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
