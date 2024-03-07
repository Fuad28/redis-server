import * as fsp from "node:fs/promises";
import fs from "fs";

import { CustomErrorType, FileData } from "../types";
import * as path from "path";

export class FileManager {
	static async writeToFile(fileName: string, data: FileData): Promise<void | Error> {
		try {
			const [_, filePath] = await FileManager.getFilePath(fileName);
			let fileDataString = JSON.stringify(data);
			await fsp.writeFile(filePath, fileDataString);
		} catch (err) {
			throw err as CustomErrorType;
		}
	}

	static async readFile(filePath: string, directoryPath?: string): Promise<FileData> {
		if (!directoryPath) {
			[directoryPath, filePath] = await FileManager.getFilePath(filePath);
		}
		try {
			await fsp.access(directoryPath, fs.constants.F_OK);
			let jsonString = await fsp.readFile(filePath, "utf-8");
			const jsonObject = JSON.parse(jsonString);

			return new Map<string, string>(Object.entries(jsonObject));
		} catch (err) {
			const error = err as CustomErrorType;

			if (error.code == "ENOENT") {
				fsp.mkdir(directoryPath, { recursive: true });
				await fsp.writeFile(filePath, JSON.stringify({}));

				return FileManager.readFile(filePath, directoryPath);
			} else {
				throw new Error(error.message);
			}
		}
	}

	static async getFilePath(fileName: string): Promise<[string, string]> {
		const rootDirectory: string = path.resolve(__dirname, "../");

		const filePath: string = path.join(rootDirectory, fileName);

		return [rootDirectory, filePath];
	}
}
