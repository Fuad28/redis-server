import { Redis } from "./redis";
import { getPort } from "./utils";

let port = getPort();

if (port) {
	new Redis(port).start();
}
