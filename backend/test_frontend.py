from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
driver.get("http://127.0.0.1:5500/frontend/modules/justicegpt/justicegpt.html")
time.sleep(2)

# Send a message
driver.execute_script("document.getElementById('chatInput').value = 'hello';")
driver.execute_script("document.getElementById('sendBtn').click();")
time.sleep(4)

driver.save_screenshot("screenshot.png")

print("BROWSER LOGS:")
for entry in driver.get_log('browser'):
    print(entry)
driver.quit()
