# Update CSS links in HTML files

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

foreach ($file in $htmlFiles) {
    $exists = Test-Path -Path $file
    if (-not $exists) {
        Write-Host "✗ Not found: $file"
        continue
    }
    
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $pageName = $cssMapping[$file]
    
    # Remove style block
    $content = $content -replace '<style>[\s\S]*?</style>', ''
    
    # Remove old CSS links
    $content = $content -replace '<link rel="stylesheet" href="assets/css/styles\.css"[^>]*>', ''
    $content = $content -replace '<link rel="stylesheet" href="assets/css/aurum-light\.css"[^>]*>', ''
    $content = $content -replace '<link rel="stylesheet" href="assets/css/aurum-pages\.css"[^>]*>', ''
    $content = $content -replace '<link rel="stylesheet" href="assets/css/prime\.css"[^>]*>', ''
    $content = $content -replace '<link rel="stylesheet" href="assets/css/global\.css"[^>]*>', ''
    $content = $content -replace '<link rel="stylesheet" href="assets/css/pages/[^"]*\.css"[^>]*>', ''
    
    # Clean up extra blank lines
    $content = $content -replace "`r`n`r`n`r`n", "`r`n`r`n"
    
    # Add new CSS links before </head>
    $cssLine = "  <link rel=`"stylesheet`" href=`"assets/css/styles.css`" />`r`n  <link rel=`"stylesheet`" href=`"assets/css/global.css`" />`r`n  <link rel=`"stylesheet`" href=`"assets/css/pages/$pageName.css`" />`r`n  <link rel=`"stylesheet`" href=`"assets/css/aurum-light.css`" />`r`n"
    $content = $content -replace '(  </head>)', ($cssLine + '  $1')
    
    Set-Content -Path $file -Value $content -Encoding UTF8
    $updated++
    Write-Host "✓ $file"
}

Write-Host "`nUpdated: $updated files"
