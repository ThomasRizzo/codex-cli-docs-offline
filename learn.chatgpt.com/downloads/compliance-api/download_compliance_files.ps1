#!/usr/bin/env pwsh
#Requires -Version 5.1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.Net.Http

function Show-Usage {
    [Console]::Error.WriteLine(@"
Usage: .\download_compliance_files.ps1 <workspace_or_org_id> <event_type> <limit> <after>

Example:
  # PowerShell 7 (UTF-8 without a byte-order mark)
  `$env:COMPLIANCE_API_KEY = '<KEY>'
  .\download_compliance_files.ps1 "<workspace_id>" AUTH_LOG 100 ([DateTime]::UtcNow.AddDays(-1)).ToString('yyyy-MM-ddTHH:mm:ssZ') |
    Set-Content -Encoding utf8NoBOM output.jsonl

Example (org id):
  # PowerShell 7 (UTF-8 without a byte-order mark)
  `$env:COMPLIANCE_API_KEY = '<KEY>'
  .\download_compliance_files.ps1 "<org_id>" AUTH_LOG 100 ([DateTime]::UtcNow.AddDays(-1)).ToString('yyyy-MM-ddTHH:mm:ssZ') |
    Set-Content -Encoding utf8NoBOM output.jsonl
"@)
}

if ($args.Count -ne 4) {
    Show-Usage
    exit 2
}

if (-not $env:COMPLIANCE_API_KEY) {
    [Console]::Error.WriteLine('COMPLIANCE_API_KEY environment variable must be set.')
    exit 2
}

$PrincipalId = $args[0]
$EventType = $args[1]
$Limit = $args[2]
$InitialAfter = $args[3]

$ApiBase = 'https://api.chatgpt.com/v1/compliance'

if ($PrincipalId.StartsWith('org-')) {
    $ScopeSegment = 'organizations'
} else {
    $ScopeSegment = 'workspaces'
}

$handler = [System.Net.Http.HttpClientHandler]::new()
$client = [System.Net.Http.HttpClient]::new($handler)
$client.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $env:COMPLIANCE_API_KEY)

function Invoke-ComplianceRequest {
    param(
        [Parameter(Mandatory = $true)] [string] $Description,
        [Parameter(Mandatory = $true)] [string] $Path,
        [hashtable] $Query = @{}
    )

    $builder = [System.UriBuilder]::new("$ApiBase/$ScopeSegment/$PrincipalId/$Path")
    $queryString = [System.Web.HttpUtility]::ParseQueryString($builder.Query)
    foreach ($key in $Query.Keys) {
        $queryString[$key] = $Query[$key]
    }
    $builder.Query = $queryString.ToString()

    try {
        $response = $client.GetAsync($builder.Uri).GetAwaiter().GetResult()
    } catch {
        [Console]::Error.WriteLine("Network/transport error while $Description")
        exit 1
    }

    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
        [Console]::Error.WriteLine("HTTP error $($response.StatusCode.value__) while ${Description}:")
        if ($body) {
            try {
                $parsed = $body | ConvertFrom-Json
                $parsed | ConvertTo-Json -Depth 10 | Write-Error
            } catch {
                [Console]::Error.WriteLine($body)
            }
        }
        exit 1
    }

    Write-Output $body.TrimEnd([char[]]"`r`n")
}

function List-Logs {
    param(
        [Parameter(Mandatory = $true)] [string] $After
    )

    Invoke-ComplianceRequest -Description "listing logs (after=$After, event_type=$EventType, limit=$Limit)" -Path 'logs' -Query @{
        limit      = $Limit
        event_type = $EventType
        after      = $After
    }
}

function Download-Log {
    param(
        [Parameter(Mandatory = $true)] [string] $Id
    )

    [Console]::Error.WriteLine("Fetching logs for ID: $Id")
    Invoke-ComplianceRequest -Description "downloading log id=$Id" -Path "logs/$Id"
}

$currentAfter = $InitialAfter
$page = 1
$totalDownloaded = 0
while ($true) {
    [Console]::Error.WriteLine("Fetching page $page with after='$currentAfter'")
    $responseJson = List-Logs -After $currentAfter
    $responseObj = $responseJson | ConvertFrom-Json

    $pageCount = $responseObj.data.Count
    if ($pageCount -gt 0) {
        foreach ($entry in $responseObj.data) {
            Download-Log -Id $entry.id
        }
        $totalDownloaded += $pageCount
    }

    $hasMore = $false
    if ($null -ne $responseObj.has_more) {
        $hasMore = [System.Convert]::ToBoolean($responseObj.has_more)
    }

    $currentAfter = $responseObj.last_end_time
    # PowerShell 7 parses JSON timestamps as DateTime; 5.1 preserves strings.
    if ($currentAfter -is [datetime]) {
        $currentAfter = $currentAfter.ToUniversalTime().ToString('o', [Globalization.CultureInfo]::InvariantCulture)
    }
    if ($hasMore) {
        $page += 1
    } else {
        break
    }
}

if ($totalDownloaded -eq 0 -and ([string]::IsNullOrEmpty($currentAfter) -or $currentAfter -eq 'null')) {
    [Console]::Error.WriteLine("No results found for event_type $EventType after $InitialAfter")
} else {
    [Console]::Error.WriteLine("Completed downloading $totalDownloaded log files up to $currentAfter")
}

$client.Dispose()
$handler.Dispose()
