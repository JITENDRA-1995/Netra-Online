$p = "src/App.css"
$c = Get-Content $p
if ($c[3803] -eq "}") {
    $newContent = $c[0..3802] + $c[3804..($c.Length-1)]
    $newContent | Set-Content $p
    Write-Host "Fixed"
} else {
    Write-Host "Line 3804 is: $($c[3803])"
}
