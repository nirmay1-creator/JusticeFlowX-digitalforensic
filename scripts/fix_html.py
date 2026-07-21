import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# We need to remove the duplicate cards which got inserted by my bad tool call.
# It seems I duplicated from scanBox2 all the way down to scanBox6.
# I will find the first '<!-- FACE SCAN CARD -->' and the second one.

parts = html.split('<!-- FACE SCAN CARD -->')

if len(parts) > 2:
    # There is a duplicate
    # We keep parts[0], and we want to keep the FIRST instance of the cards up to scanBox6.
    # Then we append scanBox8 properly, and then the status bar.
    
    # Actually, the easiest way is to extract the header, the grid container start, and then just rebuild the grid perfectly.
    pass

# Let's extract the header up to <div class="container">
header_match = re.search(r'(.*?<div class="container">)', html, re.DOTALL)
header = header_match.group(1)

# Let's extract the footer from <div class="status-bar"> to the end
footer_match = re.search(r'(\s*<div class="status-bar">.*)', html, re.DOTALL)
footer = footer_match.group(1)

# Now let's extract the individual cards from the FIRST set of cards.
# I will find the first instance of each card using regex
face_card = re.search(r'(    <!-- FACE SCAN CARD -->.*?</a>\n    </div>)', html, re.DOTALL).group(1)
forensics_card = re.search(r'(    <!-- FORENSICS CARD -->.*?</a>\n    </div>)', html, re.DOTALL).group(1)
network_card = re.search(r'(    <!-- NETWORK DETECTION CARD -->.*?</a>\n    </div>)', html, re.DOTALL).group(1)
law_card = re.search(r'(    <!-- LEGAL EDUCATION CARD -->.*?</a>\n    </div>)', html, re.DOTALL).group(1)
chain_card = re.search(r'(    <div class="scan-box" id="scanBox7">.*?</a>\n    </div>)', html, re.DOTALL).group(1)
netforensics_card = re.search(r'(    <div class="scan-box" id="scanBox6">.*?</a>\n    </div>)', html, re.DOTALL).group(1)
malware_card = re.search(r'(    <!-- MALWARE DFIR CARD -->.*?</a>\n    </div>)', html, re.DOTALL).group(1)

# Assemble!
new_html = f"{header}\n\n{face_card}\n\n{forensics_card}\n\n{network_card}\n{law_card}\n{chain_card}\n\n{netforensics_card}\n\n{malware_card}\n  </div>\n{footer}"

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("HTML fixed successfully!")
