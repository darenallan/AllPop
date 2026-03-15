# PowerShell script to update CSS links in all 20 HTML files

$ErrorActionPreference = 'Continue'

$htmlFiles = @(
    "404.html", "A.html", "about.html", "boutique-list.html", "boutique.html",
    "cart.html", "catalogue.html", "contact.html", "delivery.html", "index.html",
    "login.html", "messages.html", "privacy.html", "product.html", "profile.html",
    "register.html", "seller-application.html", "seller-onboarding.html", "seller.html", "wishlist.html"
)

$cssMapping = @{
    "404.html" = "404"
    "A.html" = "A"
    "about.html" = "about"
    "boutique-list.html" = "boutique-list"
    "boutique.html" = "boutique"
    "cart.html" = "cart"
    "catalogue.html" = "catalogue"
    "contact.html" = "contact"
    "delivery.html" = "delivery"
    "index.html" = "index"
    "login.html" = "login"
    "messages.html" = "messages"
    "privacy.html" = "privacy"
    "product.html" = "product"
    "profile.html" = "profile"
    "register.html" = "register"
    "seller-application.html" = "seller-application"
    "seller-onboarding.html" = "seller-onboarding"
    "seller.html" = "seller"
    "wishlist.html" = "wishlist"
}

$updated = 0
$errors = @()

foreach ($file in $htmlFiles) {
    $filePath = Get-Item -Path $file -ErrorAction SilentlyContinue
    if (-not $filePath) {
        $errors += "$file - File not found"
        continue
    }
    
    try {
        $content = Get-Content -Path $file -Raw -Encoding UTF8
        $pageName = $cssMapping[$file]
        
        # Remove the entire style block (from <style> to </style>)
       $content = $content -replace '<style>[\s\S]*?</style>', ''
        
        # Remove old CSS links
        $content = $content -replace '<link rel="stylesheet" href="assets/css/styles\.css"\s*/?>[\r\n]*', ''
        $content = $content -replace '<link rel="stylesheet" href="assets/css/aurum-light\.css"\s*/?>[\r\n]*', ''
        $content = $content -replace '<link rel="stylesheet" href="assets/css/aurum-pages\.css"\s*/?>[\r\n]*', ''
        $content = $content -replace '<link rel="stylesheet" href="assets/css/prime\.css"\s*/?>[\r\n]*', ''
        $content = $content -replace '<link rel="stylesheet" href="assets/css/global\.css"\s*/?>[\r\n]*', ''
        $content = $content -replace '<link rel="stylesheet" href="assets/css/pages/[^"]*\.css"\s*/?>[\r\n]*', ''
        
        # Insert new CSS links before </head>
        $newCSSLinks = "  <link rel=""stylesheet"" href=""assets/css/styles.css"" />`r`n  <link rel=""stylesheet"" href=""assets/css/global.css"" />`r`n  <link rel=""stylesheet"" href=""assets/css/pages/$pageName.css"" />`r`n  <link rel=""stylesheet"" href=""assets/css/aurum-light.css"" />`r`n"
        
        $content = $content -replace '(</head>)', ($newCSSLinks + "`$1")
        
        # Write back to file
        Set-Content -Path $file -Value $content -Encoding UTF8
        $updated++
        Write-Host "✓ Updated: $file"
    }
    catch {
        $errors += "$file - Error: $_"
        Write-Host "✗ Error with $file : $_" -ForegroundColor Red
    }
}

Write-Host "`n══════════════════════════════"
Write-Host "CSS Link Update Complete"
Write-Host "══════════════════════════════"
Write-Host "Files Updated: $updated / $($htmlFiles.Count)"

if ($errors.Count -gt 0) {
    Write-Host "`nErrors encountered:"
    $errors | ForEach-Object { Write-Host "  - $_" }
}
