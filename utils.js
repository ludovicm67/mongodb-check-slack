//@ts-check

/**
 * Check if the value is defined and return the default value if not as boolean.
 *
 * @param {string | undefined} value
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
export const definedBolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return defaultValue;
}

/**
 * Create a promise that rejects after the specified timeout.
 *
 * @param {Promise} promise
 * @param {number} timeout
 * @returns {Promise}
 */
export const promiseWithTimeout = (promise, timeout) => {
  // Create a promise that rejects after the specified timeout
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Timed out."));
    }, timeout);
  });

  // Race the original promise with the timeout promise
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Display a log line.
 *
 * @param {string} msg The message to display in the logs.
 */
export const log = (msg) => {
  const now = new Date();
  const date = now.toUTCString();
  console.log(`${date} - ${msg}`);
}
