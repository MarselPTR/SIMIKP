import { apiFetch } from "./src/lib/api-client";

async function run() {
  try {
    const formData = new FormData();
    formData.append("program", "PRAHUM");
    formData.append("name", "Test User");
    formData.append("username", "test@user.com");
    formData.append("email", "test@user.com");
    formData.append("password", "123456");
    formData.append("gender", "Laki - Laki");
    formData.append("nik", "123456789");
    formData.append("birthPlace", "Jakarta");
    formData.append("birthDate", "2000-01-01");

    const res = await fetch("http://localhost:8080/api/v1/users/petugas", {
      method: "POST",
      body: formData,
    });
    
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error(err);
  }
}

run();
