#!/usr/bin/env python3
"""
YouTube Video Scraper for Fitness Content

Downloads and transcribes YouTube videos/playlists using yt-dlp and Whisper,
summarizes content, and appends to rss_knowledge.jsonl.
"""

import json
import os
import time
import logging
import re
from typing import List, Dict, Optional
import yt_dlp
import whisper
from dotenv import load_dotenv
from datetime import datetime
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class YouTubeScraper:
    """Scraper for YouTube videos/playlists using yt-dlp and Whisper."""

    def __init__(self):
        load_dotenv()
        self.youtube_username = os.getenv('YOUTUBE_USERNAME')
        self.youtube_password = os.getenv('YOUTUBE_PASSWORD')
        if not all([self.youtube_username, self.youtube_password]):
            raise ValueError("Missing YouTube credentials in .env")

        self.default_content_threshold = 50
        self.shorts_content_threshold = 20
        self.max_words = 150
        self.relevant_keywords = [
            'bicep', 'tricep', 'forearm', 'delts', 'quads', 'glutes', 'chest', 'back',
            'curl', 'press', 'row', 'pull', 'push', 'extension', 'flexion', 'rep', 'set',
            'tempo', 'rir', 'form', 'range', 'stretch', 'recovery',
            'hrv', 'spo2', 'heart rate', 'heart rate variability', 'oxygen saturation',
            'pulse', 'lactate', 'blood pressure', 'resting', 'zone',
            'protein', 'carbs', 'fat', 'calorie', 'macro', 'diet', 'surplus', 'deficit',
            'recomp', 'meal', 'fasting', 'bulking', 'cutting',
            'supplement', 'vitamin', 'creatine', 'beta alanine', 'caffeine', 'magnesium',
            'omega', 'bcda', 'pre', 'post', 'recovery drink'
        ]
        self.junk_keywords = ['subscribe', 'like', 'share', 'click here', 'smash that button',
                              'sponsor', 'ad', 'merch', 'intro', 'outro', 'giveaway']

        self.whisper_model = whisper.load_model("tiny")

    def load_links(self, filepath: str = 'data/youtube_links.txt') -> List[str]:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                links = [line.strip() for line in f if line.strip()]
            logger.info(f"Loaded {len(links)} YouTube links from {filepath}")
            return links
        except FileNotFoundError:
            logger.error(f"File not found: {filepath}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error loading {filepath}: {e}")
            return []

    def download_video_audio(self, url: str) -> List[tuple[str, str, float]]:
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': 'temp_audio.%(id)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'username': self.youtube_username,
            'password': self.youtube_password,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'ffmpeg_location': 'C:\\ffmpeg\\bin\\ffmpeg.exe'
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if 'entries' in info:
                    videos = [(f"temp_audio.{entry['id']}.mp3", entry['title'], entry.get('duration', 0)) for entry in info['entries']]
                else:
                    videos = [(f"temp_audio.{info['id']}.mp3", info['title'], info.get('duration', 0))]
                return videos
        except Exception as e:
            logger.error(f"Failed to download audio from {url}: {e}")
            return []

    def transcribe_audio(self, audio_file: str) -> Optional[str]:
        try:
            result = self.whisper_model.transcribe(audio_file)
            transcript = result['text']
            cleaned_transcript = re.sub(r'\[.*?\]', '', transcript)
            cleaned_transcript = re.sub(r'\s+', ' ', cleaned_transcript).strip()
            return cleaned_transcript
        except Exception as e:
            logger.error(f"Failed to transcribe {audio_file}: {e}")
            return None
        finally:
            if os.path.exists(audio_file):
                os.remove(audio_file)

    def is_relevant_transcript(self, title: str, transcript: str) -> bool:
        text_to_check = f"{title} {transcript}".lower()
        muscle_move = any(kw in text_to_check for kw in [
            'bicep', 'tricep', 'forearm', 'delts', 'quads', 'glutes', 'chest', 'back',
            'curl', 'press', 'row', 'pull', 'push', 'extension', 'flexion', 'rep', 'set',
            'tempo', 'rir', 'form', 'range', 'stretch', 'recovery'
        ])
        metrics = any(kw in text_to_check for kw in [
            'hrv', 'spo2', 'heart rate', 'heart rate variability', 'oxygen saturation',
            'pulse', 'lactate', 'blood pressure', 'resting', 'zone'
        ])
        nutrition = any(kw in text_to_check for kw in [
            'protein', 'carbs', 'fat', 'calorie', 'macro', 'diet', 'surplus', 'deficit',
            'recomp', 'meal', 'fasting', 'bulking', 'cutting'
        ])
        supplements = any(kw in text_to_check for kw in [
            'supplement', 'vitamin', 'creatine', 'beta alanine', 'caffeine', 'magnesium',
            'omega', 'bcda', 'pre', 'post', 'recovery drink'
        ])
        if not (muscle_move or metrics or nutrition or supplements):
            logger.info(f"Skipping: {title} - no health/fitness pulse")
            return False
        junk_only = all(kw in text_to_check for kw in self.junk_keywords) and not (muscle_move or metrics or nutrition or supplements)
        if junk_only:
            logger.info(f"Skipping: {title} - ad-only spam")
            return False
        return True

    def summarize_text(self, text: str) -> str:
        words = text.split()
        if len(words) <= self.max_words:
            return f"{text} You're on the right track—keep applying this!"
        summary = ' '.join(words[:self.max_words]) + '...'
        return f"{summary} Small steps like these build big gains. Keep it up."

    def process_videos(self, links: List[str]) -> List[Dict]:
        processed_videos = []
        for url in tqdm(links, desc="Processing YouTube links"):
            logger.info(f"Processing YouTube video/playlist: {url}")
            videos = self.download_video_audio(url)
            for audio_file, title, duration in videos:
                if not audio_file or not title:
                    continue
                content_threshold = self.shorts_content_threshold if duration < 60 else self.default_content_threshold
                transcript = self.transcribe_audio(audio_file)
                if not transcript:
                    continue
                if len(transcript.split()) < content_threshold:
                    logger.warning(f"Skipping transcript for {title}: Insufficient content (<{content_threshold} words)")
                    continue
                if not self.is_relevant_transcript(title, transcript):
                    continue
                summary = self.summarize_text(transcript)
                video_data = {
                    'title': title,
                    'url': url,
                    'description': 'YouTube fitness video transcript',
                    'published_date': datetime.now().isoformat(),
                    'feed': 'YouTube Fitness',
                    'content': transcript,
                    'summary': summary,
                    'row_id': f'youtube-{url.split("=")[-1]}'
                }
                processed_videos.append(video_data)
                time.sleep(1)
        return processed_videos

    def save_jsonl_dataset(self, videos: List[Dict], output_file: str = 'data/rss_knowledge.jsonl'):
        try:
            with open(output_file, 'a', encoding='utf-8') as f:
                for video in videos:
                    json_line = {'text': video['summary']}
                    f.write(json.dumps(json_line, ensure_ascii=False) + '\n')
            logger.info(f"Appended {len(videos)} YouTube videos to {output_file}")
        except Exception as e:
            logger.error(f"Failed to save dataset: {e}")

    def run(self, links_file: str = 'data/youtube_links.txt'):
        logger.info("Starting YouTube scraping process...")
        links = self.load_links(links_file)
        if not links:
            logger.error("No YouTube links to process")
            return
        processed_videos = self.process_videos(links)
        self.save_jsonl_dataset(processed_videos)
        logger.info(f"Processing complete. Processed {len(processed_videos)} relevant videos.")

def main():
    try:
        scraper = YouTubeScraper()
        scraper.run()
    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == '__main__':
    main()
