import re

with open('backend/doc_server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix year logic
old_logic = '''
    # Check if year is in range
    year_in_range = True
    match = re.search(r'\d{4}', serial_upper)
    if match:
        y = int(match.group(0))
        if not (1990 <= y <= 2026):
            year_in_range = False
'''

new_logic = '''
    # Check if year is in range (only for docs that include a year)
    year_in_range = True
    if doc_type in ['national_id', 'drivers_license']:
        match = re.search(r'\d{4}', serial_upper)
        if match:
            y = int(match.group(0))
            if not (1990 <= y <= 2026):
                year_in_range = False
        else:
            # If it requires a year and doesn't have one, it's invalid
            year_in_range = False
'''

content = content.replace(old_logic, new_logic)

with open('backend/doc_server.py', 'w', encoding='utf-8') as f:
    f.write(content)
