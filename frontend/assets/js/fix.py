import re
with open('justice.js', 'r', encoding='latin-1') as f:
    content = f.read()

# Fix innerHTML = <div to innerHTML = `<div
content = re.sub(r'innerHTML = \s*<div', 'innerHTML = `\n    <div', content)
content = re.sub(r'</div>\s*;\s*document\.body\.appendChild\(overlay\);', '</div>\n  `;\n  document.body.appendChild(overlay);', content)

with open('justice.js', 'w', encoding='latin-1') as f:
    f.write(content)
