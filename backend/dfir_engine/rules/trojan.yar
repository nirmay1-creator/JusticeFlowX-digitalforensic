rule Generic_Trojan_Keylogger {
    meta:
        description = "Detects keylogger API combinations often used in trojans"
        author = "JusticeFlowX"
        category = "Spyware/Trojan"
        severity = "HIGH"

    strings:
        $k1 = "SetWindowsHookEx" ascii fullword
        $k2 = "GetAsyncKeyState" ascii fullword
        $k3 = "GetKeyState" ascii fullword
        $k4 = "GetForegroundWindow" ascii fullword
        $k5 = "GetWindowText" ascii fullword
        
        $c1 = "InternetOpen" ascii fullword
        $c2 = "socket" ascii fullword
        $c3 = "send" ascii fullword

    condition:
        (2 of ($k*)) and (1 of ($c*))
}

rule RAT_Commands {
    meta:
        description = "Detects common strings used for Remote Access Trojan commands"
        author = "JusticeFlowX"
        category = "Trojan"
        severity = "CRITICAL"
        
    strings:
        $cmd1 = "download_execute" ascii wide nocase
        $cmd2 = "start_keylogger" ascii wide nocase
        $cmd3 = "stop_keylogger" ascii wide nocase
        $cmd4 = "screen_capture" ascii wide nocase
        $cmd5 = "list_processes" ascii wide nocase
        $cmd6 = "kill_process" ascii wide nocase
        $cmd7 = "uninstall_bot" ascii wide nocase

    condition:
        2 of ($cmd*)
}
