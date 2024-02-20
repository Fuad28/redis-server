class RESPManager {
	static readonly firstByte = new Set<string>(["+", "-", ":", "$", "*"]);
	static readonly CRLF = "\r\n";

	static serialize(commandsArr: string[]) {
		const CRLF = "\r\n";
		let serializedString = `*${commandsArr.length}`;

		commandsArr.forEach((cmd) => {
			serializedString += CRLF + "$" + cmd.length + CRLF + cmd;
		});

		return serializedString + CRLF;
	}

	static deserialize(command: string) {
		const CRLF = "\r\n";
		let commandsArr = command.split(CRLF);

		RESPManager.validateCommandArr(commandsArr);

		return commandsArr;
	}

	static validateCommandArr(commandsArr: string[]): void | Error {
		// Commands have to be arrays of bulk strings
		// Commands have to end with "\r\n"

		if (!commandsArr[0].startsWith("*") || commandsArr[-1] !== "") {
			throw new Error("Invalid command.");
		}
	}
}

let cmdArr = ["SET", "my_session", "202313024587774521AF"];
let serialized = RESPManager.serialize(cmdArr);

console.log(JSON.stringify(serialized));
console.log(RESPManager.deserialize(serialized));
