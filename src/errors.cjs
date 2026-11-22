'use strict';
class EnvValidationError extends Error {
  constructor({ missing = [], invalid = [] } = {}) {
    const lines = ['ENV VALIDATION FAILED', ''];
    if (missing.length) { lines.push('Missing environment variables:'); for (const name of missing) lines.push(` - ${name}`); lines.push(''); }
    if (invalid.length) { lines.push('Invalid environment variables:'); for (const problem of invalid) lines.push(` - ${problem.name}: ${problem.message}`); lines.push(''); }
    lines.push('Application startup blocked.');
    super(lines.join('\n')); this.name = 'EnvValidationError'; this.missing = [...missing]; this.invalid = [...invalid];
    this.problems = [...missing.map((name) => ({ name, type: 'missing' })), ...invalid];
  }
}
module.exports = { EnvValidationError };
