// lib/types.ts
export type TableName = "patients" | "encounters" | "orders" | "medications" | "lab_results";

export type ColumnMeta = {
  name: string;
  type: string; // DuckDB type string
  kind: "string" | "number" | "boolean" | "datetime" | "other";
};

export type QueryResult = {
  columns: string[];
  rows: any[];
};