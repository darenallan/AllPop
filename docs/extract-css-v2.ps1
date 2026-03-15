# CSS Extraction Script for AurumCorp
# Extracts page-specific CSS from prime.css and creates individual files

$sourceFile = "c:\Users\HP\Desktop\AurumCorp\assets\css\prime.css"
$outputDir = "c:\Users\HP\Desktop\AurumCorp\assets\css\pages"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$extractions = @(
    @{ name = "A.css"; startLine = 284; endLine = 1223 }
    @{ name = "boutique-list.css"; startLine = 1224; endLine = 1273 }
    @{ name = "boutique.css"; startLine = 1274; endLine = 1533 }
    @{ name = "cart.css"; startLine = 1534; endLine = 1598 }
    @{ name = "catalogue.css"; startLine = 2248; endLine = 2447 }
    @{ name = "contact.css"; startLine = 2448; endLine = 2528 }
    @{ name = "delivery.css"; startLine = 2529; endLine = 3023 }
    @{ name = "index.css"; startLine = 3024; endLine = 3344 }
    @{ name = "login.css"; startLine = 3640; endLine = 3717 }
    @{ name = "messages.css"; startLine = 3718; endLine = 4243 }
    @{ name = "privacy.css"; startLine = 4244; endLine = 4322 }
    @{ name = "product.css"; startLine = 4323; endLine = 4599 }
    @{ name = "profile.css"; startLine = 4600; endLine = 5129 }
    @{ name = "register.css"; startLine = 5130; endLine = 5209 }
    @{ name = "seller-application.css"; startLine = 5210; endLine = 5510 }
    @{ name = "seller.css"; startLine = 5511; endLine = 6236 }
    @{ name = "wishlist.css"; startLine = 6237; endLine = 6663 }
)

$allLines = Get-Content $sourceFile
$successCount = 0
$createdFiles = @()

foreach ($extraction in $extractions) {
    $name = $extraction.name
    $start = $extraction.startLine - 1
    $end = $extraction.endLine - 1
    
    $extractedLines = $allLines[$start..$end]
    $outputPath = Join-Path $outputDir $name
    
    $header = "/* $name - Page-specific styles from AurumCorp Design System */"
    $content = @($header) + $extractedLines
    
    Set-Content -Path $outputPath -Value $content -Encoding UTF8 -Force
    
    $successCount++
    $createdFiles += $name
    Write-Host "Created: $name"
}

Write-Host ""
Write-Host "================================================"
Write-Host "Extraction Complete!"
Write-Host "Success: $successCount files created"  
Write-Host "Location: $outputDir"
Write-Host "================================================"
