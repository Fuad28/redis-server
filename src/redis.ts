import { createServer } from "net";
import { RESPSerializer } from "./serializer";
import { RESPDeserializer } from "./deserializer";
import { FileData, CustomErrorType, AllowedType, IRedis } from "./types";
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
				console.log("Received: ", JSON.stringify(data.toString()));

				this.handleMessage(data.toString())
					.then((value) => {
						socket.write(value);
					})
					.catch((error) => {
						socket.write(error.message);
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
		let response!: AllowedType;
		let errorPrefix: string | null;

		try {
			let [command, args] = new RESPDeserializer(message).deserializeCommand();

			switch (command.toUpperCase()) {
				case "GET":
					[response, errorPrefix] = this.handleGet(args[0]);
					break;

				case "SET":
					[response, errorPrefix] = this.handleSet(args);
					break;

				case "KEYS":
					[response, errorPrefix] = this.handleKeys();
					break;

				case "LEN":
					[response, errorPrefix] = this.handleLen();
					break;

				case "EXISTS":
					[response, errorPrefix] = this.handleExists(args[0]);
					break;

				case "PING":
					[response, errorPrefix] = this.handlePing();
					break;

				case "ECHO":
					[response, errorPrefix] = this.handleEcho(args);
					break;

				case "DEL":
					[response, errorPrefix] = this.handleDel(args[0]);
					break;

				case "DECR":
					[response, errorPrefix] = this.handleDecr(args);
					break;

				case "SAVE":
					[response, errorPrefix] = this.handleSave();
					break;

				case "COMMAND":
					[response, errorPrefix] = this.handleCommand();
					break;

				default:
					errorPrefix = "ERR";
					response = "Invalid command";
					break;
			}
		} catch (err) {
			const error = err as CustomErrorType;
			errorPrefix = "ERR";
			response = error.message;
		}

		return new RESPSerializer().serialize(response, errorPrefix);
	}

	handleGet(key: AllowedType): [AllowedType, string | null] {
		let value = this.store.get(key) as AllowedType;

		if (value === undefined) {
			return [`key: ${key} not found`, "KEYERROR"];
		}
		return [value, null];
	}

	handleSet(args: AllowedType[]): [string, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'set' command", "ERR"];
		}

		this.store.set(args[0], args[1]);

		return ["OK", null];
	}

	handleKeys(): [IterableIterator<AllowedType>, null] {
		return [this.store.keys(), null];
	}

	handleLen(): [number, null] {
		return [this.store.size, null];
	}

	handleExists(key: AllowedType): [boolean, null] {
		return [this.store.has(key), null];
	}

	handlePing(): [string, null] {
		return ["PONG", null];
	}

	handleEcho(args: AllowedType[]): [string, null] {
		return [args.join(" "), null];
	}

	handleDel(key: AllowedType): [number, null] {
		let isDeleted = this.store.delete(key);

		return isDeleted ? [1, null] : [0, null];
	}

	handleDecr(key: AllowedType): [number | string, string | null] {
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

	handleCommand(): [string, null] {
		return ["OK", null];
	}

	handleSave(): [string, string | null] {
		let response = "OK";
		let errorPrefix = null;

		this.saveStoreToDisk()
			.then((value) => {
				[response, errorPrefix] = ["OK", null];
			})
			.catch((error) => {
				const err = error as CustomErrorType;
				[response, errorPrefix] = [err.message, "ERR"];

				console.warn("Error saving to disk: ", error.message);
			});

		return [response, errorPrefix];
	}

	async saveStoreToDisk(): Promise<void> {
		const storeObject = Object.fromEntries(this.store.entries());
		await FileManager.writeToFile(this.dbPath, storeObject);
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
