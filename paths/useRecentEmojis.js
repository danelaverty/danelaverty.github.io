// useRecentEmojis.js - Composable for managing recently used emojis with persistence
import { reactive } from './vue-composition-api.js';

let recentEmojisStoreInstance = null;
const MAX_RECENT_EMOJIS = 8;

function createRecentEmojisStore() {
  const data = reactive({
    recentEmojis: []
  });

  // Add an emoji to the recent list
  const addRecentEmoji = (attribute) => {
    if (!attribute || !attribute.key) return;
    
    // Remove emoji if it already exists in the list
    const existingIndex = data.recentEmojis.findIndex(emoji => emoji.key === attribute.key);
    if (existingIndex !== -1) {
      data.recentEmojis.splice(existingIndex, 1);
    }
    
    // Add to the beginning of the list
    data.recentEmojis.unshift({ ...attribute });
    
    // Keep only the maximum number of recent emojis
    if (data.recentEmojis.length > MAX_RECENT_EMOJIS) {
      data.recentEmojis = data.recentEmojis.slice(0, MAX_RECENT_EMOJIS);
    }
  };
  
  // Clear all recent emojis
  const clearRecentEmojis = () => {
    data.recentEmojis = [];
  };
  
  // Remove a specific emoji from recent list
  const removeRecentEmoji = (key) => {
    const index = data.recentEmojis.findIndex(emoji => emoji.key === key);
    if (index !== -1) {
      data.recentEmojis.splice(index, 1);
    }
  };
  
  // Check if an emoji is in the recent list
  const isRecentEmoji = (key) => {
    return data.recentEmojis.some(emoji => emoji.key === key);
  };

  // Serialization for persistence
  const serialize = () => ({
    recentEmojis: data.recentEmojis
  });

  const deserialize = (savedData) => {
    if (savedData.recentEmojis && Array.isArray(savedData.recentEmojis)) {
      data.recentEmojis = savedData.recentEmojis.slice(0, MAX_RECENT_EMOJIS);
    }
  };

  return {
    data,
    addRecentEmoji,
    clearRecentEmojis,
    removeRecentEmoji,
    isRecentEmoji,
    serialize,
    deserialize
  };
}

function getRecentEmojisStore() {
  if (!recentEmojisStoreInstance) {
    recentEmojisStoreInstance = createRecentEmojisStore();
  }
  return recentEmojisStoreInstance;
}

export const useRecentEmojis = () => {
  const store = getRecentEmojisStore();
  
  return {
    recentEmojis: store.data.recentEmojis,
    addRecentEmoji: store.addRecentEmoji,
    clearRecentEmojis: store.clearRecentEmojis,
    removeRecentEmoji: store.removeRecentEmoji,
    isRecentEmoji: store.isRecentEmoji
  };
};

// Export the store instance for integration with main data store
export const getRecentEmojisStoreInstance = getRecentEmojisStore;
