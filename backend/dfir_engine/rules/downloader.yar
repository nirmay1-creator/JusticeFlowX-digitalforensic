rule Suspicious_Downloader {
    meta:
        description = "Detects simple downloader execution chains"
        author = "JusticeFlowX"
        category = "Downloader"
        severity = "HIGH"

    strings:
        $api1 = "URLDownloadToFile" ascii fullword nocase
        $api2 = "InternetOpenUrl" ascii fullword nocase
        $api3 = "WinHttpOpen" ascii fullword nocase
        
        $exec1 = "WinExec" ascii fullword
        $exec2 = "ShellExecute" ascii fullword nocase
        $exec3 = "CreateProcess" ascii fullword nocase

    condition:
        (1 of ($api*)) and (1 of ($exec*))
}
