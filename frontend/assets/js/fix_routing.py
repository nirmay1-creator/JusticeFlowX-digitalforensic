import re

with open('justice.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace initScanButtons routing
content = re.sub(
    r'switch \(type\) \{\s*case "finger":[\s\S]*?default:\s*showFingerprintOverlay\(afterScan\); break;\s*\}',
    '''switch (type) {
          case "capture":  showCaptureOverlay(afterScan);     break;
          case "analyzer": showAnalyzerOverlay(afterScan);    break;
          case "threat":   showThreatOverlay(afterScan);      break;
          case "forensics":showTrafficOverlay(afterScan);     break;
          default:         showCaptureOverlay(afterScan);     break;
        }''',
    content
)

# Replace old initScanButtons if it is using other names
content = re.sub(
    r'case "finger":\s*showFingerprintOverlay\(afterScan\); break;',
    'case "capture": showCaptureOverlay(afterScan); break;',
    content
)

with open('justice.js', 'w', encoding='utf-8') as f:
    f.write(content)
