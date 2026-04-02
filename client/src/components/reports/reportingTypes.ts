export type ReportCategory =
  | "Sales"
  | "Customers"
  | "Vendors"
  | "Transactions"
  | "Refunds"
  | "Existing";

export type ReportColumnType = "text" | "date" | "currency" | "number" | "badge";

export interface ReportCatalogItem {
  id: string;
  label: string;
  description: string;
  category: ReportCategory;
  route: string;
  endpoint?: string;
  existing?: boolean;
  experimental?: boolean;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: ReportColumnType;
  align?: "left" | "right" | "center";
}

export interface ReportMeta {
  reportId: string;
  title: string;
  generatedAt: string;
  interval: {
    start: string;
    end: string;
  };
  totals: Record<string, number>;
  notes?: string[];
}

export type ReportRow = Record<string, string | number | boolean | null>;

export interface ReportResponse {
  status: "success";
  data: ReportRow[];
  count: number;
  columns: ReportColumn[];
  meta: ReportMeta;
}

export interface ReportCatalogResponse {
  status: "success";
  data: ReportCatalogItem[];
  count: number;
}

