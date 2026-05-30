module.exports = {
  apps: [
    {
      name: 'cromos-api',
      script: './server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
