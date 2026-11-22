'use strict';
const { EnvValidationError } = require('./errors.cjs');
const { checkFormat } = require('./rules.cjs');
/** Validate environment values against a schema and return normalized values. */
function validateEnv(schema, options = {}) {
  const env = options.env ?? process.env;
  const silent = options.silent ?? false;
  const exitOnError = options.exitOnError ?? false;
  const base = { ...schema };
  const environmentSchemas = base.environments ?? {};
  delete base.environments;
  const activeSchema = { ...base, ...(environmentSchemas[env.NODE_ENV] ?? {}) };
  const values = {}; const missing = []; const invalid = [];
  for (const [name, rule] of Object.entries(activeSchema)) {
    let value = env[name];
    if ((value === undefined || value === '') && rule.default !== undefined) value = rule.default;
    if (value === undefined || value === '') { if (rule.required) missing.push(name); continue; }
    let parsed;
    if ((rule.type ?? 'string') === 'string') parsed = String(value);
    else if (rule.type === 'number') { parsed = Number(value); if (String(value).trim() === '' || !Number.isFinite(parsed)) { invalid.push({ name, message: 'Expected number' }); parsed = undefined; } }
    else if (rule.type === 'boolean') { if (value === true || value === 'true' || value === '1' || value === 1) parsed = true; else if (value === false || value === 'false' || value === '0' || value === 0) parsed = false; else invalid.push({ name, message: 'Expected boolean (true, false, 1, or 0)' }); }
    else invalid.push({ name, message: `Unknown type "${rule.type}"` });
    if (parsed === undefined) continue;
    values[name] = parsed; validateConstraints(name, parsed, rule, invalid);
  }
  if (missing.length || invalid.length) { const error = new EnvValidationError({ missing, invalid }); if (!silent) console.error(error.message); if (exitOnError) process.exit(1); throw error; }
  if (!silent) { console.log('✓ Environment validation successful!'); console.log(`✓ ${Object.keys(activeSchema).length} variables checked.`); }
  return values;
}
function validateConstraints(name, value, rule, invalid) {
  const fail = (message) => invalid.push({ name, message });
  if (typeof value === 'string') { if (rule.minLength !== undefined && value.length < rule.minLength) fail(`Must be at least ${rule.minLength} characters`); if (rule.maxLength !== undefined && value.length > rule.maxLength) fail(`Must be at most ${rule.maxLength} characters`); }
  if (typeof value === 'number') { if (rule.min !== undefined && value < rule.min) fail(`Must be at least ${rule.min}`); if (rule.max !== undefined && value > rule.max) fail(`Must be at most ${rule.max}`); }
  const allowed = rule.enum ?? rule.allowed;
  if (allowed && !allowed.includes(value)) fail(`Must be one of: ${allowed.join(', ')}`);
  if (rule.format && !checkFormat(String(value), rule.format)) fail(`Expected ${rule.format}`);
  if (rule.validate) { try { const result = rule.validate(value); if (result !== true) fail(typeof result === 'string' ? result : (rule.errorMessage ?? 'Custom validation failed')); } catch (error) { fail(error.message || rule.errorMessage || 'Custom validation failed'); } }
}
module.exports = { validateEnv };
