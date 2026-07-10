#!/usr/bin/env python3
"""Generate all mermaid diagrams to PNG at 300 DPI."""
import subprocess
import os

DIAGRAMS_DIR = 'diagrams'

# List of all mermaid files to render
files = [
    ('usecase.mmd', 'usecase.png'),
    ('activity-upload.mmd', 'activity-upload.png'),
    ('activity-chat.mmd', 'activity-chat.png'),
    ('sequence-chat-rag.mmd', 'sequence-chat-rag.png'),
    ('erd-a-identity.mmd', 'erd-a-identity.png'),
    ('erd-b-rag.mmd', 'erd-b-rag.png'),
    ('erd-c-chat-crm.mmd', 'erd-c-chat-crm.png'),
    ('erd-d-billing.mmd', 'erd-d-billing.png'),
    ('erd-summary.mmd', 'erd-summary.png'),
    ('architecture.mmd', 'architecture.png'),
    ('rag-pipeline.mmd', 'rag-pipeline.png'),
    ('crm-pipeline.mmd', 'crm-pipeline.png'),
]

# Keep existing ERD (full) for backward compatibility
# files.append(('erd.mmd', 'erd.png'))

for mmd_file, png_file in files:
    mmd_path = os.path.join(DIAGRAMS_DIR, mmd_file)
    png_path = os.path.join(DIAGRAMS_DIR, png_file)
    
    if not os.path.exists(mmd_path):
        print(f"⚠️  SKIP: {mmd_file} not found")
        continue
    
    print(f"🎨 Rendering {mmd_file} → {png_file} ...")
    
    config_path = os.path.join(DIAGRAMS_DIR, 'mermaid-config.json')
    cmd = f'npx --yes @mermaid-js/mermaid-cli -i "{mmd_path}" -o "{png_path}" -w 1984 -b white --scale 3 -c "{config_path}"'
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, shell=True)
    
    if result.returncode == 0:
        size = os.path.getsize(png_path)
        print(f"  ✅ {png_file} ({size/1024:.0f} KB)")
    else:
        print(f"  ❌ FAILED: {result.stderr[:200]}")

print("\n🎨 All diagrams rendered!")
