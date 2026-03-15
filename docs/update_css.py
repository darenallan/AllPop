#!/usr/bin/env python
import os
import re

files = ['404.html', 'A.html', 'about.html', 'boutique-list.html', 'boutique.html',
         'cart.html', 'catalogue.html', 'contact.html', 'delivery.html', 'index.html',
         'login.html', 'messages.html', 'privacy.html', 'product.html', 'profile.html',
         'register.html', 'seller-application.html', 'seller-onboarding.html', 'seller.html', 'wishlist.html']

mapping = {
    '404.html': '404', 'A.html': 'A', 'about.html': 'about', 'boutique-list.html': 'boutique-list',
    'boutique.html': 'boutique', 'cart.html': 'cart', 'catalogue.html': 'catalogue',
    'contact.html': 'contact', 'delivery.html': 'delivery', 'index.html': 'index',
    'login.html': 'login', 'messages.html': 'messages', 'privacy.html': 'privacy',
    'product.html': 'product', 'profile.html': 'profile', 'register.html': 'register',
    'seller-application.html': 'seller-application', 'seller-onboarding.html': 'seller-onboarding',
    'seller.html': 'seller', 'wishlist.html': 'wishlist'
}

updated = 0
errors = []

for f in files:
    if not os.path.exists(f):
        print(f'Skip: {f} (not found)')
        continue
        
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        page = mapping[f]
        
        # Remove style block
        content = re.sub(r'<style>[\s\S]*?</style>', '', content)
        
        # Remove old CSS links
        content = re.sub(r'  *<link[^>]*?href="assets/css/[^"]*"[^>]*?/?>\s*\n?', '', content)
        
        # Add new CSS links
        new_links = '  <link rel="stylesheet" href="assets/css/styles.css" />\n'
        new_links += '  <link rel="stylesheet" href="assets/css/global.css" />\n'
        new_links += '  <link rel="stylesheet" href="assets/css/pages/' + page + '.css" />\n'
        new_links += '  <link rel="stylesheet" href="assets/css/aurum-light.css" />\n'
        
        content = content.replace('  </head>', new_links + '  </head>')
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        
        print('OK: ' + f)
        updated += 1
    except Exception as e:
        errors.append(f + ' - Error: ' + str(e))
        print('ERR: ' + f + ' - ' + str(e))

print('\n' + '='*40)
print('Updated: ' + str(updated) + '/' + str(len(files)))
if errors:
    print('Errors:')
    for err in errors:
        print('  - ' + err)
