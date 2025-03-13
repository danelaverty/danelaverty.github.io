Vue.component('a-line', {
	props: ['line'],
	computed: {
		fromEl: function() { 
			var target = document.getElementById(this.line.fromID);
			if (!target) { return null; }
			return target.getBoundingClientRect();
		},
		toEl: function() { 
			var target = document.getElementById(this.line.toID);
			if (!target) { return null; }
			return target.getBoundingClientRect();
		},
		linkDistance: function() {
			if (this.fromEl && this.toEl) {
				return this.$root.distanceFromToEls(this.fromEl, this.toEl);
			} else {
				return 0;
			}
		},
		linkAngle: function() {
			sideA = this.$root.distanceFromToEls(this.$root.theCenterEl, this.fromEl);
			sideB = this.$root.distanceFromToEls(this.$root.theCenterEl, this.toEl);
			sideC = this.linkDistance;
			var cosLinkAngle = ((sideC * sideC) + (sideA * sideA) - (sideB * sideB)) / (2 * sideC * sideA);
			var rads = Math.acos(cosLinkAngle);
			var degs = rads * 180 / Math.PI;
			return degs;
		},
		lineTransform: function() {
			return 'translate(-50%, -50%) rotate(' + this.fromStarRotation + 'deg)';
			//return 'translate(-50%, -50%) rotate(23deg)';
		},
	},
	template: '' +
		'<div class="a-line" ' +
			':style="{ ' +
				//'transform: lineTransform, ' +
				//'height: (1.2 * ((5 * fromEl.top) + 500)) + \'px\', ' +
				'}" ' +
			'>' +
			'<div class="the-visible-line" ' +
				':style="{ height: linkDistance + \'px\', transform: \'rotate(\' + (linkAngle) + \'deg)\', }" ' +
				'></div>' +
		'</div>' +
		'',
});

Vue.component('top-bar', {
	template: '' +
		'<div class="top-bar" ' +
			'>' +
			'<div ' +
				'v-for="tab in $root.tabs" ' +
				'class="top-bar-button" ' +
				':class="{ selected: $root.tab == tab, }" ' +
				'@click.stop="$root.switchTab(tab)" ' +
			'>' +
				'{{ tab }}' +
			'</div>' +
		'</div>' +
	'',
});

Vue.component('chakra-star', {
	props: ['chakra'],
	template: '' +
		'<div class="chakra-star" ' +
			'style="left: 50%; transform: translate(-50%, -50%);" ' +
			':style="{ top: chakra.top + \'%\', }" ' +
			'@click.stop="$root.chakraClicked(chakra)" ' +
		'>' +
		'</div>' +
	'',
});

Vue.component('chakra-star-button', {
	props: ['chakra', 'hideLine', 'displayField'],
	data: function() {
		return {
			editableMode: false,
		};
	},
	template: '' +
		'<div class="chakra-star-button" ' +
			'@click.stop="editableMode = ($root.tab == \'Designations\' ? true : false); $root.chakraClicked(chakra)" ' +
			':style="{ top: chakra.top + \'%\', }" ' +
		'>' +
			'<span ' +
				'v-if="$root.tab != \'Designations\' || !displayField || !editableMode" ' +
				'>&#8203;{{ displayField ? chakra[displayField] : chakra.name ? chakra.name : chakra.bodyPart }}</span>' +
			'<editable-text placeholder="..." ' +
				'v-if="$root.tab == \'Designations\' && displayField && editableMode" ' +
				':inner-text.prop="chakra.meaning" ' +
				'@update:text="updateChakraMeaning(chakra, $event)" ' +
				'></editable-text>' +
			'<div v-if="!hideLine" class="chakra-star-button-line"></div>' +
			'<div class="sea-correspondences" ' +
				'v-if="!hideLine" ' +
				'>' +
				'<div class="sea-correspondence" ' +
					'v-for="(correspondence, key) in $root.seaCorrespondences" ' +
					'v-if="$root.tab == \'The Sea\' && $root.seaCorrespondences[key] == chakra.bodyPart" ' +
					'>' +
						'{{ key }}' +
				'</div>' +
			'</div>' +
		'</div>' +
	'',
	methods: {
		updateChakraMeaning: function(chakra, newMeaning) {
			Vue.set(chakra, 'meaning', newMeaning);
			this.editableMode = false;
		},
	},
});

Vue.component('template-button', {
	props: ['template'],
	template: '' +
		'<div class="template-button" ' +
			'@click.stop="$root.templateClicked(template)" ' +
		'>' +
			'<div>{{ template.name }}</div>' +
			'<div v-if="template.year" style="font-weight: normal; color: #D0D0D0;">{{ template.year }} ({{ template.chakraCount }})</div>' +
			'<div class="template-comp-button" ' +
				'@click.stop="$root.toggleChakraTemplateComp(template)" ' +
				'></div>' +
		'</div>' +
	'',
});

Vue.component('the-sea-container', {
	props: ['valueTemplate'],
	template: '' +
		'<div class="the-sea-container" ' +
		'>' +
			/*'<div class="sea-buttons-container">' +
				'<div class="sea-value" @click.stop="$root.seaCorrespondences = {}; $root.selectedValueTemplateValue = null;">RESET</div>' +
			'</div>' +*/
			'<div class="sea-buttons-container">' +
				'<div class="sea-value" ' +
					'v-for="value in $root.valueTemplate.values" ' +
					':style="{ opacity: $root.seaCorrespondences[value] ? 0 : 1 }" ' +
					'@click.stop="$root.selectedValueTemplateValue = value" ' +
					':class="{ selected: $root.selectedValueTemplateValue == value }" ' +
					'>' +
					'{{ value }}' +
				'</div>' +
			'</div>' +
		'</div>' +
	'',
});

Vue.component('editable-text', {
	props: {
		text: String,
		placeholder: { type: String, 'default': 'Enter text here', },
		defer: Boolean,
		model: Object,
	},
	template: '' +
	'<div class="editable-text" ' +
		'contenteditable="true" ' +
		'spellcheck="false" ' +
		':placeholder="placeholder" ' +
		'@click="clicked" ' +
		'@keydown="textChange" ' +
		'@blur="textChange" ' +
		'>' +
		'{{ this.text }}' +
	'</div>' +
	'',
	methods: {
		clicked: function(event) {
			if (!this.defer) { event.stopPropagation(); }
		},
		textChange: function(event) {
			var updatedText = event.target.innerText.trim();
			if (event.type == 'blur') {
				event.preventDefault();
				if (typeof updatedText == 'string') { this.$emit('update:text', updatedText); }

				/*if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
					var viewportmeta = document.querySelector('meta[name="viewport"]');
					if (viewportmeta) {
						viewportmeta.setAttribute('content', 'width=device-width, minimum-scale=0.5, maximum-scale=0.5, initial-scale=0.5');
						viewportmeta.setAttribute('content', 'width=device-width, minimum-scale=0.5, initial-scale=0.5');
					}
				}*/
			}
			if (event.key == 'Tab') {
			} else if (event.key == 'Enter') {
				if (!event.shiftKey) {
					var target = event.target;
					target.blur();
					if (this.$root.tab != 'Correspondences') {
						setTimeout(function() { target.focus(); }, 50);
					}

				}
			}
		}
	},
	mounted: function() {
		if (this.$root.tab != 'Correspondences') {
			document.querySelectorAll('.editable-text')[0].focus();
		}
	},
});


Vue.component('layout-container', {
	props: ['chakraTemplate'],
	template: '' +
		'<div class="brainstorm-container" ' +
		'>' +
			'<h4 v-if="chakraTemplate.year" style="font-weight: normal; color: #D0D0D0;">{{ chakraTemplate.year }} ({{ chakraTemplate.chakraCount }})</h4>' +
			'<div v-if="chakraTemplate.quote" class="chakra-quote">&ldquo;{{ chakraTemplate.quote }}&rdquo;</div>' +
			'<div v-if="chakraTemplate.source" class="chakra-quote source">{{ chakraTemplate.source }}</div>' +
			'<h4 v-if="chakraTemplate.purpose"  style="font-weight: normal; color: white; margin-top: 20px;">Purpose: {{ chakraTemplate.purpose }}</h4>' +
			//'<div v-if="chakraTemplate.image" class="chakra-quote" style="text-align: center;"><img :src="chakraTemplate.image" style="width: 260px; margin-top: 20px;"></div>' +
		'</div>' +
	'',
});

Vue.component('element-block', {
	props: ['element', 'k'],
	template: '' +
		'<div class="element-block" :style="{ backgroundColor: element.bg, }" ' +
			'@click.stop="addValue(\'element\', k); addValue(\'elementShape\', k == \'air\' ? \'semicircle\' : k == \'fire\' ? \'triangle\' : k == \'earth\' ? \'square\' : \'circle\');" ' +
			'>' +
			'<div class="element-symbol" :style="{ color: element.color, }">{{ element.symbol }}</div>' +
			'<div class="element-name">{{ element.name }}</div>' +
		'</div>' +
	'',
	methods: {
		addValue(attrName, attrValue) {
			if (!attrValue) { return; }
			Vue.set(this.$root.selectedChakra, attrName, attrValue);
		},
	},
});

Vue.component('correspondences-container', {
	template: '' +
		'<div class="brainstorm-container">' +
			'<table style="font-size: 9px;" class="correspondence-table">' +
				'<tr>' +
					'<td class="correspondence-label">Meaning</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.meaning ? $root.selectedChakra.meaning : \'\'" ' +
							'@update:text="addValue(\'meaning\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td class="correspondence-label">Positive Feeling</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra[\'Positive Feeling\'] ? $root.selectedChakra[\'Positive Feeling\'] : \'\'" ' +
							'@update:text="addValue(\'Positive Feeling\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td class="correspondence-label">Negative Feeling</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra[\'Negative Feeling\'] ? $root.selectedChakra[\'Negative Feeling\'] : \'\'" ' +
							'@update:text="addValue(\'Negative Feeling\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td class="correspondence-label">Action</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.action ? $root.selectedChakra.action : \'\'" ' +
							'@update:text="addValue(\'action\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td class="correspondence-label">Color</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.colorName ? $root.selectedChakra.colorName : \'\'" ' +
							'@update:text="addValue(\'colorName\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td class="correspondence-label">...like...</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.colorThing ? $root.selectedChakra.colorThing : \'\'" ' +
							'@update:text="addValue(\'colorThing\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td class="correspondence-label">Element</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.element ? $root.selectedChakra.element : \'\'" ' +
							'@update:text="addValue(\'element\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
				/*'<tr>' +
					'<td class="correspondence-label">Shape</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.elementShape ? $root.selectedChakra.elementShape : \'\'" ' +
							'@update:text="addValue(\'elementShape\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +*/
				'<tr>' +
					'<td class="correspondence-label">Crystal</td>' +
					'<td class="correspondence-value">' +
						'<editable-text placeholder="" ' +
							':inner-text.prop="$root.selectedChakra.crystal ? $root.selectedChakra.crystal : \'\'" ' +
							'@update:text="addValue(\'crystal\', $event)" ' +
						'></editable-text>' +
					'</td>' +
				'</tr>' +
			'</table>' +
			/*'<h3>Color</h3>' +
			'<div v-for="colorFamilyRow in $root.colorFamilyRows">' +
				'<div class="color-family" v-for="colorFamily in colorFamilyRow" :style="{ backgroundColor: colorFamily.bg, }">' +
					'<div>&nbsp;{{ colorFamily.name }}</div>' +
					'<div v-for="(color, i) in colorFamily.colors" class="color-swatch" ' +
						'@click.stop="' +
							'addValue(\'color\', color); ' +
							'addValue(\'colorName\', ' +
								'colorFamily.name == \'Neutrals\' ? ' +
								'(i == 0 ? \'Black\' : i == 1 ? \'Gray\' : \'White\') : ' +
								'(i == 0 ? \'Dark \' : i == 2 ? \'Light \' : \'\') + colorFamily.name.substring(0, colorFamily.name.length - 1) ' +
							');" ' +
						':style="{ backgroundColor: color, }"></div>' +
				'</div>' +
			'</div>' +
			'<h3>...like...</h3>' +
			'<div class="sea-buttons-container">' +
				'<editable-text placeholder="" ' +
					':inner-text.prop="$root.selectedChakra.colorThing ? $root.selectedChakra.colorThing : \'\'" ' +
					'@update:text="addValue(\'colorThing\', $event)" ' +
				'></editable-text>' +
			'</div>' +
			'<h3>Crystal</h3>' +
			'<div class="sea-buttons-container">' +
				'<editable-text placeholder="" ' +
					':inner-text.prop="$root.selectedChakra.crystal ? $root.selectedChakra.crystal : \'\'" ' +
					'@update:text="addValue(\'crystal\', $event)" ' +
				'></editable-text>' +
			'</div>' +
			'<h3>Element</h3>' +
				'<element-block v-for="(element, key) in $root.elements" ' +
					':key="key" ' +
					':k="key" ' +
					':element="element" ' +
					':style="{ opacity: $root.selectedChakra.element == key ? 0 : 1 }" ' +
					'>' +
				'</element-block>' +
			'<h3>Positive Feeling</h3>' +
			'<div class="sea-buttons-container">' +
				'<editable-text placeholder="" ' +
					':inner-text.prop="$root.selectedChakra[\'Positive Feeling\'] ? $root.selectedChakra[\'Positive Feeling\'] : \'\'" ' +
					'@update:text="addValue(\'Positive Feeling\', $event)" ' +
				'></editable-text>' +
			'</div>' +
			'<h3>Negative Feeling</h3>' +
			'<div class="sea-buttons-container">' +
				'<editable-text placeholder="" ' +
					':inner-text.prop="$root.selectedChakra[\'Negative Feeling\'] ? $root.selectedChakra[\'Negative Feeling\'] : \'\'" ' +
					'@update:text="addValue(\'Negative Feeling\', $event)" ' +
				'></editable-text>' +
			'</div>' +
			'<h3>Action</h3>' +
			'<div class="sea-buttons-container">' +
				'<editable-text placeholder="" ' +
					':inner-text.prop="$root.selectedChakra.action ? $root.selectedChakra.action : \'\'" ' +
					'@update:text="addValue(\'action\', $event)" ' +
				'></editable-text>' +
			'</div>' +*/
		'</div>' +
	'',
	methods: {
		addValue(attrName, attrValue) {
			if (!attrValue) { return; }
			Vue.set(this.$root.selectedChakra, attrName, attrValue);
		},
	},
});

Vue.component('islands-container', {
	template: '' +
		'<div class="islands-container">' +
			'<div class="island-container" ' +
				'v-for="(island, key, ind) in $root.islands" ' +
				':style="{' +
					'transform: \'rotate(\' + (180 + ind * (360 / $root.islandsLength)) + \'deg)\' ' +
				'}" ' +
				'>' +
				'<div class="island-disc" ' +
					':style="{' +
						'transform: ' +
							'\'translate(-50%, 0%) rotate(\' + (180 + ind * (-360 / $root.islandsLength)) + \'deg)\' ' +
							',' +
						'backgroundColor: $root.selectedChakra.color, ' +
					'}" ' +
					'>' +
					'<div class="css-center">{{ island.name }}</div>' +
					'<div class="island-list">' +
						'<div v-for="critter in $root.selectedChakra.islands[island.name]">&bull;&nbsp;{{ critter }}</div>' +
						'<div>' +
							'&bull;&nbsp;<editable-text placeholder="" ' +
								':inner-text.prop="$root.currentCritter" ' +
								'@update:text="addValue(island.name, $event)" ' +
							'></editable-text>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'',
	methods: {
		addValue: function(island, critter) {
			if (!island || !critter) { return; }
			var $root = this.$root;
			$root.selectedChakra.islands[island].push(critter);
		},
	},
	created: function() {
		var $root = this.$root;
		for (var key in $root.chakrasInPlay) {
			var chakra = $root.chakrasInPlay[key];
			if (!chakra.islands) { 
				Vue.set(chakra, 'islands', {});
				for (var key in $root.islands) {
					Vue.set(chakra.islands, $root.islands[key].name, []);
				}
			}
		}
	},
});

Vue.component('visualizations-container', {
	template: '' +
		'<div class="brainstorm-container">' +
			'<div class="script">VISUALIZATION SCRIPT</div>' +
			'<div class="script action">touch {{ $root.selectedChakra.bodyPart }}</div>' +
			'<div class="script">Bring your thoughts to center on your {{ $root.selectedChakra.bodyPart }}, which holds {{ $root.selectedChakra.meaning }}.</div>' +
			'<div class="script">Visualize in your {{ $root.selectedChakra.bodyPart }}, which holds {{ $root.selectedChakra.meaning }}, a vast room colored {{ $root.selectedChakra.colorName }} like {{ $root.selectedChakra.colorThing }}.</div>' +
			'<div class="script">In the center of the room that is {{ $root.selectedChakra.colorName }} like {{ $root.selectedChakra.colorThing }}, you see a great {{ $root.selectedChakra.elementShape }} of {{ $root.selectedChakra.element }}.</div>' +
			'<div class="script action">place {{ $root.selectedChakra.element }}</div>' +
			'<div class="script">Looking into the {{ $root.selectedChakra.colorName }} room with {{ $root.selectedChakra.element }}, you feel {{ $root.selectedChakra[\'Positive Feeling\'] }}.</div>' +
			'<div class="script">Looking away from the room, you feel {{ $root.selectedChakra[\'Negative Feeling\'] }}.</div>' +
			'<div class="script action">place {{ $root.selectedChakra.crystal }}</div>' +
			'<div class="script">In your right hand you hold a {{ $root.selectedChakra.crystal }}.</div>' +
			'<div class="script">The {{ $root.selectedChakra.crystal }} inspires you towards {{ $root.selectedChakra.action }}.</div>' +
			'<div class="script">With it you strike down feeling {{ $root.selectedChakra[\'Negative Feeling\'] }},</div>' +
			'<div class="script">and enter into the room that is {{ $root.selectedChakra.colorName }} like {{ $root.selectedChakra.colorThing }} which represents {{ $root.selectedChakra.meaning }}, where you feel {{ $root.selectedChakra[\'Positive Feeling\'] }}.</div>' +
		'</div>' +
	'',
});

Vue.component('brainstorm-container', {
	props: ['valueTemplate'],
	template: '' +
		'<div class="brainstorm-container" ' +
		'>' +
			'<h3>Areas of Concern</h3>' +
			'<div class="sea-buttons-container">' +
				'<editable-text placeholder="" ' +
					':inner-text.prop="$root.brainstormConcern" ' +
					'@update:text="addValue(\'Concern\', $event)" ' +
				'></editable-text>' +
			'</div>' +
			'<div class="sea-buttons-container">' +
				'<div class="sea-value" ' +
					'v-for="(value, k) in $root.brainstormConcerns" ' +
					'@click="deleteValue(\'Concern\', k)" ' +
					'>' +
					'{{ k }}' +
				'</div>' +
			'</div>' +
			'<div class="sea-buttons-container"></div>' +
			'</div>' +
		'</div>' +
	'',
	methods: {
		addValue: function(valueType, valueName) {
			if (!valueType || !valueName || valueName == '') { return; }
			var $root = this.$root;
			$root['brainstorm' + valueType] = '';
			Vue.set($root['brainstorm' + valueType + 's'], valueName, true);
		},
		deleteValue: function(valueType, valueName) {
			Vue.delete(this.$root['brainstorm' + valueType + 's'], valueName);
		}
	},
});

Vue.component('chakra-body', {
	props: ['chakraTemplate', 'isComp'],
	template: '' +
		'<div class="chakra-body" ' +
			'>' +
			'<img class="chakra-body-image" src="body-silhouette-white.png" v-if="!chakraTemplate || chakraTemplate.name != \'Cakra-Samvara\'">' +
			'<h3 style="position: absolute; top: -9%; left: 50%; transform: translate(-50%, -50%); white-space: nowrap;">{{ chakraTemplate ? chakraTemplate.name : \'\' }}</h3>' +
			/*'<chakra-star ' +
				'v-for="(chakra, key) in $root.possibleChakras" ' +
				':key="\'star\' + key" ' +
				':chakra="(!isComp && $root.chakrasInPlay[chakra.bodyPart]) ? $root.chakrasInPlay[chakra.bodyPart] : (isComp && $root.chakrasInPlayComp[chakra.bodyPart]) ? $root.chakrasInPlayComp[chakra.bodyPart] : chakra" ' +
				'v-if="($root.tab == \'Layout\' && !chakraTemplate) || (!isComp && $root.chakrasInPlay[key])  || (isComp && $root.chakrasInPlayComp[key])" ' +
				//':class="[ (!isComp ? $root.chakrasInPlay[chakra.bodyPart] : $root.chakrasInPlayComp[chakra.bodyPart]) ? \'yellow\' : \'not-sure\']" ' +
				'>' +
			'</chakra-star>' +*/
			'<chakra-polygon ' +
				'v-for="(chakra, key, ind) in $root.possibleChakras" ' +
				':key="\'polygon\' + key" ' +
				':chakra="(!isComp && $root.chakrasInPlay[chakra.bodyPart]) ? $root.chakrasInPlay[chakra.bodyPart] : (isComp && $root.chakrasInPlayComp[chakra.bodyPart]) ? $root.chakrasInPlayComp[chakra.bodyPart] : chakra" ' +
				'v-if="($root.tab == \'Layout\' && !chakraTemplate) || (!isComp && $root.chakrasInPlay[key])  || (isComp && $root.chakrasInPlayComp[key])" ' +
				':chakraForms="$root.chakraForms[ind]" ' +
				'>' +
			'</chakra-polygon>' +
			'<feeling-particles ' +
				'v-for="(chakra, key) in $root.possibleChakras" ' +
				':key="\'star\' + key" ' +
				':chakra="(!isComp && $root.chakrasInPlay[chakra.bodyPart]) ? $root.chakrasInPlay[chakra.bodyPart] : (isComp && $root.chakrasInPlayComp[chakra.bodyPart]) ? $root.chakrasInPlayComp[chakra.bodyPart] : chakra" ' +
				'v-if="($root.tab == \'Layout\' && !chakraTemplate) || (!isComp && $root.chakrasInPlay[key])  || (isComp && $root.chakrasInPlayComp[key])" ' +
				'>' +
			'</feeling-particles>' +
			'<div class="circle"></div>' +
			'<svg>' +
				'<filter id="wavy">' +
					'<feTurbulence x="0" y="0" baseFrequency="0.009" numOctaves="5" seed="-1">' +
						'<animate attributeName="baseFrequency" dur="30s" values="0.02;0.005;0.02;" repeatCount="indefinite"></animate>' +
						//'<animate attributeName="seed" dur="30s" values="2;10;2;" repeatCount="indefinite"></animate>' +
					'</feTurbulence>' +
					'<feDisplacementMap in="SourceGraphic" scale="10">' +
					'</feDisplacementMap>' +
				'</filter>' +
			'</svg>' +
			'<chakra-star-button ' +
				'v-for="(chakra, key) in $root.possibleChakras" ' +
				':key="\'possible\' + key" ' +
				':chakra="(!isComp ? $root.chakrasInPlay[chakra.bodyPart] : $root.chakrasInPlayComp[chakra.bodyPart]) || chakra" ' +
				':hideLine="true" ' +
				'v-if="($root.tab == \'Layout\' && !chakraTemplate) || (!isComp && $root.chakrasInPlay[key])  || (isComp && $root.chakrasInPlayComp[key]) " ' +
				':class="{ selected: (!isComp ? $root.chakrasInPlay[key] : $root.chakrasInPlayComp[key]) }" ' +
				'style="width: auto; right: 140px; left: auto; text-align: right; border: none; background-color: transparent;" ' +
				'>' +
			'</chakra-star-button>' +
			'<chakra-star-button ' +
				'v-for="(chakra, key) in (!isComp ? $root.chakrasInPlay : $root.chakrasInPlayComp)" ' +
				':key="\'inPlay\' + key" ' +
				':chakra="chakra" ' +
				':displayField="\'meaning\'" ' +
				'v-if="($root.tab == \'Layout\' || $root.chakrasInPlay[key]) &&  (!isComp && $root.chakrasInPlay[key])  || (isComp && $root.chakrasInPlayComp[key])" ' +
				':class="{ selected: (!isComp ? $root.chakrasInPlay[key] : $root.chakrasInPlayComp[key]) }" ' +
				':style="{ ' +
					'border: (!isComp ? $root.chakrasInPlay[key].color : $root.chakrasInPlayComp[key].color) ? \'1px solid \' + (!isComp ? $root.chakrasInPlay[key].color : $root.chakrasInPlayComp[key].color) : null, ' +
					'backgroundColor: (($root.tab == \'Correspondences\' || $root.tab == \'Visualizations\' || $root.tab == \'Islands\') && $root.selectedChakra && chakra.bodyPart == $root.selectedChakra.bodyPart) ? \'rgba(255, 255, 100, .4)\' : null, ' +
				'}" ' +
				'>' +
			'</chakra-star-button>' +
			/*'<div class="color-disc" ' +
				'v-for="(chakra, key) in (!isComp ? $root.chakrasInPlay : $root.chakrasInPlayComp)" ' +
				'v-if="chakra.color" ' +
				':style="{ ' +
					'backgroundColor: chakra.color, ' +
					'top: chakra.top + \'%\', ' +
				'}" ' +
				'></div>' +*/
			'<element-block ' +
				'v-for="(chakra, key) in (!isComp ? $root.chakrasInPlay : $root.chakrasInPlayComp)" ' +
				'v-if="chakra.element" ' +
				':key="chakra.bodyPart + \'-element\'" ' +
				':k="chakra.element" ' +
				':element="$root.elements[chakra.element]" ' +
				'style="position: absolute; left: 50%; transform: translate(-48px, 1px) scale(.7);" ' +
				':style="{ ' +
					'top: chakra.top + \'%\', ' +
				'}" ' +
				'></element-block>' +
			'<div class="template-button-container" v-if="!isComp">' +
				'<template-button ' +
					'v-for="(chakraTemplate, key, i) in $root.chakraTemplates" ' +
					'v-if="$root.tab == \'Layout\'" ' +
					':key="chakraTemplate.name" ' +
					':template="chakraTemplate" ' +
					':class="{ selected: chakraTemplate === chakraTemplate }" ' +
					'>' +
				'</template-button>' +
				'<template-button ' +
					'v-for="(valueTemplate, key, i) in $root.valueTemplates" ' +
					'v-if="$root.tab == \'The Sea\'" ' +
					':key="valueTemplate.name" ' +
					':template="valueTemplate" ' +
					':class="{ selected: $root.valueTemplate === valueTemplate }" ' +
					'>' +
				'</template-button>' +
			'</div>' +
			'<layout-container ' +
				'v-if="chakraTemplate && $root.tab == \'Layout\' && !isComp && !$root.chakraTemplateComp" ' +
				':chakraTemplate="chakraTemplate" ' +
				'></layout-container>' +
			'<the-sea-container ' +
				'v-if="$root.valueTemplate && $root.tab == \'The Sea\' && !isComp" ' +
				':valueTemplate="$root.valueTemplate" ' +
				'></the-sea-container>' +
			'<brainstorm-container ' +
				'v-if="$root.tab == \'Brainstorm\' && !isComp" ' +
				'></brainstorm-container>' +
			'<correspondences-container ' +
				'v-if="$root.tab == \'Correspondences\' && !isComp && $root.selectedChakra" ' +
				'></correspondences-container>' +
			'<visualizations-container ' +
				'v-if="$root.tab == \'Visualizations\' && !isComp && $root.selectedChakra" ' +
				'></visualizations-container>' +
			'<islands-container ' +
				'v-if="$root.tab == \'Islands\' && !isComp && $root.selectedChakra" ' +
				'></islands-container>' +
			/*'<a-line ' +
				'v-for="line in [{ fromID: \'a\', toID: \'b\', }]" ' +
				':line="line" ' +
				':key="\'F\' + line.fromID + \'T\' + line.toID" ' +
				':id="\'F\' + line.fromID + \'T\' + line.toID" ' +
				'>' +
			'</a-line>' +*/
		'</div>' +
	'',
});

Vue.component('feeling-particles', {
	props: ['chakra'],
	template: '' +
	'<div class="feeling-particles" ' +
		'style="left: 50%; transform: translate(-50%, -50%);" ' +
		':style="{ top: chakra.top + \'%\', }" ' +
		'@click.stop="$root.chakraClicked(chakra)" ' +
		'>' +
		'<div class="glow" ' +
			':style="{ ' +
				'backgroundColor: chakra.color || \'white\', ' +
			'}"' +
		'></div>' +
		'<div class="particles">' +
			'<div class="angle">' +
				'<div class="position">' +
					'<div class="pulse">' +
						'<div class="particle" ' +
							':style="{ ' +
								'backgroundColor: chakra.color || \'white\', ' +
							'}"' +
						'>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="angle">' +
				'<div class="position">' +
					'<div class="pulse">' +
						'<div class="particle" ' +
							':style="{ ' +
								'backgroundColor: chakra.color || \'white\', ' +
							'}"' +
						'>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>' +
	'',
});

Vue.component('chakra-polygon', {
	props: ['chakra', 'chakraForms'],
	template: '' +
	'<div class="chakra-polygon-container" ' +
		'style="left: 50%; transform: translate(-50%, -50%);" ' +
		':style="{ top: chakra.top + \'%\', }" ' +
		'@click.stop="$root.chakraClicked(chakra)" ' +
		'>' +
		'<div class="chakra-polygon" ' +
			'v-for="chakraForm in chakraForms" ' +
			':style="{ transform: ' +
				'\'rotate(\' + (chakraForm.rotate || 0) + \'deg)\' ' +
				' + \'scale(\' + (chakraForm.scale || 1) + \')\' ' +
			', }" ' +
			'>' +
			'<div class="chakra-polygon" ' +
				':style="{ ' +
					'filter: \'drop-shadow(0 0 3px #AAA)\', ' +
					'mixBlendMode: \'screen\', ' +
					//'animation: \'angle 16s linear infinite\', ' +
					'animation: (chakraForm.reverse ? \'anglerev\' : \'angle\') + \' \' + (chakraForm.spinTime || 16) + \'s linear infinite\', ' +
				'}" ' +
				'>' +
				'<div class="shape" ' +
					':style="{ ' +
						'clipPath: $root.getPolyPoints(chakraForm.sides, chakraForm.starFactor, chakraForm.borderPercent), ' +
					'}" ' +
				'></div>' +
			'</div>' +
		'</div>' +
	'</div>' +
	'',
});

Vue.component('the-chakras', {
	template: '' +
		'<div class="this-chakras no-select">' +
			'<top-bar></top-bar>' +
			'<chakra-body :chakraTemplate="$root.chakraTemplate"></chakra-body>' +
			'<chakra-body :chakraTemplate="$root.chakraTemplateComp" style="left: 400px;" :isComp="true" v-if="$root.chakraTemplateComp && $root.tab == \'Layout\'"></chakra-body>' +
			/*'<feeling-particles v-for="(p, ind) in $root.particles" :key="ind" ' +
				':style="{ transform: \'translate(\' + (100 + ind * 50) + \'px, \' + (100 + ind * 50) + \'px)\', }" ' +
				'></feeling-particles>' +*/
			/*'<chakra-polygon v-for="(p, ind) in $root.polygons" :key="ind" ' +
				':style="{ top: (100 + ind * 50) + \'px\', left: (100 + ind * 50) + \'px\', }" ' +
				':sides="11" ' +
				':dupes="1" ' +
				':starFactor="3" ' +
				':borderPercent=".03" ' +
				'></chakra-polygon>' +*/
		'</div>' +
	'',
});

var app = new Vue({
	el: '#app',
    data: {
	    chakraForms: [
[{ sides: 3, starFactor: 1, borderPercent: .20 }],
//[{ sides: 3, starFactor: 1, borderPercent: .18 }, { sides: 3, starFactor: 1, borderPercent: .18, rotate: 60 }],
[{ sides: 4, starFactor: 1, borderPercent: .12 }, { sides: 4, starFactor: 1, borderPercent: .12, rotate: 45 }],
//[{ sides: 7, starFactor: 2, borderPercent: .12 }],
[{ sides: 5, starFactor: 1, borderPercent: .10 }, { sides: 5, starFactor: 1, borderPercent: .10, rotate: 36 }],
[{ sides: 11, starFactor: 3, borderPercent: .12 }],
[{ sides: 9, starFactor: 2, borderPercent: .12, scale: 0.8 }, { sides: 9, starFactor: 2, borderPercent: .08, reverse: 1, scale: 1.2, spinTime: 64 }],
[{ sides: 17, starFactor: 2, borderPercent: .08 }, { sides: 17, starFactor: 2, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
[{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }],
[{ sides: 21, starFactor: 8, borderPercent: .08 }, { sides: 17, starFactor: 4, borderPercent: .04, reverse: 1, scale: 1.2, spinTime: 32 }, { sides: 25, starFactor: 4, borderPercent: .02, scale: 1.5, spinTime: 64 }],
[{ sides: 30, starFactor: 1, borderPercent: .18 }, { sides: 61, starFactor: 23, borderPercent: .01, reverse: 1, scale: 3.4, spinTime: 32 }],
		],
	    particles: [1],
	    polygons: [1],
	    tab: 'Layout',
	    tabs: ['Layout', 'The Sea', 'Brainstorm', 'Designations', 'Correspondences', 'Visualizations', 'Islands'],
	    islands: {
		    'Feelings': { name: 'Feelings', },
		    'Pieces': { name: 'Pieces', },
		    'Places': { name: 'Places', },
		    'Tensions': { name: 'Tensions', },
		    'Options': { name: 'Options', },
	    },
	    currentCritter: '',
	    possibleChakras: {
		    Tridanda: { bodyPart: 'Tridanda', top: -5 },
		    Crown: { bodyPart: 'Crown', top: 0 },
		    Head: { bodyPart: 'Head', top: 4 },
		    Mouth: { bodyPart: 'Mouth', top: 10 },
		    Throat: { bodyPart: 'Throat', top: 14 },
		    //Nape: { bodyPart: 'Nape', top: 12 },
		    Heart: { bodyPart: 'Heart', top: 23 },
		    Navel: { bodyPart: 'Navel', top: 40 },
		    Sacral: { bodyPart: 'Sacral', top: 50 },
		    Root: { bodyPart: 'Root', top: 58 },
	    },
	    chakraTemplates: {
		    'Modern 7': { name: 'Modern 7',
			    year: '1977',
			    chakraCount: '7 chakras',
			    quote: 'Ken Dychtwald became the father of the Western chakra system when he inadvertently brought together the color healers\' list of rainbow colors and the human potential movement\'s list of chakra qualities in the summer of 1977.',
			    source: '"The Rainbow Body", Kurt Leland',
			    purpose: 'Systems to unblock', 
			    chakras: {
				    Crown: { bodyPart: 'Crown', meaning: 'Spirituality', color: 'violet', },
				    Head: { bodyPart: 'Head', name: 'Third Eye', meaning: 'Insight', color: 'indigo', },
				    Throat: { bodyPart: 'Throat', meaning: 'Voice', color: 'blue', },
				    Heart: { bodyPart: 'Heart', meaning: 'Love', color: 'green', },
				    Navel: { bodyPart: 'Navel', name: 'Solar Plexus', meaning: 'Power', color: 'yellow', },
				    Sacral: { bodyPart: 'Sacral', meaning: 'Sensuality', color: 'orange', },
				    Root: { bodyPart: 'Root', meaning: 'Survival', color: 'red', },
			    },
		    },
		    'Sat-Cakra-Nirupana': { name: 'Sat-Cakra-Nirupana',
			    year: '1500s',
			    chakraCount: '6 chakras + 1',
			    quote: 'Now I speak of the six Chakras in their proper order. Above all these, in the vacant space is the Lotus of a thousand petals.',
			    source: '"The Serpent Power: Sat-Cakra-Nirupana", Purnananda Yati, trans. by Arthur Avalon (John Woodroffe)',
			    purpose: 'Visualization meditation', 
			    chakras: {
				    Crown: { bodyPart: 'Crown', name: 'Sahasrara', meaning: '1,000 petals', color: 'white', },
				    Head: { bodyPart: 'Head', name: 'Ajna', meaning: 'authority', color: 'white', },
				    Throat: { bodyPart: 'Throat', name: 'Vishuddha', meaning: 'pure', color: '#B0C', },
				    Heart: { bodyPart: 'Heart', name: 'Anahata', meaning: 'unhurt', color: 'red', },
				    Navel: { bodyPart: 'Navel', name: 'Manipura', meaning: 'shining gem', color: 'gray', },
				    Sacral: { bodyPart: 'Sacral', name: 'Svadhisthana', meaning: 'self home', color: '#F40', },
				    Root: { bodyPart: 'Root', name: 'Muladhara', meaning: 'root base', color: '#F04', },
			    },
		    },
		    'Kaula-Jnana-Nirnaya': { name: 'Kaula-Jnana-Nirnaya',
			    year: '1000s',
			    chakraCount: '11 chakras',
			    quote: 'Bringing the attention to these centres produces various results.  Red grants subjugation and great enjoyment; yellow paralyses; purple removes grey hair; white gives good health and peace. Very bright white like the colour of cow\'s milk causes the conquest over death. The effulgence as that of molten gold enables one to shake cities.',
			    source: '"Kaula-Jnana-Nirnaya", Matsyendranatha, trans. by Pandit Satkari Mukhopadhyaya',
			    purpose: 'Gaining magic powers', 
			    chakras: {
				    Tridanda: { bodyPart: 'Tridanda', meaning: '', },
				    Crown: { bodyPart: 'Crown', meaning: '', },
				    Head: { bodyPart: 'Head', meaning: '', },
				    Mouth: { bodyPart: 'Mouth', meaning: '', },
				    Nape: { bodyPart: 'Nape', meaning: '', },
				    Throat: { bodyPart: 'Throat', meaning: '', },
				    Heart: { bodyPart: 'Heart', meaning: '', },
				    Navel: { bodyPart: 'Navel', meaning: '', },
				    Sacral: { bodyPart: 'Sacral', meaning: '', },
				    Root: { bodyPart: 'Root', meaning: '', },
			    },
		    },
		    'Cakra-Samvara': { name: 'Cakra-Samvara', 
			    year: '800s', chakraCount: '3 chakras',
			    quote: 'The blue Wheel of Mind is in the sky. Outside that there is the red Wheel of Speech. Outside that there lies the white eight-petaled Wheel of the Body.',
			    source: '"Cakra-Samvara", Sri Heruka, trans. by Arthur Avalon (David Woodroffe)',
			    purpose: 'A description of the universe', 
			    chakras: {
				    Head: { bodyPart: 'Head', name: 'Citticakra', meaning: 'Mind', color: 'blue', },
				    Throat: { bodyPart: 'Throat', name: 'Vakcakra', meaning: 'Speech', color: 'red', },
				    Heart: { bodyPart: 'Heart', name: 'Kayacakra', meaning: 'Body', color: 'white', },
			    },
		    },
		    Hevajra: { name: 'Hevajra', 
			    year: '800s',
			    chakraCount: '4 chakras',
			    quote: 'The four Centres, comprising the three Bodies, the Essential Nature, Enjoyment and Creation Bodies, and the fourth, the Centre of Great Bliss, are located in the heart, throat, yoni and head, respectively.',
			    source: '"Hevajra Tantra", trans. by G. W. Farrow & I. Menon',
			    purpose: 'A path to happiness', 
			    chakras: {
				    Head: { bodyPart: 'Head', name: 'Mahasukhacakra', meaning: 'Bliss', },
				    Throat: { bodyPart: 'Throat', name: 'Sambhogacakra', meaning: 'Pleasure', },
				    Heart: { bodyPart: 'Heart', name: 'Dharmacakra', meaning: 'Knowledge', },
				    Navel: { bodyPart: 'Navel', name: 'Nirmanacakra', meaning: 'Creation', },
			    },
		    },
		    Guhyasamaja: { name: 'Guhyasamaja',
			    year: '700s',
			    chakraCount: '5 chakras',
			    quote: '...knowing the ritual, he should place the Five Families, the Sons of the Jinas, on the forehead, the throat, the heart, the navel and the genitals.',
			    source: '"Guhyasamaja Tantra", trans. Francesca Fremantle',
			    image: 'jinas-intro.png', 
			    purpose: 'Installing divine powers', 
			    chakras: {
				    Head: { bodyPart: 'Head', meaning: '', },
				    Throat: { bodyPart: 'Throat', meaning: '', },
				    Heart: { bodyPart: 'Heart', meaning: '', },
				    Navel: { bodyPart: 'Navel', meaning: '', },
				    Sacral: { bodyPart: 'Sacral', meaning: '', },
			    },
		    },
	    },
	    'Personal Template': { name: 'Personal Template', 
		    year: '2025',
		    chakraCount: '4 chakras',
		    chakras: {
			    Head: { bodyPart: 'Head', meaning: '', },
			    Throat: { bodyPart: 'Throat', meaning: '', },
			    Heart: { bodyPart: 'Heart', meaning: '', },
			    Navel: { bodyPart: 'Navel', meaning: '', },
		    },
	    },
	    'Brittan\'s Template': { name: 'Brittan\'s Template', 
		    year: '2025',
		    chakraCount: '4 chakras',
		    chakras: {
			    Head: { bodyPart: 'Head', meaning: 'Guidance', 'Positive Feeling': 'Relief', 'Negative Feeling': 'Pressure', color: '#DAA520', colorName: 'Gold', colorThing: 'golden thread', element: 'air', elementShape: 'semicircle', crystal: 'Tiger\'s Eye', action: 'Meditating and time in nature' },
			    Throat: { bodyPart: 'Throat', meaning: 'Truth', 'Positive Feeling': 'Freedom', 'Negative Feeling': 'Suppression', color: '#6B8E23', colorName: 'Green', colorThing: 'moss', element: 'earth', elementShape: 'square', crystal: 'Jade', action: 'Speaking up' },
			    Heart: { bodyPart: 'Heart', meaning: 'Integrity', 'Positive Feeling': 'Brave', 'Negative Feeling': 'Constricted', color: '#00008B', colorName: 'Blue', colorThing: 'indigo', element: 'water', elementShape: 'circle', crystal: 'Lapis Lazuli', action: 'Taking action' },
			    Navel: { bodyPart: 'Navel', meaning: 'Creation', 'Positive Feeling': 'Expansion', 'Negative Feeling': 'Depression', color: '#FF3000', colorName: 'Vermilion', colorThing: 'rose hips', element: 'fire', elementShape: 'triangle', crystal: 'Sunstone', action: 'Moving & socializing' },
		    },
	    },
	    valueTemplates: {
		    'Common Values': { name: 'Common Values', values: ['Achievement', 'Adventure', 'Authenticity', 'Authority', 'Autonomy', 'Balance', 'Beauty', 'Boldness', 'Challenge', 'Citizenship', 'Community', 'Compassion', 'Competency', 'Contribution', 'Creativity', 'Curiosity', 'Determination', 'Fairness', 'Faith', 'Fame', 'Family', 'Friendships', 'Fun', 'Growth', 'Happiness', 'Honesty', 'Humor', 'Influence', 'Inner Harmony', 'Justice', 'Kindness', 'Knowledge', 'Leadership', 'Learning', 'Love', 'Loyalty', 'Meaningful Work', 'Openness', 'Optimism', 'Peace', 'Pleasure', 'Poise', 'Popularity', 'Recognition', 'Reputation', 'Respect', 'Responsibility', 'Security', 'Self-Respect', 'Service', 'Spirituality', 'Stability', 'Status', 'Success', 'Trustworthiness', 'Wealth', 'Wisdom'] },
		    '7 Deadly Sins': { name: '7 Deadly Sins', values: ['Pride', 'Greed', 'Wrath', 'Envy', 'Lust', 'Gluttony', 'Sloth'] },
		    'Greek Gods': { name: 'Greek Gods', values: ['Aphrodite', 'Apollo', 'Ares', 'Artemis', 'Athena', 'Demeter', 'Dionysus', 'Hephaestus', 'Hera', 'Hermes', 'Hestia', 'Poseidon', 'Zeus',] },
		    'Astrological Planets': { name: 'Astrological Planets', values: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] },
		    'Enneagram': { name: 'Enneagram', values: ['1 - Reformer', '2 - Helper', '3 - Achiever', '4 - Individualist', '5 - Investigator', '6 - Loyalist', '7 - Enthusiast', '8 - Challenger', '9 - Peacemaker'] },
		    'I Ching': { name: 'I Ching',
			    values: [
				    '1 ' + String.fromCodePoint(0x4DC0) + ' Force',
				    '2 ' + String.fromCodePoint(0x4DC1) + ' Field',
				    '3 ' + String.fromCodePoint(0x4DC2) + ' Sprouting',
				    '4 ' + String.fromCodePoint(0x4DC3) + ' Youth',
				    '5 ' + String.fromCodePoint(0x4DC4) + ' Waiting',
				    '6 ' + String.fromCodePoint(0x4DC5) + ' Conflict',
				    '7 ' + String.fromCodePoint(0x4DC6) + ' Army',
				    '8 ' + String.fromCodePoint(0x4DC7) + ' Union',
				    '9 ' + String.fromCodePoint(0x4DC8) + ' Small Taming',
				    '10 ' + String.fromCodePoint(0x4DC9) + ' Treading',
				    '11 ' + String.fromCodePoint(0x4DCA) + ' Peace',
				    '12 ' + String.fromCodePoint(0x4DCB) + ' Stagnation',
				    '13 ' + String.fromCodePoint(0x4DCC) + ' Fellowship',
				    '14 ' + String.fromCodePoint(0x4DCD) + ' Wealth',
				    '15 ' + String.fromCodePoint(0x4DCE) + ' Humility',
				    '16 ' + String.fromCodePoint(0x4DCF) + ' Joy',
				    '17 ' + String.fromCodePoint(0x4DD0) + ' Following',
				    '18 ' + String.fromCodePoint(0x4DD1) + ' Decay',
				    '19 ' + String.fromCodePoint(0x4DD2) + ' Approach',
				    '20 ' + String.fromCodePoint(0x4DD3) + ' View',
				    '21 ' + String.fromCodePoint(0x4DD4) + ' Biting',
				    '22 ' + String.fromCodePoint(0x4DD5) + ' Grace',
				    '23 ' + String.fromCodePoint(0x4DD6) + ' Splitting',
				    '24 ' + String.fromCodePoint(0x4DD7) + ' Return',
				    '25 ' + String.fromCodePoint(0x4DD8) + ' Innocence',
				    '26 ' + String.fromCodePoint(0x4DD9) + ' Great Taming',
				    '27 ' + String.fromCodePoint(0x4DDA) + ' Mouth',
				    '28 ' + String.fromCodePoint(0x4DDB) + ' Great Excess',
				    '29 ' + String.fromCodePoint(0x4DDC) + ' Water',
				    '30 ' + String.fromCodePoint(0x4DDD) + ' Fire',
				    '31 ' + String.fromCodePoint(0x4DDE) + ' Influence',
				    '32 ' + String.fromCodePoint(0x4DDF) + ' Duration',
				    '33 ' + String.fromCodePoint(0x4DE0) + ' Retreat',
				    '34 ' + String.fromCodePoint(0x4DE1) + ' Power',
				    '35 ' + String.fromCodePoint(0x4DE2) + ' Progress',
				    '36 ' + String.fromCodePoint(0x4DE3) + ' Darkness',
				    '37 ' + String.fromCodePoint(0x4DE4) + ' Family',
				    '38 ' + String.fromCodePoint(0x4DE5) + ' Opposition',
				    '39 ' + String.fromCodePoint(0x4DE6) + ' Hardship',
				    '40 ' + String.fromCodePoint(0x4DE7) + ' Release',
				    '41 ' + String.fromCodePoint(0x4DE8) + ' Decrease',
				    '42 ' + String.fromCodePoint(0x4DE9) + ' Increase',
				    '43 ' + String.fromCodePoint(0x4DEA) + ' Resolution',
				    '44 ' + String.fromCodePoint(0x4DEB) + ' Meeting',
				    '45 ' + String.fromCodePoint(0x4DEC) + ' Gathering',
				    '46 ' + String.fromCodePoint(0x4DED) + ' Rising',
				    '47 ' + String.fromCodePoint(0x4DEE) + ' Exhaustion',
				    '48 ' + String.fromCodePoint(0x4DEF) + ' Well',
				    '49 ' + String.fromCodePoint(0x4DF0) + ' Revolution',
				    '50 ' + String.fromCodePoint(0x4DF1) + ' Cauldron',
				    '51 ' + String.fromCodePoint(0x4DF2) + ' Thunder',
				    '52 ' + String.fromCodePoint(0x4DF3) + ' Mountain',
				    '53 ' + String.fromCodePoint(0x4DF4) + ' Development',
				    '54 ' + String.fromCodePoint(0x4DF5) + ' Marriage',
				    '55 ' + String.fromCodePoint(0x4DF6) + ' Abundance',
				    '56 ' + String.fromCodePoint(0x4DF7) + ' Wandering',
				    '57 ' + String.fromCodePoint(0x4DF8) + ' Wind',
				    '58 ' + String.fromCodePoint(0x4DF9) + ' Lake',
				    '59 ' + String.fromCodePoint(0x4DFA) + ' Dispersing',
				    '60 ' + String.fromCodePoint(0x4DFB) + ' Limitation',
				    '61 ' + String.fromCodePoint(0x4DFC) + ' Truth',
				    '62 ' + String.fromCodePoint(0x4DFD) + ' Small Excess',
				    '63 ' + String.fromCodePoint(0x4DFE) + ' Completion',
				    '64 ' + String.fromCodePoint(0x4DFF) + ' Incompletion',
			    ]
		    },
		    'Harry Potter': { name: 'Harry Potter', values: ['Griffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'] },
		    'Maslow\'s Hierarchy': { name: 'Maslow\'s Hierarchy', values: ['Physiological Needs (food, water, shelter)', 'Safety & Security', 'Love & Belonging', 'Self-esteem (freedom, respect)', 'Self-actualization (achieving one\'s potential'] },
		    'Ultima Virtues': { name: 'Ultima Virtues', values: ['Honesty', 'Compassion', 'Courage', 'Justice', 'Sacrifice', 'Honor', 'Spirituality', 'Humility'] },
		    'Gargish Virtues': { name: 'Gargish Virtues', values: ['Direction', 'Feeling', 'Persistence', 'Balance', 'Achievement', 'Precision', 'Singularity', 'Order'] },
		    'Platonic Virtues': { name: 'Platonic Virtues', values: ['Wisdom', 'Fortitude', 'Temperance', 'Justice', 'Piety'] },
		    'Aristotelian Virtues': { name: 'Aristotelian Virtues', values: ['Courage', 'Temperance', 'Liberality', 'Magnificence', 'Magnanimity', 'Proper ambition', 'Patience', 'Truthfulness', 'Wittiness', 'Friendliness', 'Justice',] },
		    'Roman Virtues': { name: 'Roman Virtues', values: ['Courage', 'Dignity', 'Diligence', 'Discipline', 'Dutifulness', 'Frugality', 'Gladness', 'Good Faith', 'Gravity', 'Humanity', 'Humour', 'Justice', 'Manliness', 'Mercy', 'Nobility', 'Prosperity', 'Prudence', 'Respectibility', 'Selflessness', 'Spirituality', 'Sternness', 'Tenacity', 'Truthfulness', 'Wholesomeness',] },
		    'Knightly Virtues': { name: 'Knightly Virtues', values: ['Love God', 'Love your neighbor', 'Give alms to the poor', 'Entertain strangers', 'Visit the sick', 'Be merciful to prisoners', 'Do ill to no man, nor consent unto such', 'Forgive as ye hope to be forgiven', 'Redeem the captive', 'Help the oppressed', 'Defend the cause of the widow and orphan', 'Render righteous judgement', 'Do not consent to any wrong', 'Persevere not in wrath', 'Shun excess in eating and drinking', 'Be humble and kind', 'Serve your liege lord faithfully', 'Do not steal', 'Do not perjure yourself, nor let others do so', 'Defend the Church and promote her cause'] },
		    'Sikh Virtues': { name: 'Sikh Virtues', values: ['Truth', 'Compassion', 'Contentment', 'Humility', 'Love'] },
	    },
	    chakrasInPlay: {},
	    chakrasInPlayComp: {},
	    chakraTemplate: null,
	    chakraTemplateComp: null,
	    valueTemplate: null,
	    selectedValueTemplateValue: null,
	    selectedChakra: null,
	    seaCorrespondences: {},
	    brainstormConcern: '',
	    brainstormConcerns: { 
		    'Family': true, 
		    'Money': true, 
		    'Love': true, 
	    },
	    elements: {
		    air: { name: 'Air', symbol: String.fromCodePoint(0x1F701), bg: '#FFF0A1', color: '#B2A03E', },
		    fire: { name: 'Fire', symbol: String.fromCodePoint(0x1F702), bg: '#FAA8A1', color: '#F2393E', },
		    earth: { name: 'Earth', symbol: String.fromCodePoint(0x1F703), bg: '#DEB887', color: '#553311', },
		    water: { name: 'Water', symbol: String.fromCodePoint(0x1F704), bg: '#8EB8E7', color: '#113355', },
	    },
	    elementDesignations: {
	    },
	    colorFamilyRows: [
		    [{ name: "Reds", colors: ['#8B0000', '#FF3000', '#FF6666'], bg: '#FFF0F0' }, { name: "Pinks", colors: ['#C71585', '#FF1493', '#FFB6C1'], bg: '#FFF0F5' }, { name: "Oranges", colors: ['#D2691E', '#FFB500', '#FFC376'], bg: '#FFF5F0' }],
		    [{ name: "Yellows", colors: ['#DAA520', '#FFD700', '#FFF68F'], bg: '#FFFFF0' }, { name: "Greens", colors: ['#6B8E23', '#7FFF00', '#BEF574'], bg: '#F5FFF0' }, { name: "Teals", colors: ['#008B8B', '#20B2AA', '#40E0D0'], bg: '#F0FFFF' }], 
		    [{ name: "Blues", colors: ['#00008B', '#0000FF', '#87CEEB'], bg: '#F0F8FF' }, { name: "Purples", colors: ['#4B0082', '#8A2BE2', '#DDA0DD'], bg: '#F8F0FF' }, { name: "Magentas", colors: ['#8B008B', '#FF00FF', '#FFB3FF'], bg: '#FFF0FF' }], 
		    [{ name: "Browns", colors: ['#553311', '#8B4513', '#DEB887'], bg: '#FAF5F0' }, { name: "Neutrals", colors: ['#000000', '#808080', '#FFFFFF'], bg: '#F8F8F8' }],
	    ],
    },
    computed: {
	    islandsLength: function() {
		    return Object.keys(this.islands).length;
	    },
    },
    methods: {
	    formatPolyPoint: function(val) {
		    return (Math.round(10000 * ((val + 1) / 2)) / 100) + '%';
	    },
	    getPolyPoints: function(sides, starFactor, borderPercent) {
		    if (!starFactor) { starFactor = 1; }
		    if (!borderPercent) { borderPercent = .08; }
		    var t = this;
		    var eachAngle = 360 * starFactor / sides;
		    var angles = [];
		    for (var i = 0; i < sides; i++) {
			    angles.push(eachAngle * i);
		    }

		    var coordinates = [];
		    angles.forEach(function(angle) {
			    var radians = angle * (Math.PI / 180);
			    var xVal = Math.cos(radians);
			    var yVal = Math.sin(radians);
			    coordinates.push({ x: xVal, y: yVal });
		    });
		    coordinates.push({ ...coordinates[0] });

		    var reverseShrunkCoordinates = [];
		    coordinates.forEach(function(coordinate) {
			    reverseShrunkCoordinates.push({ x: coordinate.x * (1 - borderPercent), y: coordinate.y * (1 - borderPercent) });
		    });
		    for (var i = reverseShrunkCoordinates.length - 1; i >= 0; i--) {
			    coordinates.push(reverseShrunkCoordinates[i]);
		    }

		    var coordinatesString = '';
		    coordinates.forEach(function(coordinate) {
			    coordinatesString += t.formatPolyPoint(coordinate.x) + ' ' + t.formatPolyPoint(coordinate.y) + ', '
		    });
		    return 'polygon(' + coordinatesString.substring(0, coordinatesString.length - 2) + ')';
	    },
	    switchTab: function(tab) {
		    var t = this;
		    t.tab = tab;

		    if (tab == 'Brainstorm') {
			    t.toggleChakraTemplate(t.chakraTemplate);
		    }
		    if ((tab == 'Designations' || tab == 'Correspondences' || tab == 'Visualizations' || tab == 'Islands') && (!t.chakraTemplate || t.chakraTemplate.name != 'Brittan\'s Template')) {
			    t.toggleChakraTemplate(t['Brittan\'s Template']);
		    }
	    },
	    templateClicked: function(template) {
		    var t = this;
		    if (t.tab == 'Layout') {
			    t.toggleChakraTemplate(template);
		    } if (t.tab == 'The Sea') {
			    t.toggleValueTemplate(template);
		    }
	    },
	    toggleChakraTemplate: function(chakraTemplate) {
		    var t = this;
		    t.chakrasInPlay = {};
		    if (t.chakraTemplate && t.chakraTemplate.name == chakraTemplate.name) {
			    t.chakraTemplate = null;
		    } else {
			    t.chakraTemplate = chakraTemplate;
			    for (var key in t.chakraTemplate.chakras) {
				    t.chakrasInPlay[key] = { ...t.chakraTemplate.chakras[key] };
				    t.chakrasInPlay[key].top = t.possibleChakras[key].top;
			    }
		    }
	    },
	    toggleChakraTemplateComp: function(chakraTemplateComp) {
		    var t = this;
		    t.chakrasInPlayComp = {};
		    if (t.chakraTemplateComp && t.chakraTemplateComp.name == chakraTemplateComp.name) {
			    t.chakraTemplateComp = null;
		    } else {
			    t.chakraTemplateComp = chakraTemplateComp;
			    for (var key in t.chakraTemplateComp.chakras) {
				    t.chakrasInPlayComp[key] = { ...t.chakraTemplateComp.chakras[key] };
				    t.chakrasInPlayComp[key].top = t.possibleChakras[key].top;
			    }
		    }
	    },
	    toggleValueTemplate: function(valueTemplate) {
		    var t = this;
		    t.seaCorrespondences = {}; 
		    t.selectedValueTemplateValue = null;
		    if (t.valueTemplate && t.valueTemplate.name == valueTemplate.name) {
			    t.valueTemplate = null;
		    } else {
			    t.valueTemplate = valueTemplate;
		    }
	    },
	    chakraClicked: function(chakra) {
		    var t = this;
		    if (t.tab == 'Layout') {
			    t.toggleChakra(chakra);
		    } else if (t.tab == 'The Sea') {
			    if (t.selectedValueTemplateValue) {
				    Vue.set(t.seaCorrespondences, t.selectedValueTemplateValue, chakra.bodyPart);
			    }
		    } else if (t.tab == 'Correspondences' || t.tab == 'Visualizations' || t.tab == 'Islands') {
			    t.toggleSelectedChakra(chakra);
		    }
	    },
	    toggleChakra: function(chakra) {
		    var t = this;
		    t.chakraTemplate = null;
		    if (t.chakrasInPlay[chakra.bodyPart]) {
			    Vue.delete(t.chakrasInPlay, chakra.bodyPart);
		    } else {
			    Vue.set(t.chakrasInPlay, chakra.bodyPart, { bodyPart: chakra.bodyPart, top: t.possibleChakras[chakra.bodyPart].top, meaning: '', });
		    }
	    },
	    toggleSelectedChakra: function(chakra) {
		    var t = this;
		    if (t.selectedChakra === chakra) {
			    t.selectedChakra = null;
		    } else {
			    t.selectedChakra = chakra;
		    }
	    },
    },
    mounted: function() {},
    watch: {},
});
