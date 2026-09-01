import { db } from "../../db";
import { notifications } from "../../db/schema/system";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const id = crypto.randomUUID();
    await db.insert(notifications).values({
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || null,
      createdAt: new Date(),
    });
    return id;
  } catch (error) {
    console.error("Gagal membuat notifikasi:", error);
    return null;
  }
}

export async function getUserNotifications(userId?: string) {
  try {
    const query = db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    if (userId) {
      return await query.where(eq(notifications.userId, userId));
    }
    return await query;
  } catch (error) {
    console.error("Gagal mengambil notifikasi:", error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.id, id));
    return true;
  } catch (error) {
    console.error("Gagal menandai notifikasi dibaca:", error);
    return false;
  }
}

export async function markAllNotificationsRead(userId?: string) {
  try {
    if (userId) {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(eq(notifications.userId, userId));
    } else {
      await db
        .update(notifications)
        .set({ readAt: new Date() });
    }
    return true;
  } catch (error) {
    console.error("Gagal menandai semua notifikasi dibaca:", error);
    return false;
  }
}
