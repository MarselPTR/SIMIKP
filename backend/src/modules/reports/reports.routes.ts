import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getProductionReportData, generateExcelReport, generatePdfReport, ReportFilter } from "./reports.service";

export async function reportsRoutes(fastify: FastifyInstance) {
  // 1. JSON Data API for live preview
  fastify.get("/production", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const filter: ReportFilter = {
        year: query.year ? parseInt(query.year) : undefined,
        month: query.month ? parseInt(query.month) : undefined,
        quarter: query.quarter ? parseInt(query.quarter) : undefined,
        opdId: query.opdId,
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const data = await getProductionReportData(filter);
      return reply.send({
        success: true,
        data,
      });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: error.message || "Gagal mengambil data laporan produksi",
      });
    }
  });

  // 2. Download Excel (.xlsx)
  fastify.get("/production/excel", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const filter: ReportFilter = {
        year: query.year ? parseInt(query.year) : undefined,
        month: query.month ? parseInt(query.month) : undefined,
        quarter: query.quarter ? parseInt(query.quarter) : undefined,
        opdId: query.opdId,
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const buffer = await generateExcelReport(filter);
      const filename = `Laporan_Produksi_Konten_${filter.year || new Date().getFullYear()}.xlsx`;

      return reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .send(buffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: error.message || "Gagal menghasilkan file Excel laporan",
      });
    }
  });

  // 3. Download/Preview PDF (.pdf)
  fastify.get("/production/pdf", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const filter: ReportFilter = {
        year: query.year ? parseInt(query.year) : undefined,
        month: query.month ? parseInt(query.month) : undefined,
        quarter: query.quarter ? parseInt(query.quarter) : undefined,
        opdId: query.opdId,
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const buffer = await generatePdfReport(filter);
      const filename = `Laporan_Produksi_Konten_${filter.year || new Date().getFullYear()}.pdf`;

      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `inline; filename="${filename}"`)
        .send(buffer);
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: error.message || "Gagal menghasilkan file PDF laporan",
      });
    }
  });
}
