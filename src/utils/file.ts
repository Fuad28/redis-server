import * as fs from "node:fs/promises";
import { CustomErrorType, FileData } from "../types";
import * as path from "path";

const currentDir = __dirname;

export class FileManager {
	static async writeToFile(fileName: string, data: FileData): Promise<void | Error> {
		try {
			const [_, filePath] = await FileManager.getFilePath(fileName);
			let fileDataString = JSON.stringify(data);
			await fs.writeFile(filePath, fileDataString);
		} catch (err) {
			throw err as CustomErrorType;
		}
	}

	static async readFile(filePath: string, directoryPath?: string): Promise<FileData> {
		if (!directoryPath) {
			[directoryPath, filePath] = await FileManager.getFilePath(filePath);
		}
		try {
			await fs.access(directoryPath, fs.constants.F_OK);
			let file = await fs.readFile(filePath, "utf-8");
			let a = JSON.parse(file) as FileData;
			return a;
		} catch (err) {
			const error = err as CustomErrorType;

			if (error.code == "ENOENT") {
				fs.mkdir(directoryPath, { recursive: true });
				// const defaultJsonData = JSON.stringify({ data: [] });
				// await fs.writeFile(filePath, defaultJsonData);
				return FileManager.readFile(directoryPath, filePath);
			} else {
				throw new Error(error.message);
			}
		}
	}

	static async getFilePath(fileName: string): Promise<[string, string]> {
		const directoryPath: string = path.join(currentDir, "data");
		const filePath: string = path.join(directoryPath, fileName);

		return [directoryPath, filePath];
	}
}
