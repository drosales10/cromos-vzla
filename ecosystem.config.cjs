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
        API_PORT: 4000,
        API_JSON_LIMIT: '12mb'
      }
    }
  ]
};
