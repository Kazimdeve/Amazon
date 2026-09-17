$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $utf8 = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Find-SessionLog {
    param(
        [Parameter(Mandatory = $true)][string]$LogDirectory,
        [Parameter(Mandatory = $true)][string]$SessionId
    )

    $files = Get-ChildItem -LiteralPath $LogDirectory -Filter "*_$SessionId.md" -File -ErrorAction SilentlyContinue
    if ($files.Count -gt 0) {
        return $files[0].FullName
    }

    return $null
}

function New-LogContent {
    param(
        [Parameter(Mandatory = $true)][string]$SessionId,
        [Parameter(Mandatory = $true)][string]$Timestamp,
        [Parameter(Mandatory = $true)][string]$Model,
        [Parameter(Mandatory = $true)][string]$Project,
        [Parameter(Mandatory = $true)][string]$Author
    )

    $date = ([DateTimeOffset]::Parse($Timestamp)).UtcDateTime.ToString('yyyy-MM-dd')
    $shortSession = $SessionId.Substring(0, [Math]::Min(8, $SessionId.Length))

    return @"
---
session_id: $SessionId
date: $date
author: $Author
model: $Model
tool: codex-desktop
project: $Project
total_exchanges: 0
first_prompt_time: $Timestamp
last_prompt_time: $Timestamp
---

# Session Log - $date

Session: ``$shortSession`` | Project: ``$Project`` | Author: ``$Author``

---
"@
}

try {
    $inputStream = [Console]::OpenStandardInput()
    $inputBuffer = [System.IO.MemoryStream]::new()
    $inputStream.CopyTo($inputBuffer)
    $rawInput = [System.Text.Encoding]::UTF8.GetString($inputBuffer.ToArray())
    $event = $rawInput | ConvertFrom-Json

    $workspace = [string]$event.cwd
    if ([string]::IsNullOrWhiteSpace($workspace)) {
        $workspace = (Get-Location).Path
    }

    $logDirectory = Join-Path $workspace '.agent-logs'
    [System.IO.Directory]::CreateDirectory($logDirectory) | Out-Null

    $sessionId = [string]$event.session_id
    $model = [string]$event.model
    if ([string]::IsNullOrWhiteSpace($model)) {
        $model = 'unknown'
    }

    $timestamp = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    $project = Split-Path -Leaf $workspace
    $projectSlug = $project.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $projectSlug = $projectSlug.Trim('-')
    $author = 'Kazimdeve'

    $logPath = Find-SessionLog -LogDirectory $logDirectory -SessionId $sessionId
    if ($null -eq $logPath) {
        $fileStamp = ([DateTimeOffset]::Parse($timestamp)).UtcDateTime.ToString('yyyy-MM-dd_HH-mm-ss')
        $logPath = Join-Path $logDirectory "${fileStamp}_${sessionId}.md"
        $content = New-LogContent -SessionId $sessionId -Timestamp $timestamp -Model $model -Project $projectSlug -Author $author
    }
    else {
        $content = [System.IO.File]::ReadAllText($logPath)
    }

    $promptMatches = [regex]::Matches($content, '(?m)^\[LOG_ENTRY type=PROMPT num=(\d+) session=')
    $promptCount = $promptMatches.Count

    if ($event.hook_event_name -eq 'UserPromptSubmit') {
        $entryNumber = $promptCount + 1
        $prompt = [string]$event.prompt
        $entry = "`r`n`r`n[LOG_ENTRY type=PROMPT num=$entryNumber session=$($sessionId.Substring(0, [Math]::Min(8, $sessionId.Length)))]`r`ntimestamp: $timestamp`r`nmodel: $model`r`n`r`n$prompt`r`n"
        $content += $entry

        $content = [regex]::Replace($content, '(?m)^total_exchanges: \d+$', "total_exchanges: $entryNumber")
        if ($entryNumber -eq 1) {
            $content = [regex]::Replace($content, '(?m)^first_prompt_time: .+$', "first_prompt_time: $timestamp")
        }
        $content = [regex]::Replace($content, '(?m)^last_prompt_time: .+$', "last_prompt_time: $timestamp")
        $content = [regex]::Replace($content, '(?m)^model: .+$', "model: $model", 1)
    }
    elseif ($event.hook_event_name -eq 'Stop') {
        $response = [string]$event.last_assistant_message
        if (-not [string]::IsNullOrEmpty($response)) {
            $entryNumber = [Math]::Max(1, $promptCount)
            $shortSession = $sessionId.Substring(0, [Math]::Min(8, $sessionId.Length))
            $entry = "`r`n`r`n[LOG_ENTRY type=RESPONSE num=$entryNumber session=$shortSession]`r`ntimestamp: $timestamp`r`nmodel: $model`r`n`r`n$response`r`n"
            $content += $entry
        }
    }

    Write-Utf8NoBom -Path $logPath -Content $content
    [Console]::Out.Write('{}')
}
catch {
    [Console]::Error.WriteLine("8x capture hook failed: $($_.Exception.Message)")
    exit 1
}
