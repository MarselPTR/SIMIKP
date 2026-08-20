import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

async function checkDB() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing");
    return;
  }
  
  try {
    const connection = await mysql.createConnection(url);
    
    // Check tables
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("=== TABLES IN DB ===");
    console.log(tables.map((t: any) => Object.values(t)[0]).join(", "));
    
    // Check activities structure
    console.log("\n=== STRUCTURE OF activities ===");
    const [activitiesDesc] = await connection.execute("DESCRIBE activities");
    console.log(activitiesDesc.map((c: any) => `${c.Field} (${c.Type}) - Key: ${c.Key}`).join("\n"));

    // Check assignments structure
    console.log("\n=== STRUCTURE OF assignments ===");
    const [assignmentsDesc] = await connection.execute("DESCRIBE assignments");
    console.log(assignmentsDesc.map((c: any) => `${c.Field} (${c.Type}) - Key: ${c.Key}`).join("\n"));
    
    // Check production_versions structure
    console.log("\n=== STRUCTURE OF production_versions ===");
    const [prodVerDesc] = await connection.execute("DESCRIBE production_versions");
    console.log(prodVerDesc.map((c: any) => `${c.Field} (${c.Type}) - Key: ${c.Key}`).join("\n"));

    await connection.end();
  } catch (error) {
    console.error("DB Check failed:", error);
  }
}

checkDB();
