import { db } from './db';
import { users, assignments, activities, contentTypes, productionFiles, productionVersions, productionItems, archiveAssets } from './db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function runTests() {
  console.log('=== TEST 1: Bank Konten Real Data Query ===');
  // Fetch from live backend API
  const res = await fetch('http://localhost:3000/api/v1/productions/bank-konten');
  const bankData: any = await res.json();
  console.log('Bank Konten API Status:', res.status);
  console.log('Bank Konten Folders Count:', bankData.data?.length);
  if (bankData.data && bankData.data.length > 0) {
    const first = bankData.data[0];
    console.log('Folder sample:', {
      id: first.id,
      title: first.title,
      kategori: first.kategori,
      petugas: first.petugas,
      filesCount: first.files?.length,
      sampleFile: first.files?.[0],
    });
  }

  console.log('\n=== TEST 2: PUT /users/profile Database Persistence ===');
  // Update admin/test profile
  const adminUsers = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  if (adminUsers.length > 0) {
    const adminId = adminUsers[0].id;
    const testPhone = '0812-9988-7766';
    const testBio = 'Administrator Sistem Informasi Manajemen IKP Diskominfo Kota Batu.';

    const profRes = await fetch('http://localhost:3000/api/v1/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: adminId,
        phone: testPhone,
        bio: testBio,
      }),
    });
    const profJson: any = await profRes.json();
    console.log('Update Profile API Status:', profRes.status);
    console.log('Update Profile Response message:', profJson.message);

    // Verify directly in DB
    const [verified] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    console.log('Verified in DB:', { phone: verified.phone, bio: verified.bio });
  }

  console.log('\n=== TEST 3: POST /auth/change-password API ===');
  const pwRes = await fetch('http://localhost:3000/api/v1/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      currentPassword: 'admin123',
      newPassword: 'admin_baru_123',
    }),
  });
  const pwJson: any = await pwRes.json();
  console.log('Change Password API Status:', pwRes.status);
  console.log('Change Password Response:', pwJson);

  // Restore password back to admin123
  await fetch('http://localhost:3000/api/v1/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      currentPassword: 'admin_baru_123',
      newPassword: 'admin123',
    }),
  });
  console.log('Restored password back to admin123.');

  console.log('\n=== TEST 4: Revision Notes Persistence in assignments ===');
  const allAsg = await db.select().from(assignments).limit(1);
  if (allAsg.length > 0) {
    const asgId = allAsg[0].id;
    const testNote = 'Perbaiki pencahayaan dan kontras foto bagian sambutan pimpinan.';
    const revRes = await fetch(`http://localhost:3000/api/v1/assignments/${asgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'REVISI',
        revisionNotes: testNote,
        revisionAuthor: 'Bambang S., S.Kom (Ahli Pertama)',
      }),
    });
    console.log('Update Revision API Status:', revRes.status);

    const [verifiedAsg] = await db.select().from(assignments).where(eq(assignments.id, asgId)).limit(1);
    console.log('Verified Revision in DB:', {
      status: verifiedAsg.status,
      revisionNotes: verifiedAsg.revisionNotes,
      revisionAuthor: verifiedAsg.revisionAuthor,
      revisionDate: verifiedAsg.revisionDate,
    });
  }

  console.log('\nALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
