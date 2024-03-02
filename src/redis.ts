import { createServer } from "net";
import { RESPSerializer } from "./serializer";
import { RESPDeserializer } from "./deserializer";
class Redis {
	private readonly store: Map<unknown, unknown>;

	constructor(public port: number = 6379) {
		this.port = port;
		this.store = new Map<unknown, unknown>();
	}

	start() {
		const server = createServer((socket) => {
			console.log("client connected");

			socket.on("data", (data) => {
				console.log("Received: ", data.toString());
				let response = this.handleMessage(data.toString());
				socket.write(response);
			});

			socket.on("end", () => {
				console.log("client disconnected");
			});

			socket.on("error", (err: Error) => {
				console.log("Error: ", err);
			});
		});

		server.on("error", (err: Error) => {
			throw err;
		});

		server.listen(this.port, () => {
			console.log("server listening on port ", this.port);
		});
	}

	handleMessage(message: string): string {
		let [command, args] = new RESPDeserializer(message).deserializeCommand();
		let response: unknown;
		let errorPrefix: string | null;

		switch (command.toUpperCase()) {
			case "GET":
				[response, errorPrefix] = this.handleGet(args[0]);

			case "SET":
				[response, errorPrefix] = this.handleSet(args);

			case "KEYS":
				[response, errorPrefix] = this.handleKeys();

			case "LEN":
				[response, errorPrefix] = this.handleLen();

			case "EXISTS":
				[response, errorPrefix] = this.handleExists(args[0]);

			case "PING":
				[response, errorPrefix] = this.handlePing();

			case "ECHO":
				[response, errorPrefix] = this.handleEcho(args);

			case "DEL":
				[response, errorPrefix] = this.handleDel(args[0]);

			case "DECR":
				[response, errorPrefix] = this.handleDecr(args);

			case "SAVE":
				[response, errorPrefix] = this.handleSave(args);

			default:
				errorPrefix = "ERR";
				response = "Invalid command";
		}

		return new RESPSerializer().serialize(response, errorPrefix);
	}

	handleGet(key: unknown): [unknown, string | null] {
		let value = this.store.get(key);

		if (value === undefined) {
			return [`key: ${key} not found`, "KEYERROR"];
		}
		return [value, null];
	}

	handleSet(args: unknown[]): [unknown, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'set' command", "ERR"];
		}

		this.store.set(args[0], args[1]);

		return ["OK", null];
	}

	handleKeys(): [IterableIterator<unknown>, string | null] {
		return [this.store.keys(), null];
	}

	handleLen(): [number, string | null] {
		return [this.store.size, null];
	}

	handleExists(key: unknown): [boolean, string | null] {
		return [this.store.has(key), null];
	}

	handlePing(): [string, string | null] {
		return ["PONG", null];
	}

	handleEcho(args: unknown[]): [string, string | null] {
		return [args.join(" "), null];
	}

	handleDel(key: unknown): [number, string | null] {
		let isDeleted = this.store.delete(key);

		return isDeleted ? [1, null] : [0, null];
	}

	handleDecr(key: unknown): [number | string, string | null] {
		let [keyExists, _] = this.handleExists(key);

		if (keyExists) {
			let value = this.store.get(key);

			if (typeof value === "number") {
				this.store.set(key, value--);

				return [this.store.get(key) as number, null];
			}

			return [`Invalid operation on type: ${typeof value}`, "WRONGTYPE"];
		}

		return [`key: ${key} not found`, "KEYERROR"];
	}

	handleSave(args: unknown[]): [unknown, string | null] {
		// save to JSON
		// Also implement loading from json during start up
		return [this.store.set(args[0], args[1]), null];
	}
}

let redis = new Redis(8124);

redis.start();
