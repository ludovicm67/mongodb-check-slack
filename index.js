//@ts-check
import "dotenv/config";
import { MongoClient } from "mongodb";
import { WebClient } from "@slack/web-api";
import Fastify from "fastify";
import { definedBolean, log, promiseWithTimeout } from "./utils.js";

// Configuration: general options
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const verboseMode = definedBolean(process.env.VERBOSE_MODE, false);
const showErrors = definedBolean(process.env.SHOW_ERRORS, true);
const pingIntervalConfig = process.env.PING_INTERVAL || "1000";
const pingInterval = parseInt(pingIntervalConfig, 10);

// Configuration: Slack
const slackToken = process.env.SLACK_TOKEN || "secret-token";
const slackChannel = process.env.SLACK_CHANNEL || "mongo-alerts";

// Configuration: timeout to perform MongoDB commands (in milliseconds)
const timeoutConfig = process.env.TIMEOUT || "800";
const timeout = parseInt(timeoutConfig, 10);

// Configuration: timeout to connect to MongoDB (in milliseconds)
const connectTimeoutConfig = process.env.CONNECT_TIMEOUT || timeoutConfig;
const connectTimeout = parseInt(connectTimeoutConfig, 10);

// Configuration: timeout for MongoDB socket (in milliseconds)
const socketTimeoutConfig = process.env.SOCKET_TIMEOUT || timeoutConfig;
const socketTimeout = parseInt(socketTimeoutConfig, 10);

// Configuration: timeout for MongoDB to get an available thread (in milliseconds)
const waitQueueTimeoutConfig = process.env.WAIT_QUEUE_TIMEOUT || timeoutConfig;
const waitQueueTimeout = parseInt(waitQueueTimeoutConfig, 10);

// Configuration: timeout for MongoDB to close an idle connection (in milliseconds)
const maxIdleTimeConfig = process.env.MAX_IDLE_TIME || timeoutConfig;
const maxIdleTime = parseInt(maxIdleTimeConfig, 10);

const slackClient = new WebClient(slackToken);

// Create a new MongoClient
const client = new MongoClient(uri, {
  connectTimeoutMS: connectTimeout,
  socketTimeoutMS: socketTimeout,
  waitQueueTimeoutMS: waitQueueTimeout,
  maxIdleTimeMS: maxIdleTime,
});

// Create HTTP server
const fastify = Fastify({
  logger: true
});

// Internal state
let lastState = undefined;
let lastCheck = undefined;
let lastChange = undefined;

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
const sendToSlack = async () => {
  log(`ALERT - sent alert on Slack: ${lastState}`);

  await slackClient.chat.postMessage({
    blocks: [
      {
        text: {
          text: lastState,
          type: "mrkdwn"
        },
        type: "section"
      }
    ],
    text: lastState,
    channel: slackChannel,
  });
};

/**
 * Ping the server and send the alert if needed.
 */
const pingServer = async () => {
  let message = "ERROR - something went wrong";

  lastCheck = new Date().toISOString();

  try {
    await promiseWithTimeout(client.connect(), timeout);
    await promiseWithTimeout(client.db("admin").command({ ping: 1 }), timeout);
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
    await sendToSlack();
  }
};

// Ping the server every `pingInterval` milliseconds
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
