import re
with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()
ids = re.findall(r'id="(scanBox\d+)"', html)
print('Card IDs:', ids)
print('Count:', len(ids))
dupes = set([x for x in ids if ids.count(x) > 1])
print('Duplicates:', dupes if dupes else 'NONE - All clean!')
