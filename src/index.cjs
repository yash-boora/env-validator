'use strict';

const { validateEnv } = require('./validator.cjs');
const { EnvValidationError } = require('./errors.cjs');

module.exports = { validateEnv, EnvValidationError };
