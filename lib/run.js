/* eslint-env node */
/* eslint-disable no-console */

/**
 * Definition for Mocha's default ("run tests") command
 *
 * @module
 * @private
 */

const fs = require('fs');

const Mocha = require('mocha');
const { createInvalidArgumentValueError } = require('mocha/lib/errors');

const {
  list,
  handleRequires,
  validatePlugin,
} = require('mocha/lib/cli/run-helpers');
let { validateLegacyPlugin } = require('mocha/lib/cli/run-helpers');
const {
  ONE_AND_DONES,
  ONE_AND_DONE_ARGS,
} = require('mocha/lib/cli/one-and-dones');
const defaults = require('mocha/lib/mocharc');
const { types, aliases } = require('mocha/lib/cli/run-option-metadata');

const MochaJsonRunner = require('./mocha-json-runner');

// Mocha v8.2 changed the name of this function to `validateLegacyPlugin`
if (validateLegacyPlugin == null) {
  validateLegacyPlugin = validatePlugin;
}

/**
 * Logical option groups
 * @constant
 */
const GROUPS = {
  FILES: 'File Handling',
  OUTPUT: 'Reporting & Output',
  CONFIG: 'Configuration',
};

exports.command = ['$0 [json..]', 'debug [json..]'];

exports.describe = 'Playback JSON test results with Mocha';

exports.builder = (yargs) =>
  yargs
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
        conflicts: Array.from(ONE_AND_DONE_ARGS),
        description: 'List built-in reporters & exit',
      },
      'reporter-option': {
        coerce: (opts) =>
          list(opts).reduce((acc, opt) => {
            const pair = opt.split('=');

            if (pair.length > 2 || !pair.length) {
              throw createInvalidArgumentValueError(
                `invalid reporter option '${opt}'`,
                '--reporter-option',
                opt,
                'expected "key=value" format'
              );
            }

            acc[pair[0]] = pair.length === 2 ? pair[1] : true;
            return acc;
          }, {}),
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
    })
    .positional('json', {
      // default: ['test'],
      description: 'One file to load and playback',
      type: 'array',
    })
    .check((argv) => {
      // "one-and-dones"; let yargs handle help and version
      Object.keys(ONE_AND_DONES).forEach((opt) => {
        if (argv[opt]) {
          ONE_AND_DONES[opt].call(null, yargs);
          process.exit();
        }
      });

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

exports.handler = (argv) => {
  Mocha.Runner = MochaJsonRunner;

  let json;
  try {
    const file = argv.json[0];
    json = fs.readFileSync(file, 'utf-8');
  } catch (err) {
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
};
