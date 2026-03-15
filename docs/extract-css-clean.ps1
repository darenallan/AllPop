# CSS Extraction and Cleaning Script for AurumCorp
# Removes global CSS and keeps only page-specific styles

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

function Remove-GlobalCSS {
    param([string[]]$lines)
    
    $result = @()
    $i = 0
    
    while ($i -lt $lines.Count) {
        $line = $lines[$i]
        $trimmed = $line.Trim()
        
        # Skip page title comments
        if ($trimmed -match '/\*.*\.html.*style.*\*/' -or $trimmed -match '/\*\s*content\.html\s*styles\s*\*/') {
            $i++
            continue
        }
        
        # Skip :root blocks
        if ($trimmed -match '^\s*:root\s*\{' -or $trimmed -match '^\s*:root\s*\{') {
            while ($i -lt $lines.Count -and -not ($lines[$i] -match '^\s*}\s*$')) {
                $i++
            }
            if ($i -lt $lines.Count) {
                $i++  # Skip the closing }
            }
            continue
        }
        
        # Skip * reset selector
        if ($trimmed -match '^\s*\*\s*,\s*\*::before' -or $trimmed -match '^\s*\*,\s*\*::before\s*,\s*\*::after') {
            while ($i -lt $lines.Count -and -not ($lines[$i] -match '^\s*}\s*$')) {
                $i++
            }
            if ($i -lt $lines.Count) {
                $i++
            }
            continue
        }
        
        # Skip html selector
        if ($trimmed -match '^\s*html\s*\{' -or $trimmed -match '^\s*html,\s*body') {
            while ($i -lt $lines.Count -and -not ($lines[$i] -match '^\s*}\s*$')) {
                $i++
            }
            if ($i -lt $lines.Count) {
                $i++
            }
            continue
        }
        
        # Skip body selector (alone)
        if ($trimmed -match '^\s*body\s*\{' -and -not ($trimmed -match 'body\.')) {
            while ($i -lt $lines.Count -and -not ($lines[$i] -match '^\s*}\s*$')) {
                $i++
            }
            if ($i -lt $lines.Count) {
                $i++
            }
            continue
        }
        
        # Skip ::selection
        if ($trimmed -match '^\s*::selection') {
            while ($i -lt $lines.Count -and -not ($lines[$i] -match '^\s*}\s*$')) {
                $i++
            }
            if ($i -lt $lines.Count) {
                $i++
            }
            continue
        }
        
        # Skip CURSOR section comment
        if ($trimmed -match '/\*.*CURSOR.*\*/' -or $trimmed -match '/\*.*Ã¢â€"â"€.*CURSOR') {
            $i++
            while ($i -lt $lines.Count -and ($trimmed -match '^\s*/\*' -or $lines[$i].Trim() -match '^#.*cur-' -or $lines[$i].Trim() -match '^body\.cur-')) {
                $i++
                if ($i -lt $lines.Count) {
                    $trimmed = $lines[$i].Trim()
                }
                if ($trimmed -match '\*/$') {
                    break
                }
            }
            continue
        }
        
        # Skip inline cursor rules
        if ($trimmed -match '^#cur-ring|^#cur-dot|^body\.cur-h|^#lg-ring|^#lg-dot|^#bp-ring' -or $trimmed -match '^#.*-ring\{|^#.*-dot\{') {
            while ($i -lt $lines.Count -and -not ($lines[$i] -match '^\s*}\s*$')) {
                $i++
            }
            if ($i -lt $lines.Count) {
                $i++
            }
            continue
        }
        
        # Skip NOISE section
        if ($trimmed -match '/\*.*NOISE.*\*/' -or $trimmed -match '/\*.*noise' -or $trimmed -match '#.*noise\s*\{') {
            while ($i -lt $lines.Count) {
                $i++
                if ($i -lt $lines.Count -and $lines[$i] -match '^\s*}\s*$') {
                    $i++
                    break
                }
            }
            continue
        }
        
        # Skip HEADER section
        if ($trimmed -match '/\*.*HEADER.*\*/' -or $trimmed -match '\.aurum-glass-header\{') {
            while ($i -lt $lines.Count) {
                $i++
                if ($i -lt $lines.Count -and ($lines[$i] -match '^\s*}\s*$' -or $lines[$i].Trim() -match '/\*.*â"€â"€')) {
                    $i++
                    if ($trimmed -match '/\*') {
                        break
                    }
                }
            }
            continue
        }
        
        # Add non-empty lines to result
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            $result += $line
        }
        
        $i++
    }
    
    # Trim empty lines from start and end
    while ($result.Count -gt 0 -and [string]::IsNullOrWhiteSpace($result[0])) {
        $result = $result[1..($result.Count - 1)]
    }
    while ($result.Count -gt 0 -and [string]::IsNullOrWhiteSpace($result[-1])) {
        $result = $result[0..($result.Count - 2)]
    }
    
    return $result
}

$allLines = Get-Content $sourceFile
$successCount = 0

foreach ($extraction in $extractions) {
    $name = $extraction.name
    $start = $extraction.startLine - 1
    $end = $extraction.endLine - 1
    
    $extractedLines = $allLines[$start..$end]
    $cleanedLines = Remove-GlobalCSS $extractedLines
    
    $outputPath = Join-Path $outputDir $name
    $header = "/* $name - Page-specific styles from AurumCorp Design System */"
    
    $finalContent = @($header, "") + $cleanedLines
    
    Set-Content -Path $outputPath -Value $finalContent -Encoding UTF8 -Force
    
    $successCount++
    Write-Host "Created: $name"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Extraction Complete!"
Write-Host "Success: $successCount files created"  
Write-Host "Location: $outputDir"
Write-Host "=========================================="
