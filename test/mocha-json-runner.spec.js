/* globals process */
const { expect } = require('chai');
const Mocha = require('mocha');
const JsonSerializeReporter = require('mocha-json-serialize-reporter');
const sinon = require('sinon');

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

const MochaJsonRunner = require('../lib/mocha-json-runner');

function runRunner(runner) {
  const stdout = [];
  sinon.stub(process.stdout, 'write').callsFake(o => stdout.push(o));

  try {
    runner.run();
  } catch (err) {
    sinon.restore();
    throw err;
  }
  sinon.restore();
  return stdout.join('\n');
}

function testReporters(obj) {
  let runner;

  beforeEach(function() {
    runner = new MochaJsonRunner(JSON.stringify(obj));
  });

  reportersArray.forEach(function(Reporter) {
    describe(Reporter.name, function() {
      it('should run without error', function() {
        // eslint-disable-next-line no-new
        new Reporter(runner);
        runRunner(runner);
      });

      if (obj.stats) {
        it('stats should match input', function() {
          // eslint-disable-next-line no-new
          new Reporter(runner);
          runRunner(runner);

          const runnerStats = JSON.parse(
            JSON.stringify(runner.stats),
            (key, value) => {
              if (key === 'end' || key === 'start') {
                return new Date(value);
              }
              return value;
            }
          );

          expect(runnerStats).to.eql(obj.stats);
        });
      }
    });
  });
}

describe('MochaJsonRunner', function() {
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
    ],
    suites: [],
  };

  describe('with stats', function() {
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

  describe('without stats', function() {
    testReporters(obj);
  });
});

describe('back and forth 🐍', function() {
  let objOutput;
  let objOutput2;

  before(function(done) {
    const mocha = new Mocha();
    mocha.reporter(JsonSerializeReporter);

    delete require.cache[require.resolve('./fixtures/mocha-test.fixture.js')];
    mocha.addFile('./test/fixtures/mocha-test.fixture.js');

    const stdout = [];
    sinon.stub(process.stdout, 'write').callsFake(o => {
      stdout.push(o);
    });
    try {
      mocha.run(function() {
        sinon.restore();

        objOutput = JSON.parse(stdout.join('\n'));

        const jsonRunner = new MochaJsonRunner(objOutput);
        // eslint-disable-next-line no-new
        new JsonSerializeReporter(jsonRunner);
        const json = runRunner(jsonRunner);
        objOutput2 = JSON.parse(json);

        done();
      });
    } catch (e) {
      sinon.restore();
      throw e;
    }
  });

  it('should match', function() {
    expect(objOutput2).to.eql(objOutput);
  });
});
