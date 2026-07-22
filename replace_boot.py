import os
frontend_dir = r'c:\Users\Nirmay Rinesh\Desktop\justiceflowx\frontend'
for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.jsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f: content = f.read()
            new_content = content
            new_content = new_content.replace('BIOMETRIC VERIFICATION SYSTEM v2.4', 'DIGITAL FORENSICS SYSTEM 3.0')
            new_content = new_content.replace('Initializing biometric subsystem...', 'Initializing digital forensics subsystem...')
            new_content = new_content.replace('Biometric reader — standby mode', 'Forensic analysis engine — standby mode')
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f: f.write(new_content)
                print(f'Updated: {filepath}')