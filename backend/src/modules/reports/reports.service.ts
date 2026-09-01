import { db } from "../../db";
import { activities, activityStrategicIssues, assignments, strategicIssues, contentTypes, opds, users } from "../../db/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit-table";

export interface ReportFilter {
  year?: number;
  month?: number; // 1 - 12
  quarter?: number; // 1 - 4
  opdId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MatrixCellData {
  issueName: string;
  contentTypeName: string;
  count: number;
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

const MONTH_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

// Content types standard order
const DEFAULT_CONTENT_TYPES = [
  "Infografis", "AUDIO", "VIDEO", "FOTO", "BUMPER", "NASKAH BERITA"
];

/**
 * Fetch and construct the matrix report data
 */
export async function getProductionReportData(filter: ReportFilter): Promise<ReportMatrixSummary> {
  const currentYear = filter.year || new Date().getFullYear();
  let startDate: Date;
  let endDate: Date;
  let periodeTitle = "";

  if (filter.startDate && filter.endDate) {
    startDate = new Date(filter.startDate);
    endDate = new Date(filter.endDate);
    periodeTitle = `PERIODE ${filter.startDate} S.D ${filter.endDate}`;
  } else if (filter.month) {
    const monthIdx = filter.month - 1;
    startDate = new Date(currentYear, monthIdx, 1);
    endDate = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59);
    periodeTitle = `${MONTH_NAMES[monthIdx]} ${currentYear}`;
  } else if (filter.quarter) {
    const startMonth = (filter.quarter - 1) * 3;
    startDate = new Date(currentYear, startMonth, 1);
    endDate = new Date(currentYear, startMonth + 3, 0, 23, 59, 59);
    periodeTitle = `TRIWULAN ${filter.quarter} TAHUN ${currentYear}`;
  } else {
    startDate = new Date(currentYear, 0, 1);
    endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    periodeTitle = `TAHUN ${currentYear}`;
  }

  // 1. Fetch Strategic Issues & Content Types from Database
  const dbIssues = await db.select().from(strategicIssues);
  const issuesList = dbIssues.length > 0
    ? dbIssues.map(i => i.name.toUpperCase())
    : ["SOSIAL", "EKONOMI", "LINGKUNGAN"];

  const dbContentTypes = await db.select().from(contentTypes);
  const contentTypesList = dbContentTypes.length > 0
    ? Array.from(new Set([...DEFAULT_CONTENT_TYPES, ...dbContentTypes.map(c => c.name)]))
    : DEFAULT_CONTENT_TYPES;

  // 2. Fetch Activities matching filters
  const conditions = [
    gte(activities.activityDate, startDate),
    lte(activities.activityDate, endDate)
  ];
  if (filter.opdId) {
    conditions.push(eq(activities.opdId, filter.opdId));
  }

  const rawActivities = await db
    .select({
      id: activities.id,
      activityCode: activities.activityCode,
      title: activities.title,
      strakomNumber: activities.strakomNumber,
      activityDate: activities.activityDate,
      description: activities.description,
      status: activities.status,
    })
    .from(activities)
    .where(and(...conditions))
    .orderBy(activities.activityDate);

  // 3. For each activity, fetch linked issues and detailed assignments
  const rows: ReportRowData[] = [];
  const columnTotals: Record<string, Record<string, number>> = {};

  // Initialize column totals
  for (const issue of issuesList) {
    columnTotals[issue] = {};
    for (const ct of contentTypesList) {
      columnTotals[issue][ct] = 0;
    }
  }

  let grandTotal = 0;

  for (let i = 0; i < rawActivities.length; i++) {
    const act = rawActivities[i];

    // Linked issues
    const actIssues = await db
      .select({ issueName: strategicIssues.name })
      .from(activityStrategicIssues)
      .innerJoin(strategicIssues, eq(activityStrategicIssues.issueId, strategicIssues.id))
      .where(eq(activityStrategicIssues.activityId, act.id));

    const issueNames = actIssues.length > 0
      ? actIssues.map(i => i.issueName.toUpperCase())
      : [issuesList[0] || "SOSIAL"];

    // Detailed linked assignments
    const actAssignments = await db
      .select({
        id: assignments.id,
        userName: users.name,
        staffType: users.staffType,
        contentTypeName: contentTypes.name,
        status: assignments.status,
        deadline: assignments.deadline,
        instruction: assignments.instruction,
      })
      .from(assignments)
      .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
      .innerJoin(users, eq(assignments.userId, users.id))
      .where(eq(assignments.activityId, act.id));

    // Build matrix for this row
    const matrix: Record<string, Record<string, number>> = {};
    for (const issue of issuesList) {
      matrix[issue] = {};
      for (const ct of contentTypesList) {
        matrix[issue][ct] = 0;
      }
    }

    let rowTotal = 0;

    const assignmentsList: AssignmentDetail[] = actAssignments.map(asgn => {
      const deadlineStr = asgn.deadline
        ? new Date(asgn.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        : null;

      const ctName = asgn.contentTypeName;
      for (const issueName of issueNames) {
        if (matrix[issueName] && matrix[issueName][ctName] !== undefined) {
          matrix[issueName][ctName] += 1;
          columnTotals[issueName][ctName] += 1;
          rowTotal += 1;
        }
      }

      return {
        id: asgn.id,
        userName: asgn.userName,
        staffType: asgn.staffType,
        contentTypeName: asgn.contentTypeName,
        status: asgn.status,
        deadline: deadlineStr,
        instruction: asgn.instruction,
      };
    });

    grandTotal += rowTotal;

    // Format date DD/MM/YYYY
    const d = new Date(act.activityDate);
    const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    rows.push({
      no: i + 1,
      id: act.id,
      activityCode: act.activityCode,
      tanggal: formattedDate,
      noStrakom: act.strakomNumber || "-",
      judul: act.title,
      description: act.description,
      status: act.status,
      issues: issueNames,
      matrix,
      jumlahProduksi: rowTotal,
      assignmentsList,
    });
  }

  return {
    issues: issuesList,
    contentTypes: contentTypesList,
    rows,
    columnTotals,
    totalProduksiKeseluruhan: grandTotal,
    periodeTitle,
  };
}

/**
 * Generate Excel Workbook Buffer matching the screenshot layout
 */
export async function generateExcelReport(filter: ReportFilter): Promise<Buffer> {
  const data = await getProductionReportData(filter);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIMIKP Diskominfo";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`STRAKOM ${data.periodeTitle.slice(0, 15)}`);

  // Title Headers (Rows 2 & 3)
  sheet.mergeCells('A2:X2');
  const titleCell = sheet.getCell('A2');
  titleCell.value = "LAPORAN PRODUKSI KONTEN";
  titleCell.font = { name: "Arial", size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells('A3:X3');
  const subtitleCell = sheet.getCell('A3');
  subtitleCell.value = data.periodeTitle;
  subtitleCell.font = { name: "Arial", size: 12, bold: true };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.getRow(5).height = 20;
  sheet.getRow(6).height = 20;
  sheet.getRow(7).height = 40;

  // Merge Base Headers across Rows 5-7
  sheet.mergeCells('A5:A7');
  const noHeader = sheet.getCell('A5');
  noHeader.value = "NO";

  sheet.mergeCells('B5:B7');
  const tglHeader = sheet.getCell('B5');
  tglHeader.value = "Tanggal";

  sheet.mergeCells('C5:C7');
  const strakomHeader = sheet.getCell('C5');
  strakomHeader.value = "No Strakom";

  sheet.mergeCells('D5:D7');
  const judulHeader = sheet.getCell('D5');
  judulHeader.value = "Judul";

  let colIdx = 5; // Column E is 5

  const totalMatrixCols = data.issues.length * data.contentTypes.length;
  const startColLetter = getColumnLetter(colIdx);
  const endColLetter = getColumnLetter(colIdx + totalMatrixCols - 1);

  sheet.mergeCells(`${startColLetter}5:${endColLetter}5`);
  const isuSuperHeader = sheet.getCell(`${startColLetter}5`);
  isuSuperHeader.value = "Isu Strategis";

  for (const issue of data.issues) {
    const issueStartColLetter = getColumnLetter(colIdx);
    const issueEndColLetter = getColumnLetter(colIdx + data.contentTypes.length - 1);

    sheet.mergeCells(`${issueStartColLetter}6:${issueEndColLetter}6`);
    const issueCell = sheet.getCell(`${issueStartColLetter}6`);
    issueCell.value = issue;

    for (const ct of data.contentTypes) {
      const ctColLetter = getColumnLetter(colIdx);
      const ctCell = sheet.getCell(`${ctColLetter}7`);
      ctCell.value = ct;
      colIdx++;
    }
  }

  const totalColLetter = getColumnLetter(colIdx);
  sheet.mergeCells(`${totalColLetter}5:${totalColLetter}7`);
  const totalHeader = sheet.getCell(`${totalColLetter}5`);
  totalHeader.value = "Jumlah\nProduksi";

  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" }
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: "Arial",
    size: 9,
    bold: true
  };

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };

  for (let r = 5; r <= 7; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= colIdx; c++) {
      const cell = row.getCell(c);
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = borderStyle;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    }
  }

  // Data Rows
  let currentRowIdx = 8;
  for (const rowData of data.rows) {
    const row = sheet.getRow(currentRowIdx);
    row.height = 22;

    row.getCell(1).value = rowData.no;
    row.getCell(2).value = rowData.tanggal;
    row.getCell(3).value = rowData.noStrakom;
    row.getCell(4).value = rowData.judul;

    let c = 5;
    for (const issue of data.issues) {
      for (const ct of data.contentTypes) {
        const val = rowData.matrix[issue]?.[ct] || 0;
        row.getCell(c).value = val > 0 ? val : "";
        c++;
      }
    }

    row.getCell(c).value = rowData.jumlahProduksi > 0 ? rowData.jumlahProduksi : 0;

    for (let col = 1; col <= c; col++) {
      const cell = row.getCell(col);
      cell.font = { name: "Arial", size: 9 };
      cell.border = borderStyle;

      if (col === 1 || col === 2 || col === 3) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (col === 4) {
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }

    currentRowIdx++;
  }

  // Summary Row
  const summaryRow = sheet.getRow(currentRowIdx);
  summaryRow.height = 24;

  sheet.mergeCells(`A${currentRowIdx}:D${currentRowIdx}`);
  const labelTotalCell = summaryRow.getCell(1);
  labelTotalCell.value = "TOTAL PRODUKSI";
  labelTotalCell.font = { name: "Arial", size: 9, bold: true };
  labelTotalCell.alignment = { horizontal: "center", vertical: "middle" };

  let summaryColIdx = 5;
  for (const issue of data.issues) {
    for (const ct of data.contentTypes) {
      const colTotal = data.columnTotals[issue]?.[ct] || 0;
      summaryRow.getCell(summaryColIdx).value = colTotal;
      summaryColIdx++;
    }
  }

  summaryRow.getCell(summaryColIdx).value = data.totalProduksiKeseluruhan;

  for (let col = 1; col <= summaryColIdx; col++) {
    const cell = summaryRow.getCell(col);
    cell.font = { name: "Arial", size: 9, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    cell.border = borderStyle;
    if (col >= 5) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  }

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 30;

  for (let col = 5; col <= summaryColIdx; col++) {
    sheet.getColumn(col).width = 10;
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate PDF Report Buffer with Dynamic Row Height to prevent text clipping
 */
export async function generatePdfReport(filter: ReportFilter): Promise<Buffer> {
  const data = await getProductionReportData(filter);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("PEMERINTAH KOTA BATU", { align: "center" })
      .fontSize(12)
      .text("DINAS KOMUNIKASI DAN INFORMATIKA", { align: "center" })
      .fontSize(10)
      .font("Helvetica")
      .text("Balaikota Among Tani Gedung B3 Lt. 3, Jl. Panglima Sudirman No. 50, Kota Batu", { align: "center" })
      .moveDown(0.5);

    doc
      .moveTo(30, doc.y)
      .lineTo(812, doc.y)
      .lineWidth(1.5)
      .stroke();

    doc.moveDown(0.8);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("LAPORAN PRODUKSI KONTEN IKP", { align: "center" })
      .fontSize(10)
      .text(`PERIODE: ${data.periodeTitle}`, { align: "center" })
      .moveDown(1);

    const headers = [
      { label: "NO", width: 30 },
      { label: "Tanggal", width: 65 },
      { label: "No Strakom", width: 85 },
      { label: "Judul Kegiatan", width: 220 },
      { label: "Total Produksi", width: 80 },
    ];

    let startX = 30;
    let startY = doc.y;

    // Draw Table Header
    doc.rect(startX, startY, 782, 22).fillAndStroke("#f0f0f0", "#000000");
    doc.fillColor("#000000").fontSize(9).font("Helvetica-Bold");

    let currentX = startX + 5;
    for (const h of headers) {
      doc.text(h.label, currentX, startY + 6, { width: h.width, align: "left" });
      currentX += h.width;
    }

    doc.text("Sebaran Isu Strategis", currentX, startY + 6, { width: 290, align: "center" });

    startY += 22;

    // Render Data Rows with Dynamic Row Height
    for (const row of data.rows) {
      doc.font("Helvetica").fontSize(8);

      const issueSummaryText = data.issues
        .map(issue => {
          let count = 0;
          for (const ct of data.contentTypes) {
            count += row.matrix[issue]?.[ct] || 0;
          }
          return count > 0 ? `${issue}: ${count}` : null;
        })
        .filter(Boolean)
        .join(" | ");

      // Calculate dynamic height based on Judul Kegiatan text
      const titleTextHeight = doc.heightOfString(row.judul, { width: 210 });
      const issueTextHeight = doc.heightOfString(issueSummaryText || "-", { width: 280 });
      const rowHeight = Math.max(26, Math.max(titleTextHeight, issueTextHeight) + 10);

      // Check for page overflow
      if (startY + rowHeight > 520) {
        doc.addPage({ layout: "landscape", margin: 30 });
        startY = 40;
      }

      // Draw outer row box with exact dynamic height
      doc.rect(startX, startY, 782, rowHeight).stroke("#cccccc");

      currentX = startX + 5;
      doc.text(String(row.no), currentX, startY + 6, { width: 25, align: "center" });
      currentX += 30;

      doc.text(row.tanggal, currentX, startY + 6, { width: 60, align: "center" });
      currentX += 65;

      doc.text(row.noStrakom, currentX, startY + 6, { width: 80, align: "left" });
      currentX += 85;

      // Judul Kegiatan with automatic wrapping and padded height
      doc.text(row.judul, currentX, startY + 6, { width: 210, align: "left", height: rowHeight - 6 });
      currentX += 220;

      doc.font("Helvetica-Bold").text(`${row.jumlahProduksi} Konten`, currentX, startY + 6, { width: 75, align: "center" });
      currentX += 80;

      doc.font("Helvetica");
      doc.text(issueSummaryText || "-", currentX, startY + 6, { width: 280, align: "left" });

      startY += rowHeight;
    }

    // Total Summary Row
    startY += 5;
    if (startY > 520) {
      doc.addPage({ layout: "landscape", margin: 30 });
      startY = 40;
    }

    doc.rect(startX, startY, 782, 24).fillAndStroke("#e6f2ff", "#000000");
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);
    doc.text(`TOTAL KESELURUHAN PRODUKSI KONTEN: ${data.totalProduksiKeseluruhan} KONTEN`, startX + 10, startY + 7);

    // Signature Box
    startY += 40;
    if (startY > 460) {
      doc.addPage({ layout: "landscape", margin: 30 });
      startY = 40;
    }

    const todayStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const signX = 550;

    doc
      .fontSize(9)
      .font("Helvetica")
      .text(`Kota Batu, ${todayStr}`, signX, startY)
      .text("Mengetahui,", signX, startY + 15)
      .text("Kepala Dinas Komunikasi dan Informatika", signX, startY + 30)
      .moveDown(4)
      .font("Helvetica-Bold")
      .text("( ____________________________________ )", signX, startY + 75)
      .font("Helvetica")
      .text("NIP. 197...................................", signX, startY + 90);

    doc.end();
  });
}

function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = "";
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIndex = Math.floor((colIndex - temp) / 26);
  }
  return letter;
}
