module.exports = {
  apps: [
    {
      name: 'okr-backend',
      script: './backend/dist/index.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 3001,
        DATABASE_URL: 'file:./prod.db',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'okr-frontend',
      script: './frontend/.output/server/index.mjs',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    }
  ]
}
