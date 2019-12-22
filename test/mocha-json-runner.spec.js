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

let stdout;
const gather = function(chunk) {
  stdout.push(chunk);
};

describe('MochaJsonRunner', function() {
  let runner;

  beforeEach(function() {
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

    runner = new MochaJsonRunner(JSON.stringify(obj));
  });

  reportersArray.forEach(function(Reporter) {
    describe(Reporter.name, function() {
      it('should run without error', function() {
        // eslint-disable-next-line no-new
        new Reporter(runner);

        stdout = [];
        sinon.stub(process.stdout, 'write').callsFake(gather);
        try {
          runner.run();
        } catch (err) {
          sinon.restore();
          throw err;
        }
        sinon.restore();
      });
    });
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

    stdout = [];
    sinon.stub(process.stdout, 'write').callsFake(gather);
    try {
      mocha.run(function() {
        objOutput = JSON.parse(stdout.join('\n'));

        stdout = [];
        const jsonRunner = new MochaJsonRunner(objOutput);
        // eslint-disable-next-line no-new
        new JsonSerializeReporter(jsonRunner);
        jsonRunner.run();
        sinon.restore();

        objOutput2 = JSON.parse(stdout.join('\n'));

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
