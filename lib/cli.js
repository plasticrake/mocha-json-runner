#!/usr/bin/env node

/* eslint-env node */

const path = require('node:path');
const process = require('node:process');
const yargs = require('yargs/yargs');

const { loadOptions, YARGS_PARSER_CONFIG } = require('mocha/lib/cli/options');

const { version } = require('../package.json');
const run = require('./run.js');

exports.main = (argv = process.argv.slice(2)) => {
  // ensure we can require() from current working directory
  module.paths.push(process.cwd(), path.resolve('node_modules'));

  const args = loadOptions(argv);

  yargs()
    .scriptName('mocha-json-runner')
    .command(run)
    .updateStrings({
      'Positionals:': 'Positional Arguments',
      'Options:': 'Other Options',
      'Commands:': 'Commands',
    })
    // eslint-disable-next-line no-shadow
    .fail((msg, err, yargs) => {
      yargs.showHelp();
      console.error(`\n${msg}`);
      process.exit(1);
    })
    .help('help', 'Show usage information & exit')
    .alias('help', 'h')
    .version('version', 'Show version number & exit', version)
    .alias('version', 'V')
    .wrap(process.stdout.columns ? Math.min(process.stdout.columns, 80) : 80)
    .parserConfiguration(YARGS_PARSER_CONFIG)
    .config(args)
    .parse(args._);
};

// allow direct execution
if (require.main === module) {
  exports.main();
}
