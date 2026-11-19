// PM2 process file: `pm2 start deploy/ecosystem.config.cjs && pm2 save`
module.exports = {
  apps: [
    {
      name: 'website',
      cwd: __dirname + '/..',
      script: 'apps/server/dist/index.js',
      node_args: '--env-file=.env',
      instances: 1, // the in-memory rate limiter and local uploads assume one process; use Redis/S3 before scaling out
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_memory_restart: '600M',
      time: true,
    },
  ],
};
