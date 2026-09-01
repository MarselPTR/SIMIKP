import re

def main():
    file_path = "src/pages/kegiatan/KegiatanPage.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add missing imports
    imports = """import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api-client";"""
    content = re.sub(r'import \{ useState, useMemo \} from "react";', imports, content)

    # Make sure we don't have multiple handleSaves
    # Let's just remove the first handleSave and keep the one using saveMutation
    # Actually, it's safer to just replace everything carefully
    pass

if __name__ == "__main__":
    main()
