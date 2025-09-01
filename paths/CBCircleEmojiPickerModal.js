// pickers/CircleEmojiPickerModal.js - Updated with auto tab detection for current emoji
import { emojiCategories } from './emojiFullSet.js';
import { EmojiVariantService } from './EmojiVariantService.js';
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

.circle-emoji-item {
  position: relative;
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
  color: white;
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
`;

injectComponentStyles('circle-emoji-picker-modal', circleEmojiPickerModalStyles);

export const CircleEmojiPickerModal = {
  props: {
    // NEW: Add prop for current emoji to detect which tab it belongs to
    currentEmoji: {
      type: String,
      default: ''
    }
  },

  emits: ['selectCircleEmoji', 'selectCategory', 'close'],
  
  data() {
    return {
      activeTab: 'smileys', // Will be overridden in mounted()
      selectedSkinTone: '🏼', // Default medium-light skin tone
      selectedGender: 'neutral', // neutral, male, female
      
      skinTones: [
        { id: 'default', emoji: '', name: 'Default' },
        { id: 'light', emoji: '🏻', name: 'Light' },
        { id: 'medium-light', emoji: '🏼', name: 'Medium Light' },
        { id: 'medium', emoji: '🏽', name: 'Medium' },
        { id: 'medium-dark', emoji: '🏾', name: 'Medium Dark' },
        { id: 'dark', emoji: '🏿', name: 'Dark' }
      ],
      
      genderOptions: [
        { id: 'neutral', name: 'Neutral', icon: '🧑' },
        { id: 'male', name: 'Male', icon: '👨' },
        { id: 'female', name: 'Female', icon: '👩' }
      ],
      
      tabs: [
        { id: 'smileys', name: 'Smileys', icon: '😀' },
        { id: 'people', name: 'People', icon: '👱‍♀️' },
        { id: 'animals', name: 'Animals & Nature', icon: '🐶' },
        { id: 'food', name: 'Food & Drink', icon: '🍎' },
        { id: 'activities', name: 'Activities', icon: '⚽' },
        { id: 'travel', name: 'Travel & Places', icon: '🚗' },
        { id: 'objects', name: 'Objects', icon: '💡' },
        { id: 'symbols', name: 'Symbols', icon: '❤️' },
      ],
      
      emojiCategories: emojiCategories,
    };
  },

  // NEW: Add mounted lifecycle hook to detect current emoji's tab
  mounted() {
    if (this.currentEmoji) {
      const detectedTab = this.detectEmojiTab(this.currentEmoji);
      if (detectedTab) {
        this.activeTab = detectedTab;
      }
    }
  },
  
  computed: {
    currentSkinTone() {
      return this.skinTones.find(tone => tone.emoji === this.selectedSkinTone) || this.skinTones[2];
    },
    
    currentGender() {
      return this.genderOptions.find(gender => gender.id === this.selectedGender) || this.genderOptions[0];
    },
    
    currentTabData() {
      return this.emojiCategories[this.activeTab] || {};
    },
    
    shouldShowSkinToneControls() {
      return EmojiVariantService.shouldShowSkinToneControls(this.currentTabData);
    },
    
    shouldShowGenderControls() {
      return EmojiVariantService.shouldShowGenderControls(this.currentTabData);
    }
  },
  
  methods: {
    // NEW: Method to detect which tab contains the current emoji
    detectEmojiTab(targetEmoji) {
      if (!targetEmoji) return null;
      
      // Clean the emoji - remove skin tone and gender modifiers for comparison
      const cleanTargetEmoji = this.cleanEmoji(targetEmoji);
      
      // Search through all tabs and categories
      for (const tabId of Object.keys(this.emojiCategories)) {
        const tabData = this.emojiCategories[tabId];
        
        for (const categoryName of Object.keys(tabData)) {
          const categoryEmojis = tabData[categoryName];
          
          if (Array.isArray(categoryEmojis)) {
            for (const item of categoryEmojis) {
              let emojiToCheck = '';
              
              if (typeof item === 'string') {
                emojiToCheck = this.cleanEmoji(item);
              } else if (typeof item === 'object' && item.base) {
                emojiToCheck = this.cleanEmoji(item.base);
                
                // Also check variants if they exist
                if (item.variants) {
                  for (const variant of Object.values(item.variants)) {
                    if (typeof variant === 'object') {
                      for (const skinToneVariant of Object.values(variant)) {
                        if (this.cleanEmoji(skinToneVariant) === cleanTargetEmoji) {
                          return tabId;
                        }
                      }
                    } else if (typeof variant === 'string') {
                      if (this.cleanEmoji(variant) === cleanTargetEmoji) {
                        return tabId;
                      }
                    }
                  }
                }
              }
              
              if (emojiToCheck === cleanTargetEmoji) {
                return tabId;
              }
            }
          }
        }
      }
      
      return null; // Emoji not found in any category
    },

    // NEW: Helper method to clean emoji by removing modifiers
    cleanEmoji(emoji) {
      if (!emoji) return '';
      
      // Remove common skin tone modifiers
      const skinTonePattern = /[\u{1F3FB}-\u{1F3FF}]/gu;
      
      // Remove zero-width joiners and gender/profession modifiers
      const modifierPattern = /[\u200D\u2640\u2642\uFE0F]/g;
      
      return emoji
        .replace(skinTonePattern, '')
        .replace(modifierPattern, '')
        .trim();
    },

    // NEW: Check if an emoji is currently selected
    isEmojiSelected(emoji) {
      return emoji === this.currentEmoji;
    },

    // NEW: Check if "no emoji" is selected (empty string)
    isNoEmojiSelected() {
      return this.currentEmoji === '';
    },
    
    setActiveTab(tabId) {
      this.activeTab = tabId;
    },
    
    setSkinTone(skinTone) {
      this.selectedSkinTone = skinTone;
    },
    
    setGender(gender) {
      this.selectedGender = gender;
    },
    
    getEmojiVariant(emojiData) {
      return EmojiVariantService.getEmojiVariant(emojiData, this.selectedSkinTone, this.selectedGender);
    },
    
    selectCircleEmoji(emoji, name = '') {
      this.$emit('selectCircleEmoji', {
        emoji: emoji,
        name: name,
        key: Date.now().toString()
      });
    },
    
    selectNoEmoji() {
      this.$emit('selectCircleEmoji', {
        emoji: '',
        name: 'No Emoji',
        key: Date.now().toString()
      });
    },
    
    selectCategory(categoryData) {
      this.$emit('selectCategory', categoryData);
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
      
      <!-- Tabs -->
      <div class="circle-emoji-tabs">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          :class="['circle-emoji-tab', { active: activeTab === tab.id }]"
          @click="setActiveTab(tab.id)"
        >
          {{ tab.icon }}
        </button>
      </div>
      
      <!-- Skin Tone Controls (only when relevant) -->
      <div v-if="shouldShowSkinToneControls" class="person-controls">
        <div class="skin-tone-selector">
          <span class="control-label">Skin Tone:</span>
          <div class="skin-tone-options">
            <button
              v-for="tone in skinTones"
              :key="tone.id"
              :class="['skin-tone-option', { active: selectedSkinTone === tone.emoji }]"
              @click="setSkinTone(tone.emoji)"
              :title="tone.name"
            >
              <span v-if="tone.emoji" class="skin-tone-demo">{{ '👋' + tone.emoji }}</span>
              <span v-else class="skin-tone-demo">👋</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Gender Controls (only when relevant) -->
      <div v-if="shouldShowGenderControls" class="person-controls">
        <div class="gender-selector">
          <span class="control-label">Gender:</span>
          <div class="gender-options">
            <button
              v-for="gender in genderOptions"
              :key="gender.id"
              :class="['gender-option', { active: selectedGender === gender.id }]"
              @click="setGender(gender.id)"
              :title="gender.name"
            >
              {{ gender.icon }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Emoji Content -->
      <div class="circle-emoji-content">
        <!-- Iterate through categories for current tab -->
        <div v-for="(categoryEmojis, categoryName) in currentTabData" :key="categoryName" class="circle-emoji-section">
          <h4 class="section-title">{{ categoryName }}</h4>
          <div class="circle-emoji-grid">
            <!-- Handle array of strings (simple emojis) -->
            <div 
              v-if="Array.isArray(categoryEmojis) && typeof categoryEmojis[0] === 'string'"
              v-for="emoji in categoryEmojis"
              :key="emoji"
              :class="['circle-emoji-item', { selected: isEmojiSelected(emoji) }]"
              @click="selectCircleEmoji(emoji)"
              :title="emoji"
            >
              {{ emoji }}
            </div>
            
            <!-- Handle array of objects (emojis with variants) -->
            <div 
              v-else-if="Array.isArray(categoryEmojis) && typeof categoryEmojis[0] === 'object'"
              v-for="emojiData in categoryEmojis"
              :key="emojiData.base"
              :class="['circle-emoji-item', { selected: isEmojiSelected(getEmojiVariant(emojiData)) }]"
              @click="selectCircleEmoji(getEmojiVariant(emojiData), emojiData.name)"
              :title="emojiData.name"
            >
              {{ getEmojiVariant(emojiData) }}
            </div>
            
            <!-- Handle mixed arrays (some strings, some objects) -->
            <template v-else-if="Array.isArray(categoryEmojis)">
              <div 
                v-for="item in categoryEmojis"
                :key="typeof item === 'string' ? item : item.base"
                :class="['circle-emoji-item', { 
                  selected: isEmojiSelected(typeof item === 'string' ? item : getEmojiVariant(item))
                }]"
                @click="selectCircleEmoji(
                  typeof item === 'string' ? item : getEmojiVariant(item), 
                  typeof item === 'string' ? item : item.name
                )"
                :title="typeof item === 'string' ? item : item.name"
              >
                {{ typeof item === 'string' ? item : getEmojiVariant(item) }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  `
};
