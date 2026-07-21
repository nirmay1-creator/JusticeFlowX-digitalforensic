import re

with open('justice.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix innerHTML = \n to innerHTML = \n for the module loaders
# For radar
content = content.replace('innerHTML = \n    <div class="loader-radar">', 'innerHTML = \n    <div class="loader-radar">')
content = content.replace('INITIALIZING SNIFFER...</div>\n  ;', 'INITIALIZING SNIFFER...</div>\n  ;')

# For analyzer
content = content.replace('innerHTML = \n    <div class="loader-hex">', 'innerHTML = \n    <div class="loader-hex">')
content = content.replace('DECRYPTING PCAP STREAM...</div>\n  ;', 'DECRYPTING PCAP STREAM...</div>\n  ;')

# For traffic
content = content.replace('innerHTML = \n    <div class="loader-topology">', 'innerHTML = \n    <div class="loader-topology">')
content = content.replace('BUILDING TOPOLOGY...</div>\n  ;', 'BUILDING TOPOLOGY...</div>\n  ;')

# For threat
content = content.replace('innerHTML = \n    <div class="loader-threat">', 'innerHTML = \n    <div class="loader-threat">')
content = content.replace('QUERYING THREAT FEEDS...</div>\n  ;', 'QUERYING THREAT FEEDS...</div>\n  ;')

with open('justice.js', 'w', encoding='utf-8') as f:
    f.write(content)
