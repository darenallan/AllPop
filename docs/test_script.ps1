# PowerShell script to update CSS links in all HTML files
404 A about boutique-list boutique cart catalogue contact delivery index login messages privacy product profile register seller-application seller-onboarding seller wishlist = @(
    "404.html", "A.html", "about.html", "boutique-list.html", "boutique.html",
    "cart.html", "catalogue.html", "contact.html", "delivery.html", "index.html",
    "login.html", "messages.html", "privacy.html", "product.html", "profile.html",
    "register.html", "seller-application.html", "seller-onboarding.html", "seller.html", "wishlist.html"
)

# Map filename to page CSS name
 = @{
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

Write-Host "Processing 20 HTML files...
"

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $file"
}
