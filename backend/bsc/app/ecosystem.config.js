module.exports = {
  apps: [
    {
      name: "okr-backend",
      script: "./dist/index.js",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL,
        NODE_ENV: "production",
      },
    },
    {
      name: "okr-frontend",
      script: "./.output/server/index.mjs",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
