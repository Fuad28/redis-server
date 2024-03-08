A Redis server implementation in Typescript from [John Cricket coding challenges](https://codingchallenges.fyi/challenges/challenge-redis)

# Redis Server implementation in Typescript

![ts](https://badgen.net/badge/Built%20With/TypeScript/blue)

A simple implementation of a Redis server written in TypeScript.
Part of my attempt at John Crickett's ![Coding Chanllenges](https://codingchallenges.fyi/challenges/challenge-redis)

## Features

-   Basic implementation of Redis server functionality.
-   Support for the ![RESP2](https://redis.io/docs/reference/protocol-spec/) protocol.
-   Support for common Redis commands.
-   Autosave upon client disconnection or server shutdown.
-   Loads DB for disk on startup.
-   Asynchronous implementation.
-   Easy to use and extend.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/Fuad28/redis-server.git
    cd redis-server
    ```

2. Install dependencies using npm:

    ```bash
    npm init -y
    npm install
    ```

## Usage

1. Run the Redis server:

    ```bash
    npm start
    ```

2. The server begins to run on localhost port 6379. You can then interact with the server using redis-cli

    ```bash
    redis-cli
    ```

    You can then begin to send your commands.

## Supported Commands

-   `PING`: Ping the server.
-   `ECHO`: Echo the input string.
-   `KEYS`: Returns all key names.
-   `LEN`: Returns the total number of keys stored.
-   `ECHO`: Echo the input string.
-   `GET`: Get the value of a key.
-   `SET`: Set the value of a key.
-   `COMMAND`: Get information about Redis commands (This wasn't implemented).
-   `EXISTS`: Check if a key exists.
-   `DEL`: Delete a key.
-   `DECR`: Decrement the value of a key by 1.
-   `LPUSH`: Add an element to the left end of a list.
-   `RPUSH`: Add an element to the right end of a list.
-   `SADD`: Add an element to a set.
-   `SMEMBER`: Displays elements of a set.
-   `RPUSH`: Add an element to the right end of a list.
-   `SAVE`: Save the dataset to disk.
