// src/config/Config.js
// Optimized configuration settings for the Chakra Visualizer using compression techniques

(function(ChakraApp) {
  // Helper function to expand compressed chakra forms
  function expandChakraForm(compressedForm) {
    return compressedForm.map(function(formSet) {
      return formSet.map(function(form) {
        // Expand the compressed format to full objects
        var expanded = {
          sides: form[0],
          starFactor: form[1] || 1,
          borderPercent: form[2] / 100 || 0.1
        };
        
        if (form.length > 3) {
          if (form[3]) expanded.rotate = form[3];
          if (form[4]) expanded.scale = form[4];
          if (form[5]) expanded.reverse = 1;
          if (form[6]) expanded.spinTime = form[6];
        }
        
        return expanded;
      });
    });
  }

  // Helper function to expand crystal categories
  function expandCrystalCategories(categories) {
    return categories.map(function(cat) {
      return {
        name: cat[0],
        bg: cat[1],
        options: cat[2].map(function(opt) {
          return { value: opt[0], display: opt[1], secondary: null };
        })
      };
    });
  }

  // Compressed data
  var CompressedConfig = {
    defaultName: '???',
    
    // Compressed crystal data - format: [category name, bg color, [[value, display], ...]]
    crystalCategories: [
      ["Warm Crystals", "#FFF5F5", [
        ["#FF0050", "Ruby"],
        ["#FF0000", "Garnet"],
        ["#FFAAAA", "Rose Quartz"],
        ["#FF5234", "Carnelian"],
        ["#FFAC00", "Amber"],
        ["#FFE700", "Citrine"],
        ["#B87333", "Tiger's Eye"],
        ["#CD7F32", "Sunstone"],
        ["#D35400", "Fire Agate"],
        ["#A52A2A", "Smoky Quartz"],
        ["#FFFFFF", "Clear Quartz"],
        ["#FFC0CB", "Rhodochrosite"]
      ]],
      ["Cool Crystals", "#F5F5FF", [
        ["#D0FF00", "Peridot"],
        ["#00FF00", "Emerald"],
        ["#00FFD0", "Aquamarine"],
        ["#99EEFF", "Turquoise"],
        ["#0000FF", "Sapphire"],
        ["#AA2BFF", "Amethyst"],
        ["#FF00FF", "Sugilite"],
        ["#800080", "Charoite"],
        ["#483D8B", "Lapis Lazuli"],
        ["#999999", "Hematite"],
        ["#000000", "Obsidian"],
      ]]
    ],
    
    // Compressed chakra forms - format: [[sides, starFactor, borderPercent*100, rotate?, scale?, reverse?, spinTime?], ...]
    chakraFormsCompressed: [
  [[3, 1, 18, 0, 0.01]],
  [[3, 1, 18, 0, 0.9]],
  [[4, 1, 12], [4, 1, 12, 45]],
  [[5, 1, 10], [5, 1, 10, 36]],
  [[11, 3, 12]],
  [[7, 2, 12, 0, 0.4], [9, 2, 8, 0, 1.2, 1, 64]],
  [[7, 2, 12, 0, 0.7], [9, 2, 8, 0, 1.2, 1, 64]],
  [[9, 2, 12, 0, 0.8], [9, 2, 8, 0, 1.2, 1, 64]],
  [[11, 2, 7, 0, 1.2], [11, 2, 6, 30, 1.0]],
  [[17, 2, 8], [17, 2, 4, 0, 1.2, 1, 32]],
  [[16, 5, 12, 0, 0.9], [22, 3, 1, 0, 1.8, 1, 32]],
  [[21, 8, 8], [17, 4, 4, 0, 1.2, 1, 32]],
  [[21, 8, 8], [17, 4, 4, 0, 1.2, 1, 32], [25, 4, 2, 0, 1.5, 0, 64]],
  [[6, 1, 12], [6, 1, 8, 30, 1.1]],
  [[7, 2, 10], [7, 3, 8, 0, 1.2]],
  [[8, 1, 12], [8, 3, 8, 0, 1.15, 1, 40]],
  [[9, 2, 10], [9, 4, 8, 0, 1.2]],
  [[10, 1, 12], [10, 3, 8, 18, 0, 0, 48]],
  [[11, 1, 10], [11, 3, 8, 0, 1.2], [11, 5, 5, 0, 1.4, 1]],
  [[14, 1, 12], [14, 3, 8, 0, 1.25], [7, 2, 5, 0, 1.5, 0, 44]],
  [[18, 1, 12], [18, 5, 8, 0, 1.2, 0, 50], [9, 2, 5, 0, 1.4, 1]],
  [[22, 1, 12], [22, 9, 8, 0, 1.25, 0, 48], [11, 3, 5, 0, 1.5, 1]],
  [[23, 1, 10], [23, 7, 8, 0, 1.2], [23, 11, 5, 0, 1.4, 0, 60, 1]],
  [[24, 1, 12], [24, 5, 8, 0, 1.25, 0, 54], [12, 5, 5, 0, 1.45, 1]],
  [[25, 1, 10], [25, 7, 8, 0, 1.22], [25, 12, 5, 0, 1.4, 0, 45, 1]],
  [[26, 1, 12], [26, 9, 8, 0, 1.28, 0, 50], [13, 5, 5, 0, 1.5, 1]],
  [[34, 1, 12], [34, 15, 8, 0, 1.3, 0, 56], [17, 4, 5, 0, 1.52, 1, 48]],
  [[42, 1, 12], [42, 19, 8, 0, 1.35, 0, 50], [21, 8, 5, 0, 1.58, 1, 42]],
  [[44, 1, 12], [44, 15, 8, 0, 1.32, 0, 48], [22, 7, 5, 0, 1.55, 1, 54]],
  [[56, 1, 10], [56, 27, 8, 0, 1.35], [56, 25, 5, 0, 1.62, 1, 50]],
  [[60, 1, 10], [60, 23, 8, 0, 1.3, 0, 48], [60, 29, 5, 0, 1.5, 1, 54], [30, 7, 3, 0, 1.8, 0, 40]],
  [[68, 1, 10], [68, 33, 8, 0, 1.38], [68, 23, 5, 0, 1.7, 1, 50]],
  [[6, 1, 14, 0, 0.5], [6, 1, 8, 0, 1.3], [6, 1, 6, 0, 2.1]],
  [[7, 2, 13, 0, 0.5, 0, 14], [7, 2, 7, 0, 1.4, 0, 48], [7, 2, 3, 0, 2.2, 0, 48]],
  [[8, 3, 12, 0, 0.5, 0, 18], [8, 3, 6, 0, 1.5, 0, 42], [8, 3, 2, 0, 2.4, 0, 42]],
  [[14, 3, 11, 0, 0.5, 0, 32], [14, 3, 7, 0, 1.8, 0, 40]],
  [[16, 5, 10, 0, 0.5, 0, 28], [16, 5, 6, 0, 1.8, 0, 44]],
  [[18, 7, 9, 0, 0.5, 0, 24], [18, 7, 5, 0, 1.8, 0, 48]],
  [[20, 9, 8, 0, 0.5, 0, 20], [20, 9, 4, 0, 1.8, 0, 52]],
  [[10, 3, 11, 0, 0.8, 0, 32], [10, 3, 7, 0, 1.6, 1, 36]],
  [[11, 4, 10, 0, 0.9, 0, 36], [11, 4, 6, 0, 1.8, 1, 32]],
  [[12, 5, 9, 0, 1.0, 0, 40], [12, 5, 5, 0, 1.9, 1, 28]],
  [[13, 5, 8, 0, 1.1, 0, 44], [13, 5, 4, 0, 2.0, 1, 24]],
  [[8, 3, 12, 0, 0.8], [8, 3, 8, 0, 1.3], [8, 3, 4, 0, 2.0]],
  [[9, 4, 11, 0, 0.9], [9, 4, 7, 0, 1.4], [9, 4, 3, 0, 2.0]],
  [[10, 3, 10, 0, 1.0], [10, 3, 6, 0, 1.5], [10, 3, 2, 0, 2.1]],
  [[12, 5, 8, 0, 1.2], [12, 5, 4, 0, 1.7], [12, 5, 2, 0, 2.2]],
  [[10, 3, 12, 0, 0.5], [10, 3, 8, 18, 1.4], [10, 3, 4, 36, 2.1]],
  [[12, 5, 11, 0, 0.5, 0, 28], [12, 5, 7, 15, 1.4, 0, 36], [12, 5, 3, 30, 2.1, 0, 44]],
  [[14, 3, 10, 0, 0.5, 0, 32], [14, 3, 6, 12.85, 1.5, 1, 40], [14, 3, 2, 25.7, 2.2, 0, 48]],
  [[16, 5, 9, 0, 0.5, 0, 36], [16, 5, 5, 11.25, 1.5, 1, 44], [16, 5, 2, 22.5, 2.2, 1, 52]],
  [[18, 7, 8, 0, 0.5, 0, 40], [18, 7, 4, 10, 1.6, 1, 48], [18, 7, 2, 20, 2.3, 0, 56]],
  [[16, 3, 12, 0, 0.4, 0, 32], [8, 3, 8, 22.5, 1.4, 1, 48], [16, 7, 4, 0, 2.2, 0, 24]],
  [[20, 7, 11, 0, 0.4, 0, 36], [10, 3, 7, 18, 1.5, 1, 52], [5, 2, 3, 0, 2.3, 0, 28]],
  [[24, 7, 10, 0, 0.4, 0, 40], [12, 5, 6, 15, 1.5, 1, 56], [8, 3, 2, 0, 2.3, 1, 32]],
  [[28, 11, 9, 0, 0.4, 0, 44], [14, 5, 5, 12.85, 1.6, 1, 60], [7, 3, 1, 0, 2.4, 0, 36]],
  [[32, 13, 8, 0, 0.4, 0, 48], [16, 7, 4, 11.25, 1.6, 1, 64], [8, 3, 1, 0, 2.4, 1, 40]],
  [[8, 3, 12, 0, 0.6], [8, 3, 8, 0, 1.2], [8, 3, 4, 0, 1.8]],
  [[10, 3, 11, 0, 0.7], [10, 3, 7, 0, 1.3], [10, 3, 3, 0, 1.9]],
  [[12, 5, 10, 0, 0.8], [12, 5, 6, 0, 1.4], [12, 5, 2, 0, 2.0]],
  [[14, 3, 9, 0, 0.9], [14, 3, 5, 0, 1.5], [14, 3, 2, 0, 2.1]],
  [[16, 5, 8, 0, 1.0], [16, 5, 4, 0, 1.6], [16, 5, 2, 0, 2.2]],
  [[9, 2, 12, 0, 0.6], [9, 4, 8, 0, 1.2], [3, 1, 4, 0, 1.8, 1, 40]],
  [[10, 3, 11, 0, 0.6], [10, 3, 7, 0, 1.2], [5, 2, 3, 0, 1.9, 1, 36]],
  [[12, 5, 10, 0, 0.6, 0, 28], [12, 5, 6, 0, 1.3, 0, 42], [6, 1, 2, 0, 2.0, 1, 56]],
  [[14, 3, 9, 0, 0.6, 0, 32], [14, 3, 5, 0, 1.4, 1, 48], [7, 2, 2, 0, 2.1, 0, 36]],
  [[18, 5, 8, 0, 0.6, 0, 36], [18, 7, 4, 0, 1.5, 1, 54], [9, 4, 2, 0, 2.2, 0, 30]],
  [[11, 4, 10, 0, 0.4, 0, 28], [11, 4, 6, 0, 1.5, 1, 42], [11, 4, 2, 0, 2.5, 0, 56]],
  [[13, 5, 9, 0, 0.4, 1, 32], [13, 5, 5, 0, 1.6, 0, 48], [13, 5, 2, 0, 2.5, 1, 40]],
  [[15, 7, 8, 0, 0.4, 0, 36], [15, 4, 5, 0, 1.6, 1, 54], [15, 2, 2, 0, 2.5, 0, 30]],
  [[17, 6, 7, 0, 0.4, 1, 40], [17, 8, 4, 0, 1.7, 0, 32], [17, 4, 2, 0, 2.5, 1, 48]],
  [[19, 8, 6, 0, 0.4, 0, 44], [19, 9, 4, 0, 1.7, 1, 36], [19, 5, 2, 0, 2.5, 0, 52]],
  [[12, 5, 12, 0, 0.4], [12, 5, 8, 0, 1.2], [12, 5, 4, 0, 1.9], [12, 5, 2, 0, 2.6]],
  [[15, 4, 11, 0, 0.4, 0, 30], [15, 4, 7, 0, 1.3, 0, 45], [15, 4, 4, 0, 2.0, 0, 60], [15, 4, 2, 0, 2.6, 0, 25]],
  [[18, 5, 10, 0, 0.4, 0, 32], [18, 5, 7, 0, 1.3, 1, 48], [18, 5, 4, 0, 2.1, 0, 64], [18, 5, 2, 0, 2.6, 1, 28]],
  [[21, 8, 9, 0, 0.4, 0, 36], [21, 8, 6, 0, 1.4, 1, 54], [21, 8, 3, 0, 2.2, 0, 42], [21, 8, 2, 0, 2.6, 1, 30]],
  [[24, 7, 8, 0, 0.4, 0, 40], [24, 7, 6, 0, 1.5, 1, 60], [24, 7, 3, 0, 2.3, 0, 30], [24, 7, 1, 0, 2.6, 1, 45]],
  [[8, 3, 12, 0, 0.4, 0, 36], [16, 5, 8, 0, 1.2, 1, 48], [24, 7, 4, 0, 2.0, 0, 60], [8, 3, 2, 0, 2.7, 1, 24]],
  [[9, 2, 11, 0, 0.4, 0, 32], [18, 5, 7, 0, 1.3, 1, 48], [27, 8, 4, 0, 2.1, 0, 64], [9, 4, 2, 0, 2.7, 1, 28]],
  [[10, 3, 10, 0, 0.4, 0, 40], [20, 7, 7, 0, 1.4, 1, 52], [30, 11, 3, 0, 2.2, 0, 36], [10, 3, 2, 0, 2.7, 1, 60]],
  [[11, 4, 9, 0, 0.4, 0, 44], [11, 4, 6, 0, 1.5, 1, 32], [11, 4, 3, 0, 2.3, 0, 56], [11, 5, 1, 0, 2.7, 1, 38]],
  [[12, 5, 8, 0, 0.4, 0, 48], [12, 5, 6, 0, 1.6, 1, 36], [12, 5, 3, 0, 2.4, 0, 60], [12, 5, 1, 0, 2.7, 1, 30]],
  [[16, 7, 10, 0, 0.4, 0, 24], [16, 5, 8, 0, 0.9, 1, 36], [16, 3, 6, 0, 1.4, 0, 48], [16, 7, 4, 0, 2.0, 1, 60], [16, 5, 2, 0, 2.8, 0, 30]],
  [[18, 5, 10, 0, 0.4, 0, 28], [18, 7, 8, 0, 0.9, 1, 42], [18, 5, 6, 0, 1.5, 0, 56], [18, 7, 4, 0, 2.1, 1, 32], [18, 5, 2, 0, 2.8, 0, 48]],
  [[20, 9, 9, 0, 0.4, 0, 32], [20, 7, 7, 0, 1.0, 1, 48], [20, 3, 5, 0, 1.6, 0, 64], [20, 9, 3, 0, 2.2, 1, 28], [20, 7, 1, 0, 2.8, 0, 44]],
  [[24, 7, 8, 0, 0.4, 0, 36], [24, 11, 6, 0, 1.0, 1, 54], [24, 5, 4, 0, 1.7, 0, 30], [24, 7, 2, 0, 2.3, 1, 60], [24, 11, 1, 0, 2.8, 0, 42]],
  [[30, 11, 7, 0, 0.4, 0, 40], [30, 13, 5, 0, 1.1, 1, 60], [30, 7, 4, 0, 1.8, 0, 36], [30, 11, 2, 0, 2.4, 1, 54], [30, 13, 1, 0, 2.8, 0, 48]],
  [[24, 5, 10, 0, 0.4, 0, 36], [24, 7, 8, 0, 1.0, 0, 48], [24, 11, 6, 0, 1.6, 1, 60], [12, 5, 4, 0, 2.2, 0, 30], [8, 3, 2, 0, 3.0, 1, 42]],
  [[28, 9, 9, 0, 0.4, 0, 32], [28, 11, 7, 0, 1.1, 1, 48], [28, 13, 5, 0, 1.7, 0, 64], [14, 5, 3, 0, 2.3, 1, 36], [7, 3, 1, 0, 3.0, 0, 52]],
  [[32, 7, 8, 0, 0.4, 0, 30], [32, 13, 6, 0, 1.2, 1, 45], [32, 15, 4, 0, 1.8, 0, 60], [16, 7, 2, 0, 2.4, 1, 40], [8, 3, 1, 0, 3.0, 0, 25]],
  [[36, 11, 7, 0, 0.4, 0, 42], [36, 13, 5, 0, 1.3, 1, 56], [36, 17, 3, 0, 1.9, 0, 28], [18, 5, 2, 0, 2.5, 1, 48], [9, 4, 1, 0, 3.0, 0, 36]],
  [[40, 17, 6, 0, 0.4, 0, 45], [40, 13, 4, 0, 1.4, 1, 30], [40, 19, 3, 0, 2.0, 0, 60], [20, 9, 2, 0, 2.6, 1, 36], [10, 3, 1, 0, 3.0, 0, 48]],
  [[9, 2, 12, 0, 0.6], [9, 4, 8, 0, 1.4], [3, 1, 4, 0, 2.2, 1, 40]],
  [[10, 3, 11, 0, 0.6], [10, 3, 7, 0, 1.5], [5, 2, 3, 0, 2.3, 1, 36]],
  [[12, 5, 10, 0, 0.6, 0, 28], [12, 5, 6, 0, 1.6, 0, 42], [6, 1, 2, 0, 2.3, 1, 56]],
  [[14, 3, 9, 0, 0.6, 0, 32], [14, 3, 5, 0, 1.7, 1, 48], [7, 2, 2, 0, 2.4, 0, 36]],
  [[18, 5, 8, 0, 0.6, 0, 36], [18, 7, 4, 0, 1.8, 1, 54], [9, 4, 2, 0, 2.4, 0, 30]],
  [[10, 3, 12, 0, 0.5], [10, 3, 8, 18, 1.5], [10, 3, 4, 36, 2.5]],
  [[12, 5, 11, 0, 0.5, 0, 28], [12, 5, 7, 15, 1.5, 0, 36], [12, 5, 3, 30, 2.5, 0, 44]],
  [[14, 5, 10, 0, 0.5, 0, 32], [14, 3, 6, 12.85, 1.5, 1, 40], [14, 6, 2, 25.7, 2.5, 0, 48]],
  [[16, 5, 9, 0, 0.5, 0, 36], [16, 7, 5, 11.25, 1.5, 1, 44], [16, 3, 2, 22.5, 2.5, 1, 52]],
  [[20, 7, 8, 0, 0.5, 0, 40], [20, 9, 4, 9, 1.5, 1, 48], [20, 3, 2, 18, 2.5, 0, 56]],
  [[16, 3, 12, 0, 0.4, 0, 32], [16, 7, 8, 11.25, 1.4, 1, 48], [16, 5, 4, 0, 2.4, 0, 24]],
  [[17, 4, 11, 0, 0.4, 0, 36], [17, 8, 7, 10.59, 1.5, 1, 52], [17, 6, 3, 0, 2.5, 0, 28]],
  [[21, 8, 10, 0, 0.4, 0, 40], [21, 5, 6, 8.57, 1.6, 1, 56], [21, 10, 2, 0, 2.6, 1, 32]],
  [[23, 7, 9, 0, 0.4, 0, 44], [23, 11, 5, 7.83, 1.7, 1, 60], [23, 9, 2, 0, 2.6, 0, 36]],
  [[30, 11, 8, 0, 0.4, 0, 48], [30, 13, 4, 6, 1.8, 1, 64], [30, 7, 1, 0, 2.6, 1, 40]],
  [[12, 5, 12, 0, 0.4], [12, 5, 8, 0, 1.2], [12, 5, 4, 0, 2.0], [12, 5, 2, 0, 2.7]],
  [[15, 4, 11, 0, 0.4, 0, 30], [15, 7, 7, 0, 1.3, 0, 45], [15, 4, 4, 0, 2.1, 0, 60], [15, 2, 2, 0, 2.7, 0, 25]],
  [[18, 5, 10, 0, 0.4, 0, 32], [18, 7, 7, 0, 1.4, 1, 48], [18, 5, 4, 0, 2.2, 0, 64], [18, 8, 2, 0, 2.7, 1, 28]],
  [[21, 8, 9, 0, 0.4, 0, 36], [21, 5, 6, 0, 1.5, 1, 54], [21, 10, 3, 0, 2.3, 0, 42], [21, 3, 2, 0, 2.7, 1, 30]],
  [[24, 7, 8, 0, 0.4, 0, 40], [24, 11, 6, 0, 1.6, 1, 60], [24, 5, 3, 0, 2.4, 0, 30], [24, 7, 1, 0, 2.7, 1, 45]],
  [[8, 3, 12, 0, 0.4, 0, 36], [16, 5, 8, 0, 1.2, 1, 48], [24, 7, 4, 0, 2.0, 0, 60], [8, 3, 2, 0, 2.8, 1, 24]],
  [[9, 2, 11, 0, 0.4, 0, 32], [18, 5, 7, 0, 1.4, 1, 48], [27, 8, 4, 0, 2.2, 0, 64], [9, 4, 2, 0, 2.8, 1, 28]],
  [[10, 3, 10, 0, 0.4, 0, 40], [20, 7, 7, 0, 1.6, 1, 52], [30, 11, 3, 0, 2.4, 0, 36], [10, 3, 2, 0, 2.8, 1, 60]],
  [[11, 4, 9, 0, 0.4, 0, 44], [22, 7, 6, 0, 1.8, 1, 32], [33, 10, 3, 0, 2.5, 0, 56], [11, 5, 1, 0, 2.8, 1, 38]]
  ],
    
    // Predefined colors array (unchanged)
    predefinedColors: [
      '#FF0000', // Red
      '#FF7F00', // Orange
      '#FFFF00', // Yellow
      '#00FF00', // Green
      '#0000FF', // Blue
      '#4B0082', // Indigo
      '#9400D3', // Violet
      '#FF1493', // Pink
      '#00FFFF', // Cyan
      '#FFFFFF'  // White
    ],

    indicatorEmojis: [
  { id: 'important', emoji: '❗', name: 'Important' },
  { id: 'done', emoji: '✔️', name: 'Done' },
  { id: 'good', emoji: '🌟', name: 'Good' },
  { id: 'bad', emoji: '😖', name: 'Bad' },  
  { id: 'start', emoji: '▶️', name: 'Start' },
  { id: 'finish', emoji: '🏁', name: 'Finish' },
],

    circleTypes: [
  {
    id: 'standard',
    name: 'Feelings',
    description: 'Emotional states and experiences',
    shape: 'standard',
    color: '#C0C0C0',
    position: 1,
  },
  {
    id: 'star',
    name: 'Moves',
    description: 'Actions & Strategies',
    shape: 'star',
    color: '#FF9933', // Orange color for the star
    position: 2
  },
  {
    id: 'triangle',
    name: 'Things',
    description: 'Conditions & Systems',
    shape: 'triangle', 
    color: '#88B66d',
    position: 3
  },
  /*{
    id: 'hexagon',
    name: 'Combos',
    description: 'Complex Systems & Patterns',
    shape: 'hexagon',
    color: '#9932CC', 
    position: 4
  },*/
  {
    id: 'gem',
    name: 'Buckets',
    description: 'Areas of Concern',
    shape: 'gem',
    color: '#4a6fc9',
    position: 4
  },
],

circleTypeTemplates: [
  {
    id: 'modern7',
    name: '7 Chakras',
    type: 'gem',
    circles: [
      { x: 50, y: 330, color: '#FF0000', name: 'SURVIVAL' },
      { x: 50, y: 280, color: '#FF8800', name: 'PLEASURE' },
      { x: 50, y: 230, color: '#FFFF00', name: 'POWER' },
      { x: 50, y: 180, color: '#00AA00', name: 'LOVE' },
      { x: 50, y: 130, color: '#0099FF', name: 'VOICE' },
      { x: 50, y: 80, color: '#550099', name: 'INSIGHT' },
      { x: 50, y: 30, color: '#FF00FF', name: 'SPIRIT' },
    ],
  },
  {
    id: 'basic_emotions',
    name: 'Basic Emotions',
    type: 'standard',
    circles: [
      { x: 50, y: 50, color: '#FF0000', name: 'Anger' },
      { x: 100, y: 50, color: '#0000FF', name: 'Sadness' },
      { x: 150, y: 50, color: '#FFFF00', name: 'Joy' },
      { x: 200, y: 50, color: '#00FF00', name: 'Fear' },
      { x: 250, y: 50, color: '#FF00FF', name: 'Disgust' },
      { x: 300, y: 50, color: '#FFA500', name: 'Surprise' },
    ],
  },
  {
    id: 'basic_actions',
    name: 'Basic Actions',
    type: 'star',
    circles: [
      { x: 80, y: 80, color: '#FF6B35', name: 'Plan' },
      { x: 160, y: 80, color: '#F7931E', name: 'Execute' },
      { x: 240, y: 80, color: '#FFD23F', name: 'Review' },
      { x: 320, y: 80, color: '#88D8B0', name: 'Adjust' },
    ],
  },
  {
    id: 'basic_systems',
    name: 'Basic Systems',
    type: 'triangle',
    circles: [
      { x: 100, y: 100, color: '#88B66d', name: 'Input' },
      { x: 200, y: 100, color: '#7BA05B', name: 'Process' },
      { x: 300, y: 100, color: '#6E8B3D', name: 'Output' },
      { x: 200, y: 180, color: '#5C7A29', name: 'Feedback' },
    ],
  },
  /*{
    id: 'complex_pattern',
    name: 'Complex Pattern',
    type: 'hexagon',
    circles: [
      { x: 150, y: 80, color: '#9932CC', name: 'Core' },
      { x: 100, y: 130, color: '#8A2BE2', name: 'Support A' },
      { x: 200, y: 130, color: '#8A2BE2', name: 'Support B' },
      { x: 75, y: 180, color: '#7B68EE', name: 'Element C' },
      { x: 150, y: 200, color: '#7B68EE', name: 'Element D' },
      { x: 225, y: 180, color: '#7B68EE', name: 'Element E' },
    ],
  },*/
],


    
    // Attribute info - kept as is due to text content
    attributeInfo: {
      cause: { emoji: '⚡', color: '#9999CC', displayName: 'Factor' },
      push: { emoji: '🏃', color: '#FFFFB0', displayName: 'Pushes' },
      stop: { emoji: '🛑', color: '#BD2C2C', displayName: 'Stops' },
      treasure: { emoji: '💎', color: '#66D6FF', displayName: 'Gems' },
      mountain: { emoji: '⛰️', color: '#8B4513', displayName: 'Mountain' },
      demon: { emoji: '😈', color: '#663399', displayName: 'Demons' },
      sword: { emoji: '🗡️', color: '#C0C0C0', displayName: 'Swords' },
      chain: { emoji: '⛓️', color: '#2F4F4F', displayName: 'Chains' },
      ally: { emoji: '🧝🏻‍♂️', color: '#FF8C00', displayName: 'Allies' },
      group: { emoji: '👥', color: '#DDCC99', displayName: 'Group' },
      me: { emoji: '🧑🏼', color: '#FFCC88', displayName: 'Me', defaultName: 'Me' },
      battlefield: { emoji: '⚔️', color: '#5B2503', displayName: 'Battlefield' },
      soldier: { emoji: '💂', color: '#00008B', displayName: 'Soldier' },
      enemy: { emoji: '💂', color: '#8B0000', displayName: 'Enemy' },
      strategy: { emoji: '📝', color: '#DADAC0', displayName: 'Strategy' },
      door: { emoji: '🚪', color: '#5B4072', displayName: 'Door' },
      key: { emoji: '🔑', color: '#975', displayName: 'Key' },
      lock: { emoji: '🔒', color: '#555', displayName: 'Lock' },
      destination: { emoji: '🏁', color: '#595', displayName: 'Destination' },
      tools: { emoji: '🛠️', color: '#555555', displayName: 'Tools' },
      parts: { emoji: '⚙️', color: '#AAAAAA', displayName: 'Parts' },
      machine: { emoji: '🏗️', color: '#666633', displayName: 'The Machine' },
      site: { emoji: '🏞️', color: '#24CC24', displayName: 'Site' },
      bricks: { emoji: '🧱', color: '#EE7766', displayName: 'Bricks' },
      building: { emoji: '🏛️', color: '#DDA', displayName: 'Building' },
      event: { emoji: '💥', color: '#EECC99', displayName: 'Event' },
      chapter: { emoji: '📃', color: '#EEEEEE', displayName: 'Chapter' },
      book: { emoji: '📕', color: '#DDDDAA', displayName: 'Book' },
      positive: { emoji: '👍', color: '#AADDAA', displayName: 'Positive' },
      negative: { emoji: '👎', color: '#DDAAAA', displayName: 'Negative' },
      problem: { emoji: '🔥', color: '#996622', displayName: 'Problem' },
      evidence: { emoji: '📃', color: '#EEEEEE', displayName: 'Evidence' },
      done: { emoji: '✔️', color: '#AAEEAA', displayName: 'Done' },
      physicalThing: { emoji: '🧊', color: '#C99', displayName: 'Thing' },
      behavioralThing: { emoji: '🏃', color: '#9CC', displayName: 'Action' },
      conceptualThing: { emoji: '💭', color: '#C9C', displayName: 'Concept' },
      words: { emoji: '💬', color: '#99C', displayName: 'Words' },
      model: { emoji: '🖼️', color: '#2D7', displayName: 'Example' },
      roleModel: { emoji: '🕺', color: '#D72', displayName: 'Role Model' },
      trait: { emoji: '⚡', color: '#D27', displayName: 'Trait' },
      mystery: { emoji: '🤔', color: '#858', displayName: 'Mystery' },
      hypothesis: { emoji: '💭', color: '#77A', displayName: 'Hypothesis' },
      clue: { emoji: '🔍', color: '#7AA', displayName: 'Clue' },
      milestone: { emoji: '📍', color: '#A77', displayName: 'Milestone' },
      feeling: { emoji: '⚪', color: '#222', displayName: 'Feeling' },
      action: { emoji: '▶︎', color: '#777', displayName: 'Action' },
      thing: { emoji: '🔺', color: '#222', displayName: 'Thing' },
      pattern: { emoji: '⬡', color: '#AA7', displayName: 'Pattern' },
      victory: { emoji: '🏆', color: '#DC7', displayName: 'Victory' },
      defeat: { emoji: '🤕', color: '#BBB', displayName: 'Defeat' },
      chunk: { emoji: '🥩', color: '#EBB', displayName: 'Chunk' },
      cut: { emoji: '🔪', color: '#DDD', displayName: 'Cut' },
      spit: { emoji: '💦', color: '#BDE', displayName: 'Spit' },
      bulbOn: { emoji: '💡', color: '#EEA', displayName: 'On' },
      bulbOff: { emoji: '💡', color: '#444', displayName: 'Off' },
    },
    
    // Layout configuration
    sizes: {
      small: { circle: 30, square: 30 },
      medium: { circle: 30, square: 30 }, 
      large: { circle: 30, square: 30 }   
    },
    
    // Meridian and connections settings
    meridian: { x: 200, snapThreshold: 20, lineColor: 'rgba(255, 255, 255, 0.2)' },
    connections: {
      maxLineLength: 120,
      boldMaxLineLength: 180,
      overlapThreshold: 40,
      lineColor: 'rgba(255, 255, 255, 0.3)',
      lineColorHighlight: 'rgba(255, 255, 255, 0.7)',
      lineWidth: 1
    }
  };
  
  // Generate the expanded config by processing compressed data
  ChakraApp.Config = {
    defaultName: CompressedConfig.defaultName,
    
    // Expand crystal categories to full format for color characteristic
    characteristics: {
      color: {
        key: 'color',
        displayName: 'Crystal',
        buttonEmoji: '🎨',
        buttonTitle: 'Change Crystal Color',
        modalTitle: 'Select Crystal',
        categories: expandCrystalCategories(CompressedConfig.crystalCategories),
        visualStyle: {
          type: 'background',
          cssProperty: 'background-color'
        },
        valueDisplayStyle: {
          type: 'swatch',
          template: '<span class="color-value-swatch" style="background-color: {VALUE}"></span><span>{DISPLAY}</span>'
        }
      },
        image: {
    key: 'image',
    displayName: 'Image',
    buttonTitle: 'Enter image description',
    valueDisplayStyle: {
      type: 'text',
      template: '<span>{VALUE}</span>'
    }
  },
      
	    /*completion: {
  key: 'completion',
  displayName: 'Completion',
  buttonEmoji: '🏗️',
  buttonTitle: 'Set Completion Level',
  modalTitle: 'Select Completion Level',
  categories: [
    {
      name: "Completion Levels",
      options: [
        {
          value: "level0",
          display: "Idea",
          secondary: "Only an idea, doesn't exist yet",
          visualStyle: {
            emoji: "💭",
            number: "0"
          }
        },
        {
          value: "level1",
          display: "In Progress",
          secondary: "Currently being built",
          visualStyle: {
            emoji: "🚧",
            number: "1"
          }
        },
        {
          value: "level2",
          display: "Complete",
          secondary: "Fully built and complete",
          visualStyle: {
            emoji: "✅",
            number: "2"
          }
        }
      ]
    }
  ],
  valueDisplayStyle: {
    type: 'emoji',
    template: '<span>{EMOJI}</span> <span>{DISPLAY}</span>'
  }
},*/
    },
    
    // Directly copy these properties
    predefinedColors: CompressedConfig.predefinedColors,
    indicatorEmojis: CompressedConfig.indicatorEmojis,
    circleTypes: CompressedConfig.circleTypes,
    attributeInfo: CompressedConfig.attributeInfo,
    sizes: CompressedConfig.sizes,
    meridian: CompressedConfig.meridian,
    connections: CompressedConfig.connections,
    circleTypeTemplates: CompressedConfig.circleTypeTemplates,
    
    // Expand chakra forms from compressed format
    chakraForms: expandChakraForm(CompressedConfig.chakraFormsCompressed),

  };
  
})(window.ChakraApp = window.ChakraApp || {});
