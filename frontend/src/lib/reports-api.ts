import { apiFetch } from "./api-client";

export interface ReportFilterParams {
  year?: number;
  month?: number;
  quarter?: number;
  opdId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AssignmentDetail {
  id: string;
  userName: string;
  staffType?: string | null;
  contentTypeName: string;
  status: string;
  deadline?: string | null;
  instruction?: string | null;
}

export interface ReportRowData {
  no: number;
  id: string;
  activityCode: string;
  tanggal: string;
  noStrakom: string;
  judul: string;
  description?: string | null;
  status?: string;
  issues: string[];
  matrix: Record<string, Record<string, number>>;
  jumlahProduksi: number;
  assignmentsList: AssignmentDetail[];
}

export interface ReportMatrixSummary {
  issues: string[];
  contentTypes: string[];
  rows: ReportRowData[];
  columnTotals: Record<string, Record<string, number>>;
  totalProduksiKeseluruhan: number;
  periodeTitle: string;
}

export async function getProductionReport(params: ReportFilterParams): Promise<ReportMatrixSummary> {
  const queryParams = new URLSearchParams();
  if (params.year) queryParams.append("year", String(params.year));
  if (params.month) queryParams.append("month", String(params.month));
  if (params.quarter) queryParams.append("quarter", String(params.quarter));
  if (params.opdId) queryParams.append("opdId", params.opdId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const res = await apiFetch<{ success: boolean; data: ReportMatrixSummary }>(
    `/reports/production?${queryParams.toString()}`
  );
  return res.data;
}

export async function exportReportExcel(params: ReportFilterParams): Promise<void> {
  const queryParams = new URLSearchParams();
  if (params.year) queryParams.append("year", String(params.year));
  if (params.month) queryParams.append("month", String(params.month));
  if (params.quarter) queryParams.append("quarter", String(params.quarter));
  if (params.opdId) queryParams.append("opdId", params.opdId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
  const url = `${API_BASE_URL}/reports/production/excel?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengunduh file Excel laporan");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `Laporan_Produksi_Konten_${params.month ? `Bulan_${params.month}_` : ''}${params.year || new Date().getFullYear()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportReportPdf(params: ReportFilterParams): Promise<void> {
  const queryParams = new URLSearchParams();
  if (params.year) queryParams.append("year", String(params.year));
  if (params.month) queryParams.append("month", String(params.month));
  if (params.quarter) queryParams.append("quarter", String(params.quarter));
  if (params.opdId) queryParams.append("opdId", params.opdId);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
  const url = `${API_BASE_URL}/reports/production/pdf?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/pdf",
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengunduh file PDF laporan");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  // Open in new tab for PDF preview/download
  window.open(downloadUrl, "_blank");
}
