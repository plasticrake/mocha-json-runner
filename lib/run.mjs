/* eslint-disable unicorn/no-process-exit */
/* eslint-env node */

/**
 * Definition for Mocha's default ("run tests") command
 *
 * @module
 * @private
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';
import Mocha from 'mocha';
import { createInvalidArgumentValueError } from 'mocha/lib/errors.js';

import runHelpers, { list, handleRequires } from 'mocha/lib/cli/run-helpers.js';
import {
  ONE_AND_DONES,
  ONE_AND_DONE_ARGS,
} from 'mocha/lib/cli/one-and-dones.js';
import { types, aliases } from 'mocha/lib/cli/run-option-metadata.js';

import MochaJsonRunner from './mocha-json-runner.mjs';

const require = createRequire(import.meta.url);
const defaults = require('mocha/lib/mocharc.json');

// Mocha v8.2 changed the name of this function to `validateLegacyPlugin`
const validateLegacyPlugin =
  runHelpers.validateLegacyPlugin ?? runHelpers.validatePlugin;

/**
 * Logical option groups
 * @constant
 */
const GROUPS = {
  FILES: 'File Handling',
  OUTPUT: 'Reporting & Output',
  CONFIG: 'Configuration',
};

export const runCommand = {
  command: ['$0 <json>'],

  describe: 'Playback JSON test results with Mocha',

  builder(yargs) {
    return yargs
      .options({
        color: {
          description: 'Force-enable color output',
          group: GROUPS.OUTPUT,
        },
        diff: {
          default: true,
          description: 'Show diff on failure',
          group: GROUPS.OUTPUT,
        },
        'full-trace': {
          description: 'Display full stack traces',
          group: GROUPS.OUTPUT,
        },
        growl: {
          description: 'Enable Growl notifications',
          group: GROUPS.OUTPUT,
        },
        'inline-diffs': {
          description:
            'Display actual/expected differences inline within each string',
          group: GROUPS.OUTPUT,
        },
        'no-colors': {
          description: 'Force-disable color output',
          group: GROUPS.OUTPUT,
          hidden: true,
        },
        reporter: {
          default: defaults.reporter,
          description: 'Specify reporter to use',
          group: GROUPS.OUTPUT,
          requiresArg: true,
        },
        reporters: {
          conflicts: [...ONE_AND_DONE_ARGS],
          description: 'List built-in reporters & exit',
        },
        'reporter-option': {
          coerce(opts) {
            if (opts == null) return undefined;

            const result = {};
            const optsList = list(opts);
            for (const opt of optsList) {
              const pair = opt.split('=');

              if (pair.length > 2 || pair.length === 0) {
                throw createInvalidArgumentValueError(
                  `invalid reporter option '${opt}'`,
                  '--reporter-option',
                  opt,
                  'expected "key=value" format',
                );
              }

              result[pair[0]] = pair.length === 2 ? pair[1] : true;
            }

            return result;
          },
          description: 'Reporter-specific options (<k=v,[k1=v1,..]>)',
          group: GROUPS.OUTPUT,
          requiresArg: true,
        },
        require: {
          defaultDescription: '(none)',
          description: 'Require module',
          group: GROUPS.FILES,
          requiresArg: true,
        },
        'warn-on-missing-state': {
          description:
            'Warn when test is missing `state`. Outputs to stderr. If mocha was run with `--grep` this would produce warnings for tests not matching.',
          group: GROUPS.OUTPUT,
        },
      })
      .positional('json', {
        description: 'One file to load and playback',
        type: 'array',
      })
      .check((argv) => {
        // "one-and-dones"; let yargs handle help and version
        for (const opt of Object.keys(ONE_AND_DONES)) {
          if (argv[opt]) {
            ONE_AND_DONES[opt].call(null, yargs);
            process.exit();
          }
        }

        // load requires first, because it can impact "plugin" validation
        handleRequires(argv.require);
        validateLegacyPlugin(argv, 'reporter', Mocha.reporters);
        validateLegacyPlugin(argv, 'ui', Mocha.interfaces);

        return true;
      })
      .array(types.array)
      .boolean(types.boolean)
      .string(types.string)
      .number(types.number)
      .alias(aliases);
  },

  handler(argv) {
    if (argv['warn-on-missing-state']) {
      MochaJsonRunner.warnOnMissingState(true);
    }

    Mocha.Runner = MochaJsonRunner;

    let json;
    try {
      const file = argv.json;
      json = readFileSync(file, 'utf8');
    } catch {
      console.error('Error: No test files found');
      process.exit(1);
    }

    const mocha = new Mocha(argv);
    mocha.suite = json;

    // console.dir(mocha._reporter);
    mocha.run((code) => {
      process.on('exit', () => {
        process.exitCode = Math.min(code, 255);
      });
    });
  },
};
