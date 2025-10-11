// CircleCharacteristicsBar.js - Main component for circle characteristics bar
import { injectComponentStyles } from './styleUtils.js';
import { useCharacteristicsBarData } from './useCharacteristicsBarData.js';
import { useCharacteristicsBarActions } from './useCharacteristicsBarActions.js';
import { useCharacteristicsBarPickers } from './useCharacteristicsBarPickers.js';
import { useRecentEmojis } from './useRecentEmojis.js';
import { useCharacteristicsBarState } from './useCharacteristicsBarState.js';
import { useCharacteristicsBarHandlers } from './useCharacteristicsBarHandlers.js';
import { EmojiRenderer } from './EmojiRenderer.js';
import { EmojiService } from './emojiService.js';
import { EmojiVariantService } from './EmojiVariantService.js';
import { getEnergyTypeColor } from './energyTypes.js';
import { CBConnectionDirectionalityControl } from './CBConnectionDirectionalityControl.js';
import { getPropertyConfig } from './CBCyclePropertyConfigs.js';

// Import styles
import { baseCharacteristicsStyles, displayStyles, colorStyles, typeStyles, energyStyles, activationStyles, emojiStyles } from './cbBaseStyles.js';
import { modalStyles } from './cbModalStyles.js';
import { pickerSpecificStyles } from './cbPickerStyles.js';

// Import sub-components
import { TypeControl } from './CBTypeControl.js';
import { CircleEmojiControl } from './CBCircleEmojiControl.js';
import { ColorControl } from './CBColorControl.js';
import { EnergyControl } from './CBEnergyControl.js';
import { CBCyclePropertyControl } from './CBCyclePropertyControl.js';
import { CBJumpToReferenceControl } from './CBJumpToReferenceControl.js';
import { BreakReferenceControl } from './CBBreakReferenceControl.js';
import { EmojiControl } from './CBEmojiControl.js';
import { RecentEmojisControl } from './CBRecentEmojisControl.js';

// Import picker components
import { TypePickerModal } from './CBTypePickerModal.js';
import { CircleEmojiPickerModal } from './CBCircleEmojiPickerModal.js';
import { ColorPickerModal } from './CBColorPickerModal.js';
import { EnergyPickerModal } from './CBEnergyPickerModal.js';
import { EmojiPickerModal } from './CBEmojiPickerModal.js';

// Combine all styles
const componentStyles = `
    ${baseCharacteristicsStyles}
    ${displayStyles}
    ${colorStyles}
    ${typeStyles}
    ${energyStyles}
    ${activationStyles}
    ${emojiStyles}
    ${modalStyles}
    ${pickerSpecificStyles}
`;

// Inject component styles
injectComponentStyles('circle-characteristics-bar', componentStyles);

export const CircleCharacteristicsBar = {
  setup() {
    // Get all hooks
    const dataHooks = useCharacteristicsBarData();
    const actionHooks = useCharacteristicsBarActions();
    const pickerHooks = useCharacteristicsBarPickers();
    const recentEmojiHooks = useRecentEmojis();
    
    // Get state (which manages template refs and computed properties)
    const stateHooks = useCharacteristicsBarState(dataHooks, pickerHooks);
    
    // Get handlers (which use all the other hooks)
    const handlers = useCharacteristicsBarHandlers(
      dataHooks,
      actionHooks,
      pickerHooks,
      recentEmojiHooks,
      stateHooks
    );

    const getEmojiDisplayTitle = (emojiData, context) => {
      return EmojiService.getDisplayTitle(emojiData, context);
    };

    return {
      // Data from hooks
      ...dataHooks,
      ...recentEmojiHooks,
      
      // State from state hooks
      ...stateHooks,
      
      // Handlers
      ...handlers,
      
      // Utilities
      getEmojiDisplayTitle,
      getEnergyTypeColor,
      getPropertyConfig,
      EmojiVariantService,
      
      // Picker hooks
      isColorPickerOpen: pickerHooks.isColorPickerOpen,
      isTypePickerOpen: pickerHooks.isTypePickerOpen,
      isEnergyPickerOpen: pickerHooks.isEnergyPickerOpen,
      isEmojiPickerOpen: pickerHooks.isEmojiPickerOpen,
      isCircleEmojiPickerOpen: pickerHooks.isCircleEmojiPickerOpen,
      toggleColorPicker: pickerHooks.toggleColorPicker,
      toggleTypePicker: pickerHooks.toggleTypePicker,
      toggleEnergyPicker: pickerHooks.toggleEnergyPicker,
      toggleEmojiPicker: pickerHooks.toggleEmojiPicker,
      toggleCircleEmojiPicker: pickerHooks.toggleCircleEmojiPicker,
      closePickerAction: pickerHooks.closePickerAction,
    };
  },
  
  components: {
    EmojiRenderer,
    TypeControl,
    CircleEmojiControl,
    ColorControl,
    EnergyControl,
    CBCyclePropertyControl,
    CBJumpToReferenceControl,
    BreakReferenceControl,
    EmojiControl,
    RecentEmojisControl,
    TypePickerModal,
    CircleEmojiPickerModal,
    ColorPickerModal,
    EnergyPickerModal,
    EmojiPickerModal,
    CBConnectionDirectionalityControl,
  },
  
  template: `
    <div :class="['circle-characteristics-bar', { hidden: !isVisible }]">
        <!-- Circle Characteristic Controls (Hidden for Reference Circles in Single Selection) -->
        <template v-if="shouldShowCircleCharacteristicControls">
            <!-- Type Control -->
            <TypeControl 
                ref="typeDisplayRefTemplate"
                :currentTypeInfo="currentTypeInfo"
                :isPickerOpen="isTypePickerOpen"
                @toggle="toggleTypePicker"
            />

            <!-- Circle Emoji Control -->
            <CircleEmojiControl 
                v-if="isCircleEmojiPickerVisible"
                ref="circleEmojiDisplayRefTemplate"
                :selectedCircle="selectedCircle"
                :hasMultipleCirclesSelected="hasMultipleCirclesSelected"
                :selectedCircles="getSelectedCircleObjects"
                :isPickerOpen="isCircleEmojiPickerOpen"
                @toggle="toggleCircleEmojiPicker"
            />

            <!-- Color Control -->
            <ColorControl 
                ref="colorDisplayRefTemplate"
                :circleColors="circleColors"
                :isPickerOpen="isColorPickerOpen"
                @toggle="toggleColorPicker"
            />

            <!-- Energy Control -->
            <EnergyControl 
                ref="energyDisplayRefTemplate"
                :circleEnergyTypes="circleEnergyTypes"
                :isPickerOpen="isEnergyPickerOpen"
                :getEnergyTypeColor="getEnergyTypeColor"
                @toggle="toggleEnergyPicker"
            />

            <!-- Dynamic Cycleable Property Controls -->
            <CBCyclePropertyControl 
                v-for="propertyName in cycleableProperties"
                :key="propertyName"
                :property-name="propertyName"
                :property-value="getPropertyValue(propertyName)"
                @cycle="handlePropertyCycle(propertyName)"
            />
        </template>

        <!-- Reference Controls (Only shown for reference circles or multi-selection with references) -->
        <!-- Jump to Reference Control -->
        <CBJumpToReferenceControl 
            v-if="shouldShowJumpToReferenceControl"
            @jump-to-reference="handleJumpToReference"
        />

        <!-- Break Reference Control -->
        <BreakReferenceControl 
            v-if="shouldShowBreakReferenceControl"
            @break-reference="handleBreakReference"
        />

        <!-- Explicit Connection Controls (Only shown when exactly 2 circles selected with connection) -->
        <template v-if="shouldShowExplicitConnectionControls">
            <!-- Visual separator -->
            <div style="border-left: 1px solid #666; margin: 0 8px; height: 32px;"></div>
            
            <!-- Connection Directionality Control -->
            <CBConnectionDirectionalityControl 
                :directionality="connectionDirectionality"
                @cycle="handleDirectionalityCycle"
            />
        </template>

        <!-- Emoji Controls (Only Visible for Single Circle Selection) -->
        <template v-if="shouldShowEmojiControls">
            <!-- Emoji Control -->
            <EmojiControl 
                ref="emojiDisplayRefTemplate"
                :causeEmoji="causeEmoji"
                :isPickerOpen="isEmojiPickerOpen"
                :getEmojiDisplayTitle="getEmojiDisplayTitle"
                @toggle="toggleEmojiPicker"
                @selectQuickEmoji="handleQuickEmojiSelect"
            />

            <!-- Recent Emojis Control -->
            <RecentEmojisControl 
                v-if="recentEmojis.length > 0"
                :recentEmojis="recentEmojis"
                :getEmojiDisplayTitle="getEmojiDisplayTitle"
                @selectQuickEmoji="handleQuickEmojiSelect"
                @clearRecentEmojis="handleClearRecentEmojis"
            />
        </template>

        <!-- Picker Modals (Only show for non-reference circles) -->
        <template v-if="shouldShowCircleCharacteristicControls">
            <!-- Type Picker Modal -->
            <TypePickerModal 
                v-if="isTypePickerOpen"
                ref="typePickerRefTemplate"
                :circleTypes="circleTypes"
                :isTypeSelected="isTypeSelected"
                @selectType="handleTypeSelect"
                @close="closePickerAction('type')"
            />

            <!-- Circle Emoji Picker Modal -->
            <CircleEmojiPickerModal 
                v-if="isCircleEmojiPickerOpen"
                ref="circleEmojiPickerRefTemplate"
                :currentEmoji="getCurrentCircleEmoji"
                @selectCircleEmoji="handleCircleEmojiSelect"
                @close="closePickerAction('circleEmoji')"
            />
            
            <!-- Color Picker Modal -->
            <ColorPickerModal 
                v-if="isColorPickerOpen"
                ref="colorPickerRefTemplate"
                :colorFamilies="colorFamilies"
                :isColorSelected="isColorSelected"
                @selectColor="handleColorSelect"
                @close="closePickerAction('color')"
            />

            <!-- Energy Picker Modal -->
            <EnergyPickerModal 
                v-if="isEnergyPickerOpen"
                ref="energyPickerRefTemplate"
                :energyTypes="energyTypes"
                :isEnergySelected="isEnergySelected"
                @selectEnergy="handleEnergySelect"
                @close="closePickerAction('energy')"
            />
        </template>
        
        <!-- Emoji Picker Modal (Only available for single selection) -->
        <EmojiPickerModal 
            v-if="isEmojiPickerOpen && shouldShowEmojiControls"
            ref="emojiPickerRefTemplate"
            :emojisByCategory="emojisByCategory"
            :getEmojiDisplayTitle="getEmojiDisplayTitle"
            @selectEmoji="handleEmojiSelect"
            @selectCategory="handleCategorySelect"
            @close="closePickerAction('emoji')"
        />
    </div>
  `
};
