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
			console.log("client connected\n");

			await this.loadStoreFromDisk();

			socket.on("data", (data) => {
				console.log("Received: ", JSON.stringify(data.toString()), "\n");

				this.handleMessage(data.toString())
					.then((value) => {
						socket.write(value);
					})
					.catch((error) => {
						socket.write(error.message);
					});
			});

			socket.on("end", () => {
				this.handleSave();
				console.log("client disconnected\n");
			});

			socket.on("error", (err: Error) => {
				console.log("Error: ", err, "\n");
			});
		});

		server.on("error", (err: Error) => {
			throw err;
		});

		server.on("close", () => {
			this.handleSave();
			console.log("server shutting down...\n");
		});

		server.listen(this.port, () => {
			console.log("server listening on port ", this.port, "\n");
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
					[response, errorPrefix] = this.handleDecr(args[0]);
					break;

				case "SAVE":
					[response, errorPrefix] = this.handleSave();
					break;

				case "COMMAND":
					[response, errorPrefix] = this.handleCommand();
					break;

				case "SADD":
					[response, errorPrefix] = this.handleSADD(args);
					break;

				case "SMEMBERS":
					[response, errorPrefix] = this.handleSMEMBERS(args[0]);
					break;

				case "LPUSH":
					[response, errorPrefix] = this.handleLPush(args);
					break;

				case "RPUSH":
					[response, errorPrefix] = this.handleRPush(args);
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

		console.log("SERIALIZER: ", new RESPSerializer().serialize(response, errorPrefix));
		return new RESPSerializer().serialize(response, errorPrefix);
	}

	handleGet(key: AllowedType): [AllowedType, string | null] {
		let value = this.store.get(key);

		if (value === undefined) {
			return [`key: ${key} not found`, "KEYERROR"];
		}
		return [value, null];
	}

	handleSet(args: AllowedType[]): [string, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'set' command", "ERR"];
		}

		let argNum = Number(args[1]);

		if (Number.isNaN(argNum)) {
			this.store.set(args[0], args[1]);
		} else {
			this.store.set(args[0], argNum);
		}

		return ["OK", null];
	}

	handleKeys(): [AllowedType, null] {
		return [Array.from(this.store.keys()), null];
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
		let value = this.store.get(key);

		if (value === undefined) {
			return [`key: ${key} not found`, "KEYERROR"];
		}

		if (typeof value === "number") {
			value--;
			this.store.set(key, value);

			return [value as number, null];
		}

		return [`Invalid operation on type: ${typeof value}`, "WRONGTYPE"];
	}

	handleCommand(): [string, null] {
		return ["OK", null];
	}

	handleSADD(args: AllowedType[]): [number | string, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'SADD' command", "ERR"];
		}

		let key = args[0];

		let value = this.store.get(key);

		if (value === undefined) {
			this.store.set(key, new Set([args[1]]));

			return [1, null];
		}

		if (value instanceof Set) {
			value.add(args[1]);
			this.store.set(key, value);

			return [1, null];
		}

		return [`Invalid operation on type: ${typeof value}`, "WRONGTYPE"];
	}

	handleSMEMBERS(key: AllowedType): [AllowedType, string | null] {
		let value = this.store.get(key);

		if (value === undefined) {
			return [`key: ${key} not found`, "KEYERROR"];
		}

		if (value instanceof Set) {
			return [value, null];
		} else {
			return [`Invalid operation on type: ${typeof value}`, "WRONGTYPE"];
		}
	}

	handleLPush(args: AllowedType[]): [number | string, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'LPUSH' command", "ERR"];
		}

		let key = args[0];

		let value = this.store.get(key);

		if (value === undefined) {
			this.store.set(key, new Array(args[1]));

			return [1, null];
		}

		if (value instanceof Array) {
			value = [...args.slice(1), ...value];
			this.store.set(key, value);

			return [1, null];
		}

		return [`Invalid operation on type: ${typeof value}`, "WRONGTYPE"];
	}

	handleRPush(args: AllowedType[]): [number | string, string | null] {
		if (args.length < 2) {
			return ["wrong number of arguments for 'RPUSH' command", "ERR"];
		}

		let key = args[0];

		let value = this.store.get(key);

		if (value === undefined) {
			this.store.set(key, new Array(args[1]));

			return [1, null];
		}

		if (value instanceof Array) {
			value = [...value, ...args.slice(1)];
			this.store.set(key, value);

			return [1, null];
		}

		return [`Invalid operation on type: ${typeof value}`, "WRONGTYPE"];
	}

	handleSave(): [string, null] {
		this.saveStoreToDisk()
			.then((value) => {
				let timeNow = new Date().toLocaleString();
				console.log(timeNow, ": DB saved to disk");
			})
			.catch((error) => {
				let timeNow = new Date().toLocaleString();
				console.warn(timeNow, ": Error saving to disk: ", error.message);
			});

		return ["OK", null];
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
