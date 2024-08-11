const Mocha = require('mocha');

import('mocha-json-runner').then(({ default: MochaJsonRunner }) => {
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
});
