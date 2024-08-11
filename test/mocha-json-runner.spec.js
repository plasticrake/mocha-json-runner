const path = require('node:path');
const process = require('node:process');
const { expect } = require('chai');
const Mocha = require('mocha');
const rewire = require('rewire');
const sinon = require('sinon');
const { stderr } = require('test-console');
const JsonSerializeReporter = require('mocha-json-serialize-reporter');

const { reporters } = Mocha;

const reportersArray = [
  reporters.Doc,
  reporters.Dot,
  // reporters.HTML, // Requires browser
  reporters.JSON,
  reporters.JSONStream,
  reporters.Landing,
  reporters.List,
  reporters.Markdown,
  reporters.Min,
  reporters.Nyan,
  reporters.Progress,
  reporters.Spec,
  reporters.TAP,
  reporters.XUnit,
];

const STATE_FAILED = 'failed';
const STATE_PASSED = 'passed';

const MochaJsonRunner = rewire('../lib/mocha-json-runner');

function runRunner(runner) {
  const stdout = [];
  sinon.stub(process.stdout, 'write').callsFake((o) => stdout.push(o));

  try {
    runner.run();
  } catch (error) {
    sinon.restore();
    throw error;
  }

  sinon.restore();
  return stdout.join('\n');
}

async function runJsonSerializeReporter(files) {
  const mocha = new Mocha();
  mocha.reporter(JsonSerializeReporter);

  if (files && files.length > 0) {
    for (const file of files) {
      delete require.cache[require.resolve(file)];
      mocha.addFile(path.resolve('./test', file));
    }
  }

  const stdout = [];
  sinon.stub(process.stdout, 'write').callsFake((o) => {
    stdout.push(o);
  });

  await new Promise((resolve, reject) => {
    try {
      mocha.run(resolve);
    } catch (error) {
      sinon.restore();
      reject(error);
    }
  });

  sinon.restore();
  return stdout.join('\n');
}

function testReporters(obj) {
  let runner;

  beforeEach(function () {
    runner = new MochaJsonRunner(JSON.stringify(obj));
  });

  for (const Reporter of reportersArray) {
    describe(Reporter.name, function () {
      it('should run without error', function () {
        // eslint-disable-next-line no-new
        new Reporter(runner);
        runRunner(runner);
      });

      it('stats start and end should be dates', function () {
        // eslint-disable-next-line no-new
        new Reporter(runner);
        runRunner(runner);

        expect(runner.stats).to.have.property('start').is.a('date');
        expect(runner.stats).to.have.property('end').is.a('date');
      });

      if (obj.stats) {
        it('stats should match input', function () {
          // eslint-disable-next-line no-new
          new Reporter(runner);
          runRunner(runner);

          // console.dir(runner.stats);
          const runnerStats = JSON.parse(
            JSON.stringify(runner.stats),
            (key, value) => {
              if (key === 'end' || key === 'start') {
                return new Date(value);
              }

              return value;
            },
          );

          expect(runnerStats).to.eql(obj.stats);
        });
      } else {
        it('stats start and end should default to epoch', function () {
          // eslint-disable-next-line no-new
          new Reporter(runner);
          runRunner(runner);

          expect(runner.stats.start.getTime()).to.eql(0);
          expect(runner.stats.end.getTime()).to.eql(0);
        });
      }
    });
  }
}

describe('MochaJsonRunner', function () {
  const obj = {
    title: '',
    tests: [
      {
        title: 'passes',
        state: STATE_PASSED,
      },
      {
        title: 'fails',
        state: STATE_FAILED,
        err: new TypeError('FAIL'),
      },
      {
        title: 'pending',
        pending: true,
      },
    ],
    suites: [],
  };

  describe('constructor', function () {
    it('should accept an Object', function () {
      expect(new MochaJsonRunner({ suite: { title: 'My Root Suite' } }))
        .to.have.property('suite')
        .with.property('title', 'My Root Suite');
    });

    it('should accept a JSON string', function () {
      expect(new MochaJsonRunner('{ "suite": { "title": "My Root Suite" } }'))
        .to.have.property('suite')
        .with.property('title', 'My Root Suite');
    });

    it('should throw when json is missing a suite', function () {
      expect(() => {
        // eslint-disable-next-line no-new
        new MochaJsonRunner({});
      }).to.throw(TypeError, 'Unexpected JSON object, missing root suite');
    });

    it('should not throw when json has a suite', function () {
      // eslint-disable-next-line no-unused-expressions
      expect(() => {
        // eslint-disable-next-line no-new
        new MochaJsonRunner({ suite: {} });
      }).to.not.throw;
    });
  });

  describe('#run', function () {
    it('should throw when a test has an unexpected state with warnOnMissingState', function () {
      const runner = new MochaJsonRunner({
        suite: {
          title: '',
          tests: [
            {
              title: 'Test with an unexpected state',
              state: 'an unexpected state',
            },
          ],
        },
      });

      MochaJsonRunner.warnOnMissingState(true);

      expect(
        stderr.inspectSync(() => {
          runner.run();
        })[0],
      ).to.contain(
        'Unexpected test.state: an unexpected state and not pending. test: Test with an unexpected state',
      );
    });
  });

  describe('with stats', function () {
    const stats = {
      suites: 1,
      tests: 1,
      passes: 1,
      pending: 1,
      failures: 1,
      start: new Date(1e12),
      end: new Date(1e12),
      duration: 1,
    };

    testReporters({ stats, suite: obj });
  });

  describe('without stats', function () {
    testReporters(obj);
  });
});

describe('back and forth 🐍', function () {
  let objOutput;
  let objOutput2;

  before(async function () {
    const json = await runJsonSerializeReporter([
      './fixtures/mocha-test.fixture.js',
    ]);

    objOutput = JSON.parse(json);

    const jsonRunner = new MochaJsonRunner(json);
    // eslint-disable-next-line no-new
    new JsonSerializeReporter(jsonRunner);
    const json2 = runRunner(jsonRunner);
    objOutput2 = JSON.parse(json2);
  });

  it('should match', function () {
    expect(objOutput2).to.eql(objOutput);
  });
});
