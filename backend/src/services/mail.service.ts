import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

interface BaseTemplateOptions {
  badgeTitle: string;
  badgeColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
  title: string;
  subtitle?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Mencari path file aset yang valid baik saat development (tsx) maupun production build (dist)
 */
function resolveAssetPath(fileName: string): string {
  const candidatePaths = [
    path.resolve(__dirname, "../assets", fileName),
    path.resolve(__dirname, "../../src/assets", fileName),
    path.resolve(process.cwd(), "src/assets", fileName),
    path.resolve(process.cwd(), "backend/src/assets", fileName),
    path.resolve(process.cwd(), "../frontend/src/assets", fileName),
    path.resolve(process.cwd(), "frontend/src/assets", fileName),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return candidatePaths[0];
}

/**
 * Mengambil lampiran inline CID untuk logo resmi dan watermark transparan
 */
function getEmailAttachments() {
  const logoPath = resolveAssetPath("Logo_Kota_Batu.png");
  const watermarkPath = resolveAssetPath("Logo_Kota_Batu_watermark.png");

  const attachments: any[] = [];

  if (fs.existsSync(logoPath)) {
    attachments.push({
      filename: "Logo_Kota_Batu.png",
      path: logoPath,
      cid: "logo_kota_batu",
    });
  }

  if (fs.existsSync(watermarkPath)) {
    attachments.push({
      filename: "Logo_Kota_Batu_watermark.png",
      path: watermarkPath,
      cid: "logo_kota_batu_watermark",
    });
  }

  return attachments;
}

/**
 * Membuat transporter Nodemailer berdasarkan konfigurasi environment
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[MailService] SMTP_USER atau SMTP_PASS belum disetel. Pengiriman email dinonaktifkan.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Base HTML Email Layout resmi SIMIKP - Pemerintah Kota Batu
 * Dirancang selaras dengan estetika LoginPage: Navy Gradient, Frosted Glass Card, dan Watermark Transparan
 */
function renderBaseLayout(opts: BaseTemplateOptions): string {
  const badgeColor = opts.badgeColor || "#0f1f5c";
  const badgeBg = opts.badgeBg || "#e0e7ff";
  const badgeBorder = opts.badgeBorder || "rgba(15, 31, 92, 0.15)";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 15px;">
    <tr>
      <td align="center">
        <!-- Container Utama Surat -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 31, 92, 0.12); border: 1px solid #e2e8f0;">
          
          <!-- ── Header Resmi Kop Navy Khas LoginPage ── -->
          <tr>
            <td style="background: linear-gradient(135deg, #071133 0%, #0f1f5c 55%, #17378d 100%); padding: 38px 24px 30px 24px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    
                    <!-- Logo Resmi Kota Batu Langsung Tanpa Bingkai -->
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 12px auto;">
                      <tr>
                        <td align="center">
                          <img src="cid:logo_kota_batu" alt="Logo Pemerintah Kota Batu" width="76" height="76" style="display: block; width: 76px; height: 76px; object-fit: contain; margin: 0 auto;" />
                        </td>
                      </tr>
                    </table>

                    <!-- Teks Pemerintah Kota Batu Langsung Tanpa Bingkai / Pill -->
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #93c5fd;">
                      PEMERINTAH KOTA BATU
                    </p>

                    <!-- Judul Aplikasi -->
                    <h1 style="margin: 4px 0 0 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1px;">
                      SIMIKP
                    </h1>

                    <p style="margin: 3px 0 0 0; font-size: 11px; font-weight: 700; color: #93c5fd; letter-spacing: 2px; text-transform: uppercase;">
                      Diskominfo Kota Batu
                    </p>

                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1; font-weight: 300;">
                      Sistem Informasi Manajemen Integrasi Komunikasi Publik
                    </p>

                    <!-- Garis Aksen Emas -->
                    <div style="margin: 16px auto 0 auto; width: 44px; height: 3px; background-color: #f59e0b; border-radius: 2px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Konten Surat dengan Watermark Transparan Besar & Rapi di Latar Belakang ── -->
          <tr>
            <td background="cid:logo_kota_batu_watermark" style="background-image: url('cid:logo_kota_batu_watermark'); background-repeat: no-repeat; background-position: center 40%; background-size: 380px auto; padding: 36px 30px 32px 30px; background-color: #ffffff;">

              <!-- Konten Teks di Atas Watermark -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Badge Tag -->
                    <div style="margin-bottom: 16px;">
                      <span style="display: inline-block; padding: 5px 14px; font-size: 11px; font-weight: 700; color: ${badgeColor}; background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;">
                        ${opts.badgeTitle}
                      </span>
                    </div>

                    <!-- Judul Pesan -->
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #0f1f5c; line-height: 1.4;">
                      ${opts.title}
                    </h2>
                    ${opts.subtitle ? `<p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${opts.subtitle}</p>` : `<div style="margin-bottom: 20px;"></div>`}

                    <!-- Isi Konten Spesifik -->
                    ${opts.contentHtml}

                    <!-- Tombol CTA -->
                    ${opts.ctaText && opts.ctaUrl ? `
                    <div style="margin-top: 32px; text-align: center;">
                      <a href="${opts.ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 34px; font-size: 14px; font-weight: 700; color: #ffffff; background: linear-gradient(135deg, #0f1f5c 0%, #173282 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 6px 16px rgba(15, 31, 92, 0.28); letter-spacing: 0.3px;">
                        ${opts.ctaText} &rarr;
                      </a>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer Resmi Balai Kota Among Tani ── -->
          <tr>
            <td style="background-color: #f8fafc; padding: 26px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155;">
                      Dinas Komunikasi dan Informatika Pemerintah Kota Batu
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                      Balaikota Among Tani, Gedung B Lt. 3<br>
                      Jl. Panglima Sudirman No. 507, Kota Batu, Jawa Timur 65313
                    </p>
                    <div style="width: 30px; height: 1px; background-color: #e2e8f0; margin: 0 auto 10px auto;"></div>
                    <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.4;">
                      Email ini dibuat otomatis oleh sistem SIMIKP Pemerintah Kota Batu.<br>
                      Mohon untuk tidak membalas email ini secara langsung.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Parameter data untuk email notifikasi penugasan baru
 */
export interface AssignmentEmailData {
  to: string;
  officerName: string;
  activityTitle: string;
  activityDate: string;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  opdName?: string;
  contentType?: string;
  instruction?: string;
  assignmentId?: string;
  targetUrl?: string;
}

/**
 * Mengirim email notifikasi penugasan baru kepada staf/petugas
 */
export async function sendAssignmentNotificationEmail(data: AssignmentEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const formattedDate = data.activityDate ? new Date(data.activityDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : "-";

  const jamStr = data.startTime && data.endTime 
    ? `${data.startTime.slice(0, 5)} - ${data.endTime.slice(0, 5)} WIB`
    : data.startTime ? `${data.startTime.slice(0, 5)} WIB` : "Menyesuaikan";

  const isSelfClaim = data.instruction && data.instruction.includes("Agenda Tersedia");
  const isPrahum = data.contentType && (data.contentType.toLowerCase().includes("naskah") || data.contentType.toLowerCase().includes("prahum"));

  const introText = isSelfClaim
    ? `Halo <strong>${data.officerName}</strong>, berikut adalah rincian penugasan yang berhasil Anda ambil secara mandiri melalui menu <strong>Agenda Tersedia</strong>:`
    : `Halo <strong>${data.officerName}</strong>, Anda telah ditugaskan oleh Admin / Pimpinan untuk melaksanakan liputan dan produksi konten pada agenda kegiatan berikut:`;

  const closingText = isPrahum
    ? `Harap hadir tepat waktu dan menyimak jalannya agenda. Anda dapat langsung mengetik dan mengirimkan naskah rilis berita melalui menu <strong>Penugasan Saya</strong> di aplikasi SIMIKP setelah kegiatan selesai.`
    : `Harap hadir tepat waktu dan mempersiapkan peralatan liputan yang diperlukan. Anda dapat mengunggah hasil liputan ke Bank Konten / menyematkan tautan drive melalui aplikasi SIMIKP setelah kegiatan selesai.`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      ${introText}
    </p>

    <!-- Kartu Rincian Agenda -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 38%; vertical-align: top;">Nama Agenda:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f1f5c; vertical-align: top;">${data.activityTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Penyelenggara (OPD):</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; vertical-align: top;">${data.opdName || "Dinas Komunikasi dan Informatika"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Tanggal Pelaksanaan:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; vertical-align: top;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Waktu / Jam:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; vertical-align: top;">${jamStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Lokasi Pelaksanaan:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; vertical-align: top;">${data.locationName || "Sesuai Undangan / Balai Kota"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Output yang Ditugaskan:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2563eb; vertical-align: top;">${data.contentType || "Liputan Dokumentasi"}</td>
            </tr>
            ${data.instruction ? `
            <tr>
              <td style="padding: 10px 0 0 0; font-size: 13px; color: #64748b; vertical-align: top; border-top: 1px dashed #cbd5e1;">Instruksi Khusus:</td>
              <td style="padding: 10px 0 0 0; font-size: 13px; color: #334155; font-style: italic; vertical-align: top; border-top: 1px dashed #cbd5e1;">&ldquo;${data.instruction}&rdquo;</td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      ${closingText}
    </p>
  `;

  const defaultPath = `/petugas/penugasan`;
  const ctaUrl = data.targetUrl || `${appUrl}${defaultPath}`;

  const html = renderBaseLayout({
    badgeTitle: isSelfClaim ? "Klaim Tugas Mandiri" : "Penugasan Liputan",
    badgeColor: "#1d4ed8",
    badgeBg: "#dbeafe",
    badgeBorder: "#bfdbfe",
    title: isSelfClaim ? "Konfirmasi Pengambilan Tugas" : "Penugasan Liputan Baru",
    subtitle: `Agenda: ${data.activityTitle}`,
    contentHtml,
    ctaText: "Buka Penugasan Saya",
    ctaUrl,
  });

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    const plainText = `[SIMIKP] Penugasan Baru: ${data.activityTitle}\n\nHalo ${data.officerName},\n\nAnda ditugaskan pada agenda "${data.activityTitle}".\nTanggal: ${formattedDate}\nJam: ${jamStr}\nLokasi: ${data.locationName || "-"}\nOutput: ${data.contentType || "Liputan"}\nInstruksi: ${data.instruction || "-"}\n\nBuka detail penugasan di:\n${ctaUrl}\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu`;

    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: `[SIMIKP] Penugasan Baru: ${data.activityTitle}`,
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email penugasan berhasil dikirim ke: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email penugasan ke ${data.to}:`, error);
    return false;
  }
}

/**
 * Parameter data untuk email reset/lupa kata sandi
 */
export interface ResetPasswordEmailData {
  to: string;
  userName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

/**
 * Mengirim email permintaan reset / lupa kata sandi
 */
export async function sendResetPasswordEmail(data: ResetPasswordEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const expiryText = data.expiresInMinutes || 30;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Halo <strong>${data.userName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Kami menerima permintaan untuk mengatur ulang kata sandi akun SIMIKP Anda. Silakan klik tombol di bawah ini untuk membuat kata sandi baru Anda:
    </p>

    <!-- Kartu Peringatan Keamanan -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin: 20px 0;">
      <tr>
        <td style="padding: 14px 16px;">
          <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
            <strong>Perhatian Keamanan:</strong> Tautan ini bersifat rahasia dan hanya berlaku selama <strong>${expiryText} menit</strong>. Jangan bagikan tautan ini kepada siapa pun demi keamanan akun Anda.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      Jika Anda tidak pernah meminta perubahan kata sandi ini, silakan abaikan email ini dengan aman. Akun dan kata sandi Anda tetap terlindungi.
    </p>
  `;

  const html = renderBaseLayout({
    badgeTitle: "Reset Kata Sandi",
    badgeColor: "#b45309",
    badgeBg: "#fef3c7",
    badgeBorder: "#fde68a",
    title: "Permintaan Atur Ulang Kata Sandi",
    subtitle: "Amankan kembali akses ke akun SIMIKP Anda",
    contentHtml,
    ctaText: "Atur Ulang Kata Sandi Akun",
    ctaUrl: data.resetUrl,
  });

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    const plainText = `[SIMIKP] Permintaan Atur Ulang Kata Sandi Akun\n\nHalo ${data.userName},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun SIMIKP Anda. Silakan buka tautan berikut untuk membuat kata sandi baru:\n${data.resetUrl}\n\nTautan ini berlaku selama ${expiryText} menit. Jika Anda tidak meminta reset sandi, abaikan email ini.\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu\nBalaikota Among Tani, Jl. Panglima Sudirman No. 507, Kota Batu`;

    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: "[SIMIKP] Permintaan Atur Ulang Kata Sandi Akun",
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email reset password berhasil dikirim ke: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email reset password ke ${data.to}:`, error);
    return false;
  }
}

// ── 1. Notifikasi Catatan Revisi Konten (Fitur A) ──
export interface ReviewRevisionEmailData {
  to: string;
  authorName: string;
  activityTitle: string;
  contentType: string;
  reviewerName: string;
  feedback: string;
  revisionUrl?: string;
}

export async function sendReviewRevisionEmail(data: ReviewRevisionEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const revisionUrl = data.revisionUrl || `${appUrl}/petugas/penugasan`;

  const isPrahum = data.contentType && (data.contentType.toLowerCase().includes("naskah") || data.contentType.toLowerCase().includes("prahum"));
  const workDesc = isPrahum ? "Hasil naskah rilis berita Anda" : "Hasil karya liputan Anda";
  const actionDesc = isPrahum 
    ? "Silakan buka menu Penugasan Saya, perbaiki naskah sesuai catatan di atas, lalu kirimkan kembali pembaruan naskah melalui tombol di bawah ini." 
    : "Silakan perbaiki berkas liputan Anda dan kirimkan kembali pembaruan melalui tombol di bawah ini agar dapat segera diproses untuk penayangan.";

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Halo <strong>${data.authorName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      ${workDesc} untuk agenda <strong>${data.activityTitle}</strong> (${data.contentType}) telah ditinjau oleh <strong>${data.reviewerName}</strong> dan memerlukan perbaikan.
    </p>

    <!-- Kartu Catatan Revisi -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 10px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 20px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.5px;">
            Catatan Revisi dari ${data.reviewerName}:
          </p>
          <p style="margin: 0; font-size: 13px; color: #881337; font-style: italic; line-height: 1.6;">
            &ldquo;${data.feedback || "Mohon periksa kembali kesesuaian materi liputan sebelum dipublikasikan."}&rdquo;
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      ${actionDesc}
    </p>
  `;

  const html = renderBaseLayout({
    badgeTitle: "Perlu Revisi",
    badgeColor: "#be123c",
    badgeBg: "#ffe4e6",
    badgeBorder: "#fecdd3",
    title: isPrahum ? "Catatan Revisi Naskah Berita" : "Catatan Revisi Hasil Liputan",
    subtitle: `Agenda: ${data.activityTitle}`,
    contentHtml,
    ctaText: isPrahum ? "Perbaiki Naskah Sekarang" : "Perbaiki Karya Sekarang",
    ctaUrl: revisionUrl,
  });

  const plainText = `[SIMIKP] Catatan Revisi Hasil Liputan\n\nHalo ${data.authorName},\n\nKarya liputan Anda pada agenda "${data.activityTitle}" (${data.contentType}) memerlukan perbaikan dari Reviewer (${data.reviewerName}).\n\nCatatan Perbaikan:\n"${data.feedback}"\n\nSilakan perbaiki dan unggah kembali hasil kerja Anda di tautan berikut:\n${revisionUrl}\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu`;

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: `[SIMIKP] Catatan Revisi: ${data.activityTitle}`,
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email revisi berhasil dikirim ke: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email revisi ke ${data.to}:`, error);
    return false;
  }
}

// ── 2. Email Selamat Datang & Kredensial Akun Baru (Fitur B) ──
export interface WelcomeNewUserEmailData {
  to: string;
  name: string;
  username: string;
  temporaryPassword?: string;
  roleName?: string;
  loginUrl?: string;
}

export async function sendWelcomeNewUserEmail(data: WelcomeNewUserEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const loginUrl = data.loginUrl || `${appUrl}/login`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Halo <strong>${data.name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Selamat bergabung di tim komunikasi publik Pemerintah Kota Batu! Akun Anda pada sistem <strong>SIMIKP</strong> (Sistem Informasi Manajemen Integrasi Komunikasi Publik) telah berhasil dibuat oleh Admin.
    </p>

    <!-- Kartu Kredensial Akun -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 40%; vertical-align: top;">Nama Pegawai:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f1f5c; vertical-align: top;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Username:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #1e293b; font-family: monospace; vertical-align: top;">${data.username}</td>
            </tr>
            ${data.temporaryPassword ? `
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Kata Sandi Awal:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #d97706; font-family: monospace; vertical-align: top;">${data.temporaryPassword}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Peran Sistem:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #2563eb; vertical-align: top;">${data.roleName || "Petugas Lapangan"}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
        <strong>Saran Keamanan:</strong> Demi keamanan akun Anda, silakan segera perbarui kata sandi Anda melalui menu Profil setelah pertama kali masuk.
      </p>
    </div>
  `;

  const html = renderBaseLayout({
    badgeTitle: "Selamat Datang",
    badgeColor: "#047857",
    badgeBg: "#d1fae5",
    badgeBorder: "#a7f3d0",
    title: "Akun SIMIKP Anda Telah Aktif",
    subtitle: "Dinas Komunikasi dan Informatika Pemerintah Kota Batu",
    contentHtml,
    ctaText: "Masuk ke Akun SIMIKP",
    ctaUrl: loginUrl,
  });

  const plainText = `[SIMIKP] Selamat Datang di SIMIKP Pemerintah Kota Batu\n\nHalo ${data.name},\n\nAkun Anda pada sistem SIMIKP telah berhasil dibuat.\n\nKredensial Akun:\nUsername: ${data.username}\nKata Sandi: ${data.temporaryPassword || "(Sesuai yang didaftarkan Admin)"}\nPeran: ${data.roleName || "Petugas Lapangan"}\n\nSilakan masuk melalui tautan berikut:\n${loginUrl}\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu`;

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: "[SIMIKP] Selamat Datang di SIMIKP - Kredensial Akun Anda",
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email welcome berhasil dikirim ke: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email welcome ke ${data.to}:`, error);
    return false;
  }
}

// ── 3. Pemberitahuan Perubahan Jadwal Kegiatan (Fitur C) ──
export interface AssignmentScheduleChangeEmailData {
  to: string;
  officerName: string;
  activityTitle: string;
  activityDate: string;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  notes?: string;
  targetUrl?: string;
}

export async function sendAssignmentScheduleChangeEmail(data: AssignmentScheduleChangeEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const targetUrl = data.targetUrl || `${appUrl}/petugas/penugasan`;

  const formattedDate = data.activityDate ? new Date(data.activityDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : "-";

  const jamStr = data.startTime && data.endTime 
    ? `${data.startTime.slice(0, 5)} - ${data.endTime.slice(0, 5)} WIB`
    : data.startTime ? `${data.startTime.slice(0, 5)} WIB` : "Menyesuaikan";

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Halo <strong>${data.officerName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Terdapat <strong>perubahan jadwal / rincian penugasan</strong> pada agenda kegiatan yang ditugaskan kepada Anda. Mohon perhatikan jadwal terbaru berikut:
    </p>

    <!-- Kartu Jadwal Baru -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fefce8; border: 1px solid #fef08a; border-left: 4px solid #eab308; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #713f12; width: 38%; vertical-align: top;">Nama Agenda:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f1f5c; vertical-align: top;">${data.activityTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #713f12; vertical-align: top;">Tanggal Baru:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #1e293b; vertical-align: top;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #713f12; vertical-align: top;">Waktu / Jam Baru:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #d97706; vertical-align: top;">${jamStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #713f12; vertical-align: top;">Lokasi Pelaksanaan:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; vertical-align: top;">${data.locationName || "Sesuai Arahan Pimpinan"}</td>
            </tr>
            ${data.notes ? `
            <tr>
              <td style="padding: 10px 0 0 0; font-size: 13px; color: #713f12; vertical-align: top; border-top: 1px dashed #fde047;">Catatan Perubahan:</td>
              <td style="padding: 10px 0 0 0; font-size: 13px; color: #854d0e; font-style: italic; vertical-align: top; border-top: 1px dashed #fde047;">&ldquo;${data.notes}&rdquo;</td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      Harap menyesuaikan waktu keberangkatan dan koordinasi tim liputan Anda sesuai dengan jadwal pembaruan ini.
    </p>
  `;

  const html = renderBaseLayout({
    badgeTitle: "Perubahan Jadwal",
    badgeColor: "#a16207",
    badgeBg: "#fef9c3",
    badgeBorder: "#fde047",
    title: "Pemberitahuan Perubahan Jadwal Liputan",
    subtitle: `Agenda: ${data.activityTitle}`,
    contentHtml,
    ctaText: "Lihat Jadwal Terkini",
    ctaUrl: targetUrl,
  });

  const plainText = `[SIMIKP] Perubahan Jadwal Penugasan\n\nHalo ${data.officerName},\n\nTerdapat perubahan jadwal pada agenda "${data.activityTitle}".\n\nJadwal Terbaru:\nTanggal: ${formattedDate}\nJam: ${jamStr}\nLokasi: ${data.locationName || "-"}\n\nLihat detail penugasan terkini di:\n${targetUrl}\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu`;

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: `[SIMIKP] Perubahan Jadwal: ${data.activityTitle}`,
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email perubahan jadwal berhasil dikirim ke: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email perubahan jadwal ke ${data.to}:`, error);
    return false;
  }
}

// ── 3b. Pemberitahuan Pembatalan Tugas ──
export interface AssignmentCancelledEmailData {
  to: string;
  officerName: string;
  activityTitle: string;
  reason?: string;
}

export async function sendAssignmentCancelledEmail(data: AssignmentCancelledEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Halo <strong>${data.officerName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Penugasan liputan Anda pada agenda kegiatan <strong>${data.activityTitle}</strong> telah <strong>dibatalkan</strong> oleh Admin / Penyelenggara.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #64748b; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
        ${data.reason ? `Alasan pembatalan: <em>&ldquo;${data.reason}&rdquo;</em>` : "Kegiatan dibatalkan atau dialihkan sesuai arahan protokoler pimpinan."}
      </p>
    </div>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      Anda tidak perlu hadir untuk meliput agenda tersebut. Jadwal tugas Anda yang lain dapat dilihat melalui aplikasi SIMIKP.
    </p>
  `;

  const html = renderBaseLayout({
    badgeTitle: "Penugasan Dibatalkan",
    badgeColor: "#475569",
    badgeBg: "#f1f5f9",
    badgeBorder: "#e2e8f0",
    title: "Pembatalan Penugasan Liputan",
    subtitle: `Agenda: ${data.activityTitle}`,
    contentHtml,
  });

  const plainText = `[SIMIKP] Pembatalan Penugasan Liputan\n\nHalo ${data.officerName},\n\nPenugasan liputan Anda pada agenda "${data.activityTitle}" telah dibatalkan.\n\n${data.reason ? `Alasan: ${data.reason}` : "Kegiatan dibatalkan atau dialihkan."}\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu`;

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: `[SIMIKP] Pembatalan Tugas: ${data.activityTitle}`,
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email pembatalan tugas berhasil dikirim ke: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email pembatalan ke ${data.to}:`, error);
    return false;
  }
}

// ── 4. Notifikasi ke Reviewer: Hasil Liputan Siap Direview (Fitur D) ──
export interface WorkSubmissionAlertEmailData {
  to: string;
  reviewerName: string;
  officerName: string;
  activityTitle: string;
  contentType: string;
  workLink?: string;
  reviewUrl?: string;
}

export async function sendWorkSubmissionAlertEmail(data: WorkSubmissionAlertEmailData): Promise<boolean> {
  const transporter = getMailTransporter();
  if (!transporter) return false;

  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const reviewUrl = data.reviewUrl || `${appUrl}/review`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Halo <strong>${data.reviewerName}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
      Petugas lapangan <strong>${data.officerName}</strong> telah menyelesaikan liputan dan mengunggah draf karya untuk agenda berikut:
    </p>

    <!-- Kartu Rincian Penyerahan -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 18px 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 38%; vertical-align: top;">Nama Agenda:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f1f5c; vertical-align: top;">${data.activityTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Petugas Liputan:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b; vertical-align: top;">${data.officerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Jenis Konten:</td>
              <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2563eb; vertical-align: top;">${data.contentType}</td>
            </tr>
            ${data.workLink ? `
            <tr>
              <td style="padding: 10px 0 0 0; font-size: 13px; color: #64748b; vertical-align: top; border-top: 1px dashed #cbd5e1;">
                ${(data.workLink.startsWith('http://') || data.workLink.startsWith('https://')) ? 'Tautan Hasil Kerja:' : 'Pratinjau Naskah Rilis:'}
              </td>
              <td style="padding: 10px 0 0 0; font-size: 13px; vertical-align: top; border-top: 1px dashed #cbd5e1;">
                ${(data.workLink.startsWith('http://') || data.workLink.startsWith('https://'))
                  ? `<a href="${data.workLink}" target="_blank" style="display: inline-block; padding: 6px 14px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #2563eb; text-decoration: none; font-weight: 600; font-size: 12px;">Buka Berkas Liputan &rarr;</a>`
                  : `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #2563eb; border-radius: 6px; padding: 12px; font-size: 12px; line-height: 1.6; color: #1e293b; max-height: 160px; overflow-y: auto; white-space: pre-wrap;">${data.workLink.length > 300 ? data.workLink.slice(0, 300) + '...' : data.workLink}</div>`
                }
              </td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
      Mohon tinjau karya tersebut di modul Review untuk membaca naskah penuh atau memberikan persetujuan tayang (*Approve*) serta catatan revisi.
    </p>
  `;

  const html = renderBaseLayout({
    badgeTitle: "Draf Siap Direview",
    badgeColor: "#1d4ed8",
    badgeBg: "#dbeafe",
    badgeBorder: "#bfdbfe",
    title: "Hasil Liputan Baru Masuk",
    subtitle: `Agenda: ${data.activityTitle}`,
    contentHtml,
    ctaText: "Tinjau Karya di SIMIKP",
    ctaUrl: reviewUrl,
  });

  const previewText = data.workLink
    ? (data.workLink.startsWith('http') ? `Tautan: ${data.workLink}` : `Kutipan Naskah:\n"${data.workLink.slice(0, 200)}..."`)
    : '';

  const plainText = `[SIMIKP] Hasil Liputan Baru Masuk\n\nHalo ${data.reviewerName},\n\nPetugas ${data.officerName} telah mengunggah draf karya liputan untuk agenda "${data.activityTitle}" (${data.contentType}).\n\n${previewText}\n\nSilakan tinjau karya tersebut di tautan berikut:\n${reviewUrl}\n\nDinas Komunikasi dan Informatika Pemerintah Kota Batu`;

  try {
    const fromAddress = process.env.SMTP_FROM || `SIMIKP Pemkot Batu <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: data.to,
      subject: `[SIMIKP] Draf Masuk: ${data.activityTitle} (${data.contentType})`,
      text: plainText,
      html,
      attachments: getEmailAttachments(),
    });
    console.log(`[MailService] ✓ Email hasil liputan berhasil dikirim ke reviewer: ${data.to}`);
    return true;
  } catch (error) {
    console.error(`[MailService] ✗ Gagal mengirim email hasil liputan ke ${data.to}:`, error);
    return false;
  }
}
