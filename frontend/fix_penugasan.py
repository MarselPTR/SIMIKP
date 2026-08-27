import re
import sys

def main():
    file_path = "src/pages/penugasan/PenugasanPage.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace useQuery mockApi with apiFetch and useMutation
    imports = """import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";"""
    content = re.sub(r'import \{ useState, useMemo, useEffect \} from "react";\nimport \{ useQuery \} from "@tanstack/react-query";\nimport \{ useSearchParams, useNavigate \} from "react-router-dom";\nimport \{ mockApi \} from "../../lib/mock-api";', imports, content)

    # Fix hooks and remove items state
    hooks = """  const queryClient = useQueryClient();

  // Query Penugasan Data
  const { data: initialData = [], isLoading, error, refetch } = useQuery({
    queryKey: ["penugasan"],
    queryFn: async () => {
      const res = await apiFetch<{ data: any[] }>("/assignments");
      return res.data.map(item => ({
        ...item,
        kegiatanTerkait: item.activityTitle || item.kegiatanTerkait || "",
        tanggalKegiatan: item.activityDate || item.tanggalKegiatan || "",
        pic: item.picName || item.pic || "",
        jenisKonten: item.contentType || item.jenisKonten || "",
        jamMulai: item.startTime || item.jamMulai || "",
        jamSelesai: item.endTime || item.jamSelesai || "",
        status: item.status === "ASSIGNED" ? "pending" : item.status === "IN_PROGRESS" ? "in-progress" : item.status === "COMPLETED" ? "done" : item.status,
      }));
    },
  });

  // Query Kegiatan Data for real-time synchronization
  const { data: kegiatanList = [] } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: async () => (await apiFetch<{ data: any[] }>("/activities")).data,
  });"""
    content = re.sub(r'  // Query Penugasan Data.*?queryFn: mockApi\.kegiatan\.getAll,\n  \}\);(.*?)(?=  // Filters, sorting & selection)', hooks + r'\n\n', content, flags=re.DOTALL)

    # Now replace items with initialData, but ONLY as variable names (word boundary)
    content = re.sub(r'\bitems\b', 'initialData', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
