// useRecentEmojis.js - Enhanced with category loading functionality
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
  
  // NEW: Load an entire category of emojis into the recent list
  const loadCategoryToRecent = (categoryEmojis) => {
    if (!categoryEmojis || !Array.isArray(categoryEmojis)) return;
    
    // Clear current recent emojis first
    data.recentEmojis.splice(0);
    
    // Add emojis from the category, up to the maximum limit
    const emojisToAdd = categoryEmojis.slice(0, MAX_RECENT_EMOJIS);
    
    emojisToAdd.forEach(emoji => {
      if (emoji && emoji.key) {
        data.recentEmojis.push({ ...emoji });
      }
    });
    
    // Ensure we don't exceed the maximum
    if (data.recentEmojis.length > MAX_RECENT_EMOJIS) {
      data.recentEmojis = data.recentEmojis.slice(0, MAX_RECENT_EMOJIS);
    }
  };
  
  // Clear all recent emojis
  const clearRecentEmojis = () => {
    data.recentEmojis.splice(0);
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

  // Get count of recent emojis
  const getRecentCount = () => {
    return data.recentEmojis.length;
  };

  // Check if recent list is full
  const isRecentListFull = () => {
    return data.recentEmojis.length >= MAX_RECENT_EMOJIS;
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
    loadCategoryToRecent,  // NEW: Export the category loading function
    clearRecentEmojis,
    removeRecentEmoji,
    isRecentEmoji,
    getRecentCount,        // NEW: Export count function
    isRecentListFull,      // NEW: Export full check function
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
    loadCategoryToRecent: store.loadCategoryToRecent,  // NEW: Export category loading
    clearRecentEmojis: store.clearRecentEmojis,
    removeRecentEmoji: store.removeRecentEmoji,
    isRecentEmoji: store.isRecentEmoji,
    getRecentCount: store.getRecentCount,              // NEW: Export helper functions
    isRecentListFull: store.isRecentListFull
  };
};

// Export the store instance for integration with main data store
export const getRecentEmojisStoreInstance = getRecentEmojisStore;
