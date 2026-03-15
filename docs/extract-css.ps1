# CSS Extraction Script for AurumCorp
# Extracts page-specific CSS from prime.css and creates individual files

$sourceFile = "c:\Users\HP\Desktop\AurumCorp\assets\css\prime.css"
$outputDir = "c:\Users\HP\Desktop\AurumCorp\assets\css\pages"

# Create output directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Define extraction ranges
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

# Read the source file
$allLines = Get-Content $sourceFile

# Function to clean CSS content
function Clean-CSS {
    param([string[]]$lines)
    
    $cleaned = @()
    $skipUntilOut = $false
    $inCursorBlock = $false
    $inNoiseBlock = $false
    $inHeaderBlock = $false
    $inRootBlock = $false
    $inResetBlock = $false
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        
        # Skip :root blocks
        if ($trimmed -match "^:root\s*\{") {
            $inRootBlock = $true
            continue
        }
        if ($inRootBlock) {
            if ($trimmed -match "^\}") {
                $inRootBlock = $false
            }
            continue
        }
        
        # Skip global reset (* css)
        if ($trimmed -match "^\*,\s*\*::before,\s*\*::after|^html\s*\{|^body\s*\{|^::selection") {
            $inResetBlock = $true
        }
        if ($inResetBlock) {
            if ($trimmed -match "^\}") {
                $inResetBlock = $false
            }
            continue
        }
        
        # Skip CURSOR section
        if ($trimmed -match "/\*.*CURSOR.*\*/|#cur-ring|#cur-dot|body\.cur-h") {
            $inCursorBlock = $true
            if ($trimmed -match "\*/") {
                $inCursorBlock = $false
            }
            continue
        }
        if ($inCursorBlock) {
            if ($trimmed -match "\}") {
                # might be end of block
            } elseif ($trimmed -match "^#" -or $trimmed -match "^body\.") {
                continue
            }
        }
        
        # Skip NOISE section
        if ($trimmed -match "/\*.*NOISE.*\*/|#noise|#.*noise") {
            $inNoiseBlock = $true
            if ($trimmed -match "\*/") {
                $inNoiseBlock = $false
            }
            continue
        }
        
        # Skip HEADER section
        if ($trimmed -match "/\*.*HEADER.*\*/|\.aurum-glass-header|\.header-brand-name|\.header-tagline|\.header-link") {
            $inHeaderBlock = $true
            if ($trimmed -match "\*/") {
                $inHeaderBlock = $false
            }
            continue
        }
        
        # Skip empty lines at the beginning
        if ($cleaned.Count -eq 0 -and [string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        
        # Skip page title comments (e.g., "/* A.html style*/")
        if ($trimmed -match "/\*.*\.html.*style.*\*/") {
            continue
        }
        
        # Add line to cleaned output
        $cleaned += $line
    }
    
    # Remove leading/trailing empty lines
    while ($cleaned.Count -gt 0 -and [string]::IsNullOrWhiteSpace($cleaned[0])) {
        $cleaned = $cleaned[1..($cleaned.Count - 1)]
    }
    while ($cleaned.Count -gt 0 -and [string]::IsNullOrWhiteSpace($cleaned[-1])) {
        $cleaned = $cleaned[0..($cleaned.Count - 2)]
    }
    
    return $cleaned
}

# Extract and create files
$successCount = 0
$createdFiles = @()

foreach ($extraction in $extractions) {
    $name = $extraction.name
    $start = $extraction.startLine - 1  # Convert to 0-based index
    $end = $extraction.endLine - 1
    
    # Extract lines
    $extractedLines = $allLines[$start..$end]
    
    # Clean the CSS
    $cleanedLines = Clean-CSS $extractedLines
    
    # Create output file
    $outputPath = Join-Path $outputDir $name
    $content = $cleanedLines -join "`r`n"
    
    # Add header comment
    $header = "/* $name - Page-specific styles from AurumCorp Design System */`r`n`r`n"
    $finalContent = $header + $content
    
    Set-Content -Path $outputPath -Value $finalContent -Encoding UTF8
    
    $successCount++
    $createdFiles += $name
    Write-Host "✓ Created: $name" -ForegroundColor Green
}

Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Extraction Complete!" -ForegroundColor Green
Write-Host "Success: $successCount files created" -ForegroundColor Green
Write-Host "Location: $outputDir" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan

$createdFiles | ForEach-Object { Write-Host "  - $_" }
