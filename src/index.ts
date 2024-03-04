import { RESPSerializer } from "./serializer";
import { RESPDeserializer } from "./deserializer";
import { Redis } from "./redis";

// let cmdArr = ["SET", "my_session", "202313024587774521AF"];
// let serialized = new RESPSerializer().serialize(cmdArr);
// console.log(JSON.stringify(serialized)); // "*3\r\n+SET\r\n+my_session\r\n+202313024587774521AF\r\n"

let deserialized = new RESPDeserializer("*3\r\n$3\r\nGET\r\n$3\r\nfoo\r\n:34\r\n").deserialize();
console.log(deserialized);

let redis = new Redis(8124);

redis.start();
