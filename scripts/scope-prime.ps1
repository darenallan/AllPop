$path = "c:/Users/HP/Desktop/AurumCorp/assets/js/prime.js"
$content = Get-Content -Raw -Path $path

# Cleanup accidental token
$content = $content -replace "^[\uFEFF\s]*primes\.js\s*", ""

# Remove duplicated cursor blocks (any comment containing CURSOR followed by IIFE)
$cursorPattern = '/\*\s*[^\n]*CURSOR[^\n]*\*/\s*\(\(\)\s*=>\s*\{[\s\S]*?\}\)\(\);\s*'
$content = [regex]::Replace($content, $cursorPattern, '', 'IgnoreCase')

$matches = [regex]::Matches($content, '/\*[^\n]*script[^\n]*\*/')
Write-Output ("Marker count: " + $matches.Count)
if ($matches.Count -eq 0) { throw 'No /* ... script */ markers found in prime.js' }

function CondFromMarker([string]$marker) {
  $m = $marker.ToLowerInvariant()
  if ($m -match '404') { return "document.querySelector('.stage') || document.querySelector('.links-bar')" }
  if ($m -match 'a\.html') { return "document.getElementById('hl')" }
  if ($m -match 'about') { return "document.getElementById('stats-products') || document.getElementById('about')" }
  if ($m -match 'boutique-list') { return "document.getElementById('shops-grid')" }
  if ($m -match 'boutique\.html') { return "document.getElementById('shop-products-grid') || document.getElementById('shop-name')" }
  if ($m -match 'cart\.html') { return "document.getElementById('cart-items-list') || document.getElementById('cart-content') || document.getElementById('loading')" }
  if ($m -match 'catalogue|products\.html') { return "document.getElementById('products-container') || document.getElementById('products-grid') || document.getElementById('category-filter')" }
  if ($m -match 'contact') { return "document.getElementById('contact-form') || document.getElementById('ct')" }
  if ($m -match 'delivery') { return "document.getElementById('dv-wall') || document.querySelector('.dv-sidebar')" }
  if ($m -match 'index') { return "document.getElementById('nl-form') || document.querySelector('.hero-search-input')" }
  if ($m -match 'login') { return "document.getElementById('form-login') || document.getElementById('lg')" }
  if ($m -match 'message') { return "document.getElementById('messages-container') || document.getElementById('ms') || document.getElementById('messages-list')" }
  if ($m -match 'product\.html') { return "document.getElementById('ax-root') || document.getElementById('ax-loader')" }
  if ($m -match 'profile') { return "document.getElementById('tab-dashboard') || document.getElementById('db')" }
  if ($m -match 'register') { return "document.getElementById('register-container') || document.getElementById('rg')" }
  if ($m -match 'seller-application') { return "document.getElementById('seller-application-form') || document.getElementById('sa')" }
  if ($m -match 'seller-onboarding') { return "document.getElementById('seller-onboarding-form') || document.getElementById('so')" }
  if ($m -match 'seller\.html') { return "document.getElementById('sd') || document.getElementById('sd-sidebar')" }
  if ($m -match 'whishlist|wishlist') { return "document.getElementById('wl-grid') || document.getElementById('wishlist-grid') || document.getElementById('wl')" }
  return 'true'
}

$sections = @()
for ($i=0; $i -lt $matches.Count; $i++) {
  $start = $matches[$i].Index
  $end = if ($i -lt $matches.Count-1) { $matches[$i+1].Index } else { $content.Length }
  $chunk = $content.Substring($start, $end - $start).Trim()
  if ($chunk) { $sections += ,$chunk }
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("document.addEventListener('DOMContentLoaded', () => {")
[void]$sb.AppendLine("  const yearSpan = document.getElementById('year');")
[void]$sb.AppendLine("  if (yearSpan) yearSpan.innerText = new Date().getFullYear();")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("  if (typeof lucide !== 'undefined') {")
[void]$sb.AppendLine("    lucide.createIcons();")
[void]$sb.AppendLine("  }")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("  // Global cursor (single implementation)")
[void]$sb.AppendLine("  const cursorPairs = [[ 'cur-ring','cur-dot','cur-h' ],[ 'lg-ring','lg-dot','lg-h' ],[ 'rg-ring','rg-dot','rg-h' ],[ 'ct-ring','ct-dot','ct-h' ],[ 'bp-ring','bp-dot','bp-h' ],[ 'wl-ring','wl-dot','wl-h' ],[ 'db-ring','db-dot','db-h' ],[ 'pr-ring','pr-dot','pr-h' ],[ 'bl-ring','bl-dot','bl-h' ],[ 'sd-ring','sd-dot','sd-h' ],[ 'tk-ring','tk-dot','tk-h' ],[ 'dv-ring','dv-dot','dv-h' ]];")
[void]$sb.AppendLine("  const activeCursor = cursorPairs.find(([r,d]) => document.getElementById(r) && document.getElementById(d));")
[void]$sb.AppendLine("  if (activeCursor) {")
[void]$sb.AppendLine("    const [ringId,dotId,hoverClass] = activeCursor;")
[void]$sb.AppendLine("    const ring = document.getElementById(ringId);")
[void]$sb.AppendLine("    const dot = document.getElementById(dotId);")
[void]$sb.AppendLine("    if (ring && dot) {")
[void]$sb.AppendLine("      let mx=0,my=0,rx=0,ry=0;")
[void]$sb.AppendLine("      document.addEventListener('mousemove',(e)=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px';});")
[void]$sb.AppendLine("      (function loop(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop);})();")
[void]$sb.AppendLine("      const hoverSel='a,button,input,textarea,select,[onclick],[data-h],.bl-card,.bp-card,.wl-card';")
[void]$sb.AppendLine("      document.addEventListener('mouseover',(e)=>{if(e.target.closest(hoverSel)) document.body.classList.add(hoverClass);});")
[void]$sb.AppendLine("      document.addEventListener('mouseout',(e)=>{if(e.target.closest(hoverSel)) document.body.classList.remove(hoverClass);});")
[void]$sb.AppendLine("    }")
[void]$sb.AppendLine("  }")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("  const __runLegacyDomReady = (fn) => {")
[void]$sb.AppendLine("    const __orig = document.addEventListener.bind(document);")
[void]$sb.AppendLine("    document.addEventListener = (type, listener, options) => {")
[void]$sb.AppendLine("      if (type === 'DOMContentLoaded' && typeof listener === 'function') { listener(); return; }")
[void]$sb.AppendLine("      return __orig(type, listener, options);")
[void]$sb.AppendLine("    };")
[void]$sb.AppendLine("    try { fn(); } finally { document.addEventListener = __orig; }")
[void]$sb.AppendLine("  };")
[void]$sb.AppendLine("")

foreach ($sec in $sections) {
  $first = ($sec -split "`n")[0].Trim()
  $cond = CondFromMarker $first
  $body = $sec.Substring($first.Length).TrimStart()
  [void]$sb.AppendLine("  $first")
  [void]$sb.AppendLine("  if ($cond) {")
  [void]$sb.AppendLine("    __runLegacyDomReady(() => {")
  $indented = ($body -split "`n" | ForEach-Object { if ($_ -ne '') { '      ' + $_ } else { '' } }) -join "`n"
  [void]$sb.AppendLine($indented)
  [void]$sb.AppendLine("    });")
  [void]$sb.AppendLine("  }")
  [void]$sb.AppendLine("")
}

[void]$sb.AppendLine("});")
Set-Content -Path $path -Value $sb.ToString() -NoNewline
Write-Output 'prime.js scoped rewrite complete'
