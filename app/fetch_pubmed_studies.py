
"""
PubMed API Scraper for HRV/SPo2/Strength Training Studies

Queries PubMed for new studies, scrapes abstracts, and appends to rss_knowledge.jsonl.
"""

import json
import time
import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote
from datetime import datetime
from typing import List, Dict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PubMedScraper:
    """Scraper for PubMed studies via E-Utilities API."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Git-Fit-Research-Bot/1.0 (Educational Research)'
        })
        self.base_url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
        self.search_query = '((HRV OR SPo2 OR "heart rate variability" OR "oxygen saturation") AND ("strength training" OR "resistance training" OR hypertrophy) NOT (heart disease OR cancer OR apnea)) AND (2019/01/01:2025/12/31[pdat])'
        self.content_threshold = 30
        self.max_words = 150
        self.relevant_keywords = [
            'strength', 'resistance', 'hypertrophy', 'muscle', 'training',
            'exercise', 'fitness', 'hrv', 'spo2', 'heart rate variability',
            'oxygen saturation'
        ]
        self.junk_keywords = [
            'cancer', 'apnea', 'heart failure', 'cardiovascular disease',
            'breast', 'padel', 'tetralogy', 'snoring'
        ]

    def is_relevant_study(self, title: str, abstract: str) -> bool:
        """Check if study is relevant to fitness/strength training."""
        text_to_check = f"{title} {abstract}".lower()
        has_relevant = any(keyword in text_to_check for keyword in self.relevant_keywords)
        has_junk = any(keyword in text_to_check for keyword in self.junk_keywords)
        return has_relevant and not has_junk

    def search_pubmed(self, max_results: int = 10) -> List[Dict]:
        """Search PubMed for relevant studies and return study data."""
        try:
            # ESearch for PMIDs
            search_url = f"{self.base_url}esearch.fcgi?db=pubmed&term={quote(self.search_query)}&retmax={max_results}&usehistory=y&retmode=xml"
            response = self.session.get(search_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'lxml-xml')
            pmids = [id.text for id in soup.find_all('Id')]
            logger.info(f"Found {len(pmids)} PMIDs for query: {self.search_query}")
            studies = []
            for pmid in pmids:
                # EFetch for abstract and metadata
                fetch_url = f"{self.base_url}efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract"
                fetch_response = self.session.get(fetch_url)
                fetch_response.raise_for_status()
                fetch_soup = BeautifulSoup(fetch_response.content, 'lxml-xml')
                title = fetch_soup.find('ArticleTitle')
                title_text = title.text if title else f"PubMed Study {pmid}"
                abstract = fetch_soup.find('AbstractText')
                abstract_text = abstract.text if abstract else ''
                pmc_id = fetch_soup.find('ArticleId', {'IdType': 'pmc'})
                pmc_url = f"https://pmc.ncbi.nlm.nih.gov/articles/PMC{pmc_id.text}/" if pmc_id else f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                if len(abstract_text.split()) >= self.content_threshold and self.is_relevant_study(title_text, abstract_text):
                    studies.append({
                        'title': title_text,
                        'url': pmc_url,
                        'description': 'HRV/SPo2 and strength training study',
                        'published_date': datetime.now().isoformat(),
                        'feed': 'PubMed HRV Strength',
                        'content': abstract_text,
                        'row_id': f'pubmed-{pmid}'
                    })
                time.sleep(0.5)  # Respect API rate limits (10/sec)
            return studies
        except Exception as e:
            logger.error(f"Failed to search PubMed: {e}")
            return []

    def summarize_text(self, text: str) -> str:
        """Summarize text to max_words."""
        words = text.split()
        if len(words) <= self.max_words:
            return text
        return ' '.join(words[:self.max_words]) + '...'

    def run(self, output_file: str = 'rss_knowledge.jsonl'):
        """Fetch PubMed studies and append to JSONL."""
        logger.info("Starting PubMed scraping process...")
        studies = self.search_pubmed()
        processed_articles = []
        for study in studies:
            summary = self.summarize_text(study['content'])
            study['summary'] = summary
            processed_articles.append(study)
        try:
            with open(output_file, 'a', encoding='utf-8') as f:
                for article in processed_articles:
                    json_line = {'text': article['summary']}
                    f.write(json.dumps(json_line, ensure_ascii=False) + '\n')
            logger.info(f"Appended {len(processed_articles)} PubMed studies to {output_file}")
        except Exception as e:
            logger.error(f"Failed to save PubMed studies: {e}")

def main():
    try:
        scraper = PubMedScraper()
        scraper.run()
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == '__main__':
    main()
