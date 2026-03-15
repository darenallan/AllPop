#!/usr/bin/env python3
"""
Update inline scripts in HTML files - replace with modularized script tags
"""
import os
import re

workspace = r"c:\Users\HP\Desktop\AurumCorp"
files_to_process = [
    ("about.html", "about"),
    ("boutique-list.html", "boutique-list"),
    ("boutique.html", "boutique"),
    ("cart.html", "cart"),
    ("catalogue.html", "catalogue"),
    ("contact.html", "contact"),
    ("delivery.html", "delivery"),
    ("index.html", "index"),
    ("login.html", "login"),
    ("messages.html", "messages"),
    ("privacy.html", "A"),
    ("product.html", "product"),
    ("profile.html", "profile"),
    ("register.html", "register"),
    ("seller-application.html", "seller-application"),
    ("seller-onboarding.html", "seller-onboarding"),
    ("seller.html", "seller"),
    ("wishlist.html", "wishlist"),
]

def process_file(filepath, pagename):
    """Replace inline scripts with modularized ones"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern: Look for <script>...</script> blocks without src attribute,
        # followed by <script src="assets/js/footer.js" defer></script>
        # Replace all inline scripts with global + pages scripts, keep footer.js
        
        # Find all inline script blocks (without src attribute)
        inline_script_pattern = r'<script>\s*[^<]*?</script>\s*'
        inline_scripts = re.findall(inline_script_pattern, content, re.DOTALL | re.IGNORECASE)
        
        if not inline_scripts:
            print(f"  ✗ {filepath} - No inline scripts found")
            return False
        
        # Check if footer.js exists
        if 'assets/js/footer.js' not in content:
            print(f"  ✗ {filepath} - No footer.js found")
            return False
        
        # Replace: find all inline scripts at the end and replace with modulari zed ones
        # Keep footer.js the same
        new_content = re.sub(
            r'(<script>\s*(?:[^<]|<(?!/script>))*?</script>\s*)*(<script src="assets/js/footer\.js" defer></script>)',
            f'<script src="assets/js/global.js" defer></script>\n<script src="assets/js/pages/{pagename}.js" defer></script>\n<script src="assets/js/footer.js" defer></script>',
            content,
            flags=re.DOTALL | re.IGNORECASE
        )
        
        if new_content == content:
            print(f"  ✗ {filepath} - Replacement pattern not found")
            return False
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✓ {filepath}")
        return True
        
    except Exception as e:
        print(f"  ✗ {filepath} - Error: {e}")
        return False

print("=" * 60)
print("UPDATING INLINE SCRIPTS IN HTML FILES")
print("=" * 60)

updated_count = 0
for filename, pagename in files_to_process:
    filepath = os.path.join(workspace, filename)
    if os.path.exists(filepath):
        if process_file(filepath, pagename):
            updated_count += 1
    else:
        print(f"  ✗ {filepath} - File not found")

print("=" * 60)
print(f"SUMMARY: {updated_count}/{len(files_to_process)} files updated")
print("=" * 60)
