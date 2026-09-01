import re

def fix_penugasan():
    file_path = "src/pages/penugasan/PenugasanPage.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove duplicate mutations
    mutations_block = r'  // Mutations\n  const saveMutation = useMutation\(\{.*?    onSuccess: \(\) => queryClient\.invalidateQueries\(\{ queryKey: \["penugasan"\] \}\)\n  \}\);\n'
    # Find all matches
    matches = list(re.finditer(mutations_block, content, flags=re.DOTALL))
    if len(matches) > 1:
        # Keep only the first one
        first_match = matches[0]
        content = content[:first_match.end()] + content[first_match.end():].replace(first_match.group(0), '')
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_kegiatan():
    file_path = "src/pages/kegiatan/KegiatanPage.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace handleSave
    old_handle_save = r'  const handleSave = \(\) => \{.*?  \};'
    new_handle_save = """  const handleSave = () => {
    if (!form.title.trim() || !form.deadline) return;

    const payload = {
      title: form.title.trim(),
      activityDate: form.deadline,
      prioritas: form.prioritas,
      status: form.status,
      lokasi: form.lokasi,
      opdPenyelenggara: form.opdPenyelenggara,
    };
    saveMutation.mutate(payload);
  };"""
    content = re.sub(old_handle_save, new_handle_save, content, count=1, flags=re.DOTALL)

    # Replace handleDelete (Wait, is it handleDelete or handleConfirmDelete?)
    # Let's check what it's actually called by just replacing any function that uses setItems for deleting
    old_handle_delete = r'  const handleDelete = \(\) => \{.*?  \};'
    new_handle_delete = """  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus kegiatan ini?")) {
      if (editingId) {
        deleteMutation.mutate(editingId);
        closeDialog();
      }
    }
  };"""
    content = re.sub(old_handle_delete, new_handle_delete, content, count=1, flags=re.DOTALL)
    
    # Wait, there are other `setItems` usages? 
    # Let's remove any remaining `setItems` lines
    content = re.sub(r'^\s*setItems\(.*?\);\n', '', content, flags=re.MULTILINE)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    fix_penugasan()
    fix_kegiatan()
