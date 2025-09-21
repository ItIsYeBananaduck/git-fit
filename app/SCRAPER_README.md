# RSS Article Scraper for Git-Fit AI Training

This script scrapes full articles from URLs in a Coda "Health Feeds" table, processes them for relevance, and creates a JSONL dataset for fine-tuning GPT-2 models.

## Features

- ✅ **Robots.txt Compliance**: Checks `robots.txt` before scraping any site
- ✅ **Coda Integration**: Updates scrapeable status back to Coda table
- ✅ **Content Filtering**: Filters out irrelevant articles and junk content
- ✅ **Smart Summarization**: Creates concise summaries (~100 words) for training
- ✅ **Error Handling**: Graceful handling of network errors, timeouts, and invalid content
- ✅ **Rate Limiting**: Respectful scraping with delays between requests

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements-scraper.txt
```

### 2. Configure Environment

Copy the example environment file and fill in your Coda API credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

- `CODA_API_TOKEN`: Get from [Coda Account Settings](https://coda.io/account)
- `DOC_ID`: Your Coda document ID (from the URL)
- `TABLE_ID`: Your "Health Feeds" table ID

### 3. Prepare Input Data

Export your Coda "Health Feeds" table as JSON and save to `data/health_feeds.json`. The expected format is:

```json
[
	{
		"Title": "Article Title",
		"Link": "https://example.com/article",
		"Description": "Article description...",
		"Published Date": "2025-09-20",
		"Feed": "Feed Name",
		"RowId": "i-abc123"
	}
]
```

## Usage

### Basic Usage

```bash
python scrape_articles.py
```

This will:

1. Load articles from `data/health_feeds.json`
2. Check robots.txt for each URL
3. Update Coda with scrapeable status
4. Scrape allowed articles
5. Filter for relevant fitness/nutrition content
6. Create summaries and save to `rss_knowledge.jsonl`

### Output

- **rss_knowledge.jsonl**: JSONL dataset for GPT-2 fine-tuning
- **Console logs**: Progress and any errors encountered
- **Coda updates**: "Scrapeable" column updated in your table

## Content Filtering

### Included Articles

Articles must contain relevant keywords in title or description:

- `nutrition`, `diet`, `protein`, `meal`
- `hypertrophy`, `powerlifting`, `recomposition`
- `mobility`, `strength`, `training`, `exercise`
- `workout`, `fitness`, `health`, `supplement`
- `recovery`, `endurance`, `flexibility`

### Excluded Articles

Articles containing junk keywords are skipped:

- `famine`, `cholera`, `trachoma`, `malaria`
- `versagrips`, `geniusshot`, `app`
- `download`, `subscribe`, `newsletter`
- `advertisement`, `sponsored`, `promotion`

## Technical Details

### Robots.txt Checking

- Uses Python's `urllib.robotparser`
- Checks for user-agent `*` (all bots)
- Assumes allowed if robots.txt is missing or unreachable

### Content Extraction

- Removes `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>` tags
- Extracts text from `<p>`, `<div>`, `<article>`, `<section>` tags
- Filters out layout-heavy elements
- Sanitizes JavaScript links and excessive whitespace

### Summarization

- Limits to ~100 words
- Truncates with "..." if longer
- Preserves most important content

### Error Handling

- Network timeouts (30s)
- HTTP errors (404, 403, etc.)
- Invalid HTML/XML
- Missing robots.txt
- Coda API failures

## Integration with AI Training

The output `rss_knowledge.jsonl` can be combined with your existing training data:

```bash
# Combine with existing scripts
cat scripts.jsonl rss_knowledge.jsonl > combined_training.jsonl

# Fine-tune the model
python fine_tune.py
```

## Troubleshooting

### Common Issues

1. **Coda API Errors**: Check your API token and document/table IDs
2. **Robots.txt Blocking**: Some sites block all automated access
3. **Scraping Failures**: Sites may use JavaScript or have anti-bot measures
4. **Empty Output**: Articles may not match relevance criteria

### Debugging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Rate Limiting

The script includes a 1-second delay between requests. For large datasets, consider:

- Running in batches
- Increasing delays
- Using multiple IP addresses
- Checking with site owners for API access

## Safety & Ethics

- ✅ Respects robots.txt directives
- ✅ Identifies as educational research bot
- ✅ Includes reasonable delays between requests
- ✅ Filters out irrelevant/personal content
- ✅ Handles errors gracefully without retry spam

## License

Part of the Git-Fit project. Follows the same licensing terms.
