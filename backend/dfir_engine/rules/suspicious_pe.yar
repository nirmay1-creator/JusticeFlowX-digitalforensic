rule Anti_Debug_Evasion {
    meta:
        description = "Detects multiple anti-debugging and evasion techniques"
        author = "JusticeFlowX"
        category = "Evasion"
        severity = "HIGH"

    strings:
        $d1 = "IsDebuggerPresent" ascii fullword
        $d2 = "CheckRemoteDebuggerPresent" ascii fullword
        $d3 = "OutputDebugString" ascii fullword
        $d4 = "FindWindow" ascii fullword
        
        $env1 = "VBoxService" ascii wide nocase
        $env2 = "VMware" ascii wide nocase
        $env3 = "SbieDll" ascii wide nocase

    condition:
        2 of ($d*) or 1 of ($env*)
}

rule Process_Hollowing {
    meta:
        description = "Detects API pattern used in Process Hollowing"
        author = "JusticeFlowX"
        category = "Injection"
        severity = "CRITICAL"
        
    strings:
        $api1 = "CreateProcess" ascii fullword
        $api2 = "NtUnmapViewOfSection" ascii fullword
        $api3 = "VirtualAllocEx" ascii fullword
        $api4 = "WriteProcessMemory" ascii fullword
        $api5 = "GetThreadContext" ascii fullword
        $api6 = "SetThreadContext" ascii fullword
        $api7 = "ResumeThread" ascii fullword

    condition:
        4 of them
}
