# Scrape YouTube and PubMed for training data
param(
    [string]$youtubeUrls,
    [string]$pubmedQueries
)

$youtubeApiKey = $env:YOUTUBE_API_KEY
$pubmedApiKey = $env:PUBMED_API_KEY

$data = @()

# YouTube scraping
$urls = $youtubeUrls -split ','
foreach ($url in $urls) {
    $videoId = $url -replace '.*v=', '' -replace '&.*', ''
    try {
        $response = Invoke-RestMethod -Uri "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=$videoId&key=$youtubeApiKey"
        $data += @{
            type = 'youtube'
            videoId = $videoId
            title = $response.items[0].snippet.title
            description = $response.items[0].snippet.description
        }
    } catch {
        Write-Host "Error fetching YouTube data for $videoId"
    }
}

# PubMed scraping (mock)
$queries = $pubmedQueries -split ','
foreach ($query in $queries) {
    try {
        # Mock PubMed API call
        $data += @{
            type = 'pubmed'
            query = $query
            articles = @('Article1', 'Article2')
        }
    } catch {
        Write-Host "Error fetching PubMed data for $query"
    }
}

$data | ConvertTo-Json | Out-File "training-data.json"

# Upload to Fly.io
flyctl files upload training-data.json adaptive-fit-api --path /data/training

Write-Host "Training data imported successfully"