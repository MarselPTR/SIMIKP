import { db } from "../../db";
import { notifications } from "../../db/schema/system";
import { eq, desc, and, isNull } from "drizzle-orm";
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

export async function markNotificationRead(id: string, userId: string) {
  try {
    const ownedNotification = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);
    if (ownedNotification.length === 0) return false;

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return true;
  } catch (error) {
    console.error("Gagal menandai notifikasi dibaca:", error);
    return false;
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return true;
  } catch (error) {
    console.error("Gagal menandai semua notifikasi dibaca:", error);
    return false;
  }
}
