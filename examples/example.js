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
