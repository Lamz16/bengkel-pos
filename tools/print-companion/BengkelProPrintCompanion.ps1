param(
    [Parameter(Mandatory=$true)][string[]]$AllowedOrigins
)
$ErrorActionPreference = 'Stop'
# Run with Windows PowerShell 5.1. Read-only capabilities: no job submission endpoint.
Add-Type -AssemblyName System.Drawing
foreach ($origin in $AllowedOrigins) {
    $uri = [Uri]$origin
    if (!$uri.IsAbsoluteUri -or $uri.Scheme -notin @('http','https') -or $uri.GetLeftPart([UriPartial]::Authority) -cne $origin) {
        throw 'AllowedOrigins must contain exact HTTP(S) origins without paths or trailing slashes.'
    }
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:17843/')
$listener.Start()
Write-Host 'BengkelPro printer detection: loopback port 17843. Ctrl+C to stop.'
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        try {
            $origin = $request.Headers['Origin']
            if ($request.UserHostName -cne '127.0.0.1:17843' -or !$origin -or $AllowedOrigins -cnotcontains $origin) {
                $response.StatusCode = 403
                continue
            }
            $response.Headers.Add('Access-Control-Allow-Origin', $origin)
            $response.Headers.Add('Vary', 'Origin')
            $response.Headers.Add('Cache-Control', 'no-store')
            if ($request.HttpMethod -eq 'OPTIONS') {
                $response.Headers.Add('Access-Control-Allow-Methods', 'GET, OPTIONS')
                $response.Headers.Add('Access-Control-Allow-Private-Network', 'true')
                $response.StatusCode = 204
                continue
            }
            if ($request.HttpMethod -ne 'GET' -or $request.Url.AbsolutePath -ne '/printers') {
                $response.StatusCode = 404
                continue
            }
            $drivers = @{}
            Get-CimInstance Win32_Printer | ForEach-Object { $drivers[$_.Name] = $_.DriverName }
            $printers = @()
            foreach ($name in [System.Drawing.Printing.PrinterSettings]::InstalledPrinters) {
                try {
                    $settings = New-Object System.Drawing.Printing.PrinterSettings
                    $settings.PrinterName = $name
                    $page = $settings.DefaultPageSettings
                    # Windows uses hundredths of an inch; do not treat nominal paper width as printable width.
                    $factor = 0.254
                    $paper = $page.PaperSize.Width * $factor
                    $area = $page.PrintableArea
                    $width = $area.Width * $factor
                    $left = $area.X * $factor
                    $right = [Math]::Max(0, $paper - $left - $width)
                    if ($paper -lt 40 -or $paper -gt 300 -or $width -lt 25 -or $left -lt 0 -or ($left + $width) -gt ($paper + 0.01)) { continue }
                    $papers = @($settings.PaperSizes | ForEach-Object {
                        @{name=$_.PaperName; widthMm=[Math]::Round($_.Width * $factor, 3); heightMm=[Math]::Round($_.Height * $factor, 3)}
                    })
                    $printers += @{id=$name; name=$name; driver=[string]$drivers[$name]; paperMm=$paper;
                        printableMm=$width; leftMm=$left; rightMm=$right; papers=$papers}
                } catch { Write-Warning "Cannot read capabilities for $name" }
            }
            $json = @{version=1; printers=@($printers)} | ConvertTo-Json -Depth 6 -Compress
            $bytes = [Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = 'application/json; charset=utf-8'
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch { $response.StatusCode = 503 }
        finally { $response.Close() }
    }
} finally { $listener.Stop(); $listener.Close() }
