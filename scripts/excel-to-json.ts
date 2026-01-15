import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const inputPath = path.join(process.cwd(), "data", "rules.xlsx");
const outputPath = path.join(process.cwd(), "data", "rules.json");

const workbook = XLSX.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const jsonData = XLSX.utils.sheet_to_json(sheet, {
  defval: "",
});

fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), "utf-8");

console.log("rules.json generated");
