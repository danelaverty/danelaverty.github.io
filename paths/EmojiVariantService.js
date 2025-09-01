// EmojiVariantService.js - Enhanced emoji variant handling service

export const EmojiVariantService = {
  /**
   * Get the appropriate emoji variant based on selected skin tone and gender
   */
  getEmojiVariant(emojiData, selectedSkinTone = '', selectedGender = 'neutral') {
    // Handle simple string emojis (no variants)
    if (typeof emojiData === 'string') {
      return emojiData;
    }
    
    // Handle simple emojis with no variants
    if (!this.hasVariants(emojiData)) {
      return emojiData.base;
    }
    
    // Handle skin tone only variants
    if (emojiData.skinVariants) {
      return this.getSkinVariant(emojiData, selectedSkinTone);
    }
    
    // Handle gender only variants
    if (emojiData.genderVariants) {
      return this.getGenderVariant(emojiData, selectedGender);
    }
    
    // Handle both skin tone and gender variants
    if (emojiData.skinAndGenderVariants) {
      return this.getSkinAndGenderVariant(emojiData, selectedSkinTone, selectedGender);
    }
    
    return emojiData.base;
  },
  
  /**
   * Check if emoji has any variants
   */
  hasVariants(emojiData) {
    if (typeof emojiData === 'string') return false;
    return !!(emojiData.skinVariants || emojiData.genderVariants || emojiData.skinAndGenderVariants);
  },
  
  /**
   * Get skin tone variant
   */
  getSkinVariant(emojiData, selectedSkinTone) {
    // For default/empty skin tone, return the base emoji
    if (!selectedSkinTone || selectedSkinTone === '') {
      return emojiData.base;
    }
    
    // Find the variant with the selected skin tone
    const variant = emojiData.skinVariants.find(v => v.includes(selectedSkinTone));
    return variant || emojiData.base;
  },
  
  /**
   * Get gender variant
   */
  getGenderVariant(emojiData, selectedGender) {
    const genderVariants = emojiData.genderVariants;
    return genderVariants[selectedGender] || genderVariants.neutral || emojiData.base;
  },
  
  /**
   * Get combined skin tone and gender variant
   */
  getSkinAndGenderVariant(emojiData, selectedSkinTone, selectedGender) {
    const genderVariants = emojiData.skinAndGenderVariants[selectedGender] || 
                          emojiData.skinAndGenderVariants.neutral;
    
    if (!genderVariants || !Array.isArray(genderVariants)) {
      return emojiData.base;
    }
    
    // For default/empty skin tone, return the first variant in the gender array
    // This represents the "default" skin tone for that gender
    if (!selectedSkinTone || selectedSkinTone === '') {
      return genderVariants[0] || emojiData.base;
    }
    
    // Find the variant with the selected skin tone
    const variant = genderVariants.find(v => v.includes(selectedSkinTone));
    return variant || genderVariants[0] || emojiData.base;
  },
  
  /**
   * Check if emoji supports skin tone variants
   */
  supportsSkinTone(emojiData) {
    if (typeof emojiData === 'string') return false;
    return !!(emojiData.skinVariants || emojiData.skinAndGenderVariants);
  },
  
  /**
   * Check if emoji supports gender variants
   */
  supportsGender(emojiData) {
    if (typeof emojiData === 'string') return false;
    return !!(emojiData.genderVariants || emojiData.skinAndGenderVariants);
  },
  
  /**
   * Get available gender options for an emoji
   */
  getAvailableGenders(emojiData) {
    if (typeof emojiData === 'string') return ['neutral'];
    
    if (emojiData.genderVariants) {
      return Object.keys(emojiData.genderVariants);
    }
    if (emojiData.skinAndGenderVariants) {
      return Object.keys(emojiData.skinAndGenderVariants);
    }
    return ['neutral'];
  },
  
  /**
   * Check what controls should be shown for a given set of emoji data
   */
  shouldShowSkinToneControls(currentTabData) {
    if (!currentTabData) return false;
    
    return Object.values(currentTabData).some(categoryEmojis => {
      if (!Array.isArray(categoryEmojis)) return false;
      return categoryEmojis.some(emoji => 
        typeof emoji === 'object' && this.supportsSkinTone(emoji)
      );
    });
  },
  
  shouldShowGenderControls(currentTabData) {
    if (!currentTabData) return false;
    
    return Object.values(currentTabData).some(categoryEmojis => {
      if (!Array.isArray(categoryEmojis)) return false;
      return categoryEmojis.some(emoji => 
        typeof emoji === 'object' && this.supportsGender(emoji)
      );
    });
  }
};
