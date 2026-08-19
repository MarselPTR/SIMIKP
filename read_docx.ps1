Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "c:\Users\ramad\Documents\File Kuliah\File Magang\SIMIKP\SIMIKP_Dokumentasi_Proyek_dan_Alur_Sistem_FINAL_dengan_Penugasan_Tim.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.GetEntry("word/document.xml")
if ($entry) {
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xmlString = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    
    $text = $xmlString -replace '<[^>]+>', ' '
    $text = $text -replace '\s+', ' '
    Write-Output $text
}
$zip.Dispose()
