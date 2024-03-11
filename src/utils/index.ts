export * from "./file";

export function getPort(): number | void {
	let argv = process.argv.slice(2);

	if (argv.length == 0) {
		return 6379;
	}

	if (argv.length < 2) {
		console.error(`argument should be passed as '-p 6379' `);
	}

	if (argv[0] !== "-p") {
		console.error(`argument ${argv[0]} not recognized`);
	}

	let port = Number(argv[1]);

	if (!Number.isInteger(port)) {
		console.error(`port should be an integer`);
	} else {
		return port;
	}
}
