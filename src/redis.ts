import { createServer } from "net";
import { RESPSerializer } from "./serializer";
import { RESPDeserializer } from "./deserializer";
import { FileData, CustomErrorType, IRedis } from "./types";
import { FileManager } from "./utils";

export class Redis implements IRedis {
	readonly store: FileData = new Map();
	readonly dbPath = "db.json";

	constructor(public port: number = 6379) {
		this.port = port;
	}

	start() {
		const server = createServer(async (socket) => {
			console.log("client connected");

			await this.loadStoreFromDisk();

			socket.on("data", (data) => {
				console.log("Received: ", data.toString());

				this.handleMessage(data.toString()).then((value) => {
					socket.write(value);
				});
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

	async handleMessage(message: string): Promise<string> {
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
				[response, errorPrefix] = this.handleSave();

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

	handleSet(args: unknown[]): [string, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'set' command", "ERR"];
		}

		this.store.set(args[0], args[1]);

		return ["OK", null];
	}

	handleKeys(): [IterableIterator<unknown>, null] {
		return [this.store.keys(), null];
	}

	handleLen(): [number, null] {
		return [this.store.size, null];
	}

	handleExists(key: unknown): [boolean, null] {
		return [this.store.has(key), null];
	}

	handlePing(): [string, null] {
		return ["PONG", null];
	}

	handleEcho(args: unknown[]): [string, null] {
		return [args.join(" "), null];
	}

	handleDel(key: unknown): [number, null] {
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

	handleSave(): [string, null] {
		this.saveStoreToDisk();

		return ["OK", null];
	}

	async saveStoreToDisk(): Promise<void> {
		try {
			await FileManager.writeToFile(this.dbPath, this.store);
		} catch (err) {
			const error = err as CustomErrorType;

			console.warn("Error saving to disk: ", error.message);
		}
	}

	async loadStoreFromDisk(): Promise<void> {
		try {
			let data = await FileManager.readFile(this.dbPath);

			for (let entry of data.entries()) {
				this.store.set(entry[0], entry[1]);
			}
		} catch (err) {
			const error = err as CustomErrorType;

			console.warn("Error loading from disk: ", error.message);
		}
	}
}
