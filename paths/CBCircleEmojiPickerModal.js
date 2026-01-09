// pickers/CircleEmojiPickerModal.js - Updated with search functionality
import { emojiCategories, buildSearchIndex, searchEmojis } from './emojiFullSet.js';
import { injectComponentStyles } from './styleUtils.js';

const circleEmojiPickerModalStyles = `
.circle-emoji-header {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.no-emoji-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-emoji-button {
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.no-emoji-button:hover {
  border-color: #999;
  background: #f5f5f5;
}

.no-emoji-button.selected {
  border-color: #007acc;
  background: #e6f3ff;
  box-shadow: 0 0 0 1px #007acc;
}

.no-emoji-icon {
  display: flex;
  align-items: center;
  gap: 4px;
}

.no-emoji-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.no-emoji-circle {
  width: 20px;
  height: 20px;
  border: 2px dashed #ccc;
  border-radius: 50%;
}

.no-emoji-label {
  font-size: 14px;
  color: #666;
}

.header-spacer {
  flex: 1;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
}

.close-button:hover {
  color: #000;
}

.search-container {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #007acc;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.search-results-info {
  padding: 8px 10px;
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.clear-search {
  background: none;
  border: none;
  color: #007acc;
  cursor: pointer;
  text-decoration: underline;
  font-size: 12px;
  padding: 2px 4px;
}

.clear-search:hover {
  color: #005299;
}

.circle-emoji-tab {
  color: white;
}

.circle-emoji-item {
  position: relative;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.circle-emoji-item:hover {
  background: rgba(0, 122, 204, 0.1);
}

.circle-emoji-item.selected {
  background: #007acc;
  color: white;
  border-radius: 4px;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
  z-index: 1;
}

.circle-emoji-item.selected::after {
  content: '✓';
  position: absolute;
  top: -2px;
  right: -2px;
  background: #007acc;
  font-size: 10px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background: rgba(0, 122, 204, 0.1);
}

.search-result-item.selected {
  background: #007acc;
  color: white;
}

.search-result-emoji {
  font-size: 20px;
  min-width: 24px;
}

.search-result-info {
  flex: 1;
  min-width: 0;
}

.search-result-name {
  font-weight: 500;
  font-size: 14px;
}

.search-result-category {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

.no-search-results {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.no-search-results-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.circle-emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  padding: 10px;
}

.circle-emoji-content {
  max-height: 300px;
  overflow-y: auto;
}

.section-title {
  margin: 0;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}
`;

injectComponentStyles('circle-emoji-picker-modal', circleEmojiPickerModalStyles);

export const CircleEmojiPickerModal = {
  props: {
    currentEmoji: {
      type: String,
      default: ''
    }
  },

  emits: ['selectCircleEmoji', 'selectCategory', 'close'],
  
  data() {
    return {
      activeTab: '', // Will be set to first tab in mounted()
      emojiCategories: emojiCategories,
      searchQuery: '',
      searchIndex: null,
      searchResults: []
    };
  },

  mounted() {
    // Build search index once when component mounts
    this.searchIndex = buildSearchIndex();
    
    // Set initial active tab to first category
    if (!this.activeTab && this.tabs.length > 0) {
      this.activeTab = this.tabs[0].id;
    }
    
    // Detect and set active tab based on current emoji
    if (this.currentEmoji) {
      const detectedTab = this.detectEmojiTab(this.currentEmoji);
      if (detectedTab) {
        this.activeTab = detectedTab;
      }
    }
  },
  
  computed: {
    // Dynamically generate tabs from emojiCategories
    tabs() {
      return Object.keys(this.emojiCategories).map(categoryKey => {
        const categoryData = this.emojiCategories[categoryKey];
        const firstSubcategory = Object.values(categoryData)[0];
        
        // Get the first emoji from the category to use as icon
        let icon = '📦'; // Default fallback icon
        if (Array.isArray(firstSubcategory) && firstSubcategory.length > 0) {
          icon = firstSubcategory[0].emoji || firstSubcategory[0];
        }
        
        // Clean up category name for display
        const name = categoryKey.replace(/[&]/g, 'and');
        
        return {
          id: categoryKey,
          name: name,
          icon: icon
        };
      });
    },
    
    currentTabData() {
      return this.emojiCategories[this.activeTab] || {};
    },
    
    isSearching() {
      return this.searchQuery.trim().length > 0;
    },
    
    displayedEmojis() {
      if (this.isSearching) {
        return this.searchResults;
      }
      return this.currentTabData;
    }
  },
  
  methods: {
    detectEmojiTab(targetEmoji) {
      if (!targetEmoji) return null;
      
      // Search through all tabs and categories
      for (const tabId of Object.keys(this.emojiCategories)) {
        const tabData = this.emojiCategories[tabId];
        
        for (const categoryName of Object.keys(tabData)) {
          const categoryEmojis = tabData[categoryName];
          
          if (Array.isArray(categoryEmojis)) {
            // Handle new structure with emoji objects
            const found = categoryEmojis.some(item => {
              const emoji = typeof item === 'object' ? item.emoji : item;
              return emoji === targetEmoji;
            });
            if (found) return tabId;
          }
        }
      }
      
      return null; // Emoji not found in any category
    },

    isEmojiSelected(emoji) {
      const emojiChar = typeof emoji === 'object' ? emoji.emoji : emoji;
      return emojiChar === this.currentEmoji;
    },

    isNoEmojiSelected() {
      return this.currentEmoji === '' || this.currentEmoji === null || this.currentEmoji === undefined;
    },
    
    setActiveTab(tabId) {
      this.activeTab = tabId;
      // Clear search when switching tabs
      this.searchQuery = '';
      this.searchResults = [];
    },
    
    selectCircleEmoji(emoji) {
      const emojiChar = typeof emoji === 'object' ? emoji.emoji : emoji;
      this.$emit('selectCircleEmoji', emojiChar);
    },
    
    selectNoEmoji() {
      this.$emit('selectCircleEmoji', '');
    },
    
    selectCategory(categoryData) {
      this.$emit('selectCategory', categoryData);
    },
    
    onSearchInput(event) {
      const query = event.target.value;
      this.searchQuery = query;
      
      if (query.trim().length === 0) {
        this.searchResults = [];
        return;
      }
      
      if (query.trim().length < 2) {
        this.searchResults = [];
        return;
      }
      
      // Perform search
      this.searchResults = searchEmojis(query, this.searchIndex);
    },
    
    clearSearch() {
      this.searchQuery = '';
      this.searchResults = [];
      this.$refs.searchInput.focus();
    },
    
    getEmojiChar(item) {
      return typeof item === 'object' ? item.emoji : item;
    },
    
    getEmojiName(item) {
      return typeof item === 'object' ? item.name : '';
    },
    
    getEmojiCategory(item) {
      return typeof item === 'object' ? `${item.category} > ${item.subcategory}` : '';
    }
  },
  
  template: `
    <div class="circle-emoji-picker-modal-enhanced">
      <!-- Header with No Emoji option -->
      <div class="circle-emoji-header">
        <div class="no-emoji-section">
          <button 
            :class="['no-emoji-button', { selected: isNoEmojiSelected() }]"
            @click="selectNoEmoji()"
            title="Remove emoji from circle"
          >
            <div class="no-emoji-icon">
              <span class="no-emoji-text">None</span>
              <div class="no-emoji-circle"></div>
            </div>
          </button>
          <span class="no-emoji-label">No Emoji</span>
        </div>
        <div class="header-spacer"></div>
        <button class="close-button" @click="$emit('close')" title="Close picker">×</button>
      </div>
      
      <!-- Search Input -->
      <div class="search-container">
        <input
          ref="searchInput"
          type="text"
          class="search-input"
          placeholder="Search emojis... (e.g. 'happy', 'heart', 'food')"
          :value="searchQuery"
          @input="onSearchInput"
        />
      </div>
      
      <!-- Search Results Info -->
      <div v-if="isSearching" class="search-results-info">
        <span v-if="searchResults.length > 0">
          Found {{ searchResults.length }} emoji{{ searchResults.length === 1 ? '' : 's' }} for "{{ searchQuery }}"
        </span>
        <span v-else-if="searchQuery.trim().length >= 2">
          No emojis found for "{{ searchQuery }}"
        </span>
        <span v-else>
          Type at least 2 characters to search
        </span>
        <button class="clear-search" @click="clearSearch()">Clear search</button>
      </div>
      
      <!-- Tabs (only show when not searching) -->
      <div v-if="!isSearching" class="circle-emoji-tabs">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          :class="['circle-emoji-tab', { active: activeTab === tab.id }]"
          @click="setActiveTab(tab.id)"
          :title="tab.name"
        >
          {{ tab.icon }}
        </button>
      </div>
      
      <!-- Emoji Content -->
      <div class="circle-emoji-content">
        <!-- Search Results -->
        <div v-if="isSearching && searchResults.length > 0">
          <div class="circle-emoji-section">
            <div class="circle-emoji-grid">
              <div
                v-for="result in searchResults"
                :key="result.emoji"
                :class="['search-result-item', { selected: isEmojiSelected(result) }]"
                @click="selectCircleEmoji(result)"
                :title="result.name + ' (' + result.category + ' > ' + result.subcategory + ')'"
              >
                <span class="search-result-emoji">{{ result.emoji }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Search Results -->
        <div v-else-if="isSearching && searchQuery.trim().length >= 2" class="no-search-results">
          <div class="no-search-results-icon">🔍</div>
          <div>No emojis found for "{{ searchQuery }}"</div>
          <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
            Try different keywords like "happy", "heart", or "food"
          </div>
        </div>
        
        <!-- Category Content (when not searching) -->
        <div class="circle-emoji-grid" v-else>
          <!-- Iterate through categories for current tab -->
          <template v-for="(categoryEmojis, categoryName) in currentTabData" :key="categoryName" class="circle-emoji-section">
            <!--h4 class="section-title">{{ categoryName }}</h4-->
            <!--div class="circle-emoji-grid"-->
              <div 
                v-for="emoji in categoryEmojis"
                :key="getEmojiChar(emoji)"
                :class="['circle-emoji-item', { selected: isEmojiSelected(emoji) }]"
                @click="selectCircleEmoji(emoji)"
                :title="getEmojiName(emoji) || getEmojiChar(emoji)"
              >
                {{ getEmojiChar(emoji) }}
              </div>
            <!--/div-->
          </template>
        </div>
      </div>
    </div>
  `
};
