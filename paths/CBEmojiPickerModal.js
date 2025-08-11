// pickers/EmojiPickerModal.js
import { EmojiRenderer } from './EmojiRenderer.js';

export const EmojiPickerModal = {
  props: {
    emojisByCategory: {
      type: Array,
      required: true
    },
    getEmojiDisplayTitle: {
      type: Function,
      required: true
    }
  },
  
  emits: ['selectEmoji', 'selectCategory', 'close'],
  
  components: {
    EmojiRenderer
  },
  
  template: `
    <div 
        class="emoji-picker-modal"
        style="display: block;"
    >
        <div class="emoji-grid">
            <template v-for="categoryGroup in emojisByCategory" :key="categoryGroup.category.key">
                <!-- Category Row with name on left and emojis on right -->
                <div class="emoji-category-row">
                    <!-- Category Name -->
                    <div class="emoji-category-name-left emoji-category-clickable" 
                         @click="$emit('selectCategory', categoryGroup)"
                         :title="'Click to load all ' + categoryGroup.category.name + ' emojis to recent palette'">
                        {{ categoryGroup.category.name }}
                    </div>
                    
                    <!-- Emojis in this category -->
                    <div class="emoji-category-items">
                        <div 
                            v-for="attribute in categoryGroup.emojis"
                            :key="attribute.key"
                            class="emoji-item"
                            :style="{ backgroundColor: attribute.color }"
                            @click="$emit('selectEmoji', attribute)"
                            :title="getEmojiDisplayTitle(attribute, 'picker')"
                        >
                            <EmojiRenderer 
                                :emoji="attribute"
                                context="picker"
                                :interactive="true"
                            />
                            <div class="emoji-item-name">{{ attribute.displayName }}</div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
  `
};
