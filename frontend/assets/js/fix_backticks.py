import re

with open('justice.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix missing backticks in justice.js
content = re.sub(r'innerHTML = \s*<div', 'innerHTML = \n    <div', content)
content = re.sub(r'</div>\s*;\s*document\.body\.appendChild\(overlay\);', '</div>\n  ;\n  document.body.appendChild(overlay);', content)

with open('justice.js', 'w', encoding='utf-8') as f:
    f.write(content)
