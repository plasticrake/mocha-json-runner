/* eslint no-underscore-dangle: ["error", { "allow": ["_afterAll", "_afterEach", "_beforeAll", "_beforeEach"] }] */

const Mocha = require('mocha');
const mochaJsonDeserialize = require('mocha-json-deserialize');

const { STATE_FAILED, STATE_PASSED } = Mocha.Runnable.constants;
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_END,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
} = Mocha.Runner.constants;

function findFailingHooks(hooks) {
  if (hooks && hooks.find)
    return hooks.filter((hook) => hook.state === 'failed');
  return [];
}

const config = { warnOnMissingState: false };

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

    this.failHooks = function (hooks) {
      for (const hook of hooks) {
        hook.run((err) => {
          this.failHook(hook, err);
        });
      }
    };

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
    this.run = function (fn = () => {}) {
      this.emit(EVENT_RUN_BEGIN);

      const runSuite = (suite) => {
        this.emit(EVENT_SUITE_BEGIN, suite);

        const failingBeforeAllHooks = findFailingHooks(suite._beforeAll);
        const failingBeforeEachHooks = findFailingHooks(suite._beforeEach);
        const failingAfterEachHooks = findFailingHooks(suite._afterEach);
        const failingAfterAllHooks = findFailingHooks(suite._afterAll);

        if (failingBeforeAllHooks.length > 0) {
          this.failHooks(failingBeforeAllHooks);
        } else {
          for (const test of suite.tests) {
            switch (test.state) {
              case STATE_PASSED: {
                this.emit(EVENT_TEST_PASS, test);
                if (!hasStats) this.stats.passes += 1;
                break;
              }

              case STATE_FAILED: {
                test.run((err) => {
                  this.fail(test, err); // Runner will emit EVENT_TEST_FAIL
                  if (!hasStats) this.stats.failures += 1;
                });
                break;
              }

              default: {
                if (test.pending) {
                  this.emit(EVENT_TEST_PENDING, test);
                  // eslint-disable-next-line max-depth
                  if (!hasStats) this.stats.pending += 1;
                } else if (failingBeforeEachHooks.length > 0) {
                  this.failHooks(failingBeforeEachHooks);
                  break; // skip remaining tests in suite
                } else if (failingAfterEachHooks.length > 0) {
                  this.failHooks(failingAfterEachHooks);
                  break; // skip remaining tests in suite
                } else if (config.warnOnMissingState) {
                  // could be a test that did not match a grep
                  console.error(
                    `Unexpected test.state: ${
                      test.state
                    } and not pending. test: ${test.fullTitle()}`,
                  );
                }
              }
            }

            this.emit(EVENT_TEST_END, test);
            if (!hasStats) this.stats.tests += 1;
          }

          if (
            failingBeforeEachHooks.length === 0 &&
            failingAfterEachHooks.length === 0
          ) {
            for (const childSuite of suite.suites) {
              runSuite(childSuite);
            }
          }
        }

        if (failingAfterAllHooks.length > 0) {
          this.failHooks(failingAfterAllHooks);
        }

        if (!hasStats) this.stats.suites += 1;
        this.emit(EVENT_SUITE_END, suite);
      };

      runSuite(this.suite);

      this.emit(EVENT_RUN_END);

      fn(this.failures);

      return this;
    };
  }

  static warnOnMissingState(value) {
    config.warnOnMissingState = value;
  }
}

module.exports = MochaJsonRunner;
