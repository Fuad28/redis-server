import { IRESPDeserializer, AllowedType } from "./types";
export class RESPDeserializer implements IRESPDeserializer {
	readonly types = new Set<string>(["+", "-", ":", "$", "*", "(", "_", "~", ",", "#", "%"]);
	readonly commands = new Set<string>([
		"GET",
		"SET",
		"KEYS",
		"LEN",
		"EXISTS",
		"PING",
		"ECHO",
		"DEL",
		"DECR",
		"SAVE",
		"COMMAND",
		"SADD",
		"SMEMBERS",
		"LPUSH",
		"RPUSH",
	]);
	readonly CRLF = "\r\n";
	private curIndex: number;
	private inputLength: number;

	constructor(public input: string) {
		this.curIndex = 0;
		this.inputLength = input.length;
	}

	deserializeCommand(): [string, AllowedType[]] {
		this.validateCommandArr();

		let commandArray = this.deserializeArray();

		if (!commandArray || commandArray.length === 0) {
			return ["", []];
		}

		return [commandArray[0] as string, commandArray.slice(1)];
	}

	deserialize(): AllowedType {
		switch (this.curChar) {
			case "-":
				return this.deserializeError();

			case "+":
				return this.deserializeSimpleString();

			case "$":
				return this.deserializeBulkString();

			case ":":
				return this.deserializeInteger();

			case "(":
				return this.deserializeBigInteger();

			case ",":
				return this.deserializeDoubles();

			case "#":
				return this.deserializeBoolean();

			case "*":
				return this.deserializeArray();

			case "%":
				return this.deserializeMap();

			case "~":
				return this.deserializeSet();

			case "_":
				return this.deserializeNull();

			default:
				throw new Error("Invalid data type");
		}
	}

	get curChar(): string {
		return this.input[this.curIndex];
	}

	get nextChar(): string {
		return this.input[this.curIndex + 1];
	}

	deserializeError(): Error {
		let message = "";

		while (this.curChar != "\r" && this.curIndex < this.inputLength) {
			this.curIndex++;
			message += this.curChar;
		}
		this.curIndex += 2;

		return new Error(message);
	}

	deserializeSimpleString(): string {
		let value = "";

		while (this.curChar != "\r" && this.curIndex < this.inputLength) {
			this.curIndex++;
			value += this.curChar;
		}

		this.curIndex += 2;
		return value;
	}

	deserializeBulkString(): string | null {
		let stringLength = Number(this.nextChar);
		this.curIndex += 3;

		if (stringLength == -1) {
			return null;
		}

		let value = "";

		for (let i = 0; i < stringLength; i++) {
			this.curIndex++;
			value += this.curChar;
		}

		this.curIndex += 3;

		return value;
	}

	deserializeInteger(): number {
		let value = "";

		while (this.curChar != "\r" && this.curIndex < this.inputLength) {
			this.curIndex++;
			value += this.curChar;
		}

		this.curIndex += 3;
		return Number(value);
	}

	deserializeBigInteger(): number {
		return this.deserializeInteger();
	}

	deserializeDoubles(): number {
		return this.deserializeInteger();
	}

	deserializeNull(): null {
		this.curIndex += 3;
		return null;
	}

	deserializeBoolean(): boolean {
		this.curIndex++;
		if (this.curChar == "t") {
			return true;
		}
		this.curIndex += 3;
		return false;
	}

	deserializeArray(): AllowedType[] | null {
		let values: AllowedType[] = [];

		let arrayLength = Number(this.nextChar);
		this.curIndex += 4;

		if (arrayLength == -1) {
			return null;
		}

		if (arrayLength == 0) {
			return [];
		}

		for (let i = 0; i < arrayLength; i++) {
			let element = this.deserialize();
			values.push(element);
		}

		this.curIndex += 3;

		return values;
	}

	deserializeSet(): Set<AllowedType> | null {
		let values = new Set<AllowedType>([]);

		let setLength = Number(this.nextChar);
		this.curIndex += 4;

		if (setLength == -1) {
			return null;
		}

		if (setLength == 0) {
			return values;
		}

		for (let i = 0; i < setLength; i++) {
			let element = this.deserialize();
			values.add(element);
		}

		this.curIndex += 3;

		return values;
	}

	deserializeMap(): Map<AllowedType, AllowedType> | null {
		let values = new Map<AllowedType, AllowedType>([]);

		let mapLength = Number(this.nextChar);
		this.curIndex += 4;

		if (mapLength == -1) {
			return null;
		}

		if (mapLength == 0) {
			return values;
		}

		for (let i = 0; i < mapLength; i++) {
			let key = this.deserialize();
			let value = this.deserialize();

			if (key && value) {
				values.set(key, value);
			}
		}

		this.curIndex += 3;

		return values;
	}

	validateCommandArr(): void | Error {
		const CRLF = "\r\n";
		let inputsArr = this.input.split(CRLF);

		if (!inputsArr[0].startsWith("*") || !inputsArr[1].startsWith("$")) {
			throw new Error(`Invalid command: command should be an array of bulk strings.`);
		}

		if (!this.input.endsWith(CRLF)) {
			throw new Error(`Invalid command: ${CRLF} missing at the end of command.`);
		}

		if (!this.commands.has(inputsArr[2].toUpperCase())) {
			throw new Error(`Invalid command: ${inputsArr[2]} not a valid command.`);
		}
	}
}
