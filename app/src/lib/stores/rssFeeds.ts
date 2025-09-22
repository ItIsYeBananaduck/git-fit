import { writable } from 'svelte/store';
import type { RSSFeed, RSSItem } from './rssIntegrationService.ts';

export interface RSSFeedState {
  feeds: RSSFeed[];
  items: RSSItem[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

const initialState: RSSFeedState = {
  feeds: [],
  items: [],
  loading: false,
  error: null,
  lastFetched: null
};

function createRSSStore() {
  const { subscribe, set, update } = writable<RSSFeedState>(initialState);

  return {
    subscribe,
    setFeeds: (feeds: RSSFeed[]) => update(state => ({ ...state, feeds })),
    setItems: (items: RSSItem[]) => update(state => ({ ...state, items })),
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    setError: (error: string | null) => update(state => ({ ...state, error })),
    updateLastFetched: (timestamp: Date) => update(state => ({ ...state, lastFetched: timestamp })),
    addItems: (newItems: RSSItem[]) => update(state => ({
      ...state,
      items: [...state.items, ...newItems]
    })),
    reset: () => set(initialState)
  };
}

export const rssFeedStore = createRSSStore();
export const rssActions = rssFeedStore;