rule Ransomware_Note {
    meta:
        description = "Detects common ransomware note strings and instructions"
        author = "JusticeFlowX"
        category = "Ransomware"
        severity = "CRITICAL"
        
    strings:
        $s1 = "All your files have been encrypted" nocase
        $s2 = "Your network has been compromised" nocase
        $s3 = "to decrypt your files" nocase
        $s4 = "pay the ransom" nocase
        $s5 = "Bitcoin address:" nocase
        $s6 = "DECRYPT_FILES.txt" nocase
        $s7 = "HOW_TO_RECOVER" nocase
        $s8 = "contact us at" nocase
        $s9 = "Tor browser" nocase
        $s10 = ".onion" nocase

    condition:
        2 of them
}

rule High_Entropy_Crypto {
    meta:
        description = "Detects crypto API usage common in ransomware"
        author = "JusticeFlowX"
        category = "Ransomware"
        severity = "HIGH"

    strings:
        $api1 = "CryptAcquireContext" ascii fullword
        $api2 = "CryptGenKey" ascii fullword
        $api3 = "CryptEncrypt" ascii fullword
        $api4 = "BCryptEncrypt" ascii fullword
        $api5 = "CryptExportKey" ascii fullword
        
        $ext_enum = "FindFirstFile" ascii fullword
        $ext_enum2 = "FindNextFile" ascii fullword

    condition:
        (2 of ($api*)) and (1 of ($ext*))
}
