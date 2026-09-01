Add-Type -AssemblyName System.IO.Compression.FileSystem
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$docxPath = Join-Path $scriptDir "SIMIKP_Dokumentasi_Proyek_dan_Alur_Sistem_FINAL_dengan_Penugasan_Tim.docx"
if (-not (Test-Path $docxPath)) {
    Write-Error "File dokumen tidak ditemukan di: $docxPath"
    exit 1
}
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
