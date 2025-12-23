# Simple Deploy Script
Write-Host "Starting Deployment..."

# Define GH path
$GH_PATH = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $GH_PATH)) { $GH_PATH = "gh" }

# 1. Check GitHub Auth
echo "Checking GitHub authentication..."
& $GH_PATH auth status
if ($LASTEXITCODE -ne 0) {
    echo "Please login to GitHub first:"
    & $GH_PATH auth login -p https -w
}

# 2. Push to GitHub
echo "Pushing code to GitHub..."
git remote remove origin
git remote add origin https://github.com/DanielDawodu/bling.git
git branch -M main
git push -u origin main

# 3. Deploy to Vercel
echo "Starting Vercel Deployment..."
npx vercel --prod

echo "Deployment Initialized!"
echo "REMINDER: Set your Environment Variables in Vercel Dashboard!"
