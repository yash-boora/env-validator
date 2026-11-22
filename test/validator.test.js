import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/index.js';

test('validates required values and returns parsed values', () => {
  const result = validateEnv({ PORT: { type: 'number', required: true }, READY: { type: 'boolean' } }, { env: { PORT: '3000', READY: 'true' }, silent: true });
  assert.deepEqual(result, { PORT: 3000, READY: true });
});
test('reports missing values', () => {
  assert.throws(() => validateEnv({ SECRET: { required: true } }, { env: {}, silent: true }), /SECRET/);
});
test('reports wrong types', () => {
  assert.throws(() => validateEnv({ PORT: { type: 'number' } }, { env: { PORT: 'abc' }, silent: true }), /Expected number/);
});
test('applies defaults', () => {
  assert.deepEqual(validateEnv({ MODE: { default: 'dev' } }, { env: {}, silent: true }), { MODE: 'dev' });
});

test('parses both boolean string forms and rejects other values', () => {
  assert.deepEqual(validateEnv({ A: { type: 'boolean' }, B: { type: 'boolean' } }, { env: { A: '0', B: 'false' }, silent: true }), { A: false, B: false });
  assert.throws(() => validateEnv({ A: { type: 'boolean' } }, { env: { A: 'yes' }, silent: true }), /Expected boolean/);
});
test('enforces string length constraints', () => {
  assert.throws(() => validateEnv({ A: { minLength: 3 } }, { env: { A: 'ab' }, silent: true }), /at least 3 characters/);
  assert.throws(() => validateEnv({ A: { maxLength: 2 } }, { env: { A: 'abc' }, silent: true }), /at most 2 characters/);
});
test('enforces numeric bounds', () => {
  assert.throws(() => validateEnv({ A: { type: 'number', min: 3 } }, { env: { A: '2' }, silent: true }), /at least 3/);
  assert.throws(() => validateEnv({ A: { type: 'number', max: 3 } }, { env: { A: '4' }, silent: true }), /at most 3/);
});
test('enforces enum and allowed values', () => {
  assert.throws(() => validateEnv({ A: { enum: ['a', 'b'] } }, { env: { A: 'c' }, silent: true }), /one of/);
  assert.deepEqual(validateEnv({ A: { allowed: ['a', 'b'] } }, { env: { A: 'b' }, silent: true }), { A: 'b' });
});
test('checks email, URL, and port formats', () => {
  const schema = { EMAIL: { format: 'email' }, URL: { format: 'url' }, PORT: { type: 'number', format: 'port' } };
  assert.deepEqual(validateEnv(schema, { env: { EMAIL: 'a@example.com', URL: 'https://example.com', PORT: '8080' }, silent: true }), { EMAIL: 'a@example.com', URL: 'https://example.com', PORT: 8080 });
  for (const [name, value] of [['EMAIL', 'bad'], ['URL', 'ftp://example.com'], ['PORT', '70000']]) {
    assert.throws(() => validateEnv({ [name]: schema[name] }, { env: { [name]: value }, silent: true }), new RegExp(`Expected ${schema[name].format}`));
  }
});
test('supports custom validation and custom error messages', () => {
  assert.deepEqual(validateEnv({ TOKEN: { validate: (value) => value.startsWith('sk_') } }, { env: { TOKEN: 'sk_123' }, silent: true }), { TOKEN: 'sk_123' });
  assert.throws(() => validateEnv({ TOKEN: { validate: () => false, errorMessage: 'Must start with sk_' } }, { env: { TOKEN: 'bad' }, silent: true }), /Must start with sk_/);
});
test('uses NODE_ENV-specific overrides', () => {
  const schema = { PORT: { type: 'number', default: 3000 }, environments: { production: { PORT: { type: 'number', required: true, min: 1024 } } } };
  assert.deepEqual(validateEnv(schema, { env: { NODE_ENV: 'development' }, silent: true }), { PORT: 3000 });
  assert.throws(() => validateEnv(schema, { env: { NODE_ENV: 'production', PORT: '80' }, silent: true }), /at least 1024/);
});
test('provides structured EnvValidationError details and report text', async () => {
  const { EnvValidationError } = await import('../src/index.js');
  assert.throws(() => validateEnv({ MISSING: { required: true }, PORT: { type: 'number' } }, { env: { PORT: 'nope' }, silent: true }), (error) => {
    assert.ok(error instanceof EnvValidationError);
    assert.deepEqual(error.missing, ['MISSING']);
    assert.deepEqual(error.invalid, [{ name: 'PORT', message: 'Expected number' }]);
    assert.match(error.message, /ENV VALIDATION FAILED[\s\S]*Application startup blocked\./);
    return true;
  });
});
test('CommonJS entry point exposes validateEnv', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const cjs = require('../');
  assert.deepEqual(cjs.validateEnv({ VALUE: {} }, { env: { VALUE: 'ok' }, silent: true }), { VALUE: 'ok' });
});
