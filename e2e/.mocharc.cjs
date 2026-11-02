// Konfigurasi Mocha untuk test E2E (npm run test:e2e). File spec berjalan berurutan (a → i).
module.exports = {
  spec: ['e2e/specs/*.spec.js'],
  require: ['e2e/support/hooks.js'],
  timeout: 120000,
  slow: 15000,
  reporter: 'spec',
}
