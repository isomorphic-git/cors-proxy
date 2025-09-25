#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import handleRequest from './index.js';

const temp = tmpdir();

const {
  positionals: [cmd],
  values: { port, help, pid: pidFile, restart },
} = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h', default: false },
    port: { type: 'string', short: 'p', default: '9999' },
    pid: { type: 'string', default: join(temp, 'cors-proxy.pid') },
    restart: { type: 'boolean', short: 'r', default: false },
  },
  allowPositionals: true,
});

if (cmd == 'help' || help || !cmd) {
  console.log(`Usage: ${process.argv0} [...options] <command>

Commands:
    run                 Run the CORS proxy server in the foreground
    start               Start the CORS proxy server daemon
    stop                Stop the CORS proxy server daemon
    status              Show the status of the CORS proxy server daemon
Options:
    -h, --help          Show this help message
    -p, --port <port>   Port to listen on (default: 9999)
    --pid <path>        Path to PID file (default: ${join(temp, 'cors-proxy.pid')}
    -r, --restart       Restart the daemon if it is already running. Only valid with start`);
}

function getPID(strict) {
  let pid;
  try {
    pid = parseInt(readFileSync(pidFile, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error('No PID file');
      process.exit(strict ? 2 : 0);
    }

    console.error('Found existing PID file but could not read it');
    process.exit(strict ? 13 : 0);
  }

  try {
    process.kill(pid, 0);
    return [pid, true];
  } catch (e) {
    return [pid, false];
  }
}

switch (cmd) {
  case 'run': {
    const server = createServer(handleRequest);
    server.listen(port, () => console.log('Listening on port', port));
    process.on('beforeExit', () => {
      console.log('Shutting down server');
      server.close();
      unlinkSync(pidFile);
    });
    break;
  }
  case 'start': {
    if (existsSync(pidFile)) {
      const [pid, processExists] = getPID(true);

      if (!processExists) {
        unlinkSync(pidFile);
        console.error('Removed stale PID file');
      } else if (restart) {
        process.kill(pid);
        console.error('Stopped existing daemon');
      } else {
        console.error(`Daemon is already running (pid is ${pid})`);
        process.exit(16);
      }
    }

    const daemon = spawn(
      import.meta.filename,
      ['run', port && `--port=${port}`].filter((a) => a),
      { stdio: 'ignore', detached: true },
    );
    daemon.unref();
    console.log('Started CORS proxy daemon with PID', daemon.pid);
    writeFileSync(pidFile, daemon.pid.toString());
    break;
  }
  case 'stop': {
    const [pid, processExists] = getPID(true);

    if (processExists) process.kill(pid);
    else {
      unlinkSync(pidFile);
      console.error('Removed stale PID file');
    }
    break;
  }
  case 'status': {
    const [pid, processExists] = getPID(false);
    if (processExists) console.error('Daemon is running as pid', pid);
    else console.error('Not running, stale PID file');
    break;
  }
}
