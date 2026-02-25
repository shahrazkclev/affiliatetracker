import os
import glob

files = glob.glob('src/**/*.tsx', recursive=True)
replacements = [
    ('cyan-', 'orange-'),
    ('emerald-', 'amber-'),
    ('indigo-', 'orange-'),
    ('purple-', 'amber-'),
    ('fuchsia-', 'orange-'),
    ('pink-', 'amber-'),
    ('blue-', 'orange-'),
    ('#34d399', '#fbbf24'),
    ('#a855f7', '#f97316'),
    ('#10b981', '#fbbf24'),
    ('#d946ef', '#f97316')
]

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    original_content = content
    for o, n in replacements:
        content = content.replace(o, n)
        
    if content != original_content:
        with open(f, 'w') as file:
            file.write(content)
        print(f"Updated {f}")
