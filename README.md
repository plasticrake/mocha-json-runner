# Mocha.js JSON Runner

[![NPM Version](https://img.shields.io/npm/v/mocha-json-runner.svg)](https://www.npmjs.com/package/mocha-json-runner)
[![Build Status](https://travis-ci.com/plasticrake/mocha-json-runner.svg?branch=master)](https://travis-ci.com/plasticrake/mocha-json-runner)
[![codecov](https://codecov.io/gh/plasticrake/mocha-json-runner/branch/master/graph/badge.svg)](https://codecov.io/gh/plasticrake/mocha-json-runner)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/plasticrake/mocha-json-runner.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/plasticrake/mocha-json-runner/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/plasticrake/mocha-json-runner.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/plasticrake/mocha-json-runner/context:javascript)

**A [Mocha.js](https://mochajs.org/) runner that replays from JSON input**

Pairs well with [mocha-json-serialize-reporter](https://https://github.com/plasticrake/mocha-json-serialize-reporter)!

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
mocha-json-runner [json..]

Playback JSON test results with Mocha

Commands
  mocha-json-runner debug [json..]  Playback JSON test results with Mocha
                                                                       [default]

Reporting & Output
  --color, -c, --colors                     Force-enable color output  [boolean]
  --diff                                    Show diff on failure
                                                       [boolean] [default: true]
  --full-trace                              Display full stack traces  [boolean]
  --growl, -G                               Enable Growl notifications [boolean]
  --inline-diffs                            Display actual/expected differences
                                            inline within each string  [boolean]
  --reporter, -R                            Specify reporter to use
                                                      [string] [default: "spec"]
  --reporter-option, --reporter-options,    Reporter-specific options
  -O                                        (<k=v,[k1=v1,..]>)           [array]

File Handling
  --require, -r  Require module                        [array] [default: (none)]

Positional Arguments
  json  One file to load and playback

Other Options
  --help, -h     Show usage information & exit                         [boolean]
  --version, -V  Show version number & exit                            [boolean]
  --reporters    List built-in reporters & exit                        [boolean]
```

### Programaticaly

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
