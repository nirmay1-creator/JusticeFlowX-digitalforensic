import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('    <!-- FINGERPRINT CARD -->')
if start_idx == -1:
    start_idx = content.find('    <div class="scan-box" id="scanBox1">')

end_idx = content.find('    <!-- FACE SCAN CARD -->')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]

# Find all remaining METHOD XX tags and renumber them from 1 to N
def renumber(match):
    renumber.counter += 1
    return f"METHOD {renumber.counter:02d}"
renumber.counter = 0

content = re.sub(r'METHOD \d\d', renumber, content)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/assets/js/justice.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Remove the finger routing in switch
# "case "finger": showFingerprintOverlay(afterScan); break;"
js_content = re.sub(r'case "finger":.*?\n', '', js_content)

with open('frontend/assets/js/justice.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
