Write-Host "=== Deploying Backend to AWS Lambda ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FunctionName = "learninghub-backend"
$BackendPath = "Backend"
$ZipPath = "$BackendPath\function.zip"
$Region = "ap-southeast-1" # AWS Region

# Parse command line arguments
$ForceInstall = $false
if ($args -contains "--force-install" -or $args -contains "-f") {
    $ForceInstall = $true
}

# Kiểm tra AWS CLI
Write-Host "Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "[OK] AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Kiểm tra AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --region $Region 2>&1
    if ($LASTEXITCODE -eq 0) {
        $identityObj = $awsIdentity | ConvertFrom-Json
        Write-Host "[OK] AWS credentials valid" -ForegroundColor Green
        Write-Host "  Account: $($identityObj.Account)" -ForegroundColor Gray
        Write-Host "  User/Role: $($identityObj.Arn)" -ForegroundColor Gray
    } else {
        Write-Host "[ERROR] AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to verify AWS credentials: $_" -ForegroundColor Red
    exit 1
}

# Kiểm tra Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Xóa file zip cũ nếu tồn tại
if (Test-Path $ZipPath) {
    Write-Host "Removing old zip file..." -ForegroundColor Yellow
    Remove-Item $ZipPath -Force
}

# Cài dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
Set-Location $BackendPath

if ($ForceInstall -or -not (Test-Path "node_modules")) {
    if ($ForceInstall) {
        Write-Host "Force install requested, removing node_modules..." -ForegroundColor Yellow
        if (Test-Path "node_modules") {
            Remove-Item "node_modules" -Recurse -Force
        }
    }
    Write-Host "Running npm install..." -ForegroundColor Yellow
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "[OK] node_modules exists, skipping npm install" -ForegroundColor Green
    Write-Host "  (Use --force-install to reinstall)" -ForegroundColor Gray
}

# Zip các file cần thiết
Write-Host "`nCreating deployment package..." -ForegroundColor Yellow
if (Test-Path "function.zip") { 
    Remove-Item "function.zip" -Force 
}

# Lấy tất cả file và folder cần thiết
$itemsToZip = @(
    "src",
    "lambda.js",
    "node_modules",
    "package.json",
    "package-lock.json"
)

# Kiểm tra các file/folder tồn tại
foreach ($item in $itemsToZip) {
    if (-not (Test-Path $item)) {
        Write-Host "[ERROR] Missing required file/folder: $item" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Zip vào function.zip
Compress-Archive -Path $itemsToZip -DestinationPath "function.zip" -Force

# Kiểm tra file size (Lambda limit: 50MB zipped, 250MB unzipped)
$zipFile = Get-Item "function.zip"
$zipSizeMB = [math]::Round($zipFile.Length / 1MB, 2)
Write-Host "[OK] Package created: $($zipFile.Name) ($zipSizeMB MB)" -ForegroundColor Green

if ($zipSizeMB -gt 50) {
    $warningMsg = "[WARNING] Package size ($zipSizeMB MB) exceeds Lambda's 50MB limit!"
    Write-Host $warningMsg -ForegroundColor Yellow
    Write-Host "  Consider using Lambda Layers or S3 deployment." -ForegroundColor Yellow
}

Set-Location ..

# Deploy lên Lambda
Write-Host "`nUploading to Lambda..." -ForegroundColor Yellow
try {
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$ZipPath" `
        --region $Region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n=== Deploy Successful ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Function Details:" -ForegroundColor Cyan
        Write-Host "  Name: $FunctionName" -ForegroundColor White
        Write-Host "  Region: $Region" -ForegroundColor White
        $sizeMsg = "  Package size: $zipSizeMB MB"
        Write-Host $sizeMsg -ForegroundColor White
        Write-Host ""
        
        # Lấy thông tin Lambda function
        Write-Host "Fetching Lambda function info..." -ForegroundColor Yellow
        try {
            $lambdaInfo = aws lambda get-function `
                --function-name $FunctionName `
                --region $Region `
                --query 'Configuration.[Runtime,MemorySize,Timeout,LastModified]' `
                --output text 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $info = $lambdaInfo -split "`t"
                if ($info.Length -gt 0) {
                    Write-Host "  Runtime: $($info[0])" -ForegroundColor White
                }
                if ($info.Length -gt 1) {
                    $memoryMsg = "  Memory: $($info[1]) MB"
                    Write-Host $memoryMsg -ForegroundColor White
                }
                if ($info.Length -gt 2) {
                    Write-Host "  Timeout: $($info[2]) seconds" -ForegroundColor White
                }
                if ($info.Length -gt 3) {
                    Write-Host "  Last Modified: $($info[3])" -ForegroundColor White
                }
            }
        } catch {
            Write-Host "  (Could not fetch function details)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "API Gateway URL:" -ForegroundColor Cyan
        Write-Host "  https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Test Lambda function in AWS Console" -ForegroundColor White
        Write-Host "  2. Check CloudWatch Logs for any errors" -ForegroundColor White
        Write-Host "  3. Test API Gateway endpoint" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "`n[ERROR] Deploy failed!" -ForegroundColor Red
        Write-Host "Check the error message above for details." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "`n[ERROR] Error deploying to Lambda: $_" -ForegroundColor Red
    exit 1
}
