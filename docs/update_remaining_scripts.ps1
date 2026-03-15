# Update inline scripts to modularized versions
[CmdletBinding()]
param()

$files = @(
    @{ path = 'index.html'; module = 'index' },
    @{ path = 'messages.html'; module = 'messages' },
    @{ path = 'profile.html'; module = 'profile' },
    @{ path = 'seller.html'; module = 'seller' },
    @{ path = 'cart.html'; module = 'cart' },
    @{ path = 'catalogue.html'; module = 'catalogue' },
    @{ path = 'boutique-list.html'; module = 'boutique-list' },
    @{ path = 'delivery.html'; module = 'delivery' },
    @{ path = 'product.html'; module = 'product' },
    @{ path = 'messages.html'; module = 'messages' },
    @{ path = 'seller-onboarding.html'; module = 'seller-onboarding' },
    @{ path = 'seller-application.html'; module = 'seller-application' },
    @{ path = 'wishlist.html'; module = 'wishlist' }
)

$updated = 0
$failed = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UPDATING REMAINING HTML FILES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($file in $files) {
    $filePath = $file.path
    $module = $file.module
    
    if (-not (Test-Path $filePath)) {
        Write-Host "  × $filePath - Not found" -ForegroundColor Yellow
        $failed++
        continue
    }
    
    try {
        $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        
        # Replace pattern: all inline scripts before footer.js with global + module scripts
        # This handles multiple inline scripts by replacing them all with just global + module
        $newContent = $content -replace `
            '(<script>[^<]*</script>\s*)*(<script src="assets/js/footer\.js" defer></script>)', `
            "<script src=""assets/js/global.js"" defer></script>`n<script src=""assets/js/pages/$module.js"" defer></script>`n`$2"
        
        if ($newContent -ne $content) {
            [System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
            Write-Host "  ✓ $filePath" -ForegroundColor Green
            $updated++
        }
        else {
            Write-Host "  ~ $filePath - No changes made (pattern not found)" -ForegroundColor Gray
            $failed++
        }
    }
    catch {
        Write-Host "  × $filePath - Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY: $updated updated, $failed not modified" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
