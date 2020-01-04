const Mocha = require('mocha');
const mochaJsonDeserialize = require('mocha-json-deserialize');

const STATE_FAILED = 'failed';
const STATE_PASSED = 'passed';
const EVENT_RUN_BEGIN = 'start';
const EVENT_RUN_END = 'end';
const EVENT_SUITE_BEGIN = 'suite';
const EVENT_SUITE_END = 'suite end';
const EVENT_TEST_END = 'test end';
const EVENT_TEST_PASS = 'pass';
const EVENT_TEST_PENDING = 'pending';

let hasStats = false;

/**
 *
 * @extends Mocha.Runner
 * @param {string|Object}  json   JSON string or Object
 * @param {boolean}       [delay] Whether or not to delay execution of root suite
 */
class MochaJsonRunner extends Mocha.Runner {
  constructor(json, delay) {
    let hasStats = false;
    const rootSuite = mochaJsonDeserialize(json);

    super(rootSuite, delay);

    if (rootSuite.stats != null) {
      hasStats = true;
      rootSuite.stats.start = new Date(rootSuite.stats.start); // Convert JSON string to Date
      rootSuite.stats.end = new Date(rootSuite.stats.end); // Convert JSON string to Date
      this.stats = rootSuite.stats;
      delete rootSuite.stats;
    } else {
      hasStats = false;
      const defaultDate = new Date();
      defaultDate.setTime(0);

      this.stats = {
        suites: 0,
        tests: 0,
        passes: 0,
        pending: 0,
        failures: 0,
        start: defaultDate,
        end: defaultDate,
        duration: 0,
      };
    }

  /**
   * Run the root suite and invoke `fn(failures)`
   * on completion.
   *
   * @public
   * @override
   * @memberof MochaJsonRunner
   * @param {Function} fn
   * @return {Runner} Runner instance.
   */
    this.run = function run(fn = () => {}) {
    this.emit(EVENT_RUN_BEGIN);

    const runSuite = suite => {
      this.emit(EVENT_SUITE_BEGIN, suite);
      suite.tests.forEach(test => {
        switch (test.state) {
          case STATE_PASSED:
            this.emit(EVENT_TEST_PASS, test);
            if (!hasStats) this.stats.passes += 1;
            break;

          case STATE_FAILED:
            test.run(err => {
              this.fail(test, err); // Runner will emit EVENT_TEST_FAIL
              if (!hasStats) this.stats.failures += 1;
            });
            break;

          default:
            if (test.pending) {
              this.emit(EVENT_TEST_PENDING, test);
              if (!hasStats) this.stats.pending += 1;
            } else {
              throw new Error(
                `Unexpected test.state: ${
                  test.state
                } and not pending. test: ${test.fullTitle()}`
              );
            }
        }
        this.emit(EVENT_TEST_END, test);
        if (!hasStats) this.stats.tests += 1;
      });

      suite.suites.forEach(childSuite => {
        runSuite(childSuite);
      });

      if (!hasStats) this.stats.suites += 1;
      this.emit(EVENT_SUITE_END, suite);
    };

    runSuite(this.suite);

    this.emit(EVENT_RUN_END);

    fn(this.failures);

    return this;
    };
  }
}

module.exports = MochaJsonRunner;
