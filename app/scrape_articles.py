
"""
RSS Article Scraper for Git-Fit AI Training Data

Scrapes full articles from URLs in Coda 'Health Feeds' table, checks robots.txt,
updates Coda with 'Scrapeable' status (True=allowed, False=blocked), filters content,
summarizes articles, and creates a JSONL dataset for GPT-2 fine-tuning.
"""

import json
import os
import re
import time
import logging
from typing import Dict, List, Optional
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ArticleScraper:
    """Main scraper class for processing RSS articles from Coda feeds."""

    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.coda_token = os.getenv('CODA_API_TOKEN')
        self.doc_id = os.getenv('DOC_ID')
        self.table_id = os.getenv('TABLE_ID')

        if not all([self.coda_token, self.doc_id, self.table_id]):
            raise ValueError("Missing required environment variables: CODA_API_TOKEN, DOC_ID, TABLE_ID")

        # Setup session with reasonable timeouts
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Git-Fit-Research-Bot/1.0 (Educational Research)'
        })

        # Keywords for filtering
        self.junk_keywords = [
            'famine', 'cholera', 'trachoma', 'malaria', 'versagrips',
            'geniusshot', 'app', 'download', 'subscribe', 'newsletter',
            'advertisement', 'sponsored', 'promotion', 'get started with a coach',
            'join the conversation', 'share link', 'coaching toolkit', 'ecookbook',
            'community forum', 'video can’t be loaded', 'warrior games',
            'checklist', 'travel', 'budget', 'hotrod', 'burnout'
        ]

        self.relevant_keywords = [
            'nutrition', 'diet', 'protein', 'meal', 'hypertrophy',
            'powerlifting', 'recomp', 'mobility', 'strength',
            'training', 'exercise', 'workout', 'fitness', 'health',
            'supplement', 'recovery', 'endurance', 'flexibility',
            'hrv', 'spo2', 'heart rate'
        ]

        self.evidence_keywords = [
            'study', 'research', 'evidence', 'dr.', 'ph.d.', 'israetel',
            'norton', 'trexler', 'wilcox', 'peer-reviewed', 'clinical',
            'meta-analysis', 'correlation', 'myth'
        ]

        # Content threshold for articles/abstracts
        self.content_threshold = 30  # Lowered for PubMed abstracts
        self.max_words = 150

    def load_feed_data(self, filepath: str = 'data/health_feeds.json') -> List[Dict]:
        """Load feed data from JSON file exported from Coda."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if not isinstance(data, list):
                logger.error(f"Invalid JSON format in {filepath}: Expected a list")
                return []
            logger.info(f"Loaded {len(data)} articles from {filepath}")
            return data
        except FileNotFoundError:
            logger.error(f"File not found: {filepath}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {filepath}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error loading {filepath}: {e}")
            return []

    def check_robots_txt(self, url: str) -> bool:
        """Check if scraping is allowed by robots.txt for the given URL."""
        try:
            parsed_url = urlparse(url)
            robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
            response = self.session.get(robots_url, timeout=10)
            if response.status_code == 404:
                logger.debug(f"No robots.txt found for {url} - assuming allowed")
                return True
            response.raise_for_status()
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.parse(response.text.splitlines())
            allowed = rp.can_fetch('*', url)
            if not allowed:
                logger.warning(f"Robots.txt blocks scraping for {url}: {response.text[:200]}...")
            else:
                logger.debug(f"Robots.txt allows scraping: {url}")
            return allowed
        except requests.RequestException as e:
            logger.warning(f"No robots.txt or error for {url}: {e}. Assuming allowed.")
            return True

    def ensure_coda_scrapeable_column(self):
        """Ensure Scrapeable column exists in Coda table."""
        try:
            url = f"https://coda.io/apis/v1/docs/{self.doc_id}/tables/{self.table_id}/columns"
            headers = {"Authorization": f"Bearer {self.coda_token}"}
            response = self.session.get(url, headers=headers)
            response.raise_for_status()
            columns = response.json().get("items", [])
            if not any(col["name"] == "Scrapeable" for col in columns):
                payload = {"name": "Scrapeable", "type": "checkbox"}
                response = self.session.post(url, headers=headers, json=payload)
                response.raise_for_status()
                logger.info("Created Scrapeable column in Coda")
        except Exception as e:
            logger.error(f"Error ensuring Scrapeable column: {e}")

    def update_coda_scrapeable(self, row_id: str, scrapeable: bool) -> bool:
        """Update the Scrapeable column in Coda for a specific row (True=allowed, False=blocked)."""
        max_retries = 5
        retry_delay = 6  # seconds to respect Coda's 10 requests/6s limit
        for attempt in range(max_retries):
            try:
                url = f"https://coda.io/apis/v1/docs/{self.doc_id}/tables/{self.table_id}/rows/{row_id}"
                headers = {"Authorization": f"Bearer {self.coda_token}"}
                data = {
                    "row": {
                        "cells": [
                            {"column": "Scrapeable", "value": scrapeable}
                        ]
                    }
                }
                response = self.session.put(url, json=data, headers=headers)
                response.raise_for_status()
                logger.info(f"Updated Coda row {row_id}: Scrapeable={scrapeable}")
                return True
            except requests.exceptions.HTTPError as e:
                if hasattr(e.response, 'status_code') and e.response.status_code == 429:
                    retry_after = int(e.response.headers.get('Retry-After', retry_delay))
                    logger.warning(f"Rate limit hit for row {row_id}, retrying in {retry_after}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_after)
                    retry_delay *= 2
                    continue
                else:
                    logger.error(f"HTTP error updating Coda row {row_id}: {e}")
                    return False
            except Exception as e:
                logger.error(f"Failed to update Coda row {row_id}: {e}")
                return False
        return False

    def scrape_article(self, url: str) -> Optional[str]:
        """Scrape full article content from URL, prioritizing abstracts for PubMed."""
        if any(domain in url for domain in ['stickmobility.podbean.com', 'youtube.com', 'buzzsprout.com']):
            logger.info(f"Skipping podcast or video URL: {url}")
            return None
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
                tag.decompose()
            # Try to extract PubMed abstract or main content
            content = soup.find('div', class_='abstract') or soup.find('article') or soup.find('div', class_='content') or soup.find('main')
            if content:
                text = content.get_text(strip=True)
            else:
                content_tags = soup.find_all(['p', 'div', 'section'])
                text_parts = [tag.get_text(strip=True) for tag in content_tags if len(tag.get_text(strip=True).split()) > 20]
                text = ' '.join(text_parts)
            full_text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
            full_text = re.sub(r'javascript:[^\'"\s]*', '', full_text)  # Remove JS
            if len(full_text.split()) < self.content_threshold and not soup.find('div', class_='abstract'):
                logger.warning(f"Skipping {url}: Insufficient content (<{self.content_threshold} words) and no abstract")
                return None
            return full_text.strip()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                logger.error(f"Skipping {url}: 404 Not Found")
                return None
            logger.error(f"Failed to scrape {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error scraping {url}: {e}")
            return None

    def is_relevant_article(self, title: str, description: str, content: Optional[str] = None) -> bool:
        """Check if article is relevant based on keywords."""
        text_to_check = f"{title} {description} {content or ''}".lower()
        has_relevant = any(keyword in text_to_check for keyword in self.relevant_keywords)
        has_junk = any(keyword in text_to_check for keyword in self.junk_keywords)
        has_evidence = any(keyword in text_to_check for keyword in self.evidence_keywords)
        if has_relevant and has_evidence:
            return True  # Prioritize evidence-based content with relevant keywords
        if has_junk:
            logger.info(f"Skipping article due to junk keywords: {title}")
            return False
        if not has_relevant:
            logger.info(f"Skipping article due to no relevant keywords: {title}")
            return False
        logger.info(f"Skipping article due to no evidence-based content: {title}")
        return False

    def summarize_text(self, text: str) -> str:
        """Summarize text to max_words."""
        words = text.split()
        if len(words) <= self.max_words:
            return text
        return ' '.join(words[:self.max_words]) + '...'

    def process_articles(self, articles: List[Dict]) -> List[Dict]:
        """Process articles: check robots, scrape, filter, summarize."""
        processed_articles = []
        self.ensure_coda_scrapeable_column()
        for article in articles:
            url = article.get('Link', '')
            title = article.get('Title', '')
            description = article.get('Description', '')
            row_id = article.get('RowId', '')
            feed = article.get('Feed', '')
            if not url or not title:
                logger.warning(f"Skipping article with missing URL or title: {article}")
                continue
            if not self.is_relevant_article(title, description):
                continue
            scrapeable = self.check_robots_txt(url)
            if row_id:
                self.update_coda_scrapeable(row_id, scrapeable)
                time.sleep(3)  # Avoid Coda API rate limits
            if not scrapeable:
                logger.info(f"Skipping non-scrapeable URL: {url}")
                continue
            logger.info(f"Scraping article: {title}")
            content = self.scrape_article(url)
            if not content:
                continue
            if not self.is_relevant_article(title, description, content):
                continue
            summary = self.summarize_text(content)
            processed_article = {
                'title': title,
                'url': url,
                'description': description,
                'published_date': article.get('Published Date', datetime.now().isoformat()),
                'feed': feed,
                'content': content,
                'summary': summary,
                'row_id': row_id
            }
            processed_articles.append(processed_article)
            time.sleep(1)  # Be respectful to servers
        return processed_articles

    def save_jsonl_dataset(self, articles: List[Dict], output_file: str = 'rss_knowledge.jsonl'):
        """Save processed articles as JSONL dataset for GPT-2 fine-tuning."""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                for article in articles:
                    json_line = {'text': article['summary']}
                    f.write(json.dumps(json_line, ensure_ascii=False) + '\n')
            logger.info(f"Saved {len(articles)} articles to {output_file}")
        except Exception as e:
            logger.error(f"Failed to save dataset: {e}")

    def run(self):
        """Main execution method."""
        logger.info("Starting article scraping process...")
        articles = self.load_feed_data()
        if not articles:
            logger.error("No articles to process")
            return
        processed_articles = self.process_articles(articles)
        self.save_jsonl_dataset(processed_articles)
        logger.info(f"Processing complete. Processed {len(processed_articles)} relevant articles.")

def main():
    """Main entry point."""
    try:
        scraper = ArticleScraper()
        scraper.run()
    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == '__main__':
    main()