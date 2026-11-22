# env-validator

[![npm version](https://img.shields.io/npm/v/%40yash-boora%2Fenv-validator.svg)](https://www.npmjs.com/package/%40yash-boora%2Fenv-validator)
[![npm downloads](https://img.shields.io/npm/dm/%40yash-boora%2Fenv-validator.svg)](https://www.npmjs.com/package/%40yash-boora%2Fenv-validator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

Validate environment variables before your server starts. `@yash-boora/env-validator` has no runtime dependencies and supports both CommonJS and ES modules.

Repository: [github.com/yash-boora/env-validator](https://github.com/yash-boora/env-validator)

## Install

```sh
npm install @yash-boora/env-validator
```

Requires Node.js 18 or newer.

## Quick start

```js
const { validateEnv } = require('@yash-boora/env-validator');

const config = validateEnv({
  PORT: { type: 'number', required: true },
  DATABASE_URL: { type: 'string', required: true },
  JWT_SECRET: { type: 'string', required: true, minLength: 10 },
  NODE_ENV: { type: 'string', default: 'development' }
});

// Use validated, converted values in your application.
server.listen(config.PORT);
```

Validation returns a new object containing values that were present or received defaults. Numbers and booleans are converted to their JavaScript types. Missing optional values without defaults are omitted.

## ESM and CommonJS

CommonJS:

```js
const { validateEnv } = require('@yash-boora/env-validator');
```

ES modules:

```js
import { validateEnv } from '@yash-boora/env-validator';
```

Both forms are provided through the package `exports` map.

## API reference

### `validateEnv(schema, options?)`

Validates the selected schema, prints a success message unless silenced, and returns normalized configuration. On validation failure it prints a report unless silenced, then throws `EnvValidationError` by default.

```js
validateEnv({
  DEBUG: { type: 'boolean', default: false },
  PORT: { type: 'number', required: true, min: 1, max: 65535, format: 'port' },
  EMAIL: { type: 'string', format: 'email' },
  NODE_ENV: { type: 'string', enum: ['development', 'test', 'production'] }
}, { silent: false });
```

### Schema rules

Each variable maps to a rule object:

| Rule | Applies to | Description |
| --- | --- | --- |
| `type` | all | `string` (default), `number`, or `boolean` |
| `required` | all | Set to `true` to report missing or empty values |
| `default` | all | Value used when the variable is missing or empty; still validated against its other rules |
| `minLength`, `maxLength` | strings | Inclusive lower and upper length limits |
| `min`, `max` | numbers | Inclusive numeric bounds |
| `enum` or `allowed` | all | Array of accepted, already converted values |
| `format` | strings/numbers | Built-in `email`, `url`, or `port` check |
| `validate(value)` | all | Custom predicate; return `true` to pass, otherwise return `false` or an error string |
| `errorMessage` | custom | Message used when a custom predicate returns `false` |

`number` values must convert to a finite number. `boolean` accepts `true`, `false`, `1`, and `0` (as strings or values). A port must be an integer from 1 through 65535. URL format accepts HTTP and HTTPS URLs. Email checking is a practical syntax check, not mailbox verification.

A custom validator runs on the converted value. Return `true` to pass, a string to use that string as the error, or `false` to use `errorMessage` (or the default custom validation message). Thrown errors also become validation messages.

### Environment-specific rules

Put overrides or additional variables under the special `environments` key. The matching schema is selected from `env.NODE_ENV`; environment rules override base rules with the same variable name.

```js
validateEnv({
  PORT: { type: 'number', default: 3000 },
  environments: {
    production: {
      PORT: { type: 'number', required: true, min: 1024, max: 65535 },
      DATABASE_URL: { type: 'string', required: true, format: 'url' }
    },
    test: {
      PORT: { type: 'number', default: 4000 }
    }
  }
});
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `exitOnError` | boolean | `false` | Call `process.exit(1)` after printing the failure report instead of throwing. |
| `silent` | boolean | `false` | Suppress both success and failure console output. Validation still throws unless `exitOnError` is enabled. |
| `env` | object | `process.env` | Environment-like object to read. Useful for tests and alternate configuration sources. |

### Errors and output

`EnvValidationError` is exported in both module formats. It has `missing` (names), `invalid` (objects with `name` and `message`), and combined `problems` arrays. The error's `message` contains the report.

Example failure:

```text
ENV VALIDATION FAILED

Missing environment variables:
 - DATABASE_URL

Invalid environment variables:
 - PORT: Expected number

Application startup blocked.
```

Example success:

```text
✓ Environment validation successful!
✓ 4 variables checked.
```

## Development

Run the built-in Node.js test runner:

```sh
npm test
```

## License

MIT © yash-boora
