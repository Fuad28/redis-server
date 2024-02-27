class RESPManager {
	static readonly types = new Set<string>(["+", "-", ":", "$", "*"]);
	static readonly commands = new Set<string>(["GET", "SET", "KEYS", "EXISTS"]);
	static readonly store = {};
	static readonly CRLF = "\r\n";

	static serialize(input: unknown, errorPrefix?: string): string | Error {
		if (errorPrefix) {
			const CRLF = "\r\n";
			return "-" + errorPrefix.toLocaleUpperCase() + CRLF + input + CRLF;
		}

		if (typeof input == "string") {
			return RESPManager.stringSerializer(input);
		}

		if (typeof input == "number") {
			return RESPManager.serializerNumber(input);
		}

		if (typeof input == null) {
			return RESPManager.serializeNull();
		}

		if (typeof input == "boolean") {
			return RESPManager.serializeBoolean(input);
		}

		if (input instanceof Array) {
			return RESPManager.serializeArray(input);
		}

		if (input instanceof Set) {
			return RESPManager.serializeSet(input);
		}

		if (input instanceof Map) {
			return RESPManager.serializeMap(input);
		}

		throw new Error("Invalid input type");
	}

	static stringSerializer(input: string): string {
		const CRLF = "\r\n";
		const inputsArr = input.split(CRLF);
		let serializedInput = "";

		if (inputsArr.length == 1) {
			serializedInput = "+" + input + CRLF;
		} else {
			inputsArr.forEach((element) => {
				serializedInput += "$" + element.length + CRLF + element + CRLF;
			});
		}

		return serializedInput;
	}

	static serializerNumber(input: number): string {
		const CRLF = "\r\n";
		let upperLimit = 2 ** 63 - 1;

		if (Number.isInteger(input) && Math.abs(input) > upperLimit) {
			return "(" + input.toString() + CRLF;
		} else if (Number.isInteger(input)) {
			return ":" + input.toString() + CRLF;
		} else {
			return "," + input.toString() + CRLF;
		}
	}

	static serializeNull(): string {
		return "$-1\r\n";
	}

	static serializeBoolean(input: boolean): string {
		return input == true ? "#t\r\n" : "#f\r\n";
	}

	static serializeArray(input: any[]) {
		const CRLF = "\r\n";
		let serializedInput = `*${input.length}${CRLF}`;

		input.forEach((element) => {
			serializedInput += RESPManager.serialize(element);
		});

		return serializedInput;
	}

	static serializeSet(input: Set<unknown>) {
		const CRLF = "\r\n";
		let serializedInput = `~${input.size}${CRLF}`;

		input.forEach((element) => {
			serializedInput += RESPManager.serialize(element);
		});

		return serializedInput;
	}

	static serializeMap(input: Map<unknown, unknown>) {
		const CRLF = "\r\n";
		let serializedInput = `%${input.size}${CRLF}`;

		input.forEach((key, value) => {
			let keyS = RESPManager.serialize(key);
			let valueS = RESPManager.serialize(value);

			if (typeof keyS == "string" && typeof valueS == "string") {
				serializedInput += keyS + valueS;
			}
		});

		return serializedInput;
	}

	static deserialize(command: string) {
		const CRLF = "\r\n";
		let commandsArr = command.split(CRLF);
		console.log(commandsArr);

		RESPManager.validateCommandArr(commandsArr);

		let arrayLength = Number(command[1]);
		let content = command.slice(6);

		return commandsArr;
	}

	static validateCommandArr(commandsArr: string[]): void | Error {
		// Command arrays have to be arrays of bulk strings
		// Command arrays have to end with "\r\n"

		if (!commandsArr[0].startsWith("*") || commandsArr[-1] !== "") {
			throw new Error("Invalid command.");
		}
	}
}

// let cmdArr = ["SET", "my_session", "202313024587774521AF"];
// let serialized = RESPManager.serialize(cmdArr);

// console.log(JSON.stringify(serialized));
// console.log(RESPManager.deserialize(serialized));
