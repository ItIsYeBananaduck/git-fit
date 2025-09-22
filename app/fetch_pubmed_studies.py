
#!/usr/bin/env python3
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
from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PubMedScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Git-Fit-Research-Bot/1.0 (Educational Research)'
        })
        self.base_url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'
        self.search_query = '((HRV OR SPo2 OR "heart rate variability" OR "oxygen saturation") AND ("strength training" OR "resistance training" OR hypertrophy OR "reps in reserve" OR RIR OR tempo) NOT (cancer OR apnea OR heart failure OR asthma OR judo OR padel OR burn OR soccer OR diabetes OR parkinson OR postmenopausal OR "peripheral artery" OR "inspiratory muscle" OR "blood flow restriction" OR "nature-based" OR obesity OR HIIT OR "interval training" OR elderly OR "face mask")) AND (2019/01/01:2025/12/31[pdat]) AND ("randomized controlled trial"[Publication Type] OR "meta-analysis"[Publication Type])'
        self.content_threshold = 30
        self.max_words = 150
        self.relevant_keywords = [
            'strength', 'resistance', 'hypertrophy', 'muscle', 'training',
            'exercise', 'fitness', 'hrv', 'spo2', 'heart rate variability',
            'oxygen saturation', 'rir', 'reps in reserve', 'tempo'
        ]
        self.junk_keywords = [
            'cancer', 'apnea', 'heart failure', 'asthma', 'breast', 'padel',
            'tetralogy', 'snoring', 'burn', 'judo', 'soccer', 'cardiovascular disease',
            'diabetes', 'parkinson', 'postmenopausal', 'peripheral artery',
            'inspiratory muscle', 'blood flow restriction', 'nature-based', 'obesity',
            'HIIT', 'interval training', 'elderly', 'face mask'
        ]

    def is_relevant_study(self, title: str, abstract: str) -> bool:
        text_to_check = f"{title} {abstract}".lower()
        has_relevant = any(keyword in text_to_check for keyword in self.relevant_keywords)
        has_junk = any(keyword in text_to_check for keyword in self.junk_keywords)
        if has_junk:
            logger.info(f"Skipping study due to junk keywords: {title} (keywords: {', '.join(kw for kw in self.junk_keywords if kw in text_to_check)})")
            return False
        if not has_relevant:
            logger.info(f"Skipping study due to no relevant keywords: {title}")
            return False
        return True

    def search_pubmed(self, max_results: int = 10) -> List[Dict]:
        try:
            search_url = f"{self.base_url}esearch.fcgi?db=pubmed&term={quote(self.search_query)}&retmax={max_results}&usehistory=y&retmode=xml"
            response = self.session.get(search_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'lxml-xml')
            pmids = [id.text for id in soup.find_all('Id')]
            logger.info(f"Found {len(pmids)} PMIDs for query: {self.search_query}")
            studies = []
            for pmid in tqdm(pmids, desc="Processing PubMed studies"):
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
                    summary = self.summarize_text(abstract_text)
                    studies.append({
                        'title': title_text,
                        'url': pmc_url,
                        'description': 'HRV/SPo2 and strength training study',
                        'published_date': datetime.now().isoformat(),
                        'feed': 'PubMed HRV Strength',
                        'content': abstract_text,
                        'summary': summary,
                        'row_id': f'pubmed-{pmid}'
                    })
                time.sleep(0.5)
            return studies
        except Exception as e:
            logger.error(f"Failed to search PubMed: {e}")
            return []

    def summarize_text(self, text: str) -> str:
        words = text.split()
        if len(words) <= self.max_words:
            return f"{text} You're on the right track—keep applying this!"
        summary = ' '.join(words[:self.max_words]) + '...'
        return f"{summary} Small steps like these build big gains. Keep it up."

    def run(self, output_file: str = 'data/rss_knowledge.jsonl'):
        logger.info("Starting PubMed scraping process...")
        studies = self.search_pubmed()
        processed_articles = []
        for study in studies:
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
