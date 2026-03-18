#!/usr/bin/env python3
import os

files_to_fix = {
    'A.html': [
        ('\xab Devenir Vendeur \xbb', '« Devenir Vendeur »'),
    ],
    'theking.html': [
        ("||'\ufffd'", "||''"),
        ('étre', 'être'),
        ('Accés', 'Accès'),
    ],
    'admin.html': [
        ('Accés', 'Accès'),
        ('réservé \ufffd', 'réservé à'),
    ],
    'assets/css/styles.css': [
        ('Électronique', 'Électronique'),
        ('Spécifications', 'Spécifications'),
        ('Bâtiment', 'Bâtiment'),
        ('Véhicules', 'Véhicules'),
        ('Bannière', 'Bannière'),
        ('vérifié', 'vérifié'),
        ('création', 'création'),
        ('catégories', 'catégories'),
    ]
}

for filepath, replacements in files_to_fix.items():
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for old, new in replacements:
        content = content.replace(old, new)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {filepath}")
    else:
        print(f"~ No changes for {filepath}")

print("Done!")
