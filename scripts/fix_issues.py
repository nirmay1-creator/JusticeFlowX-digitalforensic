import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate Forensics DB link
nav_block = '''      <a href="modules/network_forensics/forensics_dashboard.html" class="nav-link">
        <i class='bx bx-shield-quarter'></i><span>Forensics DB</span>
      </a>'''
content = content.replace(nav_block + '\n' + nav_block, nav_block)

# Fix missing closing div for scanBox5
content = content.replace('''    <div class="scan-box" id="scanBox6">''', '''    </div>\n    <div class="scan-box" id="scanBox6">''')

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/modules/network_forensics/forensics_dashboard.html', 'r', encoding='utf-8') as f:
    db_content = f.read()

# Fix the back link
db_content = db_content.replace('href="index.html"', 'href="../../index.html"')
with open('frontend/modules/network_forensics/forensics_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(db_content)
