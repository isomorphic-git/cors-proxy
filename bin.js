#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const {spawn} = require('child_process')
const kill = require('tree-kill')
const minimisted = require('minimisted')

async function main({_: [cmd], p, d}) {
  switch (cmd) {
    case 'start': {
      if (d) require('daemonize-process')()
      const cmd = require.resolve('micro/bin/micro.js')
      const args = [
        cmd,
        `--listen=tcp://0.0.0.0:${p || 9999}`
      ]
      let server = spawn(
        'node', args,
        {
          stdio: 'inherit',
          windowsHide: true,
          cwd: __dirname
        }
      )
      fs.writeFileSync(
        path.join(process.cwd(), 'cors-proxy.pid'),
        String(process.pid),
        'utf8'
      )
      process.on('exit', server.kill)
      return
    }
    case 'stop': {
      let pid
      try {
        pid = fs.readFileSync(
          path.join(process.cwd(), 'cors-proxy.pid'),
          'utf8'
        );
      } catch (err) {
        console.log('No cors-proxy.pid file')
        return
      }
      pid = parseInt(pid)
      console.log('killing', pid)
      kill(pid, (err) => {
        if (err) {
          console.log(err)
        } else {
          fs.unlinkSync(path.join(process.cwd(), 'cors-proxy.pid'))
        }
      })
    }
  }
}

minimisted(main)
