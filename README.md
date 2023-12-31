# MongoDB check and notify on Slack

This app periodically checks the state of a MongoDB instance (ping) and notify on Slack when the state is changing.
It also provides an HTTP endpoint where we can query to see the current state and the last time the state was updated and the date of the last check.

## Configuration

This application can be configured using the following environment variables:

- `MONGODB_URI`: A complete MongoDB URI that will be used to check the state of the MongoDB instance (default: `"mongodb://localhost:27017"`)
- `VERBOSE_MODE`: The verbose mode, if set to `"true"`, will print the result of each check in the logs (default: `"false"`)
- `SHOW_ERRORS`: If set to `"true"`; it will display more details to the error in the logs (default: `"true"`)
- `PING_INTERVAL`: The interval of time in milliseconds where the ping to the MongoDB instance is done (default: `"1000"`)
- `SLACK_TOKEN`: The Slack token used to send messages to Slack (default: `"secret-token"`)
- `SLACK_CHANNEL`: The Slack channel where the messages will be sent (default: `"mongo-alerts"`)
- `TIMEOUT`: Timeout to perform MongoDB commands (in milliseconds) (default: `"8000"`)
- `CONNECT_TIMEOUT`: Timeout to connect to MongoDB (in milliseconds) (default: value of `TIMEOUT`)
- `SOCKET_TIMEOUT`: Timeout for MongoDB socket (in milliseconds) (default: value of `TIMEOUT`)
- `WAIT_QUEUE_TIMEOUT`: Timeout for MongoDB to get an available thread (in milliseconds) (default: value of `TIMEOUT`)
- `MAX_IDLE_TIME`: Timeout for MongoDB to close an idle connection (in milliseconds) (default: value of `TIMEOUT`)
