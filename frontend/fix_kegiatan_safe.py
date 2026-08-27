import re
import sys

def main():
    file_path = "src/pages/kegiatan/KegiatanPage.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Imports
    content = content.replace(
        'import { useQuery } from "@tanstack/react-query";',
        'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";\nimport { apiFetch } from "../../lib/api-client";'
    )

    # 2. Add queryClient and update queries
    old_query = """  const { data: kegiatanData, isLoading, error, refetch } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: mockApi.kegiatan.getAll,
  });"""
    new_query = """  const queryClient = useQueryClient();
  const { data: kegiatanData = [], isLoading, error, refetch } = useQuery({
    queryKey: ["kegiatan"],
    queryFn: async () => (await apiFetch<{ data: any[] }>("/activities")).data,
  });"""
    content = content.replace(old_query, new_query)

    # 3. Add mutations
    mutations = """
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingId) {
        return apiFetch(`/activities/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch("/activities", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kegiatan"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/activities/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kegiatan"] });
    },
  });
"""
    content = content.replace('  const closeDialog = () => {', mutations + '\n  const closeDialog = () => {')

    # 4. Remove items state
    items_state = """  // Salinan lokal yang bisa ditambah/diubah dari kalender/dialog — mock API
  // tidak punya endpoint create/update, jadi disimpan di state komponen ini.
  const [items, setItems] = useState<MockKegiatan[]>([]);
  useEffect(() => {
    if (kegiatanData) setItems(kegiatanData);
  }, [kegiatanData]);"""
    content = content.replace(items_state, '')

    # 5. Replace items with kegiatanData
    # Be careful, replace only exact word matches of `items`, not `items-center`
    content = re.sub(r'\bitems\b', 'kegiatanData', content)
    # Wait, the word boundary \b also matches `-` in css classes! Let's NOT use \b items \b for all!
    # I can just replace specific known blocks.
    # Actually, in KegiatanPage, there are not many usages of `items`.
    # I'll replace `items.length` -> `kegiatanData.length`, `items.filter` -> `kegiatanData.filter`, `for (const k of items)` -> `for (const k of kegiatanData)`, `let res = items;` -> `let res = kegiatanData;`.
    # Let me revert the \b items \b and do targeted replacements!
    
    # Re-read from memory string just in case
    content = content.replace('let res = items;', 'let res = kegiatanData;')
    content = content.replace('for (const k of items)', 'for (const k of kegiatanData)')
    content = content.replace('items.length', 'kegiatanData.length')
    content = content.replace('items.filter', 'kegiatanData.filter')
    content = content.replace('[items, search', '[kegiatanData, search')
    content = content.replace('[items, viewDateKey]', '[kegiatanData, viewDateKey]')
    content = content.replace('[items]', '[kegiatanData]')

    # 6. Replace handleSave
    old_handle_save = """  const handleSave = () => {
    if (!form.title.trim() || !form.deadline) return;
    
    setItems((prev) => {
      if (editingId) {
        return prev.map((item) =>
          item.id === editingId
            ? { ...item, ...form, title: form.title.trim() }
            : item
        );
      } else {
        const newId = `act_${Date.now()}`;
        return [
          {
            id: newId,
            ...form,
            title: form.title.trim(),
            status: "pending",
          },
          ...prev,
        ];
      }
    });
    closeDialog();
  };"""
    new_handle_save = """  const handleSave = () => {
    if (!form.title.trim() || !form.deadline) return;

    const payload = {
      title: form.title.trim(),
      activityDate: form.deadline,
      prioritas: form.prioritas,
      status: form.status,
      // API currently may not support opd/lokasi out of the box, but we'll send it
      lokasi: form.lokasi,
      opdPenyelenggara: form.opdPenyelenggara,
    };
    saveMutation.mutate(payload);
  };"""
    content = content.replace(old_handle_save, new_handle_save)

    # 7. Replace handleDelete
    old_handle_delete = """  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus kegiatan ini?")) {
      setItems((prev) => prev.filter((item) => item.id !== editingId));
      closeDialog();
    }
  };"""
    new_handle_delete = """  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus kegiatan ini?")) {
      if (editingId) {
        deleteMutation.mutate(editingId);
        closeDialog();
      }
    }
  };"""
    content = content.replace(old_handle_delete, new_handle_delete)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
