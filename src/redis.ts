import { createServer } from "net";

class Redis {
	constructor(public port: number = 6379) {
		this.port = port;
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
		return message;
	}
}

let redis = new Redis(8124);

redis.start();
