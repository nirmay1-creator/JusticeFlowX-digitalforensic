import os

frontend_dir = r'c:\Users\Nirmay Rinesh\Desktop\justiceflowx\frontend'

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.jsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            new_content = new_content.replace('Cyber v3.0', 'Cyber Verification System 3.0')
            new_content = new_content.replace('Cyber v3', 'Cyber Verification System 3.0')
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")
