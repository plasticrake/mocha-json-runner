# Mocha.js JSON Runner

[![NPM Version](https://img.shields.io/npm/v/mocha-json-runner.svg)](https://www.npmjs.com/package/mocha-json-runner)
[![Build Status](https://travis-ci.com/plasticrake/mocha-json-runner.svg?branch=master)](https://travis-ci.com/plasticrake/mocha-json-runner)
[![codecov](https://codecov.io/gh/plasticrake/mocha-json-runner/branch/master/graph/badge.svg)](https://codecov.io/gh/plasticrake/mocha-json-runner)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/plasticrake/mocha-json-runner.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/plasticrake/mocha-json-runner/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/plasticrake/mocha-json-runner.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/plasticrake/mocha-json-runner/context:javascript)

A [Mocha.js](https://mochajs.org/) runner that replays from JSON input

## Usage

If using mocha programatically:

```bash
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
// eslint-disable-next-line no-new
new Mocha.reporters.Spec(runner);
runner.run();
```

Output:

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

## License

[MIT](LICENSE)
