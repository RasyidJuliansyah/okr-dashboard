module.exports = {
  apps: [
    // Backend
    {
      name: 'backend',
      port: 3001,
      script: '/app/backend/dist/index.js',
      cwd: '/app/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        API_PREFIX: '/api',
        CORS_ORIGIN: 'http://bsc.proc.skolla.online,https://bsc.proc.skolla.online'
      },
      restart_delay: 3000,
      max_restarts: 3,
      watch: false,
      error_file: '/app/logs/backend-error.log',
      out_file: '/app/logs/backend-out.log',
      log_file: '/app/logs/backend-combined.log',
      time: true
    },
    // Frontend (Nuxt)
    {
      name: 'frontend',
      port: 3000,
      script: '/app/frontend/.output/server/index.mjs',
      cwd: '/app/frontend',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
        NUXT_PUBLIC_API_BASE: '/api'
      },
      restart_delay: 3000,
      max_restarts: 3,
      watch: false,
      error_file: '/app/logs/frontend-error.log',
      out_file: '/app/logs/frontend-out.log',
      log_file: '/app/logs/frontend-combined.log',
      time: true
    }
  ]
};
