import { validateEnv } from '../src/index.js';

const config = validateEnv({
  PORT: { type: 'number', required: true, min: 1, max: 65535 },
  DATABASE_URL: { type: 'string', required: true, format: 'url' },
  JWT_SECRET: { type: 'string', required: true, minLength: 10 },
  NODE_ENV: { type: 'string', default: 'development', enum: ['development', 'test', 'production'] }
});

console.log('Ready to start on port', config.PORT);
