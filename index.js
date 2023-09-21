import "dotenv/config";
import { MongoClient } from "mongodb";
import Fastify from "fastify";

/**
 * Check if the value is defined and return the default value if not as boolean.
 *
 * @param {string} value
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
const definedBolean = (value, defaultValue) => {
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

// Configuration
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const verboseMode = definedBolean(process.env.VERBOSE_MODE, false);
const showErrors = definedBolean(process.env.SHOW_ERRORS, true);
const pingIntervalConfig = process.env.PING_INTERVAL || "1000";
const pingInterval = parseInt(pingIntervalConfig, 10);

// Create a new MongoClient
const client = new MongoClient(uri, {
  connectTimeoutMS: 200,
  socketTimeoutMS: 200,
  waitQueueTimeoutMS: 200,
  maxIdleTimeMS: 200,
});

// Create HTTP server
const fastify = Fastify({
  logger: true
});


let lastState = undefined;
let lastCheck = undefined;
let lastChange = undefined;

/**
 * Create a promise that rejects after the specified timeout.
 *
 * @param {Promise} promise
 * @param {number} timeout
 * @returns {Promise}
 */
const promiseWithTimeout = (promise, timeout) => {
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
const log = (msg) => {
  const now = new Date();
  const date = now.toUTCString();
  console.log(`${date} - ${msg}`);
}

/**
 * Display a log line if we are on verbose mode.
 *
 * @param {string} msg The message to display in the logs if we are in verbose mode.
 * @returns
 */
const verboseLog = (msg) => {
  if (!verboseMode) {
    return;
  }
  log(msg);
}

/**
 * Send the alert to Slack.
 */
const sendToSlack = () => {
  log(`ALERT - sent alert on Slack: ${lastState}`);

  // TODO: send the alert to Slack
};

/**
 * Ping the server and send the alert if needed.
 */
const pingServer = async () => {
  let message = "ERROR - something went wrong";

  lastCheck = new Date().toISOString();

  try {
    await promiseWithTimeout(client.connect(), 500);
    await promiseWithTimeout(client.db("admin").command({ ping: 1 }), 500);
    message = "OK - successful ping";
    verboseLog(message);
  } catch (e) {
    let source = "";
    if (e.message) {
      source = ` (${e.message})`;
    }
    message = `ERROR - unable to perform the ping${source}`;
    verboseLog(message);

    if (showErrors) {
      console.error(e);
    }
  } finally {
    client.close();
  }

  if (lastState !== message) {
    lastState = message;
    lastChange = new Date().toISOString();
    sendToSlack();
  }
};

// Ping the server every `pingInterval` miliseconds
setInterval(async () => {
  await pingServer();
}, pingInterval);

// Declare the default route
fastify.get('/', async (_request, _reply) => {
  return {
    status: lastState || "UNKNOWN - No ping yet",
    date: new Date().toISOString(),
    lastCheck: lastCheck || "Never",
    lastChange: lastChange || "Never",
  };
});

// Run the server
try {
  await fastify.listen({
    host: "0.0.0.0",
    port: 8080,
  });
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
