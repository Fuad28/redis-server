export type AllowedType =
	| string
	| number
	| boolean
	| null
	| Map<AllowedType, AllowedType>
	| Set<AllowedType>
	| Array<AllowedType>
	| IterableIterator<AllowedType>
	| Error;

export type CustomErrorType = {
	code: string;
	message: string;
	stack?: string;
};

export type FileData = Map<AllowedType, AllowedType>;

export interface IRedis {
	readonly store: FileData;
	readonly dbPath: string;
	port: number;

	start(): void;
	handleMessage(message: string): Promise<string>;
	handleGet(key: AllowedType): [AllowedType, string | null];
	handleSet(args: AllowedType[]): [string, string | null];
	handleKeys(): [AllowedType, null];
	handleLen(): [number, null];
	handleExists(key: AllowedType): [boolean, null];
	handlePing(): [string, null];
	handleEcho(args: AllowedType[]): [string, null];
	handleDel(key: AllowedType): [number, null];
	handleDecr(key: AllowedType): [number | string, string | null];
	handleSave(): [string, null];
	saveStoreToDisk(): Promise<void>;
	loadStoreFromDisk(): Promise<void>;
}

export interface IRESPDeserializer {
	readonly types: Set<string>;
	readonly commands: Set<string>;
	readonly CRLF: string;
	// curIndex: number;
	// inputLength: number;

	deserializeCommand(): [string, AllowedType[]];
	deserialize(): AllowedType;
	get curChar(): string;
	get nextChar(): string;
	deserializeError(): Error;
	deserializeSimpleString(): string;
	deserializeBulkString(): string | null;
	deserializeInteger(): number;
	deserializeBigInteger(): number;
	deserializeDoubles(): number;
	deserializeNull(): null;
	deserializeBoolean(): boolean;
	deserializeArray(): AllowedType[] | null;
	deserializeSet(): Set<AllowedType> | null;
	deserializeMap(): Map<AllowedType, AllowedType> | null;
	validateCommandArr(): void | Error;
}

export interface IRESPSerializer {
	readonly CRLF: string;

	serialize(input: AllowedType, errorPrefix?: string): string;
	serializeString(input: string, isBulk: boolean): string;
	serializeNumber(input: number): string;
	serializeNull(): string;
	serializeBoolean(input: boolean): string;
	serializeArray(input: AllowedType[]): string;
	serializeSet(input: Set<AllowedType>): string;
	serializeMap(input: Map<AllowedType, AllowedType>): string;
}
