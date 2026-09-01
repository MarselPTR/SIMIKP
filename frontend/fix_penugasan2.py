import re

def main():
    file_path = "src/pages/penugasan/PenugasanPage.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add mutations
    mutations = """
  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id && !payload.id.startsWith("p-")) {
        return apiFetch(`/assignments/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch("/assignments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penugasan"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/assignments/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penugasan"] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (payload: { ids: string[], status: string }) => {
      // Mocking bulk update via loop for now since endpoint might not exist
      await Promise.all(payload.ids.map(id => apiFetch(`/assignments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: payload.status })
      })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["penugasan"] })
  });
  
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiFetch(`/assignments/${id}`, { method: "DELETE" })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["penugasan"] })
  });
"""
    # Insert mutations after the query definitions
    content = content.replace('  // Filters, sorting & selection', mutations + '\n  // Filters, sorting & selection')

    # 2. Fix handleBulkMarkStatus
    handleBulkMarkStatus = """  const handleBulkMarkStatus = (status: MockPenugasan["status"]) => {
    if (selectedIds.length === 0) return;
    
    bulkStatusMutation.mutate({ ids: selectedIds, status });
    setSelectedIds([]);
    addToast(`Berhasil menandai ${selectedIds.length} penugasan sebagai ${status}.`, "success");
  };"""
    content = re.sub(r'  const handleBulkMarkStatus = \(status: MockPenugasan\["status"\]\) => \{.*?\n  \};\n', handleBulkMarkStatus + '\n', content, flags=re.DOTALL)

    # 3. Fix handleBulkDelete
    handleBulkDelete = """  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} penugasan terpilih?`)) {
      bulkDeleteMutation.mutate(selectedIds);
      setSelectedIds([]);
      addToast(`Berhasil menghapus ${selectedIds.length} penugasan.`, "info");
    }
  };"""
    content = re.sub(r'  const handleBulkDelete = \(\) => \{.*?\n  \};\n', handleBulkDelete + '\n', content, flags=re.DOTALL)

    # 4. Fix handleSaveCreate
    handleSaveCreate = """  const handleSaveCreate = () => {
    if (!formData.kegiatanTerkait.trim()) {
      addToast("Mohon isi nama kegiatan terkait", "warning");
      return;
    }

    const isConflict = Boolean(formConflict);
    const finalStatus = isConflict ? "conflict" : formData.status;
    const payload = {
      activityTitle: formData.kegiatanTerkait,
      activityDate: formData.tanggalKegiatan,
      contentType: formData.jenisKonten,
      picName: formData.pic,
      startTime: formData.jamMulai,
      endTime: formData.jamSelesai,
      status: finalStatus,
      location: formData.lokasi,
      notes: formData.catatan,
    };

    saveMutation.mutate(payload);
    setIsCreateOpen(false);
    addToast(
      isConflict
        ? "Penugasan disimpan dengan status bentrok jadwal."
        : "Penugasan baru berhasil dibuat.",
      isConflict ? "warning" : "success"
    );
  };"""
    content = re.sub(r'  // Save Create.*?setIsCreateOpen\(false\);\n.*?\}\);\n  \};\n', '  // Save Create\n' + handleSaveCreate + '\n', content, flags=re.DOTALL)

    # 5. Fix handleSaveEdit
    handleSaveEdit = """  const handleSaveEdit = () => {
    if (!selectedItem) return;
    if (!formData.kegiatanTerkait.trim()) {
      addToast("Mohon isi nama kegiatan terkait", "warning");
      return;
    }

    const isConflict = Boolean(formConflict) && formData.status === "conflict";
    const payload = {
      id: selectedItem.id,
      activityTitle: formData.kegiatanTerkait,
      activityDate: formData.tanggalKegiatan,
      contentType: formData.jenisKonten,
      picName: formData.pic,
      startTime: formData.jamMulai,
      endTime: formData.jamSelesai,
      status: formData.status,
      location: formData.lokasi,
      notes: formData.catatan,
    };

    saveMutation.mutate(payload);
    setIsEditOpen(false);
    addToast("Perubahan penugasan berhasil disimpan.", "success");
  };"""
    content = re.sub(r'  // Save Edit.*?setIsEditOpen\(false\);\n.*?\}\);\n  \};\n', '  // Save Edit\n' + handleSaveEdit + '\n', content, flags=re.DOTALL)

    # 6. Fix handleConfirmDelete
    handleConfirmDelete = """  const handleConfirmDelete = () => {
    if (!selectedItem) return;
    deleteMutation.mutate(selectedItem.id);
    setIsDeleteOpen(false);
    addToast(`Penugasan "${selectedItem.kegiatanTerkait}" telah dihapus.`, "info");
  };"""
    content = re.sub(r'  // Confirm Delete.*?setIsDeleteOpen\(false\);\n.*?\);\n  \};\n', '  // Confirm Delete\n' + handleConfirmDelete + '\n', content, flags=re.DOTALL)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
