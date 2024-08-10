# Mocha.js JSON Runner

[![NPM Version](https://img.shields.io/npm/v/mocha-json-runner.svg)](https://www.npmjs.com/package/mocha-json-runner)
[![Build Status](https://github.com/plasticrake/mocha-json-runner/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/plasticrake/mocha-json-runner/actions/workflows/ci.yml?query=branch%3Amaster)
[![Coverage Status](https://coveralls.io/repos/github/plasticrake/mocha-json-runner/badge.svg?branch=master)](https://coveralls.io/github/plasticrake/mocha-json-runner?branch=master)

**A [Mocha.js](https://mochajs.org/) runner that replays from JSON input**

Pairs well with [mocha-json-serialize-reporter](https://github.com/plasticrake/mocha-json-serialize-reporter)!

## Usage

### Command-line

```shell
npm install --global mocha-json-runner
```

```shell
mocha-json-runner ./path/to/input.json
```

```shell
mocha-json-runner --help
```

```text
mocha-json-runner <json>

Playback JSON test results with Mocha

Reporting & Output
  -c, --color, --colors                     Force-enable color output  [boolean]
      --diff                                Show diff on failure
                                                       [boolean] [default: true]
      --full-trace                          Display full stack traces  [boolean]
  -G, --growl                               Enable Growl notifications [boolean]
      --inline-diffs                        Display actual/expected differences
                                            inline within each string  [boolean]
  -R, --reporter                            Specify reporter to use
                                                      [string] [default: "spec"]
  -O, --reporter-option,                    Reporter-specific options
  --reporter-options                        (<k=v,[k1=v1,..]>)           [array]
      --warn-on-missing-state               Warn when test is missing `state`.
                                            Outputs to stderr. If mocha was run
                                            with `--grep` this would produce
                                            warnings for tests not matching.

File Handling
  -r, --require  Require module                        [array] [default: (none)]

Positional Arguments
  json  One file to load and playback

Other Options
  -h, --help       Show usage information & exit                       [boolean]
  -V, --version    Show version number & exit                          [boolean]
      --reporters  List built-in reporters & exit                      [boolean]
```

### Programmatically

```shell
npm install --save-dev mocha-json-runner
```

```js
const Mocha = require('mocha');
const MochaJsonRunner = require('mocha-json-runner');

const json = JSON.stringify({
  suite: {
    title: '',
    tests: [
      { title: 'passing test', state: 'passed' },
      { title: 'failing test', state: 'failed', err: { message: 'FAIL' } },
      { title: 'pending test', pending: true },
    ],
  },
});

const runner = new MochaJsonRunner(json);
new Mocha.reporters.Spec(runner);
runner.run();
```

**Output:**

<!-- markdownlint-disable MD033 -->
<pre>
<code>
<span style="color:#0A0">  ✓</span><span style="color:#555"> passing test</span>
<span style="color:#A00">  1) failing test</span>
<span style="color:#0AA">  - pending test</span>

<span style="color:#5F5"> </span><span style="color:#0A0"> 1 passing</span><span style="color:#555"> (0ms)</span>
<span style="color:#0AA"> </span><span style="color:#0AA"> 1 pending</span>
<span style="color:#A00">  1 failing</span>

<span>  1) failing test:</span>
<span style="color:#A00">     FAIL</span><span style="color:#555"></span>
</code>
</pre>
<!-- markdownlint-enable MD033 -->

## License

[MIT](LICENSE)
