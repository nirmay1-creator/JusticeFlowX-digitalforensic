with open('frontend/modules/chain_of_custody/chain.css', 'a', encoding='utf-8') as f:
    f.write('''
/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.input-group label {
  display: block;
  font-family: 'Share Tech Mono', monospace;
  color: var(--cyan);
  font-size: 12px;
  margin-bottom: 5px;
}

/* Export Toolbar */
.export-toolbar {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 15px 40px;
  background: rgba(0,0,0,0.4);
  border-bottom: 1px solid var(--border);
}
.export-toolbar button {
  background: rgba(0, 210, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 15px;
  border-radius: 4px;
  font-family: 'Share Tech Mono', monospace;
  cursor: pointer;
  transition: all 0.3s;
}
.export-toolbar button:hover {
  background: rgba(0, 210, 255, 0.2);
  border-color: var(--cyan);
  color: var(--cyan);
}

/* Modal for Tech Stack */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0; top: 0; width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.8);
  backdrop-filter: blur(5px);
}
.modal.show {
  display: block;
}
.modal-content {
  background-color: var(--panel-bg);
  border: 1px solid var(--cyan);
  margin: 5% auto;
  padding: 30px;
  width: 80%;
  max-width: 1000px;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(0, 210, 255, 0.2);
}
.close {
  color: var(--cyan);
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}
.close:hover { color: #fff; }
.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.tech-col h3 {
  color: var(--gold);
  font-family: 'Share Tech Mono', monospace;
  border-bottom: 1px solid var(--border);
  padding-bottom: 5px;
  margin-top: 15px;
  margin-bottom: 10px;
}
.tech-col ul {
  list-style: none;
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}
.tech-col li { margin-bottom: 5px; }
.tech-col li::before {
  content: "? ";
  color: var(--cyan);
}
.tech-btn {
  background: transparent;
  border: 1px solid var(--cyan);
  color: var(--cyan);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Share Tech Mono', monospace;
  transition: all 0.3s;
}
.tech-btn:hover {
  background: var(--cyan);
  color: #000;
}
''')
