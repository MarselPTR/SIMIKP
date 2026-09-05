import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db";
import { assignments, activities, contentTypes, users, userRoles, roles, locations } from "../../db/schema";
import { productionItems, productionVersions, productionFiles } from "../../db/schema/production";
import { eq, and, or, desc } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { logAudit } from "../system/audit.service";
import { createNotification } from "../system/notifications.service";
import { sendWorkSubmissionAlertEmail } from "../../services/mail.service";

const updateStatusSchema = z.object({
  status: z.string(),
});

const submitWorkSchema = z.object({
  workLink: z.string().url(),
});

const createProductionSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  contentTypeId: z.string(),
  title: z.string(),
});

export class ProductionsController {
  
  static async createProduction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createProductionSchema.parse(request.body);
      
      const newAssignmentId = crypto.randomUUID();
      const newProductionId = crypto.randomUUID();
      const newVersionId = crypto.randomUUID();

      // Create Assignment -> Production Item -> Production Version
      await db.transaction(async (tx) => {
        await tx.insert(assignments).values({
          id: newAssignmentId,
          activityId: body.activityId, // Assuming UI sends correct UUID
          userId: body.userId,
          contentTypeId: body.contentTypeId,
          status: "LIPUTAN", // Starting status
          createdBy: "system",
        });

        await tx.insert(productionItems).values({
          id: newProductionId,
          assignmentId: newAssignmentId,
          title: body.title,
          status: "LIPUTAN",
        });

        await tx.insert(productionVersions).values({
          id: newVersionId,
          productionItemId: newProductionId,
          versionNumber: 1,
          isCurrent: true,
        });
      });

      await logAudit(request, "CREATE_PRODUCTION", "production_items", newProductionId);

      return reply.status(201).send({ success: true, message: "Produksi berhasil dibuat" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal membuat produksi" });
    }
  }

  static async uploadBankKonten(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const { filename, size, type } = body;

      if (!filename) {
        return reply.status(400).send({ success: false, error: "filename wajib diisi" });
      }

      // Cari productionVersionId yang valid — ambil versi pertama yang ada di DB
      const latestVersion = await db
        .select({ id: productionVersions.id })
        .from(productionVersions)
        .limit(1);

      if (!latestVersion.length) {
        return reply.status(422).send({
          success: false,
          error: "Belum ada data produksi. Silakan buat Penugasan terlebih dahulu sebelum mengunggah file.",
        });
      }

      // Ambil userId dari session auth, atau fallback ke user pertama yang valid dari DB
      const sessionUser = (request as any).user;
      let uploadedBy: string = sessionUser?.id ?? null;

      if (!uploadedBy) {
        // Fallback: pakai user pertama yang ada di DB (FK valid)
        const firstUser = await db.select({ id: users.id }).from(users).limit(1);
        if (!firstUser.length) {
          return reply.status(422).send({ success: false, error: "Tidak ada user di database." });
        }
        uploadedBy = firstUser[0].id;
      }

      const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : "bin";

      const newFileId = crypto.randomUUID();
      const newArchiveId = crypto.randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(productionFiles).values({
          id: newFileId,
          productionVersionId: latestVersion[0].id,
          originalFilename: filename,
          storedFilename: `bk_${Date.now()}_${filename.replace(/\s/g, "_")}`,
          storagePath: `/storage/bank-konten/${new Date().getFullYear()}`,
          mimeType: type || "application/octet-stream",
          fileExtension: ext || "bin",
          fileSize: size || 0,
          uploadedBy,
        });


      });

      await logAudit(request, "UPLOAD_BANK_KONTEN", "production_files", newFileId);

      return reply.status(201).send({
        success: true,
        message: `File "${filename}" berhasil dicatat ke database`,
        fileId: newFileId,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal menyimpan metadata file ke database" });
    }
  }
  
  // 0. Get All (for Admin Dashboard)
  static async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await db
        .select({
          id: assignments.id,
          activityId: activities.id,
          kegiatan: activities.title,
          tanggalKegiatan: activities.activityDate,
          activityTime: activities.activityTime,
          lokasi: locations.name,
          picName: users.name,
          bidangPekerjaan: contentTypes.name,
          workLink: productionVersions.workLink,
          startDate: assignments.startTime,
          endDate: assignments.endTime,
          status: assignments.status,
        })
        .from(assignments)
        .leftJoin(activities, eq(assignments.activityId, activities.id))
        .leftJoin(locations, eq(activities.locationId, locations.id))
        .leftJoin(users, eq(assignments.userId, users.id))
        .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .leftJoin(productionItems, eq(productionItems.assignmentId, assignments.id))
        .leftJoin(productionVersions, and(
          eq(productionVersions.productionItemId, productionItems.id),
          eq(productionVersions.isCurrent, true)
        ))
        .orderBy(desc(assignments.assignedAt));

      return reply.send({ success: true, data });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data produksi" });
    }
  }

  // 0.5 Get Bank Konten (Group by Activity) - Mengambil data riil hasil kurasi Ahli Pertama
  static async getBankKonten(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Ambil berkas fisik terkurasi dari tabel production_files & archive_assets
      const curatedFiles = await db
        .select({
          fileId: productionFiles.id,
          originalFilename: productionFiles.originalFilename,
          storedFilename: productionFiles.storedFilename,
          storagePath: productionFiles.storagePath,
          mimeType: productionFiles.mimeType,
          fileSize: productionFiles.fileSize,
          activityId: activities.id,
          activityTitle: activities.title,
          activityDate: activities.activityDate,
          petugasName: users.name,
          contentType: contentTypes.name,
        })
        .from(productionFiles)
        .innerJoin(productionVersions, eq(productionFiles.productionVersionId, productionVersions.id))
        .innerJoin(productionItems, eq(productionVersions.productionItemId, productionItems.id))
        .innerJoin(assignments, eq(productionItems.assignmentId, assignments.id))
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .leftJoin(users, eq(productionFiles.uploadedBy, users.id))
        .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id));

      // 2. Ambil penugasan berstatus COMPLETED / SIAP_TAYANG untuk menangkap submission berkas yang sudah disetujui
      const completedAssignments = await db
        .select({
          assignmentId: assignments.id,
          activityId: activities.id,
          activityTitle: activities.title,
          activityDate: activities.activityDate,
          petugasName: users.name,
          contentType: contentTypes.name,
          workLink: assignments.workLink,
          status: assignments.status,
        })
        .from(assignments)
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .leftJoin(users, eq(assignments.userId, users.id))
        .leftJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .where(
          or(
            eq(assignments.status, "COMPLETED"),
            eq(assignments.status, "SIAP_TAYANG"),
            eq(assignments.status, "SELESAI")
          )
        );

      const folderMap = new Map<string, {
        id: string;
        title: string;
        tanggal: string;
        petugas: Set<string>;
        kategori: string;
        strakomNumber: string;
        thumbnailUrl?: string;
        files: Array<{
          id: string;
          name: string;
          jenisKonten: "foto" | "video" | "naskah";
          roleCategory?: "FOTOGRAFER" | "DESAINER" | "PRAHUM";
          size: string;
          thumbnailUrl?: string;
          workLink: string;
        }>;
      }>();

      const formatSize = (bytes: number | bigint | null) => {
        if (!bytes) return "1.2 MB";
        const num = Number(bytes);
        if (num >= 1024 * 1024 * 1024) return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        if (num >= 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
        return `${Math.round(num / 1024)} KB`;
      };

      const getKategori = (title: string) => {
        const lower = (title || "").toLowerCase();
        if (lower.includes("rapat") || lower.includes("sidang") || lower.includes("evaluasi") || lower.includes("koordinasi")) return "PEMERINTAHAN";
        if (lower.includes("ekonomi") || lower.includes("pasar") || lower.includes("umkm") || lower.includes("wisata")) return "EKONOMI";
        if (lower.includes("lingkungan") || lower.includes("taman") || lower.includes("sampah")) return "LINGKUNGAN";
        return "SOSIAL";
      };

      const getRoleCategory = (contentType: string | null) => {
        const type = (contentType || "").toLowerCase();
        if (type.includes("prahum") || type.includes("naskah") || type.includes("berita") || type.includes("artikel")) return "PRAHUM";
        if (type.includes("editor") || type.includes("desain") || type.includes("infografis")) return "DESAINER";
        return "FOTOGRAFER";
      };

      // A. Masukkan berkas dari tabel production_files (hasil kurasi Ahli Pertama)
      for (const row of curatedFiles) {
        if (!folderMap.has(row.activityId)) {
          folderMap.set(row.activityId, {
            id: row.activityId,
            title: row.activityTitle,
            tanggal: row.activityDate ? new Date(row.activityDate).toISOString().split("T")[0] : "2026-09-01",
            petugas: new Set(),
            kategori: getKategori(row.activityTitle),
            strakomNumber: `STRAKOM/${new Date(row.activityDate || new Date()).getFullYear()}`,
            files: [],
          });
        }

        const folder = folderMap.get(row.activityId)!;
        if (row.petugasName) folder.petugas.add(row.petugasName);

        const isVideo =
          (row.mimeType && row.mimeType.startsWith("video")) ||
          row.originalFilename.toLowerCase().endsWith(".mp4") ||
          row.originalFilename.toLowerCase().endsWith(".mov");

        const workLink = row.storagePath;
        const thumbnailUrl = isVideo ? undefined : workLink;

        folder.files.push({
          id: row.fileId,
          name: row.originalFilename,
          jenisKonten: isVideo ? "video" : "foto",
          roleCategory: getRoleCategory(row.contentType),
          size: formatSize(row.fileSize),
          thumbnailUrl,
          workLink,
        });

        if (!folder.thumbnailUrl && thumbnailUrl) {
          folder.thumbnailUrl = thumbnailUrl;
        }
      }

      // B. Masukkan berkas dari penugasan selesai jika belum ada di tabel production_files
      for (const asg of completedAssignments) {
        if (!asg.workLink) continue;

        if (!folderMap.has(asg.activityId)) {
          folderMap.set(asg.activityId, {
            id: asg.activityId,
            title: asg.activityTitle,
            tanggal: asg.activityDate ? new Date(asg.activityDate).toISOString().split("T")[0] : "2026-09-01",
            petugas: new Set(),
            kategori: getKategori(asg.activityTitle),
            strakomNumber: `STRAKOM/${new Date(asg.activityDate || new Date()).getFullYear()}`,
            files: [],
          });
        }

        const folder = folderMap.get(asg.activityId)!;
        if (asg.petugasName) folder.petugas.add(asg.petugasName);

        if (asg.workLink.startsWith('{"type":"MEDIA_SUBMISSION"')) {
          try {
            const parsed = JSON.parse(asg.workLink);
            if (Array.isArray(parsed.files)) {
              for (const f of parsed.files) {
                const alreadyExists = folder.files.some(
                  (existing) => existing.workLink === f.url || existing.name === f.originalName
                );
                if (!alreadyExists) {
                  const isVideo =
                    (f.mimeType && f.mimeType.startsWith("video")) ||
                    f.originalName?.toLowerCase().endsWith(".mp4") ||
                    f.originalName?.toLowerCase().endsWith(".mov");

                  const thumbnailUrl = isVideo ? undefined : f.url;

                  folder.files.push({
                    id: crypto.randomUUID(),
                    name: f.originalName || f.filename || "Berkas Dokumentasi",
                    jenisKonten: isVideo ? "video" : "foto",
                    roleCategory: getRoleCategory(asg.contentType),
                    size: formatSize(f.fileSize),
                    thumbnailUrl,
                    workLink: f.url,
                  });

                  if (!folder.thumbnailUrl && thumbnailUrl) {
                    folder.thumbnailUrl = thumbnailUrl;
                  }
                }
              }
            }
          } catch {}
        } else if (asg.workLink.startsWith("http") || asg.workLink.startsWith("/")) {
          const alreadyExists = folder.files.some((existing) => existing.workLink === asg.workLink);
          if (!alreadyExists) {
            const isVideo =
              (asg.contentType || "").toLowerCase().includes("video") ||
              asg.workLink.toLowerCase().endsWith(".mp4") ||
              asg.workLink.toLowerCase().endsWith(".mov");
            const thumb = isVideo ? undefined : asg.workLink;

            folder.files.push({
              id: asg.assignmentId,
              name: `[${asg.contentType || "Dokumentasi"}] ${asg.activityTitle}`,
              jenisKonten: isVideo ? "video" : "foto",
              roleCategory: getRoleCategory(asg.contentType),
              size: "2.5 MB",
              thumbnailUrl: thumb,
              workLink: asg.workLink,
            });

            if (!folder.thumbnailUrl && thumb) {
              folder.thumbnailUrl = thumb;
            }
          }
        } else {
          // Handle Prahum Naskah (raw text)
          const role = getRoleCategory(asg.contentType);
          if (role === "PRAHUM") {
            const alreadyExists = folder.files.some((existing) => existing.id === asg.assignmentId);
            if (!alreadyExists) {
              folder.files.push({
                id: asg.assignmentId,
                name: `[Naskah Berita] ${asg.activityTitle}`,
                jenisKonten: "naskah",
                roleCategory: "PRAHUM",
                size: "N/A",
                workLink: asg.workLink,
              });
            }
          }
        }
      }

      // Pastikan setiap folder memiliki thumbnailUrl jika memiliki berkas foto
      for (const folder of folderMap.values()) {
        if (!folder.thumbnailUrl && folder.files.length > 0) {
          const firstPhoto = folder.files.find((f) => f.thumbnailUrl || f.jenisKonten === "foto");
          if (firstPhoto) {
            folder.thumbnailUrl = firstPhoto.thumbnailUrl || firstPhoto.workLink;
          }
        }
      }

      // Convert folderMap to Array
      const formatted = Array.from(folderMap.values()).map((f) => ({
        ...f,
        petugas: Array.from(f.petugas).join(", ") || "Tim Dokumentasi",
      }));

      return reply.send({ success: true, data: formatted });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal memuat Bank Konten" });
    }
  }

  // 1. Get My Tasks (for Petugas)
  static async getMyTasks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cookieSession = request.cookies["simikp_session"];
      if (!cookieSession) return reply.status(401).send({ error: "Unauthorized" });

      const session = request.server.jwt.verify(cookieSession) as any;
      const userId = session.id;

      const userTasks = await db
        .select({
          id: assignments.id,
          kegiatan: activities.title,
          lokasi: activities.locationId, // Assuming location name is handled or we just return ID for now
          deadline: assignments.deadline,
          status: assignments.status,
          jenisPekerjaan: contentTypes.name,
          instruksi: assignments.instruction,
        })
        .from(assignments)
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .where(eq(assignments.userId, userId))
        .orderBy(desc(assignments.deadline));

      // Format for frontend
      const formatted = userTasks.map(t => ({
        id: t.id,
        kegiatan: t.kegiatan,
        lokasi: t.lokasi || "Lokasi Default", // Mock location string for MVP
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString("id-ID") : "-",
        status: t.status,
        jenisPekerjaan: t.jenisPekerjaan,
        instruksi: t.instruksi || "Tidak ada instruksi khusus.",
      }));

      return reply.send({ success: true, data: formatted });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengambil data penugasan saya" });
    }
  }

  // 2. Update Status (Anti-Birokrasi)
  static async updateStatus(request: FastifyRequest<{ Params: { assignmentId: string } }>, reply: FastifyReply) {
    try {
      const { assignmentId } = request.params;
      const { status } = updateStatusSchema.parse(request.body);

      await db.update(assignments)
        .set({ status })
        .where(eq(assignments.id, assignmentId));

      return reply.send({ success: true, message: `Status berhasil diubah menjadi ${status}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengubah status" });
    }
  }

  // 3. Submit Work (Google Drive Link)
  static async submitWork(request: FastifyRequest<{ Params: { assignmentId: string } }>, reply: FastifyReply) {
    try {
      const { assignmentId } = request.params;
      const { workLink } = submitWorkSchema.parse(request.body);

      // We need to fetch the assignment to get its title
      const assignmentData = await db
        .select({
          activityTitle: activities.title,
          contentType: contentTypes.name,
          petugasName: users.name,
        })
        .from(assignments)
        .innerJoin(activities, eq(assignments.activityId, activities.id))
        .innerJoin(contentTypes, eq(assignments.contentTypeId, contentTypes.id))
        .leftJoin(users, eq(assignments.userId, users.id))
        .where(eq(assignments.id, assignmentId))
        .limit(1);

      if (assignmentData.length === 0) {
        return reply.status(404).send({ success: false, error: "Penugasan tidak ditemukan" });
      }

      await db.transaction(async (tx) => {
        // 1. Update assignment status to COMPLETED
        await tx.update(assignments)
          .set({ status: "COMPLETED" })
          .where(eq(assignments.id, assignmentId));

        // 2. Find or Create productionItem
        let existingItem = await tx
          .select({ id: productionItems.id })
          .from(productionItems)
          .where(eq(productionItems.assignmentId, assignmentId))
          .limit(1);

        let prodItemId = "";
        
        if (existingItem.length > 0) {
          prodItemId = existingItem[0].id;
        } else {
          prodItemId = crypto.randomUUID();
          await tx.insert(productionItems).values({
            id: prodItemId,
            assignmentId,
            title: `[${assignmentData[0].contentType}] ${assignmentData[0].activityTitle}`,
            status: "COMPLETED",
            productionDate: new Date(),
          });
        }

        // 3. Get next version number
        const versions = await tx
          .select({ versionNumber: productionVersions.versionNumber })
          .from(productionVersions)
          .where(eq(productionVersions.productionItemId, prodItemId))
          .orderBy(desc(productionVersions.versionNumber))
          .limit(1);
          
        const nextVersion = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

        // Reset isCurrent for older versions
        await tx.update(productionVersions)
          .set({ isCurrent: false })
          .where(eq(productionVersions.productionItemId, prodItemId));

        // Insert new version
        const newVersionId = crypto.randomUUID();
        await tx.insert(productionVersions).values({
          id: newVersionId,
          productionItemId: prodItemId,
          versionNumber: nextVersion,
          workLink,
          isCurrent: true,
          createdAt: new Date(),
        });
      });

      // Cari tim Reviewer, Ahli Pertama, Admin, dan Manager untuk dikirimi email hasil liputan baru
      const reviewerUsers = await db
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          or(
            eq(roles.name, "REVIEWER"),
            eq(roles.name, "AHLI_PERTAMA"),
            eq(roles.name, "ADMIN"),
            eq(roles.name, "MANAGER"),
            eq(users.staffType, "AHLI_PERTAMA")
          )
        );

      for (const rev of reviewerUsers) {
        if (rev.email) {
          sendWorkSubmissionAlertEmail({
            to: rev.email,
            reviewerName: rev.name || "Tim Reviewer",
            officerName: assignmentData[0]?.petugasName || "Petugas Lapangan",
            activityTitle: assignmentData[0]?.activityTitle || "Liputan Kegiatan",
            contentType: assignmentData[0]?.contentType || "Konten Media",
            workLink,
          }).catch(err => console.error("[ProductionsController] Gagal kirim email alert ke reviewer:", err));
        }
      }

      return reply.send({ success: true, message: "Pekerjaan berhasil dikirim!" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.issues });
      }
      request.log.error(error);
      return reply.status(500).send({ success: false, error: "Gagal mengirim pekerjaan" });
    }
  }

  static async curateAndApprove(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as {
        assignmentId: string;
        curatedFiles: Array<{
          url: string;
          filename?: string;
          originalName?: string;
          fileSize?: number;
          mimeType?: string;
        }>;
        status?: string;
        notes?: string;
      };

      const { assignmentId, curatedFiles = [], status = "SIAP_TAYANG" } = body;
      if (!assignmentId) {
        return reply.status(400).send({ success: false, error: "assignmentId wajib diisi" });
      }

      // Ambil detail assignment
      const asg = await db
        .select({
          id: assignments.id,
          activityId: assignments.activityId,
          userId: assignments.userId,
          contentTypeId: assignments.contentTypeId,
        })
        .from(assignments)
        .where(eq(assignments.id, assignmentId))
        .limit(1);

      if (!asg.length) {
        return reply.status(404).send({ success: false, error: "Penugasan tidak ditemukan" });
      }

      // Update status assignment
      await db
        .update(assignments)
        .set({ status })
        .where(eq(assignments.id, assignmentId));

      // Cari atau buat production item & version untuk menampung file di bank konten
      let pItem = await db
        .select({ id: productionItems.id })
        .from(productionItems)
        .where(eq(productionItems.assignmentId, assignmentId))
        .limit(1);

      let pItemId = pItem[0]?.id;
      if (!pItemId) {
        pItemId = crypto.randomUUID();
        await db.insert(productionItems).values({
          id: pItemId,
          assignmentId: assignmentId,
          title: `Produksi Aset Liputan`,
          status,
        });
      }

      let pVer = await db
        .select({ id: productionVersions.id })
        .from(productionVersions)
        .where(eq(productionVersions.productionItemId, pItemId))
        .limit(1);

      let pVerId = pVer[0]?.id;
      if (!pVerId) {
        pVerId = crypto.randomUUID();
        await db.insert(productionVersions).values({
          id: pVerId,
          productionItemId: pItemId,
          versionNumber: 1,
          isCurrent: true,
        });
      }

      // Masukkan setiap berkas terkurasi ke productionFiles & archiveAssets
      for (const file of curatedFiles) {
        const fileId = crypto.randomUUID();
        const origName = file.originalName || file.filename || "file_kurasi";
        const ext = origName.includes(".") ? origName.split(".").pop()?.toLowerCase() : "bin";
        const storedName = file.filename || origName;

        // Cek duplikasi agar tidak terjadi error 500 (ER_DUP_ENTRY)
        const existingFile = await db
          .select({ id: productionFiles.id })
          .from(productionFiles)
          .where(eq(productionFiles.storedFilename, storedName))
          .limit(1);
          
        if (existingFile.length > 0) {
          continue; // Lewati jika sudah ada (mungkin di-klik setujui 2 kali)
        }

        const uploaderId = asg[0].userId;
        if (!uploaderId) {
          throw new Error("Penugasan tidak memiliki Petugas pengunggah yang valid.");
        }

        await db.insert(productionFiles).values({
          id: fileId,
          productionVersionId: pVerId,
          originalFilename: origName,
          storedFilename: storedName,
          storagePath: file.url,
          mimeType: file.mimeType || "application/octet-stream",
          fileExtension: ext || "bin",
          fileSize: file.fileSize || 0,
          uploadedBy: uploaderId,
        });

      }

      return reply.send({
        success: true,
        message: `${curatedFiles.length} berkas berhasil dikurasi dan disetujui masuk Bank Konten Utama!`,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Gagal memproses kurasi persetujuan aset: " + (error?.message || "Kesalahan server"),
      });
    }
  }
}
