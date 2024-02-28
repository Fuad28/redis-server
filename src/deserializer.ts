class RESPDeserializer {
	static readonly types = new Set<string>(["+", "-", ":", "$", "*"]);
	static readonly commands = new Set<string>([
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
	]);
	readonly CRLF = "\r\n";
	private curIndex: number;
	private inputLength: number;

	constructor(public input: string) {
		this.curIndex = 0;
		this.inputLength = input.length;
	}

	deserialize(): unknown {
		RESPDeserializer.validateCommandArr(this.input);

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
		}
	}

	get curChar(): any {
		return this.input[this.curIndex];
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
		let stringLength = Number(this.input[this.curIndex + 1]);
		this.curIndex += 3;

		if (stringLength == -1) {
			return null;
		}

		let value = "";

		for (let i = 0; i < stringLength - 1; i++) {
			value += this.curChar;
			this.curIndex++;
		}

		this.curIndex += 2;
		return value;
	}

	deserializeInteger(): number {
		let value = "";

		while (this.curChar != "\r" && this.curIndex < this.inputLength) {
			this.curIndex++;
			value += this.curChar;
		}

		this.curIndex += 2;
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
		this.curIndex += 2;
		return false;
	}

	deserializeArray(): any[] | null {
		let values = [];

		let arrayLength = Number(this.input[this.curIndex + 1]);
		this.curIndex += 3;

		if (arrayLength == -1) {
			return null;
		}

		if (arrayLength == 0) {
			return [];
		}

		for (let i = 0; i < arrayLength - 1; i++) {
			let element = this.deserialize();
			values.push(element);
			this.curIndex++;
		}

		this.curIndex += 2;

		return values;
	}

	deserializeSet(): Set<unknown> | null {
		let values = new Set<unknown>([]);

		let setLength = Number(this.input[this.curIndex + 1]);
		this.curIndex += 3;

		if (setLength == -1) {
			return null;
		}

		if (setLength == 0) {
			return values;
		}

		for (let i = 0; i < setLength - 1; i++) {
			let element = this.deserialize();
			values.add(element);
			this.curIndex++;
		}

		this.curIndex += 2;

		return values;
	}

	deserializeMap(): Map<unknown, unknown> | null {
		let values = new Map<unknown, unknown>([]);

		let mapLength = Number(this.input[this.curIndex + 1]);
		this.curIndex += 3;

		if (mapLength == -1) {
			return null;
		}

		if (mapLength == 0) {
			return values;
		}

		for (let i = 0; i < mapLength - 1; i++) {
			let key = this.deserialize();
			let value = this.deserialize();

			if (key && value) {
				values.set(key, value);
			}

			this.curIndex++;
		}

		this.curIndex += 2;

		return values;
	}

	static validateCommandArr(input: string): void | Error {
		// input arrays have to be arrays of bulk strings
		// ensure all numbers are actually numbers

		const CRLF = "\r\n";
		let inputsArr = input.split(CRLF);

		if (
			!input.endsWith(CRLF) ||
			!inputsArr[0].startsWith("*") ||
			!inputsArr[1].startsWith("$") ||
			inputsArr[2] in this.commands
		) {
			throw new Error("Invalid command.");
		}
	}
}
