# Simple refactor to consolidate prime.js into single DOMContentLoaded + scoped per-page guards
$path = "c:/Users/HP/Desktop/AurumCorp/assets/js/prime.js"
$content = (Get-Content -Raw -Path $path).TrimStart()

# Remove accidental token
$content = $content -replace "^primes\.js\s*", ""

# Define page markers and their guard conditions
$pageGuards = @{
  "404" = "document.querySelector('.stage')"
  "A.html" = "document.getElementById('hl')"
  "about.html" = "document.getElementById('stats-products')"
  "boutique-list.html" = "document.getElementById('shops-grid')"
  "boutique.html" = "document.getElementById('shop-name')"
  "cart.html" = "document.getElementById('cart-content') || document.getElementById('cart-items-list')"
  "catalogue.html" = "document.getElementById('catalogue-grid')"
  "contact.html" = "document.getElementById('contact-form') || document.getElementById('ct')"
  "delivery.html" = "document.getElementById('dv-wall')"
  "index.html" = "document.getElementById('hero') || document.querySelector('.hero-search')"
  "invoice.html" = "document.getElementById('invoice-container')"
  "login.html" = "document.getElementById('form-login')"
  "messages.html" = "document.getElementById('messages-container')"
  "product.html" = "document.getElementById('ax-root')"
  "profile.html" = "document.getElementById('tab-dashboard')"
  "register.html" = "document.getElementById('rg')"
  "seller-application.html" = "document.getElementById('seller-application-form')"
  "seller-onboarding.html" = "document.getElementById('seller-onboarding-form')"
  "seller.html" = "document.getElementById('sd')"
  "wishlist.html" = "document.getElementById('wl-grid')"
}

# Split by major page markers (simple approach: look for comment lines with "script")
$splits = [regex]::Split($content, "(?=\n/\*[^\n]*script)")

# Collect sections with their page names
$sections = @()
foreach ($split in $splits) {
  $lines = $split.Split("`n", [System.StringSplitOptions]::None)
  if ($lines.Count -gt 0) {
    $firstLine = $lines[0].Trim()
    if ($firstLine -match "script") {
      # Extract page name from comment
      $pageName = ""
      foreach ($key in $pageGuards.Keys) {
        if ($firstLine -ilike "*$key*") {
          $pageName = $key
          break
        }
      }
      if ($pageName -eq "") {
        # Try to guess from marker
        if ($firstLine -match "(\w+(?:\.html)?)" ) {
          $pageName = $matches[1]
        }
      }
      # Body is everything after the first line
      $body = ($lines | Select-Object -Skip 1) -join "`n"
      if ($body.Trim()) {
        $sections += @{ name = $pageName; guard = $pageGuards[$pageName] -or "true"; body = $body }
      }
    }
  }
}

# Build output with single DOMContentLoaded
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("document.addEventListener('DOMContentLoaded', () => {")
[void]$sb.AppendLine("  // Year initialization")
[void]$sb.AppendLine("  const yearSpan = document.getElementById('year');")
[void]$sb.AppendLine("  if (yearSpan) yearSpan.innerText = new Date().getFullYear();")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("  // Lucide icons")
[void]$sb.AppendLine("  if (typeof lucide !== 'undefined') {")
[void]$sb.AppendLine("    lucide.createIcons();")
[void]$sb.AppendLine("  }")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("  // Unified cursor handler for all pages")
[void]$sb.AppendLine("  const cursorMap = {")
[void]$sb.AppendLine("    'cur-ring': 'cur-h', 'lg-ring': 'lg-h', 'rg-ring': 'rg-h',")
[void]$sb.AppendLine("    'ct-ring': 'ct-h', 'bp-ring': 'bp-h', 'wl-ring': 'wl-h',")
[void]$sb.AppendLine("    'db-ring': 'db-h', 'pr-ring': 'pr-h', 'bl-ring': 'bl-h',")
[void]$sb.AppendLine("    'sd-ring': 'sd-h', 'tk-ring': 'tk-h', 'dv-ring': 'dv-h'")
[void]$sb.AppendLine("  };")
[void]$sb.AppendLine("  for (const [ringId, hoverClass] of Object.entries(cursorMap)) {")
[void]$sb.AppendLine("    const ring = document.getElementById(ringId);")
[void]$sb.AppendLine("    const dot = document.getElementById(ringId.replace('ring','dot'));")
[void]$sb.AppendLine("    if (ring && dot) {")
[void]$sb.AppendLine("      let mx=0, my=0, rx=0, ry=0;")
[void]$sb.AppendLine("      document.addEventListener('mousemove', (e) => {")
[void]$sb.AppendLine("        mx=e.clientX; my=e.clientY;")
[void]$sb.AppendLine("        dot.style.left=mx+'px'; dot.style.top=my+'px';")
[void]$sb.AppendLine("      });")
[void]$sb.AppendLine("      (function loop() {")
[void]$sb.AppendLine("        rx += (mx-rx)*.1; ry += (my-ry)*.1;")
[void]$sb.AppendLine("        ring.style.left=rx+'px'; ring.style.top=ry+'px';")
[void]$sb.AppendLine("        requestAnimationFrame(loop);")
[void]$sb.AppendLine("      })();")
[void]$sb.AppendLine("      document.addEventListener('mouseover', (e) => {")
[void]$sb.AppendLine("        if(e.target.closest('a,button,input,textarea,select,[onclick],.card')) {")
[void]$sb.AppendLine("          document.body.classList.add(hoverClass);")
[void]$sb.AppendLine("        }")
[void]$sb.AppendLine("      });")
[void]$sb.AppendLine("      document.addEventListener('mouseout', (e) => {")
[void]$sb.AppendLine("        if(e.target.closest('a,button,input,textarea,select,[onclick],.card')) {")
[void]$sb.AppendLine("          document.body.classList.remove(hoverClass);")
[void]$sb.AppendLine("        }")
[void]$sb.AppendLine("      });")
[void]$sb.AppendLine("      break; // Only use first active cursor")
[void]$sb.AppendLine("    }")
[void]$sb.AppendLine("  }")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("  // Proxy to run legacy nested DOMContentLoaded callbacks immediately")
[void]$sb.AppendLine("  const __runLegacyHandler = (fn) => {")
[void]$sb.AppendLine("    const original = document.addEventListener.bind(document);")
[void]$sb.AppendLine("    document.addEventListener = (type, listener, opts) => {")
[void]$sb.AppendLine("      if (type === 'DOMContentLoaded' && typeof listener === 'function') {")
[void]$sb.AppendLine("        try { listener(); } catch(e) { console.error('Legacy handler error:', e); }")
[void]$sb.AppendLine("        return;")
[void]$sb.AppendLine("      }")
[void]$sb.AppendLine("      return original(type, listener, opts);")
[void]$sb.AppendLine("    };")
[void]$sb.AppendLine("    try { fn(); } finally { document.addEventListener = original; }")
[void]$sb.AppendLine("  };")
[void]$sb.AppendLine("")

# Add each page section with guard
foreach ($sec in $sections) {
  if ($sec.name -and $sec.guard -and $sec.body) {
    [void]$sb.AppendLine("  // Page: $($sec.name)")
    [void]$sb.AppendLine("  if ($($sec.guard)) {")
    [void]$sb.AppendLine("    __runLegacyHandler(() => {")
    # Indent body
    $indented = ($sec.body -split "`n" | ForEach-Object { "      $_" }) -join "`n"
    [void]$sb.AppendLine($indented)
    [void]$sb.AppendLine("    });")
    [void]$sb.AppendLine("  }")
    [void]$sb.AppendLine("")
  }
}

[void]$sb.AppendLine("});")
Set-Content -Path $path -Value $sb.ToString() -NoNewline
Write-Output ("Refactored prime.js with {0} page sections" -f $sections.Count)
