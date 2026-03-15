#!/usr/bin/env python3
import os
import re

SOURCE_FILE = r"c:\Users\HP\Desktop\AurumCorp\assets\css\prime.css"
OUTPUT_DIR = r"c:\Users\HP\Desktop\AurumCorp\assets\css\pages"

EXTRACTIONS = [
    ("A.css", 284, 1223),
    ("boutique-list.css", 1224, 1273),
    ("boutique.css", 1274, 1533),
    ("cart.css", 1534, 1598),
    ("catalogue.css", 2248, 2447),
    ("contact.css", 2448, 2528),
    ("delivery.css", 2529, 3023),
    ("index.css", 3024, 3344),
    ("login.css", 3640, 3717),
    ("messages.css", 3718, 4243),
    ("privacy.css", 4244, 4322),
    ("product.css", 4323, 4599),
    ("profile.css", 4600, 5129),
    ("register.css", 5130, 5209),
    ("seller-application.css", 5210, 5510),
    ("seller.css", 5511, 6236),
    ("wishlist.css", 6237, 6663),
]

def remove_global_css(lines):
    """Remove global CSS sections and keep only page-specific styles"""
    result = []
    i = 0
    in_block = False
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Skip page title comments
        if re.match(r'^\s*/\*\s*\w+\.html\s+style', stripped, re.IGNORECASE):
            i += 1
            continue
        
        # Skip :root blocks
        if re.match(r'^\s*:root\s*\{', stripped):
            while i < len(lines) and '}' not in lines[i]:
                i += 1
            if i < len(lines):
                i += 1  # Skip closing }
            continue
        
        # Skip global reset (* selector)
        if re.match(r'^\s*\*\s*,\s*\*::', stripped):
            while i < len(lines) and '}' not in lines[i]:
                i += 1
            if i < len(lines):
                i += 1
            continue
        
        # Skip html block
        if re.match(r'^\s*html\s*\{', stripped):
            while i < len(lines) and '}' not in lines[i]:
                i += 1
            if i < len(lines):
                i += 1
            continue
        
        # Skip body block (not body class)
        if re.match(r'^\s*body\s*\{', stripped) and 'body.' not in stripped:
            while i < len(lines) and '}' not in lines[i]:
                i += 1
            if i < len(lines):
                i += 1
            continue
        
        # Skip ::selection
        if re.match(r'^\s*::selection', stripped):
            while i < len(lines) and '}' not in lines[i]:
                i += 1
            if i < len(lines):
                i += 1
            continue
        
        # Skip CURSOR sections
        if 'CURSOR' in stripped or '#cur-ring' in stripped or '#cur-dot' in stripped or '#lg-ring' in stripped or '#bp-ring' in stripped:
            while i < len(lines):
                if '}' in lines[i]:
                    i += 1
                    break
                i += 1
            continue
        
        # Skip NOISE sections
        if 'NOISE' in stripped or '#noise' in stripped or 'noise{' in stripped:
            while i < len(lines):
                if '}' in lines[i]:
                    i += 1
                    break
                i += 1
            continue
        
        # Skip HEADER sections
        if 'HEADER' in stripped or '.aurum-glass-header' in stripped or '.header-' in stripped:
            while i < len(lines):
                if '}' in lines[i]:
                    i += 1
                    break
                i += 1
            continue
        
        # Add line if not empty
        if stripped:  # Only non-empty lines
            result.append(line)
        elif result:  # Allow empty lines between rules once we have content
            result.append(line)
        
        i += 1
    
    # Remove leading empty lines
    while result and not result[0].strip():
        result.pop(0)
    # Remove trailing empty lines
    while result and not result[-1].strip():
        result.pop()
    
    return result

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Read source file
with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
    all_lines = f.readlines()

# Extract and clean each section
created_count = 0
for name, start_line, end_line in EXTRACTIONS:
    # Convert to 0-based indexing
    start_idx = start_line - 1
    end_idx = end_line
    
    # Extract lines for this file
    extracted = all_lines[start_idx:end_idx]
    
    # Clean the CSS
    cleaned = remove_global_css(extracted)
    
    # Create output file
    output_path = os.path.join(OUTPUT_DIR, name)
    
    header = f"/* {name} - Page-specific styles from AurumCorp Design System */\n\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(header)
        f.writelines(cleaned)
    
    created_count += 1
    print(f"Created: {name}")

print("\n" + "="*50)
print(f"Extraction Complete!")
print(f"Success: {created_count} files created")
print(f"Location: {OUTPUT_DIR}")
print("="*50)
