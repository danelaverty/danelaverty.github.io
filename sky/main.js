Vue.component('a-planet', {
	props: { planet: Object, timeOffset: Number, opacity: Number, showName: Boolean, isFlat: Boolean, iteration: Number, reference: Boolean },
	computed: {
		planetAngle: function() {
			return this.$root.planetAngle(this.planet.name, this.$root.dateTime + this.timeOffset) + this.$root.additionalRotation;
		},
		previousPlanetAngle: function() {
			return this.$root.planetAngle(this.planet.name, this.$root.dateTime + this.timeOffset - 1000000) + this.$root.additionalRotation;
		},
		isRetrograde: function() {
			return this.previousPlanetAngle < this.planetAngle;
		},
		planetSign: function() {
			if (['NN', 'SN'].indexOf(this.planet.name) > -1) { return {}; }
			return this.$root.angleSign(this.planetAngle);
		},
		planetTransform: function() {
			if (this.isFlat) { 
				var planetAngleNormalized = (this.planetAngle - /*this.$root.planetAngle('Sun', this.$root.dateTime + this.timeOffset) - 150 -*/ (this.$root.showTropical ? 39 : (39-24.2)) + 360) % 360;
				var flatDistribution = 420 - ((planetAngleNormalized / 360) * 840);
				return 'translate(' + flatDistribution + 'px, ' + (-300 + (20 * this.iteration)) + 'px)';
			}
			var planetName = this.planet.name;
			if (planetName == 'NN') {
				return 'translate(-50%, -50%) rotate(' + this.$root.northSouthNodeRotation + 'deg)';
			} else if (planetName == 'SN') {
				return 'translate(-50%, -50%) rotate(' + (180 + this.$root.northSouthNodeRotation) + 'deg)';
			} else {
				return 'translate(-50%, -50%) rotate(' + this.planetAngle + 'deg)';
			}
		},
		planetZ: function() {
			if (this.planet.name == 'Sun' || this.planet.name == 'Moon') {
				var z = Math.round(100 * Astronomy.GeoVector(this.planet.name, this.$root.dateShown, false).z) / 100;
				if (this.planet.name == 'Sun') {
					this.$root.sunZs.push([this.$root.dateShown, z]);
				}
				return z;
			}
		},
	},
	mounted: function() {
		this.$forceUpdate();
	},
	template: '' +
		'<div class="a-planet" ' +
			'@click.stop="$root.togglePlanetSelection(planet.name)" ' +
			':id="planet.name + \'-container\'" ' +
			':class="{ dim: $root.selectedPlanets && !$root.selectedPlanets[planet.name], }" ' +
			':style="{ ' +
				'transform: planetTransform, ' +
				'height: (this.$root.toEcliptic ? 600 : this.$root.tinyView ? 100 : (100 + 32 * planet.order)) + \'px\', ' +
				'}" ' +
			'>' +
			'<div class="planet-name" v-if="!$root.useSymbols && showName && !reference" ' +
				':class="{ small: $root.sequenceView, node: planet.name == \'NN\' || planet.name == \'SN\', }" ' +
				':style="{ ' +
					'transform: \'translate(-50%, -50%) scale(\' + (1 / $root.scale) + \') rotate(-\' + planetAngle + \'deg) scaleY(\' + (1 / Math.cos($root.rotateX * Math.PI / 180)) + \')\', ' +
				'}" ' +
				'>{{ planet.name }}</div>' +
			'<div class="planet-symbol" v-if="$root.useSymbols && showName" :class="{ node: planet.name == \'NN\' || planet.name == \'SN\', }">{{ planet.symbol }}</div>' +
			'<div class="planet-disc" ' +
				':id="planet.name + \'-domal-dignity\'" ' +
				'v-if="$root.showDignities && (planet.name == planetSign.planet || planet.name == planetSign.secondaryPlanet)" ' +
				':style="{ ' +
					'backgroundColor: \'yellow\', ' +
					'width: planet.size * 1.5 + \'px\', ' +
					'height: planet.size * 1.5 + \'px\', ' +
					'filter: \'blur(2px) saturate(5)\', ' +
					'opacity: opacity, ' +
					'transform: \'translate(-50%, -50%)\', ' +
				'}" ' +
			'>' +
			'</div>' +
			'<div class="planet-disc" ' +
				':id="planet.name + \'-retrograde\'" ' +
				'v-if="$root.showRetrogrades && isRetrograde" ' +
				':style="{ ' +
					'backgroundColor: \'red\', ' +
					'width: planet.size * 1.5 + \'px\', ' +
					'height: planet.size * 1.5 + \'px\', ' +
					'filter: \'blur(2px) saturate(5)\', ' +
					'opacity: opacity, ' +
					'transform: \'translate(-50%, -50%)\', ' +
				'}" ' +
			'>' +
			'</div>' +
			'<div class="planet-disc" ' +
				':id="planet.name + \'-disc\'" ' +
				':style="{ ' +
					'backgroundColor: reference ? \'white\' : planet.color, ' +
					'border: planet.color == \'black\' ? \'1px solid #AAA\' : null, ' +
					'width: planet.size + \'px\', ' +
					'height: planet.size + \'px\', ' +
					'opacity: opacity, ' +
					'transform: \'translate(-50%, -50%) rotate(-\' + planetAngle + \'deg) scaleY(\' + (1 / Math.cos($root.rotateX * Math.PI / 180)) + \')\', ' +
				'}" ' +
			'>' +
				'<div v-if="planet.name == \'Moon\'" class="moon-shader" ' +
					':style="{ ' +
						'transform: \'rotate(\' + (180 - 90 + $root.sunAngle() - $root.moonAngle - ($root.visibleSkyUp ? $root.theCenterRotation : 0)) + \'deg)\', ' +
						'opacity: opacity, ' +
					'}" ' +
				'></div>' +
			'</div>' +
		'</div>' +
		'',
});

Vue.component('a-star', {
	props: ['star'],
	computed: {
		starTransform: function() {
			return 'translate(-50%, -50%) rotate(' + (this.$root.additionalRotation + 40 + (15 * -this.star.ra)) + 'deg)';
			//return 'translate(-50%, -50%) rotate(23deg)';
		},
		easingAdjustment: function() {
			//if (this.star.ra < 12) { return 0; }
			return (
				(Math.sin(this.$root.eclCoe * this.star.ra - this.$root.eclRot)) * this.$root.eclExt + // Sagittarius pull
				//(Math.sin(.54 * this.star.ra - 2.0) + 1) * 35 + // Scorpio / Gemini stretch
				0
			       )
		},
		starColor: function() {
			if (this.star.con == 'Ari') return '#CB997E';
			if (this.star.con == 'Tau') return '#EDDCD2';
			if (this.star.con == 'Gem') return '#FFF1E6';
			if (this.star.con == 'Cnc') return '#F0EFEB';
			if (this.star.con == 'Leo') return '#DDBEA9';
			if (this.star.con == 'Vir') return '#A5A58D';
			if (this.star.con == 'Lib') return '#B7B7A4';
			if (this.star.con == 'Sco') return '#E8EBE4';
			if (this.star.con == 'Sgr') return '#D2D5DD';
			if (this.star.con == 'Cap') return '#B8BACF';
			if (this.star.con == 'Aqr') return '#999AC6';
			if (this.star.con == 'Psc') return '#A4A99E';
			if (this.star.con == 'ECL') return '#0F0';
			return '#777';
		},
	},
	template: '' +
		'<div class="a-star" ' +
			':style="{ ' +
				'transform: starTransform, ' +
				'height: (1.2 * ((5 * star.dec) + easingAdjustment + 500)) + \'px\', ' +
				'}" ' +
			'>' +
				'<div class="star-name" ' +
					':style="{ color: starColor, }"' +
					'v-if="!$root.useSymbols && (star.mag <= 1.6 || [\'Algol\', ].indexOf(star.name) > -1)" ' +
					'>{{ star.name }}</div>' +
				//'<div class="star-id">{{ Math.round(star.dec * 1000)/1000 }}</div>' +
				//'<div class="star-mag" :style="{ color: starColor, }">{{ star.mag }}</div>' +
				'<div class="star-disc" ' +
					':style="{ ' +
						'backgroundColor: starColor, ' +
						'width: (7 - star.mag) + \'px\', ' +
						'height: (7 - star.mag) + \'px\', ' +
					'}" ' +
				'>' +
				'</div>' +
		'</div>' +
		'',
});

Vue.component('a-line', {
	props: ['line'],
	computed: {
		convertedFromID: function() { return this.$root.theStarsNameLookup[this.line.fromID]; },
		convertedToID: function() { return this.$root.theStarsNameLookup[this.line.toID]; },
		fromEl: function() { 
			var target = document.getElementById(this.convertedFromID);
			return target.getBoundingClientRect();
		},
		toEl: function() { 
			var target = document.getElementById(this.convertedToID);
			return target.getBoundingClientRect();
		},
		fromStar: function() {
			return this.$root.theStarsFiltered[this.convertedFromID];
		},
		toStar: function() {
			return this.$root.theStarsFiltered[this.convertedToID];
		},
		linkDistance: function() {
			return this.$root.distanceFromToEls(this.fromEl, this.toEl);
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
		fromStarRotation: function() {
			var fsr = 40 + (15 * -this.fromStar.ra);
			return fsr;
		},
		lineTransform: function() {
			return 'translate(-50%, -50%) rotate(' + this.fromStarRotation + 'deg)';
			//return 'translate(-50%, -50%) rotate(23deg)';
		},
		easingAdjustment: function() {
			//if (this.star.ra < 12) { return 0; }
			return (
				(Math.sin(this.$root.eclCoe * this.fromStar.ra - this.$root.eclRot)) * this.$root.eclExt + // Sagittarius pull
				//(Math.sin(.54 * this.fromStar.ra - 2.0) + 1) * 35 + // Scorpio / Gemini stretch
				0
			       )
		},
	},
	template: '' +
		'<div class="a-line" ' +
			':style="{ ' +
				'transform: lineTransform, ' +
				'height: (1.2 * ((5 * fromStar.dec) + easingAdjustment + 500)) + \'px\', ' +
				'}" ' +
			'>' +
			'<div class="the-visible-line" ' +
				':style="{ height: linkDistance + \'px\', transform: \'rotate(\' + (linkAngle) + \'deg)\', }" ' +
				'></div>' +
		'</div>' +
		'',
});

Vue.component('main-frame', {
	template: '' +
		'<div class="main-frame">' +
			'<div class="main-frame-vertical left">' +
				'<div class="date-controls control-box" style="top: 0; left: 0;">' +
					'<div class="control-button on" v-if="!$root.visibleSkyUp" @click.stop="$root.visibleSkyUp = true; $root.showShader = true; $root.stepIncrement = 100000;">Space&nbsp;View</div>' +
					'<div class="control-button on" v-if="$root.visibleSkyUp" @click.stop="$root.visibleSkyUp = false; $root.showShader = false; $root.stepIncrement = 10000000;">Earth&nbsp;View</div>' +
					'<div class="control-button" @click.stop="$root.runClock" v-if="$root.clockID == -1">GO</div>' +
					'<div class="control-button on" @click.stop="$root.stopClock" v-if="$root.clockID != -1">STOP</div>' +
					'<div class="control-button" v-if="!$root.showButtons" @click.stop="$root.showButtons = true;">&#9650;</div>' +
					'<div class="control-button" v-if="$root.showButtons" @click.stop="$root.showButtons = false;">&#9660;</div>' +
					'<div class="buttons-container" v-if="$root.showButtons" style=" white-space: nowrap;">' +
						'<div>' +
							'<div class="speed-control-button" @click.stop="$root.stepIncrementDown">&minus;</div>' +
							'<div class="speed-control-button" @click.stop="$root.stepIncrementUp">+</div>' +
						'</div>' +
						'<div class="control-text">Speed: {{ $root.stepIncrement / 1000000 }} ({{ Math.round(($root.stepIncrement / $root.DAY) * 100) / 100 }} days)</div>' +
						'<div>' +
							'<div class="speed-control-button" @click.stop="$root.tickScaleDown">&minus;</div>' +
							'<div class="speed-control-button" @click.stop="$root.tickScaleUp">+</div>' +
						'</div>' +
						'<div class="control-text">Scale: {{ $root.tickScale }}</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = $root.sessionStorage.getItem(\'savedTime\') ? parseInt($root.sessionStorage.getItem(\'savedTime\')) : 0;">Load</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1718973664715">Longest SR</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1718996414715">Longest Noon</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1719000014715">Longest 1:00</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1719027564715">Longest SS</div>' +
						//'<br>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1734794724715">Shortest SR</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1734811224715">Shortest Noon</div>' +
						//'<div class="control-button" @click.stop="$root.dateTime = 1734828424715">Shortest SS</div>' +
						//'<br>' +
						//'<div class="control-button" :class="{ on: $root.useSymbols, }" @click.stop="$root.useSymbols = !$root.useSymbols">Symbols</div>' +
						'<div class="control-button" :class="{ on: $root.showShader, }" @click.stop="$root.showShader = !$root.showShader">Horizon</div>' +
						'<div class="control-button" :class="{ on: $root.visibleSkyUp, }" @click.stop="$root.visibleSkyUp = !$root.visibleSkyUp">Sky Up</div>' +
						'<div class="control-button" :class="{ on: $root.showLasers, }" @click.stop="$root.showLasers = !$root.showLasers">Finders</div>' +
						'<div class="control-button" :class="{ on: $root.showLines, }" @click.stop="$root.showLines = !$root.showLines">Const.</div>' +
						//'<div class="control-button" :class="{ on: $root.showTropical, }" @click.stop="$root.showTropical = !$root.showTropical">Tropical</div>' +
						'<div class="control-button" :class="{ on: $root.showAspects, }" @click.stop="$root.showAspects = !$root.showAspects">Aspects</div>' +
						'<div class="control-button" :class="{ on: $root.showDivisions, }" @click.stop="$root.showDivisions = !$root.showDivisions">Divisions</div>' +
						//'<div class="control-button" :class="{ on: $root.showDignities, }" @click.stop="$root.showDignities = !$root.showDignities">Dignities</div>' +
						//'<div class="control-button" :class="{ on: $root.showRetrogrades, }" @click.stop="$root.showRetrogrades = !$root.showRetrogrades">Retrogrades</div>' +
						'<div class="control-button" :class="{ on: $root.showAngles, }" @click.stop="$root.showAngles = !$root.showAngles">Angles</div>' +
						'<div class="control-button" :class="{ on: $root.showTransits, }" @click.stop="$root.showTransits = !$root.showTransits">Transits</div>' +
						'<div class="control-button" :class="{ on: $root.showCards, }" @click.stop="$root.showCards = !$root.showCards">Cards</div>' +
						'<div class="control-button" :class="{ on: $root.toEcliptic, }" @click.stop="$root.toEcliptic = !$root.toEcliptic">To Ecliptic</div>' +
						//'<div class="control-button" :class="{ on: $root.sequenceView, }" @click.stop="$root.sequenceView = !$root.sequenceView;">Sequence</div>' +
						//'<div class="control-button" :class="{ on: $root.tinyView, }" @click.stop="$root.tinyView = !$root.tinyView">Tiny</div>' +
						'<div class="control-button" :class="{ on: $root.videoView, }" @click.stop="$root.videoView = !$root.videoView">Video</div>' +
						'<div class="control-button" :class="{ on: $root.showAspectsSequence, }" @click.stop="$root.showAspectsSequence = !$root.showAspectsSequence">Sequence</div>' +
					'</div>' + 
				'</div>' +
				'<div class="control-box" style="bottom: 0; left: 0;"' +
					'>' +
					'<table class="placements-table aspect-list">' +
						'<tr v-for="(planet, planetName) in $root.placements()" :key="planetName" ' +
							':class="{ selected: $root.selectedPlanets && $root.selectedPlanets[planetName], }" ' +
							//'@click.stop="$root.togglePlanetSelection(planetName)" ' +
							'>' +
							'<td style="text-align: right;">{{ planetName }}</td>' +
							'<td>{{ planetName == \'Rising\' ? \'\' : $root.thePlanets.filter(function(planet) { return planet.name == planetName })[0].symbol }}</td>' +
							'<td>{{ planet.name == \'Rising\' ? \'R\' : $root.theZodiac.filter(function(constellation) { return constellation.name == planet.sign })[0].symbol }}</td>' +
							'<td>{{ planet.sign }}</td>' +
							'<td v-if="$root.referenceMoment"> / </td>' +
							'<td v-if="$root.referenceMoment">{{ planet.referenceSign }}</td>' +
						'</tr>' +
					'</table>' +
				'</div>' +
			'</div>' +
			'<div class="main-frame-vertical right">' +
				'<div class="control-box" style="top: 0; right: 0;">' +
					'<div style="display: inline-block;">' +
						'<table class="date-shown no-select">' +
							'<tr class="control-row">' +
								'<td class="control-cell" style="text-align: right;" @click.stop="$root.dateTime += (60 * 60 * 1000)">&#9650;</td>' +
								'<td class="control-cell" style="text-align: right;" @click.stop="$root.dateTime += (60 * 1000)">&#9650;</td>' +
								'<td></td>' +
								'<td class="control-cell" @click.stop="incrementMonth">&#9650;</td>' +
								'<td class="control-cell" @click.stop="$root.dateTime += (24 * 60 * 60 * 1000)">&#9650;</td>' +
								'<td class="control-cell" @click.stop="incrementYear">&#9650;</td>' +
								'<td class="control-cell"></td>' +
								'<td class="control-cell" @click.stop="$root.incrementRotateX()">&#9650;</td>' +
								'<td class="control-cell" @click.stop="$root.incrementAdditionalRotation()">&#9650;</td>' +
								'<td class="control-cell" @click.stop="$root.scale += .1;">&#9650;</td>' +
							'</tr>' +
							'<tr style="font-size: 16px;">' +
								'<td>{{ $root.dateShown.getHours() == 0 ? 12 : ($root.dateShown.getHours() > 12 ? $root.dateShown.getHours() - 12 : $root.dateShown.getHours()) }}:</td>' +
								'<td><span v-show="$root.dateShown.getMinutes() < 10">0</span>{{ $root.dateShown.getMinutes() }}</td>' +
								'<td>{{ $root.dateShown.getHours() >= 12 ? \'PM\' : \'AM\' }}&nbsp;</td>' +
								'<td><span v-show="$root.dateShown.getMonth() < 9">0</span>{{ $root.dateShown.getMonth() + 1 }}/</td>' +
								'<td><span v-show="$root.dateShown.getDate() < 10">0</span>{{ $root.dateShown.getDate() }}/</td>' +
								'<td>{{ $root.dateShown.getFullYear() }}&nbsp;</td>' +
								'<td class="dst-indicator" :style="{ color: $root.isDST() ? \'white\' : \'black\', }">(DST)</td>' +
								'<td>&nbsp;{{ $root.rotateX > 0 ? \'+\' : \'\' }}{{ $root.rotateX }}&deg;</td>' +
								'<td>&nbsp;{{ $root.additionalRotation > 0 ? \'+\' : \'\' }}{{ $root.additionalRotation }}&deg;</td>' +
								'<td>&nbsp;{{ Math.round($root.scale * 10) / 10 }}x</td>' +
							'</tr>' +
							'<tr class="control-row">' +
								'<td class="control-cell" style="text-align: right;" @click.stop="$root.dateTime -= (60 * 60 * 1000)">&#9660;</td>' +
								'<td class="control-cell" style="text-align: right;" @click.stop="$root.dateTime -= (60 * 1000)">&#9660;</td>' +
								'<td></td>' +
								'<td class="control-cell" @click.stop="decrementMonth">&#9660;</td>' +
								'<td class="control-cell" @click.stop="$root.dateTime -= (24 * 60 * 60 * 1000)">&#9660;</td>' +
								'<td class="control-cell" @click.stop="decrementYear">&#9660;</td>' +
								'<td class="control-cell"></td>' +
								'<td class="control-cell" @click.stop="$root.decrementRotateX()">&#9660;</td>' +
								'<td class="control-cell" @click.stop="$root.decrementAdditionalRotation()">&#9660;</td>' +
								'<td class="control-cell" @click.stop="$root.scale -= .1;">&#9660;</td>' +
							'</tr>' +
						'</table>' +
						'<div class="date-controls" style="text-align: right; min-width: 0px;">' +
							'<div class="moments-button" @click.stop="$root.saveDateTime" style="display: inline-block;">Save</div>' +
							'<div class="moments-button" @click.stop="$root.loadTime = $root.dateTime" style="display: inline-block;">Reset</div>' +
							'<div class="moments-button" @click.stop="$root.dateTime = new Date().getTime(); $root.loadTime = $root.dateTime - (24 * 60 * 60 * 1000);" style="display: inline-block;">Now</div>' +
							'<table style="clear: right;">' +
								//'<tr><td><table class="moments-table"><tr><td @click.stop="$root.dateTime = new Date().getTime()">Now</td></tr></table></td></tr>' +
								'<tr v-for="savedDateTime in $root.savedDateTimes">' +
									'<td><table style="margin: 3px;" class="moments-table"><tr>' +
									'<td colspan="3" @click.stop="$root.dateTime = savedDateTime.time; $root.loadTime = savedDateTime.time" style="cursor: pointer;">{{ savedDateTime.name }}</td>' +
									'</tr><tr>' +
									'<td @click.stop="referenceMoment(savedDateTime.time)"><div class="moments-button" ' +
										':style="{ ' +
											'color: $root.referenceMoment == savedDateTime.time ? \'white\' : null, ' +
											'backgroundColor: $root.referenceMoment == savedDateTime.time ? \'#AA3\' : null, ' +
										'}" ' +
									'>Reference</div></td>' +
									'<td @click.stop="renameMoment(savedDateTime.time, savedDateTime.name)"><div class="moments-button">Rename</div></td>' +
									'<td @click.stop="deleteMoment(savedDateTime.time)"><div class="moments-button">Delete</div></td>' +
									'</tr></table></td>' +
								'</tr>' +
							'</table>' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="control-box" style="bottom: 0; right: 0;"' +
					'>' +
					'<div v-for="(p1, p1name) in $root.aspects" :key="p1name" :id="p1name + \'-aspects\'">' +
						'<div ' +
							'v-for="(p2, p2name) in p1" ' +
							'v-if="p2.p1order > p2.p2order" ' +
								//'&& p1name != \'Moon\' && p2name != \'Moon\'"" ' +
							':key="p1name + \'-\' + p2name" ' +
						'>' +
							'<div class="aspect-list" ' +
								':class="{ selected: $root.selectedPlanets && Object.keys($root.selectedPlanets).length == 2 && $root.selectedPlanets[p1name] && $root.selectedPlanets[p2name], }" ' +
								'@click.stop="$root.selectAspect(p1name, p2name)" ' +
								'>{{ p1name }} {{ p2.symbol }} {{ p2name }} ({{ p2.orb }}&deg;)</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'',
	methods: {
		renameMoment: function(time, oldName) {
			var $root = this.$root;
			var savedDateTimes = $root.savedDateTimes;
			var newName = prompt('What do you want to name "' + oldName + '"?');
			var newMoment = { time: time, name: newName };
			Vue.delete(savedDateTimes, time);
			Vue.set(savedDateTimes, time, newMoment);
		},
		deleteMoment: function(time) {
			var $root = this.$root;
			var savedDateTimes = $root.savedDateTimes;
			Vue.delete(savedDateTimes, time);
		},
		referenceMoment: function(time) {
			if (this.$root.referenceMoment == time) {
				this.$root.referenceMoment = null;
			} else {
				this.$root.referenceMoment = time;
			}
		},
		incrementMonth: function() {
			var newDate = new Date(this.$root.dateShown);
			if (newDate.getMonth() == 11) {
				newDate.setMonth(0);
				newDate.setYear(newDate.getFullYear() + 1);
			} else {
				newDate.setMonth(newDate.getMonth() + 1);
			}
			this.$root.dateTime = newDate.getTime();

		},
		incrementYear: function() {
			var newDate = new Date(this.$root.dateShown);
			newDate.setYear(newDate.getFullYear() + 1);
			this.$root.dateTime = newDate.getTime();
		},
		decrementMonth: function() {
			var newDate = new Date(this.$root.dateShown);
			if (newDate.getMonth() == 0) {
				newDate.setMonth(11);
				newDate.setYear(newDate.getFullYear() - 1);
			} else {
				newDate.setMonth(newDate.getMonth() - 1);
			}
			this.$root.dateTime = newDate.getTime();

		},
		decrementYear: function() {
			var newDate = new Date(this.$root.dateShown);
			newDate.setYear(newDate.getFullYear() - 1);
			this.$root.dateTime = newDate.getTime();
		}
	},
});

Vue.component('planet-card', {
	props: ['planet'],
	template: '' +
		'<div class="tiny-view-card" ' +
			'@click.stop="$root.showCards = false" ' +
			':style="{ ' +
				' marginLeft: Object.keys($root.selectedPlanets).length == 3 ? \'7px\' : null, ' +
				' marginRight: Object.keys($root.selectedPlanets).length == 3 ? \'7px\' : null, ' +
			'}" ' +
		'>' +
			'<div class="tiny-view-card-art">' +
				'<img :src="\'images/\' + planet.name + \'.png\'">' +
			'</div>' +
			'<div class="tiny-view-card-name">{{ planet.name }}</div>' +
			'<div class="tiny-view-card-key-trait">&mdash;<br>{{ planet.keyTrait }}</div>' +
			'<div class="tiny-view-card-text" style="top: 42%;">' +
				'<div class="tiny-view-card-trait" style="transform: translateX(-50%);">|</div>' +
				'<div class="tiny-view-card-trait" style="right: 10px;">{{ planet.traits[0] }}</div>' +
				'<div class="tiny-view-card-trait" style="left: 10px;">{{ planet.traits[1] }}</div>' +
			'</div>' +
			'<div class="tiny-view-card-text" style="bottom: 14%;">' +
				'<div class="tiny-view-card-trait" style="transform: translateX(-50%);">|</div>' +
				'<div class="tiny-view-card-trait" style="right: 10px;">{{ planet.traits[2] }}</div>' +
				'<div class="tiny-view-card-trait" style="left: 10px;">{{ planet.traits[3] }}</div>' +
			'</div>' +
		'</div>' +
	'',
});

Vue.component('the-sky', {
	template: '' +
		'<div class="the-sky" ' +
			'@click.stop="$root.showButtons = false;" ' +
			'>' +
			/*'<div class="the-sky-color" ' +
				':style="{ ' +				
					'opacity: .1 * Math.sin($root.dayPercent() * Math.PI) - .03, ' +
				'} "' +
			'></div>' +*/
			'<main-frame></main-frame>' +
			'<div id="sky-viewer" class="sky-viewer" ' +
				'>' +
				'<div class="the-center" id="the-center" ' +
					':style="{ ' +				
						'transform: ' +
							'\'scale(\' + $root.scale + \') rotate(\' + ($root.visibleSkyUp ? $root.theCenterRotation : 0) + \'deg) rotateX(\' + $root.rotateX + \'deg)\', ' +
					'} "' +
					'>' +
					'<div v-if="!$root.sequenceView" class="the-earth" ' +
						':style="{ ' +
							'transform: \'translate(-50%, -50%) scaleY(\' + (1 / Math.cos($root.rotateX * Math.PI / 180)) + \')\', ' +
						'}" ' +
						'>' +
						'<div v-if="!$root.sequenceView && $root.rotateX == 0" class="moon-shader" ' +
							':style="{ ' +
								'transform: \'rotate(\' + ($root.dayPercent() * 360) + \'deg)\', ' +
								'opacity: .9, ' +
							'}" ' +
						'></div>' +
					'</div>' +
					'<div v-if="!$root.sequenceView && $root.rotateX != 0" ' +
						'class="hide-the-rings-behind-the-earth" ' +
						'style="position: absolute; width: 20px; height: 20px; transform-style: preserve-3d; z-index: 10;" ' +
						':style="{ ' +
							'transform: \'translate(-10px, -10px) scaleY(\' + (1 / Math.cos($root.rotateX * Math.PI / 180)) + \')\', ' +
						'}" ' +
						'>' +
						'<div v-if="!$root.sequenceView && $root.rotateX != 0" ' +
							'style="position: absolute; width: 20px; height: 10px; overflow: hidden; transform-style: preserve-3d;" ' +
							'>' +
							'<div class="the-earth" ' +
								'style="background-color: #5599CC; transform: translate(0, 0);" ' +
								'>' +
							'</div>' +
						'</div>' +
					'</div>' +
					//'<div class="the-constellations-circle"></div>' +
					'<div class="sideral" v-if="!$root.showTropical && !$root.videoView">' +
						'<div class="the-ecliptic" v-if="!$root.sequenceView"></div>' +
						'<div class="constellation-divider"' + 
							'v-if="$root.showDivisions && !$root.sequenceView" ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + ($root.additionalRotation + i * (-360 / 12) + 360 / 24) + \'deg)\', }" ' +
						'></div>' +
						'<div class="the-ecliptic-flat" v-if="$root.sequenceView">' +
							'<div class="constellation-divider-flat"' + 
								'v-for="(constellation, i) in $root.theZodiac" ' +
								':style="{ left: (70 * i) + \'px\', }" ' +
							'>' +
								'<div class="constellation-name small" style="left: 35px;" v-if="!$root.useSymbols">{{ constellation.name }}</div>' +
							'</div>' +
							'<div class="constellation-divider-flat"' + 
								':style="{ left: (70 * 12) + \'px\', }" ' +
							'>' +
							'</div>' +
						'</div>' +
						/*'<div ' +
							'v-if="!$root.sequenceView" ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							'class="a-constellation" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + (i * (-360 / 12)) + \'deg)\', }" ' +
							'>' +
							'<div class="constellation-name" v-if="!$root.useSymbols">{{ constellation.name }}</div>' +
							//'<div class="constellation-symbol" v-if="$root.useSymbols">{{ constellation.symbol }}</div>' +
						'</div>' +*/
					'</div>' +
					'<div class="tropical" v-if="$root.showTropical && !$root.videoView">' +
						'<div class="the-ecliptic" v-if="!$root.sequenceView"></div>' +
						'<div class="constellation-divider"' + 
							'v-if="$root.showDivisions && !$root.sequenceView" ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + ($root.additionalRotation + 24.2 + i * (-360 / 12) + 360 / 24) + \'deg)\', }" ' +
						'></div>' +
						'<div class="the-ecliptic-flat" v-if="$root.sequenceView">' +
							'<div class="constellation-divider-flat"' + 
								'v-for="(constellation, i) in $root.theZodiac" ' +
								':style="{ left: (70 * i) + \'px\', }" ' +
							'>' +
								'<div class="constellation-name small" style="left: 35px;" v-if="!$root.useSymbols">{{ constellation.name }}</div>' +
							'</div>' +
							'<div class="constellation-divider-flat"' + 
								':style="{ left: (70 * 12) + \'px\', }" ' +
							'>' +
							'</div>' +
						'</div>' +
						/*'<div ' +
							'v-if="!$root.sequenceView" ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							'class="a-constellation" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + (24.2 + i * (-360 / 12)) + \'deg)\', }" ' +
							'>' +
							'<div class="constellation-name" v-if="!$root.useSymbols">{{ constellation.name }}</div>' +
							'<div class="constellation-symbol" v-if="$root.useSymbols">{{ constellation.symbol }}</div>' +
						'</div>' +*/
					'</div>' +
					'<div v-if="$root.tinyView">' +
						'<div class="tiny-view-frame">' +
						'</div>' +
						'<div class="tiny-view-frame-caption" style="top: -96px;">' +
							'<span>Tiny Horoscope</span>' +
						'</div>' +
						'<div class="tiny-view-frame-caption" style="top: 82px;">' +
							'<div class="tiny-view-card" ' +
								'v-for="(planet, planetName) in $root.selectedPlanets" ' +
							'>' +
								'<div class="tiny-view-card-art"><img :src="planetName == \'Jupiter\' ? \'zeus.png\' : \'chronos.png\'"></div>' +
								'<div class="tiny-view-card-name">{{ planetName }}</div>' +
								'<div class="tiny-view-card-text">{{ planetName == \'Saturn\' ? \'Pessimism\' : \'Optimism\'}}</div>' +
							'</div>' +
							'<div class="tiny-view-aspect">{{ String.fromCodePoint(0x2694) }}</div>' +
						'</div>' +
					'</div>' +
					/*'<div class="planet-circle major" ' +
						'v-if="!$root.toEcliptic && !$root.sequenceView" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':style="{ ' +
							'height: (100 + 32 * planet.order) + \'px\', ' +
							'width: (100 + 32 * planet.order) + \'px\', ' +
							'}" ' +
						'>' +
					'</div>' +*/
					'<div v-if="!$root.sequenceView">' +
						'<svg width="700" height="700" viewBox="0 0 700 700" ' +
							'style="position: absolute; top: 0px; left: 0px; pointer-events: none;" ' +
							':style="{ transform: \'translate(-50%, -50%)\', }" ' +
							'>' +
							'<defs>' +
								'<filter x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox" id="pencilTexture3">' +
									'<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="5" stitchTiles="stitch" result="f1">' +
									'</feTurbulence>' +
									'<feColorMatrix type="matrix" values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 -1.5 1.5" result="f2">' +
									'</feColorMatrix>' +
									'<feComposite operator="in" in2="f2b" in="SourceGraphic" result="f3">' +
									'</feComposite>' +
									'<feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="noise">' +
									'</feTurbulence>' +
									'<feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="2.5" in="f3" result="f4">' +
									'</feDisplacementMap>' +
								'</filter>' +
							'</defs>' +
							'<g v-if="$root.tinyView">' +
								'<circle cx="50%" cy="50%" r="50px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
							'</g>' +
							'<g v-if="!$root.toEcliptic && !$root.tinyView">' +
								//'<circle cx="50%" cy="50%" r="66px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								'<circle cx="50%" cy="50%" r="82px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								'<circle cx="50%" cy="50%" r="98px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								'<circle cx="50%" cy="50%" r="114px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								'<circle cx="50%" cy="50%" r="130px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								'<circle cx="50%" cy="50%" r="146px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								'<circle cx="50%" cy="50%" r="162px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								//'<circle cx="50%" cy="50%" r="178px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								//'<circle cx="50%" cy="50%" r="194px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								//'<circle cx="50%" cy="50%" r="210px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
								//'<circle cx="50%" cy="50%" r="300px" stroke="rgb(90, 80, 70)" stroke-width="1" fill="none" />' +
							'</g>' +
						'</svg>' +
					'</div>' +
					'<div v-if="!$root.sequenceView && !$root.videoView" style="position: absolute; left: 0; top: 0; transform: rotate(24.2deg);">' +
						'<svg ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							'width="700" ' +
							'height="700" ' +
							'viewBox="0 0 700 700" ' +
							'style="position: absolute; top: 0px; left: 0px; pointer-events: none;" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + (-30 * i + $root.additionalRotation) + \'deg)\', }" ' +
						'>' +
							'<g>' +
								'<path id="top-sector" style="fill:none;stroke:none" d="M 90,350 A 46,46.5 0 0 1 610,350" />' +
								'<text font-size="19" font-family="Georgia" fill="#777" width="500" text-anchor="middle">' +
									'<textPath alignment-baseline="middle" startOffset="50%" xlink:href="#top-sector">{{ constellation.name }}</textPath>' +
								'</text>' +
							'</g>' +
						'</svg>' +
						'<svg ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							'width="670" ' +
							'height="670" ' +
							'viewBox="0 0 700 700" ' +
							'style="position: absolute; top: 0px; left: 0px; pointer-events: none;" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + ($root.additionalRotation + -30 * i) + \'deg)\', }" ' +
						'>' +
							'<g>' +
								'<path id="top-sector" style="fill:none;stroke:none" d="M 90,350 A 46,46.5 0 0 1 610,350" />' +
								'<text font-size="12" font-family="Georgia" fill="#777" width="500" text-anchor="middle">' +
									'<textPath alignment-baseline="middle" startOffset="50%" xlink:href="#top-sector">{{ i + 1 }}</textPath>' +
								'</text>' +
							'</g>' +
						'</svg>' +
						'<svg ' +
							'v-if="$root.referenceMoment" ' +
							'v-for="(constellation, i) in $root.theZodiac" ' +
							'width="740" ' +
							'height="740" ' +
							'viewBox="0 0 700 700" ' +
							'style="position: absolute; top: 0px; left: 0px; pointer-events: none;" ' +
							':style="{ transform: \'translate(-50%, -50%) rotate(\' + ($root.additionalRotation + -30 * i - $root.houseRotation) + \'deg)\', }" ' +
						'>' +
							'<g>' +
								'<path id="top-sector" style="fill:none;stroke:none" d="M 90,350 A 46,46.5 0 0 1 610,350" />' +
								'<text font-size="16" font-family="Georgia" fill="#AA7" width="500" text-anchor="middle">' +
									'<textPath alignment-baseline="middle" startOffset="50%" xlink:href="#top-sector">{{ $root.romanNumerals[i + 1] }}</textPath>' +
								'</text>' +
							'</g>' +
						'</svg>' +
					'</div>' +
					'<div v-if="$root.sequenceView" v-for="n in $root.tickCount">' +
						'<a-planet ' +
							'v-for="(planet, i) in $root.thePlanets" ' +
							':key="planet.order" ' +
							':planet="planet" ' +
							':timeOffset="$root.stepIncrement * n" ' +
							':iteration="n" ' +
							':opacity="' +
								'($root.stepIncrement <= 100000000 && planet.placement == \'outer\') ? .15 : ' +
								'($root.stepIncrement == 1000000000 && planet.name == \'Moon\') ? .15 : ' +
								'($root.stepIncrement == 3000000000 && planet.placement == \'inner\') ? .15 : ' +
								'($root.stepIncrement == 10000000000 && (planet.placement == \'inner\' || planet.name == \'Mars\')) ? .15 : ' +
								'($root.stepIncrement == 50000000000 && (planet.placement == \'inner\' || planet.placement == \'middle\')) ? .15 : ' +
								'1' +
							'" ' +
							':showName="(n == 1 ? true : false)" ' +
							':isFlat=true ' +
							'>' +
						'</a-planet>' +
					'</div>' +
					'<div v-if="$root.sequenceView" class="aspects-row aspect-planets-header">' +
						'<div class="aspect-column" v-for="(planet, i) in $root.thePlanets" v-if="i != 9" :style="{ width: ((9 - i) * 16) + \'px\', }">{{ planet.name }}</div>' +
					'</div>' +
					'<div v-if="$root.sequenceView" class="aspects-row aspect-planets">' +
						'<template v-for="p1 in $root.thePlanets" ' +
							'>' +
							'<template v-for="p2 in $root.thePlanets" ' +
								'>' +
								'<div class="aspect-column" ' +
									'v-if="p1.order < p2.order" ' +
									'>' +
									//'<div style="position: absolute; top: 0; left: 3px;">{{ p1.symbol }}</div>' +
									'<div style="position: absolute; top: 100%; left: 0; width: 16px; text-align: center; font-size: 10px;">{{ p2.symbol }}</div>' +
									'<div class="planet-disc" ' +
										':id="p1.name + \'-disc\'" ' +
										':style="{ ' +
											'backgroundColor: p1.color, ' +
											'width: ([\'Moon\', \'Sun\'].indexOf(p1.name) > -1 ? 9 : 6) + \'px\', ' +
											'height: ([\'Moon\', \'Sun\'].indexOf(p1.name) > -1 ? 9 : 6) + \'px\', ' +
											'top: \'20%\', ' +
											'left: \'50%\', ' +
										'}" ' +
									'>' +
										'<div v-if="p1.name == \'Moon\'" class="moon-shader" ' +
											':style="{ ' +
												'width: (9) + \'px\', ' +
												'height: (9) + \'px\', ' +
											'}" ' +
										'></div>' +
									'</div>' +
									'<div class="planet-disc" ' +
										':id="p2.name + \'-disc\'" ' +
										':style="{ ' +
											'backgroundColor: p2.color, ' +
											'width: ([\'Moon\', \'Sun\'].indexOf(p2.name) > -1 ? 9 : 6) + \'px\', ' +
											'height: ([\'Moon\', \'Sun\'].indexOf(p2.name) > -1 ? 9 : 6) + \'px\', ' +
											'top: \'80%\', ' +
											'left: \'50%\', ' +
										'}" ' +
									'>' +
										'<div v-if="p2.name == \'Moon\'" class="moon-shader" ' +
											':style="{ ' +
												'width: (9) + \'px\', ' +
												'height: (9) + \'px\', ' +
											'}" ' +
										'></div>' +
									'</div>' +
								'</div>' +
							'</template>' +
						'</template>' +
					'</div>' +
					'<div v-if="$root.sequenceView" class="aspects-row" v-for="n in $root.aspectsSequence.length" :style="{ top: (n * 20) + \'px\', }">' +
						'<template v-for="p1 in $root.thePlanets" ' +
							'>' +
							'<template v-for="p2 in $root.thePlanets" ' +
								'>' +
								'<div class="aspect-column" ' + 
									'v-if="p1.order < p2.order" ' +
									':style="{ backgroundColor: $root.aspectsSequence[n - 1][p1.name][p2.name], }" ' +
									'>' +
								'</div>' +
							'</template>' +
						'</template>' +
					'</div>' +
					'<div v-if="$root.sequenceView" class="aspects-row aspect-planets">' +
						'<template v-for="p1 in $root.thePlanets" ' +
							'>' +
							'<template v-for="p2 in $root.thePlanets" ' +
								'>' +
								'<div class="aspect-column aspect-column-line" ' +
									'v-if="p1.order < p2.order" ' +
									'>' +
								'</div>' +
							'</template>' +
						'</template>' +
					'</div>' +
					'<div ' +
						'v-if="$root.sequenceView && (' +
							'($root.stepIncrement <= 100000000) ' +
							'|| ((new Date($root.dateTime + ($root.DAY * n))).getDate() == 1) ' +
							//'|| ($root.stepIncrement >= 10000000000 && (new Date($root.dateTime + ($root.DAY * n))).getDate() == 1 && (new Date($root.dateTime + ($root.DAY * n))).getMonth() == 0) ' +
							')" ' +
						'class="sequence-tick-line" ' +
						':class="{ ' +
							'month: $root.stepIncrement <= 100000000 && (new Date($root.dateTime + ($root.DAY * n))).getDate() == 1, ' +
						'}" ' +
						'v-for="n in Math.floor($root.stepIncrement / 2500000)" ' +
						':style="{ top: (20 * ($root.DAY / $root.stepIncrement) * n) - (($root.midnightOverage($root.dateTime) / $root.DAY) * (20 * $root.DAY / $root.stepIncrement)) + \'px\', }" ' +
						'>' +
						'<div class="sequence-tick-line-label">{{ $root.humanReadableDateTime($root.dateTime + ($root.DAY * n), true) }}</div>' +
						'<div class="sequence-tick-line-label" style="transform: translate(950px, -50%);">{{ $root.humanReadableDateTime($root.dateTime + ($root.DAY * n), true) }}</div>' +
					'</div>' +
					'<a-planet ' +
						'v-if="!$root.sequenceView" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':key="planet.order" ' +
						':planet="planet" ' +
						':timeOffset="0" ' +
						':opacity="1" ' +
						':showName=true ' +
						'style="cursor: pointer;" ' +
						'>' +
					'</a-planet>' +
					'<a-planet ' +
						'v-if="!$root.sequenceView && $root.referenceMoment && $root.showTransits" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':key="planet.order + \'-ref\'" ' +
						':planet="planet" ' +
						':timeOffset="$root.referenceMoment - $root.dateTime" ' +
						':reference=true ' +
						':opacity=".2" ' +
						':showName=true ' +
						'style="cursor: pointer;" ' +
						'>' +
					'</a-planet>' +
					/*'<a-planet ' +
						'v-if="!$root.sequenceView" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':key="planet.order" ' +
						':planet="planet" ' +
						':timeOffset="-$root.stepIncrement" ' +
						':opacity=".5" ' +
						':showName=false ' +
						'>' +
					'</a-planet>' +
					'<a-planet ' +
						'v-if="!$root.sequenceView" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':key="planet.order" ' +
						':planet="planet" ' +
						':timeOffset="-$root.stepIncrement * 2" ' +
						':opacity=".25" ' +
						':showName=false ' +
						'>' +
					'</a-planet>' +
					'<a-planet ' +
						'v-if="!$root.sequenceView" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':key="planet.order" ' +
						':planet="planet" ' +
						':timeOffset="-$root.stepIncrement * 3" ' +
						':opacity=".125" ' +
						':showName=false ' +
						'>' +
					'</a-planet>' +*/
					/*'<a-planet ' +
						'v-if="!$root.sequenceView" ' +
						':planet="{ name: \'NN\', symbol: String.fromCodePoint(0x260A), color: \'black\', order: 4, size: 5, }" ' +
						'>' +
					'</a-planet>' +
					'<a-planet ' +
						'v-if="!$root.sequenceView" ' +
						':planet="{ name: \'SN\', symbol: String.fromCodePoint(0x260B), color: \'black\', order: 4, size: 5, }" ' +
						'>' +
					'</a-planet>' +*/
					'<div v-if="$root.showLasers && !$root.sequenceView" class="planet-laser" ' +
						'v-for="(planet, i) in $root.thePlanets" ' +
						':key="planet.order" ' +
						':style="{ transform: \'rotate(\' + (180 + $root.planetAngle(planet.name, $root.dateTime) + $root.additionalRotation) + \'deg)\', }" ' +
						'>' +
					'</div>' +
					/*'<div class="planet-circle minor" ' +
						'v-for="(planet, i) in $root.theMinorPlanets" ' +
						':style="{ ' +
							'height: (80 + 100 + 32 * planet.order) + \'px\', ' +
							'width: (80 + 100 + 32 * planet.order) + \'px\', ' +
							'}" ' +
						'>' +
						'>' +
					'</div>' +
					'<a-planet ' +
						'v-for="(planet, i) in $root.theMinorPlanets" ' +
						':key="planet.order" ' +
						':planet="planet" ' +
						':type="\'minor\'" ' +
						'>' +
					'</a-planet>' +*/
					'<div v-for="(p1, p1name) in $root.aspects" :key="p1name" :id="p1name + \'-aspects\'">' +
						'<div ' +
							'v-for="(p2, p2name) in p1" ' +
							'v-if="(!$root.selectedPlanets || ($root.selectedPlanets[p1name] && $root.selectedPlanets[p2name]))" ' +
								//'&& p1name != \'Moon\' && p2name != \'Moon\'" ' +
							':key="p1name + \'-\' + p2name" ' +
							':id="p1name + \'-\' + p2name + \'-aspect\'" ' +
						'>' +
							'<div ' +
								'v-if="$root.showAspects && !$root.sequenceView" ' +
								'class="planet-laser" ' +
								':class="[ p2.aspect ]" ' +
								':style="{ ' +
									'transform: \'rotate(\' + (180 + $root.planetAngle(p1name, $root.dateTime) + $root.additionalRotation) + \'deg)\', ' +
									'height: ($root.toEcliptic ? 300 : $root.tinyView ? 50 : ((100 + 32 * $root.thePlanets.filter(function(planet) { return planet.name == p1name })[0].order) / 2)) + \'px\', ' +
									'opacity: p2.strength, ' +
								'}" ' +
								'>' +
							'</div>' +
							'<div ' +
								'v-if="$root.showAspects && !$root.sequenceView && p2.p1order > p2.p2order" ' +
								'class="planet-laser" ' +
								':style="{ ' +
									'transform: \'rotate(\' + (180 + $root.planetAngle(p1name, $root.dateTime) + $root.additionalRotation) + \'deg)\', ' +
									'height: ($root.toEcliptic ? 300 : $root.tinyView ? 50 : ((100 + 32 * $root.thePlanets.filter(function(planet) { return planet.name == p1name })[0].order) / 2)) + \'px\', ' +
									'opacity: p2.strength, ' +
								'}" ' +
								'>' +
								/*'<div style="position: absolute; top: 50px;" ' +
									':style="{ ' +
										'transform: \'translateY(\' + Math.round(p2.p2order * p2.p1order) + \'px) rotate(180deg)\', ' +
										'color: p2.color, ' +
									'}" ' +
									'>{{ p1name }}&nbsp;+ {{ p2name }}</div>' +*/
							'</div>' +
							'<div ' +
								'v-if="$root.showAspects && !$root.sequenceView && p2.aspect != \'Conjunct\' && p2.aspect != \'Opposition\'" ' +
								'class="planet-laser" ' +
								':style="{ ' +
									'transform: \'rotate(\' + (180 + $root.planetAngle(p1name, $root.dateTime) + $root.additionalRotation) + \'deg)\', ' +
									'height: (20) + \'px\', ' +
									'borderLeft: \'unset\', ' +
									'opacity: p2.strength, ' +
								'}" ' +
								'>' +
								'<div ' +
									'v-if="(p2.p1angle - p2.p2angle < 180 && p2.p1angle - p2.p2angle) > 0 || p2.p1angle - p2.p2angle < -180" ' +
									'class="planet-laser" ' +
									':class="[ p2.aspect ]" ' +
									':style="{ ' +
										'transform: ' +
											'\'translateY(-2px) rotate(\' + (p2.aspect == \'Square\' ? 90 : ( p2.aspect == \'Trine\' ? (30) : 60)) + \'deg)\' ' +
											//' + \'scaleY(\' + (p2.p1angle - p2.p2angle > 180 ? -1 : 1) + \')\'' +
											', ' +
										'transformOrigin: \'bottom left\', ' +
										'height: 20 + \'px\', ' +
									'}" ' +
									'>' +
									'<div ' +
										'v-if="p2.aspect == \'Square\' || p2.aspect == \'Trine\'" ' +
										'class="planet-laser" ' +
										':class="[ p2.aspect ]" ' +
										':style="{ ' +
											'transform: \'rotate(\' + (p2.aspect == \'Square\' ? 90 : 180) + \'deg)\', ' +
											'transformOrigin: \'top left\', ' +
											'height: (p2.aspect == \'Square\' ? 20 : 15) + \'px\', ' +
										'}" ' +
										'>' +
									'</div>' +
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>' +
					/*'<a-line ' +
						'v-for="line in $root.theLines" ' +
						':line="line" ' +
						':key="\'F\' + line.fromID + \'T\' + line.toID" ' +
						':id="\'F\' + line.fromID + \'T\' + line.toID" ' +
						'v-if="$root.showLines" ' +
						'>' +
					'</a-line>' +*/
	'<div v-show="$root.showLines">' +
'<div class="a-line" id="FHamalTBharani" style="transform: translate(-50%, -50%) rotate(8.20667deg); height: 666.753px;"><div class="the-visible-line" style="height: 62.2786px; transform: rotate(85.5189deg);"></div></div>' +
'<div class="a-line" id="FSheratanTHamal" style="transform: translate(-50%, -50%) rotate(11.34deg); height: 657.464px;"><div class="the-visible-line" style="height: 18.6876px; transform: rotate(102.816deg);"></div></div>' +
'<div class="a-line" id="FMesarthimTSheratan" style="transform: translate(-50%, -50%) rotate(11.6175deg); height: 648.976px;"><div class="the-visible-line" style="height: 4.52889px; transform: rotate(159.42deg);"></div></div>' +
'<div class="a-line" id="FChamukuyTAldebaran" style="transform: translate(-50%, -50%) rotate(-27.1656deg); height: 565.78px;"><div class="the-visible-line" style="height: 9.04081px; transform: rotate(96.0004deg);"></div></div>' +
'<div class="a-line" id="FPrima HyadumTChamukuy" style="transform: translate(-50%, -50%) rotate(-24.9483deg); height: 566.522px;"><div class="the-visible-line" style="height: 10.9599px; transform: rotate(86.9638deg);"></div></div>' +
'<div class="a-line" id="FPrima HyadumTSecunda Hyadum" style="transform: translate(-50%, -50%) rotate(-24.9483deg); height: 566.522px;"><div class="the-visible-line" style="height: 6.62684px; transform: rotate(143.349deg);"></div></div>' +
'<div class="a-line" id="F292140TPrima Hyadum" style="transform: translate(-50%, -50%) rotate(-20.1701deg); height: 553.088px;"><div class="the-visible-line" style="height: 24.2806px; transform: rotate(103.645deg);"></div></div>' +
'<div class="a-line" id="FSecunda HyadumTAin" style="transform: translate(-50%, -50%) rotate(-25.7337deg); height: 577.209px;"><div class="the-visible-line" style="height: 8.35076px; transform: rotate(119.632deg);"></div></div>' +
'<div class="a-line" id="F341266TElnath" style="transform: translate(-50%, -50%) rotate(-30.5613deg); height: 605.301px;"><div class="the-visible-line" style="height: 60.9426px; transform: rotate(97.4424deg);"></div></div>' +
'<div class="a-line" id="FAinT341266" style="transform: translate(-50%, -50%) rotate(-27.1542deg); height: 585.648px;"><div class="the-visible-line" style="height: 20.2468px; transform: rotate(117.332deg);"></div></div>' +
'<div class="a-line" id="FAldebaranTTianguan" style="transform: translate(-50%, -50%) rotate(-28.98deg); height: 567.955px;"><div class="the-visible-line" style="height: 78.1146px; transform: rotate(89.2612deg);"></div></div>' +
'<div class="a-line" id="F254098T292140" style="transform: translate(-50%, -50%) rotate(-11.7923deg); height: 548.013px;"><div class="the-visible-line" style="height: 40.2943px; transform: rotate(89.412deg);"></div></div>' +
'<div class="a-line" id="F251435T254098" style="transform: translate(-50%, -50%) rotate(-11.2033deg); height: 544.689px;"><div class="the-visible-line" style="height: 3.26331px; transform: rotate(120.333deg);"></div></div>' +
'<div class="a-line" id="FMekbudaTWasat" style="transform: translate(-50%, -50%) rotate(-66.0272deg); height: 588.534px;"><div class="the-visible-line" style="height: 21.5427px; transform: rotate(103.504deg);"></div></div>' +
'<div class="a-line" id="FAlhenaTMekbuda" style="transform: translate(-50%, -50%) rotate(-59.4279deg); height: 559.924px;"><div class="the-visible-line" style="height: 36.0048px; transform: rotate(110.071deg);"></div></div>' +
'<div class="a-line" id="F685540TWasat" style="transform: translate(-50%, -50%) rotate(-69.5232deg); height: 566.983px;"><div class="the-visible-line" style="height: 16.738px; transform: rotate(170.865deg);"></div></div>' +
'<div class="a-line" id="FAlzirrT685540" style="transform: translate(-50%, -50%) rotate(-61.3224deg); height: 539.743px;"><div class="the-visible-line" style="height: 41.8347px; transform: rotate(104.847deg);"></div></div>' +
'<div class="a-line" id="FWasatT739235" style="transform: translate(-50%, -50%) rotate(-70.0307deg); height: 600.058px;"><div class="the-visible-line" style="height: 26.936px; transform: rotate(125.942deg);"></div></div>' +
'<div class="a-line" id="F739235TPollux" style="transform: translate(-50%, -50%) rotate(-73.9806deg); height: 633.181px;"><div class="the-visible-line" style="height: 13.8703px; transform: rotate(108.271deg);"></div></div>' +
'<div class="a-line" id="F708959TCastor" style="transform: translate(-50%, -50%) rotate(-71.4316deg); height: 636.173px;"><div class="the-visible-line" style="height: 18.3136px; transform: rotate(135.536deg);"></div></div>' +
'<div class="a-line" id="F739235T764688" style="transform: translate(-50%, -50%) rotate(-73.9806deg); height: 633.181px;"><div class="the-visible-line" style="height: 13.2887px; transform: rotate(60.2413deg);"></div></div>' +
'<div class="a-line" id="F708959T739235" style="transform: translate(-50%, -50%) rotate(-71.4316deg); height: 636.173px;"><div class="the-visible-line" style="height: 14.1952px; transform: rotate(82.6865deg);"></div></div>' +
'<div class="a-line" id="F663843T708959" style="transform: translate(-50%, -50%) rotate(-67.7849deg); height: 647.843px;"><div class="the-visible-line" style="height: 21.2445px; transform: rotate(72.2363deg);"></div></div>' +
'<div class="a-line" id="FMebsutaT708959" style="transform: translate(-50%, -50%) rotate(-60.983deg); height: 612.995px;"><div class="the-visible-line" style="height: 58.0297px; transform: rotate(96.2456deg);"></div></div>' +
'<div class="a-line" id="F543342TMebsuta" style="transform: translate(-50%, -50%) rotate(-57.2408deg); height: 582.016px;"><div class="the-visible-line" style="height: 24.9042px; transform: rotate(126.558deg);"></div></div>' +
'<div class="a-line" id="FTejatTMebsuta" style="transform: translate(-50%, -50%) rotate(-55.7401deg); height: 595.404px;"><div class="the-visible-line" style="height: 28.9968px; transform: rotate(105.013deg);"></div></div>' +
'<div class="a-line" id="FPropusTTejat" style="transform: translate(-50%, -50%) rotate(-53.7194deg); height: 594.948px;"><div class="the-visible-line" style="height: 10.4971px; transform: rotate(90.2519deg);"></div></div>' +
'<div class="a-line" id="F483362TPropus" style="transform: translate(-50%, -50%) rotate(-51.0301deg); height: 599.206px;"><div class="the-visible-line" style="height: 14.1724px; transform: rotate(80.0089deg);"></div></div>' +
'<div class="a-line" id="FAsellus AustralisTAcubens" style="transform: translate(-50%, -50%) rotate(-91.1713deg); height: 603.403px;"><div class="the-visible-line" style="height: 23.8476px; transform: rotate(46.1393deg);"></div></div>' +
'<div class="a-line" id="FAsellus BorealisTAsellus Australis" style="transform: translate(-50%, -50%) rotate(-90.8214deg); height: 622.724px;"><div class="the-visible-line" style="height: 9.83591px; transform: rotate(10.7935deg);"></div></div>' +
'<div class="a-line" id="FAsellus BorealisT917770" style="transform: translate(-50%, -50%) rotate(-90.8214deg); height: 622.724px;"><div class="the-visible-line" style="height: 23.0734px; transform: rotate(167.561deg);"></div></div>' +
'<div class="a-line" id="FTarfTAsellus Australis" style="transform: translate(-50%, -50%) rotate(-84.1288deg); height: 539.024px;"><div class="the-visible-line" style="height: 47.5741px; transform: rotate(128.966deg);"></div></div>' +
'<div class="a-line" id="FAlgiebaTZosma" style="transform: translate(-50%, -50%) rotate(-114.992deg); height: 659.962px;"><div class="the-visible-line" style="height: 81.7934px; transform: rotate(95.7041deg);"></div></div>' +
'<div class="a-line" id="FZosmaTDenebola" style="transform: translate(-50%, -50%) rotate(-128.527deg); height: 695.526px;"><div class="the-visible-line" style="height: 52.9338px; transform: rotate(77.8017deg);"></div></div>' +
'<div class="a-line" id="FChertanTDenebola" style="transform: translate(-50%, -50%) rotate(-128.56deg); height: 665.041px;"><div class="the-visible-line" style="height: 51.707px; transform: rotate(94.5355deg);"></div></div>' +
'<div class="a-line" id="FRegulusTChertan" style="transform: translate(-50%, -50%) rotate(-112.094deg); height: 606.344px;"><div class="the-visible-line" style="height: 95.5543px; transform: rotate(99.4642deg);"></div></div>' +
'<div class="a-line" id="FRegulusT1061687" style="transform: translate(-50%, -50%) rotate(-112.094deg); height: 606.344px;"><div class="the-visible-line" style="height: 14.1765px; transform: rotate(174.161deg);"></div></div>' +
'<div class="a-line" id="F1061687TAlgieba" style="transform: translate(-50%, -50%) rotate(-111.833deg); height: 634.553px;"><div class="the-visible-line" style="height: 21.8976px; transform: rotate(123.854deg);"></div></div>' +
'<div class="a-line" id="FAdhaferaTAlgieba" style="transform: translate(-50%, -50%) rotate(-114.173deg); height: 679.598px;"><div class="the-visible-line" style="height: 10.9252px; transform: rotate(25.6024deg);"></div></div>' +
'<div class="a-line" id="FRasalasTAdhafera" style="transform: translate(-50%, -50%) rotate(-108.191deg); height: 682.275px;"><div class="the-visible-line" style="height: 35.5532px; transform: rotate(84.8562deg);"></div></div>' +
'<div class="a-line" id="FRas Elased AustralisTRasalas" style="transform: translate(-50%, -50%) rotate(-106.463deg); height: 665.307px;"><div class="the-visible-line" style="height: 13.2345px; transform: rotate(128.985deg);"></div></div>' +
'<div class="a-line" id="F1460530T1483603" style="transform: translate(-50%, -50%) rotate(-181.562deg); height: 704.814px;"><div class="the-visible-line" style="height: 26.1066px; transform: rotate(97.337deg);"></div></div>' +
'<div class="a-line" id="FHezeT1397226" style="transform: translate(-50%, -50%) rotate(-163.673deg); height: 653.149px;"><div class="the-visible-line" style="height: 41.5338px; transform: rotate(105.956deg);"></div></div>' +
'<div class="a-line" id="F1397226T1460530" style="transform: translate(-50%, -50%) rotate(-170.412deg); height: 680.679px;"><div class="the-visible-line" style="height: 68.3659px; transform: rotate(94.5439deg);"></div></div>' +
'<div class="a-line" id="FKangT1456034" style="transform: translate(-50%, -50%) rotate(-173.224deg); height: 615.619px;"><div class="the-visible-line" style="height: 46.9237px; transform: rotate(113.043deg);"></div></div>' +
'<div class="a-line" id="FSpicaTKang" style="transform: translate(-50%, -50%) rotate(-161.298deg); height: 584.381px;"><div class="the-visible-line" style="height: 64.2356px; transform: rotate(98.032deg);"></div></div>' +
'<div class="a-line" id="FSpicaTHeze" style="transform: translate(-50%, -50%) rotate(-161.298deg); height: 584.381px;"><div class="the-visible-line" style="height: 36.6878px; transform: rotate(158.355deg);"></div></div>' +
'<div class="a-line" id="F1325111TSpica" style="transform: translate(-50%, -50%) rotate(-157.487deg); height: 609.309px;"><div class="the-visible-line" style="height: 23.43px; transform: rotate(55.9803deg);"></div></div>' +
'<div class="a-line" id="FPorrimaT1325111" style="transform: translate(-50%, -50%) rotate(-150.415deg); height: 617.037px;"><div class="the-visible-line" style="height: 38.0147px; transform: rotate(80.6434deg);"></div></div>' +
'<div class="a-line" id="FMinelauvaTHeze" style="transform: translate(-50%, -50%) rotate(-153.901deg); height: 654.468px;"><div class="the-visible-line" style="height: 55.6928px; transform: rotate(84.4347deg);"></div></div>' +
'<div class="a-line" id="FMinelauvaTVindemiatrix" style="transform: translate(-50%, -50%) rotate(-153.901deg); height: 654.468px;"><div class="the-visible-line" style="height: 26.4841px; transform: rotate(157.605deg);"></div></div>' +
'<div class="a-line" id="FPorrimaTMinelauva" style="transform: translate(-50%, -50%) rotate(-150.415deg); height: 617.037px;"><div class="the-visible-line" style="height: 26.9058px; transform: rotate(132.316deg);"></div></div>' +
'<div class="a-line" id="FZaniahTPorrima" style="transform: translate(-50%, -50%) rotate(-144.976deg); height: 608.524px;"><div class="the-visible-line" style="height: 29.3813px; transform: rotate(95.6005deg);"></div></div>' +
'<div class="a-line" id="FZavijavaTZaniah" style="transform: translate(-50%, -50%) rotate(-137.674deg); height: 605.223px;"><div class="the-visible-line" style="height: 38.6828px; transform: rotate(88.7883deg);"></div></div>' +
'<div class="a-line" id="FZubenelgenubiTZubeneschamali" style="transform: translate(-50%, -50%) rotate(-182.72deg); height: 599.305px;"><div class="the-visible-line" style="height: 30.0051px; transform: rotate(146.786deg);"></div></div>' +
'<div class="a-line" id="FZubenelgenubiTBrachium" style="transform: translate(-50%, -50%) rotate(-182.72deg); height: 599.305px;"><div class="the-visible-line" style="height: 29.8271px; transform: rotate(32.0078deg);"></div></div>' +
'<div class="a-line" id="FBrachiumTZubeneschamali" style="transform: translate(-50%, -50%) rotate(-186.018deg); height: 549.628px;"><div class="the-visible-line" style="height: 50.3996px; transform: rotate(177.414deg);"></div></div>' +
'<div class="a-line" id="FZubeneschamaliTZubenelhakrabi" style="transform: translate(-50%, -50%) rotate(-189.252deg); height: 650.348px;"><div class="the-visible-line" style="height: 28.7144px; transform: rotate(61.4443deg);"></div></div>' +
'<div class="a-line" id="FZubenelhakrabiT1561678" style="transform: translate(-50%, -50%) rotate(-193.882deg); height: 624.936px;"><div class="the-visible-line" style="height: 24.981px; transform: rotate(81.4984deg);"></div></div>' +
'<div class="a-line" id="FBrachiumT1534623" style="transform: translate(-50%, -50%) rotate(-186.018deg); height: 549.628px;"><div class="the-visible-line" style="height: 25.9012px; transform: rotate(82.6107deg);"></div></div>' +
'<div class="a-line" id="FDschubbaTAcrab" style="transform: translate(-50%, -50%) rotate(-200.083deg); height: 586.186px;"><div class="the-visible-line" style="height: 11.3494px; transform: rotate(143.621deg);"></div></div>' +
'<div class="a-line" id="FAcrabTJabbah" style="transform: translate(-50%, -50%) rotate(-201.359deg); height: 604.605px;"><div class="the-visible-line" style="height: 8.899px; transform: rotate(101.96deg);"></div></div>' +
'<div class="a-line" id="FDschubbaTFang" style="transform: translate(-50%, -50%) rotate(-200.083deg); height: 586.186px;"><div class="the-visible-line" style="height: 10.8604px; transform: rotate(9.67629deg);"></div></div>' +
'<div class="a-line" id="FFangTIklil" style="transform: translate(-50%, -50%) rotate(-199.713deg); height: 564.779px;"><div class="the-visible-line" style="height: 9.89723px; transform: rotate(13.685deg);"></div></div>' +
'<div class="a-line" id="FDschubbaTAlniyat" style="transform: translate(-50%, -50%) rotate(-200.083deg); height: 586.186px;"><div class="the-visible-line" style="height: 27.0604px; transform: rotate(74.5961deg);"></div></div>' +
'<div class="a-line" id="FAlniyatTAntares" style="transform: translate(-50%, -50%) rotate(-205.297deg); height: 574.187px;"><div class="the-visible-line" style="height: 10.3789px; transform: rotate(80.5943deg);"></div></div>' +
'<div class="a-line" id="FAntaresTPaikauhale" style="transform: translate(-50%, -50%) rotate(-207.352deg); height: 571.16px;"><div class="the-visible-line" style="height: 9.23942px; transform: rotate(59.2011deg);"></div></div>' +
'<div class="a-line" id="FPaikauhaleTLarawag" style="transform: translate(-50%, -50%) rotate(-208.971deg); height: 561.92px;"><div class="the-visible-line" style="height: 23.8813px; transform: rotate(43.5357deg);"></div></div>' +
'<div class="a-line" id="FLarawagTXamidimura" style="transform: translate(-50%, -50%) rotate(-212.541deg); height: 528.314px;"><div class="the-visible-line" style="height: 11.2781px; transform: rotate(9.62006deg);"></div></div>' +
'<div class="a-line" id="FXamidimuraT1662549" style="transform: translate(-50%, -50%) rotate(-212.968deg); height: 506.096px;"><div class="the-visible-line" style="height: 13.0373px; transform: rotate(12.604deg);"></div></div>' +
'<div class="a-line" id="F1662549T1694599" style="transform: translate(-50%, -50%) rotate(-213.646deg); height: 480.685px;"><div class="the-visible-line" style="height: 18.4175px; transform: rotate(83.6618deg);"></div></div>' +
'<div class="a-line" id="F1694599TSargas" style="transform: translate(-50%, -50%) rotate(-218.038deg); height: 478.016px;"><div class="the-visible-line" style="height: 26.4004px; transform: rotate(90.9209deg);"></div></div>' +
'<div class="a-line" id="FLesathTShaula" style="transform: translate(-50%, -50%) rotate(-222.691deg); height: 515.546px;"><div class="the-visible-line" style="height: 3.27552px; transform: rotate(101.648deg);"></div></div>' +
'<div class="a-line" id="FSargasT1765472" style="transform: translate(-50%, -50%) rotate(-224.33deg); height: 481.774px;"><div class="the-visible-line" style="height: 14.1028px; transform: rotate(127.541deg);"></div></div>' +
'<div class="a-line" id="F1754884T1765472" style="transform: translate(-50%, -50%) rotate(-225.622deg); height: 505.848px;"><div class="the-visible-line" style="height: 6.43701px; transform: rotate(59.6187deg);"></div></div>' +
'<div class="a-line" id="FShaulaT1754884" style="transform: translate(-50%, -50%) rotate(-223.402deg); height: 516.904px;"><div class="the-visible-line" style="height: 11.3445px; transform: rotate(59.7153deg);"></div></div>' +
'<div class="a-line" id="FYed PriorTYed Posterior" style="transform: translate(-50%, -50%) rotate(-203.586deg); height: 703.78px;"><div class="the-visible-line" style="height: 6.56485px; transform: rotate(67.4143deg);"></div></div>' +
'<div class="a-line" id="FYed PosteriorT1633277" style="transform: translate(-50%, -50%) rotate(-204.58deg); height: 698.849px;"><div class="the-visible-line" style="height: 32.0078px; transform: rotate(58.9634deg);"></div></div>' +
'<div class="a-line" id="F1633277TSabik" style="transform: translate(-50%, -50%) rotate(-209.29deg); height: 668.09px;"><div class="the-visible-line" style="height: 49.1001px; transform: rotate(71.0105deg);"></div></div>' +
'<div class="a-line" id="FSabikTCebalrai" style="transform: translate(-50%, -50%) rotate(-217.595deg); height: 642.876px;"><div class="the-visible-line" style="height: 80.2997px; transform: rotate(136.555deg);"></div></div>' +
'<div class="a-line" id="FRasalhagueTCebalrai" style="transform: translate(-50%, -50%) rotate(-223.733deg); height: 814.978px;"><div class="the-visible-line" style="height: 27.9536px; transform: rotate(30.7539deg);"></div></div>' +
'<div class="a-line" id="F1668004TRasalhague" style="transform: translate(-50%, -50%) rotate(-214.417deg); height: 791.617px;"><div class="the-visible-line" style="height: 66.2665px; transform: rotate(95.4609deg);"></div></div>' +
'<div class="a-line" id="FYed PriorT1668004" style="transform: translate(-50%, -50%) rotate(-203.586deg); height: 703.78px;"><div class="the-visible-line" style="height: 83.0113px; transform: rotate(116.368deg);"></div></div>' +
'<div class="a-line" id="FSabikT1712828" style="transform: translate(-50%, -50%) rotate(-217.595deg); height: 642.876px;"><div class="the-visible-line" style="height: 31.3272px; transform: rotate(28.4597deg);"></div></div>' +
'<div class="a-line" id="F1712828T1723545" style="transform: translate(-50%, -50%) rotate(-220.502deg); height: 588.558px;"><div class="the-visible-line" style="height: 15.8399px; transform: rotate(24.3368deg);"></div></div>' +
'<div class="a-line" id="F1623087T1633277" style="transform: translate(-50%, -50%) rotate(-207.785deg); height: 630.477px;"><div class="the-visible-line" style="height: 20.6474px; transform: rotate(154.857deg);"></div></div>' +
'<div class="a-line" id="F1615993T1623087" style="transform: translate(-50%, -50%) rotate(-206.756deg); height: 618.449px;"><div class="the-visible-line" style="height: 8.22541px; transform: rotate(136.514deg);"></div></div>' +
'<div class="a-line" id="F1610915T1615993" style="transform: translate(-50%, -50%) rotate(-206.026deg); height: 608.251px;"><div class="the-visible-line" style="height: 6.42039px; transform: rotate(142.135deg);"></div></div>' +
'<div class="a-line" id="F1610915T1613517" style="transform: translate(-50%, -50%) rotate(-206.026deg); height: 608.251px;"><div class="the-visible-line" style="height: 10.2345px; transform: rotate(10.7128deg);"></div></div>' +
'<div class="a-line" id="FPolisTKaus Borealis" style="transform: translate(-50%, -50%) rotate(-233.441deg); height: 613.762px;"><div class="the-visible-line" style="height: 22.9805px; transform: rotate(52.2675deg);"></div></div>' +
'<div class="a-line" id="FAlnaslTKaus Media" style="transform: translate(-50%, -50%) rotate(-231.452deg); height: 557.796px;"><div class="the-visible-line" style="height: 18.5867px; transform: rotate(92.728deg);"></div></div>' +
'<div class="a-line" id="F1765413TAlnasl" style="transform: translate(-50%, -50%) rotate(-226.89deg); height: 573.235px;"><div class="the-visible-line" style="height: 23.7918px; transform: rotate(68.8037deg);"></div></div>' +
'<div class="a-line" id="FKaus MediaTKaus Borealis" style="transform: translate(-50%, -50%) rotate(-235.249deg); height: 560.795px;"><div class="the-visible-line" style="height: 15.644px; transform: rotate(145.195deg);"></div></div>' +
'<div class="a-line" id="FKaus MediaTKaus Australis" style="transform: translate(-50%, -50%) rotate(-235.249deg); height: 560.795px;"><div class="the-visible-line" style="height: 14.2813px; transform: rotate(15.0053deg);"></div></div>' +
'<div class="a-line" id="F1842810TKaus Australis" style="transform: translate(-50%, -50%) rotate(-234.407deg); height: 519.374px;"><div class="the-visible-line" style="height: 10.2315px; transform: rotate(131.916deg);"></div></div>' +
'<div class="a-line" id="FKaus BorealisT1914343" style="transform: translate(-50%, -50%) rotate(-236.993deg); height: 586.761px;"><div class="the-visible-line" style="height: 23.1043px; transform: rotate(73.7889deg);"></div></div>' +
'<div class="a-line" id="F1914343TNunki" style="transform: translate(-50%, -50%) rotate(-241.414deg); height: 575.573px;"><div class="the-visible-line" style="height: 12.1791px; transform: rotate(95.5464deg);"></div></div>' +
'<div class="a-line" id="FNunkiT1969933" style="transform: translate(-50%, -50%) rotate(-243.816deg); height: 578.43px;"><div class="the-visible-line" style="height: 15.4582px; transform: rotate(69.3813deg);"></div></div>' +
'<div class="a-line" id="F1914343TAscella" style="transform: translate(-50%, -50%) rotate(-241.414deg); height: 575.573px;"><div class="the-visible-line" style="height: 23.1411px; transform: rotate(62.5704deg);"></div></div>' +
'<div class="a-line" id="FAscellaT1969933" style="transform: translate(-50%, -50%) rotate(-245.653deg); height: 555.767px;"><div class="the-visible-line" style="height: 8.20367px; transform: rotate(139.152deg);"></div></div>' +
'<div class="a-line" id="FNunkiT1964061" style="transform: translate(-50%, -50%) rotate(-243.816deg); height: 578.43px;"><div class="the-visible-line" style="height: 17.7228px; transform: rotate(135.548deg);"></div></div>' +
'<div class="a-line" id="F1964061TAlbaldah" style="transform: translate(-50%, -50%) rotate(-246.171deg); height: 604.246px;"><div class="the-visible-line" style="height: 6.92823px; transform: rotate(103.568deg);"></div></div>' +
'<div class="a-line" id="F1946081T1964061" style="transform: translate(-50%, -50%) rotate(-244.433deg); height: 609.195px;"><div class="the-visible-line" style="height: 9.52986px; transform: rotate(74.08deg);"></div></div>' +
'<div class="a-line" id="FAlbaldahT2008520" style="transform: translate(-50%, -50%) rotate(-247.441deg); height: 607.641px;"><div class="the-visible-line" style="height: 18.0393px; transform: rotate(116.007deg);"></div></div>' +
'<div class="a-line" id="F2008520T2008656" style="transform: translate(-50%, -50%) rotate(-250.418deg); height: 624.304px;"><div class="the-visible-line" style="height: 5.66922px; transform: rotate(179.237deg);"></div></div>' +
'<div class="a-line" id="F1969933T2048705" style="transform: translate(-50%, -50%) rotate(-246.735deg); height: 568.275px;"><div class="the-visible-line" style="height: 37.5637px; transform: rotate(94.1232deg);"></div></div>' +
'<div class="a-line" id="F2048705T2107312" style="transform: translate(-50%, -50%) rotate(-254.177deg); height: 578.556px;"><div class="the-visible-line" style="height: 26.9055px; transform: rotate(66.4307deg);"></div></div>' +
'<div class="a-line" id="F2107312T2123017" style="transform: translate(-50%, -50%) rotate(-259.237deg); height: 559.219px;"><div class="the-visible-line" style="height: 7.37264px; transform: rotate(69.4662deg);"></div></div>' +
'<div class="a-line" id="F2115042T2123017" style="transform: translate(-50%, -50%) rotate(-259.934deg); height: 509.731px;"><div class="the-visible-line" style="height: 22.5003px; transform: rotate(170.967deg);"></div></div>' +
'<div class="a-line" id="F2102592T2115042" style="transform: translate(-50%, -50%) rotate(-258.815deg); height: 471.534px;"><div class="the-visible-line" style="height: 19.6904px; transform: rotate(165.363deg);"></div></div>' +
'<div class="a-line" id="FRukbatT2102592" style="transform: translate(-50%, -50%) rotate(-250.972deg); height: 487.207px;"><div class="the-visible-line" style="height: 33.7065px; transform: rotate(72.6645deg);"></div></div>' +
'<div class="a-line" id="FArkab PriorT2102592" style="transform: translate(-50%, -50%) rotate(-250.66deg); height: 464.424px;"><div class="the-visible-line" style="height: 33.4673px; transform: rotate(92.0063deg);"></div></div>' +
'<div class="a-line" id="FAlgediTAlshat" style="transform: translate(-50%, -50%) rotate(-264.514deg); height: 640.094px;"><div class="the-visible-line" style="height: 3.8003px; transform: rotate(72.849deg);"></div></div>' +
'<div class="a-line" id="FAlgediTDabih" style="transform: translate(-50%, -50%) rotate(-264.514deg); height: 640.094px;"><div class="the-visible-line" style="height: 8.30401px; transform: rotate(29.0791deg);"></div></div>' +
'<div class="a-line" id="FNashiraTDeneb Algedi" style="transform: translate(-50%, -50%) rotate(-285.023deg); height: 580.01px;"><div class="the-visible-line" style="height: 8.79278px; transform: rotate(88.0723deg);"></div></div>' +
'<div class="a-line" id="F2274304TNashira" style="transform: translate(-50%, -50%) rotate(-276.487deg); height: 592.839px;"><div class="the-visible-line" style="height: 34.5642px; transform: rotate(75.9955deg);"></div></div>' +
'<div class="a-line" id="FAlshatT2274304" style="transform: translate(-50%, -50%) rotate(-265.166deg); height: 637.89px;"><div class="the-visible-line" style="height: 64.7016px; transform: rotate(64.0699deg);"></div></div>' +
'<div class="a-line" id="F2333785TDeneb Algedi" style="transform: translate(-50%, -50%) rotate(-284.27deg); height: 564.698px;"><div class="the-visible-line" style="height: 14.5153px; transform: rotate(119.829deg);"></div></div>' +
'<div class="a-line" id="F2314277T2333785" style="transform: translate(-50%, -50%) rotate(-281.667deg); height: 552.138px;"><div class="the-visible-line" style="height: 14.1516px; transform: rotate(115.013deg);"></div></div>' +
'<div class="a-line" id="F2276684T2314277" style="transform: translate(-50%, -50%) rotate(-276.782deg); height: 545.673px;"><div class="the-visible-line" style="height: 17.4485px; transform: rotate(98.8976deg);"></div></div>' +
'<div class="a-line" id="F2245042T2276684" style="transform: translate(-50%, -50%) rotate(-272.955deg); height: 540.84px;"><div class="the-visible-line" style="height: 18.2971px; transform: rotate(95.6591deg);"></div></div>' +
'<div class="a-line" id="F2231926T2245042" style="transform: translate(-50%, -50%) rotate(-271.524deg); height: 553.1px;"><div class="the-visible-line" style="height: 9.17989px; transform: rotate(47.383deg);"></div></div>' +
'<div class="a-line" id="FDabihT2231926" style="transform: translate(-50%, -50%) rotate(-265.253deg); height: 625.632px;"><div class="the-visible-line" style="height: 48.4795px; transform: rotate(38.544deg);"></div></div>' +
'<div class="a-line" id="FAlbaliT2246934" style="transform: translate(-50%, -50%) rotate(-271.919deg); height: 647.103px;"><div class="the-visible-line" style="height: 7.05069px; transform: rotate(93.4441deg);"></div></div>' +
'<div class="a-line" id="F2246934TSadalsuud" style="transform: translate(-50%, -50%) rotate(-273.163deg); height: 648.105px;"><div class="the-visible-line" style="height: 6.84626px; transform: rotate(100.726deg);"></div></div>' +
'<div class="a-line" id="FSadalsuudTSadalmelik" style="transform: translate(-50%, -50%) rotate(-282.89deg); height: 650.799px;"><div class="the-visible-line" style="height: 49.5475px; transform: rotate(93.7336deg);"></div></div>' +
'<div class="a-line" id="FSadalmelikTAncha" style="transform: translate(-50%, -50%) rotate(-291.446deg); height: 664.643px;"><div class="the-visible-line" style="height: 29.7127px; transform: rotate(29.8562deg);"></div></div>' +
'<div class="a-line" id="F2385967TAncha" style="transform: translate(-50%, -50%) rotate(-291.609deg); height: 582.991px;"><div class="the-visible-line" style="height: 20.5333px; transform: rotate(137.327deg);"></div></div>' +
'<div class="a-line" id="FSadalmelikTSadachbia" style="transform: translate(-50%, -50%) rotate(-291.446deg); height: 664.643px;"><div class="the-visible-line" style="height: 23.9714px; transform: rotate(69.6376deg);"></div></div>' +
'<div class="a-line" id="FSadachbiaT2423886" style="transform: translate(-50%, -50%) rotate(-295.414deg); height: 649.517px;"><div class="the-visible-line" style="height: 10.4103px; transform: rotate(100.634deg);"></div></div>' +
'<div class="a-line" id="F2418141T2423886" style="transform: translate(-50%, -50%) rotate(-296.319deg); height: 664.076px;"><div class="the-visible-line" style="height: 7.29031px; transform: rotate(44.0558deg);"></div></div>' +
'<div class="a-line" id="F2423886T2434398" style="transform: translate(-50%, -50%) rotate(-297.208deg); height: 653.685px;"><div class="the-visible-line" style="height: 9.51946px; transform: rotate(76.1324deg);"></div></div>' +
'<div class="a-line" id="F2434398T2461296" style="transform: translate(-50%, -50%) rotate(-298.839deg); height: 649.384px;"><div class="the-visible-line" style="height: 36.0212px; transform: rotate(38.3829deg);"></div></div>' +
'<div class="a-line" id="F2456709T2461296" style="transform: translate(-50%, -50%) rotate(-302.398deg); height: 560.289px;"><div class="the-visible-line" style="height: 17.5673px; transform: rotate(167.103deg);"></div></div>' +
'<div class="a-line" id="F2461296T2494515" style="transform: translate(-50%, -50%) rotate(-303.154deg); height: 594.594px;"><div class="the-visible-line" style="height: 31.7345px; transform: rotate(65.9572deg);"></div></div>' +
'<div class="a-line" id="F2456709TSkat" style="transform: translate(-50%, -50%) rotate(-302.398deg); height: 560.289px;"><div class="the-visible-line" style="height: 10.1954px; transform: rotate(36.0672deg);"></div></div>' +
'<div class="a-line" id="FSkatT2485733" style="transform: translate(-50%, -50%) rotate(-303.663deg); height: 543.949px;"><div class="the-visible-line" style="height: 26.5185px; transform: rotate(37.7284deg);"></div></div>' +
'<div class="a-line" id="F2485733T2503767" style="transform: translate(-50%, -50%) rotate(-307.362deg); height: 503.048px;"><div class="the-visible-line" style="height: 14.8392px; transform: rotate(85.0029deg);"></div></div>' +
'<div class="a-line" id="F2503767T2528990" style="transform: translate(-50%, -50%) rotate(-310.743deg); height: 501.332px;"><div class="the-visible-line" style="height: 24.4906px; transform: rotate(113.298deg);"></div></div>' +
'<div class="a-line" id="F2497203T2528990" style="transform: translate(-50%, -50%) rotate(-309.476deg); height: 569.903px;"><div class="the-visible-line" style="height: 37.8263px; transform: rotate(48.3024deg);"></div></div>' +
'<div class="a-line" id="F2494515T2497203" style="transform: translate(-50%, -50%) rotate(-308.973deg); height: 571.685px;"><div class="the-visible-line" style="height: 2.65795px; transform: rotate(70.2429deg);"></div></div>' +
'<div class="a-line" id="F2492335T2494515" style="transform: translate(-50%, -50%) rotate(-308.581deg); height: 590.862px;"><div class="the-visible-line" style="height: 9.79175px; transform: rotate(11.528deg);"></div></div>' +
'<div class="a-line" id="F93797TAlpherg" style="transform: translate(-50%, -50%) rotate(21.5627deg); height: 703.066px;"><div class="the-visible-line" style="height: 41.79px; transform: rotate(36.1282deg);"></div></div>' +
'<div class="a-line" id="F93797T100641" style="transform: translate(-50%, -50%) rotate(21.5627deg); height: 703.066px;"><div class="the-visible-line" style="height: 10.9096px; transform: rotate(125.08deg);"></div></div>' +
'<div class="a-line" id="F91300T100641" style="transform: translate(-50%, -50%) rotate(22.0849deg); height: 737.318px;"><div class="the-visible-line" style="height: 16.3854px; transform: rotate(48.0595deg);"></div></div>' +
'<div class="a-line" id="FAlphergTTorcular" style="transform: translate(-50%, -50%) rotate(17.1291deg); height: 637.468px;"><div class="the-visible-line" style="height: 29.176px; transform: rotate(38.0251deg);"></div></div>' +
'<div class="a-line" id="FTorcularT153727" style="transform: translate(-50%, -50%) rotate(13.6515deg); height: 592.589px;"><div class="the-visible-line" style="height: 31.4087px; transform: rotate(39.0609deg);"></div></div>' +
'<div class="a-line" id="F127385T153727" style="transform: translate(-50%, -50%) rotate(14.6421deg); height: 572.753px;"><div class="the-visible-line" style="height: 28.6415px; transform: rotate(58.7647deg);"></div></div>' +
'<div class="a-line" id="F80681T127385" style="transform: translate(-50%, -50%) rotate(24.2641deg); height: 609.235px;"><div class="the-visible-line" style="height: 52.7923px; transform: rotate(65.0536deg);"></div></div>' +
'<div class="a-line" id="F62727T80681" style="transform: translate(-50%, -50%) rotate(27.8294deg); height: 615.889px;"><div class="the-visible-line" style="height: 19.344px; transform: rotate(78.3058deg);"></div></div>' +
'<div class="a-line" id="F2525456T2551223" style="transform: translate(-50%, -50%) rotate(-314.988deg); height: 645.36px;"><div class="the-visible-line" style="height: 27.2471px; transform: rotate(82.9265deg);"></div></div>' +
'<div class="a-line" id="F2525456T2528171" style="transform: translate(-50%, -50%) rotate(-314.988deg); height: 645.36px;"><div class="the-visible-line" style="height: 12.5144px; transform: rotate(13.116deg);"></div></div>' +
'<div class="a-line" id="F2551223T62727" style="transform: translate(-50%, -50%) rotate(-319.828deg); height: 640.926px;"><div class="the-visible-line" style="height: 68.6921px; transform: rotate(73.3897deg);"></div></div>' +
'<div class="a-line" id="F2496250T2510181" style="transform: translate(-50%, -50%) rotate(-309.291deg); height: 645.137px;"><div class="the-visible-line" style="height: 16.4845px; transform: rotate(110.081deg);"></div></div>' +
'<div class="a-line" id="F2510181T2525456" style="transform: translate(-50%, -50%) rotate(-311.992deg); height: 657.178px;"><div class="the-visible-line" style="height: 18.02px; transform: rotate(69.355deg);"></div></div>' +
'<div class="a-line" id="F2508805T2528171" style="transform: translate(-50%, -50%) rotate(-311.733deg); height: 627.067px;"><div class="the-visible-line" style="height: 20.795px; transform: rotate(79.7336deg);"></div></div>' +
'<div class="a-line" id="F2496250T2508805" style="transform: translate(-50%, -50%) rotate(-309.291deg); height: 645.137px;"><div class="the-visible-line" style="height: 16.2853px; transform: rotate(55.1071deg);"></div></div>' +
'<div class="a-line" id="FFumalsamakahT2496250" style="transform: translate(-50%, -50%) rotate(-305.969deg); height: 656.329px;"><div class="the-visible-line" style="height: 19.6759px; transform: rotate(71.8104deg);"></div></div>' +
	'</div>' +				
					'<a-star ' +
						'v-if="!$root.sequenceView && !$root.videoView" ' +
						'v-for="(star, i) in $root.theStarsFiltered" ' +
						':key="star.id" ' +
						':id="star.id" ' +
						':star="star" ' +
						'>' +
					'</a-star>' +
					'<div class="shader-container sunrise" ' +
						//'v-if="!$root.sequenceView && ($root.showAngles || $root.showShader)" ' + 
						//'v-if="false" ' +
						':style="{ ' +				
							'transform: \'' +
								'translate(0%, -50%) ' +
								'rotate(\' + ($root.sunAngle() - (360 * $root.dayPercent())) + \'deg)' +
							'\', ' +
							'zIndex: !$root.showShader ? -1 : null, ' +
							'borderLeft: $root.showAngles ? \'1px solid #666\' : null, ' +
						'} "' +
						'>' +
						'<div class="shader-caption" v-if="$root.showAngles" style="left: 0; top: 0px;"><div style="' +
							'position: absolute; right: 0px; top: 44.6%;' +
							'transform: rotate(90deg); transform-origin: top right; ' +
							'">Midheaven</div></div>' +
						'<div class="shader-caption" v-if="$root.showAngles" style="left: 0; top: 0px;"><div style="' +
							'position: absolute; right: 0px; top: 56.4%;' +
							'transform: rotate(90deg); transform-origin: top right; ' +
							'">Imum&nbsp;Coeli</div></div>' +
						'<div class="visible-ecliptic-shader" v-if="$root.showShader" ' +
							':style="{ ' +				
								'transform: \'' +
									'translate(-50%, -50%) ' +
									'rotate(\' + (-$root.shaderSeasonRotation()) + \'deg)' +
								'\', ' +
								'borderBottom: $root.showAngles ? \'1px solid #666\' : null, ' +
							'} "' +
							'>' +
							'<div class="shader-caption" v-if="$root.showAngles">Ascending / Rising</div>' +
						'</div>' +
					'</div>' +
					'<div class="shader-container sunset" ' +
						//'v-if="!$root.sequenceView && ($root.showAngles || $root.showShader)" ' + 
						//'v-if="false" ' +
						':style="{ ' +				
							'transform: \'' +
								'translate(0%, -50%) ' +
								'rotate(\' + ($root.sunAngle() - (360 * $root.dayPercent())) + \'deg) ' +
								'scaleX(-1) ' +
							'\', ' +
							'zIndex: !$root.showShader ? -1 : null, ' +
						'} "' +
						'>' +
						'<div class="visible-ecliptic-shader" v-if="$root.showShader" ' +
							':style="{ ' +				
								'transform: \'' +
									'translate(-50%, -50%) ' +
									'rotate(\' + (-$root.shaderSeasonRotation()) + \'deg)' +
								'\', ' +
								'borderBottom: $root.showAngles ? \'1px solid #666\' : null, ' +
							'} "' +
							'>' +
							'<div class="shader-caption" v-if="$root.showAngles"><div style="transform: scaleX(-1)">Descending</div></div>' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="the-center" id="the-center">' +
					'<div class="video-view" ' +
						'v-if="$root.videoView" ' +
						'>' +
						'<div class="video-view-blackout" style="bottom: 2px;"></div>' +
						'<div class="video-view-vertical" style="left: 0;">' +
							'<div style="position: absolute; width: 540px; left: 1px; top: 2px; background-color: black;" ' +
								'v-if="$root.showAspectsSequence" ' +
								':style="{ height: (32 + ($root.xiple == 2 ? $root.stackedAspectsInTheAspectsSequence.length : $root.stackedTripleAspectsInTheAspectsSequence.length) * $root.segmentHeight) + \'px\', }" ' +
								'>' +
							'</div>' +
							'<div class="aspects-box" ' +
								'v-if="$root.showAspectsSequence" ' +
								'>' +
								'<div ' +
									'class="aspect-bar" ' +
									'v-for="(aspectRow, i) in ($root.xiple == 2 ? $root.stackedAspectsInTheAspectsSequence : $root.stackedTripleAspectsInTheAspectsSequence)" ' +
									':key="i" ' +
									'style="border-bottom: 1px solid white; height: 10px;" ' +
									':style="{ top: (i * $root.segmentHeight + 33) + \'px\', }" ' +
								'>' +
									'<div v-for="(aspect, j) in aspectRow" ' +
										'class="aspect-bar-segment no-select" ' +
										':class="{ tiny: $root.tickScaleIsTiny, }" ' +
										//'style="font-size: 11px;" ' +
										':style="{ ' +
											'height: ($root.segmentHeight / $root.xiple) + \'px\', ' +
											'width: ($root.tickScale * 2 + ((aspect && aspect.end) ? -2 : 1)) + \'px\', ' +
											'left: (j * $root.tickScale * 2) + \'px\', ' +
											'backgroundColor: aspect ? aspect.p1color : null, ' +
										'}"' +
										'@click.stop="$root.selectAspect(aspect.p1name, aspect.p2name, aspect.p3name)" ' +
										'>' +
										'<div style="z-index: 3; position: absolute; bottom: 0; text-shadow: 1px 1px 0px black;" ' +
											'v-if="aspect && aspect.start" ' +
											'>' +
											'<span v-if="$root.xiple == 2">{{ aspect.length <= 1 || $root.tickScaleIsTiny ? aspect.p2symbol : aspect.p2name + \'&nbsp;\' }}{{ aspect.symbol }}{{ aspect.length <= 1 || $root.tickScaleIsTiny ? aspect.p1symbol : \'&nbsp;\' + aspect.p1name }}</span>' +
											'<span v-if="$root.xiple == 3" style="white-space: nowrap; font-size: 10px; display: inline-block; transform: translateY(4px);">{{ aspect.length <= 1 || $root.tickScaleIsTiny ? aspect.p3symbol : aspect.p3name + \'&nbsp;\' }}-{{ aspect.length <= 1 || $root.tickScaleIsTiny ? aspect.p2symbol : aspect.p2name + \'&nbsp;\' }}-{{ aspect.length <= 1 || $root.tickScaleIsTiny ? aspect.p1symbol : \'&nbsp;\' + aspect.p1name }}</span>' +
										'</div>' +
									'</div>' +
									'<div v-for="(aspect, j) in aspectRow" ' +
										'class="aspect-bar-segment no-select" ' +
										':class="{ tiny: $root.tickScaleIsTiny, }" ' +
										':style="{ ' +
											'height: ($root.segmentHeight / $root.xiple - 1) + \'px\', ' +
											'width: ($root.tickScale * 2 + ((aspect && aspect.end) ? -2 : 1)) + \'px\', ' +
											'left: (j * $root.tickScale * 2) + \'px\', ' +
											'backgroundColor: aspect ? aspect.p2color : null, ' +
											'transform: \'translateY(\' + (-$root.segmentHeight / $root.xiple + 2) + \'px)\', ' +
										'}"' +
										'@click.stop="$root.selectAspect(aspect.p1name, aspect.p2name, aspect.p3name)" ' +
										'>' +
									'</div>' +
									'<div v-for="(aspect, j) in aspectRow" ' +
										'v-if="$root.xiple == 3" ' +
										'class="aspect-bar-segment no-select" ' +
										':class="{ tiny: $root.tickScaleIsTiny, }" ' +
										':style="{ ' +
											'height: ($root.segmentHeight / $root.xiple - 1) + \'px\', ' +
											'width: ($root.tickScale * 2 + ((aspect && aspect.end) ? -2 : 1)) + \'px\', ' +
											'left: (j * $root.tickScale * 2) + \'px\', ' +
											'backgroundColor: aspect ? aspect.p3color : null, ' +
											'transform: \'translateY(\' + (-$root.segmentHeight / $root.xiple + 8) + \'px)\', ' +
										'}"' +
										'@click.stop="$root.selectAspect(aspect.p1name, aspect.p2name, aspect.p3name)" ' +
										'>' +
									'</div>' +
								'</div>' +
							'</div>' +
							'<div ' +
								'v-if="$root.showAspectsSequence" ' +
								'style=" ' +
									'position: absolute; ' +
									'width: 100%; height: 100%; ' +
									'transform: translate(1px, 10px); ' +
								'" ' +
								'>' +
								'<div ' +
									'class="sequence-tick-line short" ' +
									':class="{ ' +
										'month: 10000000 <= 100000000 && (new Date($root.loadTime + ($root.DAY * n))).getDate() == 1, ' +
									'}" ' +
									'v-for="n in $root.tickCount" ' +
									':style="{ ' +
										'width: (6 + ($root.xiple == 2 ? $root.stackedAspectsInTheAspectsSequence.length : $root.stackedTripleAspectsInTheAspectsSequence.length) * $root.segmentHeight) + \'px\', ' +
										'left: ($root.tickScale * ($root.DAY / 10000000) * n) - (($root.midnightOverage($root.loadTime) / $root.DAY) * ($root.tickScale * $root.DAY / 10000000)) + \'px\', ' +
										'top: (16) + \'px\', ' +
										'transform: \'rotate(90deg)\', ' +
									'}" ' +
									'>' +
									'<div class="sequence-tick-line-label" ' +
										':class="{ tiny: $root.tickScaleIsTiny, }" ' +
										'@click.stop="$root.dateTime = $root.loadTime + $root.DAY * n - $root.loadTimeDayPercent * $root.DAY" ' +
										'style="left: -16px; color: rgba(255, 255, 255, .8); font-weight: bold; font-family: Arial; letter-spacing: 1px;" ' +
										'>' +
											'<span v-if="!$root.tickScaleIsTiny">{{ $root.dayOfWeek[($root.loadDateShown.getDay() + n) % 7] }}<br></span>' +
											'{{ $root.humanReadableDateTime($root.loadTime + ($root.DAY * n), true, true) }}' +
										'</div>' +
								'</div>' +
								'<div ' +
									'v-if="10000000 <= 100000000 && $root.dateTime >= $root.loadTime" ' +
									'class="sequence-tick-line short" ' +
									'style="background-color: #FF7; height: 2px;" ' +
									'id="tick-cursor" ' +
									':style="{ ' +
										'width: (6 + ($root.xiple == 2 ? $root.stackedAspectsInTheAspectsSequence.length : $root.stackedTripleAspectsInTheAspectsSequence.length) * $root.segmentHeight) + \'px\', ' +
										'left: ($root.tickScale * (($root.dateTime - $root.loadTime) / (10000000)) + 1) + \'px\', ' +
										'top: (16) + \'px\', ' +
										'transform: \'rotate(90deg)\', ' +
									'}" ' +
									'>' +
								'</div>' +
								'<div style="color: white; position: absolute; top: -40px; left: 0; border: 1px solid #444; background-color: black; margin: 3px; padding: 2px; white-space: nowrap;">' +
									'<div class="aspect-xiple-button" :class="{ selected: $root.xiple == 2 }" @click.stop="$root.xiple = 2">2x</div> ' +
									'<div class="aspect-xiple-button" :class="{ selected: $root.xiple == 3 }" @click.stop="$root.xiple = 3">3x</div> ' +
								'</div>' +
							'</div>' +
							'<div class="video-view-blackout" style="right: 1px; bottom: -3px;"></div>' +
							'<div class="video-view-horizontal" style="bottom: 0;">' +
								'<div class="sunrise-sunset-box">' +
									'<div ' +
										'style="width: 120px; height: 120px; border-radius: 50%; position: absolute; transform: translate(-50%, -50%);" ' +
										':style="{ backgroundColor: \'rgba(0, 255, 255, \' + (.5 * Math.sin($root.dayPercent() * Math.PI) - .2) + \')\', }" ' +
									'>' +
									'</div>' +
									'<img src="sun-and-moon.png" ' +
										':style="{ transform: \'translate(-50%, -50%) rotate(\' + (180 + $root.dayPercent() * 360) + \'deg)\', }" ' +
									'>' +
									'<img src="hills.png">' +
									'<div class="the-day-text">' +
										'{{ $root.dayOfWeek[$root.dateShown.getDay()] }}<br>{{ $root.dateShown.getMonth() + 1 }}/{{ $root.dateShown.getDate() }}' +
									'</div>' +
								'</div>' +
								'<div class="video-view-blackout" style="right: -1px; top: 2px;"></div>' +
							'</div>' +
							'<div class="tiny-view-frame-caption" style="bottom: 0px; width: 480px; transform: none;">' +
								'<div ' +
									'v-if="$root.selectedAspect" ' +
									'class="planet-laser" ' +
									':class="[ $root.selectedAspect.aspect ]" ' +
									'style="' +
										'transform: rotate(90deg); ' +
										'transform-origin: center center; ' +
										'height: 200px; ' +
										'top: 14%; ' +
										'left: 50%; ' +
										'border-left-width: 5px; ' +
									'" ' +
									'>' +
								'</div>' +
								'<planet-card ' +
									'v-if="$root.showCards" ' +
									'v-for="(planet, planetName) in $root.selectedPlanets" ' +
									':planet="$root.thePlanet(planetName)" ' +
									':key="planetName" ' +
									'>' +
								'</planet-card>' +
								'<div class="tiny-view-aspect" ' +
									'v-if="$root.selectedAspect" ' +
									':class="[ $root.selectedAspect.aspect ]" ' +
									'>' +
									'<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">{{ [\'Opposition\', \'Square\'].indexOf($root.selectedAspect.aspect) == -1 ? String.fromCodePoint(0x1F91D) : String.fromCodePoint(0x2694) }}</div>' +
									'<div style="font-size: 20px; position: absolute; bottom: 0%; left: 50%; transform: translateX(-50%);">{{ $root.selectedAspect.symbol }}</div>' +
									'<div style="font-size: 9px; position: absolute; top: 10%; left: 50%; transform: translateX(-50%);">{{ $root.selectedAspect.aspect }}</div>' +
								'</div>' +
							'</div>' +
						'</div>' +
						'<div class="video-view-vertical" style="right: 0; z-index: 100;">' +
							'<div class="video-view-blackout" style="left: 1px; top: -10px;"></div>' +
							/*'<div class="control-box" style="bottom: 2px; right: 2px;"' +
								'>' +
								'<div v-for="(p1, p1name) in $root.aspects" :key="p1name" :id="p1name + \'-aspects\'">' +
									'<div ' +
										'v-for="(p2, p2name) in p1" ' +
										'v-if="p2.p1order > p2.p2order && p1name != \'Moon\' && p2name != \'Moon\'"" ' +
										':key="p1name + \'-\' + p2name" ' +
									'>' +
										'<div class="aspect-list" ' +
											':class="{ selected: $root.selectedPlanets && Object.keys($root.selectedPlanets).length == 2 && $root.selectedPlanets[p1name] && $root.selectedPlanets[p2name], }" ' +
											'@click.stop="$root.selectAspect(p1name, p2name)" ' +
											'>{{ p1name }} {{ p2.symbol }} {{ p2name }} ({{ p2.orb }}&deg;)</div>' +
									'</div>' +
								'</div>' +
							'</div>' +*/
						'</div>' +
						'<div class="fader" ' +
							'v-if="$root.faderOpacity > 0" ' +
							':style="{ ' +				
								'opacity: $root.faderOpacity, ' +
							'} "' +
						'></div>' +
					'</div>' +
				'</div>' +
			'</div>' +






		'</div>' +
		'',
});

var app = new Vue({
	el: '#app',
    data: {
	    rotateX: 0,
	    scale: 1,
	    xiple: 2,
	    romanNumerals: {
		    1: 'I',
		    2: 'II',
		    3: 'III',
		    4: 'IV',
		    5: 'V',
		    6: 'VI',
		    7: 'VII',
		    8: 'VIII',
		    9: 'IX',
		    10: 'X',
		    11: 'XI',
		    12: 'XII',
	    },
	    additionalRotation: 0,
	    tickScale: 7,
	    //tickScale: 14.4,
	    dayOfWeek: { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' },
	    eclExt: 117,
	    eclRot: Math.PI,
	    eclCoe: .262,
	    localStorage: localStorage,
	    savedDateTimes: {},
	    MILLIS_IN_YEAR: 31556952000,
	    SECOND: 1000,
	    MINUTE: 60 * 1000,
	    HOUR: 60 * 60 * 1000,
	    DAY: 24 * 60 * 60 * 1000,
	    MONTHISH: 30 * 24 * 60 * 60 * 1000,
	    YEARISH: 365 * 24 * 60 * 60 * 1000,
	    window: window,
	    dateTime: new Date().getTime(),
	    loadTime: new Date().getTime() - (24 * 60 * 60 * 1000),
	    savedDateTime: null,
    	sunZs: [],
	    stepIncrement: 10 * 1000000,
	    factor: 1000000,
	    stepIncrements: [.1, .3, 1, 2, 3, 6, 10, 20, 30, 60, 100, 300, 1000, 3000, 10000, 30000, ],
	    clockID: -1,
	    faderID: -1,
	    faderOpacity: 0,
	    showShader: false,
	    visibleSkyUp: false,
	    useSymbols: false,
	    showLasers: false,
	    showButtons: false,
	    showDignities: false,
	    showRetrogrades: false,
	    showTropical: true,
	    showLines: false,
	    showAspects: true,
	    showAspectsSequence: true,
	    showDivisions: false,
	    showAngles: false,
	    showTransits: true,
	    showCards: true,
	    toEcliptic: false,
	    sequenceView: false,
	    tinyView: false,
	    videoView: true,
	    selectedPlanets: null,
	    referenceMoment: null,
	    theZodiac: [
		{ order: 1, name: 'Aries', symbol: String.fromCodePoint(0x2648), planet: 'Mars', }, 
		{ order: 2, name: 'Taurus', symbol: String.fromCodePoint(0x2649), planet: 'Venus', }, 
		{ order: 3, name: 'Gemini', symbol: String.fromCodePoint(0x264A), planet: 'Mercury', },
		{ order: 4, name: 'Cancer', symbol: String.fromCodePoint(0x264B), planet: 'Moon', }, 
		{ order: 5, name: 'Leo', symbol: String.fromCodePoint(0x264C), planet: 'Sun', }, 
		{ order: 6, name: 'Virgo', symbol: String.fromCodePoint(0x264D), planet: 'Mercury', }, 
		{ order: 7, name: 'Libra', symbol: String.fromCodePoint(0x264E), planet: 'Venus', }, 
		{ order: 8, name: 'Scorpio', symbol: String.fromCodePoint(0x264F), planet: 'Mars', secondaryPlanet: 'Pluto', }, 
		{ order: 9, name: 'Sagittarius', symbol: String.fromCodePoint(0x2650), planet: 'Jupiter', }, 
		{ order: 10, name: 'Capricorn', symbol: String.fromCodePoint(0x2651), planet: 'Saturn', }, 
		{ order: 11, name: 'Aquarius', symbol: String.fromCodePoint(0x2652), planet: 'Saturn', secondaryPlanet: 'Uranus', }, 
		{ order: 12, name: 'Pisces', symbol: String.fromCodePoint(0x2653), planet: 'Jupiter', secondaryPlanet: 'Neptune', }, 
	    ],
	    thePlanets: [
		/*{ order: 1, placement: 'inner', name: 'Moon', symbol: String.fromCodePoint(0x263D), size: 20, color: '#D8CFC0', 
			keyTrait: 'Emotions', 
			traits: ['Cycles', 'Memory', 'Nurturing', 'Instinct'], 
		}, */
		{ order: 2, placement: 'inner', name: 'Mercury', symbol: String.fromCodePoint(0x263F), size: 10, color: '#9A8C98', 
			keyTrait: 'Communication', 
			traits: ['Speed', 'Intellect', 'Flexibility', 'Commerce'], 
		}, 
		{ order: 3, placement: 'inner', name: 'Venus', symbol: String.fromCodePoint(0x2640), size: 10, color: '#E39D4F', 
			keyTrait: 'Relationships', 
			traits: ['Love', 'Pleasure', 'Harmony', 'Beauty'], 
		}, 
		{ order: 4, placement: 'inner', name: 'Sun', symbol: String.fromCodePoint(0x2609), size: 20, color: '#F8DE48', 
			keyTrait: 'Ego', 
			traits: ['Clarity', 'Energy', 'Vitality', 'Leadership'], 
		}, 
		{ order: 5, placement: 'middle', name: 'Mars', symbol: String.fromCodePoint(0x2642), size: 10, color: '#D75A53', 
			keyTrait: 'Action', 
			traits: ['Conflict', 'Courage', 'Prowess', 'Tools'], 
		}, 
		{ order: 6, placement: 'middle', name: 'Jupiter', symbol: String.fromCodePoint(0x2643), size: 10, color: '#D8BE48', 
			keyTrait: 'Success', 
			traits: ['Growth', 'Fortune', 'Adventure', 'Enthusiasm'], 
		}, 
		{ order: 7, placement: 'middle', name: 'Saturn', symbol: String.fromCodePoint(0x2644), size: 10, color: '#AE8A6A', 
			keyTrait: 'Caution', 
			traits: ['Order', 'Boundaries', 'Time', 'Discipline'], 
		}, 
		/*{ order: 8, placement: 'outer', name: 'Uranus', symbol: String.fromCodePoint(0x2645), size: 10, color: '#BFD3ED', 
			keyTrait: 'Disruption', 
			traits: ['Awakening', 'New', 'Wild', 'Catastrophe'], 
		}, 
		{ order: 9, placement: 'outer', name: 'Neptune', symbol: String.fromCodePoint(0x2646), size: 10, color: '#7DA4F4', 
			keyTrait: 'Dreams', 
			traits: ['Spiritual', 'Mysticism', 'Transcend', 'Merging'], 
		}, 
		{ order: 10, placement: 'outer', name: 'Pluto', symbol: String.fromCodePoint(0x2647), size: 10, color: '#C9ADA7', 
			keyTrait: 'Transformation', 
			traits: ['Death', 'Wealth', 'Secret', 'Rebirth'], 
		}, */
		],
	    theMinorPlanets: [
		{ order: 1, name: 'Eros', size: 5, color: 'turquoise' }, 
		{ order: 2, name: 'Ceres', size: 5, color: 'green' }, 
		{ order: 3, name: 'Juno', size: 5, color: 'magenta' }, 
		{ order: 4, name: 'Vesta', size: 5, color: 'chartreuse' }, 
		{ order: 5, name: 'Pallas', size: 5, color: 'ivory' }, 
		{ order: 6, name: 'Chiron', size: 5, color: 'rose' }, 
		{ order: 7, name: 'Lilith', size: 5, color: 'vermilion' }, 
	    ],
	    theLines: [
	    // Aries
	    { fromID: 'Hamal', toID: 'Bharani' },
	    { fromID: 'Sheratan', toID: 'Hamal' },
	    { fromID: 'Mesarthim', toID: 'Sheratan' },
	    //], blah: [
	    // Taurus
	    { fromID: 'Chamukuy', toID: 'Aldebaran' },
	    { fromID: 'Prima Hyadum', toID: 'Chamukuy' },
	    { fromID: 'Prima Hyadum', toID: 'Secunda Hyadum' },
	    { fromID: '292140', toID: 'Prima Hyadum' },
	    { fromID: 'Secunda Hyadum', toID: 'Ain' },
	    { fromID: '341266', toID: 'Elnath' },
	    { fromID: 'Ain', toID: '341266' },
	    { fromID: 'Aldebaran', toID: 'Tianguan' },
	    { fromID: '254098', toID: '292140' },
	    { fromID: '251435', toID: '254098' },
	    // Gemini
	    { fromID: 'Mekbuda', toID: 'Wasat' },
	    { fromID: 'Alhena', toID: 'Mekbuda' },
	    { fromID: '685540', toID: 'Wasat' },
	    { fromID: 'Alzirr', toID: '685540' },
	    { fromID: 'Wasat', toID: '739235' },
	    { fromID: '739235', toID: 'Pollux' },
	    { fromID: '708959', toID: 'Castor' },
	    { fromID: '739235', toID: '764688' },
	    { fromID: '708959', toID: '739235' },
	    { fromID: '663843', toID: '708959' },
	    { fromID: 'Mebsuta', toID: '708959' },
	    { fromID: '543342', toID: 'Mebsuta' },
	    { fromID: 'Tejat', toID: 'Mebsuta' },
	    { fromID: 'Propus', toID: 'Tejat' },
	    { fromID: '483362', toID: 'Propus' },
	    // Cancer
	    { fromID: 'Asellus Australis', toID: 'Acubens' },
	    { fromID: 'Asellus Borealis', toID: 'Asellus Australis' },
	    { fromID: 'Asellus Borealis', toID: '917770' },
	    { fromID: 'Tarf', toID: 'Asellus Australis' },
	    // Leo
	    { fromID: 'Algieba', toID: 'Zosma' },
	    { fromID: 'Zosma', toID: 'Denebola' },
	    { fromID: 'Chertan', toID: 'Denebola' },
	    { fromID: 'Regulus', toID: 'Chertan' },
	    { fromID: 'Regulus', toID: '1061687' },
	    { fromID: '1061687', toID: 'Algieba' },
	    { fromID: 'Adhafera', toID: 'Algieba' },
	    { fromID: 'Rasalas', toID: 'Adhafera' },
	    { fromID: 'Ras Elased Australis', toID: 'Rasalas' },
	    // Virgo
	    { fromID: '1460530', toID: '1483603' },
	    { fromID: 'Heze', toID: '1397226' },
	    { fromID: '1397226', toID: '1460530' },
	    { fromID: 'Kang', toID: '1456034' },
	    { fromID: 'Spica', toID: 'Kang' },
	    { fromID: 'Spica', toID: 'Heze' },
	    { fromID: '1325111', toID: 'Spica' },
	    { fromID: 'Porrima', toID: '1325111' },
	    { fromID: 'Minelauva', toID: 'Heze' },
	    { fromID: 'Minelauva', toID: 'Vindemiatrix' },
	    { fromID: 'Porrima', toID: 'Minelauva' },
	    { fromID: 'Zaniah', toID: 'Porrima' },
	    { fromID: 'Zavijava', toID: 'Zaniah' },
	    // Libra
	    { fromID: 'Zubenelgenubi', toID: 'Zubeneschamali' },
	    { fromID: 'Zubenelgenubi', toID: 'Brachium' },
	    { fromID: 'Brachium', toID: 'Zubeneschamali' },
	    { fromID: 'Zubeneschamali', toID: 'Zubenelhakrabi' },
	    { fromID: 'Zubenelhakrabi', toID: '1561678' },
	    { fromID: 'Brachium', toID: '1534623' },
	    // Scorpio
	    { fromID: 'Dschubba', toID: 'Acrab' },
	    { fromID: 'Acrab', toID: 'Jabbah' },
	    { fromID: 'Dschubba', toID: 'Fang' },
	    { fromID: 'Fang', toID: 'Iklil' },
	    { fromID: 'Dschubba', toID: 'Alniyat' },
	    { fromID: 'Alniyat', toID: 'Antares' },
	    { fromID: 'Antares', toID: 'Paikauhale' },
	    { fromID: 'Paikauhale', toID: 'Larawag' },
	    { fromID: 'Larawag', toID: 'Xamidimura' },
	    { fromID: 'Xamidimura', toID: '1662549' },
	    { fromID: '1662549', toID: '1694599' },
	    { fromID: '1694599', toID: 'Sargas' },
	    { fromID: 'Lesath', toID: 'Shaula' },
	    { fromID: 'Sargas', toID: '1765472' },
	    { fromID: '1754884', toID: '1765472' },
	    { fromID: 'Shaula', toID: '1754884' },
	    // Ophiuchus
	    { fromID: 'Yed Prior', toID: 'Yed Posterior' },
	    { fromID: 'Yed Posterior', toID: '1633277' },
	    { fromID: '1633277', toID: 'Sabik' },
	    { fromID: 'Sabik', toID: 'Cebalrai' },
	    { fromID: 'Rasalhague', toID: 'Cebalrai' },
	    { fromID: '1668004', toID: 'Rasalhague' },
	    { fromID: 'Yed Prior', toID: '1668004' },
	    { fromID: 'Sabik', toID: '1712828' },
	    { fromID: '1712828', toID: '1723545' },
	    { fromID: '1623087', toID: '1633277' },
	    { fromID: '1615993', toID: '1623087' },
	    { fromID: '1610915', toID: '1615993' },
	    { fromID: '1610915', toID: '1613517' },
	    // Sagittarius
	    { fromID: 'Polis', toID: 'Kaus Borealis' },
	    { fromID: 'Alnasl', toID: 'Kaus Media' },
	    { fromID: '1765413', toID: 'Alnasl' },
	    { fromID: 'Kaus Media', toID: 'Kaus Borealis' },
	    { fromID: 'Kaus Media', toID: 'Kaus Australis' },
	    { fromID: '1842810', toID: 'Kaus Australis' },
	    { fromID: 'Kaus Borealis', toID: '1914343' },
	    { fromID: '1914343', toID: 'Nunki' },
	    { fromID: 'Nunki', toID: '1969933' },
	    { fromID: '1914343', toID: 'Ascella' },
	    { fromID: 'Ascella', toID: '1969933' },
	    { fromID: 'Nunki', toID: '1964061' },
	    { fromID: '1964061', toID: 'Albaldah' },
	    { fromID: '1946081', toID: '1964061' },
	    { fromID: 'Albaldah', toID: '2008520' },
	    { fromID: '2008520', toID: '2008656' },
	    { fromID: '1969933', toID: '2048705' },
	    { fromID: '2048705', toID: '2107312' },
	    { fromID: '2107312', toID: '2123017' },
	    { fromID: '2115042', toID: '2123017' },
	    { fromID: '2102592', toID: '2115042' },
	    { fromID: 'Rukbat', toID: '2102592' },
	    { fromID: 'Arkab Prior', toID: '2102592' },
	    // Capricorn
	    { fromID: 'Algedi', toID: 'Alshat' },
	    { fromID: 'Algedi', toID: 'Dabih' },
	    { fromID: 'Nashira', toID: 'Deneb Algedi' },
	    { fromID: '2274304', toID: 'Nashira' },
	    { fromID: 'Alshat', toID: '2274304' },
	    { fromID: '2333785', toID: 'Deneb Algedi' },
	    { fromID: '2314277', toID: '2333785' },
	    { fromID: '2276684', toID: '2314277' },
	    { fromID: '2245042', toID: '2276684' },
	    { fromID: '2231926', toID: '2245042' },
	    { fromID: 'Dabih', toID: '2231926' },
	    // Aquarius
	    { fromID: 'Albali', toID: '2246934' },
	    { fromID: '2246934', toID: 'Sadalsuud' },
	    { fromID: 'Sadalsuud', toID: 'Sadalmelik' },
	    { fromID: 'Sadalmelik', toID: 'Ancha' },
	    { fromID: '2385967', toID: 'Ancha' },
	    { fromID: 'Sadalmelik', toID: 'Sadachbia' },
	    { fromID: 'Sadachbia', toID: '2423886' },
	    { fromID: '2418141', toID: '2423886' },
	    { fromID: '2423886', toID: '2434398' },
	    { fromID: '2434398', toID: '2461296' },
	    { fromID: '2456709', toID: '2461296' },
	    { fromID: '2461296', toID: '2494515' },
	    { fromID: '2456709', toID: 'Skat' },
	    { fromID: 'Skat', toID: '2485733' },
	    { fromID: '2485733', toID: '2503767' },
	    { fromID: '2503767', toID: '2528990' },
	    { fromID: '2497203', toID: '2528990' },
	    { fromID: '2494515', toID: '2497203' },
	    { fromID: '2492335', toID: '2494515' },
	    // Pisces
	    { fromID: '93797', toID: 'Alpherg' },
	    { fromID: '93797', toID: '100641' },
	    { fromID: '91300', toID: '100641' },
	    { fromID: 'Alpherg', toID: 'Torcular' },
	    { fromID: 'Torcular', toID: '153727' },
	    { fromID: '127385', toID: '153727' },
	    { fromID: '80681', toID: '127385' },
	    { fromID: '62727', toID: '80681' },
	    { fromID: '2525456', toID: '2551223' },
	    { fromID: '2525456', toID: '2528171' },
	    { fromID: '2551223', toID: '62727' },
	    { fromID: '2496250', toID: '2510181' },
	    { fromID: '2510181', toID: '2525456' },
	    { fromID: '2508805', toID: '2528171' },
	    { fromID: '2496250', toID: '2508805' },
	    { fromID: 'Fumalsamakah', toID: '2496250' },
	    ],
	    theStars: {
		    /*{ id: 'a0', con: 'RA', name: '0', ra: 0, dec: 40, mag: -2, ci: 0, },
		    { id: 'a3', con: 'RA', name: '3', ra: 3, dec: 40, mag: -2, ci: 0, },
		    { id: 'a6', con: 'RA', name: '6', ra: 6, dec: 40, mag: -2, ci: 0, },
		    { id: 'a9', con: 'RA', name: '9', ra: 9, dec: 40, mag: -2, ci: 0, },
		    { id: 'a12', con: 'RA', name: '12', ra: 12, dec: 40, mag: -2, ci: 0, },
		    { id: 'a15', con: 'RA', name: '15', ra: 15, dec: 40, mag: -2, ci: 0, },
		    { id: 'a18', con: 'RA', name: '18', ra: 18, dec: 40, mag: -2, ci: 0, },
		    { id: 'a21', con: 'RA', name: '21', ra: 21, dec: 40, mag: -2, ci: 0, },*/
		    'q0': { id: 'q0', con: 'EQU', name: '0', ra: 0, dec: 0, mag: 0, ci: 0, },
		    'q1': { id: 'q1', con: 'EQU', name: '1', ra: 1, dec: 0, mag: 0, ci: 0, },
		    'q2': { id: 'q2', con: 'EQU', name: '2', ra: 2, dec: 0, mag: 0, ci: 0, },
		    'q3': { id: 'q3', con: 'EQU', name: '3', ra: 3, dec: 0, mag: 0, ci: 0, },
		    'q4': { id: 'q4', con: 'EQU', name: '4', ra: 4, dec: 0, mag: 0, ci: 0, },
		    'q5': { id: 'q5', con: 'EQU', name: '5', ra: 5, dec: 0, mag: 0, ci: 0, },
		    'q6': { id: 'q6', con: 'EQU', name: '6', ra: 6, dec: 0, mag: 0, ci: 0, },
		    'q7': { id: 'q7', con: 'EQU', name: '7', ra: 7, dec: 0, mag: 0, ci: 0, },
		    'q8': { id: 'q8', con: 'EQU', name: '8', ra: 8, dec: 0, mag: 0, ci: 0, },
		    'q9': { id: 'q9', con: 'EQU', name: '9', ra: 9, dec: 0, mag: 0, ci: 0, },
		    'q10': { id: 'q10', con: 'EQU', name: '10', ra: 10, dec: 0, mag: 0, ci: 0, },
		    'q11': { id: 'q11', con: 'EQU', name: '11', ra: 11, dec: 0, mag: 0, ci: 0, },
		    'q12': { id: 'q12', con: 'EQU', name: '12', ra: 12, dec: 0, mag: 0, ci: 0, },
		    'q13': { id: 'q13', con: 'EQU', name: '13', ra: 13, dec: 0, mag: 0, ci: 0, },
		    'q14': { id: 'q14', con: 'EQU', name: '14', ra: 14, dec: 0, mag: 0, ci: 0, },
		    'q15': { id: 'q15', con: 'EQU', name: '15', ra: 15, dec: 0, mag: 0, ci: 0, },
		    'q16': { id: 'q16', con: 'EQU', name: '16', ra: 16, dec: 0, mag: 0, ci: 0, },
		    'q17': { id: 'q17', con: 'EQU', name: '17', ra: 17, dec: 0, mag: 0, ci: 0, },
		    'q18': { id: 'q18', con: 'EQU', name: '18', ra: 18, dec: 0, mag: 0, ci: 0, },
		    'q19': { id: 'q19', con: 'EQU', name: '19', ra: 19, dec: 0, mag: 0, ci: 0, },
		    'q20': { id: 'q20', con: 'EQU', name: '20', ra: 20, dec: 0, mag: 0, ci: 0, },
		    'q21': { id: 'q21', con: 'EQU', name: '21', ra: 21, dec: 0, mag: 0, ci: 0, },
		    'q22': { id: 'q22', con: 'EQU', name: '22', ra: 22, dec: 0, mag: 0, ci: 0, },
		    'q23': { id: 'q23', con: 'EQU', name: '23', ra: 23, dec: 0, mag: 0, ci: 0, },
		    'q24': { id: 'q24', con: 'EQU', name: '24', ra: 24, dec: 0, mag: 0, ci: 0, },
		    'e0': { id: 'e0', con: 'ECL', name: '0', ra: 0, dec: -23.45 * Math.cos((6/24 + 0/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e1': { id: 'e1', con: 'ECL', name: '1', ra: 1, dec: -23.45 * Math.cos((6/24 + 1/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e2': { id: 'e2', con: 'ECL', name: '2', ra: 2, dec: -23.45 * Math.cos((6/24 + 2/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e3': { id: 'e3', con: 'ECL', name: '3', ra: 3, dec: -23.45 * Math.cos((6/24 + 3/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e4': { id: 'e4', con: 'ECL', name: '4', ra: 4, dec: -23.45 * Math.cos((6/24 + 4/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e5': { id: 'e5', con: 'ECL', name: '5', ra: 5, dec: -23.45 * Math.cos((6/24 + 5/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e6': { id: 'e6', con: 'ECL', name: '6', ra: 6, dec: -23.45 * Math.cos((6/24 + 6/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e7': { id: 'e7', con: 'ECL', name: '7', ra: 7, dec: -23.45 * Math.cos((6/24 + 7/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e8': { id: 'e8', con: 'ECL', name: '8', ra: 8, dec: -23.45 * Math.cos((6/24 + 8/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e9': { id: 'e9', con: 'ECL', name: '9', ra: 9, dec: -23.45 * Math.cos((6/24 + 9/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e10': { id: 'e10', con: 'ECL', name: '10', ra: 10, dec: -23.45 * Math.cos((6/24 + 10/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e11': { id: 'e11', con: 'ECL', name: '11', ra: 11, dec: -23.45 * Math.cos((6/24 + 11/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e12': { id: 'e12', con: 'ECL', name: '12', ra: 12, dec: -23.45 * Math.cos((6/24 + 12/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e13': { id: 'e13', con: 'ECL', name: '13', ra: 13, dec: -23.45 * Math.cos((6/24 + 13/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e14': { id: 'e14', con: 'ECL', name: '14', ra: 14, dec: -23.45 * Math.cos((6/24 + 14/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e15': { id: 'e15', con: 'ECL', name: '15', ra: 15, dec: -23.45 * Math.cos((6/24 + 15/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e16': { id: 'e16', con: 'ECL', name: '16', ra: 16, dec: -23.45 * Math.cos((6/24 + 16/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e17': { id: 'e17', con: 'ECL', name: '17', ra: 17, dec: -23.45 * Math.cos((6/24 + 17/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e18': { id: 'e18', con: 'ECL', name: '18', ra: 18, dec: -23.45 * Math.cos((6/24 + 18/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e19': { id: 'e19', con: 'ECL', name: '19', ra: 19, dec: -23.45 * Math.cos((6/24 + 19/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e20': { id: 'e20', con: 'ECL', name: '20', ra: 20, dec: -23.45 * Math.cos((6/24 + 20/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e21': { id: 'e21', con: 'ECL', name: '21', ra: 21, dec: -23.45 * Math.cos((6/24 + 21/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e22': { id: 'e22', con: 'ECL', name: '22', ra: 22, dec: -23.45 * Math.cos((6/24 + 22/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e23': { id: 'e23', con: 'ECL', name: '23', ra: 23, dec: -23.45 * Math.cos((6/24 + 23/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    'e24': { id: 'e24', con: 'ECL', name: '24', ra: 24, dec: -24.45 * Math.cos((6/24 + 24/24) * 2 * Math.PI), mag: 0, ci: 0, },
		    '392532': { id: '392532', con: 'Aur', name: 'Capella', ra: 5.27813768, dec: 45.99902927, mag: 0.08, ci: 0.795, },
		    '388910': { id: '388910', con: 'Ori', name: 'Rigel', ra: 5.24229757, dec: -8.20163919, mag: 0.18, ci: -0.03, },
		    '122757': { id: '122757', con: 'Eri', name: 'Achernar', ra: 1.62854214, dec: -57.23666007, mag: 0.45, ci: -0.158, },
		    '463434': { id: '463434', con: 'Ori', name: 'Betelgeuse', ra: 5.91952477, dec: 7.40703634, mag: 0.45, ci: 1.5, },
		    '333847': { id: '333847', con: 'Tau', name: 'Aldebaran', ra: 4.5986668, dec: 16.50976164, mag: 0.87, ci: 1.538, },
		    '407012': { id: '407012', con: 'Ori', name: 'Bellatrix', ra: 5.41885228, dec: 6.34973451, mag: 1.64, ci: -0.224, },
		    '409060': { id: '409060', con: 'Tau', name: 'Elnath', ra: 5.43819387, dec: 28.60787346, mag: 1.65, ci: -0.13, },
		    '427355': { id: '427355', con: 'Ori', name: 'Alnilam', ra: 5.60355905, dec: -1.20191725, mag: 1.69, ci: -0.184, },
		    '435703': { id: '435703', con: 'Ori', name: 'Alnitak', ra: 5.67931245, dec: -1.94257841, mag: 1.74, ci: -0.199, },
		    '250909': { id: '250909', con: 'Per', name: 'Mirfak', ra: 3.40537459, dec: 49.86124281, mag: 1.79, ci: 0.481, },
		    '473063': { id: '473063', con: 'Aur', name: 'Menkalinan', ra: 5.99215817, dec: 44.94743492, mag: 1.9, ci: 0.077, },
		    '191390': { id: '191390', con: 'UMi', name: 'Polaris', ra: 2.52975, dec: 89.264109, mag: 1.97, ci: 0.636, },
		    '160205': { id: '160205', con: 'Ari', name: 'Hamal', ra: 2.119555, dec: 23.462423, mag: 2.01, ci: 1.151, },
		    '56551': { id: '56551', con: 'Cet', name: 'Diphda', ra: 0.72649, dec: -17.986605, mag: 2.04, ci: 1.019, },
		    '11289': { id: '11289', con: 'And', name: 'Alpheratz', ra: 0.13976889, dec: 29.09082805, mag: 2.07, ci: -0.038, },
		    '89000': { id: '89000', con: 'And', name: 'Mirach', ra: 1.16220082, dec: 35.62055764, mag: 2.07, ci: 1.576, },
		    '448767': { id: '448767', con: 'Ori', name: 'Saiph', ra: 5.79594109, dec: -9.66960186, mag: 2.07, ci: -0.168, },
		    '233283': { id: '233283', con: 'Per', name: 'Algol', ra: 3.13614714, dec: 40.9556512, mag: 2.09, ci: -0.003, },
		    '156068': { id: '156068', con: 'And', name: 'Almach', ra: 2.064984, dec: 42.329725, mag: 2.1, ci: 1.37, },
		    '72768': { id: '72768', con: 'Cas', name: 'Cih', ra: 0.94513921, dec: 60.71674966, mag: 2.15, ci: -0.046, },
		    '52707': { id: '52707', con: 'Cas', name: 'Schedar', ra: 0.675116, dec: 56.537331, mag: 2.24, ci: 1.17, },
		    '419386': { id: '419386', con: 'Ori', name: 'Mintaka', ra: 5.53344367, dec: -0.29908071, mag: 2.25, ci: -0.175, },
		    '12359': { id: '12359', con: 'Cas', name: 'Caph', ra: 0.152887, dec: 59.14978, mag: 2.28, ci: 0.38, },
		    '34838': { id: '34838', con: 'Phe', name: 'Ankaa', ra: 0.43806277, dec: -42.30607839, mag: 2.4, ci: 1.083, },
		    '226964': { id: '226964', con: 'Cet', name: 'Menkar', ra: 3.03799228, dec: 4.08973824, mag: 2.54, ci: 1.63, },
		    '420805': { id: '420805', con: 'Lep', name: 'Arneb', ra: 5.545504, dec: -17.822289, mag: 2.58, ci: 0.211, },
		    '144249': { id: '144249', con: 'Ari', name: 'Sheratan', ra: 1.910668, dec: 20.808035, mag: 2.64, ci: 0.165, },
		    '433710': { id: '433710', con: 'Col', name: 'Phact', ra: 5.660817, dec: -34.074108, mag: 2.65, ci: -0.12, },
		    '473490': { id: '473490', con: 'Aur', name: 'Mahasim', ra: 5.995351, dec: 37.212585, mag: 2.65, ci: -0.083, },
		    '108256': { id: '108256', con: 'Cas', name: 'Ruchbah', ra: 1.430216, dec: 60.235283, mag: 2.66, ci: 0.16, },
		    '360575': { id: '360575', con: 'Aur', name: 'Hassaleh', ra: 4.94989374, dec: 33.16608905, mag: 2.69, ci: 1.49, },
		    '425847': { id: '425847', con: 'Ori', name: 'Hatysa', ra: 5.590551, dec: -5.909901, mag: 2.75, ci: -0.21, },
		    '377630': { id: '377630', con: 'Eri', name: 'Cursa', ra: 5.130829, dec: -5.086446, mag: 2.78, ci: 0.161, },
		    '412544': { id: '412544', con: 'Lep', name: 'Nihal', ra: 5.470756, dec: -20.759441, mag: 2.81, ci: 0.807, },
		    '34144': { id: '34144', con: 'Hyi', name: '', ra: 0.4291886, dec: -77.25425174, mag: 2.82, ci: 0.618, },
		    '17696': { id: '17696', con: 'Peg', name: 'Algenib', ra: 0.220598, dec: 15.183596, mag: 2.83, ci: -0.19, },
		    '284366': { id: '284366', con: 'Per', name: '', ra: 3.90220052, dec: 31.88363844, mag: 2.84, ci: 0.271, },
		    '276732': { id: '276732', con: 'Tau', name: 'Alcyone', ra: 3.79141, dec: 24.105137, mag: 2.85, ci: -0.086, },
		    '149554': { id: '149554', con: 'Hyi', name: '', ra: 1.979451, dec: -61.569859, mag: 2.86, ci: 0.29, },
		    '222736': { id: '222736', con: 'Eri', name: 'Acamar', ra: 2.971023, dec: -40.304672, mag: 2.88, ci: 0.128, },
		    '288773': { id: '288773', con: 'Per', name: '', ra: 3.96423, dec: 40.010215, mag: 2.9, ci: -0.199, },
		    '229592': { id: '229592', con: 'Per', name: '', ra: 3.079942, dec: 53.50644, mag: 2.91, ci: 0.716, },
		    '288992': { id: '288992', con: 'Eri', name: 'Zaurak', ra: 3.96715748, dec: -13.50851619, mag: 2.97, ci: 1.588, },
		    '430018': { id: '430018', con: 'Tau', name: 'Tianguan', ra: 5.627413, dec: 21.142549, mag: 2.97, ci: -0.148, },
		    '163182': { id: '163182', con: 'Tri', name: '', ra: 2.1590629, dec: 34.98729435, mag: 3, ci: 0.14, },
		    '271566': { id: '271566', con: 'Per', name: '', ra: 3.715416, dec: 47.787551, mag: 3.01, ci: -0.125, },
		    '368017': { id: '368017', con: 'Aur', name: 'Almaaz', ra: 5.032815, dec: 43.823308, mag: 3.03, ci: 0.537, },
		    '454990': { id: '454990', con: 'Col', name: 'Wazn', ra: 5.84933134, dec: -35.76830949, mag: 3.12, ci: 1.146, },
		    '375368': { id: '375368', con: 'Aur', name: 'Haedus', ra: 5.10858, dec: 41.234474, mag: 3.18, ci: -0.148, },
		    '350878': { id: '350878', con: 'Ori', name: 'Tabit', ra: 4.83066954, dec: 6.96127723, mag: 3.19, ci: 0.484, },
		    '373598': { id: '373598', con: 'Lep', name: '', ra: 5.09101808, dec: -22.37103582, mag: 3.19, ci: 1.46, },
		    '276450': { id: '276450', con: 'Hyi', name: '', ra: 3.78731682, dec: -74.23896428, mag: 3.26, ci: 1.59, },
		    '51282': { id: '51282', con: 'And', name: '', ra: 0.6554664, dec: 30.86101828, mag: 3.27, ci: 1.268, },
		    '386250': { id: '386250', con: 'Lep', name: '', ra: 5.215528, dec: -16.205468, mag: 3.29, ci: -0.11, },
		    '331613': { id: '331613', con: 'Dor', name: '', ra: 4.566598, dec: -55.044975, mag: 3.3, ci: -0.079, },
		    '84587': { id: '84587', con: 'Phe', name: '', ra: 1.10140903, dec: -46.71845453, mag: 3.32, ci: 0.885, },
		    '229985': { id: '229985', con: 'Per', name: '', ra: 3.08627582, dec: 38.84027493, mag: 3.32, ci: 1.528, },
		    '308495': { id: '308495', con: 'Ret', name: '', ra: 4.24041216, dec: -62.47386074, mag: 3.33, ci: 0.915, },
		    '143900': { id: '143900', con: 'Cas', name: 'Segin', ra: 1.906584, dec: 63.670101, mag: 3.35, ci: -0.15, },
		    '405880': { id: '405880', con: 'Ori', name: '', ra: 5.407949, dec: -2.397146, mag: 3.35, ci: -0.24, },
		    '425270': { id: '425270', con: 'Ori', name: 'Meissa', ra: 5.58563248, dec: 9.93415437, mag: 3.39, ci: -0.16, },
		    '325205': { id: '325205', con: 'Tau', name: 'Chamukuy', ra: 4.4777058, dec: 15.87088179, mag: 3.4, ci: 0.179, },
		    '111309': { id: '111309', con: 'Phe', name: '', ra: 1.4727575, dec: -43.31823589, mag: 3.41, ci: 1.542, },
		    '292140': { id: '292140', con: 'Tau', name: '', ra: 4.01133764, dec: 12.49034684, mag: 3.41, ci: -0.099, },
		    '142252': { id: '142252', con: 'Tri', name: 'Mothallah', ra: 1.8846967, dec: 29.57882527, mag: 3.42, ci: 0.488, },
		    '63250': { id: '63250', con: 'Cas', name: 'Achird', ra: 0.81826, dec: 57.815187, mag: 3.46, ci: 0.587, },
		    '87615': { id: '87615', con: 'Cet', name: '', ra: 1.14316446, dec: -10.18226477, mag: 3.46, ci: 1.161, },
		    '205736': { id: '205736', con: 'Cet', name: 'Kaffaljidhma', ra: 2.721678, dec: 3.235818, mag: 3.47, ci: 0.093, },
		    '130695': { id: '130695', con: 'Cet', name: '', ra: 1.734479, dec: -15.93748, mag: 3.49, ci: 0.727, },
		    '271928': { id: '271928', con: 'Eri', name: '', ra: 3.72080599, dec: -9.76339431, mag: 3.52, ci: 0.915, },
		    '325151': { id: '325151', con: 'Tau', name: 'Ain', ra: 4.47694409, dec: 19.18043252, mag: 3.53, ci: 1.014, },
		    '312594': { id: '312594', con: 'Eri', name: '', ra: 4.298237, dec: -33.798348, mag: 3.55, ci: -0.108, },
		    '447293': { id: '447293', con: 'Lep', name: '', ra: 5.782595, dec: -14.82195, mag: 3.55, ci: 0.104, },
		    '25881': { id: '25881', con: 'Cet', name: '', ra: 0.32379842, dec: -8.82392118, mag: 3.56, ci: 1.214, },
		    '172124': { id: '172124', con: 'Eri', name: '', ra: 2.27516316, dec: -51.51216991, mag: 3.56, ci: -0.12, },
		    '123119': { id: '123119', con: 'And', name: 'Nembus', ra: 1.63321004, dec: 48.6282122, mag: 3.59, ci: 1.275, },
		    '394103': { id: '394103', con: 'Ori', name: '', ra: 5.29344165, dec: -6.84440489, mag: 3.59, ci: -0.115, },
		    '442494': { id: '442494', con: 'Lep', name: '', ra: 5.741057, dec: -22.448382, mag: 3.59, ci: 0.481, },
		    '106063': { id: '106063', con: 'Cet', name: '', ra: 1.40039, dec: -8.183257, mag: 3.6, ci: 1.065, },
		    '213523': { id: '213523', con: 'Ari', name: 'Bharani', ra: 2.83306504, dec: 27.26050911, mag: 3.61, ci: -0.1, },
		    '251435': { id: '251435', con: 'Tau', name: '', ra: 3.4135552, dec: 9.02887505, mag: 3.61, ci: 0.887, },
		    '115103': { id: '115103', con: 'Psc', name: 'Alpherg', ra: 1.52472506, dec: 15.34582789, mag: 3.62, ci: 0.974, },
		    '278603': { id: '278603', con: 'Tau', name: 'Atlas', ra: 3.81937298, dec: 24.05341343, mag: 3.62, ci: -0.07, },
		    '314752': { id: '314752', con: 'Tau', name: 'Prima Hyadum', ra: 4.32988998, dec: 15.6276446, mag: 3.65, ci: 0.981, },
		    '352710': { id: '352710', con: 'Ori', name: '', ra: 4.85343444, dec: 5.60510315, mag: 3.68, ci: -0.157, },
		    '48343': { id: '48343', con: 'Cas', name: 'Fulu', ra: 0.616188, dec: 53.896909, mag: 3.69, ci: -0.196, },
		    '145915': { id: '145915', con: 'Eri', name: '', ra: 1.9326298, dec: -51.60887338, mag: 3.69, ci: 0.844, },
		    '368829': { id: '368829', con: 'Aur', name: 'Saclateni', ra: 5.04130224, dec: 41.07583522, mag: 3.69, ci: 1.154, },
		    '245641': { id: '245641', con: 'Eri', name: '', ra: 3.32527819, dec: -21.75786579, mag: 3.7, ci: 1.614, },
		    '356841': { id: '356841', con: 'Ori', name: '', ra: 4.904193, dec: 2.440672, mag: 3.71, ci: -0.179, },
		    '466114': { id: '466114', con: 'Lep', name: '', ra: 5.940082, dec: -14.1677, mag: 3.71, ci: 0.337, },
		    '260533': { id: '260533', con: 'Eri', name: 'Ran', ra: 3.54884565, dec: -9.458263, mag: 3.72, ci: 0.881, },
		    '273761': { id: '273761', con: 'Tau', name: 'Electra', ra: 3.747927, dec: 24.113339, mag: 3.72, ci: -0.105, },
		    '473056': { id: '473056', con: 'Aur', name: '', ra: 5.99211997, dec: 54.28467265, mag: 3.72, ci: 1.01, },
		    '254098': { id: '254098', con: 'Tau', name: '', ra: 3.45282, dec: 9.73268, mag: 3.73, ci: -0.082, },
		    '140225': { id: '140225', con: 'Cet', name: 'Baten Kaitos', ra: 1.85767576, dec: -10.33504177, mag: 3.74, ci: 1.136, },
		    '422396': { id: '422396', con: 'Dor', name: '', ra: 5.56042229, dec: -62.48982734, mag: 3.76, ci: 0.64, },
		    '455712': { id: '455712', con: 'Lep', name: '', ra: 5.85536001, dec: -20.87908925, mag: 3.76, ci: 0.984, },
		    '214331': { id: '214331', con: 'Per', name: 'Miram', ra: 2.84494742, dec: 55.8954932, mag: 3.77, ci: 1.69, },
		    '274107': { id: '274107', con: 'Per', name: '', ra: 3.75323087, dec: 42.57855004, mag: 3.77, ci: 0.425, },
		    '318515': { id: '318515', con: 'Tau', name: 'Secunda Hyadum', ra: 4.38224798, dec: 17.54251527, mag: 3.77, ci: 0.983, },
		    '432018': { id: '432018', con: 'Ori', name: '', ra: 5.645769, dec: -2.600069, mag: 3.77, ci: -0.19, },
		    '234642': { id: '234642', con: 'Per', name: 'Misam', ra: 3.1582707, dec: 44.85753454, mag: 3.79, ci: 0.98, },
		    '237428': { id: '237428', con: 'For', name: 'Dalim', ra: 3.201249, dec: -28.987618, mag: 3.8, ci: 0.543, },
		    '333416': { id: '333416', con: 'Eri', name: 'Theemin', ra: 4.59251087, dec: -30.56233717, mag: 3.81, ci: 0.957, },
		    '153727': { id: '153727', con: 'Psc', name: '', ra: 2.0341132, dec: 2.76374242, mag: 3.82, ci: 0.024, },
		    '273021': { id: '273021', con: 'Ret', name: '', ra: 3.73666103, dec: -64.80689293, mag: 3.84, ci: 1.133, },
		    '273165': { id: '273165', con: 'Per', name: 'Atik', ra: 3.73864845, dec: 32.28824964, mag: 3.84, ci: 0.022, },
		    '325102': { id: '325102', con: 'Tau', name: '', ra: 4.47624937, dec: 15.96215799, mag: 3.84, ci: 0.952, },
		    '307993': { id: '307993', con: 'Hor', name: '', ra: 4.23336489, dec: -42.2943709, mag: 3.85, ci: 1.085, },
		    '447871': { id: '447871', con: 'Pic', name: '', ra: 5.78807971, dec: -51.06651205, mag: 3.85, ci: 0.171, },
		    '72821': { id: '72821', con: 'And', name: '', ra: 0.945885, dec: 38.499345, mag: 3.86, ci: 0.13, },
		    '336467': { id: '336467', con: 'Eri', name: 'Sceptrum', ra: 4.63633996, dec: -14.30397756, mag: 3.86, ci: 1.082, },
		    '417971': { id: '417971', con: 'Col', name: '', ra: 5.52020935, dec: -35.4705184, mag: 3.86, ci: 1.13, },
		    '274844': { id: '274844', con: 'Tau', name: 'Maia', ra: 3.76377969, dec: 24.36775119, mag: 3.87, ci: -0.063, },
		    '12664': { id: '12664', con: 'Phe', name: '', ra: 0.15684383, dec: -45.74742469, mag: 3.88, ci: 1.013, },
		    '142805': { id: '142805', con: 'Ari', name: 'Mesarthim', ra: 1.89217, dec: 19.293852, mag: 3.88, ci: -0.047, },
		    '220725': { id: '220725', con: 'Eri', name: 'Azha', ra: 2.940458, dec: -8.898144, mag: 3.89, ci: 1.088, },
		    '295161': { id: '295161', con: 'Tau', name: '', ra: 4.05260557, dec: 5.98930391, mag: 3.91, ci: 0.032, },
		    '34752': { id: '34752', con: 'Phe', name: '', ra: 0.43672274, dec: -43.67983206, mag: 3.93, ci: 0.175, },
		    '114852': { id: '114852', con: 'Phe', name: '', ra: 1.52086246, dec: -49.07270501, mag: 3.93, ci: 0.972, },
		    '218302': { id: '218302', con: 'Per', name: '', ra: 2.904295, dec: 52.762479, mag: 3.93, ci: 0.758, },
		    '334285': { id: '334285', con: 'Eri', name: '', ra: 4.605317, dec: -3.352459, mag: 3.93, ci: -0.21, },
		    '87352': { id: '87352', con: 'Phe', name: 'Wurren', ra: 1.13974651, dec: -55.24575773, mag: 3.94, ci: -0.12, },
		    '155490': { id: '155490', con: 'Cas', name: '', ra: 2.057268, dec: 72.421294, mag: 3.95, ci: -0.002, },
		    '301745': { id: '301745', con: 'Per', name: '', ra: 4.144357, dec: 47.712513, mag: 3.96, ci: -0.025, },
		    '472203': { id: '472203', con: 'Col', name: '', ra: 5.9857792, dec: -42.81513142, mag: 3.96, ci: 1.146, },
		    '319791': { id: '319791', con: 'Eri', name: 'Beemim', ra: 4.40061542, dec: -34.01685264, mag: 3.97, ci: 1.468, },
		    '456039': { id: '456039', con: 'Aur', name: '', ra: 5.85816397, dec: 39.14849516, mag: 3.97, ci: 1.132, },
		    '290041': { id: '290041', con: 'Per', name: 'Menkib', ra: 3.98275007, dec: 35.79103224, mag: 3.98, ci: 0.016, },
		    '151140': { id: '151140', con: 'Cet', name: '', ra: 2.00008581, dec: -21.07782992, mag: 3.99, ci: 1.554, },
		    '130160': { id: '130160', con: 'Per', name: '', ra: 1.7276768, dec: 50.68873018, mag: 4.01, ci: -0.098, },
		    '345193': { id: '345193', con: 'Eri', name: '', ra: 4.758375, dec: -3.254657, mag: 4.01, ci: -0.148, },
		    '173097': { id: '173097', con: 'Tri', name: '', ra: 2.28857424, dec: 33.84719231, mag: 4.03, ci: 0.019, },
		    '370313': { id: '370313', con: 'Cam', name: '', ra: 5.05696979, dec: 60.44224417, mag: 4.03, ci: 0.921, },
		    '305466': { id: '305466', con: 'Eri', name: 'Beid', ra: 4.19776094, dec: -6.83757967, mag: 4.04, ci: 0.327, },
		    '234167': { id: '234167', con: 'Per', name: '', ra: 3.15111661, dec: 49.61327841, mag: 4.05, ci: 0.595, },
		    '359696': { id: '359696', con: 'Ori', name: '', ra: 4.93952085, dec: 13.51446669, mag: 4.06, ci: 1.158, },
		    '61101': { id: '61101', con: 'And', name: '', ra: 0.788981, dec: 24.267178, mag: 4.08, ci: 1.1, },
		    '178647': { id: '178647', con: 'Hyi', name: '', ra: 2.36248444, dec: -68.65942135, mag: 4.08, ci: 0.034, },
		    '200976': { id: '200976', con: 'Cet', name: '', ra: 2.658044, dec: 0.328511, mag: 4.08, ci: -0.212, },
		    '227085': { id: '227085', con: 'Eri', name: '', ra: 3.039863, dec: -23.624472, mag: 4.08, ci: 0.163, },
		    '428664': { id: '428664', con: 'Ori', name: '', ra: 5.61510806, dec: 9.29067066, mag: 4.09, ci: 0.951, },
		    '121650': { id: '121650', con: 'And', name: 'Titawin', ra: 1.613299, dec: 41.405459, mag: 4.1, ci: 0.536, },
		    '206813': { id: '206813', con: 'Per', name: '', ra: 2.736634, dec: 49.228448, mag: 4.1, ci: 0.514, },
		    '202465': { id: '202465', con: 'Eri', name: '', ra: 2.67778752, dec: -39.85537772, mag: 4.11, ci: 1.006, },
		    '201111': { id: '201111', con: 'Hyi', name: '', ra: 2.65982151, dec: -68.26694641, mag: 4.12, ci: -0.061, },
		    '309092': { id: '309092', con: 'Per', name: '', ra: 4.24829507, dec: 48.4093281, mag: 4.12, ci: 0.935, },
		    '479449': { id: '479449', con: 'Ori', name: '', ra: 6.03972158, dec: 9.64729514, mag: 4.12, ci: 0.17, },
		    '404950': { id: '404950', con: 'Ori', name: '', ra: 5.39911882, dec: -7.80805735, mag: 4.13, ci: 0.943, },
		    '258215': { id: '258215', con: 'Tau', name: '', ra: 3.5145494, dec: 12.93667724, mag: 4.14, ci: 1.112, },
		    '275407': { id: '275407', con: 'Tau', name: 'Merope', ra: 3.77210352, dec: 23.94834792, mag: 4.14, ci: -0.051, },
		    '483362': { id: '483362', con: 'Gem', name: '', ra: 6.068671, dec: 23.263341, mag: 4.16, ci: 0.835, },
		    '43409': { id: '43409', con: 'Cas', name: '', ra: 0.549997, dec: 62.931783, mag: 4.17, ci: 0.13, },
		    '278948': { id: '278948', con: 'Eri', name: '', ra: 3.82423453, dec: -36.20024346, mag: 4.17, ci: 0.927, },
		    '417187': { id: '417187', con: 'Ori', name: '', ra: 5.51307185, dec: 5.94814616, mag: 4.2, ci: -0.143, },
		    '256231': { id: '256231', con: 'Cam', name: '', ra: 3.484482, dec: 59.94033, mag: 4.21, ci: 0.419, },
		    '321342': { id: '321342', con: 'Tau', name: '', ra: 4.42282415, dec: 22.29387398, mag: 4.21, ci: 0.136, },
		    '214192': { id: '214192', con: 'Per', name: '', ra: 2.84307254, dec: 38.31865113, mag: 4.22, ci: 0.343, },
		    '276042': { id: '276042', con: 'Eri', name: '', ra: 3.78080217, dec: -23.24972535, mag: 4.22, ci: 0.434, },
		    '26698': { id: '26698', con: 'Tuc', name: '', ra: 0.33451724, dec: -64.87479253, mag: 4.23, ci: 0.576, },
		    '87791': { id: '87791', con: 'Cep', name: '', ra: 1.14579776, dec: 86.25709194, mag: 4.24, ci: 1.213, },
		    '185334': { id: '185334', con: 'Eri', name: '', ra: 2.4497556, dec: -47.70384099, mag: 4.24, ci: -0.136, },
		    '206716': { id: '206716', con: 'Cet', name: '', ra: 2.73537483, dec: -13.85870626, mag: 4.24, ci: -0.122, },
		    '96204': { id: '96204', con: 'Tuc', name: '', ra: 1.26281967, dec: -68.87597322, mag: 4.25, ci: 0.48, },
		    '299232': { id: '299232', con: 'Per', name: '', ra: 4.10973183, dec: 50.35123808, mag: 4.25, ci: -0.011, },
		    '333533': { id: '333533', con: 'Tau', name: '', ra: 4.5942401, dec: 10.16079261, mag: 4.25, ci: 0.184, },
		    '334729': { id: '334729', con: 'Per', name: '', ra: 4.61150836, dec: 41.26481622, mag: 4.25, ci: 1.171, },
		    '379835': { id: '379835', con: 'Eri', name: '', ra: 5.15243993, dec: -8.75408248, mag: 4.25, ci: -0.187, },
		    '88708': { id: '88708', con: 'And', name: '', ra: 1.15836956, dec: 47.24177979, mag: 4.26, ci: 0.012, },
		    '132421': { id: '132421', con: 'Psc', name: 'Torcular', ra: 1.75656418, dec: 9.15774949, mag: 4.26, ci: 0.942, },
		    '246055': { id: '246055', con: 'Eri', name: '82 G. Eri', ra: 3.33212526, dec: -43.06978094, mag: 4.26, ci: 0.711, },
		    '261490': { id: '261490', con: 'Eri', name: '', ra: 3.563132, dec: -21.632883, mag: 4.26, ci: -0.106, },
		    '310411': { id: '310411', con: 'Dor', name: '', ra: 4.26710741, dec: -51.48664753, mag: 4.26, ci: 0.312, },
		    '356554': { id: '356554', con: 'Cam', name: '', ra: 4.900836, dec: 66.342678, mag: 4.26, ci: -0.008, },
		    '80681': { id: '80681', con: 'Psc', name: '', ra: 1.049058, dec: 7.89013507, mag: 4.27, ci: 0.952, },
		    '207728': { id: '207728', con: 'Cet', name: '', ra: 2.74903946, dec: 10.11414303, mag: 4.27, ci: 0.311, },
		    '309836': { id: '309836', con: 'Tau', name: '', ra: 4.25890489, dec: 8.89235728, mag: 4.27, ci: -0.054, },
		    '336437': { id: '336437', con: 'Tau', name: '', ra: 4.63596173, dec: 12.51083729, mag: 4.27, ci: 0.122, },
		    '341266': { id: '341266', con: 'Tau', name: '', ra: 4.70408391, dec: 22.95694022, mag: 4.27, ci: -0.112, },
		    '322476': { id: '322476', con: 'Tau', name: '', ra: 4.43846239, dec: 22.81357951, mag: 4.28, ci: 0.263, },
		    '264858': { id: '264858', con: 'Tau', name: '', ra: 3.61455087, dec: 0.40166177, mag: 4.29, ci: 0.575, },
		    '397356': { id: '397356', con: 'Lep', name: '', ra: 5.32625694, dec: -13.17678544, mag: 4.29, ci: -0.235, },
		    '75135': { id: '75135', con: 'Scl', name: '', ra: 0.97676681, dec: -29.35744807, mag: 4.3, ci: -0.154, },
		    '186826': { id: '186826', con: 'Cet', name: '', ra: 2.4693168, dec: 8.46007064, mag: 4.3, ci: -0.053, },
		    '274126': { id: '274126', con: 'Tau', name: 'Taygeta', ra: 3.75347074, dec: 24.46726881, mag: 4.3, ci: -0.11, },
		    '277965': { id: '277965', con: 'Eri', name: '', ra: 3.80996664, dec: -37.62015638, mag: 4.3, ci: -0.038, },
		    '321465': { id: '321465', con: 'Tau', name: '', ra: 4.42482999, dec: 17.92790534, mag: 4.3, ci: 0.049, },
		    '473938': { id: '473938', con: 'Aur', name: '', ra: 5.99891601, dec: 45.93673496, mag: 4.3, ci: 1.701, },
		    '264432': { id: '264432', con: 'Per', name: '', ra: 3.60816042, dec: 48.19262969, mag: 4.32, ci: -0.058, },
		    '339183': { id: '339183', con: 'Eri', name: '', ra: 4.6740302, dec: -19.67148449, mag: 4.32, ci: 1.599, },
		    '419801': { id: '419801', con: 'Tau', name: '', ra: 5.53687544, dec: 18.59423706, mag: 4.32, ci: 2.06, },
		    '48225': { id: '48225', con: 'And', name: '', ra: 0.61467917, dec: 33.71934456, mag: 4.34, ci: -0.123, },
		    '50341': { id: '50341', con: 'And', name: '', ra: 0.64259575, dec: 29.31175207, mag: 4.34, ci: 0.871, },
		    '90657': { id: '90657', con: 'Cas', name: '', ra: 1.185017, dec: 55.149901, mag: 4.34, ci: 0.17, },
		    '443102': { id: '443102', con: 'Dor', name: '', ra: 5.74621588, dec: -65.73552235, mag: 4.34, ci: 0.217, },
		    '236923': { id: '236923', con: 'Ari', name: 'Botein', ra: 3.19382412, dec: 19.7266757, mag: 4.35, ci: 1.033, },
		    '351899': { id: '351899', con: 'Ori', name: '', ra: 4.84353361, dec: 8.90017727, mag: 4.35, ci: 0.01, },
		    '41576': { id: '41576', con: 'Tuc', name: '', ra: 0.52574117, dec: -62.95822506, mag: 4.36, ci: -0.064, },
		    '56251': { id: '56251', con: 'Phe', name: '', ra: 0.72256658, dec: -57.46306909, mag: 4.36, ci: 0.024, },
		    '167618': { id: '167618', con: 'Cet', name: '', ra: 2.21666576, dec: 8.84672997, mag: 4.36, ci: 0.878, },
		    '257855': { id: '257855', con: 'Per', name: '', ra: 3.50957921, dec: 47.99521392, mag: 4.36, ci: 1.367, },
		    '296996': { id: '296996', con: 'Tau', name: '', ra: 4.07825462, dec: 22.08192654, mag: 4.36, ci: 1.064, },
		    '355027': { id: '355027', con: 'Eri', name: '', ra: 4.88157485, dec: -5.45269885, mag: 4.36, ci: 0.257, },
		    '386694': { id: '386694', con: 'Lep', name: '', ra: 5.22052156, dec: -12.94129312, mag: 4.36, ci: -0.094, },
		    '468665': { id: '468665', con: 'Col', name: '', ra: 5.95894722, dec: -35.28328064, mag: 4.36, ci: -0.165, },
		    '2717': { id: '2717', con: 'Psc', name: '', ra: 0.03267185, dec: -6.0140715, mag: 4.37, ci: 1.631, },
		    '142953': { id: '142953', con: 'Phe', name: '', ra: 1.89409531, dec: -46.30266629, mag: 4.39, ci: 1.597, },
		    '279018': { id: '279018', con: 'Cam', name: '', ra: 3.82535635, dec: 65.52597221, mag: 4.39, ci: 1.87, },
		    '424619': { id: '424619', con: 'Ori', name: '', ra: 5.58034372, dec: 9.48957657, mag: 4.39, ci: -0.157, },
		    '461894': { id: '461894', con: 'Ori', name: '', ra: 5.90638218, dec: 20.27619413, mag: 4.39, ci: 0.594, },
		    '73382': { id: '73382', con: 'And', name: '', ra: 0.95344441, dec: 23.4176518, mag: 4.4, ci: 0.94, },
		    '491348': { id: '491348', con: 'Ori', name: '', ra: 6.12620174, dec: 14.76847246, mag: 4.42, ci: -0.164, },
		    '275186': { id: '275186', con: 'Eri', name: '', ra: 3.76903771, dec: -12.10159007, mag: 4.43, ci: 1.604, },
		    '309538': { id: '309538', con: 'Eri', name: 'Keid', ra: 4.254537, dec: -7.652871, mag: 4.43, ci: 0.82, },
		    '361022': { id: '361022', con: 'Cam', name: '', ra: 4.95477787, dec: 53.75210262, mag: 4.43, ci: -0.017, },
		    '19543': { id: '19543', con: 'Cet', name: '', ra: 0.24400453, dec: -18.93286794, mag: 4.44, ci: 1.64, },
		    '62727': { id: '62727', con: 'Psc', name: '', ra: 0.81137335, dec: 7.58508166, mag: 4.44, ci: 1.5, },
		    '310872': { id: '310872', con: 'Ret', name: '', ra: 4.27473009, dec: -59.30215392, mag: 4.44, ci: 1.078, },
		    '339313': { id: '339313', con: 'Cae', name: '', ra: 4.67603132, dec: -41.86375152, mag: 4.44, ci: 0.342, },
		    '127385': { id: '127385', con: 'Psc', name: '', ra: 1.69052615, dec: 5.48760831, mag: 4.45, ci: 1.347, },
		    '212553': { id: '212553', con: 'For', name: '', ra: 2.81817199, dec: -32.40589655, mag: 4.45, ci: 0.981, },
		    '385175': { id: '385175', con: 'Lep', name: '', ra: 5.20497339, dec: -11.86920905, mag: 4.45, ci: -0.099, },
		    '187960': { id: '187960', con: 'Cas', name: '', ra: 2.48442859, dec: 67.4023957, mag: 4.46, ci: 0.153, },
		    '284525': { id: '284525', con: 'Eri', name: '', ra: 3.904862, dec: -2.95473, mag: 4.46, ci: 0.672, },
		    '386800': { id: '386800', con: 'Ori', name: '', ra: 5.22152252, dec: 2.8612555, mag: 4.46, ci: 1.166, },
		    '207901': { id: '207901', con: 'Eri', name: '', ra: 2.75171798, dec: -18.57256937, mag: 4.47, ci: 0.481, },
		    '246506': { id: '246506', con: 'Ari', name: '', ra: 3.33898898, dec: 29.0484644, mag: 4.47, ci: 1.555, },
		    '362849': { id: '362849', con: 'Ori', name: '', ra: 4.97580586, dec: 1.71401474, mag: 4.47, ci: 1.369, },
		    '57900': { id: '57900', con: 'Cas', name: '', ra: 0.74542, dec: 48.284364, mag: 4.48, ci: -0.069, },
		    '292433': { id: '292433', con: 'Ret', name: '', ra: 4.01494629, dec: -62.15927854, mag: 4.48, ci: 1.5, },
		    '322525': { id: '322525', con: 'Tau', name: '', ra: 4.43909427, dec: 15.61828259, mag: 4.48, ci: 0.262, },
		    '153617': { id: '153617', con: 'Cas', name: '', ra: 2.03261921, dec: 70.90705771, mag: 4.49, ci: 0.164, },
		    '331073': { id: '331073', con: 'Eri', name: '', ra: 4.55848693, dec: -29.76648879, mag: 4.49, ci: 0.972, },
		    '432844': { id: '432844', con: 'Ori', name: '', ra: 5.65309608, dec: 4.12146379, mag: 4.5, ci: -0.098, },
		    '452761': { id: '452761', con: 'Pic', name: '', ra: 5.83046169, dec: -56.16666692, mag: 4.5, ci: 1.075, },
		    '24432': { id: '24432', con: 'And', name: '', ra: 0.30546047, dec: 36.78522535, mag: 4.51, ci: 0.054, },
		    '91300': { id: '91300', con: 'Psc', name: '', ra: 1.19434322, dec: 30.0896432, mag: 4.51, ci: 1.092, },
		    '451506': { id: '451506', con: 'Aur', name: '', ra: 5.81956633, dec: 39.18107161, mag: 4.51, ci: 0.949, },
		    '211183': { id: '211183', con: 'Ari', name: 'Lilii Borea', ra: 2.79848361, dec: 29.2471177, mag: 4.52, ci: 1.112, },
		    '41590': { id: '41590', con: 'Tuc', name: '', ra: 0.52596341, dec: -62.96556401, mag: 4.53, ci: 0.147, },
		    '64132': { id: '64132', con: 'And', name: '', ra: 0.83023533, dec: 41.07891001, mag: 4.53, ci: -0.136, },
		    '474208': { id: '474208', con: 'Ori', name: '', ra: 6.00093068, dec: -3.07425864, mag: 4.53, ci: 1.202, },
		    '395083': { id: '395083', con: 'Aur', name: '', ra: 5.30293591, dec: 33.3716069, mag: 4.54, ci: 1.252, },
		    '5087': { id: '5087', con: 'Cet', name: '', ra: 0.06233, dec: -17.335988, mag: 4.55, ci: -0.047, },
		    '257133': { id: '257133', con: 'Cam', name: '', ra: 3.49854, dec: 58.87875, mag: 4.55, ci: 0.489, },
		    '371884': { id: '371884', con: 'Cae', name: '', ra: 5.07344531, dec: -35.48297548, mag: 4.55, ci: 1.177, },
		    '215279': { id: '215279', con: 'Per', name: '', ra: 2.85856584, dec: 35.05974318, mag: 4.56, ci: 1.554, },
		    '289773': { id: '289773', con: 'Ret', name: '', ra: 3.97909701, dec: -61.40018254, mag: 4.56, ci: 1.59, },
		    '459868': { id: '459868', con: 'Tau', name: '', ra: 5.88879071, dec: 27.61226179, mag: 4.56, ci: -0.008, },
		    '265113': { id: '265113', con: 'Eri', name: '', ra: 3.61824231, dec: -40.27457056, mag: 4.57, ci: 1.023, },
		    '425759': { id: '425759', con: 'Ori', name: '', ra: 5.58976552, dec: -4.83835095, mag: 4.58, ci: -0.183, },
		    '53708': { id: '53708', con: 'Phe', name: '', ra: 0.68876561, dec: -46.08500948, mag: 4.59, ci: 0.953, },
		    '271467': { id: '271467', con: 'Eri', name: '', ra: 3.71390428, dec: -37.31352025, mag: 4.59, ci: 1.191, },
		    '280031': { id: '280031', con: 'Cam', name: '', ra: 3.83930808, dec: 71.33226447, mag: 4.59, ci: 0.064, },
		    '410016': { id: '410016', con: 'Ori', name: '', ra: 5.44728467, dec: 3.095646, mag: 4.59, ci: -0.199, },
		    '312966': { id: '312966', con: 'Per', name: '', ra: 4.30406047, dec: 50.29549581, mag: 4.6, ci: 0.043, },
		    '7208': { id: '7208', con: 'Psc', name: '', ra: 0.08892716, dec: -5.70761634, mag: 4.61, ci: 1.029, },
		    '22760': { id: '22760', con: 'And', name: '', ra: 0.28485989, dec: 38.6816459, mag: 4.61, ci: 0.059, },
		    '142834': { id: '142834', con: 'Psc', name: '', ra: 1.89259717, dec: 3.18753055, mag: 4.61, ci: 0.928, },
		    '236574': { id: '236574', con: 'Per', name: '', ra: 3.1881614, dec: 39.61158947, mag: 4.61, ci: 1.115, },
		    '72717': { id: '72717', con: 'Cas', name: 'Castula', ra: 0.9444184, dec: 59.18105467, mag: 4.62, ci: 0.957, },
		    '291223': { id: '291223', con: 'Eri', name: '', ra: 3.998745, dec: -24.016215, mag: 4.62, ci: -0.121, },
		    '369766': { id: '369766', con: 'Tau', name: '', ra: 5.05159629, dec: 21.58996112, mag: 4.62, ci: 0.155, },
		    '419243': { id: '419243', con: 'Ori', name: '', ra: 5.53218328, dec: -7.30154281, mag: 4.62, ci: -0.261, },
		    '223719': { id: '223719', con: 'Ari', name: '', ra: 2.98686412, dec: 21.34030518, mag: 4.63, ci: 0.048, },
		    '283869': { id: '283869', con: 'Eri', name: '', ra: 3.89519558, dec: -24.61222349, mag: 4.64, ci: -0.136, },
		    '357672': { id: '357672', con: 'Ori', name: '', ra: 4.91492437, dec: 10.15083236, mag: 4.64, ci: 0.085, },
		    '482890': { id: '482890', con: 'Ori', name: '', ra: 6.06532936, dec: 20.13844671, mag: 4.64, ci: 0.236, },
		    '205933': { id: '205933', con: 'Ari', name: '', ra: 2.72419893, dec: 27.70715021, mag: 4.65, ci: -0.122, },
		    '331458': { id: '331458', con: 'Tau', name: '', ra: 4.5641438, dec: 14.84442457, mag: 4.65, ci: 0.255, },
		    '372137': { id: '372137', con: 'Ori', name: '', ra: 5.07615265, dec: 15.40410506, mag: 4.65, ci: -0.064, },
		    '461356': { id: '461356', con: 'Dor', name: '', ra: 5.90168948, dec: -63.0896879, mag: 4.65, ci: 1.022, },
		    '91051': { id: '91051', con: 'Psc', name: '', ra: 1.1908944, dec: 21.03465245, mag: 4.66, ci: 1.024, },
		    '137836': { id: '137836', con: 'Cet', name: '', ra: 1.82641766, dec: -10.68641272, mag: 4.66, ci: 0.333, },
		    '93797': { id: '93797', con: 'Psc', name: '', ra: 1.2291521, dec: 24.58370895, mag: 4.67, ci: 1.047, },
		    '256530': { id: '256530', con: 'Per', name: '', ra: 3.48945852, dec: 49.50895109, mag: 4.67, ci: -0.096, },
		    '309082': { id: '309082', con: 'Per', name: '', ra: 4.24814323, dec: 40.48365426, mag: 4.67, ci: 1.007, },
		    '337733': { id: '337733', con: 'Tau', name: '', ra: 4.65458407, dec: 15.91797839, mag: 4.67, ci: 0.147, },
		    '487933': { id: '487933', con: 'Lep', name: '', ra: 6.10259, dec: -14.93525379, mag: 4.67, ci: 0.046, },
		    '118085': { id: '118085', con: 'Cas', name: '', ra: 1.56552126, dec: 59.23204329, mag: 4.68, ci: 0.991, },
		    '144616': { id: '144616', con: 'Hyi', name: '', ra: 1.91559149, dec: -67.64730307, mag: 4.68, ci: 0.931, },
		    '156800': { id: '156800', con: 'For', name: '', ra: 2.07484377, dec: -29.29682018, mag: 4.68, ci: -0.156, },
		    '223243': { id: '223243', con: 'Per', name: '', ra: 2.9793532, dec: 39.66272904, mag: 4.68, ci: 0.065, },
		    '322836': { id: '322836', con: 'Tau', name: '', ra: 4.44343692, dec: 14.71378525, mag: 4.69, ci: 0.979, },
		    '396628': { id: '396628', con: 'Aur', name: '', ra: 5.318995, dec: 40.099051, mag: 4.69, ci: 0.63, },
		    '398826': { id: '398826', con: 'Lep', name: '', ra: 5.340811, dec: -21.239763, mag: 4.7, ci: -0.048, },
		    '224271': { id: '224271', con: 'Cet', name: '', ra: 2.99525, dec: 8.907365, mag: 4.71, ci: -0.109, },
		    '256543': { id: '256543', con: 'Ret', name: '', ra: 3.48963236, dec: -62.93752503, mag: 4.71, ci: 0.41, },
		    '354569': { id: '354569', con: 'Ori', name: '', ra: 4.87554554, dec: 14.25064331, mag: 4.71, ci: 1.773, },
		    '373686': { id: '373686', con: 'Dor', name: '', ra: 5.09184878, dec: -57.4727021, mag: 4.71, ci: 0.526, },
		    '415235': { id: '415235', con: 'Ori', name: '', ra: 5.49555062, dec: -1.09223719, mag: 4.71, ci: 1.592, },
		    '420800': { id: '420800', con: 'Aur', name: '', ra: 5.54546495, dec: 32.19202649, mag: 4.71, ci: 0.281, },
		    '108375': { id: '108375', con: 'Cas', name: '', ra: 1.43222832, dec: 68.13001598, mag: 4.72, ci: 1.047, },
		    '401051': { id: '401051', con: 'Ori', name: '', ra: 5.36270744, dec: -0.38246264, mag: 4.72, ci: -0.168, },
		    '455157': { id: '455157', con: 'Aur', name: '', ra: 5.85067739, dec: 37.30556814, mag: 4.72, ci: 1.621, },
		    '497866': { id: '497866', con: 'Pic', name: '', ra: 6.17164131, dec: -54.96864591, mag: 4.72, ci: -0.229, },
		    '183625': { id: '183625', con: 'And', name: '', ra: 2.42706221, dec: 50.27863162, mag: 4.73, ci: 1.532, },
		    '41854': { id: '41854', con: 'Cas', name: '', ra: 0.529539, dec: 54.522289, mag: 4.74, ci: -0.098, },
		    '100641': { id: '100641', con: 'Psc', name: '', ra: 1.32444278, dec: 27.26405675, mag: 4.74, ci: 0.032, },
		    '191734': { id: '191734', con: 'Cet', name: '', ra: 2.534787, dec: -15.2446155, mag: 4.74, ci: 0.454, },
		    '201368': { id: '201368', con: 'Eri', name: '', ra: 2.66333402, dec: -42.89168783, mag: 4.74, ci: 0.061, },
		    '246119': { id: '246119', con: 'Cam', name: '', ra: 3.33313183, dec: 65.65228816, mag: 4.74, ci: -0.108, },
		    '257905': { id: '257905', con: 'Eri', name: '', ra: 3.510294, dec: -5.075145, mag: 4.74, ci: -0.092, },
		    '41399': { id: '41399', con: 'Phe', name: '', ra: 0.52360586, dec: -48.8035133, mag: 4.76, ci: 0.018, },
		    '214071': { id: '214071', con: 'Hyi', name: '', ra: 2.84123857, dec: -75.06694515, mag: 4.76, ci: 1.337, },
		    '214743': { id: '214743', con: 'Eri', name: 'Angetenar', ra: 2.85064437, dec: -21.00402309, mag: 4.76, ci: 0.906, },
		    '458011': { id: '458011', con: 'Ori', name: '', ra: 5.87401094, dec: 1.85513956, mag: 4.76, ci: 1.382, },
		    '57247': { id: '57247', con: 'Cet', name: '', ra: 0.73650016, dec: -10.60955016, mag: 4.77, ci: 0.998, },
		    '230399': { id: '230399', con: 'Per', name: '', ra: 3.09233652, dec: 56.70571786, mag: 4.77, ci: 1.018, },
		    '432270': { id: '432270', con: 'Ori', name: '', ra: 5.64807861, dec: -7.21283158, mag: 4.77, ci: 0.139, },
		    '2198': { id: '2198', con: 'Oct', name: '', ra: 0.02657657, dec: -77.06569263, mag: 4.78, ci: 1.254, },
		    '68105': { id: '68105', con: 'Cet', name: '', ra: 0.88347067, dec: -1.14425879, mag: 4.78, ci: 1.55, },
		    '161871': { id: '161871', con: 'And', name: '', ra: 2.14146091, dec: 37.85907972, mag: 4.78, ci: 0.12, },
		    '275080': { id: '275080', con: 'Cam', name: '', ra: 3.76731456, dec: 63.34504678, mag: 4.78, ci: 0.747, },
		    '327435': { id: '327435', con: 'Tau', name: '', ra: 4.50934225, dec: 16.19401556, mag: 4.78, ci: 0.17, },
		    '364936': { id: '364936', con: 'Eri', name: '', ra: 4.99881585, dec: -12.53741696, mag: 4.78, ci: 0.267, },
		    '425078': { id: '425078', con: 'Ori', name: '', ra: 5.58407842, dec: -6.0020161, mag: 4.78, ci: -0.248, },
		    '19497': { id: '19497', con: 'Peg', name: '', ra: 0.24337891, dec: 20.20669856, mag: 4.79, ci: 1.572, },
		    '148432': { id: '148432', con: 'Ari', name: '', ra: 1.96547689, dec: 23.59606343, mag: 4.79, ci: 0.29, },
		    '354703': { id: '354703', con: 'Aur', name: '', ra: 4.87721686, dec: 36.70318224, mag: 4.79, ci: 1.414, },
		    '54655': { id: '54655', con: 'Cas', name: '', ra: 0.70108155, dec: 50.51252059, mag: 4.8, ci: -0.105, },
		    '68183': { id: '68183', con: 'Cas', name: '', ra: 0.884511, dec: 61.12397, mag: 4.8, ci: 0.54, },
		    '241594': { id: '241594', con: 'Eri', name: 'Zibal', ra: 3.26389562, dec: -8.81973052, mag: 4.8, ci: 0.232, },
		    '316864': { id: '316864', con: 'Per', name: '', ra: 4.35921279, dec: 46.4988827, mag: 4.8, ci: -0.022, },
		    '319863': { id: '319863', con: 'Tau', name: '', ra: 4.40160009, dec: 17.44413435, mag: 4.8, ci: 0.154, },
		    '367196': { id: '367196', con: 'Eri', name: '', ra: 5.02398448, dec: -7.17396699, mag: 4.8, ci: -0.164, },
		    '380702': { id: '380702', con: 'Ori', name: '', ra: 5.16165591, dec: 15.59723483, mag: 4.81, ci: 0.313, },
		    '387559': { id: '387559', con: 'Dor', name: '', ra: 5.22929289, dec: -67.18525422, mag: 4.81, ci: 1.274, },
		    '393908': { id: '393908', con: 'Col', name: '', ra: 5.29141373, dec: -34.8952067, mag: 4.81, ci: 0.987, },
		    '469674': { id: '469674', con: 'Tau', name: '', ra: 5.9665712, dec: 25.95391053, mag: 4.81, ci: -0.088, },
		    '147474': { id: '147474', con: 'Phe', name: '', ra: 1.95280068, dec: -47.38528101, mag: 4.82, ci: 0.864, },
		    '387024': { id: '387024', con: 'Aur', name: '', ra: 5.22381094, dec: 38.48449266, mag: 4.82, ci: 0.189, },
		    '70640': { id: '70640', con: 'Cas', name: '', ra: 0.9167102, dec: 58.97269068, mag: 4.83, ci: 1.216, },
		    '110435': { id: '110435', con: 'And', name: '', ra: 1.46093901, dec: 45.40669377, mag: 4.83, ci: 0.421, },
		    '201071': { id: '201071', con: 'Cet', name: '', ra: 2.65939407, dec: -11.87216242, mag: 4.83, ci: 0.447, },
		    '208428': { id: '208428', con: 'Hyi', name: '', ra: 2.75906522, dec: -67.61661821, mag: 4.83, ci: 0.058, },
		    '113553': { id: '113553', con: 'Psc', name: '', ra: 1.50308748, dec: 6.14382228, mag: 4.84, ci: 1.372, },
		    '167907': { id: '167907', con: 'And', name: '', ra: 2.22036742, dec: 44.23165221, mag: 4.84, ci: 1.476, },
		    '172750': { id: '172750', con: 'Tri', name: '', ra: 2.28423102, dec: 34.22423504, mag: 4.84, ci: 0.607, },
		    '245474': { id: '245474', con: 'Cet', name: '', ra: 3.32269352, dec: 3.37019796, mag: 4.84, ci: 0.681, },
		    '307906': { id: '307906', con: 'Tau', name: '', ra: 4.23232804, dec: 9.26385629, mag: 4.84, ci: 0.799, },
		    '436653': { id: '436653', con: 'Tau', name: '', ra: 5.68825446, dec: 16.53414321, mag: 4.84, ci: -0.125, },
		    '237270': { id: '237270', con: 'Cas', name: '', ra: 3.19896196, dec: 74.39366357, mag: 4.85, ci: 0.035, },
		    '244769': { id: '244769', con: 'Per', name: '', ra: 3.31217403, dec: 34.22265255, mag: 4.85, ci: 1.491, },
		    '36953': { id: '36953', con: 'Scl', name: '', ra: 0.46547138, dec: -33.00716675, mag: 4.86, ci: 1.634, },
		    '244405': { id: '244405', con: 'Eri', name: '', ra: 3.30613973, dec: -22.51111332, mag: 4.86, ci: 0.904, },
		    '104137': { id: '104137', con: 'And', name: 'Adhil', ra: 1.37233885, dec: 45.52877917, mag: 4.87, ci: 1.077, },
		    '196442': { id: '196442', con: 'Cet', name: '', ra: 2.5979089, dec: 5.59324309, mag: 4.87, ci: 0.88, },
		    '240570': { id: '240570', con: 'Ari', name: '', ra: 3.24836039, dec: 21.04444737, mag: 4.87, ci: -0.007, },
		    '308453': { id: '308453', con: 'Eri', name: '', ra: 4.23991302, dec: -10.25627447, mag: 4.87, ci: 1.156, },
		    '184069': { id: '184069', con: 'Cet', name: '', ra: 2.43250153, dec: -12.29047913, mag: 4.88, ci: -0.027, },
		    '411416': { id: '411416', con: 'Tau', name: '', ra: 5.46057936, dec: 21.9369655, mag: 4.88, ci: -0.14, },
		    '451180': { id: '451180', con: 'Tau', name: '', ra: 5.81693303, dec: 24.56749571, mag: 4.88, ci: 1.021, },
		    '459385': { id: '459385', con: 'Col', name: '', ra: 5.88524477, dec: -33.80136396, mag: 4.88, ci: -0.154, },
		    '15072': { id: '15072', con: 'Cet', name: '', ra: 0.18773843, dec: -15.46798074, mag: 4.89, ci: 0.487, },
		    '350958': { id: '350958', con: 'Per', name: '', ra: 4.83184381, dec: 37.48827429, mag: 4.89, ci: 1.447, },
		    '406329': { id: '406329', con: 'Ori', name: '', ra: 5.41245208, dec: 1.84644655, mag: 4.89, ci: -0.2, },
		    '452233': { id: '452233', con: 'Tau', name: '', ra: 5.82581424, dec: 12.65132162, mag: 4.89, ci: -0.068, },
		    '62932': { id: '62932', con: 'Cas', name: '', ra: 0.813892, dec: 50.968168, mag: 4.9, ci: -0.091, },
		    '108061': { id: '108061', con: 'Cet', name: '', ra: 1.42700965, dec: -14.59879184, mag: 4.9, ci: 1.231, },
		    '438677': { id: '438677', con: 'Ori', name: '', ra: 5.70795313, dec: 1.47462815, mag: 4.9, ci: 1.144, },
		    '204437': { id: '204437', con: 'Per', name: '', ra: 2.70414291, dec: 40.19394211, mag: 4.91, ci: 0.582, },
		    '329107': { id: '329107', con: 'Eri', name: '', ra: 4.53129638, dec: -0.04401134, mag: 4.91, ci: 1.32, },
		    '367183': { id: '367183', con: 'Lep', name: '', ra: 5.02377237, dec: -20.05191858, mag: 4.91, ci: -0.047, },
		    '376943': { id: '376943', con: 'Tau', name: '', ra: 5.12416863, dec: 18.64505359, mag: 4.91, ci: 0.657, },
		    '146818': { id: '146818', con: 'Cet', name: '', ra: 1.94449941, dec: -22.52678333, mag: 4.92, ci: 1.434, },
		    '478257': { id: '478257', con: 'Mon', name: '', ra: 6.03067233, dec: -10.59793171, mag: 4.92, ci: -0.128, },
		    '485371': { id: '485371', con: 'Lep', name: '', ra: 6.08309131, dec: -16.48443605, mag: 4.92, ci: 0.196, },
		    '304320': { id: '304320', con: 'Hor', name: '', ra: 4.18071752, dec: -41.99357969, mag: 4.93, ci: 0.334, },
		    '311851': { id: '311851', con: 'Tau', name: '', ra: 4.28768372, dec: 20.57859111, mag: 4.93, ci: 0.259, },
		    '315502': { id: '315502', con: 'Per', name: '', ra: 4.34017751, dec: 34.56672423, mag: 4.93, ci: 0.95, },
		    '363945': { id: '363945', con: 'Aur', name: '', ra: 4.98761395, dec: 37.89024289, mag: 4.93, ci: 0.037, },
		    '166809': { id: '166809', con: 'Tri', name: '', ra: 2.20618823, dec: 30.30307391, mag: 4.94, ci: 0.77, },
		    '223568': { id: '223568', con: 'Per', name: '', ra: 2.98435472, dec: 35.18312749, mag: 4.94, ci: 1.235, },
		    '56403': { id: '56403', con: 'Cas', name: '', ra: 0.72446405, dec: 47.02454596, mag: 4.95, ci: 0.17, },
		    '101401': { id: '101401', con: 'Cas', name: '', ra: 1.33469928, dec: 58.23161207, mag: 4.95, ci: 0.683, },
		    '288242': { id: '288242', con: 'Cam', name: '', ra: 3.957067, dec: 63.072264, mag: 4.95, ci: -0.074, },
		    '435866': { id: '435866', con: 'Ori', name: '', ra: 5.68075393, dec: -1.12878491, mag: 4.95, ci: -0.197, },
		    '126335': { id: '126335', con: 'And', name: '', ra: 1.67633803, dec: 40.57704845, mag: 4.96, ci: -0.068, },
		    '127819': { id: '127819', con: 'And', name: '', ra: 1.69643213, dec: 42.61343591, mag: 4.96, ci: 0.618, },
		    '193956': { id: '193956', con: 'For', name: '', ra: 2.56408607, dec: -28.23234541, mag: 4.96, ci: -0.05, },
		    '247735': { id: '247735', con: 'Per', name: '', ra: 3.35737714, dec: 43.32965275, mag: 4.96, ci: 0.051, },
		    '324944': { id: '324944', con: 'Tau', name: '', ra: 4.47399133, dec: 16.35967857, mag: 4.96, ci: 1.137, },
		    '396861': { id: '396861', con: 'Tau', name: '', ra: 5.32127821, dec: 22.09649646, mag: 4.96, ci: 0.937, },
		    '462767': { id: '462767', con: 'Aur', name: '', ra: 5.914107, dec: 55.706947, mag: 4.96, ci: 0.052, },
		    '95540': { id: '95540', con: 'Phe', name: '', ra: 1.25308924, dec: -45.53166556, mag: 4.97, ci: 0.571, },
		    '145959': { id: '145959', con: 'Cas', name: '', ra: 1.9333399, dec: 68.68524096, mag: 4.97, ci: -0.084, },
		    '270955': { id: '270955', con: 'Per', name: '', ra: 3.7062905, dec: 33.96502764, mag: 4.97, ci: -0.048, },
		    '292918': { id: '292918', con: 'Ret', name: '', ra: 4.02170844, dec: -61.07882052, mag: 4.97, ci: 1.386, },
		    '315445': { id: '315445', con: 'Tau', name: '', ra: 4.33922658, dec: 27.35075106, mag: 4.97, ci: 1.15, },
		    '464104': { id: '464104', con: 'Col', name: '', ra: 5.92497654, dec: -37.12066004, mag: 4.97, ci: 1.102, },
		    '128992': { id: '128992', con: 'Cet', name: '', ra: 1.71208626, dec: -3.6901993, mag: 4.98, ci: 1.378, },
		    '163039': { id: '163039', con: 'Ari', name: '', ra: 2.15703715, dec: 25.9398814, mag: 4.98, ci: 0.339, },
		    '223288': { id: '223288', con: 'Hor', name: '', ra: 2.97994322, dec: -64.07128778, mag: 4.98, ci: 0.126, },
		    '375625': { id: '375625', con: 'Aur', name: '', ra: 5.11128627, dec: 51.59771918, mag: 4.98, ci: 0.343, },
		    '425531': { id: '425531', con: 'Ori', name: '', ra: 5.587728, dec: -5.387315, mag: 4.98, ci: 0, },
		    '425750': { id: '425750', con: 'Ori', name: '', ra: 5.58969453, dec: -5.41605396, mag: 4.98, ci: -0.097, },
		    '6116': { id: '6116', con: 'Cet', name: '', ra: 0.07503306, dec: -10.50952282, mag: 4.99, ci: 1.619, },
		    '154043': { id: '154043', con: 'Per', name: '', ra: 2.038359, dec: 54.487541, mag: 4.99, ci: -0.071, },
		    '255071': { id: '255071', con: 'Per', name: '', ra: 3.46751939, dec: 49.06286921, mag: 4.99, ci: -0.091, },
		    '270780': { id: '270780', con: 'For', name: '', ra: 3.70413947, dec: -31.93836125, mag: 4.99, ci: -0.159, },
		    '287932': { id: '287932', con: 'Cam', name: '', ra: 3.9523118, dec: 61.10894213, mag: 4.99, ci: 1.435, },
		    '337278': { id: '337278', con: 'Eri', name: '', ra: 4.64820988, dec: -12.12312359, mag: 4.99, ci: 0.074, },
		    '402901': { id: '402901', con: 'Ori', name: '', ra: 5.38055594, dec: 3.54444725, mag: 4.99, ci: -0.096, },
		    '296718': { id: '296718', con: 'Cam', name: '', ra: 4.0742117, dec: 59.15550714, mag: 5, ci: 0.495, },
		    '405791': { id: '405791', con: 'Tau', name: '', ra: 5.40707323, dec: 17.38353466, mag: 5, ci: 0.544, },
		    '491231': { id: '491231', con: 'Col', name: 'Elkurud', ra: 6.12545339, dec: -37.25292059, mag: 5, ci: -0.095, },
		    '13877': { id: '13877', con: 'And', name: '', ra: 0.17201288, dec: 46.07227305, mag: 5.01, ci: 0.405, },
		    '37109': { id: '37109', con: 'Psc', name: '', ra: 0.46747634, dec: 17.8931235, mag: 5.01, ci: 1.584, },
		    '124802': { id: '124802', con: 'And', name: '', ra: 1.65583332, dec: 44.38615816, mag: 5.01, ci: 0.883, },
		    '368336': { id: '368336', con: 'Lep', name: '', ra: 5.03606155, dec: -26.27503082, mag: 5.01, ci: 1.056, },
		    '390396': { id: '390396', con: 'Aur', name: '', ra: 5.25677635, dec: 32.68759618, mag: 5.01, ci: 0.222, },
		    '325399': { id: '325399', con: 'Tau', name: '', ra: 4.4806011, dec: 13.04760369, mag: 5.02, ci: 0.215, },
		    '406180': { id: '406180', con: 'Aur', name: '', ra: 5.41087254, dec: 37.38534706, mag: 5.02, ci: 1.445, },
		    '159434': { id: '159434', con: 'Ari', name: '', ra: 2.10942365, dec: 22.64831392, mag: 5.03, ci: 0.121, },
		    '351353': { id: '351353', con: 'Eri', name: '', ra: 4.8365601, dec: -16.21715493, mag: 5.03, ci: 0.992, },
		    '481377': { id: '481377', con: 'Lep', name: '', ra: 6.0543343, dec: -26.28454181, mag: 5.03, ci: 1.335, },
		    '3262': { id: '3262', con: 'Scl', name: '', ra: 0.03886746, dec: -29.72041312, mag: 5.04, ci: -0.15, },
		    '86883': { id: '86883', con: 'And', name: '', ra: 1.13356909, dec: 43.94209444, mag: 5.04, ci: 0.109, },
		    '133344': { id: '133344', con: 'Eri', name: '', ra: 1.76840657, dec: -53.52203884, mag: 5.04, ci: 0.031, },
		    '242008': { id: '242008', con: 'Per', name: '', ra: 3.27005623, dec: 50.93766153, mag: 5.04, ci: 1.107, },
		    '341024': { id: '341024', con: 'Cae', name: '', ra: 4.70096677, dec: -37.14429188, mag: 5.04, ci: 0.391, },
		    '472052': { id: '472052', con: 'Mon', name: '', ra: 5.98453137, dec: -9.55825367, mag: 5.04, ci: 0.189, },
		    '490115': { id: '490115', con: 'Pic', name: '', ra: 6.11760778, dec: -62.15458046, mag: 5.04, ci: 1.256, },
		    '245232': { id: '245232', con: 'Per', name: '', ra: 3.31878832, dec: 50.09496312, mag: 5.05, ci: -0.067, },
		    '278635': { id: '278635', con: 'Tau', name: 'Pleione', ra: 3.81978241, dec: 24.13670934, mag: 5.05, ci: -0.082, },
		    '372800': { id: '372800', con: 'Pic', name: '', ra: 5.08278152, dec: -49.577836, mag: 5.05, ci: 1.484, },
		    '398113': { id: '398113', con: 'Aur', name: '', ra: 5.33358964, dec: 33.95805774, mag: 5.05, ci: 0.287, },
		    '270674': { id: '270674', con: 'Cam', name: '', ra: 3.70258996, dec: 63.21680745, mag: 5.06, ci: 1.651, },
		    '390393': { id: '390393', con: 'Lep', name: '', ra: 5.25677019, dec: -26.94350923, mag: 5.06, ci: -0.067, },
		    '401066': { id: '401066', con: 'Lep', name: '', ra: 5.36284546, dec: -24.77297825, mag: 5.06, ci: 0.662, },
		    '494056': { id: '494056', con: 'Dor', name: '', ra: 6.14562849, dec: -68.84341216, mag: 5.06, ci: -0.072, },
		    '43085': { id: '43085', con: 'Tuc', name: '', ra: 0.54552924, dec: -63.03150422, mag: 5.07, ci: 0.038, },
		    '63098': { id: '63098', con: 'Psc', name: '', ra: 0.81630804, dec: 16.94064534, mag: 5.07, ci: 0.502, },
		    '238216': { id: '238216', con: 'Cet', name: '', ra: 3.21289894, dec: -1.19610464, mag: 5.07, ci: 0.575, },
		    '327780': { id: '327780', con: 'Cae', name: '', ra: 4.51391676, dec: -44.95375186, mag: 5.07, ci: -0.194, },
		    '338538': { id: '338538', con: 'Cam', name: '', ra: 4.66518916, dec: 53.07953438, mag: 5.07, ci: 1.079, },
		    '405894': { id: '405894', con: 'Ori', name: '', ra: 5.40802905, dec: -0.89133988, mag: 5.07, ci: 0.961, },
		    '47261': { id: '47261', con: 'Cas', name: '', ra: 0.602306, dec: 54.16845, mag: 5.08, ci: -0.098, },
		    '277588': { id: '277588', con: 'Tau', name: '', ra: 3.80451826, dec: 11.14329982, mag: 5.08, ci: -0.125, },
		    '337595': { id: '337595', con: 'Tau', name: '', ra: 4.65256073, dec: 15.79986376, mag: 5.08, ci: 0.141, },
		    '352945': { id: '352945', con: 'Tau', name: '', ra: 4.85623931, dec: 18.83986323, mag: 5.08, ci: 0.214, },
		    '402423': { id: '402423', con: 'Cam', name: '', ra: 5.37598166, dec: 79.23114744, mag: 5.08, ci: 0.506, },
		    '411443': { id: '411443', con: 'Aur', name: '', ra: 5.46080142, dec: 34.47589104, mag: 5.08, ci: 1.4, },
		    '497734': { id: '497734', con: 'Men', name: '', ra: 6.17068728, dec: -74.7530456, mag: 5.08, ci: 0.714, },
		    '62622': { id: '62622', con: 'Hyi', name: '', ra: 0.8098371, dec: -74.9234348, mag: 5.09, ci: 1.345, },
		    '147699': { id: '147699', con: 'Ari', name: '', ra: 1.9558485, dec: 17.81753216, mag: 5.09, ci: 0.921, },
		    '257250': { id: '257250', con: 'Cam', name: '', ra: 3.500057, dec: 55.451808, mag: 5.09, ci: 0.022, },
		    '365536': { id: '365536', con: 'Cep', name: '', ra: 5.00575587, dec: 81.19408681, mag: 5.09, ci: 1.304, },
		    '221642': { id: '221642', con: 'Per', name: '', ra: 2.95480049, dec: 31.93421934, mag: 5.1, ci: -0.007, },
		    '249185': { id: '249185', con: 'Ari', name: '', ra: 3.3792339, dec: 20.74206658, mag: 5.1, ci: 1.231, },
		    '303391': { id: '303391', con: 'Cep', name: '', ra: 4.16745463, dec: 80.69863086, mag: 5.1, ci: 0.589, },
		    '319593': { id: '319593', con: 'Tau', name: '', ra: 4.39772903, dec: 9.46096563, mag: 5.1, ci: 0.074, },
		    '452872': { id: '452872', con: 'Dor', name: '', ra: 5.83153365, dec: -66.90118487, mag: 5.1, ci: -0.128, },
		    '112811': { id: '112811', con: 'Cet', name: '', ra: 1.49337, dec: -21.629339, mag: 5.11, ci: 0.028, },
		    '283807': { id: '283807', con: 'Eri', name: '', ra: 3.89415167, dec: -34.73229983, mag: 5.11, ci: -0.133, },
		    '379076': { id: '379076', con: 'Eri', name: '', ra: 5.1454717, dec: -4.45621143, mag: 5.11, ci: 0.455, },
		    '143862': { id: '143862', con: 'Phe', name: '', ra: 1.90612049, dec: -42.49694548, mag: 5.12, ci: -0.06, },
		    '228342': { id: '228342', con: 'Hor', name: '', ra: 3.06022791, dec: -59.73777581, mag: 5.12, ci: 0.349, },
		    '375769': { id: '375769', con: 'Eri', name: '', ra: 5.112681, dec: -4.655163, mag: 5.12, ci: -0.059, },
		    '2536': { id: '2536', con: 'Psc', name: '', ra: 0.03040227, dec: -3.02750332, mag: 5.13, ci: -0.128, },
		    '19316': { id: '19316', con: 'Cet', name: '', ra: 0.24100777, dec: -7.78052668, mag: 5.13, ci: 1.601, },
		    '98624': { id: '98624', con: 'Psc', name: '', ra: 1.29665454, dec: 3.61446437, mag: 5.13, ci: 0.071, },
		    '186683': { id: '186683', con: 'For', name: '', ra: 2.46713975, dec: -33.81103858, mag: 5.13, ci: 0.089, },
		    '251290': { id: '251290', con: 'Cam', name: '', ra: 3.41126598, dec: 64.58599735, mag: 5.13, ci: 2.038, },
		    '425553': { id: '425553', con: 'Ori', name: '', ra: 5.58790643, dec: -5.38977294, mag: 5.13, ci: 0.02, },
		    '48078': { id: '48078', con: 'And', name: '', ra: 0.61290038, dec: 44.48859088, mag: 5.14, ci: 1.587, },
		    '94596': { id: '94596', con: 'Cet', name: '', ra: 1.2400113, dec: -7.92282222, mag: 5.14, ci: 0.448, },
		    '257679': { id: '257679', con: 'Tau', name: '', ra: 3.50679696, dec: 11.33643928, mag: 5.14, ci: -0.041, },
		    '279039': { id: '279039', con: 'Per', name: '', ra: 3.82574691, dec: 33.09138818, mag: 5.14, ci: 0.057, },
		    '409108': { id: '409108', con: 'Dor', name: '', ra: 5.4386851, dec: -58.91251862, mag: 5.14, ci: 0.986, },
		    '481825': { id: '481825', con: 'Ori', name: '', ra: 6.05760177, dec: 19.69055971, mag: 5.14, ci: -0.097, },
		    '90666': { id: '90666', con: 'Psc', name: '', ra: 1.18521287, dec: 31.42473908, mag: 5.15, ci: 0.261, },
		    '153288': { id: '153288', con: 'Phe', name: '', ra: 2.02843771, dec: -44.71350768, mag: 5.15, ci: 1.471, },
		    '191752': { id: '191752', con: 'Tri', name: '', ra: 2.5350474, dec: 36.14726687, mag: 5.15, ci: 1.472, },
		    '28120': { id: '28120', con: 'And', name: '', ra: 0.35201898, dec: 37.96860444, mag: 5.16, ci: 0.442, },
		    '179426': { id: '179426', con: 'Per', name: '', ra: 2.37262065, dec: 55.84565729, mag: 5.16, ci: 0.369, },
		    '220919': { id: '220919', con: 'Eri', name: '', ra: 2.94372864, dec: -3.71231655, mag: 5.16, ci: 0.084, },
		    '244670': { id: '244670', con: 'Per', name: '', ra: 3.31048357, dec: 50.22217115, mag: 5.16, ci: -0.073, },
		    '454851': { id: '454851', con: 'Pic', name: '', ra: 5.84811695, dec: -52.10887334, mag: 5.16, ci: 0.96, },
		    '40079': { id: '40079', con: 'Cet', name: '', ra: 0.506293, dec: -23.78768, mag: 5.17, ci: 0.128, },
		    '64507': { id: '64507', con: 'Cet', name: '', ra: 0.83544191, dec: -10.64432723, mag: 5.17, ci: 0.514, },
		    '87200': { id: '87200', con: 'Cas', name: '', ra: 1.13787907, dec: 54.92029007, mag: 5.17, ci: 0.704, },
		    '199189': { id: '199189', con: 'Cas', name: '', ra: 2.63389792, dec: 72.81825148, mag: 5.17, ci: 0.896, },
		    '207744': { id: '207744', con: 'Ari', name: '', ra: 2.74932797, dec: 12.44576007, mag: 5.17, ci: 0.234, },
		    '319367': { id: '319367', con: 'Eri', name: '', ra: 4.39468118, dec: -3.74547168, mag: 5.17, ci: 0.072, },
		    '28642': { id: '28642', con: 'Scl', name: '', ra: 0.35866622, dec: -28.98146943, mag: 5.18, ci: 1.006, },
		    '37340': { id: '37340', con: 'And', name: '', ra: 0.4704599, dec: 44.39445759, mag: 5.18, ci: 0.043, },
		    '129241': { id: '129241', con: 'Cas', name: '', ra: 1.7155168, dec: 70.62252745, mag: 5.18, ci: -0.022, },
		    '299260': { id: '299260', con: 'Tau', name: '', ra: 4.11011442, dec: 27.59990174, mag: 5.18, ci: -0.124, },
		    '357521': { id: '357521', con: 'Ori', name: '', ra: 4.91302678, dec: 11.42601608, mag: 5.18, ci: 0.121, },
		    '384104': { id: '384104', con: 'Ori', name: '', ra: 5.19487882, dec: 16.04567266, mag: 5.18, ci: 1.525, },
		    '419153': { id: '419153', con: 'Men', name: '', ra: 5.5313747, dec: -76.34097434, mag: 5.18, ci: 1.13, },
		    '433852': { id: '433852', con: 'Tau', name: '', ra: 5.66227786, dec: 25.89709329, mag: 5.18, ci: -0.15, },
		    '445404': { id: '445404', con: 'Col', name: '', ra: 5.76663746, dec: -32.30643822, mag: 5.18, ci: -0.274, },
		    '179674': { id: '179674', con: 'For', name: '', ra: 2.375704, dec: -23.816326, mag: 5.19, ci: 0.608, },
		    '182106': { id: '182106', con: 'And', name: '', ra: 2.40692126, dec: 50.00654637, mag: 5.19, ci: 0.979, },
		    '377142': { id: '377142', con: 'Dor', name: '', ra: 5.12611819, dec: -63.39967955, mag: 5.19, ci: 1.646, },
		    '483626': { id: '483626', con: 'Mon', name: '', ra: 6.07041719, dec: -6.70894165, mag: 5.19, ci: -0.066, },
		    '39730': { id: '39730', con: 'And', name: '', ra: 0.50204588, dec: 29.75155887, mag: 5.2, ci: 0.271, },
		    '46167': { id: '46167', con: 'Cet', name: '', ra: 0.58746776, dec: -3.59281795, mag: 5.2, ci: 0.567, },
		    '311190': { id: '311190', con: 'Cam', name: '', ra: 4.27863595, dec: 53.61179812, mag: 5.2, ci: 0.052, },
		    '331839': { id: '331839', con: 'Eri', name: '', ra: 4.56989689, dec: -8.2313524, mag: 5.2, ci: 1.708, },
		    '463004': { id: '463004', con: 'Cam', name: '', ra: 5.91606336, dec: 59.88836738, mag: 5.2, ci: 0.01, },
		    '86627': { id: '86627', con: 'Phe', name: '', ra: 1.12995872, dec: -41.48689922, mag: 5.21, ci: 0.159, },
		    '93775': { id: '93775', con: 'Psc', name: 'Revati', ra: 1.22885739, dec: 7.57535872, mag: 5.21, ci: 0.32, },
		    '202457': { id: '202457', con: 'Hor', name: '', ra: 2.67766998, dec: -54.54991192, mag: 5.21, ci: 0.411, },
		    '299751': { id: '299751', con: 'Tau', name: '', ra: 4.11679325, dec: 29.00130375, mag: 5.21, ci: 0.359, },
		    '471487': { id: '471487', con: 'Ori', name: '', ra: 5.98043694, dec: 0.55297829, mag: 5.21, ci: 0.009, },
		    '57919': { id: '57919', con: 'Cet', name: '', ra: 0.74566521, dec: -22.00613698, mag: 5.22, ci: 0.35, },
		    '158147': { id: '158147', con: 'Cas', name: '', ra: 2.09209778, dec: 76.1150589, mag: 5.22, ci: 0.954, },
		    '223181': { id: '223181', con: 'Eri', name: '', ra: 2.97835488, dec: -2.78288569, mag: 5.22, ci: 0.014, },
		    '308719': { id: '308719', con: 'Tau', name: '', ra: 4.24339816, dec: 10.01140764, mag: 5.22, ci: -0.085, },
		    '335780': { id: '335780', con: 'Eri', name: '', ra: 4.62670325, dec: -2.47354766, mag: 5.22, ci: 0.283, },
		    '374723': { id: '374723', con: 'Cam', name: '', ra: 5.102349, dec: 58.972372, mag: 5.22, ci: -0.08, },
		    '401138': { id: '401138', con: 'Aur', name: '', ra: 5.36344896, dec: 41.80457865, mag: 5.22, ci: -0.129, },
		    '102673': { id: '102673', con: 'Psc', name: '', ra: 1.35204801, dec: 28.73820688, mag: 5.23, ci: 1.396, },
		    '167370': { id: '167370', con: 'Ari', name: '', ra: 2.21335686, dec: 21.21099295, mag: 5.23, ci: 0.457, },
		    '231548': { id: '231548', con: 'Eri', name: '', ra: 3.10930337, dec: -6.08855335, mag: 5.23, ci: 1.575, },
		    '15744': { id: '15744', con: 'Scl', name: '', ra: 0.19555809, dec: -35.13311562, mag: 5.24, ci: 0.459, },
		    '65194': { id: '65194', con: 'Phe', name: '', ra: 0.84477403, dec: -50.98681445, mag: 5.24, ci: 0.356, },
		    '128713': { id: '128713', con: 'Psc', name: '', ra: 1.70826759, dec: 20.26851628, mag: 5.24, ci: 0.836, },
		    '225506': { id: '225506', con: 'Per', name: '', ra: 3.014501, dec: 52.351744, mag: 5.24, ci: -0.049, },
		    '244224': { id: '244224', con: 'Ret', name: '', ra: 3.303309, dec: -62.506363, mag: 5.24, ci: 0.6, },
		    '264206': { id: '264206', con: 'Eri', name: '', ra: 3.60483601, dec: -17.46706696, mag: 5.24, ci: -0.117, },
		    '273369': { id: '273369', con: 'Eri', name: '', ra: 3.74180831, dec: -1.16309127, mag: 5.24, ci: -0.088, },
		    '276907': { id: '276907', con: 'Eri', name: '', ra: 3.79434768, dec: -23.87467618, mag: 5.24, ci: 0.075, },
		    '279983': { id: '279983', con: 'Tau', name: '', ra: 3.83859554, dec: 25.57938512, mag: 5.24, ci: 0.231, },
		    '317289': { id: '317289', con: 'Ret', name: '', ra: 4.36481247, dec: -63.38639156, mag: 5.24, ci: 0.955, },
		    '331841': { id: '331841', con: 'Eri', name: '', ra: 4.56993635, dec: -8.97025902, mag: 5.24, ci: 1.465, },
		    '404041': { id: '404041', con: 'Cam', name: '', ra: 5.391065, dec: 57.544395, mag: 5.24, ci: -0.011, },
		    '426285': { id: '426285', con: 'Ori', name: '', ra: 5.59430113, dec: -4.85606611, mag: 5.24, ci: 0.269, },
		    '128265': { id: '128265', con: 'Scl', name: '', ra: 1.70238903, dec: -32.32692048, mag: 5.25, ci: 1.044, },
		    '171393': { id: '171393', con: 'Tri', name: '', ra: 2.26563455, dec: 33.35889664, mag: 5.25, ci: -0.004, },
		    '212471': { id: '212471', con: 'Hor', name: '', ra: 2.81707971, dec: -62.80652554, mag: 5.25, ci: 0.101, },
		    '404119': { id: '404119', con: 'Lep', name: '', ra: 5.39171057, dec: -13.92735787, mag: 5.25, ci: -0.219, },
		    '212779': { id: '212779', con: 'Ari', name: '', ra: 2.82154423, dec: 17.46431255, mag: 5.26, ci: -0.066, },
		    '229041': { id: '229041', con: 'Eri', name: '', ra: 3.07125426, dec: -7.60085634, mag: 5.26, ci: 0.193, },
		    '315691': { id: '315691', con: 'Tau', name: '', ra: 4.34341947, dec: 15.09544997, mag: 5.26, ci: 0.225, },
		    '315762': { id: '315762', con: 'Cam', name: '', ra: 4.34453496, dec: 65.14044005, mag: 5.26, ci: 0.82, },
		    '449228': { id: '449228', con: 'Ori', name: '', ra: 5.80005793, dec: 6.45401463, mag: 5.26, ci: 0.234, },
		    '113435': { id: '113435', con: 'And', name: '', ra: 1.50169517, dec: 47.00727721, mag: 5.27, ci: 0.999, },
		    '157644': { id: '157644', con: 'Cas', name: '', ra: 2.08538257, dec: 77.28131341, mag: 5.27, ci: 0.345, },
		    '167513': { id: '167513', con: 'For', name: '', ra: 2.2151305, dec: -30.72382563, mag: 5.27, ci: -0.013, },
		    '191028': { id: '191028', con: 'Cet', name: '', ra: 2.52502667, dec: 2.26718375, mag: 5.27, ci: 1.271, },
		    '191251': { id: '191251', con: 'Hyi', name: '', ra: 2.52791922, dec: -79.109391, mag: 5.27, ci: 0.981, },
		    '247484': { id: '247484', con: 'Ari', name: '', ra: 3.35378492, dec: 21.1470741, mag: 5.27, ci: -0.067, },
		    '321391': { id: '321391', con: 'Tau', name: '', ra: 4.42361562, dec: 22.20000213, mag: 5.27, ci: 0.25, },
		    '123786': { id: '123786', con: 'Cas', name: '', ra: 1.64192143, dec: 73.04003806, mag: 5.28, ci: 0.972, },
		    '287299': { id: '287299', con: 'Per', name: '', ra: 3.94347817, dec: 50.69537389, mag: 5.28, ci: 0.425, },
		    '293200': { id: '293200', con: 'Eri', name: '', ra: 4.02556943, dec: -1.54965781, mag: 5.28, ci: -0.133, },
		    '343787': { id: '343787', con: 'Dor', name: '', ra: 4.73920955, dec: -59.73273338, mag: 5.28, ci: 0.206, },
		    '377564': { id: '377564', con: 'Tau', name: '', ra: 5.13011121, dec: 20.41837464, mag: 5.28, ci: 0.118, },
		    '430191': { id: '430191', con: 'Col', name: '', ra: 5.62906057, dec: -28.68969279, mag: 5.28, ci: 0.486, },
		    '448697': { id: '448697', con: 'Tau', name: '', ra: 5.79525208, dec: 13.89960445, mag: 5.28, ci: -0.156, },
		    '491618': { id: '491618', con: 'Lep', name: '', ra: 6.12823295, dec: -19.16586133, mag: 5.28, ci: 1.661, },
		    '13492': { id: '13492', con: 'Oct', name: '', ra: 0.16727079, dec: -82.22404825, mag: 5.29, ci: 1.049, },
		    '16311': { id: '16311', con: 'Cet', name: '', ra: 0.20277334, dec: -17.93828415, mag: 5.29, ci: 1.478, },
		    '132724': { id: '132724', con: 'Scl', name: '', ra: 1.760763, dec: -25.05261, mag: 5.29, ci: 0.395, },
		    '150611': { id: '150611', con: 'Cas', name: '', ra: 1.99390029, dec: 64.62160223, mag: 5.29, ci: 0.002, },
		    '175057': { id: '175057', con: 'Tri', name: '', ra: 2.31583166, dec: 28.64267444, mag: 5.29, ci: 0.037, },
		    '178909': { id: '178909', con: 'Cet', name: '', ra: 2.36573003, dec: 0.39567244, mag: 5.29, ci: 1.648, },
		    '186836': { id: '186836', con: 'Tri', name: '', ra: 2.46943908, dec: 29.66933261, mag: 5.29, ci: 0.311, },
		    '307484': { id: '307484', con: 'Tau', name: '', ra: 4.22586237, dec: 7.71604986, mag: 5.29, ci: 0.366, },
		    '322233': { id: '322233', con: 'Per', name: '', ra: 4.43508597, dec: 31.43891786, mag: 5.29, ci: 0.986, },
		    '348411': { id: '348411', con: 'Cam', name: '', ra: 4.80007466, dec: 56.75717769, mag: 5.29, ci: 0.246, },
		    '398047': { id: '398047', con: 'Lep', name: '', ra: 5.33306203, dec: -12.3155969, mag: 5.29, ci: -0.104, },
		    '438277': { id: '438277', con: 'Col', name: '', ra: 5.70422064, dec: -34.66781547, mag: 5.29, ci: -0.032, },
		    '462740': { id: '462740', con: 'Pic', name: '', ra: 5.91391447, dec: -52.63548125, mag: 5.29, ci: 0.295, },
		    '53464': { id: '53464', con: 'And', name: '', ra: 0.68532889, dec: 39.45866377, mag: 5.3, ci: 0.891, },
		    '198415': { id: '198415', con: 'Hor', name: '', ra: 2.62343259, dec: -52.54312195, mag: 5.3, ci: 0.289, },
		    '202488': { id: '202488', con: 'Ari', name: '', ra: 2.67807647, dec: 27.06094247, mag: 5.3, ci: 0.081, },
		    '259992': { id: '259992', con: 'Per', name: '', ra: 3.54062755, dec: 46.05686053, mag: 5.3, ci: 0.398, },
		    '341909': { id: '341909', con: 'Pic', name: '', ra: 4.71289537, dec: -50.48133339, mag: 5.3, ci: 0.977, },
		    '342074': { id: '342074', con: 'Per', name: '', ra: 4.71509179, dec: 43.36513597, mag: 5.3, ci: 0.028, },
		    '369166': { id: '369166', con: 'Men', name: '', ra: 5.04527667, dec: -71.3143001, mag: 5.3, ci: 0.996, },
		    '168404': { id: '168404', con: 'And', name: '', ra: 2.22676153, dec: 51.0658162, mag: 5.31, ci: 0.926, },
		    '175469': { id: '175469', con: 'And', name: '', ra: 2.32133211, dec: 47.37997159, mag: 5.31, ci: 0.006, },
		    '446293': { id: '446293', con: 'Pic', name: '', ra: 5.77427031, dec: -46.59717925, mag: 5.31, ci: 1.04, },
		    '90102': { id: '90102', con: 'Cas', name: '', ra: 1.17758918, dec: 68.77861435, mag: 5.32, ci: -0.014, },
		    '227400': { id: '227400', con: 'Eri', name: '', ra: 3.04507838, dec: -7.68547124, mag: 5.32, ci: 0.941, },
		    '249725': { id: '249725', con: 'Per', name: '', ra: 3.38699839, dec: 49.21326436, mag: 5.32, ci: -0.076, },
		    '295888': { id: '295888', con: 'Tau', name: '', ra: 4.06239044, dec: 5.43562248, mag: 5.32, ci: -0.08, },
		    '335357': { id: '335357', con: 'Tau', name: '', ra: 4.6204647, dec: 0.99831341, mag: 5.32, ci: -0.107, },
		    '423621': { id: '423621', con: 'Ori', name: '', ra: 5.57132641, dec: 3.76688998, mag: 5.32, ci: 0.051, },
		    '84090': { id: '84090', con: 'Psc', name: '', ra: 1.09471115, dec: 21.47316687, mag: 5.33, ci: 0.003, },
		    '314174': { id: '314174', con: 'Hor', name: '', ra: 4.32130476, dec: -44.2679168, mag: 5.33, ci: 1.066, },
		    '355658': { id: '355658', con: 'Ori', name: '', ra: 4.88965886, dec: 2.50822402, mag: 5.33, ci: 1.632, },
		    '357541': { id: '357541', con: 'Ori', name: '', ra: 4.91327256, dec: 7.77909863, mag: 5.33, ci: 1.214, },
		    '377684': { id: '377684', con: 'Ori', name: '', ra: 5.13135647, dec: 8.49846569, mag: 5.33, ci: 0.338, },
		    '152726': { id: '152726', con: 'For', name: '', ra: 2.02075619, dec: -30.00183186, mag: 5.34, ci: 0.883, },
		    '217726': { id: '217726', con: 'Per', name: '', ra: 2.89517112, dec: 38.33748295, mag: 5.34, ci: 0.423, },
		    '274661': { id: '274661', con: 'Tau', name: '', ra: 3.76123423, dec: 6.04999463, mag: 5.34, ci: -0.099, },
		    '314544': { id: '314544', con: 'Tau', name: '', ra: 4.32686286, dec: 21.77349081, mag: 5.34, ci: -0.107, },
		    '396704': { id: '396704', con: 'Ori', name: '', ra: 5.31978266, dec: 2.59580838, mag: 5.34, ci: 0.412, },
		    '420732': { id: '420732', con: 'Ori', name: '', ra: 5.54482039, dec: -1.59183657, mag: 5.34, ci: -0.188, },
		    '421260': { id: '421260', con: 'Dor', name: '', ra: 5.54988217, dec: -64.22752846, mag: 5.34, ci: 1.039, },
		    '65252': { id: '65252', con: 'Cas', name: '', ra: 0.84544801, dec: 64.24755193, mag: 5.35, ci: 0.528, },
		    '71927': { id: '71927', con: 'Cet', name: '', ra: 0.93374704, dec: -11.26652086, mag: 5.35, ci: 1.505, },
		    '108762': { id: '108762', con: 'Psc', name: '', ra: 1.43757335, dec: 19.17234281, mag: 5.35, ci: 0.395, },
		    '345849': { id: '345849', con: 'Ori', name: '', ra: 4.76715016, dec: 11.70558946, mag: 5.35, ci: 0.197, },
		    '488924': { id: '488924', con: 'Aur', name: '', ra: 6.10974917, dec: 38.48264248, mag: 5.35, ci: 0.251, },
		    '497100': { id: '497100', con: 'Cam', name: '', ra: 6.16639294, dec: 58.93569418, mag: 5.35, ci: 1.096, },
		    '52006': { id: '52006', con: 'Psc', name: '', ra: 0.66543703, dec: 21.43850357, mag: 5.36, ci: 1.16, },
		    '60142': { id: '60142', con: 'Psc', name: '', ra: 0.7758218, dec: 15.47550028, mag: 5.36, ci: 1.559, },
		    '86068': { id: '86068', con: 'Tuc', name: '', ra: 1.12185078, dec: -61.7752927, mag: 5.36, ci: 0.884, },
		    '182712': { id: '182712', con: 'Hor', name: '', ra: 2.41497516, dec: -60.31194697, mag: 5.36, ci: 0.395, },
		    '191827': { id: '191827', con: 'Cet', name: '', ra: 2.53595085, dec: -1.03489431, mag: 5.36, ci: 1.004, },
		    '296370': { id: '296370', con: 'Tau', name: '', ra: 4.06940953, dec: 2.82694308, mag: 5.36, ci: 0.505, },
		    '338604': { id: '338604', con: 'Cam', name: '', ra: 4.666126, dec: 53.473021, mag: 5.36, ci: 0.331, },
		    '422231': { id: '422231', con: 'Ori', name: '', ra: 5.55873552, dec: -1.15607415, mag: 5.36, ci: -0.175, },
		    '455791': { id: '455791', con: 'Ori', name: '', ra: 5.8561066, dec: -7.5180025, mag: 5.36, ci: -0.195, },
		    '133174': { id: '133174', con: 'Cet', name: '', ra: 1.76646113, dec: -5.73329794, mag: 5.37, ci: 1.517, },
		    '369314': { id: '369314', con: 'Pic', name: '', ra: 5.04685732, dec: -49.15140577, mag: 5.37, ci: 0.421, },
		    '425884': { id: '425884', con: 'Tau', name: '', ra: 5.59086896, dec: 24.03959138, mag: 5.37, ci: -0.092, },
		    '489088': { id: '489088', con: 'Mon', name: '', ra: 6.11076031, dec: -4.19383698, mag: 5.37, ci: -0.122, },
		    '27383': { id: '27383', con: 'Psc', name: '', ra: 0.34329494, dec: 8.19027258, mag: 5.38, ci: 1.343, },
		    '32895': { id: '32895', con: 'Cas', name: '', ra: 0.41319579, dec: 61.83105925, mag: 5.38, ci: 0.008, },
		    '42893': { id: '42893', con: 'Psc', name: '', ra: 0.54319054, dec: 20.29431945, mag: 5.38, ci: 1.069, },
		    '55158': { id: '55158', con: 'Tuc', name: '', ra: 0.7078814, dec: -65.4680317, mag: 5.38, ci: 0.515, },
		    '196342': { id: '196342', con: 'Tri', name: '', ra: 2.5963385, dec: 34.68755609, mag: 5.38, ci: 1.652, },
		    '294459': { id: '294459', con: 'Eri', name: '', ra: 4.0435402, dec: -0.26892363, mag: 5.38, ci: 0.516, },
		    '315743': { id: '315743', con: 'Eri', name: '', ra: 4.34417034, dec: -20.63962404, mag: 5.38, ci: -0.027, },
		    '318113': { id: '318113', con: 'Tau', name: '', ra: 4.37637306, dec: 25.62931476, mag: 5.38, ci: -0.041, },
		    '337540': { id: '337540', con: 'Tau', name: '', ra: 4.6517105, dec: 7.87098038, mag: 5.38, ci: 0.257, },
		    '396389': { id: '396389', con: 'Aur', name: '', ra: 5.31667484, dec: 33.74839593, mag: 5.38, ci: -0.167, },
		    '80490': { id: '80490', con: 'Phe', name: '', ra: 1.04699691, dec: -46.39731193, mag: 5.39, ci: 0.9, },
		    '213426': { id: '213426', con: 'For', name: '', ra: 2.83171734, dec: -27.94198354, mag: 5.39, ci: 0.013, },
		    '286489': { id: '286489', con: 'Per', name: '', ra: 3.93282622, dec: 47.8714155, mag: 5.39, ci: -0.073, },
		    '304300': { id: '304300', con: 'Tau', name: '', ra: 4.18051675, dec: 26.4809523, mag: 5.39, ci: 0.352, },
		    '343892': { id: '343892', con: 'Ori', name: '', ra: 4.74050774, dec: 11.14613604, mag: 5.39, ci: 0.251, },
		    '364796': { id: '364796', con: 'Eri', name: '', ra: 4.99734835, dec: -10.26331972, mag: 5.39, ci: 0.797, },
		    '80810': { id: '80810', con: 'Cet', name: '', ra: 1.05070448, dec: -4.83660152, mag: 5.4, ci: 1.106, },
		    '204832': { id: '204832', con: 'Hor', name: '', ra: 2.70929612, dec: -50.8002928, mag: 5.4, ci: 0.561, },
		    '278687': { id: '278687', con: 'Cam', name: '', ra: 3.82048213, dec: 70.87104592, mag: 5.4, ci: 0.096, },
		    '317168': { id: '317168', con: 'Cam', name: '', ra: 4.36323662, dec: 60.73562407, mag: 5.4, ci: 1.497, },
		    '327509': { id: '327509', con: 'Tau', name: '', ra: 4.51037884, dec: 13.72440177, mag: 5.4, ci: 0.263, },
		    '410632': { id: '410632', con: 'Tau', name: '', ra: 5.45280384, dec: 17.96221804, mag: 5.4, ci: -0.09, },
		    '431808': { id: '431808', con: 'Aur', name: '', ra: 5.64391304, dec: 30.49242391, mag: 5.4, ci: 0.45, },
		    '15522': { id: '15522', con: 'Scl', name: '', ra: 0.19289435, dec: -27.79973846, mag: 5.41, ci: 1.346, },
		    '58573': { id: '58573', con: 'Cas', name: '', ra: 0.75477045, dec: 55.22139921, mag: 5.41, ci: 0.022, },
		    '120652': { id: '120652', con: 'Cet', name: '', ra: 1.59971364, dec: -15.40018657, mag: 5.41, ci: 1.226, },
		    '12586': { id: '12586', con: 'Scl', name: '', ra: 0.15583914, dec: -27.98797299, mag: 5.42, ci: 0.414, },
		    '37602': { id: '37602', con: 'Phe', name: '', ra: 0.4740339, dec: -39.91499703, mag: 5.42, ci: 1.556, },
		    '61635': { id: '61635', con: 'Cas', name: '', ra: 0.79612624, dec: 74.8475728, mag: 5.42, ci: -0.066, },
		    '97160': { id: '97160', con: 'Cet', name: '', ra: 1.27674671, dec: -2.50036878, mag: 5.42, ci: 0.888, },
		    '106900': { id: '106900', con: 'Phe', name: '', ra: 1.41132972, dec: -41.49254424, mag: 5.42, ci: 1.03, },
		    '142525': { id: '142525', con: 'And', name: '', ra: 1.88815091, dec: 40.72979047, mag: 5.42, ci: 1.311, },
		    '155169': { id: '155169', con: 'Cet', name: '', ra: 2.05323637, dec: 0.12850504, mag: 5.42, ci: 0.146, },
		    '179237': { id: '179237', con: 'Cet', name: '', ra: 2.37011, dec: -0.88485452, mag: 5.42, ci: 0.335, },
		    '323370': { id: '323370', con: 'Cep', name: '', ra: 4.45081831, dec: 80.82416158, mag: 5.42, ci: 1.179, },
		    '150803': { id: '150803', con: 'Cet', name: '', ra: 1.99616658, dec: -20.82453506, mag: 5.43, ci: 1.64, },
		    '151706': { id: '151706', con: 'Cet', name: '', ra: 2.0074508, dec: -8.52387352, mag: 5.43, ci: 1.391, },
		    '178993': { id: '178993', con: 'Cet', name: '', ra: 2.36709245, dec: -10.77753306, mag: 5.43, ci: 0.364, },
		    '206667': { id: '206667', con: 'Per', name: '', ra: 2.7347665, dec: 44.2970397, mag: 5.43, ci: 0.904, },
		    '380124': { id: '380124', con: 'Ori', name: '', ra: 5.15545617, dec: 9.82958059, mag: 5.43, ci: 0.249, },
		    '416027': { id: '416027', con: 'Cam', name: '', ra: 5.50283374, dec: 63.06721911, mag: 5.43, ci: 1.704, },
		    '74162': { id: '74162', con: 'Psc', name: '', ra: 0.96393092, dec: 28.99221782, mag: 5.44, ci: 1.076, },
		    '221747': { id: '221747', con: 'Eri', name: '', ra: 2.95660185, dec: -23.86216697, mag: 5.44, ci: 0.238, },
		    '246494': { id: '246494', con: 'Cep', name: '', ra: 3.33881669, dec: 77.73475159, mag: 5.44, ci: 0.211, },
		    '277677': { id: '277677', con: 'Tau', name: '', ra: 3.80578223, dec: 23.42124898, mag: 5.44, ci: -0.067, },
		    '303757': { id: '303757', con: 'Eri', name: '', ra: 4.17292263, dec: -6.92385252, mag: 5.44, ci: 0.941, },
		    '385293': { id: '385293', con: 'Cam', name: '', ra: 5.20623871, dec: 73.94667936, mag: 5.44, ci: -0.108, },
		    '397018': { id: '397018', con: 'Pic', name: '', ra: 5.32281525, dec: -50.60596688, mag: 5.44, ci: 0.517, },
		    '434022': { id: '434022', con: 'Col', name: '', ra: 5.66384441, dec: -32.62921976, mag: 5.44, ci: 0.913, },
		    '48832': { id: '48832', con: 'And', name: '', ra: 0.6225607, dec: 35.39950184, mag: 5.45, ci: 0.886, },
		    '51076': { id: '51076', con: 'Cas', name: '', ra: 0.65274835, dec: 49.35458576, mag: 5.45, ci: 1.644, },
		    '70643': { id: '70643', con: 'Tuc', name: '', ra: 0.91675352, dec: -69.5270806, mag: 5.45, ci: 1.095, },
		    '200149': { id: '200149', con: 'Ari', name: '', ra: 2.64694315, dec: 21.96140783, mag: 5.45, ci: 0.168, },
		    '230289': { id: '230289', con: 'Ari', name: '', ra: 3.09074713, dec: 25.2551679, mag: 5.45, ci: -0.031, },
		    '273677': { id: '273677', con: 'Tau', name: 'Celaeno', ra: 3.74672615, dec: 24.28946632, mag: 5.45, ci: -0.034, },
		    '296121': { id: '296121', con: 'Tau', name: '', ra: 4.06572303, dec: 8.19726924, mag: 5.45, ci: 0.371, },
		    '302484': { id: '302484', con: 'Eri', name: '', ra: 4.15495426, dec: -16.38586904, mag: 5.45, ci: -0.147, },
		    '308977': { id: '308977', con: 'Ret', name: '', ra: 4.24681821, dec: -62.19180833, mag: 5.45, ci: 1.106, },
		    '338706': { id: '338706', con: 'Tau', name: '', ra: 4.66761586, dec: 12.19760374, mag: 5.45, ci: -0.121, },
		    '421001': { id: '421001', con: 'Col', name: '', ra: 5.54761519, dec: -38.5133741, mag: 5.45, ci: 1.224, },
		    '70589': { id: '70589', con: 'And', name: '', ra: 0.91613548, dec: 23.62840352, mag: 5.46, ci: 1.012, },
		    '296607': { id: '296607', con: 'Tau', name: '', ra: 4.07268703, dec: 24.10599159, mag: 5.46, ci: 0.813, },
		    '314109': { id: '314109', con: 'Per', name: '', ra: 4.32034388, dec: 50.04869045, mag: 5.46, ci: 0.235, },
		    '337799': { id: '337799', con: 'Eri', name: '', ra: 4.65547521, dec: -14.35919311, mag: 5.46, ci: 1.054, },
		    '398493': { id: '398493', con: 'Aur', name: '', ra: 5.33740812, dec: 41.0862068, mag: 5.46, ci: 0.122, },
		    '416010': { id: '416010', con: 'Pic', name: '', ra: 5.50263325, dec: -47.07765495, mag: 5.46, ci: 0.615, },
		    '418023': { id: '418023', con: 'Ori', name: '', ra: 5.52070618, dec: 3.29220533, mag: 5.46, ci: -0.176, },
		    '445236': { id: '445236', con: 'Aur', name: '', ra: 5.76501108, dec: 49.82628127, mag: 5.46, ci: 0.03, },
		    '453659': { id: '453659', con: 'Men', name: '', ra: 5.83799548, dec: -79.36136177, mag: 5.46, ci: -0.076, },
		    '488824': { id: '488824', con: 'Lep', name: '', ra: 6.10891612, dec: -23.11084284, mag: 5.46, ci: 0.064, },
		    '67669': { id: '67669', con: 'Cet', name: '', ra: 0.87795125, dec: -24.00584651, mag: 5.47, ci: 1.275, },
		    '224377': { id: '224377', con: 'Per', name: '', ra: 2.9971645, dec: 47.22069129, mag: 5.47, ci: 0.869, },
		    '259665': { id: '259665', con: 'Per', name: '', ra: 3.53572248, dec: 48.02347518, mag: 5.47, ci: -0.101, },
		    '326764': { id: '326764', con: 'Cep', name: '', ra: 4.5000987, dec: 83.34037708, mag: 5.47, ci: 0.855, },
		    '327542': { id: '327542', con: 'Tau', name: '', ra: 4.5108028, dec: 15.69187376, mag: 5.47, ci: 0.258, },
		    '353903': { id: '353903', con: 'Cam', name: '', ra: 4.8681163, dec: 63.50541868, mag: 5.47, ci: 1.559, },
		    '358069': { id: '358069', con: 'Men', name: '', ra: 4.91977825, dec: -74.93685357, mag: 5.47, ci: 1.518, },
		    '414422': { id: '414422', con: 'Tau', name: '', ra: 5.48791651, dec: 25.15021319, mag: 5.47, ci: -0.042, },
		    '448164': { id: '448164', con: 'Tau', name: '', ra: 5.79060999, dec: 17.72914255, mag: 5.47, ci: 0.301, },
		    '182605': { id: '182605', con: 'Ari', name: '', ra: 2.41362683, dec: 10.61056223, mag: 5.48, ci: -0.098, },
		    '214297': { id: '214297', con: 'For', name: '', ra: 2.84455749, dec: -35.67585084, mag: 5.48, ci: 1.259, },
		    '282726': { id: '282726', con: 'Eri', name: '', ra: 3.87823707, dec: -5.36124711, mag: 5.48, ci: -0.09, },
		    '394226': { id: '394226', con: 'Lep', name: '', ra: 5.29451152, dec: -13.51982633, mag: 5.48, ci: 0.932, },
		    '59676': { id: '59676', con: 'Cet', name: '', ra: 0.76993158, dec: -22.52209699, mag: 5.49, ci: 0.978, },
		    '116874': { id: '116874', con: 'Scl', name: '', ra: 1.54890346, dec: -36.86523244, mag: 5.49, ci: 1.021, },
		    '133337': { id: '133337', con: 'Phe', name: '', ra: 1.76832396, dec: -50.8162547, mag: 5.49, ci: 1.615, },
		    '231071': { id: '231071', con: 'Cep', name: '', ra: 3.10217703, dec: 79.41853159, mag: 5.49, ci: 1.569, },
		    '243784': { id: '243784', con: 'Per', name: '', ra: 3.29648728, dec: 44.02502492, mag: 5.49, ci: -0.06, },
		    '287143': { id: '287143', con: 'Per', name: '', ra: 3.94130263, dec: 35.08090238, mag: 5.49, ci: -0.058, },
		    '347896': { id: '347896', con: 'Eri', name: '', ra: 4.79341427, dec: -16.93445383, mag: 5.49, ci: 0.632, },
		    '452349': { id: '452349', con: 'Lep', name: '', ra: 5.82681708, dec: -14.48366213, mag: 5.49, ci: 0.87, },
		    '494626': { id: '494626', con: 'Lep', name: '', ra: 6.14940813, dec: -22.42738775, mag: 5.49, ci: -0.01, },
		    '27452': { id: '27452', con: 'Tuc', name: '', ra: 0.34417716, dec: -69.62491407, mag: 5.5, ci: -0.046, },
		    '80029': { id: '80029', con: 'Scl', name: '', ra: 1.04067594, dec: -31.55200402, mag: 5.5, ci: 0.083, },
		    '80488': { id: '80488', con: 'Psc', name: '', ra: 1.04697123, dec: 31.80425941, mag: 5.5, ci: -0.043, },
		    '109275': { id: '109275', con: 'Psc', name: '', ra: 1.44491093, dec: 19.24042228, mag: 5.5, ci: 1.106, },
		    '154862': { id: '154862', con: 'Tri', name: '', ra: 2.04943209, dec: 33.28413572, mag: 5.5, ci: 0.029, },
		    '247680': { id: '247680', con: 'Eri', name: '', ra: 3.35666941, dec: -23.63514299, mag: 5.5, ci: 0.885, },
		    '250894': { id: '250894', con: 'Ari', name: '', ra: 3.40513205, dec: 24.72406899, mag: 5.5, ci: 1.19, },
		    '314363': { id: '314363', con: 'Tau', name: '', ra: 4.32391586, dec: 21.14230744, mag: 5.5, ci: -0.069, },
		    '359744': { id: '359744', con: 'Eri', name: '', ra: 4.94005213, dec: -5.17135532, mag: 5.5, ci: -0.123, },
		    '378062': { id: '378062', con: 'Tau', name: '', ra: 5.13517294, dec: 24.26517156, mag: 5.5, ci: 0.03, },
		    '389247': { id: '389247', con: 'Ori', name: '', ra: 5.24556933, dec: 5.15614866, mag: 5.5, ci: 1.369, },
		    '419847': { id: '419847', con: 'Tau', name: '', ra: 5.53726141, dec: 17.05812505, mag: 5.5, ci: -0.004, },
		    '492032': { id: '492032', con: 'Col', name: '', ra: 6.13134941, dec: -42.15404143, mag: 5.5, ci: 0.007, },
		    '46690': { id: '46690', con: 'Phe', name: '', ra: 0.59477096, dec: -48.00090536, mag: 5.51, ci: 0.461, },
		    '60707': { id: '60707', con: 'Psc', name: '', ra: 0.78373859, dec: 11.97385171, mag: 5.51, ci: 0.987, },
		    '87329': { id: '87329', con: 'Psc', name: '', ra: 1.1395, dec: 5.649819, mag: 5.51, ci: 0.334, },
		    '109483': { id: '109483', con: 'Cet', name: '', ra: 1.447657, dec: -13.05651115, mag: 5.51, ci: 0.321, },
		    '172677': { id: '172677', con: 'Cet', name: '', ra: 2.28306781, dec: -6.42211466, mag: 5.51, ci: 0.962, },
		    '226939': { id: '226939', con: 'Hyi', name: '', ra: 3.03762419, dec: -71.90246002, mag: 5.51, ci: -0.125, },
		    '241736': { id: '241736', con: 'Hyi', name: '', ra: 3.26601745, dec: -77.38845329, mag: 5.51, ci: 0.438, },
		    '302342': { id: '302342', con: 'Tau', name: '', ra: 4.15276835, dec: 19.60921632, mag: 5.51, ci: 1.077, },
		    '324703': { id: '324703', con: 'Cep', name: '', ra: 4.47035101, dec: 83.80778826, mag: 5.51, ci: -0.106, },
		    '361127': { id: '361127', con: 'Tau', name: '', ra: 4.95620561, dec: 17.15368576, mag: 5.51, ci: 1.304, },
		    '128698': { id: '128698', con: 'Eri', name: '', ra: 1.70814437, dec: -53.74082748, mag: 5.52, ci: 0.551, },
		    '215255': { id: '215255', con: 'Ari', name: '', ra: 2.85821832, dec: 15.08206937, mag: 5.52, ci: -0.099, },
		    '277218': { id: '277218', con: 'For', name: '', ra: 3.79890044, dec: -30.16788241, mag: 5.52, ci: 0.973, },
		    '301687': { id: '301687', con: 'Per', name: '', ra: 4.14350495, dec: 38.03973424, mag: 5.52, ci: 0.52, },
		    '357887': { id: '357887', con: 'Cam', name: '', ra: 4.917537, dec: 55.259109, mag: 5.52, ci: 0.015, },
		    '391494': { id: '391494', con: 'Ori', name: '', ra: 5.26781495, dec: 11.34135299, mag: 5.52, ci: -0.012, },
		    '411670': { id: '411670', con: 'Tau', name: '', ra: 5.46266894, dec: 15.87404774, mag: 5.52, ci: 0.015, },
		    '465981': { id: '465981', con: 'Col', name: '', ra: 5.93915083, dec: -31.38244117, mag: 5.52, ci: 0.382, },
		    '1831': { id: '1831', con: 'Phe', name: '', ra: 0.02225556, dec: -50.33737426, mag: 5.53, ci: 1.615, },
		    '140915': { id: '140915', con: 'Per', name: '', ra: 1.866476, dec: 55.147385, mag: 5.53, ci: -0.175, },
		    '196584': { id: '196584', con: 'Cet', name: '', ra: 2.60001355, dec: -7.83159702, mag: 5.53, ci: 1.607, },
		    '243770': { id: '243770', con: 'Ret', name: '', ra: 3.29615628, dec: -62.57532041, mag: 5.53, ci: 0.641, },
		    '268958': { id: '268958', con: 'Eri', name: '', ra: 3.67731474, dec: -5.21070837, mag: 5.53, ci: -0.145, },
		    '323640': { id: '323640', con: 'Tau', name: '', ra: 4.45484673, dec: 22.9963333, mag: 5.53, ci: -0.098, },
		    '325056': { id: '325056', con: 'Tau', name: '', ra: 4.47558899, dec: 1.3808237, mag: 5.53, ci: -0.099, },
		    '342278': { id: '342278', con: 'Men', name: '', ra: 4.71776712, dec: -70.93102716, mag: 5.53, ci: -0.114, },
		    '343527': { id: '343527', con: 'Eri', name: '', ra: 4.73555033, dec: -18.66658367, mag: 5.53, ci: 0.025, },
		    '417819': { id: '417819', con: 'Lep', name: '', ra: 5.51878531, dec: -20.86366005, mag: 5.53, ci: 0.012, },
		    '428945': { id: '428945', con: 'Tau', name: '', ra: 5.61770462, dec: 17.04032794, mag: 5.53, ci: 0.237, },
		    '13493': { id: '13493', con: 'Psc', name: '', ra: 0.1672786, dec: 11.14581898, mag: 5.54, ci: -0.064, },
		    '122033': { id: '122033', con: 'Psc', name: '', ra: 1.61831, dec: 12.141535, mag: 5.54, ci: 0.347, },
		    '402911': { id: '402911', con: 'Aur', name: '', ra: 5.3806429, dec: 41.02926465, mag: 5.54, ci: 0.127, },
		    '454058': { id: '454058', con: 'Tau', name: '', ra: 5.84136373, dec: 14.30561135, mag: 5.54, ci: 1.006, },
		    '476933': { id: '476933', con: 'Col', name: '', ra: 6.02119389, dec: -33.91183907, mag: 5.54, ci: 1.58, },
		    '497556': { id: '497556', con: 'Col', name: '', ra: 6.16955693, dec: -40.35379188, mag: 5.54, ci: 1.665, },
		    '7713': { id: '7713', con: 'Peg', name: '', ra: 0.09498887, dec: 13.39626622, mag: 5.55, ci: 0.901, },
		    '44241': { id: '44241', con: 'Scl', name: '', ra: 0.56140055, dec: -29.55827749, mag: 5.55, ci: 1.262, },
		    '64194': { id: '64194', con: 'Psc', name: '', ra: 0.8313548, dec: 27.7108152, mag: 5.55, ci: 0.398, },
		    '84108': { id: '84108', con: 'Psc', name: '', ra: 1.09491946, dec: 21.46545729, mag: 5.55, ci: -0.048, },
		    '123272': { id: '123272', con: 'Cas', name: '', ra: 1.63543527, dec: 57.97763038, mag: 5.55, ci: 1.388, },
		    '185950': { id: '185950', con: 'Tri', name: '', ra: 2.4577145, dec: 31.8012796, mag: 5.55, ci: 1.114, },
		    '237826': { id: '237826', con: 'Cet', name: '', ra: 3.20732372, dec: 6.66088121, mag: 5.55, ci: 1.011, },
		    '248557': { id: '248557', con: 'Ari', name: '', ra: 3.36997054, dec: 27.60754985, mag: 5.55, ci: 1.1, },
		    '268093': { id: '268093', con: 'Tau', name: '', ra: 3.66420068, dec: 3.05686222, mag: 5.55, ci: 0.931, },
		    '269532': { id: '269532', con: 'Per', name: '', ra: 3.68551645, dec: 37.58019206, mag: 5.55, ci: -0.062, },
		    '315268': { id: '315268', con: 'Per', name: '', ra: 4.33653153, dec: 50.92093655, mag: 5.55, ci: -0.031, },
		    '395225': { id: '395225', con: 'Aur', name: '', ra: 5.30436026, dec: 42.79210879, mag: 5.55, ci: 1.492, },
		    '462828': { id: '462828', con: 'Col', name: '', ra: 5.91457868, dec: -39.95785748, mag: 5.55, ci: 1.515, },
		    '72858': { id: '72858', con: 'Cas', name: '', ra: 0.946377, dec: 60.362836, mag: 5.56, ci: -0.054, },
		    '86806': { id: '86806', con: 'Psc', name: '', ra: 1.13254413, dec: 20.73908485, mag: 5.56, ci: 0.121, },
		    '91016': { id: '91016', con: 'Cas', name: '', ra: 1.19043743, dec: 64.20268032, mag: 5.56, ci: -0.052, },
		    '224239': { id: '224239', con: 'Eri', name: '', ra: 2.99476655, dec: -2.46495383, mag: 5.56, ci: -0.072, },
		    '263843': { id: '263843', con: 'Eri', name: '', ra: 3.59935198, dec: -11.19378535, mag: 5.56, ci: 0.915, },
		    '273846': { id: '273846', con: 'Eri', name: '', ra: 3.74902685, dec: -0.29672372, mag: 5.56, ci: 1.411, },
		    '338776': { id: '338776', con: 'Eri', name: '', ra: 4.66855612, dec: -24.48236518, mag: 5.56, ci: 0.926, },
		    '412568': { id: '412568', con: 'Col', name: '', ra: 5.4709262, dec: -37.23076885, mag: 5.56, ci: 0.026, },
		    '496138': { id: '496138', con: 'Lep', name: '', ra: 6.15958973, dec: -14.58461752, mag: 5.56, ci: 1.15, },
		    '8727': { id: '8727', con: 'Cas', name: '', ra: 0.10737, dec: 64.196168, mag: 5.57, ci: -0.023, },
		    '12195': { id: '12195', con: 'Peg', name: '', ra: 0.15067368, dec: 18.21196211, mag: 5.57, ci: 1.043, },
		    '45159': { id: '45159', con: 'Phe', name: '', ra: 0.57439759, dec: -52.37308883, mag: 5.57, ci: 0.472, },
		    '48814': { id: '48814', con: 'Cet', name: '', ra: 0.6224167, dec: -24.76728895, mag: 5.57, ci: 0.715, },
		    '61939': { id: '61939', con: 'Cet', name: '', ra: 0.80029622, dec: -21.72250102, mag: 5.57, ci: -0.058, },
		    '89092': { id: '89092', con: 'Psc', name: '', ra: 1.1636668, dec: 19.65840427, mag: 5.57, ci: 0.697, },
		    '91338': { id: '91338', con: 'Cas', name: '', ra: 1.1948341, dec: 65.01885618, mag: 5.57, ci: -0.072, },
		    '128506': { id: '128506', con: 'Cas', name: '', ra: 1.70570242, dec: 68.04302009, mag: 5.57, ci: -0.049, },
		    '150623': { id: '150623', con: 'Phe', name: '', ra: 1.99411538, dec: -42.03053251, mag: 5.57, ci: 1.052, },
		    '169239': { id: '169239', con: 'Hyi', name: '', ra: 2.23737267, dec: -67.84143631, mag: 5.57, ci: 1.556, },
		    '171103': { id: '171103', con: 'Ari', name: '', ra: 2.26188263, dec: 25.04303817, mag: 5.57, ci: 0.52, },
		    '177623': { id: '177623', con: 'And', name: '', ra: 2.34950214, dec: 50.15147076, mag: 5.57, ci: -0.089, },
		    '256780': { id: '256780', con: 'Eri', name: '', ra: 3.49334065, dec: -12.67473957, mag: 5.57, ci: 0.171, },
		    '350078': { id: '350078', con: 'Aur', name: '', ra: 4.82023504, dec: 31.43737216, mag: 5.57, ci: 1.132, },
		    '2237': { id: '2237', con: 'Cas', name: '', ra: 0.02694972, dec: 61.22280247, mag: 5.58, ci: 0.407, },
		    '32203': { id: '32203', con: 'Cas', name: '', ra: 0.404348, dec: 52.019914, mag: 5.58, ci: -0.11, },
		    '84589': { id: '84589', con: 'Cet', name: '', ra: 1.10142982, dec: -9.83935198, mag: 5.58, ci: 0.009, },
		    '124182': { id: '124182', con: 'Cet', name: '', ra: 1.64771905, dec: -21.27538889, mag: 5.58, ci: 0.346, },
		    '174045': { id: '174045', con: 'Ari', name: '', ra: 2.30209353, dec: 19.90116357, mag: 5.58, ci: 0.011, },
		    '220732': { id: '220732', con: 'Ari', name: '', ra: 2.94059787, dec: 18.02313394, mag: 5.58, ci: 0.471, },
		    '256017': { id: '256017', con: 'Per', name: '', ra: 3.48120201, dec: 49.84838252, mag: 5.58, ci: -0.054, },
		    '314967': { id: '314967', con: 'Tau', name: '', ra: 4.33269577, dec: 14.03520383, mag: 5.58, ci: 0.283, },
		    '326953': { id: '326953', con: 'Tau', name: '', ra: 4.50238902, dec: 15.63784685, mag: 5.58, ci: 0.324, },
		    '352310': { id: '352310', con: 'Pic', name: '', ra: 4.84869679, dec: -53.46151628, mag: 5.58, ci: 0.341, },
		    '6377': { id: '6377', con: 'Tuc', name: '', ra: 0.07814171, dec: -71.43689141, mag: 5.59, ci: -0.1, },
		    '41746': { id: '41746', con: 'Cas', name: '', ra: 0.52809955, dec: 52.83952666, mag: 5.59, ci: 1.163, },
		    '63657': { id: '63657', con: 'Cet', name: '', ra: 0.82378232, dec: -13.5612743, mag: 5.59, ci: 1.325, },
		    '70483': { id: '70483', con: 'Cep', name: '', ra: 0.91474914, dec: 83.70741841, mag: 5.59, ci: 0.105, },
		    '78615': { id: '78615', con: 'Scl', name: '', ra: 1.02174328, dec: -38.91652813, mag: 5.59, ci: 1.185, },
		    '154897': { id: '154897', con: 'Cas', name: '', ra: 2.05005158, dec: 64.3900164, mag: 5.59, ci: 0.325, },
		    '220159': { id: '220159', con: 'Cas', name: '', ra: 2.93247749, dec: 61.52114156, mag: 5.59, ci: 0.445, },
		    '272286': { id: '272286', con: 'Eri', name: '', ra: 3.72606541, dec: -10.48566322, mag: 5.59, ci: 0.216, },
		    '298086': { id: '298086', con: 'Eri', name: '', ra: 4.0937322, dec: -27.6518098, mag: 5.59, ci: 0.324, },
		    '334816': { id: '334816', con: 'Dor', name: '', ra: 4.61266511, dec: -62.07715956, mag: 5.59, ci: 1.5, },
		    '92030': { id: '92030', con: 'Cep', name: '', ra: 1.20467126, dec: 79.67396459, mag: 5.6, ci: 0.008, },
		    '105666': { id: '105666', con: 'And', name: '', ra: 1.39461525, dec: 37.71494001, mag: 5.6, ci: 0.276, },
		    '173915': { id: '173915', con: 'Cet', name: '', ra: 2.30040028, dec: 1.75780069, mag: 5.6, ci: 0.588, },
		    '273386': { id: '273386', con: 'Per', name: '', ra: 3.74206427, dec: 36.46010776, mag: 5.6, ci: 0.062, },
		    '383602': { id: '383602', con: 'Lep', name: '', ra: 5.18968671, dec: -11.84909105, mag: 5.6, ci: 1.35, },
		    '406835': { id: '406835', con: 'Ori', name: '', ra: 5.41715084, dec: -10.3288832, mag: 5.6, ci: 1.543, },
		    '422908': { id: '422908', con: 'Ori', name: '', ra: 5.56507898, dec: 14.30557714, mag: 5.6, ci: -0.118, },
		    '425436': { id: '425436', con: 'Ori', name: '', ra: 5.58701037, dec: 10.24006305, mag: 5.6, ci: 0.149, },
		    '455011': { id: '455011', con: 'Tau', name: '', ra: 5.84947481, dec: 27.96786389, mag: 5.6, ci: 0.978, },
		    '457885': { id: '457885', con: 'Tau', name: '', ra: 5.87285896, dec: 14.17178614, mag: 5.6, ci: -0.053, },
		    '28980': { id: '28980', con: 'Cet', name: '', ra: 0.36285397, dec: -20.05802369, mag: 5.61, ci: 1.58, },
		    '155780': { id: '155780', con: 'Cet', name: '', ra: 2.06124703, dec: -4.10351232, mag: 5.61, ci: 1.589, },
		    '241066': { id: '241066', con: 'Ari', name: '', ra: 3.25567704, dec: 30.55668252, mag: 5.61, ci: 0.012, },
		    '290689': { id: '290689', con: 'Eri', name: '', ra: 3.99170349, dec: -12.5744199, mag: 5.61, ci: 1.479, },
		    '325730': { id: '325730', con: 'Eri', name: '', ra: 4.48525673, dec: -13.04837193, mag: 5.61, ci: -0.202, },
		    '371031': { id: '371031', con: 'Lep', name: '', ra: 5.06479752, dec: -24.38815478, mag: 5.61, ci: 0.094, },
		    '75292': { id: '75292', con: 'Cet', name: '', ra: 0.97885213, dec: -11.37997656, mag: 5.62, ci: 0.949, },
		    '118957': { id: '118957', con: 'Cet', name: '', ra: 1.57716096, dec: -15.67635856, mag: 5.62, ci: 0.066, },
		    '227065': { id: '227065', con: 'Cet', name: '', ra: 3.03958839, dec: 4.35289046, mag: 5.62, ci: -0.107, },
		    '244410': { id: '244410', con: 'Cet', name: '', ra: 3.30622752, dec: -0.93030136, mag: 5.62, ci: 1.05, },
		    '259877': { id: '259877', con: 'Cep', name: '', ra: 3.53892827, dec: 84.91103381, mag: 5.62, ci: 0.894, },
		    '287627': { id: '287627', con: 'Tau', name: '', ra: 3.947799, dec: 22.47797254, mag: 5.62, ci: 0.345, },
		    '296626': { id: '296626', con: 'Eri', name: '', ra: 4.0729764, dec: -12.79229719, mag: 5.62, ci: 1.062, },
		    '438619': { id: '438619', con: 'Cam', name: '', ra: 5.70734639, dec: 65.69765233, mag: 5.62, ci: 1.249, },
		    '458247': { id: '458247', con: 'Col', name: '', ra: 5.87588477, dec: -37.63106079, mag: 5.62, ci: 1.046, },
		    '462554': { id: '462554', con: 'Lep', name: '', ra: 5.91211944, dec: -11.77419283, mag: 5.62, ci: 1.523, },
		    '126435': { id: '126435', con: 'And', name: '', ra: 1.67767974, dec: 43.29767276, mag: 5.63, ci: 0.214, },
		    '128160': { id: '128160', con: 'Tri', name: '', ra: 1.70096964, dec: 35.24571012, mag: 5.63, ci: -0.059, },
		    '135481': { id: '135481', con: 'Cas', name: '', ra: 1.7957875, dec: 63.85250426, mag: 5.63, ci: 0.804, },
		    '245705': { id: '245705', con: 'For', name: '', ra: 3.32636267, dec: -24.12290452, mag: 5.63, ci: 1.663, },
		    '485335': { id: '485335', con: 'Ori', name: '', ra: 6.08287742, dec: 4.15867168, mag: 5.63, ci: 1.041, },
		    '59011': { id: '59011', con: 'Cas', name: '', ra: 0.76085466, dec: 74.98807084, mag: 5.64, ci: 0.078, },
		    '83405': { id: '83405', con: 'Psc', name: '', ra: 1.08482118, dec: 14.9461345, mag: 5.64, ci: 0.42, },
		    '155763': { id: '155763', con: 'Ari', name: '', ra: 2.06092924, dec: 25.93549256, mag: 5.64, ci: 0.537, },
		    '165516': { id: '165516', con: 'Cet', name: '', ra: 2.18918868, dec: 8.56980657, mag: 5.64, ci: 0.569, },
		    '197411': { id: '197411', con: 'Ari', name: '', ra: 2.61053239, dec: 12.44763903, mag: 5.64, ci: 0.516, },
		    '231360': { id: '231360', con: 'Ari', name: '', ra: 3.10657975, dec: 13.18725439, mag: 5.64, ci: 1.087, },
		    '313121': { id: '313121', con: 'Tau', name: '', ra: 4.30644556, dec: 21.57928669, mag: 5.64, ci: 0.277, },
		    '319036': { id: '319036', con: 'Tau', name: '', ra: 4.39029537, dec: 16.77726132, mag: 5.64, ci: 0.31, },
		    '352632': { id: '352632', con: 'Aur', name: '', ra: 4.85259101, dec: 48.74067759, mag: 5.64, ci: 1.013, },
		    '398693': { id: '398693', con: 'Cam', name: '', ra: 5.33961409, dec: 62.65371136, mag: 5.64, ci: 1.728, },
		    '405877': { id: '405877', con: 'Lep', name: '', ra: 5.40791346, dec: -16.97577832, mag: 5.64, ci: -0.001, },
		    '167357': { id: '167357', con: 'Cet', name: '', ra: 2.21320593, dec: -2.39362685, mag: 5.65, ci: 0.546, },
		    '198786': { id: '198786', con: 'Cet', name: '', ra: 2.6282782, dec: -3.3961729, mag: 5.65, ci: 1.021, },
		    '279704': { id: '279704', con: 'Per', name: '', ra: 3.834561, dec: 44.96785876, mag: 5.65, ci: 0.779, },
		    '363577': { id: '363577', con: 'Lep', name: '', ra: 4.98370958, dec: -16.37598487, mag: 5.65, ci: 0.447, },
		    '429085': { id: '429085', con: 'Men', name: '', ra: 5.61916, dec: -80.469122, mag: 5.65, ci: 0.6, },
		    '475910': { id: '475910', con: 'Pic', name: '', ra: 6.01365844, dec: -51.21631853, mag: 5.65, ci: 0.207, },
		    '483876': { id: '483876', con: 'Col', name: '', ra: 6.07229601, dec: -32.17243115, mag: 5.65, ci: -0.186, },
		    '21562': { id: '21562', con: 'Scl', name: '', ra: 0.26912969, dec: -31.44639153, mag: 5.66, ci: 1.35, },
		    '57546': { id: '57546', con: 'Cas', name: '', ra: 0.7406091, dec: 47.86398231, mag: 5.66, ci: -0.113, },
		    '122465': { id: '122465', con: 'Oct', name: '', ra: 1.62445121, dec: -84.76960315, mag: 5.66, ci: 0.939, },
		    '162106': { id: '162106', con: 'Per', name: '', ra: 2.14460548, dec: 58.42360741, mag: 5.66, ci: 0.595, },
		    '274077': { id: '274077', con: 'Tau', name: '', ra: 3.7527054, dec: 24.83926193, mag: 5.66, ci: -0.064, },
		    '275022': { id: '275022', con: 'Per', name: '', ra: 3.76646168, dec: 45.68190115, mag: 5.66, ci: -0.08, },
		    '281925': { id: '281925', con: 'Tau', name: '', ra: 3.86672833, dec: 6.53483339, mag: 5.66, ci: 0.046, },
		    '340253': { id: '340253', con: 'Per', name: '', ra: 4.69003553, dec: 48.30088709, mag: 5.66, ci: 0.002, },
		    '342386': { id: '342386', con: 'Cae', name: '', ra: 4.71924816, dec: -30.76555966, mag: 5.66, ci: 1.391, },
		    '400093': { id: '400093', con: 'Aur', name: '', ra: 5.35352452, dec: 29.5698867, mag: 5.66, ci: 0.06, },
		    '10854': { id: '10854', con: 'Scl', name: '', ra: 0.13430187, dec: -33.52932715, mag: 5.67, ci: 1.119, },
		    '40144': { id: '40144', con: 'Phe', name: '', ra: 0.50724828, dec: -48.21490497, mag: 5.67, ci: 0.367, },
		    '89654': { id: '89654', con: 'And', name: '', ra: 1.17187267, dec: 42.08148034, mag: 5.67, ci: 0.603, },
		    '170803': { id: '170803', con: 'Hyi', name: '', ra: 2.25795169, dec: -67.74636809, mag: 5.67, ci: 1.306, },
		    '232610': { id: '232610', con: 'Hyi', name: '', ra: 3.12559267, dec: -78.98923898, mag: 5.67, ci: 0.298, },
		    '260127': { id: '260127', con: 'Hor', name: '', ra: 3.54300071, dec: -50.37864587, mag: 5.67, ci: 1.101, },
		    '293468': { id: '293468', con: 'Tau', name: '', ra: 4.02948341, dec: 9.99802401, mag: 5.67, ci: 0.005, },
		    '312696': { id: '312696', con: 'Men', name: '', ra: 4.29979774, dec: -80.21403183, mag: 5.67, ci: 0.836, },
		    '331769': { id: '331769', con: 'Tau', name: '', ra: 4.56896329, dec: 5.56861739, mag: 5.67, ci: 0.055, },
		    '382467': { id: '382467', con: 'Aur', name: '', ra: 5.17858843, dec: 46.96207026, mag: 5.67, ci: 0.452, },
		    '422237': { id: '422237', con: 'Tau', name: '', ra: 5.55878648, dec: 18.54023466, mag: 5.67, ci: -0.022, },
		    '425027': { id: '425027', con: 'Ori', name: '', ra: 5.58361323, dec: -6.00928011, mag: 5.67, ci: -0.228, },
		    '485327': { id: '485327', con: 'Ori', name: '', ra: 6.0828289, dec: 5.41997435, mag: 5.67, ci: 1.047, },
		    '6394': { id: '6394', con: 'Cep', name: '', ra: 0.07832781, dec: 67.16644709, mag: 5.68, ci: 1.051, },
		    '164580': { id: '164580', con: 'Ari', name: '', ra: 2.17711058, dec: 19.50033775, mag: 5.68, ci: 1.641, },
		    '257222': { id: '257222', con: 'Men', name: '', ra: 3.49969234, dec: -78.35185063, mag: 5.68, ci: 0.932, },
		    '270869': { id: '270869', con: 'Tau', name: '', ra: 3.70526324, dec: 19.70025586, mag: 5.68, ci: -0.016, },
		    '354907': { id: '354907', con: 'Aur', name: '', ra: 4.87993275, dec: 42.58662572, mag: 5.68, ci: 0.115, },
		    '400649': { id: '400649', con: 'Ori', name: '', ra: 5.35884524, dec: -0.41649311, mag: 5.68, ci: -0.125, },
		    '42657': { id: '42657', con: 'Psc', name: '', ra: 0.53993738, dec: 6.95546578, mag: 5.69, ci: -0.014, },
		    '76986': { id: '76986', con: 'And', name: '', ra: 1.00098836, dec: 44.71324698, mag: 5.69, ci: -0.01, },
		    '117499': { id: '117499', con: 'Cas', name: '', ra: 1.55714196, dec: 58.32732951, mag: 5.69, ci: 1.435, },
		    '120856': { id: '120856', con: 'Scl', name: '', ra: 1.60236182, dec: -29.90736944, mag: 5.69, ci: 0.335, },
		    '146170': { id: '146170', con: 'And', name: '', ra: 1.93593423, dec: 37.25183198, mag: 5.69, ci: 1.06, },
		    '224143': { id: '224143', con: 'For', name: '', ra: 2.99338378, dec: -25.27413403, mag: 5.69, ci: 0.427, },
		    '311389': { id: '311389', con: 'Cam', name: '', ra: 4.28154365, dec: 61.84998844, mag: 5.69, ci: -0.116, },
		    '404501': { id: '404501', con: 'Ori', name: '', ra: 5.39508572, dec: -0.15981977, mag: 5.69, ci: -0.208, },
		    '410570': { id: '410570', con: 'Aur', name: '', ra: 5.45229786, dec: 30.2086, mag: 5.69, ci: 0.175, },
		    '3482': { id: '3482', con: 'Psc', name: '', ra: 0.04158384, dec: 8.48546279, mag: 5.7, ci: 0.315, },
		    '8542': { id: '8542', con: 'Phe', name: '', ra: 0.10532643, dec: -49.07518591, mag: 5.7, ci: 0.519, },
		    '61574': { id: '61574', con: 'Cet', name: '', ra: 0.79533902, dec: -18.0613362, mag: 5.7, ci: 1.3, },
		    '95099': { id: '95099', con: 'Cet', name: '', ra: 1.24699214, dec: -0.9737962, mag: 5.7, ci: 0.428, },
		    '127842': { id: '127842', con: 'Hyi', name: '', ra: 1.69665766, dec: -60.78933626, mag: 5.7, ci: 1.264, },
		    '128145': { id: '128145', con: 'Scl', name: '', ra: 1.70083178, dec: -36.83230358, mag: 5.7, ci: -0.01, },
		    '141128': { id: '141128', con: 'Per', name: '', ra: 1.86926974, dec: 50.79279317, mag: 5.7, ci: -0.067, },
		    '149276': { id: '149276', con: 'Per', name: '', ra: 1.97597379, dec: 49.20435798, mag: 5.7, ci: 1.005, },
		    '247368': { id: '247368', con: 'Cet', name: '', ra: 3.35188982, dec: 3.67562401, mag: 5.7, ci: 0.964, },
		    '284642': { id: '284642', con: 'Eri', name: '', ra: 3.90643414, dec: -40.35701211, mag: 5.7, ci: 0.599, },
		    '304265': { id: '304265', con: 'Eri', name: '', ra: 4.17993486, dec: -8.81981541, mag: 5.7, ci: 1.057, },
		    '471618': { id: '471618', con: 'Ori', name: '', ra: 5.9814516, dec: 12.80828241, mag: 5.7, ci: 0.874, },
		    '494631': { id: '494631', con: 'Ori', name: '', ra: 6.1494181, dec: 2.4997014, mag: 5.7, ci: 0.067, },
		    '1460': { id: '1460', con: 'Phe', name: '', ra: 0.01793957, dec: -48.8098752, mag: 5.71, ci: 0.911, },
		    '18065': { id: '18065', con: 'And', name: '', ra: 0.22523326, dec: 41.03537159, mag: 5.71, ci: 0.331, },
		    '86589': { id: '86589', con: 'Cet', name: '', ra: 1.12950246, dec: -9.78555101, mag: 5.71, ci: 0.446, },
		    '237948': { id: '237948', con: 'Hor', name: '', ra: 3.20921123, dec: -57.32154866, mag: 5.71, ci: 2.419, },
		    '254535': { id: '254535', con: 'For', name: '', ra: 3.45928409, dec: -35.68132575, mag: 5.71, ci: 1.284, },
		    '304879': { id: '304879', con: 'Tau', name: '', ra: 4.18896729, dec: 5.52304792, mag: 5.71, ci: 0.36, },
		    '331528': { id: '331528', con: 'Eri', name: '', ra: 4.56520225, dec: -6.73891209, mag: 5.71, ci: -0.128, },
		    '357973': { id: '357973', con: 'Eri', name: '', ra: 4.9185624, dec: -16.74066622, mag: 5.71, ci: 0.953, },
		    '358238': { id: '358238', con: 'Eri', name: '', ra: 4.92184684, dec: -16.41774715, mag: 5.71, ci: 0.874, },
		    '373302': { id: '373302', con: 'Lep', name: '', ra: 5.08783213, dec: -26.15239171, mag: 5.71, ci: 1.166, },
		    '428086': { id: '428086', con: 'Ori', name: '', ra: 5.60991485, dec: -6.06475191, mag: 5.71, ci: -0.212, },
		    '476242': { id: '476242', con: 'Aur', name: '', ra: 6.01626765, dec: 47.90192126, mag: 5.71, ci: -0.007, },
		    '496663': { id: '496663', con: 'Lep', name: '', ra: 6.16332305, dec: -22.77435084, mag: 5.71, ci: 0.454, },
		    '33300': { id: '33300', con: 'Cas', name: '', ra: 0.41844717, dec: 53.04677882, mag: 5.72, ci: -0.056, },
		    '39634': { id: '39634', con: 'Cet', name: '', ra: 0.50065504, dec: -3.95733082, mag: 5.72, ci: 1.545, },
		    '54280': { id: '54280', con: 'Phe', name: '', ra: 0.69622119, dec: -56.50131765, mag: 5.72, ci: 0.131, },
		    '167681': { id: '167681', con: 'Ari', name: '', ra: 2.21758483, dec: 15.27985606, mag: 5.72, ci: 1.551, },
		    '196180': { id: '196180', con: 'And', name: '', ra: 2.59409444, dec: 37.31225912, mag: 5.72, ci: 1.389, },
		    '203207': { id: '203207', con: 'Cet', name: '', ra: 2.68722286, dec: -0.69565514, mag: 5.72, ci: 0.511, },
		    '244726': { id: '244726', con: 'Eri', name: '', ra: 3.31142792, dec: -18.55978433, mag: 5.72, ci: 0.381, },
		    '255436': { id: '255436', con: 'Per', name: '', ra: 3.47241608, dec: 33.8075555, mag: 5.72, ci: 0.048, },
		    '274198': { id: '274198', con: 'Hor', name: '', ra: 3.75440964, dec: -47.35947525, mag: 5.72, ci: 0.961, },
		    '311696': { id: '311696', con: 'Cam', name: '', ra: 4.28558307, dec: 57.86036395, mag: 5.72, ci: 1.108, },
		    '317480': { id: '317480', con: 'Tau', name: '', ra: 4.36764395, dec: 14.07719761, mag: 5.72, ci: 0.315, },
		    '324481': { id: '324481', con: 'Tau', name: '', ra: 4.46688442, dec: 21.61990071, mag: 5.72, ci: 0.27, },
		    '344645': { id: '344645', con: 'Eri', name: '', ra: 4.75115579, dec: -21.28338181, mag: 5.72, ci: 1.476, },
		    '447750': { id: '447750', con: 'Tau', name: '', ra: 5.78698679, dec: 14.4883167, mag: 5.72, ci: 0.077, },
		    '487936': { id: '487936', con: 'Dor', name: '', ra: 6.10260674, dec: -66.03961772, mag: 5.72, ci: -0.024, },
		    '498541': { id: '498541', con: 'Lep', name: '', ra: 6.17630026, dec: -27.15434671, mag: 5.72, ci: 1.072, },
		    '68938': { id: '68938', con: 'Tuc', name: '', ra: 0.89385358, dec: -62.87135337, mag: 5.73, ci: 1.574, },
		    '208326': { id: '208326', con: 'Hor', name: '', ra: 2.75763284, dec: -63.70455015, mag: 5.73, ci: 0.932, },
		    '320311': { id: '320311', con: 'Per', name: '', ra: 4.40809883, dec: 34.13075838, mag: 5.73, ci: -0.054, },
		    '340178': { id: '340178', con: 'Tau', name: '', ra: 4.68882253, dec: 28.61499213, mag: 5.73, ci: 0.018, },
		    '403938': { id: '403938', con: 'Col', name: '', ra: 5.39000699, dec: -39.67842081, mag: 5.73, ci: 1.626, },
		    '440316': { id: '440316', con: 'Lep', name: '', ra: 5.7226864, dec: -18.55747521, mag: 5.73, ci: -0.014, },
		    '22605': { id: '22605', con: 'Cas', name: '', ra: 0.28251205, dec: 61.53318551, mag: 5.74, ci: 0.898, },
		    '62405': { id: '62405', con: 'Psc', name: '96 G. Psc', ra: 0.80638256, dec: 5.28062765, mag: 5.74, ci: 0.89, },
		    '195064': { id: '195064', con: 'Cet', name: '', ra: 2.57850701, dec: -7.85944741, mag: 5.74, ci: 1.393, },
		    '196794': { id: '196794', con: 'For', name: '', ra: 2.60257346, dec: -30.04498216, mag: 5.74, ci: 1.017, },
		    '204592': { id: '204592', con: 'Ari', name: '', ra: 2.70609434, dec: 20.01146329, mag: 5.74, ci: -0.017, },
		    '234755': { id: '234755', con: 'Ari', name: '', ra: 3.16020619, dec: 29.07708462, mag: 5.74, ci: 0.115, },
		    '255033': { id: '255033', con: 'Eri', name: '', ra: 3.46692976, dec: -11.28660106, mag: 5.74, ci: 1.102, },
		    '271342': { id: '271342', con: 'Cam', name: '', ra: 3.71187075, dec: 59.96938858, mag: 5.74, ci: 1.736, },
		    '324171': { id: '324171', con: 'Ret', name: '', ra: 4.46278468, dec: -62.52120764, mag: 5.74, ci: 1.005, },
		    '369227': { id: '369227', con: 'Lep', name: '', ra: 5.04582825, dec: -22.79505247, mag: 5.74, ci: 1.188, },
		    '428072': { id: '428072', con: 'Aur', name: '', ra: 5.60978316, dec: 54.4286546, mag: 5.74, ci: 1.671, },
		    '489867': { id: '489867', con: 'Lep', name: '', ra: 6.11597617, dec: -21.81230013, mag: 5.74, ci: 1.584, },
		    '117840': { id: '117840', con: 'Cet', name: '', ra: 1.56189923, dec: -7.02534213, mag: 5.75, ci: 0.639, },
		    '127781': { id: '127781', con: 'Cet', name: '', ra: 1.69578798, dec: -11.32468351, mag: 5.75, ci: 0.443, },
		    '173888': { id: '173888', con: 'Per', name: '', ra: 2.2999686, dec: 57.89982068, mag: 5.75, ci: 1.175, },
		    '225822': { id: '225822', con: 'Eri', name: '', ra: 3.01945109, dec: -7.66300418, mag: 5.75, ci: 1.043, },
		    '304489': { id: '304489', con: 'Per', name: '', ra: 4.18306096, dec: 33.58677879, mag: 5.75, ci: 1.412, },
		    '359369': { id: '359369', con: 'Cam', name: '', ra: 4.93529842, dec: 52.86975662, mag: 5.75, ci: 0.105, },
		    '388809': { id: '388809', con: 'Col', name: '', ra: 5.24134604, dec: -35.97699752, mag: 5.75, ci: 1.009, },
		    '421504': { id: '421504', con: 'Col', name: '', ra: 5.55205214, dec: -35.13937569, mag: 5.75, ci: 1.085, },
		    '496497': { id: '496497', con: 'Gem', name: '', ra: 6.16221779, dec: 23.11347354, mag: 5.75, ci: 0.192, },
		    '125360': { id: '125360', con: 'Eri', name: 'p Eridani', ra: 1.663169, dec: -56.1964, mag: 5.76, ci: 0.88, },
		    '145755': { id: '145755', con: 'Ari', name: '', ra: 1.93084413, dec: 23.57731833, mag: 5.76, ci: 1.185, },
		    '205417': { id: '205417', con: 'Per', name: '', ra: 2.71745499, dec: 55.10601482, mag: 5.76, ci: -0.11, },
		    '220026': { id: '220026', con: 'Ari', name: '', ra: 2.93013842, dec: 18.33163734, mag: 5.76, ci: 1.452, },
		    '257145': { id: '257145', con: 'Eri', name: '', ra: 3.49865246, dec: -42.63425825, mag: 5.76, ci: 0.205, },
		    '260147': { id: '260147', con: 'Tau', name: '', ra: 3.54331928, dec: 9.37343763, mag: 5.76, ci: -0.072, },
		    '274922': { id: '274922', con: 'Tau', name: 'Asterope', ra: 3.76513238, dec: 24.55451092, mag: 5.76, ci: -0.036, },
		    '283799': { id: '283799', con: 'Per', name: '', ra: 3.8940839, dec: 48.650496, mag: 5.76, ci: 1.04, },
		    '315783': { id: '315783', con: 'Tau', name: '', ra: 4.34479025, dec: 6.13079616, mag: 5.76, ci: 0.914, },
		    '330020': { id: '330020', con: 'Eri', name: '', ra: 4.54376477, dec: -3.20953886, mag: 5.76, ci: -0.117, },
		    '349130': { id: '349130', con: 'Eri', name: '', ra: 4.80903711, dec: -16.3294843, mag: 5.76, ci: 0.537, },
		    '425516': { id: '425516', con: 'Col', name: '', ra: 5.58763239, dec: -33.07972551, mag: 5.76, ci: 1.12, },
		    '19873': { id: '19873', con: 'Cet', name: '', ra: 0.24847622, dec: -9.5695754, mag: 5.77, ci: -0.084, },
		    '33693': { id: '33693', con: 'Psc', name: '', ra: 0.42339105, dec: 1.93968941, mag: 5.77, ci: 0.855, },
		    '87576': { id: '87576', con: 'Cas', name: '', ra: 1.14262971, dec: 58.26345714, mag: 5.77, ci: -0.019, },
		    '320470': { id: '320470', con: 'Per', name: '', ra: 4.41040469, dec: 33.95970775, mag: 5.77, ci: 0.4, },
		    '349228': { id: '349228', con: 'Eri', name: '', ra: 4.81010727, dec: -5.67404339, mag: 5.77, ci: 0.631, },
		    '412170': { id: '412170', con: 'Tau', name: '', ra: 5.46711406, dec: 17.23913259, mag: 5.77, ci: 1.634, },
		    '415559': { id: '415559', con: 'Ori', name: '', ra: 5.49854852, dec: 1.78925926, mag: 5.77, ci: -0.192, },
		    '5901': { id: '5901', con: 'Cet', name: '', ra: 0.07216467, dec: -16.52903405, mag: 5.78, ci: 1.084, },
		    '17805': { id: '17805', con: 'Oct', name: '', ra: 0.22211598, dec: -84.99398143, mag: 5.78, ci: 1.71, },
		    '47665': { id: '47665', con: 'Cas', name: '', ra: 0.60759584, dec: 60.32621562, mag: 5.78, ci: 0.294, },
		    '129736': { id: '129736', con: 'Cas', name: '', ra: 1.72215415, dec: 60.55134405, mag: 5.78, ci: -0.01, },
		    '136683': { id: '136683', con: 'Tri', name: '', ra: 1.81154758, dec: 32.69020086, mag: 5.78, ci: 0.572, },
		    '142001': { id: '142001', con: 'Cet', name: '', ra: 1.88114285, dec: -16.9292523, mag: 5.78, ci: 0.26, },
		    '197886': { id: '197886', con: 'For', name: '', ra: 2.61628026, dec: -34.5779783, mag: 5.78, ci: 0.653, },
		    '207231': { id: '207231', con: 'Ari', name: '', ra: 2.74249259, dec: 15.31186119, mag: 5.78, ci: -0.024, },
		    '237608': { id: '237608', con: 'Ari', name: '', ra: 3.2039571, dec: 27.25696789, mag: 5.78, ci: -0.106, },
		    '251091': { id: '251091', con: 'Per', name: '', ra: 3.40825082, dec: 33.53594792, mag: 5.78, ci: -0.001, },
		    '281791': { id: '281791', con: 'Per', name: '', ra: 3.8649219, dec: 34.35912416, mag: 5.78, ci: -0.036, },
		    '316123': { id: '316123', con: 'Men', name: '', ra: 4.34946401, dec: -81.57991923, mag: 5.78, ci: 0.359, },
		    '329268': { id: '329268', con: 'Cam', name: '', ra: 4.53358761, dec: 53.91259739, mag: 5.78, ci: 0.119, },
		    '336436': { id: '336436', con: 'Tau', name: '', ra: 4.63595309, dec: 16.03332749, mag: 5.78, ci: 0.312, },
		    '343445': { id: '343445', con: 'Eri', name: '', ra: 4.73481112, dec: -8.50357074, mag: 5.78, ci: -0.076, },
		    '400989': { id: '400989', con: 'Ori', name: '', ra: 5.36210038, dec: 8.42855476, mag: 5.78, ci: -0.114, },
		    '408557': { id: '408557', con: 'Lep', name: '', ra: 5.43328414, dec: -19.69540083, mag: 5.78, ci: 0.441, },
		    '447124': { id: '447124', con: 'Ori', name: '', ra: 5.78114841, dec: 9.5223398, mag: 5.78, ci: 0.888, },
		    '27585': { id: '27585', con: 'And', name: '', ra: 0.34597705, dec: 32.91119365, mag: 5.79, ci: 1.595, },
		    '115410': { id: '115410', con: 'Scl', name: '', ra: 1.52868043, dec: -30.28308197, mag: 5.79, ci: 1.073, },
		    '171170': { id: '171170', con: 'Ari', name: '', ra: 2.26279167, dec: 25.78293636, mag: 5.79, ci: 0.439, },
		    '196694': { id: '196694', con: 'Cet', name: '268 G. Cet', ra: 2.601357, dec: 6.88687, mag: 5.79, ci: 0.918, },
		    '201870': { id: '201870', con: 'Cet', name: '', ra: 2.67011713, dec: -9.45287373, mag: 5.79, ci: 0.524, },
		    '241558': { id: '241558', con: 'Per', name: '', ra: 3.2633251, dec: 57.14062237, mag: 5.79, ci: 0.644, },
		    '261268': { id: '261268', con: 'Per', name: '', ra: 3.5597319, dec: 39.89948179, mag: 5.79, ci: 0.139, },
		    '275048': { id: '275048', con: 'Cam', name: '', ra: 3.76692754, dec: 67.20160454, mag: 5.79, ci: 0.347, },
		    '331143': { id: '331143', con: 'Ret', name: '', ra: 4.55943049, dec: -62.8236741, mag: 5.79, ci: 1.028, },
		    '358984': { id: '358984', con: 'Ori', name: '', ra: 4.93059865, dec: 15.04027649, mag: 5.79, ci: -0.085, },
		    '361766': { id: '361766', con: 'Tau', name: '', ra: 4.96351297, dec: 23.94855442, mag: 5.79, ci: 1.109, },
		    '362305': { id: '362305', con: 'Tau', name: '', ra: 4.96927594, dec: 25.05040554, mag: 5.79, ci: 0.018, },
		    '424476': { id: '424476', con: 'Men', name: '', ra: 5.57910644, dec: -73.74127329, mag: 5.79, ci: 1.717, },
		    '453182': { id: '453182', con: 'Ori', name: '', ra: 5.83407709, dec: 9.87120801, mag: 5.79, ci: 0.876, },
		    '487784': { id: '487784', con: 'Col', name: '', ra: 6.10153853, dec: -29.758623, mag: 5.79, ci: 0.041, },
		    '3023': { id: '3023', con: 'Peg', name: '', ra: 0.03616312, dec: 27.08209071, mag: 5.8, ci: 0.69, },
		    '6926': { id: '6926', con: 'Cas', name: '', ra: 0.08504279, dec: 61.31397955, mag: 5.8, ci: -0.067, },
		    '59147': { id: '59147', con: 'Phe', name: '', ra: 0.7626647, dec: -47.55198699, mag: 5.8, ci: 0.635, },
		    '70142': { id: '70142', con: 'Psc', name: '', ra: 0.90978496, dec: 19.18837933, mag: 5.8, ci: -0.016, },
		    '90722': { id: '90722', con: 'And', name: '', ra: 1.1861884, dec: 37.72412103, mag: 5.8, ci: -0.095, },
		    '125364': { id: '125364', con: 'Eri', name: 'p Eridani', ra: 1.66321037, dec: -56.19648348, mag: 5.8, ci: 0.86, },
		    '198678': { id: '198678', con: 'Cas', name: '', ra: 2.62668602, dec: 65.74533815, mag: 5.8, ci: 1.561, },
		    '211046': { id: '211046', con: 'Cep', name: '', ra: 2.79657724, dec: 81.44848303, mag: 5.8, ci: 1.3, },
		    '222520': { id: '222520', con: 'Ari', name: '', ra: 2.96811709, dec: 20.66873293, mag: 5.8, ci: 0.415, },
		    '283883': { id: '283883', con: 'Cam', name: '', ra: 3.8953572, dec: 57.97514292, mag: 5.8, ci: 0.182, },
		    '305174': { id: '305174', con: 'Eri', name: '', ra: 4.19338957, dec: -20.35615538, mag: 5.8, ci: 0.165, },
		    '378411': { id: '378411', con: 'Eri', name: '', ra: 5.13894157, dec: -8.66532657, mag: 5.8, ci: -0.059, },
		    '414627': { id: '414627', con: 'Ori', name: '', ra: 5.48991286, dec: -3.44639319, mag: 5.8, ci: 1.149, },
		    '486385': { id: '486385', con: 'Col', name: '', ra: 6.0908831, dec: -35.51364028, mag: 5.8, ci: 0.027, },
		    '89674': { id: '89674', con: 'Psc', name: '', ra: 1.17207, dec: 25.45775954, mag: 5.81, ci: 1.466, },
		    '176300': { id: '176300', con: 'Hor', name: '', ra: 2.33174182, dec: -55.94479772, mag: 5.81, ci: 1.57, },
		    '180074': { id: '180074', con: 'And', name: '', ra: 2.38063997, dec: 41.39629486, mag: 5.81, ci: 0.289, },
		    '197347': { id: '197347', con: 'Cet', name: '', ra: 2.60974122, dec: 7.73001869, mag: 5.81, ci: 1.04, },
		    '227616': { id: '227616', con: 'Eri', name: '', ra: 3.04885063, dec: -46.97503171, mag: 5.81, ci: 1.304, },
		    '258203': { id: '258203', con: 'Ret', name: '', ra: 3.5143634, dec: -66.48971308, mag: 5.81, ci: -0.055, },
		    '277960': { id: '277960', con: 'Eri', name: '', ra: 3.80991826, dec: -20.90297737, mag: 5.81, ci: 1.602, },
		    '318684': { id: '318684', con: 'Eri', name: '', ra: 4.38490849, dec: -24.89215619, mag: 5.81, ci: 1.507, },
		    '395151': { id: '395151', con: 'Cam', name: '', ra: 5.3036785, dec: 73.26806829, mag: 5.81, ci: -0.023, },
		    '431980': { id: '431980', con: 'Col', name: '', ra: 5.64542191, dec: -40.70731815, mag: 5.81, ci: -0.078, },
		    '471084': { id: '471084', con: 'Pic', name: '', ra: 5.97709626, dec: -44.03455944, mag: 5.81, ci: 1.061, },
		    '114821': { id: '114821', con: 'Cas', name: '', ra: 1.52048747, dec: 70.26460113, mag: 5.82, ci: 0.489, },
		    '222532': { id: '222532', con: 'Eri', name: '', ra: 2.96825928, dec: -23.60601145, mag: 5.82, ci: 1.334, },
		    '257903': { id: '257903', con: 'Per', name: '', ra: 3.51026474, dec: 48.10359824, mag: 5.82, ci: -0.033, },
		    '264769': { id: '264769', con: 'Tau', name: '', ra: 3.61313761, dec: 0.58775987, mag: 5.82, ci: 0.885, },
		    '279131': { id: '279131', con: 'Cam', name: '', ra: 3.82683364, dec: 63.29696521, mag: 5.82, ci: 0.189, },
		    '353070': { id: '353070', con: 'Cae', name: '', ra: 4.85783808, dec: -34.90628835, mag: 5.82, ci: 0.105, },
		    '490124': { id: '490124', con: 'Col', name: '', ra: 6.11768574, dec: -34.31202083, mag: 5.82, ci: -0.137, },
		    '54649': { id: '54649', con: 'Cas', name: '', ra: 0.70094995, dec: 66.14759289, mag: 5.83, ci: 1.042, },
		    '82470': { id: '82470', con: 'Cas', name: '', ra: 1.07206974, dec: 61.58018474, mag: 5.83, ci: 0.569, },
		    '138544': { id: '138544', con: 'Ari', name: '', ra: 1.83572335, dec: 22.27485376, mag: 5.83, ci: 0.743, },
		    '211918': { id: '211918', con: 'Ari', name: '', ra: 2.80891379, dec: 18.28379329, mag: 5.83, ci: 1.216, },
		    '429082': { id: '429082', con: 'Tau', name: '', ra: 5.61912972, dec: 26.92433735, mag: 5.83, ci: -0.075, },
		    '13869': { id: '13869', con: 'Psc', name: '', ra: 0.17190837, dec: -5.24858881, mag: 5.84, ci: 0.973, },
		    '14405': { id: '14405', con: 'Cet', name: '', ra: 0.17856514, dec: -12.57989494, mag: 5.84, ci: 1, },
		    '105469': { id: '105469', con: 'Scl', name: '', ra: 1.3919323, dec: -30.94561716, mag: 5.84, ci: 1.612, },
		    '148186': { id: '148186', con: 'Tri', name: '', ra: 1.96215128, dec: 27.80438117, mag: 5.84, ci: 1.576, },
		    '162703': { id: '162703', con: 'Phe', name: '', ra: 2.15258103, dec: -43.51660229, mag: 5.84, ci: 1.197, },
		    '192706': { id: '192706', con: 'Tri', name: '', ra: 2.54795035, dec: 34.54241512, mag: 5.84, ci: 1.083, },
		    '199526': { id: '199526', con: 'For', name: '', ra: 2.63851699, dec: -30.19406457, mag: 5.84, ci: 0.476, },
		    '226620': { id: '226620', con: 'Eri', name: '', ra: 3.03225512, dec: -9.96140804, mag: 5.84, ci: 1.092, },
		    '243421': { id: '243421', con: 'Hor', name: '', ra: 3.29072067, dec: -47.75166687, mag: 5.84, ci: 1.228, },
		    '303359': { id: '303359', con: 'Cep', name: '', ra: 4.16712165, dec: 86.6261377, mag: 5.84, ci: 0.393, },
		    '350221': { id: '350221', con: 'Aur', name: '', ra: 4.82196586, dec: 32.58818734, mag: 5.84, ci: 0.25, },
		    '363299': { id: '363299', con: 'Men', name: '', ra: 4.98082396, dec: -82.47051407, mag: 5.84, ci: 0.932, },
		    '377756': { id: '377756', con: 'Tau', name: '', ra: 5.13206561, dec: 21.70482151, mag: 5.84, ci: 0.168, },
		    '205346': { id: '205346', con: 'Per', name: '', ra: 2.71653381, dec: 53.52610491, mag: 5.85, ci: 1.125, },
		    '289930': { id: '289930', con: 'Eri', name: '', ra: 3.98122096, dec: -5.46994444, mag: 5.85, ci: 1.001, },
		    '315820': { id: '315820', con: 'Eri', name: '', ra: 4.34523169, dec: -7.59249352, mag: 5.85, ci: -0.124, },
		    '336550': { id: '336550', con: 'Tau', name: '', ra: 4.63773092, dec: 20.68471913, mag: 5.85, ci: -0.019, },
		    '22855': { id: '22855', con: 'Cas', name: '', ra: 0.28584548, dec: 47.94740382, mag: 5.86, ci: -0.079, },
		    '62106': { id: '62106', con: 'Cas', name: '', ra: 0.80253883, dec: 72.67448654, mag: 5.86, ci: 1.01, },
		    '136049': { id: '136049', con: 'Ari', name: '', ra: 1.80303788, dec: 16.95554991, mag: 5.86, ci: -0.039, },
		    '167635': { id: '167635', con: 'Cet', name: '', ra: 2.21694097, dec: -21.00013659, mag: 5.86, ci: 1.006, },
		    '215465': { id: '215465', con: 'Per', name: '', ra: 2.86159158, dec: 46.84194151, mag: 5.86, ci: 0.903, },
		    '266631': { id: '266631', con: 'Eri', name: '', ra: 3.64145935, dec: -7.39186151, mag: 5.86, ci: 0.98, },
		    '316738': { id: '316738', con: 'Eri', name: '', ra: 4.35751077, dec: -0.09817595, mag: 5.86, ci: 1.32, },
		    '342611': { id: '342611', con: 'Per', name: '', ra: 4.72266472, dec: 49.97378877, mag: 5.86, ci: 0.013, },
		    '369238': { id: '369238', con: 'Eri', name: '', ra: 5.04594329, dec: -4.21012574, mag: 5.86, ci: 1.212, },
		    '410471': { id: '410471', con: 'Col', name: '', ra: 5.45147911, dec: -40.94353078, mag: 5.86, ci: 0.239, },
		    '418649': { id: '418649', con: 'Pic', name: '', ra: 5.52666723, dec: -45.92531228, mag: 5.86, ci: 1.349, },
		    '3620': { id: '3620', con: 'Cas', name: '', ra: 0.04335865, dec: 66.09896499, mag: 5.87, ci: 1.073, },
		    '96689': { id: '96689', con: 'Cas', name: '', ra: 1.2699734, dec: 71.74384495, mag: 5.87, ci: 2.042, },
		    '101061': { id: '101061', con: 'Cet', name: '', ra: 1.33008807, dec: -0.50878215, mag: 5.87, ci: 0.635, },
		    '154873': { id: '154873', con: 'Cet', name: '', ra: 2.04960249, dec: -15.30592866, mag: 5.87, ci: 0.966, },
		    '323838': { id: '323838', con: 'Tau', name: '', ra: 4.45799142, dec: 11.2123058, mag: 5.87, ci: 0.049, },
		    '430676': { id: '430676', con: 'Ori', name: '', ra: 5.63364391, dec: 7.5414176, mag: 5.87, ci: -0.061, },
		    '452871': { id: '452871', con: 'Lep', name: '', ra: 5.83152797, dec: -22.97187671, mag: 5.87, ci: 0.055, },
		    '464114': { id: '464114', con: 'Ori', name: '', ra: 5.92504751, dec: -4.61654279, mag: 5.87, ci: 1.173, },
		    '24820': { id: '24820', con: 'And', name: '', ra: 0.31062677, dec: 31.51722511, mag: 5.88, ci: -0.014, },
		    '41420': { id: '41420', con: 'And', name: '', ra: 0.52378918, dec: 33.58164872, mag: 5.88, ci: 1.133, },
		    '51325': { id: '51325', con: 'Psc', name: '', ra: 0.65605731, dec: 21.25047439, mag: 5.88, ci: 0.85, },
		    '71530': { id: '71530', con: 'Cet', name: '', ra: 0.92844372, dec: -7.34714376, mag: 5.88, ci: 1.52, },
		    '123033': { id: '123033', con: 'Oct', name: '', ra: 1.63209855, dec: -82.97499543, mag: 5.88, ci: 0.62, },
		    '184143': { id: '184143', con: 'Cet', name: '', ra: 2.43343033, dec: -15.34125115, mag: 5.88, ci: 0.116, },
		    '189790': { id: '189790', con: 'Ari', name: '', ra: 2.5089873, dec: 25.23502935, mag: 5.88, ci: 0.412, },
		    '226301': { id: '226301', con: 'For', name: '', ra: 3.02712077, dec: -28.09154915, mag: 5.88, ci: 0.794, },
		    '298624': { id: '298624', con: 'Cam', name: '', ra: 4.10088415, dec: 68.67997374, mag: 5.88, ci: 1.543, },
		    '312355': { id: '312355', con: 'Ret', name: '', ra: 4.29451994, dec: -63.25546882, mag: 5.88, ci: -0.061, },
		    '332374': { id: '332374', con: 'Tau', name: '', ra: 4.57721957, dec: 28.96114832, mag: 5.88, ci: -0.048, },
		    '384203': { id: '384203', con: 'Ori', name: '', ra: 5.19593009, dec: 1.03679191, mag: 5.88, ci: 0.662, },
		    '438244': { id: '438244', con: 'Lep', name: '', ra: 5.70387743, dec: -22.37371453, mag: 5.88, ci: 0.08, },
		    '486379': { id: '486379', con: 'Mon', name: '', ra: 6.09084229, dec: -10.24259267, mag: 5.88, ci: 0.374, },
		    '27137': { id: '27137', con: 'And', name: '', ra: 0.34011185, dec: 30.93560425, mag: 5.89, ci: -0.098, },
		    '48099': { id: '48099', con: 'Psc', name: '', ra: 0.61314253, dec: 15.23173002, mag: 5.89, ci: -0.146, },
		    '52616': { id: '52616', con: 'Tuc', name: '', ra: 0.67379679, dec: -59.45460308, mag: 5.89, ci: 0.564, },
		    '145845': { id: '145845', con: 'And', name: '', ra: 1.93180014, dec: 37.27778946, mag: 5.89, ci: 1.599, },
		    '150569': { id: '150569', con: 'Ari', name: '', ra: 1.99324531, dec: 21.0585708, mag: 5.89, ci: 1.031, },
		    '151342': { id: '151342', con: 'Psc', name: '', ra: 2.00254436, dec: 3.09702078, mag: 5.89, ci: 0.61, },
		    '179062': { id: '179062', con: 'Cet', name: '', ra: 2.36805087, dec: -17.66216549, mag: 5.89, ci: 1.231, },
		    '184865': { id: '184865', con: 'Cet', name: '', ra: 2.44311604, dec: -20.04261679, mag: 5.89, ci: 1.247, },
		    '187648': { id: '187648', con: 'Tri', name: '', ra: 2.48013737, dec: 29.93176099, mag: 5.89, ci: 0.591, },
		    '212176': { id: '212176', con: 'Ari', name: '', ra: 2.81275181, dec: 25.18806457, mag: 5.89, ci: -0.033, },
		    '224209': { id: '224209', con: 'Per', name: '', ra: 2.99441106, dec: 41.03294309, mag: 5.89, ci: 1.445, },
		    '232378': { id: '232378', con: 'Cas', name: '', ra: 3.12194431, dec: 64.05760627, mag: 5.89, ci: -0.02, },
		    '292314': { id: '292314', con: 'Tau', name: '', ra: 4.01354611, dec: 18.19400377, mag: 5.89, ci: 0.319, },
		    '300980': { id: '300980', con: 'Tau', name: '', ra: 4.13317111, dec: 17.33989117, mag: 5.89, ci: 1.497, },
		    '383493': { id: '383493', con: 'Ori', name: '', ra: 5.18866031, dec: -2.49078209, mag: 5.89, ci: 0.462, },
		    '467058': { id: '467058', con: 'Ori', name: '', ra: 5.94706939, dec: 11.52105805, mag: 5.89, ci: 1.111, },
		    '470612': { id: '470612', con: 'Ori', name: '', ra: 5.97345649, dec: 1.83711208, mag: 5.89, ci: 0.223, },
		    '5755': { id: '5755', con: 'Cas', name: '', ra: 0.07046181, dec: 62.28766427, mag: 5.9, ci: 0.274, },
		    '52971': { id: '52971', con: 'Cet', name: '', ra: 0.67843666, dec: -4.35184015, mag: 5.9, ci: 1.091, },
		    '57263': { id: '57263', con: 'Scl', name: '', ra: 0.73669385, dec: -38.42169241, mag: 5.9, ci: 1.144, },
		    '63411': { id: '63411', con: 'Cet', name: '', ra: 0.8205422, dec: -24.13666304, mag: 5.9, ci: 0.944, },
		    '118522': { id: '118522', con: 'And', name: '', ra: 1.57127993, dec: 37.2371545, mag: 5.9, ci: -0.067, },
		    '119190': { id: '119190', con: 'Psc', name: '', ra: 1.58029595, dec: 18.46051892, mag: 5.9, ci: 1.536, },
		    '180164': { id: '180164', con: 'Eri', name: '', ra: 2.38185421, dec: -51.09213106, mag: 5.9, ci: 0.213, },
		    '297767': { id: '297767', con: 'Tau', name: '', ra: 4.08896079, dec: 22.00890575, mag: 5.9, ci: 0.62, },
		    '324893': { id: '324893', con: 'Tau', name: '', ra: 4.47316669, dec: 14.7409784, mag: 5.9, ci: 0.325, },
		    '386029': { id: '386029', con: 'Ori', name: '', ra: 5.21336899, dec: -6.05719039, mag: 5.9, ci: 0.96, },
		    '463045': { id: '463045', con: 'Aur', name: '', ra: 5.91638608, dec: 31.70149665, mag: 5.9, ci: 0.144, },
		    '472680': { id: '472680', con: 'Aur', name: '', ra: 5.98938368, dec: 49.92453599, mag: 5.9, ci: 1.194, },
		    '485522': { id: '485522', con: 'Aur', name: '', ra: 6.08427406, dec: 42.98163515, mag: 5.9, ci: 0.358, },
		    '136354': { id: '136354', con: 'Psc', name: '', ra: 1.80722736, dec: 3.68544652, mag: 5.91, ci: 0.97, },
		    '169627': { id: '169627', con: 'Phe', name: '', ra: 2.24220708, dec: -41.16676167, mag: 5.91, ci: 0.965, },
		    '193012': { id: '193012', con: 'For', name: '', ra: 2.5519519, dec: -34.64996549, mag: 5.91, ci: 1.064, },
		    '197854': { id: '197854', con: 'And', name: '', ra: 2.61588563, dec: 38.73357793, mag: 5.91, ci: 0.502, },
		    '226597': { id: '226597', con: 'Ari', name: '', ra: 3.03170597, dec: 26.46235345, mag: 5.91, ci: 0.141, },
		    '246059': { id: '246059', con: 'Ari', name: '', ra: 3.33216549, dec: 27.07113178, mag: 5.91, ci: 0.86, },
		    '260218': { id: '260218', con: 'Per', name: '', ra: 3.54444912, dec: 35.46172719, mag: 5.91, ci: -0.084, },
		    '275203': { id: '275203', con: 'Tau', name: '', ra: 3.76926796, dec: 6.80352409, mag: 5.91, ci: 0.992, },
		    '275561': { id: '275561', con: 'For', name: '', ra: 3.77428568, dec: -29.33816002, mag: 5.91, ci: 0.11, },
		    '278012': { id: '278012', con: 'Eri', name: '', ra: 3.81082058, dec: 0.22785706, mag: 5.91, ci: 1.224, },
		    '317258': { id: '317258', con: 'Cam', name: '', ra: 4.36439031, dec: 56.50631467, mag: 5.91, ci: 0.112, },
		    '317850': { id: '317850', con: 'Tau', name: '', ra: 4.37298356, dec: 20.82122927, mag: 5.91, ci: 1.66, },
		    '334387': { id: '334387', con: 'Cam', name: '', ra: 4.60672167, dec: 64.261608, mag: 5.91, ci: -0.009, },
		    '367822': { id: '367822', con: 'Ori', name: '', ra: 5.03065349, dec: 0.72211559, mag: 5.91, ci: 1.267, },
		    '62281': { id: '62281', con: 'Psc', name: '', ra: 0.80483627, dec: 7.29992852, mag: 5.92, ci: 1.104, },
		    '81540': { id: '81540', con: 'Cas', name: '', ra: 1.06028167, dec: 61.07483275, mag: 5.92, ci: 0.512, },
		    '106455': { id: '106455', con: 'Cet', name: '', ra: 1.40569442, dec: -6.91467398, mag: 5.92, ci: 0.407, },
		    '107390': { id: '107390', con: 'Hyi', name: '', ra: 1.41814076, dec: -64.36947578, mag: 5.92, ci: 1.561, },
		    '113790': { id: '113790', con: 'Scl', name: '', ra: 1.50636266, dec: -26.20784844, mag: 5.92, ci: 1.327, },
		    '139425': { id: '139425', con: 'Ari', name: '', ra: 1.84777017, dec: 11.04337891, mag: 5.92, ci: 0.302, },
		    '213800': { id: '213800', con: 'For', name: '', ra: 2.83743982, dec: -35.84363868, mag: 5.92, ci: 0.899, },
		    '237015': { id: '237015', con: 'Cep', name: '', ra: 3.19518679, dec: 81.4707129, mag: 5.92, ci: 0.149, },
		    '237816': { id: '237816', con: 'Eri', name: '', ra: 3.20715377, dec: -44.4197213, mag: 5.92, ci: 0.44, },
		    '368658': { id: '368658', con: 'Cae', name: '', ra: 5.03966793, dec: -31.77133148, mag: 5.92, ci: 1.17, },
		    '409967': { id: '409967', con: 'Aur', name: '', ra: 5.44689012, dec: 34.39181379, mag: 5.92, ci: 0.138, },
		    '423236': { id: '423236', con: 'Ori', name: '', ra: 5.56779128, dec: -1.47025986, mag: 5.92, ci: 1.535, },
		    '462961': { id: '462961', con: 'Ori', name: '', ra: 5.9157461, dec: 19.74961163, mag: 5.92, ci: -0.145, },
		    '10518': { id: '10518', con: 'Cet', name: '', ra: 0.12969454, dec: -22.50855759, mag: 5.93, ci: 0.141, },
		    '43616': { id: '43616', con: 'Cas', name: '', ra: 0.55288802, dec: 54.89498388, mag: 5.93, ci: 1.037, },
		    '91384': { id: '91384', con: 'Cet', name: '', ra: 1.1954191, dec: -2.2510803, mag: 5.93, ci: 1.403, },
		    '217582': { id: '217582', con: 'For', name: '', ra: 2.89288834, dec: -38.43700207, mag: 5.93, ci: 0.437, },
		    '217605': { id: '217605', con: 'Eri', name: '', ra: 2.89314536, dec: -22.37631304, mag: 5.93, ci: 1.041, },
		    '225352': { id: '225352', con: 'Ari', name: '', ra: 3.01226147, dec: 10.87038896, mag: 5.93, ci: 1.593, },
		    '238911': { id: '238911', con: 'Per', name: '', ra: 3.22329778, dec: 48.17695099, mag: 5.93, ci: 0.972, },
		    '244047': { id: '244047', con: 'For', name: '', ra: 3.3007211, dec: -28.79708147, mag: 5.93, ci: 0.337, },
		    '253155': { id: '253155', con: 'For', name: '', ra: 3.43959043, dec: -27.31747847, mag: 5.93, ci: 0.934, },
		    '258072': { id: '258072', con: 'Tau', name: '', ra: 3.51261708, dec: 6.18869946, mag: 5.93, ci: 0.953, },
		    '283692': { id: '283692', con: 'Hor', name: '', ra: 3.89259126, dec: -46.89367262, mag: 5.93, ci: 1.22, },
		    '292134': { id: '292134', con: 'Eri', name: '', ra: 4.01129343, dec: -30.49070125, mag: 5.93, ci: 0.036, },
		    '380791': { id: '380791', con: 'Tau', name: '', ra: 5.16252633, dec: 28.03047402, mag: 5.93, ci: 0.311, },
		    '416526': { id: '416526', con: 'Ori', name: '', ra: 5.50726782, dec: 15.36045512, mag: 5.93, ci: 0.103, },
		    '436299': { id: '436299', con: 'Ori', name: '', ra: 5.68488788, dec: 0.33775218, mag: 5.93, ci: 0.311, },
		    '446399': { id: '446399', con: 'Cam', name: '', ra: 5.77510882, dec: 56.11557513, mag: 5.93, ci: 0.164, },
		    '457790': { id: '457790', con: 'Pic', name: '', ra: 5.87227829, dec: -57.15619519, mag: 5.93, ci: 0.656, },
		    '484618': { id: '484618', con: 'Pup', name: '', ra: 6.07780731, dec: -45.07889654, mag: 5.93, ci: 0.493, },
		    '496049': { id: '496049', con: 'Gem', name: '', ra: 6.15901033, dec: 22.19026245, mag: 5.93, ci: 1.626, },
		    '18328': { id: '18328', con: 'Scl', name: '', ra: 0.22840165, dec: -26.02233961, mag: 5.94, ci: 1.548, },
		    '40016': { id: '40016', con: 'Cas', name: '', ra: 0.50553578, dec: 59.97755721, mag: 5.94, ci: -0.003, },
		    '46509': { id: '46509', con: 'Cet', name: '', ra: 0.59245364, dec: -0.50561186, mag: 5.94, ci: 0.444, },
		    '58179': { id: '58179', con: 'Phe', name: '', ra: 0.7491814, dec: -42.67655963, mag: 5.94, ci: 0.297, },
		    '123708': { id: '123708', con: 'Scl', name: '', ra: 1.64096774, dec: -36.52825062, mag: 5.94, ci: 1.045, },
		    '136624': { id: '136624', con: 'And', name: '', ra: 1.810813, dec: 37.9528691, mag: 5.94, ci: 0.975, },
		    '139489': { id: '139489', con: 'Phe', name: '', ra: 1.84845397, dec: -50.20613681, mag: 5.94, ci: 0.154, },
		    '165830': { id: '165830', con: 'Cet', name: '', ra: 2.19328767, dec: -1.82542733, mag: 5.94, ci: 0.967, },
		    '215783': { id: '215783', con: 'Cas', name: '', ra: 2.86631956, dec: 68.88849815, mag: 5.94, ci: 0.7, },
		    '248205': { id: '248205', con: 'Per', name: '', ra: 3.36459253, dec: 49.07090299, mag: 5.94, ci: 0.468, },
		    '302170': { id: '302170', con: 'Tau', name: '', ra: 4.15043616, dec: 13.39827104, mag: 5.94, ci: 0.052, },
		    '321005': { id: '321005', con: 'Ret', name: '', ra: 4.41814913, dec: -61.23819055, mag: 5.94, ci: 1.533, },
		    '331077': { id: '331077', con: 'Cam', name: '', ra: 4.55852225, dec: 72.52860497, mag: 5.94, ci: 0.306, },
		    '406162': { id: '406162', con: 'Aur', name: '', ra: 5.41070001, dec: 31.14315203, mag: 5.94, ci: 0.034, },
		    '80606': { id: '80606', con: 'And', name: '', ra: 1.0484056, dec: 41.34516881, mag: 5.95, ci: 0.161, },
		    '92574': { id: '92574', con: 'Scl', name: '', ra: 1.21262049, dec: -37.85647997, mag: 5.95, ci: 0.281, },
		    '120563': { id: '120563', con: 'Psc', name: '', ra: 1.59854365, dec: 17.43384376, mag: 5.95, ci: 0.259, },
		    '207588': { id: '207588', con: 'Cas', name: '', ra: 2.74713814, dec: 67.82462956, mag: 5.95, ci: 0.136, },
		    '262268': { id: '262268', con: 'Tau', name: '', ra: 3.57406324, dec: 24.46449991, mag: 5.95, ci: 0.123, },
		    '278573': { id: '278573', con: 'Per', name: '', ra: 3.81892129, dec: 43.96308299, mag: 5.95, ci: 0.279, },
		    '311926': { id: '311926', con: 'Eri', name: '', ra: 4.28867293, dec: -6.47217557, mag: 5.95, ci: 1.078, },
		    '315320': { id: '315320', con: 'Per', name: '', ra: 4.33734202, dec: 41.80807746, mag: 5.95, ci: 0.962, },
		    '325194': { id: '325194', con: 'Eri', name: '', ra: 4.47751048, dec: -19.45887143, mag: 5.95, ci: 1.215, },
		    '327562': { id: '327562', con: 'Eri', name: '', ra: 4.51120261, dec: -35.65350494, mag: 5.95, ci: 1.005, },
		    '365463': { id: '365463', con: 'Aur', name: '', ra: 5.00509497, dec: 39.39470357, mag: 5.95, ci: 0.415, },
		    '446534': { id: '446534', con: 'Ori', name: '', ra: 5.77636438, dec: 1.16819562, mag: 5.95, ci: 0.773, },
		    '457336': { id: '457336', con: 'Ori', name: '', ra: 5.86881353, dec: -9.04189888, mag: 5.95, ci: 0.1, },
		    '465723': { id: '465723', con: 'Lep', name: '', ra: 5.93729781, dec: -22.83997888, mag: 5.95, ci: 1.107, },
		    '28593': { id: '28593', con: 'Hyi', name: '', ra: 0.35799428, dec: -77.42687376, mag: 5.96, ci: 1.397, },
		    '139561': { id: '139561', con: 'Per', name: '', ra: 1.84920178, dec: 51.93341896, mag: 5.96, ci: 0.419, },
		    '155936': { id: '155936', con: 'Cet', name: '', ra: 2.06338069, dec: -0.34025484, mag: 5.96, ci: 0.851, },
		    '167137': { id: '167137', con: 'Ari', name: '', ra: 2.21042735, dec: 24.16777761, mag: 5.96, ci: 1.366, },
		    '252300': { id: '252300', con: 'Hyi', name: '', ra: 3.42673741, dec: -69.33643196, mag: 5.96, ci: 0.415, },
		    '349584': { id: '349584', con: 'Cam', name: '', ra: 4.81398711, dec: 75.9412186, mag: 5.96, ci: 0.283, },
		    '396146': { id: '396146', con: 'Lep', name: '', ra: 5.31402014, dec: -18.13004694, mag: 5.96, ci: 0.572, },
		    '431801': { id: '431801', con: 'Ori', name: '', ra: 5.64388121, dec: -6.57396067, mag: 5.96, ci: -0.216, },
		    '453540': { id: '453540', con: 'Ori', name: '', ra: 5.83696253, dec: 4.42340661, mag: 5.96, ci: 1.361, },
		    '457921': { id: '457921', con: 'Ori', name: '', ra: 5.87316822, dec: 19.86784642, mag: 5.96, ci: 0.549, },
		    '75021': { id: '75021', con: 'Cas', name: '', ra: 0.97529512, dec: 66.35179414, mag: 5.97, ci: -0.008, },
		    '89973': { id: '89973', con: 'Cet', name: '', ra: 1.17598662, dec: 2.4456708, mag: 5.97, ci: 1.491, },
		    '94265': { id: '94265', con: 'Psc', name: '', ra: 1.23545271, dec: 16.1334831, mag: 5.97, ci: -0.082, },
		    '105342': { id: '105342', con: 'Psc', name: '', ra: 1.39026366, dec: 20.46896448, mag: 5.97, ci: 1.677, },
		    '127662': { id: '127662', con: 'Tri', name: '', ra: 1.69423276, dec: 30.04712166, mag: 5.97, ci: 1.015, },
		    '154412': { id: '154412', con: 'Ari', name: '', ra: 2.0430768, dec: 13.47671807, mag: 5.97, ci: 1.584, },
		    '220465': { id: '220465', con: 'Cet', name: '', ra: 2.93715823, dec: 8.38156569, mag: 5.97, ci: 0.478, },
		    '235837': { id: '235837', con: 'Ari', name: '', ra: 3.17744276, dec: 11.87262786, mag: 5.97, ci: -0.061, },
		    '243759': { id: '243759', con: 'Per', name: '', ra: 3.29604289, dec: 39.2833722, mag: 5.97, ci: 0.056, },
		    '267180': { id: '267180', con: 'Eri', name: '', ra: 3.65031036, dec: -5.6262111, mag: 5.97, ci: 0.921, },
		    '283249': { id: '283249', con: 'Tau', name: '', ra: 3.88612408, dec: 17.32708506, mag: 5.97, ci: 0.354, },
		    '320852': { id: '320852', con: 'Tau', name: '', ra: 4.41586857, dec: 19.04200817, mag: 5.97, ci: 0.378, },
		    '340763': { id: '340763', con: 'Per', name: '', ra: 4.69729348, dec: 38.28017879, mag: 5.97, ci: 0.593, },
		    '354891': { id: '354891', con: 'Tau', name: '', ra: 4.87975476, dec: 27.89748459, mag: 5.97, ci: 0.368, },
		    '376895': { id: '376895', con: 'Lep', name: '', ra: 5.1236008, dec: -12.49127313, mag: 5.97, ci: 0.606, },
		    '428968': { id: '428968', con: 'Ori', name: '', ra: 5.61788398, dec: 11.03499852, mag: 5.97, ci: 1.592, },
		    '439467': { id: '439467', con: 'Ori', name: '', ra: 5.71497536, dec: -6.79616139, mag: 5.97, ci: 0.447, },
		    '450362': { id: '450362', con: 'Ori', name: '', ra: 5.80970589, dec: -4.09464311, mag: 5.97, ci: 0.639, },
		    '454104': { id: '454104', con: 'Ori', name: '', ra: 5.84167393, dec: 2.0247006, mag: 5.97, ci: 0.953, },
		    '466268': { id: '466268', con: 'Ori', name: '', ra: 5.94112111, dec: 9.50939515, mag: 5.97, ci: -0.038, },
		    '8473': { id: '8473', con: 'Cas', name: '', ra: 0.10439284, dec: 58.43680825, mag: 5.98, ci: 0.687, },
		    '61167': { id: '61167', con: 'Psc', name: '', ra: 0.78989772, dec: 6.74094595, mag: 5.98, ci: 0.941, },
		    '108833': { id: '108833', con: 'And', name: '', ra: 1.43852408, dec: 43.45774307, mag: 5.98, ci: 0.52, },
		    '125229': { id: '125229', con: 'Psc', name: '', ra: 1.6613383, dec: 16.40585832, mag: 5.98, ci: 1.119, },
		    '203637': { id: '203637', con: 'Cet', name: '', ra: 2.69281327, dec: -14.54928902, mag: 5.98, ci: 0.429, },
		    '242438': { id: '242438', con: 'Per', name: '', ra: 3.27644213, dec: 32.18401657, mag: 5.98, ci: 0.988, },
		    '257904': { id: '257904', con: 'Hor', name: '', ra: 3.51026474, dec: -47.3751279, mag: 5.98, ci: 0.116, },
		    '261348': { id: '261348', con: 'Cam', name: '', ra: 3.5608497, dec: 54.97485821, mag: 5.98, ci: 0.114, },
		    '342867': { id: '342867', con: 'Eri', name: '', ra: 4.72631917, dec: -8.79432409, mag: 5.98, ci: 0.645, },
		    '357606': { id: '357606', con: 'Ori', name: '', ra: 4.91408584, dec: 0.46716378, mag: 5.98, ci: -0.116, },
		    '397045': { id: '397045', con: 'Col', name: '', ra: 5.32324584, dec: -27.36888381, mag: 5.98, ci: -0.022, },
		    '433053': { id: '433053', con: 'Aur', name: '', ra: 5.65508688, dec: 29.2152121, mag: 5.98, ci: 0.144, },
		    '477985': { id: '477985', con: 'Aur', name: '', ra: 6.02862749, dec: 48.95944355, mag: 5.98, ci: 1.437, },
		    '11159': { id: '11159', con: 'Cet', name: '', ra: 0.13820347, dec: -8.82411173, mag: 5.99, ci: 1.034, },
		    '36043': { id: '36043', con: 'Scl', name: '', ra: 0.45408579, dec: -25.54717246, mag: 5.99, ci: 1.022, },
		    '55447': { id: '55447', con: 'Tuc', name: '', ra: 0.71165155, dec: -60.26280752, mag: 5.99, ci: 1.318, },
		    '74670': { id: '74670', con: 'And', name: '', ra: 0.97061649, dec: 33.95088359, mag: 5.99, ci: 1, },
		    '82099': { id: '82099', con: 'Cas', name: '', ra: 1.06733059, dec: 52.5021603, mag: 5.99, ci: 1.447, },
		    '173990': { id: '173990', con: 'Per', name: '', ra: 2.30127383, dec: 57.51631903, mag: 5.99, ci: 1.039, },
		    '180103': { id: '180103', con: 'Hyi', name: '', ra: 2.38119639, dec: -73.64579172, mag: 5.99, ci: 1.088, },
		    '204269': { id: '204269', con: 'For', name: '', ra: 2.70183552, dec: -38.38368719, mag: 5.99, ci: 0.917, },
		    '285719': { id: '285719', con: 'Eri', name: '', ra: 3.92114706, dec: -12.09911893, mag: 5.99, ci: 0.323, },
		    '346162': { id: '346162', con: 'Tau', name: '', ra: 4.77134156, dec: 18.73468863, mag: 5.99, ci: 1.221, },
		    '346793': { id: '346793', con: 'Per', name: '', ra: 4.77902159, dec: 40.312582, mag: 5.99, ci: 0.934, },
		    '391890': { id: '391890', con: 'Aur', name: '', ra: 5.27170807, dec: 34.31231789, mag: 5.99, ci: 0.199, },
		    '403778': { id: '403778', con: 'Ori', name: '', ra: 5.3884716, dec: -8.41552389, mag: 5.99, ci: -0.037, },
		    '417231': { id: '417231', con: 'Aur', name: '', ra: 5.5135139, dec: 41.46199482, mag: 5.99, ci: 1.112, },
		    '433444': { id: '433444', con: 'Ori', name: '', ra: 5.65865326, dec: -3.56470879, mag: 5.99, ci: 0.294, },
		    '462564': { id: '462564', con: 'Ori', name: '', ra: 5.91223249, dec: 0.9686144, mag: 5.99, ci: 1.328, },
		    '51940': { id: '51940', con: 'Phe', name: '', ra: 0.66443055, dec: -44.79628915, mag: 6, ci: 1.142, },
		    '154751': { id: '154751', con: 'Cas', name: '', ra: 2.04791006, dec: 64.9014666, mag: 6, ci: 0.029, },
		    '165535': { id: '165535', con: 'Cet', name: '', ra: 2.18950763, dec: -10.05216365, mag: 6, ci: 0.418, },
		    '190060': { id: '190060', con: 'Cet', name: '', ra: 2.51255652, dec: 0.2557492, mag: 6, ci: 0.168, },
		    '192735': { id: '192735', con: 'Ari', name: '', ra: 2.54837172, dec: 15.03455478, mag: 6, ci: 0.572, },
		    '312994': { id: '312994', con: 'Eri', name: '', ra: 4.30446559, dec: -20.71526029, mag: 6, ci: 1.597, },
		    '319184': { id: '319184', con: 'Tau', name: '', ra: 4.39232426, dec: 20.98204292, mag: 6, ci: 0.029, },
		    '375333': { id: '375333', con: 'Cam', name: '', ra: 5.108251, dec: 61.16974509, mag: 6, ci: 1.38, },
		    '446902': { id: '446902', con: 'Tau', name: '', ra: 5.77930464, dec: 15.82249619, mag: 6, ci: -0.061, },
		    '584955': { id: '584955', con: 'CMa', name: 'Sirius', ra: 6.7525694, dec: -16.71314306, mag: -1.44, ci: 0.009, },
		    '531292': { id: '531292', con: 'Car', name: 'Canopus', ra: 6.39919184, dec: -52.69571799, mag: -0.62, ci: 0.164, },
		    '749263': { id: '749263', con: 'CMi', name: 'Procyon', ra: 7.65514946, dec: 5.22750767, mag: 0.4, ci: 0.432, },
		    '767229': { id: '767229', con: 'Gem', name: 'Pollux', ra: 7.75537884, dec: 28.02631031, mag: 1.16, ci: 0.991, },
		    '624992': { id: '624992', con: 'CMa', name: 'Adhara', ra: 6.9770963, dec: -28.97208931, mag: 1.5, ci: -0.211, },
		    '735275': { id: '735275', con: 'Gem', name: 'Castor', ra: 7.57666793, dec: 31.88863645, mag: 1.58, ci: 0.034, },
		    '966940': { id: '966940', con: 'Car', name: 'Miaplacidus', ra: 9.22006689, dec: -69.71747245, mag: 1.67, ci: 0.07, },
		    '832325': { id: '832325', con: 'Vel', name: '', ra: 8.15887648, dec: -47.33661177, mag: 1.75, ci: -0.145, },
		    '655257': { id: '655257', con: 'CMa', name: 'Wezen', ra: 7.139857, dec: -26.3932, mag: 1.83, ci: 0.671, },
		    '864482': { id: '864482', con: 'Car', name: 'Avior', ra: 8.3752402, dec: -59.50953829, mag: 1.86, ci: 1.196, },
		    '564533': { id: '564533', con: 'Gem', name: 'Alhena', ra: 6.62852843, dec: 16.39941482, mag: 1.93, ci: 0.001, },
		    '913633': { id: '913633', con: 'Vel', name: 'Alsephina', ra: 8.74505481, dec: -54.70856797, mag: 1.93, ci: 0.043, },
		    '528279': { id: '528279', con: 'CMa', name: 'Mirzam', ra: 6.37832983, dec: -17.95591658, mag: 1.98, ci: -0.24, },
		    '992688': { id: '992688', con: 'Hya', name: 'Alphard', ra: 9.45979003, dec: -8.65860165, mag: 1.99, ci: 1.44, },
		    '816929': { id: '816929', con: 'Pup', name: 'Naos', ra: 8.05974171, dec: -40.00318846, mag: 2.21, ci: -0.269, },
		    '973979': { id: '973979', con: 'Car', name: 'Aspidiske', ra: 9.284838, dec: -59.275229, mag: 2.21, ci: 0.189, },
		    '957613': { id: '957613', con: 'Vel', name: 'Suhail', ra: 9.13326613, dec: -43.43258995, mag: 2.23, ci: 1.665, },
		    '703984': { id: '703984', con: 'CMa', name: 'Aludra', ra: 7.40158474, dec: -29.30311979, mag: 2.45, ci: -0.083, },
		    '982982': { id: '982982', con: 'Vel', name: 'Markeb', ra: 9.36856367, dec: -55.01069531, mag: 2.47, ci: -0.141, },
		    '682641': { id: '682641', con: 'Pup', name: '', ra: 7.28571033, dec: -37.09747668, mag: 2.71, ci: 1.616, },
		    '827335': { id: '827335', con: 'Pup', name: 'Tureis', ra: 8.125737, dec: -24.304324, mag: 2.83, ci: 0.458, },
		    '528912': { id: '528912', con: 'Gem', name: 'Tejat', ra: 6.382673, dec: 22.513586, mag: 2.87, ci: 1.621, },
		    '713289': { id: '713289', con: 'CMi', name: 'Gomeisa', ra: 7.452512, dec: 8.289315, mag: 2.89, ci: -0.097, },
		    '599169': { id: '599169', con: 'Pup', name: '', ra: 6.83226906, dec: -50.61455277, mag: 2.94, ci: 1.207, },
		    '522429': { id: '522429', con: 'CMa', name: 'Furud', ra: 6.338553, dec: -30.063367, mag: 3.02, ci: -0.16, },
		    '638286': { id: '638286', con: 'CMa', name: '', ra: 7.05040881, dec: -23.83329149, mag: 3.02, ci: -0.077, },
		    '581317': { id: '581317', con: 'Gem', name: 'Mebsuta', ra: 6.73220163, dec: 25.13112434, mag: 3.06, ci: 1.377, },
		    '934992': { id: '934992', con: 'Hya', name: '', ra: 8.92323305, dec: 5.94550965, mag: 3.11, ci: 0.978, },
		    '941942': { id: '941942', con: 'UMa', name: 'Talitha', ra: 8.986828, dec: 48.041826, mag: 3.12, ci: 0.223, },
		    '981125': { id: '981125', con: 'Lyn', name: '', ra: 9.35091751, dec: 34.39256508, mag: 3.14, ci: 1.55, },
		    '999022': { id: '999022', con: 'Vel', name: '', ra: 9.52036624, dec: -57.03437817, mag: 3.16, ci: 1.538, },
		    '564661': { id: '564661', con: 'Pup', name: '', ra: 6.62935315, dec: -43.19593498, mag: 3.17, ci: -0.103, },
		    '593995': { id: '593995', con: 'Pic', name: '', ra: 6.80318173, dec: -61.94132165, mag: 3.24, ci: 0.225, },
		    '719355': { id: '719355', con: 'Pup', name: '', ra: 7.48717516, dec: -43.30143311, mag: 3.25, ci: 1.509, },
		    '508896': { id: '508896', con: 'Gem', name: 'Propus', ra: 6.247961, dec: 22.506799, mag: 3.31, ci: 1.6, },
		    '778244': { id: '778244', con: 'Pup', name: 'Azmidi', ra: 7.821571, dec: -24.85978712, mag: 3.34, ci: 1.218, },
		    '585396': { id: '585396', con: 'Gem', name: 'Alzirr', ra: 6.7548235, dec: 12.89558957, mag: 3.35, ci: 0.443, },
		    '882500': { id: '882500', con: 'UMa', name: 'Muscida', ra: 8.504431, dec: 60.718169, mag: 3.35, ci: 0.856, },
		    '917915': { id: '917915', con: 'Hya', name: 'Ashlesha', ra: 8.77959108, dec: 6.41877721, mag: 3.38, ci: 0.685, },
		    '963058': { id: '963058', con: 'Car', name: '', ra: 9.18280269, dec: -58.96689247, mag: 3.43, ci: -0.19, },
		    '798706': { id: '798706', con: 'Car', name: '', ra: 7.9463095, dec: -52.98235073, mag: 3.46, ci: -0.177, },
		    '634345': { id: '634345', con: 'CMa', name: 'Unurgunite', ra: 7.02865206, dec: -27.93483318, mag: 3.49, ci: 1.729, },
		    '598862': { id: '598862', con: 'CMa', name: '', ra: 6.830683, dec: -32.508478, mag: 3.5, ci: -0.116, },
		    '691766': { id: '691766', con: 'Gem', name: 'Wasat', ra: 7.335383, dec: 21.98232, mag: 3.5, ci: 0.374, },
		    '849883': { id: '849883', con: 'Cnc', name: 'Tarf', ra: 8.27525572, dec: 9.1855446, mag: 3.53, ci: 1.481, },
		    '764688': { id: '764688', con: 'Gem', name: '', ra: 7.74079183, dec: 24.39799681, mag: 3.57, ci: 0.932, },
		    '949805': { id: '949805', con: 'UMa', name: 'Alkaphrah', ra: 9.060427, dec: 47.156525, mag: 3.57, ci: 0.007, },
		    '685540': { id: '685540', con: 'Gem', name: '', ra: 7.30154971, dec: 16.54038384, mag: 3.58, ci: 0.106, },
		    '607710': { id: '607710', con: 'Gem', name: '', ra: 6.87981625, dec: 33.96125471, mag: 3.6, ci: 0.102, },
		    '904474': { id: '904474', con: 'Vel', name: '', ra: 8.67155139, dec: -52.92191154, mag: 3.6, ci: -0.168, },
		    '998113': { id: '998113', con: 'Vel', name: '', ra: 9.51165788, dec: -40.46674196, mag: 3.6, ci: 0.371, },
		    '767018': { id: '767018', con: 'Pup', name: '', ra: 7.75424909, dec: -37.96858216, mag: 3.62, ci: 1.706, },
		    '999529': { id: '999529', con: 'UMa', name: '', ra: 9.525453, dec: 63.061861, mag: 3.65, ci: 0.36, },
		    '911276': { id: '911276', con: 'Pyx', name: '', ra: 8.72653808, dec: -33.18638549, mag: 3.68, ci: -0.18, },
		    '786097': { id: '786097', con: 'Pup', name: '', ra: 7.87028797, dec: -40.57578007, mag: 3.71, ci: 1.012, },
		    '950787': { id: '950787', con: 'Vel', name: '', ra: 9.0692448, dec: -47.09773947, mag: 3.75, ci: 1.174, },
		    '543004': { id: '543004', con: 'Mon', name: '', ra: 6.48039584, dec: -7.0344483, mag: 3.76, ci: -0.113, },
		    '872192': { id: '872192', con: 'Vol', name: '', ra: 8.42894327, dec: -66.1368911, mag: 3.77, ci: 1.132, },
		    '905184': { id: '905184', con: 'Vel', name: '', ra: 8.67710282, dec: -46.6487452, mag: 3.77, ci: 0.67, },
		    '656368': { id: '656368', con: 'Vol', name: '', ra: 7.14579554, dec: -70.49892452, mag: 3.78, ci: 1.006, },
		    '708959': { id: '708959', con: 'Gem', name: '', ra: 7.42877664, dec: 27.79808119, mag: 3.78, ci: 1.024, },
		    '747881': { id: '747881', con: 'Pup', name: '', ra: 7.64705002, dec: -26.80180356, mag: 3.8, ci: -0.159, },
		    '977169': { id: '977169', con: 'Lyn', name: '', ra: 9.314069, dec: 36.802597, mag: 3.82, ci: 0.066, },
		    '934396': { id: '934396', con: 'Car', name: '', ra: 8.91745346, dec: -60.64461452, mag: 3.84, ci: -0.104, },
		    '526860': { id: '526860', con: 'Col', name: '', ra: 6.36856311, dec: -33.43640196, mag: 3.85, ci: 0.858, },
		    '916410': { id: '916410', con: 'Vel', name: '', ra: 8.76712326, dec: -46.04153102, mag: 3.87, ci: 0.015, },
		    '611703': { id: '611703', con: 'CMa', name: '', ra: 6.90220948, dec: -24.18421182, mag: 3.89, ci: 1.74, },
		    '969051': { id: '969051', con: 'Hya', name: '', ra: 9.23940741, dec: 2.31427285, mag: 3.89, ci: -0.06, },
		    '872003': { id: '872003', con: 'Hya', name: '', ra: 8.427676, dec: -3.906424, mag: 3.91, ci: -0.012, },
		    '756782': { id: '756782', con: 'Vol', name: '', ra: 7.69701717, dec: -72.60609618, mag: 3.93, ci: 1.033, },
		    '755006': { id: '755006', con: 'Mon', name: '', ra: 7.68745354, dec: -9.55112894, mag: 3.94, ci: 1.022, },
		    '762791': { id: '762791', con: 'Pup', name: '', ra: 7.73013, dec: -28.954826, mag: 3.94, ci: 0.16, },
		    '913598': { id: '913598', con: 'Cnc', name: 'Asellus Australis', ra: 8.74475018, dec: 18.15430914, mag: 3.94, ci: 1.083, },
		    '561907': { id: '561907', con: 'CMa', name: '', ra: 6.61139948, dec: -19.25587721, mag: 3.95, ci: 1.037, },
		    '944469': { id: '944469', con: 'Lyn', name: '', ra: 9.010685, dec: 41.782911, mag: 3.96, ci: 0.463, },
		    '963600': { id: '963600', con: 'Car', name: '', ra: 9.18797764, dec: -62.3169797, mag: 3.96, ci: -0.18, },
		    '681700': { id: '681700', con: 'Vol', name: '', ra: 7.28050711, dec: -67.9571512, mag: 3.97, ci: 0.76, },
		    '904056': { id: '904056', con: 'Pyx', name: '', ra: 8.66837297, dec: -35.30835275, mag: 3.97, ci: 0.936, },
		    '508837': { id: '508837', con: 'Mon', name: '', ra: 6.24759236, dec: -6.27477334, mag: 3.99, ci: 1.319, },
		    '947664': { id: '947664', con: 'Vol', name: '', ra: 9.04077652, dec: -66.39606826, mag: 4, ci: 0.145, },
		    '641742': { id: '641742', con: 'Gem', name: 'Mekbuda', ra: 7.0684809, dec: 20.57029288, mag: 4.01, ci: 0.899, },
		    '675496': { id: '675496', con: 'CMa', name: '', ra: 7.24684835, dec: -26.77266733, mag: 4.01, ci: -0.15, },
		    '925461': { id: '925461', con: 'Pyx', name: '', ra: 8.842201, dec: -27.7098454, mag: 4.02, ci: 1.272, },
		    '917770': { id: '917770', con: 'Cnc', name: '', ra: 8.77828306, dec: 28.75990042, mag: 4.03, ci: 1.007, },
		    '854784': { id: '854784', con: 'Cha', name: '', ra: 8.30876446, dec: -76.91972218, mag: 4.05, ci: 0.413, },
		    '912983': { id: '912983', con: 'Vel', name: '', ra: 8.73998515, dec: -42.64927754, mag: 4.05, ci: 0.874, },
		    '739235': { id: '739235', con: 'Gem', name: '', ra: 7.59870847, dec: 26.89574745, mag: 4.06, ci: 1.54, },
		    '611892': { id: '611892', con: 'CMa', name: '', ra: 6.90316591, dec: -12.03863013, mag: 4.08, ci: 1.418, },
		    '778070': { id: '778070', con: 'Pup', name: '', ra: 7.82063812, dec: -46.37320694, mag: 4.1, ci: -0.16, },
		    '640635': { id: '640635', con: 'CMa', name: 'Muliphein', ra: 7.06263684, dec: -15.63328488, mag: 4.11, ci: -0.112, },
		    '898713': { id: '898713', con: 'Vel', name: '', ra: 8.6273978, dec: -42.98908214, mag: 4.11, ci: 0.109, },
		    '543342': { id: '543342', con: 'Gem', name: '', ra: 6.48271886, dec: 20.2121344, mag: 4.13, ci: -0.115, },
		    '898743': { id: '898743', con: 'Hya', name: '', ra: 8.62760213, dec: 5.70378462, mag: 4.14, ci: 0.003, },
		    '832218': { id: '832218', con: 'Vel', name: '', ra: 8.15814533, dec: -47.34527805, mag: 4.143, ci: -0.199, },
		    '666134': { id: '666134', con: 'Mon', name: '', ra: 7.19773893, dec: -0.49276542, mag: 4.15, ci: -0.005, },
		    '719018': { id: '719018', con: 'Gem', name: '', ra: 7.48519925, dec: 31.78453362, mag: 4.16, ci: 0.32, },
		    '798933': { id: '798933', con: 'Pup', name: '', ra: 7.9476498, dec: -22.88012318, mag: 4.2, ci: 0.718, },
		    '789083': { id: '789083', con: 'Pup', name: '', ra: 7.8883772, dec: -48.10294218, mag: 4.22, ci: -0.13, },
		    '761319': { id: '761319', con: 'Gem', name: '', ra: 7.72186851, dec: 28.88351125, mag: 4.23, ci: 1.118, },
		    '865279': { id: '865279', con: 'Lyn', name: 'Alsciaukat', ra: 8.38058638, dec: 43.18813268, mag: 4.25, ci: 1.55, },
		    '940655': { id: '940655', con: 'Cnc', name: 'Acubens', ra: 8.9747827, dec: 11.85768694, mag: 4.26, ci: 0.141, },
		    '910538': { id: '910538', con: 'Hya', name: '', ra: 8.72040973, dec: 3.39866074, mag: 4.3, ci: -0.192, },
		    '905166': { id: '905166', con: 'Car', name: '', ra: 8.67695175, dec: -59.76100058, mag: 4.31, ci: -0.117, },
		    '510114': { id: '510114', con: 'Aur', name: '', ra: 6.25630233, dec: 29.49807515, mag: 4.32, ci: 1.021, },
		    '917119': { id: '917119', con: 'Hya', name: '', ra: 8.77292759, dec: -13.54773459, mag: 4.32, ci: 0.9, },
		    '999854': { id: '999854', con: 'Leo', name: 'Alterf', ra: 9.5286743, dec: 22.96797209, mag: 4.32, ci: 1.541, },
		    '716220': { id: '716220', con: 'CMi', name: '', ra: 7.46938736, dec: 8.92553211, mag: 4.33, ci: 1.425, },
		    '550061': { id: '550061', con: 'CMa', name: '', ra: 6.530935, dec: -23.418422, mag: 4.34, ci: -0.245, },
		    '859986': { id: '859986', con: 'Cha', name: '', ra: 8.3440386, dec: -77.48447572, mag: 4.34, ci: 1.161, },
		    '972328': { id: '972328', con: 'Car', name: '', ra: 9.27002004, dec: -57.54147386, mag: 4.34, ci: 1.602, },
		    '557798': { id: '557798', con: 'Car', name: '', ra: 6.58293866, dec: -52.97560661, mag: 4.35, ci: -0.021, },
		    '621090': { id: '621090', con: 'Lyn', name: '', ra: 6.95461092, dec: 58.42274437, mag: 4.35, ci: 0.85, },
		    '828289': { id: '828289', con: 'Vol', name: '', ra: 8.13216707, dec: -68.61706563, mag: 4.35, ci: -0.113, },
		    '921262': { id: '921262', con: 'Hya', name: '', ra: 8.80721385, dec: 5.83781082, mag: 4.35, ci: -0.044, },
		    '617583': { id: '617583', con: 'CMa', name: '', ra: 6.93561805, dec: -17.05423768, mag: 4.36, ci: -0.063, },
		    '829918': { id: '829918', con: 'Mon', name: '', ra: 8.14323573, dec: -2.98378544, mag: 4.36, ci: 0.97, },
		    '512992': { id: '512992', con: 'Col', name: '', ra: 6.27587125, dec: -35.14051763, mag: 4.37, ci: 0.978, },
		    '687470': { id: '687470', con: 'CMa', name: '', ra: 7.311802, dec: -24.954375, mag: 4.37, ci: -0.132, },
		    '530852': { id: '530852', con: 'Mon', name: '', ra: 6.39613566, dec: 4.59286794, mag: 4.39, ci: 0.215, },
		    '813357': { id: '813357', con: 'CMi', name: '', ra: 8.03776004, dec: 2.33457164, mag: 4.39, ci: 1.252, },
		    '774817': { id: '774817', con: 'Pup', name: '', ra: 7.801436, dec: -25.937169, mag: 4.4, ci: -0.07, },
		    '831014': { id: '831014', con: 'Pup', name: '', ra: 8.15045419, dec: -19.24501484, mag: 4.4, ci: -0.16, },
		    '598909': { id: '598909', con: 'Car', name: '', ra: 6.8309209, dec: -53.62244777, mag: 4.41, ci: 0.899, },
		    '663843': { id: '663843', con: 'Gem', name: '', ra: 7.18565799, dec: 30.24516353, mag: 4.41, ci: 1.261, },
		    '564990': { id: '564990', con: 'CMa', name: '', ra: 6.63150587, dec: -18.23747545, mag: 4.42, ci: 1.137, },
		    '671430': { id: '671430', con: 'Pup', name: '', ra: 7.22564454, dec: -44.6397414, mag: 4.42, ci: 1.331, },
		    '673681': { id: '673681', con: 'CMa', name: '', ra: 7.237559, dec: -26.352507, mag: 4.42, ci: -0.17, },
		    '843799': { id: '843799', con: 'Pup', name: '', ra: 8.23414498, dec: -40.34789127, mag: 4.42, ci: 1.17, },
		    '520701': { id: '520701', con: 'Lyn', name: '', ra: 6.327052, dec: 59.010964, mag: 4.44, ci: 0.032, },
		    '733715': { id: '733715', con: 'Pup', name: '', ra: 7.567551, dec: -22.296067, mag: 4.44, ci: 0.521, },
		    '837081': { id: '837081', con: 'Pup', name: '', ra: 8.18930387, dec: -39.61854641, mag: 4.44, ci: 1.59, },
		    '854867': { id: '854867', con: 'Pup', name: '', ra: 8.30925365, dec: -36.65928895, mag: 4.44, ci: 0.222, },
		    '501836': { id: '501836', con: 'Ori', name: '', ra: 6.198999, dec: 14.20876552, mag: 4.45, ci: -0.18, },
		    '901191': { id: '901191', con: 'Hya', name: 'Minchir', ra: 8.64595486, dec: 3.34143606, mag: 4.45, ci: 1.216, },
		    '943495': { id: '943495', con: 'Vel', name: '', ra: 9.00150216, dec: -41.25360954, mag: 4.45, ci: 0.646, },
		    '959191': { id: '959191', con: 'UMa', name: '', ra: 9.147863, dec: 51.604648, mag: 4.46, ci: 0.288, },
		    '541415': { id: '541415', con: 'CMa', name: '', ra: 6.46950219, dec: -32.58007046, mag: 4.47, ci: -0.169, },
		    '552649': { id: '552649', con: 'Mon', name: '', ra: 6.54839665, dec: 7.33296586, mag: 4.47, ci: 0.023, },
		    '802616': { id: '802616', con: 'Pup', name: '', ra: 7.97067653, dec: -49.24491439, mag: 4.47, ci: -0.18, },
		    '952560': { id: '952560', con: 'Car', name: '', ra: 9.08578077, dec: -72.60270412, mag: 4.47, ci: 0.607, },
		    '987448': { id: '987448', con: 'Leo', name: '', ra: 9.41090502, dec: 26.18232599, mag: 4.47, ci: 1.222, },
		    '593022': { id: '593022', con: 'Mon', name: '', ra: 6.79768007, dec: 2.41216003, mag: 4.48, ci: 1.099, },
		    '581476': { id: '581476', con: 'Gem', name: '', ra: 6.73313683, dec: 13.22800619, mag: 4.49, ci: 1.167, },
		    '668347': { id: '668347', con: 'Pup', name: '', ra: 7.20934049, dec: -46.75930683, mag: 4.49, ci: 0.324, },
		    '787276': { id: '787276', con: 'Pup', name: '', ra: 7.87740162, dec: -38.86281541, mag: 4.49, ci: -0.188, },
		    '917792': { id: '917792', con: 'Car', name: '', ra: 8.77848586, dec: -56.76978077, mag: 4.5, ci: -0.169, },
		    '995606': { id: '995606', con: 'Ant', name: '', ra: 9.48742198, dec: -35.95133667, mag: 4.51, ci: 1.408, },
		    '743475': { id: '743475', con: 'Pup', name: '', ra: 7.62280792, dec: -34.96852245, mag: 4.53, ci: -0.081, },
		    '557990': { id: '557990', con: 'CMa', name: '', ra: 6.584274, dec: -22.964793, mag: 4.54, ci: -0.035, },
		    '629394': { id: '629394', con: 'Cam', name: '', ra: 7.001121, dec: 76.97740739, mag: 4.55, ci: 1.365, },
		    '720996': { id: '720996', con: 'CMi', name: '', ra: 7.49660647, dec: 12.00656121, mag: 4.55, ci: 1.276, },
		    '954990': { id: '954990', con: 'Lyn', name: '', ra: 9.10882421, dec: 38.45221297, mag: 4.56, ci: 1.037, },
		    '904292': { id: '904292', con: 'UMa', name: '', ra: 8.67022864, dec: 64.32793567, mag: 4.59, ci: 1.179, },
		    '995422': { id: '995422', con: 'Hya', name: '', ra: 9.485805, dec: -2.768964, mag: 4.59, ci: 0.411, },
		    '711961': { id: '711961', con: 'Lyn', name: '', ra: 7.4452367, dec: 49.21152216, mag: 4.61, ci: -0.001, },
		    '806875': { id: '806875', con: 'Pup', name: '', ra: 7.9977924, dec: -18.39922887, mag: 4.61, ci: 0.087, },
		    '957699': { id: '957699', con: 'Pyx', name: '', ra: 9.13413369, dec: -25.85853921, mag: 4.62, ci: 1.594, },
		    '762005': { id: '762005', con: 'Pup', name: '', ra: 7.725663, dec: -28.410885, mag: 4.63, ci: 1.632, },
		    '788446': { id: '788446', con: 'Pup', name: '', ra: 7.88434247, dec: -49.613046, mag: 4.63, ci: -0.228, },
		    '911450': { id: '911450', con: 'Hya', name: '', ra: 8.72788131, dec: -7.23372719, mag: 4.63, ci: 0.84, },
		    '971545': { id: '971545', con: 'Vel', name: '', ra: 9.26252237, dec: -37.41314858, mag: 4.63, ci: 0.473, },
		    '686228': { id: '686228', con: 'Pup', name: '', ra: 7.30510883, dec: -36.7339557, mag: 4.65, ci: -0.099, },
		    '723724': { id: '723724', con: 'Pup', name: '', ra: 7.511834, dec: -30.962281, mag: 4.65, ci: 0.904, },
		    '737646': { id: '737646', con: 'Pup', name: '', ra: 7.58969378, dec: -28.36931859, mag: 4.65, ci: -0.111, },
		    '573013': { id: '573013', con: 'Mon', name: '', ra: 6.68296004, dec: 9.89575245, mag: 4.66, ci: -0.233, },
		    '616125': { id: '616125', con: 'CMa', name: '', ra: 6.92706392, dec: -20.13649738, mag: 4.66, ci: 0.374, },
		    '680958': { id: '680958', con: 'CMa', name: '', ra: 7.276387, dec: -27.88117707, mag: 4.66, ci: 1.589, },
		    '910644': { id: '910644', con: 'Cnc', name: 'Asellus Borealis', ra: 8.72142952, dec: 21.46849861, mag: 4.66, ci: 0.01, },
		    '953433': { id: '953433', con: 'Car', name: '', ra: 9.0939933, dec: -70.53850019, mag: 4.66, ci: -0.149, },
		    '839167': { id: '839167', con: 'Cnc', name: '', ra: 8.20354603, dec: 17.64774942, mag: 4.67, ci: 0.531, },
		    '962956': { id: '962956', con: 'UMa', name: '', ra: 9.18196046, dec: 63.51363249, mag: 4.67, ci: 0.381, },
		    '936726': { id: '936726', con: 'Vel', name: '', ra: 8.93868425, dec: -52.72348443, mag: 4.68, ci: -0.115, },
		    '746319': { id: '746319', con: 'Pup', name: '', ra: 7.638346, dec: -25.364804, mag: 4.69, ci: -0.1, },
		    '775553': { id: '775553', con: 'Pup', name: '', ra: 7.80560039, dec: -47.07772394, mag: 4.69, ci: 1.039, },
		    '810546': { id: '810546', con: 'Mon', name: '', ra: 8.02037107, dec: -1.39261026, mag: 4.69, ci: 1.475, },
		    '981886': { id: '981886', con: 'Pyx', name: '', ra: 9.35821978, dec: -25.96543915, mag: 4.71, ci: 1.633, },
		    '984930': { id: '984930', con: 'Pyx', name: '', ra: 9.38673755, dec: -28.83388113, mag: 4.71, ci: 0.892, },
		    '836834': { id: '836834', con: 'Pup', name: '', ra: 8.1878631, dec: -12.92699606, mag: 4.72, ci: 0.939, },
		    '992222': { id: '992222', con: 'Hya', name: '', ra: 9.4551145, dec: -22.3438022, mag: 4.72, ci: 1.154, },
		    '613222': { id: '613222', con: 'Gem', name: '', ra: 6.91073211, dec: 13.17782101, mag: 4.73, ci: 0.321, },
		    '837259': { id: '837259', con: 'Pup', name: '', ra: 8.19052589, dec: -42.9872758, mag: 4.73, ci: 0.164, },
		    '830969': { id: '830969', con: 'Car', name: '', ra: 8.15018494, dec: -61.30240874, mag: 4.74, ci: 0.437, },
		    '906461': { id: '906461', con: 'Vel', name: '', ra: 8.68698145, dec: -47.31712261, mag: 4.74, ci: 0.137, },
		    '947855': { id: '947855', con: 'UMa', name: '', ra: 9.04241466, dec: 67.62961701, mag: 4.74, ci: 1.542, },
		    '674913': { id: '674913', con: 'Pup', name: '', ra: 7.24392805, dec: -48.2719316, mag: 4.75, ci: -0.091, },
		    '518767': { id: '518767', con: 'Cam', name: '', ra: 6.31410565, dec: 69.31978165, mag: 4.76, ci: 0.025, },
		    '801077': { id: '801077', con: 'Pup', name: '', ra: 7.9611405, dec: -30.33456726, mag: 4.76, ci: 0.151, },
		    '591490': { id: '591490', con: 'Mon', name: '', ra: 6.78884181, dec: 8.03725286, mag: 4.77, ci: 1.396, },
		    '978837': { id: '978837', con: 'Hya', name: '', ra: 9.32955056, dec: -11.9748508, mag: 4.77, ci: 0.927, },
		    '829597': { id: '829597', con: 'Lyn', name: '', ra: 8.14095748, dec: 51.5066692, mag: 4.78, ci: 0.048, },
		    '842366': { id: '842366', con: 'Pup', name: '', ra: 8.22486607, dec: -35.89951463, mag: 4.78, ci: -0.11, },
		    '864522': { id: '864522', con: 'Vel', name: '', ra: 8.37547319, dec: -48.49041887, mag: 4.79, ci: -0.146, },
		    '980927': { id: '980927', con: 'Car', name: '', ra: 9.34911452, dec: -62.4046329, mag: 4.79, ci: 0.926, },
		    '568669': { id: '568669', con: 'Aur', name: '', ra: 6.65550776, dec: 42.48888048, mag: 4.8, ci: 1.236, },
		    '961971': { id: '961971', con: 'UMa', name: '', ra: 9.17320497, dec: 67.13400723, mag: 4.8, ci: 0.489, },
		    '972303': { id: '972303', con: 'UMa', name: '', ra: 9.26981358, dec: 54.02185653, mag: 4.8, ci: 0.199, },
		    '980114': { id: '980114', con: 'Hya', name: '', ra: 9.34139403, dec: -9.55569885, mag: 4.8, ci: 0.913, },
		    '808143': { id: '808143', con: 'Car', name: '', ra: 8.005547, dec: -63.567456, mag: 4.81, ci: -0.173, },
		    '568539': { id: '568539', con: 'CMa', name: '', ra: 6.65464403, dec: -14.14576059, mag: 4.82, ci: 1.459, },
		    '610022': { id: '610022', con: 'CMa', name: '', ra: 6.892474, dec: -20.224254, mag: 4.82, ci: -0.212, },
		    '732955': { id: '732955', con: 'Pup', name: '', ra: 7.56332316, dec: -14.5238965, mag: 4.82, ci: 1.362, },
		    '656684': { id: '656684', con: 'Pup', name: '', ra: 7.14751888, dec: -39.65565278, mag: 4.83, ci: -0.179, },
		    '681053': { id: '681053', con: 'CMa', name: '', ra: 7.27689893, dec: -23.31559164, mag: 4.83, ci: 1.601, },
		    '861743': { id: '861743', con: 'Pup', name: '', ra: 8.35639618, dec: -33.05436579, mag: 4.83, ci: 1.419, },
		    '908956': { id: '908956', con: 'Vel', name: '', ra: 8.70705178, dec: -53.11398217, mag: 4.83, ci: -0.173, },
		    '749712': { id: '749712', con: 'Pup', name: '', ra: 7.65759376, dec: -38.30802555, mag: 4.84, ci: -0.189, },
		    '893603': { id: '893603', con: 'Car', name: '', ra: 8.58880774, dec: -58.00923266, mag: 4.84, ci: 0.981, },
		    '721161': { id: '721161', con: 'Pup', name: '', ra: 7.497615, dec: -23.024287, mag: 4.85, ci: 0.243, },
		    '588212': { id: '588212', con: 'Lyn', name: '', ra: 6.77034448, dec: 59.44319961, mag: 4.86, ci: 0.084, },
		    '903214': { id: '903214', con: 'Pyx', name: '', ra: 8.66179838, dec: -29.5610888, mag: 4.86, ci: 0.9, },
		    '670432': { id: '670432', con: 'Pup', name: '', ra: 7.2203752, dec: -45.18274543, mag: 4.87, ci: -0.003, },
		    '907481': { id: '907481', con: 'Hya', name: '', ra: 8.69537121, dec: -15.9433864, mag: 4.87, ci: 1.063, },
		    '935247': { id: '935247', con: 'Pyx', name: '', ra: 8.92543558, dec: -27.68186339, mag: 4.87, ci: 0.142, },
		    '687368': { id: '687368', con: 'CMa', name: '', ra: 7.31121623, dec: -24.55870067, mag: 4.88, ci: -0.16, },
		    '748861': { id: '748861', con: 'Gem', name: 'Jishui', ra: 7.65275885, dec: 34.58435476, mag: 4.89, ci: 0.413, },
		    '769450': { id: '769450', con: 'Gem', name: '', ra: 7.76873532, dec: 18.51003847, mag: 4.89, ci: 1.425, },
		    '622084': { id: '622084', con: 'Lyn', name: '', ra: 6.96030739, dec: 45.0940984, mag: 4.9, ci: 0.027, },
		    '521672': { id: '521672', con: 'Ori', name: '', ra: 6.33322224, dec: -2.94449313, mag: 4.91, ci: 1.613, },
		    '660998': { id: '660998', con: 'Mon', name: '', ra: 7.17046707, dec: -4.23710687, mag: 4.91, ci: 1.02, },
		    '665490': { id: '665490', con: 'Aur', name: '', ra: 7.19425696, dec: 39.32054585, mag: 4.91, ci: 1.451, },
		    '533565': { id: '533565', con: 'Aur', name: '', ra: 6.41497295, dec: 49.28789395, mag: 4.92, ci: 1.905, },
		    '641067': { id: '641067', con: 'Pup', name: '', ra: 7.06488986, dec: -49.58391765, mag: 4.92, ci: 0.14, },
		    '724822': { id: '724822', con: 'Cam', name: '', ra: 7.51790597, dec: 82.41146515, mag: 4.92, ci: 1.633, },
		    '971301': { id: '971301', con: 'Vel', name: '', ra: 9.26019688, dec: -38.56994143, mag: 4.92, ci: 1.084, },
		    '738455': { id: '738455', con: 'Car', name: '', ra: 7.59436774, dec: -52.53383268, mag: 4.93, ci: 1.373, },
		    '760373': { id: '760373', con: 'Lyn', name: '', ra: 7.716788, dec: 58.71036, mag: 4.93, ci: 0.104, },
		    '806540': { id: '806540', con: 'Mon', name: '', ra: 7.99559795, dec: -3.67958251, mag: 4.93, ci: 1.205, },
		    '937965': { id: '937965', con: 'Car', name: '', ra: 8.94956021, dec: -59.22933668, mag: 4.93, ci: -0.182, },
		    '618013': { id: '618013', con: 'Pup', name: '', ra: 6.93777519, dec: -48.72114192, mag: 4.94, ci: 1.668, },
		    '698317': { id: '698317', con: 'CMa', name: '', ra: 7.37042486, dec: -19.01659949, mag: 4.94, ci: -0.039, },
		    '816743': { id: '816743', con: 'Gem', name: '', ra: 8.0586346, dec: 27.79431875, mag: 4.94, ci: 1.13, },
		    '923974': { id: '923974', con: 'Vel', name: '', ra: 8.82989933, dec: -45.30787599, mag: 4.94, ci: 0.043, },
		    '502125': { id: '502125', con: 'Ori', name: '', ra: 6.20091118, dec: 16.13040337, mag: 4.95, ci: -0.149, },
		    '789612': { id: '789612', con: 'Gem', name: '', ra: 7.8916156, dec: 26.76578861, mag: 4.97, ci: 0.098, },
		    '752372': { id: '752372', con: 'Pup', name: '', ra: 7.67311392, dec: -15.26392361, mag: 4.98, ci: 1.543, },
		    '903894': { id: '903894', con: 'Hya', name: '', ra: 8.66707553, dec: -12.47537354, mag: 4.98, ci: 1.415, },
		    '601610': { id: '601610', con: 'Aur', name: '', ra: 6.8460953, dec: 41.78123273, mag: 4.99, ci: 1.256, },
		    '601938': { id: '601938', con: 'Pup', name: '', ra: 6.84787545, dec: -34.36731945, mag: 4.99, ci: 1.379, },
		    '637952': { id: '637952', con: 'Mon', name: '', ra: 7.048549, dec: -4.239231, mag: 4.99, ci: -0.195, },
		    '708738': { id: '708738', con: 'CMi', name: '', ra: 7.42747145, dec: 9.27609612, mag: 4.99, ci: 0.991, },
		    '842000': { id: '842000', con: 'Pup', name: '', ra: 8.22221327, dec: -15.78822208, mag: 4.99, ci: 1.066, },
		    '954029': { id: '954029', con: 'Hya', name: '', ra: 9.09954619, dec: 5.09231801, mag: 4.99, ci: 1.189, },
		    '963249': { id: '963249', con: 'Vel', name: '', ra: 9.18455518, dec: -44.86790328, mag: 4.99, ci: 0.222, },
		    '511002': { id: '511002', con: 'CMa', name: '', ra: 6.26246827, dec: -13.71841714, mag: 5, ci: -0.078, },
		    '617501': { id: '617501', con: 'CMa', name: '', ra: 6.93517958, dec: -14.0434681, mag: 5, ci: 1.182, },
		    '686921': { id: '686921', con: 'Lyn', name: '', ra: 7.30888213, dec: 49.46475229, mag: 5, ci: 0.087, },
		    '500137': { id: '500137', con: 'Dor', name: '', ra: 6.18749534, dec: -65.58941681, mag: 5.01, ci: 1.599, },
		    '516418': { id: '516418', con: 'Lyn', name: '', ra: 6.29856113, dec: 61.51528548, mag: 5.01, ci: 1.843, },
		    '721038': { id: '721038', con: 'Gem', name: '', ra: 7.49687828, dec: 27.916139, mag: 5.01, ci: 1.117, },
		    '786226': { id: '786226', con: 'Pup', name: '', ra: 7.87101846, dec: -34.70544353, mag: 5.01, ci: 0.47, },
		    '892289': { id: '892289', con: 'Vel', name: '', ra: 8.57877658, dec: -49.94420094, mag: 5.01, ci: 1.304, },
		    '681688': { id: '681688', con: 'Pup', name: '', ra: 7.28039084, dec: -36.5926326, mag: 5.03, ci: -0.161, },
		    '768956': { id: '768956', con: 'Pup', name: '', ra: 7.76579747, dec: -14.56380459, mag: 5.03, ci: 0.342, },
		    '880661': { id: '880661', con: 'Vel', name: '', ra: 8.49096796, dec: -44.72482057, mag: 5.03, ci: -0.168, },
		    '512700': { id: '512700', con: 'Ori', name: '', ra: 6.27406071, dec: 12.27216283, mag: 5.04, ci: 0.431, },
		    '578872': { id: '578872', con: 'Aur', name: '', ra: 6.71804756, dec: 44.52444987, mag: 5.04, ci: 1.479, },
		    '702126': { id: '702126', con: 'Gem', name: '', ra: 7.39125344, dec: 25.05053145, mag: 5.04, ci: 0.902, },
		    '749770': { id: '749770', con: 'Gem', name: '', ra: 7.65794238, dec: 17.67451547, mag: 5.04, ci: 1.616, },
		    '760174': { id: '760174', con: 'Pup', name: '', ra: 7.71586009, dec: -45.17311909, mag: 5.04, ci: 0.765, },
		    '825159': { id: '825159', con: 'Vel', name: '', ra: 8.11120543, dec: -45.26601489, mag: 5.04, ci: 1.488, },
		    '566834': { id: '566834', con: 'Pup', name: '', ra: 6.64378785, dec: -48.22017638, mag: 5.05, ci: 0.997, },
		    '752768': { id: '752768', con: 'Cep', name: '', ra: 7.6751447, dec: 87.02009101, mag: 5.05, ci: 1.604, },
		    '901975': { id: '901975', con: 'Pyx', name: '', ra: 8.65219689, dec: -22.66183371, mag: 5.05, ci: 0.72, },
		    '501657': { id: '501657', con: 'Mon', name: '', ra: 6.197726, dec: -6.550287, mag: 5.06, ci: -0.201, },
		    '540936': { id: '540936', con: 'Mon', name: '', ra: 6.46599149, dec: -4.76215246, mag: 5.06, ci: -0.175, },
		    '734412': { id: '734412', con: 'Pup', name: '', ra: 7.57183916, dec: -23.4736603, mag: 5.06, ci: 0.468, },
		    '854299': { id: '854299', con: 'Vol', name: '', ra: 8.3052243, dec: -65.61319104, mag: 5.06, ci: 1.129, },
		    '624388': { id: '624388', con: 'Pup', name: '', ra: 6.97363764, dec: -34.11170467, mag: 5.07, ci: -0.154, },
		    '670902': { id: '670902', con: 'Gem', name: '', ra: 7.222854, dec: 16.15896481, mag: 5.07, ci: 1.653, },
		    '719667': { id: '719667', con: 'Gem', name: '', ra: 7.48901125, dec: 28.11827478, mag: 5.07, ci: 0.12, },
		    '772954': { id: '772954', con: 'Pup', name: '', ra: 7.79027554, dec: -38.51114117, mag: 5.07, ci: -0.112, },
		    '592328': { id: '592328', con: 'Mon', name: '', ra: 6.7936727, dec: -8.99849968, mag: 5.08, ci: 1.795, },
		    '800110': { id: '800110', con: 'Pup', name: '', ra: 7.95511749, dec: -44.1098649, mag: 5.08, ci: -0.166, },
		    '876485': { id: '876485', con: 'Vel', name: '', ra: 8.46016213, dec: -53.08848315, mag: 5.08, ci: 0.256, },
		    '554493': { id: '554493', con: 'Mon', name: '', ra: 6.56053368, dec: -1.2201571, mag: 5.09, ci: -0.132, },
		    '697400': { id: '697400', con: 'Gem', name: '', ra: 7.36579487, dec: 20.44365905, mag: 5.09, ci: 1.528, },
		    '710899': { id: '710899', con: 'Car', name: '', ra: 7.43940279, dec: -51.01848056, mag: 5.09, ci: 1.038, },
		    '804847': { id: '804847', con: 'Pup', name: '', ra: 7.98492063, dec: -23.31039419, mag: 5.09, ci: 1.111, },
		    '843604': { id: '843604', con: 'Pup', name: '', ra: 8.23286455, dec: -36.32227843, mag: 5.09, ci: -0.184, },
		    '925509': { id: '925509', con: 'Vel', name: '', ra: 8.84262808, dec: -46.52918926, mag: 5.09, ci: -0.205, },
		    '990376': { id: '990376', con: 'Vel', name: '', ra: 9.43832196, dec: -53.37890578, mag: 5.09, ci: -0.102, },
		    '610475': { id: '610475', con: 'Cam', name: '', ra: 6.89506869, dec: 68.88831037, mag: 5.11, ci: -0.114, },
		    '687248': { id: '687248', con: 'Pup', name: '', ra: 7.31060694, dec: -36.74274007, mag: 5.11, ci: -0.17, },
		    '662739': { id: '662739', con: 'Pup', name: '', ra: 7.17985621, dec: -48.93209745, mag: 5.12, ci: 1.251, },
		    '697714': { id: '697714', con: 'Aur', name: '', ra: 7.36739373, dec: 36.76058358, mag: 5.12, ci: 1.082, },
		    '762480': { id: '762480', con: 'Pup', name: '', ra: 7.7283136, dec: -40.93374591, mag: 5.12, ci: 1.104, },
		    '784697': { id: '784697', con: 'CMi', name: '', ra: 7.86166305, dec: 1.7668666, mag: 5.12, ci: -0.116, },
		    '972672': { id: '972672', con: 'Vel', name: '', ra: 9.27306539, dec: -44.26573453, mag: 5.12, ci: 1.636, },
		    '858583': { id: '858583', con: 'Cnc', name: '', ra: 8.33440576, dec: 27.21770692, mag: 5.13, ci: 0.487, },
		    '872595': { id: '872595', con: 'Cnc', name: '', ra: 8.4318797, dec: 7.56450525, mag: 5.13, ci: 0.934, },
		    '599084': { id: '599084', con: 'Pup', name: '', ra: 6.83183762, dec: -46.61456092, mag: 5.14, ci: 0.46, },
		    '602226': { id: '602226', con: 'Cam', name: '', ra: 6.84919124, dec: 67.57194062, mag: 5.14, ci: -0.152, },
		    '631791': { id: '631791', con: 'Car', name: '', ra: 7.01430214, dec: -51.4025886, mag: 5.14, ci: 1.652, },
		    '640255': { id: '640255', con: 'Gem', name: '', ra: 7.06057582, dec: 10.95181799, mag: 5.14, ci: 1.391, },
		    '642328': { id: '642328', con: 'Car', name: '', ra: 7.07175738, dec: -56.74972316, mag: 5.14, ci: -0.032, },
		    '743211': { id: '743211', con: 'Mon', name: '', ra: 7.62130305, dec: -4.11098095, mag: 5.14, ci: 0.442, },
		    '773199': { id: '773199', con: 'Gem', name: '', ra: 7.79175658, dec: 33.41569943, mag: 5.14, ci: 1.635, },
		    '801606': { id: '801606', con: 'Pup', name: '', ra: 7.96436663, dec: -45.57766701, mag: 5.14, ci: 1.263, },
		    '820977': { id: '820977', con: 'Cnc', name: '', ra: 8.08458021, dec: 13.11821194, mag: 5.14, ci: 0.018, },
		    '842664': { id: '842664', con: 'Vel', name: '', ra: 8.22671043, dec: -46.99163168, mag: 5.14, ci: -0.139, },
		    '515847': { id: '515847', con: 'CMa', name: '', ra: 6.29492331, dec: -16.81590792, mag: 5.15, ci: 1.293, },
		    '770884': { id: '770884', con: 'Lyn', name: '', ra: 7.77757866, dec: 37.51739466, mag: 5.15, ci: 1.588, },
		    '911444': { id: '911444', con: 'Vel', name: '', ra: 8.72785312, dec: -49.82280209, mag: 5.15, ci: -0.197, },
		    '928368': { id: '928368', con: 'Lyn', name: '', ra: 8.8657865, dec: 43.72660265, mag: 5.15, ci: 0.971, },
		    '958347': { id: '958347', con: 'UMa', name: '', ra: 9.13986132, dec: 66.87323708, mag: 5.15, ci: 1.514, },
		    '548927': { id: '548927', con: 'CMa', name: '', ra: 6.52306814, dec: -12.39197252, mag: 5.16, ci: 1.262, },
		    '784889': { id: '784889', con: 'Pup', name: '', ra: 7.8628608, dec: -13.89799605, mag: 5.16, ci: 0.6, },
		    '846841': { id: '846841', con: 'Car', name: '', ra: 8.25441893, dec: -62.91561919, mag: 5.16, ci: 0.086, },
		    '960080': { id: '960080', con: 'Cnc', name: 'Nahn', ra: 9.15598204, dec: 22.04545887, mag: 5.16, ci: 0.97, },
		    '779300': { id: '779300', con: 'Pup', name: '', ra: 7.82811145, dec: -17.22840648, mag: 5.17, ci: 1.282, },
		    '941347': { id: '941347', con: 'Vel', name: '', ra: 8.98120966, dec: -47.23469014, mag: 5.17, ci: 0.268, },
		    '942274': { id: '942274', con: 'Car', name: '', ra: 8.99005042, dec: -59.08371314, mag: 5.17, ci: 0.417, },
		    '628735': { id: '628735', con: 'Vol', name: '', ra: 6.99737092, dec: -67.91644449, mag: 5.18, ci: 1.396, },
		    '705733': { id: '705733', con: 'CMa', name: '', ra: 7.41116331, dec: -16.20147468, mag: 5.18, ci: -0.035, },
		    '861667': { id: '861667', con: 'Pup', name: '', ra: 8.35584603, dec: -36.48417813, mag: 5.18, ci: -0.187, },
		    '871659': { id: '871659', con: 'Vel', name: '', ra: 8.42536822, dec: -51.72741816, mag: 5.18, ci: -0.164, },
		    '903758': { id: '903758', con: 'Vel', name: '', ra: 8.66599932, dec: -53.05472894, mag: 5.18, ci: -0.147, },
		    '969003': { id: '969003', con: 'UMa', name: '', ra: 9.23903853, dec: 61.42331982, mag: 5.18, ci: 0.605, },
		    '539160': { id: '539160', con: 'Mon', name: '', ra: 6.45382224, dec: 0.29924217, mag: 5.19, ci: 1.186, },
		    '806278': { id: '806278', con: 'Car', name: '', ra: 7.99376178, dec: -60.58706264, mag: 5.19, ci: 1.758, },
		    '901883': { id: '901883', con: 'Vol', name: '', ra: 8.65143426, dec: -70.38674584, mag: 5.19, ci: 0.013, },
		    '924109': { id: '924109', con: 'Pyx', name: '', ra: 8.83097257, dec: -32.78052461, mag: 5.19, ci: 0.876, },
		    '508810': { id: '508810', con: 'Ori', name: '', ra: 6.24746561, dec: 19.15644872, mag: 5.2, ci: 0.43, },
		    '544512': { id: '544512', con: 'Pic', name: '', ra: 6.49124985, dec: -56.85276884, mag: 5.2, ci: 1.087, },
		    '576950': { id: '576950', con: 'Gem', name: '', ra: 6.70675757, dec: 17.64530612, mag: 5.2, ci: 0.063, },
		    '636398': { id: '636398', con: 'Gem', name: '', ra: 7.04021688, dec: 24.21544539, mag: 5.2, ci: 0.953, },
		    '641532': { id: '641532', con: 'Pup', name: '', ra: 7.06744334, dec: -42.33727655, mag: 5.2, ci: 0.198, },
		    '678895': { id: '678895', con: 'Lyn', name: '', ra: 7.26525121, dec: 59.63746828, mag: 5.2, ci: 1.081, },
		    '714992': { id: '714992', con: 'Gem', name: '', ra: 7.46232132, dec: 21.4452599, mag: 5.2, ci: 0.455, },
		    '832499': { id: '832499', con: 'Vel', name: '', ra: 8.15997616, dec: -44.12277167, mag: 5.2, ci: -0.173, },
		    '904525': { id: '904525', con: 'Vel', name: '', ra: 8.67199152, dec: -40.2638801, mag: 5.2, ci: -0.027, },
		    '907935': { id: '907935', con: 'Vel', name: '', ra: 8.69914139, dec: -45.41071353, mag: 5.2, ci: 0.171, },
		    '531816': { id: '531816', con: 'CMa', name: '', ra: 6.40286668, dec: -11.53008774, mag: 5.21, ci: 1.23, },
		    '538152': { id: '538152', con: 'Lyn', name: '', ra: 6.44690929, dec: 58.41740826, mag: 5.21, ci: 1.538, },
		    '575696': { id: '575696', con: 'Mon', name: '', ra: 6.6989961, dec: -9.16753313, mag: 5.21, ci: 1.525, },
		    '549946': { id: '549946', con: 'Mon', name: '', ra: 6.53008323, dec: 11.54441004, mag: 5.22, ci: 0.185, },
		    '592448': { id: '592448', con: 'Aur', name: '', ra: 6.79432718, dec: 48.78947389, mag: 5.22, ci: 1.131, },
		    '634978': { id: '634978', con: 'Mon', name: '', ra: 7.03232915, dec: -5.72205904, mag: 5.22, ci: 1.687, },
		    '715836': { id: '715836', con: 'CMi', name: '', ra: 7.46724285, dec: 6.94197237, mag: 5.22, ci: 0.221, },
		    '773247': { id: '773247', con: 'Pup', name: '', ra: 7.7920852, dec: -46.6084904, mag: 5.22, ci: -0.151, },
		    '805880': { id: '805880', con: 'Pup', name: '', ra: 7.99121045, dec: -39.2969253, mag: 5.22, ci: 0.4, },
		    '938487': { id: '938487', con: 'Cnc', name: '', ra: 8.95415271, dec: 15.32276375, mag: 5.22, ci: 0.149, },
		    '582881': { id: '582881', con: 'CMa', name: '', ra: 6.74124067, dec: -31.07052337, mag: 5.23, ci: -0.127, },
		    '704095': { id: '704095', con: 'Aur', name: '', ra: 7.40235219, dec: 40.67238797, mag: 5.23, ci: 1.249, },
		    '832793': { id: '832793', con: 'Vel', name: '', ra: 8.16198774, dec: -47.93719166, mag: 5.23, ci: -0.199, },
		    '935485': { id: '935485', con: 'Cnc', name: '', ra: 8.92768871, dec: 27.92748595, mag: 5.23, ci: 1, },
		    '942544': { id: '942544', con: 'Cnc', name: '', ra: 8.99240367, dec: 32.41855781, mag: 5.23, ci: 0.913, },
		    '946388': { id: '946388', con: 'Vel', name: '', ra: 9.02904573, dec: -52.18871539, mag: 5.23, ci: -0.12, },
		    '957180': { id: '957180', con: 'Cnc', name: '', ra: 9.12911452, dec: 10.66818893, mag: 5.23, ci: -0.092, },
		    '589699': { id: '589699', con: 'Aur', name: '', ra: 6.77898275, dec: 43.57742636, mag: 5.24, ci: 0.575, },
		    '686997': { id: '686997', con: 'Pup', name: '', ra: 7.30930918, dec: -39.21027996, mag: 5.24, ci: 0.026, },
		    '727897': { id: '727897', con: 'CMi', name: '', ra: 7.53498559, dec: 1.91447711, mag: 5.24, ci: 0.23, },
		    '899244': { id: '899244', con: 'Pyx', name: '', ra: 8.63115331, dec: -26.255002, mag: 5.24, ci: -0.03, },
		    '969129': { id: '969129', con: 'Vel', name: '', ra: 9.24013499, dec: -43.22749899, mag: 5.24, ci: -0.137, },
		    '973256': { id: '973256', con: 'Hya', name: '', ra: 9.27825998, dec: -6.35314797, mag: 5.24, ci: 1.172, },
		    '551300': { id: '551300', con: 'Col', name: '', ra: 6.53927404, dec: -37.69670001, mag: 5.25, ci: 0.982, },
		    '564740': { id: '564740', con: 'CMa', name: '', ra: 6.62989408, dec: -32.33972878, mag: 5.25, ci: 1.177, },
		    '769830': { id: '769830', con: 'CMi', name: '', ra: 7.77116682, dec: 10.76825481, mag: 5.25, ci: 0.018, },
		    '818726': { id: '818726', con: 'Pup', name: '', ra: 8.07116362, dec: -32.67483085, mag: 5.25, ci: 1.882, },
		    '558339': { id: '558339', con: 'Aur', name: '', ra: 6.58668384, dec: 28.02231013, mag: 5.26, ci: -0.008, },
		    '968907': { id: '968907', con: 'Vel', name: '', ra: 9.23833053, dec: -55.56962546, mag: 5.26, ci: 0.98, },
		    '975840': { id: '975840', con: 'Vel', name: '', ra: 9.30163071, dec: -51.05085934, mag: 5.26, ci: -0.062, },
		    '520925': { id: '520925', con: 'Mon', name: '', ra: 6.32855498, dec: -7.8229084, mag: 5.27, ci: -0.177, },
		    '591565': { id: '591565', con: 'Pup', name: '', ra: 6.78927784, dec: -37.92969838, mag: 5.27, ci: -0.078, },
		    '732414': { id: '732414', con: 'Gem', name: '', ra: 7.5601348, dec: 15.82666229, mag: 5.27, ci: 0.055, },
		    '893465': { id: '893465', con: 'Car', name: '', ra: 8.58765435, dec: -58.22473476, mag: 5.27, ci: -0.133, },
		    '545263': { id: '545263', con: 'Pup', name: '', ra: 6.49695262, dec: -50.2390828, mag: 5.28, ci: 0.371, },
		    '590051': { id: '590051', con: 'CMa', name: '', ra: 6.78085884, dec: -14.42597216, mag: 5.28, ci: -0.024, },
		    '603983': { id: '603983', con: 'Gem', name: '', ra: 6.85917931, dec: 21.7611431, mag: 5.28, ci: -0.02, },
		    '863427': { id: '863427', con: 'Vol', name: '', ra: 8.36790505, dec: -73.3999852, mag: 5.28, ci: 0.014, },
		    '918897': { id: '918897', con: 'Hya', name: '', ra: 8.78749614, dec: -1.89703965, mag: 5.28, ci: 0.058, },
		    '971668': { id: '971668', con: 'UMa', name: '', ra: 9.2638287, dec: 56.74140732, mag: 5.28, ci: 1.568, },
		    '974591': { id: '974591', con: 'Car', name: '', ra: 9.29032671, dec: -74.89432591, mag: 5.28, ci: 0.021, },
		    '616580': { id: '616580', con: 'CMa', name: '', ra: 6.929702, dec: -22.941439, mag: 5.29, ci: -0.163, },
		    '687917': { id: '687917', con: 'CMa', name: '', ra: 7.31424255, dec: -26.58585198, mag: 5.29, ci: 0.956, },
		    '587553': { id: '587553', con: 'CMa', name: '', ra: 6.76649792, dec: -14.7961269, mag: 5.3, ci: 0.075, },
		    '667408': { id: '667408', con: 'Pup', name: '', ra: 7.20439103, dec: -40.49880674, mag: 5.3, ci: 0.072, },
		    '763657': { id: '763657', con: 'Gem', name: '', ra: 7.73525398, dec: 25.78415832, mag: 5.3, ci: 1.535, },
		    '802875': { id: '802875', con: 'CMi', name: '', ra: 7.97240411, dec: 2.22476425, mag: 5.3, ci: 0.933, },
		    '827907': { id: '827907', con: 'Cnc', name: '', ra: 8.12940428, dec: 21.58181577, mag: 5.3, ci: 0.642, },
		    '923117': { id: '923117', con: 'Hya', name: '', ra: 8.82270159, dec: -3.44302426, mag: 5.3, ci: -0.08, },
		    '968027': { id: '968027', con: 'Lyn', name: '', ra: 9.230059, dec: 43.217825, mag: 5.3, ci: -0.13, },
		    '763535': { id: '763535', con: 'Lyn', name: '', ra: 7.73449454, dec: 50.43379644, mag: 5.31, ci: -0.001, },
		    '932083': { id: '932083', con: 'Vel', name: '', ra: 8.89738715, dec: -47.52076482, mag: 5.31, ci: 0.275, },
		    '973732': { id: '973732', con: 'Vel', name: '', ra: 9.28252095, dec: -39.40154088, mag: 5.31, ci: 1.166, },
		    '777481': { id: '777481', con: 'Pup', name: '', ra: 7.81713239, dec: -24.91220326, mag: 5.32, ci: 0.751, },
		    '870593': { id: '870593', con: 'Pup', name: '', ra: 8.41770526, dec: -24.04620819, mag: 5.32, ci: 1.476, },
		    '826696': { id: '826696', con: 'Pup', name: '', ra: 8.12167782, dec: -20.55434294, mag: 5.33, ci: 0.1, },
		    '857980': { id: '857980', con: 'Vol', name: '', ra: 8.33026743, dec: -71.51490885, mag: 5.33, ci: -0.063, },
		    '879843': { id: '879843', con: 'Vel', name: '', ra: 8.48465568, dec: -47.92890754, mag: 5.33, ci: -0.14, },
		    '885482': { id: '885482', con: 'Cnc', name: '', ra: 8.52659162, dec: 18.09441919, mag: 5.33, ci: 1.567, },
		    '887889': { id: '887889', con: 'Cnc', name: '', ra: 8.54513812, dec: 20.4411613, mag: 5.33, ci: 1.252, },
		    '510218': { id: '510218', con: 'Ori', name: '', ra: 6.25698019, dec: 16.1431797, mag: 5.34, ci: -0.101, },
		    '526042': { id: '526042', con: 'Aur', name: '', ra: 6.36281385, dec: 53.45217604, mag: 5.34, ci: 0.448, },
		    '567327': { id: '567327', con: 'Aur', name: '', ra: 6.64699478, dec: 39.90256111, mag: 5.34, ci: -0.075, },
		    '589973': { id: '589973', con: 'Lyn', name: '', ra: 6.78041896, dec: 57.16917667, mag: 5.34, ci: 0.964, },
		    '608654': { id: '608654', con: 'Lyn', name: '', ra: 6.88473541, dec: 59.44854633, mag: 5.34, ci: 0.675, },
		    '736959': { id: '736959', con: 'Gem', name: '', ra: 7.58577729, dec: 30.96093371, mag: 5.34, ci: 1.01, },
		    '840749': { id: '840749', con: 'UMa', name: '', ra: 8.21355189, dec: 68.47406976, mag: 5.34, ci: 1.037, },
		    '925556': { id: '925556', con: 'Vol', name: '', ra: 8.84300451, dec: -66.7929839, mag: 5.34, ci: 0.423, },
		    '986609': { id: '986609', con: 'Cha', name: '', ra: 9.40256188, dec: -80.7868751, mag: 5.34, ci: 0.454, },
		    '705932': { id: '705932', con: 'CMa', name: '', ra: 7.41218173, dec: -31.80890234, mag: 5.35, ci: 1.071, },
		    '721392': { id: '721392', con: 'Lyn', name: '', ra: 7.49887655, dec: 49.6724587, mag: 5.35, ci: 0.47, },
		    '906032': { id: '906032', con: 'Lyn', name: '', ra: 8.68363056, dec: 45.83401209, mag: 5.35, ci: 0.993, },
		    '504034': { id: '504034', con: 'Cam', name: '', ra: 6.21418345, dec: 65.71842257, mag: 5.36, ci: 1.344, },
		    '518758': { id: '518758', con: 'Mon', name: '', ra: 6.31405074, dec: -9.39001814, mag: 5.36, ci: 1.239, },
		    '673938': { id: '673938', con: 'CMi', name: '', ra: 7.23890623, dec: 3.11141805, mag: 5.36, ci: 1.193, },
		    '677209': { id: '677209', con: 'CMa', name: '', ra: 7.25585286, dec: -30.68644312, mag: 5.36, ci: -0.155, },
		    '767943': { id: '767943', con: 'Pup', name: '', ra: 7.75971817, dec: -34.17244838, mag: 5.36, ci: 0.589, },
		    '799215': { id: '799215', con: 'Pup', name: '', ra: 7.94938904, dec: -43.50040488, mag: 5.36, ci: -0.166, },
		    '837550': { id: '837550', con: 'Hya', name: '', ra: 8.19250111, dec: -7.77253689, mag: 5.36, ci: 0.892, },
		    '970591': { id: '970591', con: 'Cnc', name: '', ra: 9.25384796, dec: 14.94150911, mag: 5.36, ci: 1.319, },
		    '510828': { id: '510828', con: 'Cam', name: '', ra: 6.26126167, dec: 59.99897342, mag: 5.37, ci: 1.339, },
		    '534926': { id: '534926', con: 'Dor', name: '', ra: 6.42461897, dec: -69.69030199, mag: 5.37, ci: 0.971, },
		    '702153': { id: '702153', con: 'CMa', name: '', ra: 7.39138717, dec: -27.83429781, mag: 5.37, ci: 1.539, },
		    '706623': { id: '706623', con: 'CMi', name: '', ra: 7.41616101, dec: 11.66952121, mag: 5.37, ci: 0.105, },
		    '807773': { id: '807773', con: 'Cam', name: '', ra: 8.00326061, dec: 73.9179202, mag: 5.37, ci: 1.424, },
		    '693334': { id: '693334', con: 'Car', name: '', ra: 7.34411324, dec: -52.08592559, mag: 5.38, ci: -0.069, },
		    '795566': { id: '795566', con: 'Gem', name: '', ra: 7.9277486, dec: 19.88396975, mag: 5.38, ci: -0.035, },
		    '974340': { id: '974340', con: 'Car', name: '', ra: 9.28812127, dec: -68.68964556, mag: 5.38, ci: 0.415, },
		    '993028': { id: '993028', con: 'Hya', name: '', ra: 9.46299642, dec: -6.07123431, mag: 5.38, ci: 0.642, },
		    '514378': { id: '514378', con: 'Ori', name: '', ra: 6.28517276, dec: 9.94238992, mag: 5.39, ci: 0.106, },
		    '590131': { id: '590131', con: 'Car', name: '', ra: 6.78129834, dec: -51.2656671, mag: 5.39, ci: 1.33, },
		    '596340': { id: '596340', con: 'CMa', name: '', ra: 6.81603766, dec: -15.14471225, mag: 5.39, ci: -0.096, },
		    '820164': { id: '820164', con: 'Cam', name: '', ra: 8.07974531, dec: 79.47960973, mag: 5.39, ci: -0.04, },
		    '999558': { id: '999558', con: 'LMi', name: '', ra: 9.52566937, dec: 35.10327175, mag: 5.39, ci: 1.543, },
		    '561560': { id: '561560', con: 'Aur', name: '', ra: 6.60912206, dec: 38.44549877, mag: 5.4, ci: 2.773, },
		    '700695': { id: '700695', con: 'CMa', name: '', ra: 7.38352684, dec: -31.92378176, mag: 5.4, ci: -0.161, },
		    '932888': { id: '932888', con: 'Cnc', name: '', ra: 8.90408293, dec: 30.57920666, mag: 5.4, ci: 1.05, },
		    '994150': { id: '994150', con: 'Leo', name: '', ra: 9.47428182, dec: 9.05678227, mag: 5.4, ci: 0.605, },
		    '994523': { id: '994523', con: 'UMa', name: 'Intercrus', ra: 9.47777513, dec: 45.60148152, mag: 5.4, ci: 0.993, },
		    '603683': { id: '603683', con: 'Vol', name: '', ra: 6.85749627, dec: -70.96341027, mag: 5.41, ci: -0.11, },
		    '649866': { id: '649866', con: 'CMa', name: '', ra: 7.11132596, dec: -11.29402842, mag: 5.41, ci: 0.033, },
		    '702303': { id: '702303', con: 'CMa', name: '', ra: 7.39219295, dec: -32.20207136, mag: 5.41, ci: -0.169, },
		    '718963': { id: '718963', con: 'Pup', name: '', ra: 7.48491542, dec: -38.81206705, mag: 5.41, ci: -0.148, },
		    '755046': { id: '755046', con: 'Pup', name: '', ra: 7.68772557, dec: -38.53353302, mag: 5.41, ci: -0.13, },
		    '554989': { id: '554989', con: 'Col', name: '', ra: 6.56374466, dec: -36.23202794, mag: 5.42, ci: 1.419, },
		    '583742': { id: '583742', con: 'Gem', name: '', ra: 6.745961, dec: 28.97093133, mag: 5.42, ci: 1.445, },
		    '733119': { id: '733119', con: 'Pup', name: '', ra: 7.56417848, dec: -36.3383938, mag: 5.42, ci: -0.078, },
		    '885283': { id: '885283', con: 'Pyx', name: '', ra: 8.52525613, dec: -19.57746987, mag: 5.42, ci: -0.061, },
		    '957616': { id: '957616', con: 'Cnc', name: '', ra: 9.13334764, dec: 29.65423465, mag: 5.42, ci: 0.888, },
		    '550013': { id: '550013', con: 'Mon', name: '', ra: 6.53057289, dec: -8.15823411, mag: 5.43, ci: 1.373, },
		    '917409': { id: '917409', con: 'Vel', name: '', ra: 8.77515154, dec: -45.9125064, mag: 5.43, ci: 0.238, },
		    '937394': { id: '937394', con: 'Oct', name: '', ra: 8.94471932, dec: -85.66315116, mag: 5.43, ci: 0.306, },
		    '511008': { id: '511008', con: 'Ori', name: '', ra: 6.26249001, dec: 12.5510665, mag: 5.44, ci: 0.015, },
		    '588260': { id: '588260', con: 'Cam', name: '', ra: 6.77059784, dec: 79.56481005, mag: 5.44, ci: 0.525, },
		    '612548': { id: '612548', con: 'Mon', name: '', ra: 6.90685047, dec: -1.1269843, mag: 5.44, ci: 0.167, },
		    '664682': { id: '664682', con: 'Mon', name: '', ra: 7.18989324, dec: -0.3019301, mag: 5.44, ci: 0.31, },
		    '788434': { id: '788434', con: 'Pup', name: '', ra: 7.88430728, dec: -36.36377051, mag: 5.44, ci: 1.161, },
		    '935979': { id: '935979', con: 'Cnc', name: '', ra: 8.9320969, dec: 11.62602357, mag: 5.44, ci: 1.462, },
		    '937897': { id: '937897', con: 'Cnc', name: '', ra: 8.94905497, dec: 32.91043008, mag: 5.44, ci: 0.181, },
		    '618965': { id: '618965', con: 'Men', name: '', ra: 6.9429095, dec: -79.42019279, mag: 5.45, ci: 0.041, },
		    '621926': { id: '621926', con: 'CMa', name: '', ra: 6.95942272, dec: -24.63081545, mag: 5.45, ci: 0.39, },
		    '727010': { id: '727010', con: 'Gem', name: '', ra: 7.53011009, dec: 17.08604425, mag: 5.45, ci: 1.126, },
		    '872481': { id: '872481', con: 'Pup', name: '', ra: 8.43108615, dec: -42.1530747, mag: 5.45, ci: -0.142, },
		    '897976': { id: '897976', con: 'Car', name: '', ra: 8.62189932, dec: -62.85346276, mag: 5.45, ci: 1.013, },
		    '902576': { id: '902576', con: 'Vel', name: '', ra: 8.6566224, dec: -53.43976777, mag: 5.45, ci: -0.132, },
		    '948182': { id: '948182', con: 'Cnc', name: '', ra: 9.04562941, dec: 24.45291226, mag: 5.45, ci: -0.041, },
		    '997020': { id: '997020', con: 'Vel', name: '', ra: 9.50141931, dec: -51.51716652, mag: 5.45, ci: -0.078, },
		    '661297': { id: '661297', con: 'CMa', name: '', ra: 7.17203338, dec: -27.49152062, mag: 5.46, ci: 0.998, },
		    '670968': { id: '670968', con: 'Lyn', name: '', ra: 7.22316699, dec: 51.42874109, mag: 5.46, ci: 1.64, },
		    '679930': { id: '679930', con: 'CMa', name: '', ra: 7.27070916, dec: -15.58569158, mag: 5.46, ci: 0.079, },
		    '906689': { id: '906689', con: 'Cha', name: '', ra: 8.68875425, dec: -78.96335963, mag: 5.46, ci: -0.101, },
		    '991844': { id: '991844', con: 'Car', name: '', ra: 9.45175202, dec: -71.60189274, mag: 5.46, ci: 1.079, },
		    '999649': { id: '999649', con: 'Car', name: '', ra: 9.52674241, dec: -73.0809148, mag: 5.46, ci: 1.556, },
		    '655160': { id: '655160', con: 'Gem', name: '', ra: 7.1394555, dec: 15.93067642, mag: 5.47, ci: 1.02, },
		    '792908': { id: '792908', con: 'Lyn', name: '', ra: 7.9118604, dec: 47.56459919, mag: 5.47, ci: 1.462, },
		    '892004': { id: '892004', con: 'UMa', name: '', ra: 8.57669887, dec: 65.14512876, mag: 5.47, ci: 0.207, },
		    '923677': { id: '923677', con: 'Vel', name: '', ra: 8.82754433, dec: -40.32015732, mag: 5.47, ci: 0.066, },
		    '960487': { id: '960487', con: 'Hya', name: '', ra: 9.15988052, dec: -8.78764856, mag: 5.47, ci: 1.002, },
		    '525184': { id: '525184', con: 'CMa', name: '', ra: 6.35686557, dec: -11.77325092, mag: 5.48, ci: 0.002, },
		    '774413': { id: '774413', con: 'Pup', name: '', ra: 7.79908663, dec: -12.19271105, mag: 5.48, ci: 0.478, },
		    '791451': { id: '791451', con: 'Pup', name: '', ra: 7.903058, dec: -35.87729007, mag: 5.48, ci: -0.175, },
		    '908640': { id: '908640', con: 'Vel', name: '', ra: 8.70449817, dec: -48.09909192, mag: 5.48, ci: -0.172, },
		    '953000': { id: '953000', con: 'UMa', name: '', ra: 9.09002632, dec: 48.53031945, mag: 5.48, ci: 0.475, },
		    '769206': { id: '769206', con: 'Mon', name: '', ra: 7.76727515, dec: -6.77251352, mag: 5.49, ci: 1.378, },
		    '908734': { id: '908734', con: 'Vel', name: '', ra: 8.7052762, dec: -53.10006997, mag: 5.49, ci: -0.127, },
		    '973247': { id: '973247', con: 'Hya', name: '', ra: 9.27815771, dec: -8.74475686, mag: 5.49, ci: -0.081, },
		    '996716': { id: '996716', con: 'Ant', name: '', ra: 9.49847345, dec: -26.58961765, mag: 5.49, ci: 1.345, },
		    '639001': { id: '639001', con: 'Car', name: '', ra: 7.05420042, dec: -59.17808435, mag: 5.5, ci: -0.125, },
		    '692501': { id: '692501', con: 'Car', name: '', ra: 7.33940421, dec: -52.30925468, mag: 5.5, ci: 0.483, },
		    '517192': { id: '517192', con: 'CMa', name: '', ra: 6.30381358, dec: -19.96697454, mag: 5.51, ci: -0.163, },
		    '875743': { id: '875743', con: 'Vol', name: '', ra: 8.45465374, dec: -70.09348202, mag: 5.51, ci: -0.024, },
		    '561649': { id: '561649', con: 'Mon', name: '', ra: 6.609814, dec: -5.211143, mag: 5.52, ci: -0.082, },
		    '814639': { id: '814639', con: 'Pup', name: '', ra: 8.04577335, dec: -41.30982725, mag: 5.52, ci: -0.152, },
		    '820943': { id: '820943', con: 'Car', name: '', ra: 8.08436345, dec: -53.10792029, mag: 5.52, ci: 1.347, },
		    '842554': { id: '842554', con: 'Vel', name: '', ra: 8.2261794, dec: -50.19606891, mag: 5.52, ci: 1.651, },
		    '867629': { id: '867629', con: 'Lyn', name: '', ra: 8.39680574, dec: 53.21971481, mag: 5.52, ci: 0.125, },
		    '874444': { id: '874444', con: 'Pup', name: '', ra: 8.44498707, dec: -12.53460202, mag: 5.52, ci: 1.167, },
		    '537215': { id: '537215', con: 'Lyn', name: '', ra: 6.44051022, dec: 56.28509595, mag: 5.53, ci: 0.238, },
		    '835248': { id: '835248', con: 'Pup', name: '', ra: 8.17772956, dec: -13.79920588, mag: 5.53, ci: 0.488, },
		    '514145': { id: '514145', con: 'Col', name: '', ra: 6.28367516, dec: -37.73744569, mag: 5.54, ci: 1.129, },
		    '594061': { id: '594061', con: 'Lyn', name: '', ra: 6.80356219, dec: 55.7044917, mag: 5.54, ci: 0, },
		    '678672': { id: '678672', con: 'Lyn', name: '', ra: 7.26392724, dec: 47.23996321, mag: 5.54, ci: 0.576, },
		    '708693': { id: '708693', con: 'Men', name: '', ra: 7.4272495, dec: -79.09418849, mag: 5.54, ci: 1.281, },
		    '966461': { id: '966461', con: 'Car', name: '', ra: 9.21545343, dec: -59.41392566, mag: 5.54, ci: 0.846, },
		    '523148': { id: '523148', con: 'Col', name: '', ra: 6.34339983, dec: -34.14414635, mag: 5.55, ci: -0.182, },
		    '539239': { id: '539239', con: 'Mon', name: '', ra: 6.45433067, dec: -0.276, mag: 5.55, ci: 1.376, },
		    '539428': { id: '539428', con: 'Mon', name: '', ra: 6.45568084, dec: 2.90828947, mag: 5.55, ci: 1.035, },
		    '648281': { id: '648281', con: 'Gem', name: '', ra: 7.10321986, dec: 34.47396925, mag: 5.55, ci: 0.909, },
		    '715668': { id: '715668', con: 'Pup', name: '', ra: 7.46643367, dec: -29.15589708, mag: 5.55, ci: -0.048, },
		    '757472': { id: '757472', con: 'Gem', name: '', ra: 7.70089395, dec: 14.20850144, mag: 5.55, ci: 1.642, },
		    '857309': { id: '857309', con: 'Cam', name: '', ra: 8.32563638, dec: 75.75690732, mag: 5.55, ci: 0.902, },
		    '927624': { id: '927624', con: 'Hya', name: '', ra: 8.85955988, dec: -7.1772706, mag: 5.55, ci: 0.15, },
		    '528139': { id: '528139', con: 'Dor', name: '', ra: 6.37729849, dec: -69.98404308, mag: 5.56, ci: 1.51, },
		    '641242': { id: '641242', con: 'Pup', name: '', ra: 7.06592148, dec: -43.60803004, mag: 5.56, ci: 0.624, },
		    '874518': { id: '874518', con: 'Cnc', name: '', ra: 8.44553883, dec: 12.65460921, mag: 5.56, ci: 1.608, },
		    '904470': { id: '904470', con: 'Vel', name: '', ra: 8.6715179, dec: -53.01540076, mag: 5.56, ci: -0.125, },
		    '945696': { id: '945696', con: 'Vel', name: '', ra: 9.02246132, dec: -41.86425361, mag: 5.56, ci: -0.135, },
		    '965728': { id: '965728', con: 'Vel', name: '', ra: 9.20848314, dec: -43.61326698, mag: 5.56, ci: -0.107, },
		    '982526': { id: '982526', con: 'Vel', name: '', ra: 9.36416302, dec: -42.19485789, mag: 5.56, ci: 1.637, },
		    '554416': { id: '554416', con: 'Gem', name: '', ra: 6.56004529, dec: 14.15516669, mag: 5.57, ci: 1.105, },
		    '777705': { id: '777705', con: 'Car', name: '', ra: 7.81853266, dec: -56.41035344, mag: 5.57, ci: 1.116, },
		    '937298': { id: '937298', con: 'UMa', name: '', ra: 8.94373443, dec: 64.60381873, mag: 5.57, ci: 0.877, },
		    '548763': { id: '548763', con: 'Car', name: '', ra: 6.52175471, dec: -51.82595337, mag: 5.58, ci: 0.534, },
		    '675638': { id: '675638', con: 'CMa', name: '', ra: 7.2475451, dec: -27.03799559, mag: 5.58, ci: 1.22, },
		    '747075': { id: '747075', con: 'Gem', name: '', ra: 7.64246198, dec: 35.04854922, mag: 5.58, ci: 0.921, },
		    '754872': { id: '754872', con: 'Lyn', name: '', ra: 7.68677757, dec: 48.13153959, mag: 5.58, ci: 1.011, },
		    '861673': { id: '861673', con: 'Pup', name: '', ra: 8.35589572, dec: -20.07904907, mag: 5.58, ci: 0.771, },
		    '873853': { id: '873853', con: 'Cnc', name: '', ra: 8.44102892, dec: 27.89358212, mag: 5.58, ci: 1.421, },
		    '558859': { id: '558859', con: 'Col', name: '', ra: 6.59005444, dec: -36.77991351, mag: 5.59, ci: -0.13, },
		    '624899': { id: '624899', con: 'CMa', name: '', ra: 6.97663866, dec: -25.41415668, mag: 5.59, ci: -0.162, },
		    '694348': { id: '694348', con: 'CMa', name: '', ra: 7.34952353, dec: -14.36049029, mag: 5.59, ci: 0.971, },
		    '731121': { id: '731121', con: 'CMi', name: '', ra: 7.55324057, dec: 3.29038161, mag: 5.59, ci: 0.321, },
		    '801390': { id: '801390', con: 'Car', name: '', ra: 7.96303173, dec: -60.30307061, mag: 5.59, ci: 0.573, },
		    '854225': { id: '854225', con: 'Pup', name: '', ra: 8.30483226, dec: -35.45170205, mag: 5.59, ci: 1.246, },
		    '927701': { id: '927701', con: 'Car', name: '', ra: 8.86014289, dec: -57.63357719, mag: 5.59, ci: -0.102, },
		    '961138': { id: '961138', con: 'Pyx', name: '', ra: 9.16566958, dec: -30.36539952, mag: 5.59, ci: 0.179, },
		    '528836': { id: '528836', con: 'Pic', name: '', ra: 6.38217415, dec: -56.36995904, mag: 5.6, ci: 0.242, },
		    '551400': { id: '551400', con: 'Mon', name: '', ra: 6.539758, dec: -5.86881645, mag: 5.6, ci: 0.256, },
		    '591434': { id: '591434', con: 'Car', name: '', ra: 6.78853021, dec: -55.53999019, mag: 5.6, ci: 1.549, },
		    '713226': { id: '713226', con: 'CMa', name: '', ra: 7.45222043, dec: -17.86484188, mag: 5.6, ci: 0.314, },
		    '719586': { id: '719586', con: 'Mon', name: '', ra: 7.48851876, dec: -1.90532753, mag: 5.6, ci: 1.493, },
		    '760966': { id: '760966', con: 'Pup', name: '', ra: 7.71999537, dec: -36.05008715, mag: 5.6, ci: -0.13, },
		    '780697': { id: '780697', con: 'Mon', name: '', ra: 7.836271, dec: -9.1834425, mag: 5.6, ci: 1.446, },
		    '809352': { id: '809352', con: 'Cnc', name: '', ra: 8.01314074, dec: 17.30869917, mag: 5.6, ci: 1.317, },
		    '873828': { id: '873828', con: 'Hya', name: '', ra: 8.44088914, dec: -3.98744432, mag: 5.6, ci: 0.218, },
		    '958925': { id: '958925', con: 'Hya', name: '', ra: 9.14505054, dec: -8.58951215, mag: 5.6, ci: -0.057, },
		    '988848': { id: '988848', con: 'Hya', name: '', ra: 9.42334333, dec: -5.1173954, mag: 5.6, ci: 1.523, },
		    '531258': { id: '531258', con: 'CMa', name: '', ra: 6.39886564, dec: -25.57762896, mag: 5.61, ci: 1.561, },
		    '570581': { id: '570581', con: 'Men', name: '', ra: 6.66746903, dec: -80.8135915, mag: 5.61, ci: 0.214, },
		    '779026': { id: '779026', con: 'Pup', name: '', ra: 7.82650095, dec: -33.28895006, mag: 5.61, ci: 1.617, },
		    '869486': { id: '869486', con: 'Hya', name: '', ra: 8.40972626, dec: -3.75124056, mag: 5.61, ci: 0.478, },
		    '882983': { id: '882983', con: 'Pyx', name: '', ra: 8.50794754, dec: -32.15928642, mag: 5.61, ci: 1.509, },
		    '982494': { id: '982494', con: 'Vel', name: '', ra: 9.36390096, dec: -55.51468569, mag: 5.61, ci: 0.19, },
		    '510577': { id: '510577', con: 'Ori', name: '', ra: 6.25951827, dec: -0.51219023, mag: 5.62, ci: 0.506, },
		    '531457': { id: '531457', con: 'Col', name: '', ra: 6.40028061, dec: -36.70776414, mag: 5.62, ci: 1.027, },
		    '556827': { id: '556827', con: 'CMa', name: '', ra: 6.57648105, dec: -32.716254, mag: 5.62, ci: -0.085, },
		    '586112': { id: '586112', con: 'CMa', name: '', ra: 6.75866573, dec: -30.94896207, mag: 5.62, ci: -0.138, },
		    '765050': { id: '765050', con: 'Pup', name: '', ra: 7.7428247, dec: -24.67407869, mag: 5.62, ci: -0.191, },
		    '784732': { id: '784732', con: 'Pup', name: '', ra: 7.86195137, dec: -21.17365895, mag: 5.62, ci: 0.956, },
		    '793427': { id: '793427', con: 'Car', name: '', ra: 7.9148111, dec: -57.30280525, mag: 5.62, ci: 1.298, },
		    '841559': { id: '841559', con: 'Cnc', name: '', ra: 8.21912983, dec: 29.65654074, mag: 5.62, ci: -0.073, },
		    '910506': { id: '910506', con: 'Cnc', name: '', ra: 8.72009141, dec: 12.68087373, mag: 5.62, ci: 0.435, },
		    '641676': { id: '641676', con: 'Mon', name: '', ra: 7.06812419, dec: -5.32397622, mag: 5.63, ci: 1.29, },
		    '724235': { id: '724235', con: 'Cam', name: '', ra: 7.51463454, dec: 68.46562911, mag: 5.63, ci: 1.1, },
		    '853139': { id: '853139', con: 'Lyn', name: '', ra: 8.29733724, dec: 59.57113227, mag: 5.63, ci: 0.182, },
		    '858415': { id: '858415', con: 'Vol', name: '', ra: 8.33348055, dec: -71.50538561, mag: 5.63, ci: -0.099, },
		    '902132': { id: '902132', con: 'UMa', name: '', ra: 8.65325065, dec: 65.02090742, mag: 5.63, ci: 0.618, },
		    '913731': { id: '913731', con: 'Cnc', name: '', ra: 8.74584341, dec: 10.08166479, mag: 5.63, ci: -0.069, },
		    '632530': { id: '632530', con: 'CMa', name: '', ra: 7.01831854, dec: -25.21563298, mag: 5.64, ci: -0.165, },
		    '679980': { id: '679980', con: 'Pup', name: '', ra: 7.2709644, dec: -46.77452606, mag: 5.64, ci: 1.441, },
		    '731513': { id: '731513', con: 'Pup', name: '', ra: 7.55543472, dec: -19.41252403, mag: 5.64, ci: 1.121, },
		    '759737': { id: '759737', con: 'Pup', name: '', ra: 7.71337588, dec: -26.35133174, mag: 5.64, ci: 0.99, },
		    '946795': { id: '946795', con: 'Hya', name: '', ra: 9.03277438, dec: -0.4826728, mag: 5.64, ci: 1.163, },
		    '609347': { id: '609347', con: 'CMa', name: '', ra: 6.888559, dec: -19.03276731, mag: 5.65, ci: 0.279, },
		    '712772': { id: '712772', con: 'CMa', name: '', ra: 7.449856, dec: -23.086023, mag: 5.65, ci: -0.134, },
		    '810575': { id: '810575', con: 'CMi', name: '', ra: 8.02052521, dec: 4.87981838, mag: 5.65, ci: 0.013, },
		    '589458': { id: '589458', con: 'Mon', name: '', ra: 6.77750434, dec: -10.10735828, mag: 5.66, ci: -0.048, },
		    '739661': { id: '739661', con: 'Pup', name: '', ra: 7.60108105, dec: -14.49277431, mag: 5.66, ci: -0.067, },
		    '741016': { id: '741016', con: 'Lyn', name: '', ra: 7.60878757, dec: 46.18028769, mag: 5.66, ci: 1.56, },
		    '831376': { id: '831376', con: 'Vel', name: '', ra: 8.15264079, dec: -48.68441408, mag: 5.66, ci: -0.101, },
		    '832186': { id: '832186', con: 'Pup', name: '', ra: 8.15792624, dec: -16.24891119, mag: 5.66, ci: -0.153, },
		    '832395': { id: '832395', con: 'Car', name: '', ra: 8.1593399, dec: -56.085389, mag: 5.66, ci: 0.204, },
		    '900364': { id: '900364', con: 'UMa', name: '', ra: 8.63949591, dec: 53.401544, mag: 5.66, ci: 0.964, },
		    '995542': { id: '995542', con: 'Hya', name: '', ra: 9.48684498, dec: -20.74912869, mag: 5.66, ci: 1.587, },
		    '521870': { id: '521870', con: 'Ori', name: '', ra: 6.33450684, dec: 14.65113037, mag: 5.67, ci: 1.578, },
		    '868880': { id: '868880', con: 'Cha', name: '', ra: 8.40551401, dec: -80.91419187, mag: 5.67, ci: 1.018, },
		    '870285': { id: '870285', con: 'Pup', name: '', ra: 8.41532759, dec: -23.15374852, mag: 5.67, ci: 0.066, },
		    '905106': { id: '905106', con: 'Vel', name: '', ra: 8.67646064, dec: -45.19109837, mag: 5.67, ci: 1.664, },
		    '929606': { id: '929606', con: 'Cnc', name: '', ra: 8.87628375, dec: 32.4741607, mag: 5.67, ci: 0.224, },
		    '600590': { id: '600590', con: 'Gem', name: '', ra: 6.84041617, dec: 13.41317543, mag: 5.68, ci: 1.329, },
		    '605356': { id: '605356', con: 'Gem', name: '', ra: 6.86666308, dec: 23.60171859, mag: 5.68, ci: 1.467, },
		    '656255': { id: '656255', con: 'Vol', name: '', ra: 7.14510519, dec: -70.49710667, mag: 5.68, ci: 0.436, },
		    '746329': { id: '746329', con: 'Pup', name: '', ra: 7.63839147, dec: -48.60143891, mag: 5.68, ci: 0.683, },
		    '886554': { id: '886554', con: 'Vel', name: '', ra: 8.53469708, dec: -53.21188812, mag: 5.68, ci: 0.582, },
		    '939101': { id: '939101', con: 'Cnc', name: '', ra: 8.95977795, dec: 15.58128464, mag: 5.68, ci: 0.209, },
		    '550349': { id: '550349', con: 'Pic', name: '', ra: 6.53286401, dec: -58.75383431, mag: 5.69, ci: -0.057, },
		    '633272': { id: '633272', con: 'Cam', name: '', ra: 7.02261714, dec: 70.80829874, mag: 5.69, ci: 1.337, },
		    '659381': { id: '659381', con: 'CMa', name: '', ra: 7.16195098, dec: -25.23103292, mag: 5.69, ci: -0.158, },
		    '741436': { id: '741436', con: 'Pup', name: '', ra: 7.61139854, dec: -19.70233684, mag: 5.69, ci: -0.165, },
		    '741597': { id: '741597', con: 'Pup', name: '', ra: 7.61219963, dec: -48.83017033, mag: 5.69, ci: -0.037, },
		    '786360': { id: '786360', con: 'Pup', name: '', ra: 7.8719106, dec: -14.84617589, mag: 5.69, ci: 0.368, },
		    '514787': { id: '514787', con: 'Ori', name: '', ra: 6.28781499, dec: 5.10009523, mag: 5.7, ci: 0.61, },
		    '566910': { id: '566910', con: 'Aur', name: '', ra: 6.64431602, dec: 39.39085285, mag: 5.7, ci: 1.367, },
		    '569660': { id: '569660', con: 'CMa', name: '', ra: 6.66185009, dec: -30.47049041, mag: 5.7, ci: 1.134, },
		    '689740': { id: '689740', con: 'CMa', name: '', ra: 7.32449506, dec: -16.39524872, mag: 5.7, ci: 0.346, },
		    '718302': { id: '718302', con: 'Lyn', name: '', ra: 7.48096715, dec: 48.18392897, mag: 5.7, ci: -0.092, },
		    '786858': { id: '786858', con: 'Car', name: '', ra: 7.87492796, dec: -54.36716363, mag: 5.7, ci: -0.151, },
		    '916450': { id: '916450', con: 'Hya', name: '', ra: 8.76735415, dec: -2.04865328, mag: 5.7, ci: 1.097, },
		    '934660': { id: '934660', con: 'Vel', name: '', ra: 8.9199396, dec: -54.96576816, mag: 5.7, ci: 0.481, },
		    '561207': { id: '561207', con: 'CMa', name: '', ra: 6.6063472, dec: -18.65990041, mag: 5.71, ci: 0.848, },
		    '674595': { id: '674595', con: 'CMi', name: '', ra: 7.24239473, dec: 12.11582227, mag: 5.71, ci: 1.007, },
		    '863027': { id: '863027', con: 'Pup', name: '', ra: 8.36516844, dec: -17.58633341, mag: 5.71, ci: 1.05, },
		    '885264': { id: '885264', con: 'Cnc', name: '', ra: 8.52514404, dec: 24.08110914, mag: 5.71, ci: 0.327, },
		    '919019': { id: '919019', con: 'Vel', name: '', ra: 8.78856809, dec: -46.15541251, mag: 5.71, ci: 0.554, },
		    '563285': { id: '563285', con: 'Col', name: '', ra: 6.62051051, dec: -36.99064002, mag: 5.72, ci: -0.112, },
		    '598433': { id: '598433', con: 'Gem', name: '', ra: 6.82814178, dec: 32.6067562, mag: 5.72, ci: 1.298, },
		    '675341': { id: '675341', con: 'Pup', name: '', ra: 7.24611604, dec: -46.84967131, mag: 5.72, ci: -0.109, },
		    '893919': { id: '893919', con: 'Hya', name: '', ra: 8.59116642, dec: -7.98229229, mag: 5.72, ci: -0.004, },
		    '931173': { id: '931173', con: 'UMa', name: '', ra: 8.88959978, dec: 61.96226887, mag: 5.72, ci: 0.305, },
		    '937698': { id: '937698', con: 'Lyn', name: '', ra: 8.94720916, dec: 45.63164699, mag: 5.72, ci: 1.125, },
		    '964827': { id: '964827', con: 'Hya', name: '', ra: 9.19964903, dec: -19.74762746, mag: 5.72, ci: 0.977, },
		    '994210': { id: '994210', con: 'Leo', name: '', ra: 9.47477137, dec: 8.1882992, mag: 5.72, ci: 1.045, },
		    '552030': { id: '552030', con: 'CMa', name: '', ra: 6.54416037, dec: -32.03044405, mag: 5.73, ci: -0.18, },
		    '629998': { id: '629998', con: 'Gem', name: '', ra: 7.00439547, dec: 16.07899524, mag: 5.73, ci: 1.641, },
		    '750487': { id: '750487', con: 'Pup', name: '', ra: 7.66217094, dec: -38.13929607, mag: 5.73, ci: -0.125, },
		    '834738': { id: '834738', con: 'Cnc', name: '', ra: 8.17421739, dec: 25.50733243, mag: 5.73, ci: 0.825, },
		    '856700': { id: '856700', con: 'UMa', name: '', ra: 8.32143341, dec: 62.50716317, mag: 5.73, ci: 0.891, },
		    '959533': { id: '959533', con: 'Hya', name: '', ra: 9.15116928, dec: -18.32855118, mag: 5.73, ci: 0, },
		    '542593': { id: '542593', con: 'CMa', name: '', ra: 6.47756659, dec: -32.37126091, mag: 5.74, ci: -0.16, },
		    '600494': { id: '600494', con: 'CMa', name: '', ra: 6.83981892, dec: -31.70605742, mag: 5.74, ci: 0.094, },
		    '615224': { id: '615224', con: 'Gem', name: '', ra: 6.92185193, dec: 25.37569676, mag: 5.74, ci: 0.573, },
		    '653419': { id: '653419', con: 'CMi', name: '', ra: 7.13041349, dec: 7.47121356, mag: 5.74, ci: 1.176, },
		    '695331': { id: '695331', con: 'Lyn', name: '', ra: 7.3548606, dec: 45.2281971, mag: 5.74, ci: 0.342, },
		    '797421': { id: '797421', con: 'Car', name: '', ra: 7.93851347, dec: -60.52643866, mag: 5.74, ci: 1.554, },
		    '871836': { id: '871836', con: 'Hya', name: '', ra: 8.42653841, dec: 2.10221409, mag: 5.74, ci: 1.528, },
		    '913984': { id: '913984', con: 'Pyx', name: '', ra: 8.74775747, dec: -37.1472519, mag: 5.74, ci: -0.139, },
		    '950515': { id: '950515', con: 'UMa', name: '', ra: 9.06677842, dec: 54.28388565, mag: 5.74, ci: 0.034, },
		    '983480': { id: '983480', con: 'Vel', name: '', ra: 9.37333115, dec: -46.0474466, mag: 5.74, ci: 0.903, },
		    '542381': { id: '542381', con: 'Aur', name: '', ra: 6.47613556, dec: 30.49303533, mag: 5.75, ci: 0.779, },
		    '571728': { id: '571728', con: 'Cam', name: '', ra: 6.67468826, dec: 77.99578162, mag: 5.75, ci: 1.488, },
		    '594378': { id: '594378', con: 'Mon', name: '', ra: 6.80529613, dec: -1.31892269, mag: 5.75, ci: 0.292, },
		    '597228': { id: '597228', con: 'Mon', name: '', ra: 6.82122447, dec: -2.27204648, mag: 5.75, ci: -0.098, },
		    '607825': { id: '607825', con: 'Mon', name: '', ra: 6.88040776, dec: 8.38037458, mag: 5.75, ci: 0.27, },
		    '652082': { id: '652082', con: 'CMa', name: '', ra: 7.12294042, dec: -23.84073199, mag: 5.75, ci: -0.117, },
		    '664658': { id: '664658', con: 'Gem', name: '', ra: 7.18974086, dec: 26.85658423, mag: 5.75, ci: 0.13, },
		    '679010': { id: '679010', con: 'Gem', name: '', ra: 7.26587947, dec: 27.89741867, mag: 5.75, ci: 1.605, },
		    '719760': { id: '719760', con: 'Mon', name: '', ra: 7.48947453, dec: -10.32666549, mag: 5.75, ci: 1.616, },
		    '877369': { id: '877369', con: 'Pyx', name: '', ra: 8.46650627, dec: -35.11376449, mag: 5.75, ci: -0.151, },
		    '934681': { id: '934681', con: 'Hya', name: '', ra: 8.92011946, dec: -18.24119026, mag: 5.75, ci: 1.327, },
		    '998252': { id: '998252', con: 'Ant', name: '', ra: 9.51280398, dec: -31.88921618, mag: 5.75, ci: 0.066, },
		    '502032': { id: '502032', con: 'Ori', name: '', ra: 6.20037233, dec: 19.79054373, mag: 5.76, ci: -0.071, },
		    '520842': { id: '520842', con: 'Col', name: '', ra: 6.32804324, dec: -34.39659387, mag: 5.76, ci: -0.08, },
		    '535524': { id: '535524', con: 'Pup', name: '', ra: 6.42879512, dec: -48.17690461, mag: 5.76, ci: -0.061, },
		    '542520': { id: '542520', con: 'CMa', name: '', ra: 6.4770607, dec: -17.46600451, mag: 5.76, ci: 1.118, },
		    '566230': { id: '566230', con: 'Aur', name: '', ra: 6.63972429, dec: 28.98434976, mag: 5.76, ci: -0.001, },
		    '750658': { id: '750658', con: 'Pup', name: '', ra: 7.66329888, dec: -38.26065407, mag: 5.76, ci: -0.071, },
		    '787703': { id: '787703', con: 'Mon', name: '', ra: 7.87996137, dec: -5.42825579, mag: 5.76, ci: 0.412, },
		    '892308': { id: '892308', con: 'Lyn', name: '', ra: 8.57885657, dec: 36.41961893, mag: 5.76, ci: 0.051, },
		    '959754': { id: '959754', con: 'Hya', name: '', ra: 9.15319864, dec: -12.35770668, mag: 5.76, ci: 0.937, },
		    '600432': { id: '600432', con: 'CMa', name: '', ra: 6.83938028, dec: -17.08456259, mag: 5.77, ci: 1.435, },
		    '670120': { id: '670120', con: 'CMa', name: '', ra: 7.2186649, dec: -11.25133968, mag: 5.77, ci: 1.508, },
		    '705405': { id: '705405', con: 'Gem', name: '', ra: 7.40929266, dec: 27.63785395, mag: 5.77, ci: 0.368, },
		    '751977': { id: '751977', con: 'Lyn', name: '', ra: 7.67074841, dec: 38.34454002, mag: 5.77, ci: 1.654, },
		    '804174': { id: '804174', con: 'Car', name: '', ra: 7.98070914, dec: -60.82446227, mag: 5.77, ci: -0.082, },
		    '838688': { id: '838688', con: 'Vel', name: '', ra: 8.19999113, dec: -46.64434982, mag: 5.77, ci: 0.626, },
		    '844226': { id: '844226', con: 'Pup', name: '', ra: 8.23701568, dec: -35.49001596, mag: 5.77, ci: 1.024, },
		    '988953': { id: '988953', con: 'Car', name: '', ra: 9.42423397, dec: -61.95050243, mag: 5.77, ci: 0.137, },
		    '501000': { id: '501000', con: 'Aur', name: '', ra: 6.19349672, dec: 48.7109894, mag: 5.78, ci: 0.1, },
		    '502787': { id: '502787', con: 'Aur', name: '', ra: 6.2055899, dec: 32.69338119, mag: 5.78, ci: 1.646, },
		    '531940': { id: '531940', con: 'Pic', name: '', ra: 6.40384465, dec: -60.28132558, mag: 5.78, ci: -0.001, },
		    '558508': { id: '558508', con: 'Mon', name: '', ra: 6.58773012, dec: 0.89021858, mag: 5.78, ci: 0.004, },
		    '601821': { id: '601821', con: 'Mon', name: '', ra: 6.8471752, dec: -0.54088438, mag: 5.78, ci: 0.396, },
		    '636036': { id: '636036', con: 'Gem', name: '', ra: 7.03819263, dec: 15.3360081, mag: 5.78, ci: 1.14, },
		    '646537': { id: '646537', con: 'Mon', name: '', ra: 7.09417372, dec: 9.18579919, mag: 5.78, ci: 1.513, },
		    '678115': { id: '678115', con: 'CMi', name: '', ra: 7.26095311, dec: 7.97774172, mag: 5.78, ci: 1.537, },
		    '718932': { id: '718932', con: 'Pup', name: '', ra: 7.48469824, dec: -31.45621621, mag: 5.78, ci: -0.185, },
		    '735207': { id: '735207', con: 'Pup', name: '', ra: 7.5763319, dec: -27.0122776, mag: 5.78, ci: 1.045, },
		    '747615': { id: '747615', con: 'Pup', name: '', ra: 7.64552733, dec: -36.49683048, mag: 5.78, ci: -0.148, },
		    '778005': { id: '778005', con: 'Car', name: '', ra: 7.82024398, dec: -60.28365434, mag: 5.78, ci: 0.428, },
		    '779294': { id: '779294', con: 'Vol', name: '', ra: 7.82805397, dec: -66.19597114, mag: 5.78, ci: -0.04, },
		    '810879': { id: '810879', con: 'Lyn', name: '', ra: 8.02243528, dec: 59.04739536, mag: 5.78, ci: 0.421, },
		    '932017': { id: '932017', con: 'Car', name: '', ra: 8.89684904, dec: -60.35390838, mag: 5.78, ci: -0.088, },
		    '964103': { id: '964103', con: 'Vel', name: '', ra: 9.19260632, dec: -46.58391881, mag: 5.78, ci: -0.218, },
		    '519086': { id: '519086', con: 'CMa', name: '', ra: 6.31638202, dec: -20.92561064, mag: 5.79, ci: -0.155, },
		    '573358': { id: '573358', con: 'Mon', name: '', ra: 6.68484471, dec: 0.49531484, mag: 5.79, ci: -0.094, },
		    '707147': { id: '707147', con: 'CMa', name: '', ra: 7.41897663, dec: -13.75197774, mag: 5.79, ci: 0.432, },
		    '708023': { id: '708023', con: 'CMa', name: '', ra: 7.42368586, dec: -25.21776342, mag: 5.79, ci: -0.103, },
		    '715329': { id: '715329', con: 'CMa', name: '', ra: 7.4643504, dec: -11.55692766, mag: 5.79, ci: 0.583, },
		    '756907': { id: '756907', con: 'Gem', name: '', ra: 7.6977351, dec: 13.48045567, mag: 5.79, ci: 1.669, },
		    '894777': { id: '894777', con: 'Vel', name: '', ra: 8.59778536, dec: -50.96965044, mag: 5.79, ci: -0.132, },
		    '916182': { id: '916182', con: 'Cha', name: '', ra: 8.76532034, dec: -79.50437306, mag: 5.79, ci: 1.595, },
		    '930058': { id: '930058', con: 'Vel', name: '', ra: 8.88000533, dec: -38.7240839, mag: 5.79, ci: 1.508, },
		    '978446': { id: '978446', con: 'Hya', name: '', ra: 9.32587069, dec: -15.83466141, mag: 5.79, ci: 1.285, },
		    '982276': { id: '982276', con: 'UMa', name: '', ra: 9.36202437, dec: 56.69922091, mag: 5.79, ci: 1.511, },
		    '614430': { id: '614430', con: 'CMa', name: '', ra: 6.91742738, dec: -20.40487492, mag: 5.8, ci: 0.048, },
		    '651263': { id: '651263', con: 'Pup', name: '', ra: 7.11863286, dec: -40.89327154, mag: 5.8, ci: -0.158, },
		    '673467': { id: '673467', con: 'Mon', name: '', ra: 7.23634662, dec: -3.90177992, mag: 5.8, ci: 1.585, },
		    '700232': { id: '700232', con: 'Lyn', name: '', ra: 7.38112682, dec: 55.28139299, mag: 5.8, ci: -0.078, },
		    '706575': { id: '706575', con: 'Lyn', name: '', ra: 7.41585744, dec: 51.88726209, mag: 5.8, ci: 1.61, },
		    '763795': { id: '763795', con: 'Pup', name: '', ra: 7.73602411, dec: -36.06250428, mag: 5.8, ci: 0.32, },
		    '799293': { id: '799293', con: 'Cnc', name: '', ra: 7.94984803, dec: 15.7902828, mag: 5.8, ci: 1.285, },
		    '859293': { id: '859293', con: 'Cnc', name: '', ra: 8.33915897, dec: 20.74772335, mag: 5.8, ci: 1.137, },
		    '890724': { id: '890724', con: 'Hya', name: '', ra: 8.567116, dec: -2.15155759, mag: 5.8, ci: 0.007, },
		    '941104': { id: '941104', con: 'Hya', name: '', ra: 8.97887045, dec: -16.13272881, mag: 5.8, ci: 0.521, },
		    '944678': { id: '944678', con: 'Car', name: '', ra: 9.01270613, dec: -60.96383248, mag: 5.8, ci: 1.211, },
		    '587253': { id: '587253', con: 'Car', name: '', ra: 6.76492152, dec: -52.40968901, mag: 5.81, ci: 1.551, },
		    '680809': { id: '680809', con: 'Pup', name: '', ra: 7.27551357, dec: -38.31892428, mag: 5.81, ci: -0.133, },
		    '538753': { id: '538753', con: 'Pic', name: '', ra: 6.4511456, dec: -58.00212099, mag: 5.82, ci: 1.279, },
		    '548554': { id: '548554', con: 'Col', name: '', ra: 6.52030407, dec: -35.25884814, mag: 5.82, ci: 0.813, },
		    '551576': { id: '551576', con: 'Aur', name: '', ra: 6.54088443, dec: 32.45490162, mag: 5.82, ci: 0.188, },
		    '778004': { id: '778004', con: 'Pup', name: '', ra: 7.8202403, dec: -46.85771863, mag: 5.82, ci: -0.142, },
		    '879940': { id: '879940', con: 'Vel', name: '', ra: 8.48543519, dec: -44.16042218, mag: 5.82, ci: -0.16, },
		    '500852': { id: '500852', con: 'Gem', name: '', ra: 6.19230703, dec: 24.42025236, mag: 5.83, ci: 1.11, },
		    '506587': { id: '506587', con: 'Ori', name: '', ra: 6.23173159, dec: -3.74137313, mag: 5.83, ci: 0.91, },
		    '508232': { id: '508232', con: 'Mon', name: '', ra: 6.24352903, dec: -4.56846454, mag: 5.83, ci: -0.155, },
		    '698903': { id: '698903', con: 'Mon', name: '', ra: 7.3737192, dec: -5.98283168, mag: 5.83, ci: 0.352, },
		    '734285': { id: '734285', con: 'CMi', name: '', ra: 7.57108133, dec: 3.37172438, mag: 5.83, ci: -0.018, },
		    '815521': { id: '815521', con: 'Pup', name: '', ra: 8.05115578, dec: -32.46355086, mag: 5.83, ci: 1.225, },
		    '836581': { id: '836581', con: 'Vel', name: '', ra: 8.18633079, dec: -48.46199242, mag: 5.83, ci: -0.146, },
		    '974062': { id: '974062', con: 'Hya', name: '', ra: 9.28547784, dec: -14.57407076, mag: 5.83, ci: 1.049, },
		    '976928': { id: '976928', con: 'Vel', name: '', ra: 9.31176558, dec: -51.56065081, mag: 5.83, ci: 0.474, },
		    '665621': { id: '665621', con: 'CMa', name: '', ra: 7.19489044, dec: -20.883066, mag: 5.84, ci: -0.038, },
		    '675129': { id: '675129', con: 'Gem', name: '', ra: 7.24499404, dec: 24.88498169, mag: 5.84, ci: 1.554, },
		    '731025': { id: '731025', con: 'Pup', name: '', ra: 7.55271515, dec: -24.71073654, mag: 5.84, ci: 0.156, },
		    '618814': { id: '618814', con: 'Aur', name: '', ra: 6.94223784, dec: 46.27400152, mag: 5.85, ci: -0.079, },
		    '667956': { id: '667956', con: 'Gem', name: '', ra: 7.20732682, dec: 24.12859381, mag: 5.85, ci: 0.397, },
		    '948198': { id: '948198', con: 'Cnc', name: '', ra: 9.04578249, dec: 7.29826551, mag: 5.85, ci: 1.1, },
		    '968625': { id: '968625', con: 'Vel', name: '', ra: 9.23561363, dec: -44.14582115, mag: 5.85, ci: -0.113, },
		    '970096': { id: '970096', con: 'Vel', name: '', ra: 9.24921373, dec: -37.60239681, mag: 5.85, ci: 0.827, },
		    '507912': { id: '507912', con: 'Ori', name: '', ra: 6.24127575, dec: 17.90630057, mag: 5.86, ci: 0.253, },
		    '547521': { id: '547521', con: 'Lyn', name: '', ra: 6.51308602, dec: 58.16263126, mag: 5.86, ci: 0.934, },
		    '636821': { id: '636821', con: 'Gem', name: '', ra: 7.04257987, dec: 16.67444649, mag: 5.86, ci: 1.659, },
		    '685477': { id: '685477', con: 'Pup', name: '', ra: 7.30118025, dec: -43.98679703, mag: 5.86, ci: -0.117, },
		    '719938': { id: '719938', con: 'Mon', name: '', ra: 7.4904569, dec: -7.55116214, mag: 5.86, ci: 0.487, },
		    '795153': { id: '795153', con: 'CMi', name: '', ra: 7.92539818, dec: 8.86284021, mag: 5.86, ci: 0.369, },
		    '844677': { id: '844677', con: 'Vel', name: '', ra: 8.23996447, dec: -45.8345236, mag: 5.86, ci: -0.176, },
		    '924486': { id: '924486', con: 'Pyx', name: '', ra: 8.83395309, dec: -29.46299488, mag: 5.86, ci: 0.948, },
		    '974657': { id: '974657', con: 'Car', name: '', ra: 9.29099114, dec: -74.73458493, mag: 5.86, ci: -0.024, },
		    '997533': { id: '997533', con: 'Hya', name: '', ra: 9.50624533, dec: -15.57735601, mag: 5.86, ci: 1.193, },
		    '999575': { id: '999575', con: 'Ant', name: '', ra: 9.52584605, dec: -35.71474803, mag: 5.86, ci: 1.287, },
		    '537768': { id: '537768', con: 'Mon', name: '', ra: 6.44432931, dec: -1.50733169, mag: 5.87, ci: 0.07, },
		    '564347': { id: '564347', con: 'Lyn', name: '', ra: 6.62732993, dec: 56.85753269, mag: 5.87, ci: 0.006, },
		    '598832': { id: '598832', con: 'Gem', name: '', ra: 6.83050977, dec: 16.20288645, mag: 5.87, ci: -0.136, },
		    '685361': { id: '685361', con: 'Aur', name: '', ra: 7.30061467, dec: 40.88339028, mag: 5.87, ci: 0.181, },
		    '694645': { id: '694645', con: 'CMa', name: '', ra: 7.35120338, dec: -25.89164334, mag: 5.87, ci: 1.604, },
		    '721594': { id: '721594', con: 'Car', name: '', ra: 7.49992328, dec: -52.65116234, mag: 5.87, ci: 1.01, },
		    '769595': { id: '769595', con: 'Pup', name: '', ra: 7.76959515, dec: -37.93366685, mag: 5.87, ci: -0.111, },
		    '809499': { id: '809499', con: 'Car', name: '', ra: 8.01387161, dec: -54.15127353, mag: 5.87, ci: -0.134, },
		    '809779': { id: '809779', con: 'Cnc', name: '', ra: 8.01552044, dec: 25.39283598, mag: 5.87, ci: 1.021, },
		    '998150': { id: '998150', con: 'LMi', name: '', ra: 9.51200549, dec: 33.65570978, mag: 5.87, ci: 1.032, },
		    '509507': { id: '509507', con: 'CMa', name: '', ra: 6.25233396, dec: -20.27218587, mag: 5.88, ci: 1.322, },
		    '514499': { id: '514499', con: 'Col', name: '', ra: 6.28599068, dec: -37.25350058, mag: 5.88, ci: 0.139, },
		    '534471': { id: '534471', con: 'Mon', name: '', ra: 6.42126284, dec: -0.94588401, mag: 5.88, ci: 0.564, },
		    '545825': { id: '545825', con: 'Aur', name: '', ra: 6.50082621, dec: 46.68555378, mag: 5.88, ci: 1.448, },
		    '551209': { id: '551209', con: 'Mon', name: '', ra: 6.5386678, dec: 4.85600284, mag: 5.88, ci: 0.997, },
		    '571885': { id: '571885', con: 'Cam', name: '', ra: 6.67562526, dec: 71.74878562, mag: 5.88, ci: 1.223, },
		    '580480': { id: '580480', con: 'Mon', name: '', ra: 6.72740157, dec: 3.93253056, mag: 5.88, ci: -0.046, },
		    '620042': { id: '620042', con: 'Aur', name: '', ra: 6.94890277, dec: 46.70534865, mag: 5.88, ci: 1.093, },
		    '843279': { id: '843279', con: 'Lyn', name: '', ra: 8.23060405, dec: 56.45224219, mag: 5.88, ci: 1.016, },
		    '865273': { id: '865273', con: 'Pup', name: '', ra: 8.38053789, dec: -26.34822322, mag: 5.88, ci: 0.379, },
		    '888314': { id: '888314', con: 'Lyn', name: '', ra: 8.54860524, dec: 38.01636783, mag: 5.88, ci: 1.106, },
		    '939692': { id: '939692', con: 'Vel', name: '', ra: 8.96543287, dec: -48.57290642, mag: 5.88, ci: 1.06, },
		    '997557': { id: '997557', con: 'Car', name: '', ra: 9.50650503, dec: -58.36184822, mag: 5.88, ci: 1.676, },
		    '741143': { id: '741143', con: 'CMi', name: '', ra: 7.60964073, dec: 5.86216954, mag: 5.89, ci: 0.602, },
		    '765051': { id: '765051', con: 'Pup', name: '', ra: 7.74282866, dec: -37.94291909, mag: 5.89, ci: -0.115, },
		    '781239': { id: '781239', con: 'Pup', name: '', ra: 7.83995091, dec: -50.50946415, mag: 5.89, ci: 1.088, },
		    '859483': { id: '859483', con: 'Lyn', name: '', ra: 8.34057182, dec: 57.74327823, mag: 5.89, ci: 0.421, },
		    '865491': { id: '865491', con: 'Vel', name: '', ra: 8.38198829, dec: -52.12372876, mag: 5.89, ci: 0.018, },
		    '881360': { id: '881360', con: 'UMa', name: '', ra: 8.49616555, dec: 67.29744124, mag: 5.89, ci: 0.972, },
		    '890065': { id: '890065', con: 'Hya', name: '', ra: 8.56207756, dec: 4.75700324, mag: 5.89, ci: 1.066, },
		    '918282': { id: '918282', con: 'Cnc', name: '', ra: 8.78222744, dec: 12.10994896, mag: 5.89, ci: 0.12, },
		    '945343': { id: '945343', con: 'Vol', name: '', ra: 9.01903156, dec: -68.68391697, mag: 5.89, ci: 1.634, },
		    '945789': { id: '945789', con: 'Cnc', name: '', ra: 9.02336871, dec: 32.25229912, mag: 5.89, ci: 0.088, },
		    '618520': { id: '618520', con: 'Mon', name: '', ra: 6.94050932, dec: 9.95657037, mag: 5.9, ci: -0.085, },
		    '673693': { id: '673693', con: 'Mon', name: '', ra: 7.23764421, dec: -9.94753372, mag: 5.9, ci: 1.528, },
		    '689450': { id: '689450', con: 'CMi', name: '', ra: 7.32288099, dec: 2.74069329, mag: 5.9, ci: 1.069, },
		    '711942': { id: '711942', con: 'Pup', name: '', ra: 7.44512934, dec: -34.1406962, mag: 5.9, ci: -0.153, },
		    '727886': { id: '727886', con: 'Mon', name: '', ra: 7.53493408, dec: -8.88132908, mag: 5.9, ci: 0.54, },
		    '772410': { id: '772410', con: 'Pup', name: '', ra: 7.78682035, dec: -22.51950862, mag: 5.9, ci: -0.18, },
		    '811652': { id: '811652', con: 'Pup', name: '', ra: 8.02709043, dec: -37.28371757, mag: 5.9, ci: 0.147, },
		    '906191': { id: '906191', con: 'Vel', name: '', ra: 8.68481081, dec: -48.92268044, mag: 5.9, ci: -0.186, },
		    '937076': { id: '937076', con: 'Lyn', name: '', ra: 8.94180978, dec: 40.20147363, mag: 5.9, ci: 0.378, },
		    '994252': { id: '994252', con: 'Car', name: '', ra: 9.47515193, dec: -66.7018749, mag: 5.9, ci: 0.012, },
		    '509509': { id: '509509', con: 'Ori', name: '', ra: 6.25235327, dec: 13.85109621, mag: 5.91, ci: -0.231, },
		    '620274': { id: '620274', con: 'Gem', name: '', ra: 6.95014459, dec: 33.68104012, mag: 5.91, ci: 0.878, },
		    '667229': { id: '667229', con: 'CMa', name: '', ra: 7.20339307, dec: -25.9425896, mag: 5.91, ci: -0.17, },
		    '690746': { id: '690746', con: 'CMi', name: '', ra: 7.32990163, dec: 7.14295319, mag: 5.91, ci: 0.537, },
		    '833710': { id: '833710', con: 'Lyn', name: '', ra: 8.16771535, dec: 58.24824344, mag: 5.91, ci: 1.365, },
		    '894739': { id: '894739', con: 'Cnc', name: '', ra: 8.59749391, dec: 6.62022548, mag: 5.91, ci: 0.53, },
		    '902329': { id: '902329', con: 'UMa', name: '', ra: 8.65489534, dec: 52.71162345, mag: 5.91, ci: 1.167, },
		    '994741': { id: '994741', con: 'Car', name: '', ra: 9.47975114, dec: -62.27313692, mag: 5.91, ci: 1.102, },
		    '999548': { id: '999548', con: 'Ant', name: '', ra: 9.52559997, dec: -31.87182901, mag: 5.91, ci: 0.258, },
		    '546163': { id: '546163', con: 'Mon', name: '', ra: 6.50313254, dec: -10.08150717, mag: 5.92, ci: 1.373, },
		    '547487': { id: '547487', con: 'CMa', name: '', ra: 6.51285785, dec: -27.76957327, mag: 5.92, ci: -0.156, },
		    '585693': { id: '585693', con: 'CMa', name: '', ra: 6.75637275, dec: -31.79367302, mag: 5.92, ci: 0.491, },
		    '589165': { id: '589165', con: 'Mon', name: '', ra: 6.77567083, dec: 8.58715499, mag: 5.92, ci: -0.173, },
		    '751911': { id: '751911', con: 'Pup', name: '', ra: 7.67042501, dec: -19.66086015, mag: 5.92, ci: 1.158, },
		    '859735': { id: '859735', con: 'Cnc', name: 'Piautos', ra: 8.34225995, dec: 24.02231191, mag: 5.92, ci: -0.039, },
		    '865460': { id: '865460', con: 'Hya', name: '', ra: 8.38169328, dec: -7.54312005, mag: 5.92, ci: 1.635, },
		    '889877': { id: '889877', con: 'Vel', name: '', ra: 8.56067535, dec: -38.84881201, mag: 5.92, ci: -0.114, },
		    '897485': { id: '897485', con: 'Cnc', name: '', ra: 8.61826944, dec: 9.65557948, mag: 5.92, ci: 0.083, },
		    '929746': { id: '929746', con: 'Vel', name: '', ra: 8.87738973, dec: -48.35909803, mag: 5.92, ci: -0.148, },
		    '967584': { id: '967584', con: 'Vel', name: '', ra: 9.22623744, dec: -47.3384078, mag: 5.92, ci: -0.051, },
		    '558595': { id: '558595', con: 'Mon', name: '', ra: 6.58822122, dec: 9.98833602, mag: 5.93, ci: 1.508, },
		    '639827': { id: '639827', con: 'Gem', name: '', ra: 7.05846095, dec: 29.3370808, mag: 5.93, ci: 0.595, },
		    '683977': { id: '683977', con: 'Lyn', name: '', ra: 7.29269992, dec: 52.13107098, mag: 5.93, ci: 1.259, },
		    '741756': { id: '741756', con: 'Lyn', name: '', ra: 7.61306494, dec: 55.75506044, mag: 5.93, ci: 1.123, },
		    '745050': { id: '745050', con: 'Lyn', name: '', ra: 7.63162449, dec: 48.77384198, mag: 5.93, ci: 0.221, },
		    '754176': { id: '754176', con: 'Gem', name: '', ra: 7.68292187, dec: 23.01852765, mag: 5.93, ci: 1.561, },
		    '770923': { id: '770923', con: 'Cam', name: '', ra: 7.7777993, dec: 65.45567571, mag: 5.93, ci: 1.183, },
		    '971746': { id: '971746', con: 'UMa', name: '', ra: 9.2646055, dec: 72.94632635, mag: 5.93, ci: 0.179, },
		    '564476': { id: '564476', con: 'Lyn', name: '', ra: 6.62816329, dec: 61.48123291, mag: 5.94, ci: 0.899, },
		    '604437': { id: '604437', con: 'Pup', name: '', ra: 6.86178345, dec: -36.23027213, mag: 5.94, ci: 0.183, },
		    '652068': { id: '652068', con: 'Gem', name: '', ra: 7.12288835, dec: 34.00929093, mag: 5.94, ci: 1.507, },
		    '667922': { id: '667922', con: 'Pup', name: '', ra: 7.20717218, dec: -36.54438777, mag: 5.94, ci: -0.145, },
		    '712629': { id: '712629', con: 'Gem', name: '', ra: 7.44898103, dec: 20.25755631, mag: 5.94, ci: 0.336, },
		    '778091': { id: '778091', con: 'Pup', name: '', ra: 7.82073577, dec: -35.24329117, mag: 5.94, ci: -0.051, },
		    '866551': { id: '866551', con: 'Cnc', name: '', ra: 8.38939975, dec: 18.33220477, mag: 5.94, ci: 0.175, },
		    '878863': { id: '878863', con: 'Cnc', name: '', ra: 8.47703865, dec: 14.21082371, mag: 5.94, ci: 0.201, },
		    '976432': { id: '976432', con: 'Lyn', name: '', ra: 9.30721345, dec: 35.36425549, mag: 5.94, ci: 0.177, },
		    '562131': { id: '562131', con: 'CMa', name: '', ra: 6.61294349, dec: -13.32104257, mag: 5.95, ci: 1.562, },
		    '630380': { id: '630380', con: 'Mon', name: '', ra: 7.00659914, dec: -8.40682268, mag: 5.95, ci: -0.075, },
		    '675932': { id: '675932', con: 'Pup', name: '', ra: 7.24920926, dec: -41.42639989, mag: 5.95, ci: -0.146, },
		    '678324': { id: '678324', con: 'Mon', name: '', ra: 7.26201168, dec: -10.58360407, mag: 5.95, ci: 1.173, },
		    '718311': { id: '718311', con: 'Pup', name: '', ra: 7.48103065, dec: -31.84692894, mag: 5.95, ci: -0.156, },
		    '723135': { id: '723135', con: 'Car', name: '', ra: 7.50858865, dec: -54.39936304, mag: 5.95, ci: 1.585, },
		    '756006': { id: '756006', con: 'CMi', name: '', ra: 7.69309876, dec: 3.62477399, mag: 5.95, ci: -0.032, },
		    '854491': { id: '854491', con: 'Pup', name: '', ra: 8.30665216, dec: -12.63217225, mag: 5.95, ci: 0.754, },
		    '872464': { id: '872464', con: 'Vol', name: '', ra: 8.43099896, dec: -64.6006194, mag: 5.95, ci: 0.971, },
		    '893941': { id: '893941', con: 'Pyx', name: '', ra: 8.59130568, dec: -26.84348864, mag: 5.95, ci: 0.393, },
		    '937196': { id: '937196', con: 'Hya', name: '', ra: 8.94281265, dec: -16.70874538, mag: 5.95, ci: 1.544, },
		    '959059': { id: '959059', con: 'Cnc', name: '', ra: 9.14648063, dec: 26.62911181, mag: 5.95, ci: 0.654, },
		    '959153': { id: '959153', con: 'Lyn', name: '', ra: 9.1475191, dec: 33.88221098, mag: 5.95, ci: 0.585, },
		    '625930': { id: '625930', con: 'Mon', name: '', ra: 6.98250713, dec: 3.60235505, mag: 5.96, ci: 1.056, },
		    '636437': { id: '636437', con: 'Gem', name: '', ra: 7.04042582, dec: 17.75552076, mag: 5.96, ci: 1.518, },
		    '639150': { id: '639150', con: 'Mon', name: '', ra: 7.05497693, dec: 9.1383616, mag: 5.96, ci: 0.126, },
		    '651575': { id: '651575', con: 'Car', name: '', ra: 7.12035814, dec: -51.96828145, mag: 5.96, ci: 0.996, },
		    '677218': { id: '677218', con: 'Car', name: '', ra: 7.25589627, dec: -52.49922631, mag: 5.96, ci: 1.099, },
		    '819953': { id: '819953', con: 'Vel', name: '', ra: 8.07844443, dec: -50.59039501, mag: 5.96, ci: 1.213, },
		    '824206': { id: '824206', con: 'Cnc', name: '', ra: 8.1051098, dec: 22.63548932, mag: 5.96, ci: 1.652, },
		    '861289': { id: '861289', con: 'Car', name: '', ra: 8.35336071, dec: -57.97322333, mag: 5.96, ci: -0.092, },
		    '872633': { id: '872633', con: 'Pup', name: '', ra: 8.43210855, dec: -14.92966344, mag: 5.96, ci: 0.167, },
		    '900236': { id: '900236', con: 'Cnc', name: '', ra: 8.63860599, dec: 32.80202031, mag: 5.96, ci: 1.111, },
		    '928836': { id: '928836', con: 'Lyn', name: '', ra: 8.86993575, dec: 45.31282118, mag: 5.96, ci: 1.233, },
		    '929640': { id: '929640', con: 'Cnc', name: 'Copernicus', ra: 8.87661457, dec: 28.33082116, mag: 5.96, ci: 0.869, },
		    '974763': { id: '974763', con: 'UMa', name: '', ra: 9.29199391, dec: 46.8172308, mag: 5.96, ci: 0.063, },
		    '511956': { id: '511956', con: 'CMa', name: '', ra: 6.26880321, dec: -16.61800683, mag: 5.97, ci: -0.167, },
		    '870369': { id: '870369', con: 'Pup', name: '', ra: 8.41589453, dec: -42.76985613, mag: 5.97, ci: -0.159, },
		    '709352': { id: '709352', con: 'Mon', name: '', ra: 7.43088905, dec: -5.7749632, mag: 5.98, ci: 0.901, },
		    '714933': { id: '714933', con: 'Pup', name: '', ra: 7.46192696, dec: -22.85919445, mag: 5.98, ci: -0.088, },
		    '804670': { id: '804670', con: 'Pup', name: '', ra: 7.98383383, dec: -45.21585176, mag: 5.98, ci: -0.143, },
		    '881342': { id: '881342', con: 'Vel', name: '', ra: 8.49600892, dec: -46.33169302, mag: 5.98, ci: -0.127, },
		    '928777': { id: '928777', con: 'Lyn', name: '', ra: 8.8694517, dec: 42.00273528, mag: 5.98, ci: 1.251, },
		    '970609': { id: '970609', con: 'Lyn', name: '', ra: 9.25395745, dec: 34.63351465, mag: 5.98, ci: 0.839, },
		    '509915': { id: '509915', con: 'CMa', name: '', ra: 6.254927, dec: -18.47716956, mag: 5.99, ci: 1.058, },
		    '510394': { id: '510394', con: 'Mon', name: '', ra: 6.25824297, dec: -4.91471756, mag: 5.99, ci: 0.097, },
		    '569893': { id: '569893', con: 'Gem', name: '', ra: 6.66325441, dec: 12.98276629, mag: 5.99, ci: 0.063, },
		    '670995': { id: '670995', con: 'CMa', name: '', ra: 7.2233404, dec: -22.67424528, mag: 5.99, ci: 1.481, },
		    '697766': { id: '697766', con: 'CMi', name: '', ra: 7.36763274, dec: 0.17712136, mag: 5.99, ci: -0.069, },
		    '751154': { id: '751154', con: 'Pup', name: '', ra: 7.66610857, dec: -37.57942184, mag: 5.99, ci: -0.04, },
		    '811288': { id: '811288', con: 'Cnc', name: '', ra: 8.02508021, dec: 16.45530787, mag: 5.99, ci: -0.024, },
		    '986507': { id: '986507', con: 'Car', name: '', ra: 9.40152646, dec: -61.6489011, mag: 5.99, ci: 1.06, },
		    '513096': { id: '513096', con: 'Col', name: '', ra: 6.27655186, dec: -39.26439122, mag: 6, ci: 0.163, },
		    '528070': { id: '528070', con: 'Ori', name: '', ra: 6.37677574, dec: 12.57023647, mag: 6, ci: 0.319, },
		    '645420': { id: '645420', con: 'Gem', name: '', ra: 7.08843594, dec: 22.63745769, mag: 6, ci: -0.027, },
		    '658889': { id: '658889', con: 'CMa', name: '', ra: 7.15926795, dec: -16.23450737, mag: 6, ci: 0.04, },
		    '694172': { id: '694172', con: 'CMa', name: '', ra: 7.34858798, dec: -26.96383398, mag: 6, ci: -0.172, },
		    '839938': { id: '839938', con: 'Vel', name: '', ra: 8.2085499, dec: -46.26427578, mag: 6, ci: -0.113, },
		    '860038': { id: '860038', con: 'UMa', name: '', ra: 8.3445334, dec: 72.40723211, mag: 6, ci: 1.537, },
		    '925095': { id: '925095', con: 'Vel', name: '', ra: 8.83917129, dec: -42.08979749, mag: 6, ci: -0.114, },
		    '1417320': { id: '1417320', con: 'Boo', name: 'Arcturus', ra: 14.26120767, dec: 19.18727298, mag: -0.05, ci: 1.239, },
		    '1451193': { id: '1451193', con: 'Cen', name: 'Rigil Kentaurus', ra: 14.66136069, dec: -60.83514707, mag: -0.01, ci: 0.71, },
		    '1400378': { id: '1400378', con: 'Cen', name: 'Hadar', ra: 14.0637346, dec: -60.3729784, mag: 0.61, ci: -0.231, },
		    '1269694': { id: '1269694', con: 'Cru', name: 'Acrux', ra: 12.44331706, dec: -63.09905586, mag: 0.77, ci: -0.243, },
		    '1345269': { id: '1345269', con: 'Vir', name: 'Spica', ra: 13.41989015, dec: -11.16124491, mag: 0.98, ci: -0.235, },
		    '1296561': { id: '1296561', con: 'Cru', name: 'Mimosa', ra: 12.79536636, dec: -59.68873246, mag: 1.25, ci: -0.238, },
		    '1451151': { id: '1451151', con: 'Cen', name: 'Toliman', ra: 14.66094189, dec: -60.83947139, mag: 1.35, ci: 0.9, },
		    '1063525': { id: '1063525', con: 'Leo', name: 'Regulus', ra: 10.13957205, dec: 11.96719513, mag: 1.36, ci: -0.087, },
		    '1275392': { id: '1275392', con: 'Cru', name: 'Gacrux', ra: 12.5194248, dec: -57.11256922, mag: 1.59, ci: 1.6, },
		    '1304800': { id: '1304800', con: 'UMa', name: 'Alioth', ra: 12.90045361, dec: 55.95984301, mag: 1.76, ci: -0.022, },
		    '1154608': { id: '1154608', con: 'UMa', name: 'Dubhe', ra: 11.06217691, dec: 61.75111888, mag: 1.81, ci: 1.061, },
		    '1377079': { id: '1377079', con: 'UMa', name: 'Alkaid', ra: 13.79237392, dec: 49.31330288, mag: 1.85, ci: -0.099, },
		    '1083342': { id: '1083342', con: 'Leo', name: 'Algieba', ra: 10.3328227, dec: 19.84186032, mag: 2.01, ci: 1.128, },
		    '1404493': { id: '1404493', con: 'Cen', name: 'Menkent', ra: 14.11137449, dec: -36.36995824, mag: 2.06, ci: 1.011, },
		    '1466797': { id: '1466797', con: 'UMi', name: 'Kochab', ra: 14.845105, dec: 74.155505, mag: 2.07, ci: 1.465, },
		    '1218019': { id: '1218019', con: 'Leo', name: 'Denebola', ra: 11.81774398, dec: 14.57233687, mag: 2.14, ci: 0.09, },
		    '1288648': { id: '1288648', con: 'Cen', name: '', ra: 12.69195145, dec: -48.95975694, mag: 2.2, ci: -0.023, },
		    '1343569': { id: '1343569', con: 'UMa', name: 'Mizar', ra: 13.39872774, dec: 54.92541525, mag: 2.23, ci: 0.057, },
		    '1366179': { id: '1366179', con: 'Cen', name: '', ra: 13.66479797, dec: -53.46636269, mag: 2.29, ci: -0.171, },
		    '1454415': { id: '1454415', con: 'Lup', name: '', ra: 14.69882607, dec: -47.38814127, mag: 2.3, ci: -0.154, },
		    '1445202': { id: '1445202', con: 'Cen', name: '', ra: 14.59179211, dec: -42.15774562, mag: 2.33, ci: -0.157, },
		    '1151532': { id: '1151532', con: 'UMa', name: 'Merak', ra: 11.0306641, dec: 56.38234478, mag: 2.34, ci: 0.033, },
		    '1458789': { id: '1458789', con: 'Boo', name: 'Izar', ra: 14.749784, dec: 27.074222, mag: 2.35, ci: 0.966, },
		    '1224714': { id: '1224714', con: 'UMa', name: 'Phecda', ra: 11.89717879, dec: 53.6947574, mag: 2.41, ci: 0.044, },
		    '1388555': { id: '1388555', con: 'Cen', name: '', ra: 13.92567636, dec: -47.28826634, mag: 2.55, ci: -0.176, },
		    '1169812': { id: '1169812', con: 'Leo', name: 'Zosma', ra: 11.235138, dec: 20.523717, mag: 2.56, ci: 0.128, },
		    '1245066': { id: '1245066', con: 'Cen', name: '', ra: 12.13930876, dec: -50.72242738, mag: 2.58, ci: -0.128, },
		    '1255242': { id: '1255242', con: 'Crv', name: 'Gienah', ra: 12.263437, dec: -17.541929, mag: 2.58, ci: -0.107, },
		    '1279520': { id: '1279520', con: 'Crv', name: 'Kraz', ra: 12.573121, dec: -23.396759, mag: 2.65, ci: 0.893, },
		    '1387284': { id: '1387284', con: 'Boo', name: 'Muphrid', ra: 13.911411, dec: 18.397717, mag: 2.68, ci: 0.58, },
		    '1477390': { id: '1477390', con: 'Lup', name: '', ra: 14.97553499, dec: -43.13396021, mag: 2.68, ci: -0.184, },
		    '1127858': { id: '1127858', con: 'Vel', name: '', ra: 10.7794993, dec: -49.42023604, mag: 2.69, ci: 0.901, },
		    '1283119': { id: '1283119', con: 'Mus', name: '', ra: 12.61973239, dec: -69.13561311, mag: 2.69, ci: -0.176, },
		    '1121911': { id: '1121911', con: 'Car', name: '', ra: 10.715949, dec: -64.39445, mag: 2.74, ci: -0.22, },
		    '1288811': { id: '1288811', con: 'Vir', name: 'Porrima', ra: 12.694345, dec: -1.449375, mag: 2.74, ci: 0.368, },
		    '1339129': { id: '1339129', con: 'Cen', name: '', ra: 13.34328251, dec: -36.71229344, mag: 2.75, ci: 0.068, },
		    '1467018': { id: '1467018', con: 'Lib', name: 'Zubenelgenubi', ra: 14.84797594, dec: -16.04177696, mag: 2.75, ci: 0.147, },
		    '1254346': { id: '1254346', con: 'Cru', name: 'Imai', ra: 12.25242117, dec: -58.74892829, mag: 2.79, ci: -0.193, },
		    '1315170': { id: '1315170', con: 'Vir', name: 'Vindemiatrix', ra: 13.03627731, dec: 10.95914863, mag: 2.85, ci: 0.934, },
		    '1307241': { id: '1307241', con: 'CVn', name: 'Cor Caroli', ra: 12.933807, dec: 38.31838, mag: 2.89, ci: -0.115, },
		    '1026494': { id: '1026494', con: 'Car', name: '', ra: 9.78503413, dec: -65.07200514, mag: 2.92, ci: 0.273, },
		    '1273781': { id: '1273781', con: 'Crv', name: 'Algorab', ra: 12.497739, dec: -16.515432, mag: 2.94, ci: -0.012, },
		    '1024340': { id: '1024340', con: 'Leo', name: 'Ras Elased Australis', ra: 9.76418707, dec: 23.77425356, mag: 2.97, ci: 0.808, },
		    '1336891': { id: '1336891', con: 'Hya', name: '', ra: 13.315359, dec: -23.171512, mag: 2.99, ci: 0.92, },
		    '1163461': { id: '1163461', con: 'UMa', name: '', ra: 11.16105775, dec: 44.49848342, mag: 3, ci: 1.144, },
		    '1247442': { id: '1247442', con: 'Crv', name: '', ra: 12.168746, dec: -22.619766, mag: 3.02, ci: 1.326, },
		    '1294782': { id: '1294782', con: 'Mus', name: '', ra: 12.771346, dec: -68.108119, mag: 3.04, ci: -0.178, },
		    '1440281': { id: '1440281', con: 'Boo', name: 'Seginus', ra: 14.534636, dec: 38.308253, mag: 3.04, ci: 0.191, },
		    '1087501': { id: '1087501', con: 'UMa', name: 'Tania Australis', ra: 10.37215027, dec: 41.4995165, mag: 3.06, ci: 1.603, },
		    '1132421': { id: '1132421', con: 'Hya', name: '', ra: 10.827079, dec: -16.193648, mag: 3.11, ci: 1.232, },
		    '1199809': { id: '1199809', con: 'Cen', name: '', ra: 11.59635612, dec: -63.019845, mag: 3.11, ci: -0.044, },
		    '1478293': { id: '1478293', con: 'Cen', name: '', ra: 14.98602311, dec: -42.1042044, mag: 3.13, ci: -0.208, },
		    '1001802': { id: '1001802', con: 'UMa', name: '', ra: 9.547715, dec: 51.6773, mag: 3.17, ci: 0.475, },
		    '1455238': { id: '1455238', con: 'Cir', name: '', ra: 14.70845016, dec: -64.97513751, mag: 3.18, ci: 0.256, },
		    '1404048': { id: '1404048', con: 'Hya', name: '', ra: 14.10619374, dec: -26.68236072, mag: 3.25, ci: 1.091, },
		    '1485300': { id: '1485300', con: 'Lib', name: 'Brachium', ra: 15.06783762, dec: -25.28196292, mag: 3.25, ci: 1.674, },
		    '1072694': { id: '1072694', con: 'Car', name: '', ra: 10.22894901, dec: -70.03789684, mag: 3.29, ci: -0.074, },
		    '1103869': { id: '1103869', con: 'Car', name: '', ra: 10.533743, dec: -61.685332, mag: 3.3, ci: -0.089, },
		    '1254749': { id: '1254749', con: 'UMa', name: 'Megrez', ra: 12.257086, dec: 57.032617, mag: 3.32, ci: 0.077, },
		    '1170001': { id: '1170001', con: 'Leo', name: 'Chertan', ra: 11.23733488, dec: 15.4295709, mag: 3.33, ci: -0.003, },
		    '1358768': { id: '1358768', con: 'Vir', name: 'Heze', ra: 13.57822, dec: -0.59582, mag: 3.38, ci: 0.114, },
		    '1078494': { id: '1078494', con: 'Car', name: '', ra: 10.28471568, dec: -61.3323077, mag: 3.39, ci: 1.541, },
		    '1306748': { id: '1306748', con: 'Vir', name: 'Minelauva', ra: 12.92672454, dec: 3.39747144, mag: 3.39, ci: 1.571, },
		    '1379788': { id: '1379788', con: 'Cen', name: '', ra: 13.82507724, dec: -41.68770854, mag: 3.41, ci: -0.225, },
		    '1497144': { id: '1497144', con: 'Lup', name: '', ra: 15.20474899, dec: -52.09924858, mag: 3.41, ci: 0.918, },
		    '1077796': { id: '1077796', con: 'Leo', name: 'Adhafera', ra: 10.278171, dec: 23.417311, mag: 3.43, ci: 0.307, },
		    '1078526': { id: '1078526', con: 'UMa', name: 'Tania Borealis', ra: 10.284952, dec: 42.914365, mag: 3.45, ci: 0.029, },
		    '1379944': { id: '1379944', con: 'Cen', name: '', ra: 13.82694123, dec: -42.47373038, mag: 3.47, ci: -0.17, },
		    '1061687': { id: '1061687', con: 'Leo', name: '', ra: 10.122209, dec: 16.762664, mag: 3.48, ci: -0.031, },
		    '1176044': { id: '1176044', con: 'UMa', name: 'Alula Borealis', ra: 11.30798248, dec: 33.09430465, mag: 3.49, ci: 1.4, },
		    '1482225': { id: '1482225', con: 'Boo', name: 'Nekkar', ra: 15.03243391, dec: 40.39056814, mag: 3.49, ci: 0.956, },
		    '1016167': { id: '1016167', con: 'Leo', name: 'Subra', ra: 9.68584283, dec: 9.89230752, mag: 3.52, ci: 0.516, },
		    '1043445': { id: '1043445', con: 'Vel', name: '', ra: 9.94770598, dec: -54.56779331, mag: 3.52, ci: -0.067, },
		    '1196069': { id: '1196069', con: 'Hya', name: '', ra: 11.55003222, dec: -31.857625, mag: 3.54, ci: 0.947, },
		    '1422596': { id: '1422596', con: 'Lup', name: '', ra: 14.32339433, dec: -46.05809697, mag: 3.55, ci: -0.184, },
		    '1177214': { id: '1177214', con: 'Crt', name: '', ra: 11.322347, dec: -14.778541, mag: 3.56, ci: 1.112, },
		    '1439932': { id: '1439932', con: 'Boo', name: '', ra: 14.53049695, dec: 30.37143819, mag: 3.57, ci: 1.298, },
		    '1220290': { id: '1220290', con: 'Vir', name: 'Zavijava', ra: 11.84492172, dec: 1.76471731, mag: 3.59, ci: 0.518, },
		    '1262718': { id: '1262718', con: 'Cru', name: 'Ginan', ra: 12.35600253, dec: -60.40114907, mag: 3.59, ci: 1.389, },
		    '1067331': { id: '1067331', con: 'Hya', name: '', ra: 10.1764655, dec: -12.35405115, mag: 3.61, ci: 1.007, },
		    '1315284': { id: '1315284', con: 'Mus', name: '', ra: 13.03784772, dec: -71.54885423, mag: 3.61, ci: 1.19, },
		    '1213180': { id: '1213180', con: 'Mus', name: '', ra: 11.7601174, dec: -66.72876145, mag: 3.63, ci: 0.16, },
		    '1401228': { id: '1401228', con: 'Dra', name: 'Thuban', ra: 14.073165, dec: 64.37585, mag: 3.67, ci: -0.049, },
		    '1023272': { id: '1023272', con: 'Car', name: '', ra: 9.75411481, dec: -62.50790124, mag: 3.69, ci: 1.01, },
		    '1213827': { id: '1213827', con: 'UMa', name: 'Taiyangshou', ra: 11.76750377, dec: 47.77940553, mag: 3.69, ci: 1.181, },
		    '1460530': { id: '1460530', con: 'Vir', name: '', ra: 14.77081222, dec: 1.89288176, mag: 3.73, ci: -0.005, },
		    '1033336': { id: '1033336', con: 'UMa', name: '', ra: 9.849867, dec: 59.038735, mag: 3.78, ci: 0.291, },
		    '1138507': { id: '1138507', con: 'Car', name: '', ra: 10.89157093, dec: -58.85317313, mag: 3.78, ci: 0.945, },
		    '1453270': { id: '1453270', con: 'Boo', name: '', ra: 14.6858151, dec: 13.7283469, mag: 3.78, ci: 0.044, },
		    '1138221': { id: '1138221', con: 'LMi', name: 'Praecipua', ra: 10.88852877, dec: 34.21487888, mag: 3.79, ci: 1.04, },
		    '1097020': { id: '1097020', con: 'Car', name: '', ra: 10.46464768, dec: -58.73940351, mag: 3.81, ci: 0.317, },
		    '1193840': { id: '1193840', con: 'Dra', name: 'Giausar', ra: 11.52339442, dec: 69.33107562, mag: 3.82, ci: 1.613, },
		    '1093934': { id: '1093934', con: 'Hya', name: '', ra: 10.43484049, dec: -16.83628952, mag: 3.83, ci: 1.456, },
		    '1392403': { id: '1392403', con: 'Cen', name: '', ra: 13.97118497, dec: -42.10075401, mag: 3.83, ci: -0.224, },
		    '1462783': { id: '1462783', con: 'Aps', name: '', ra: 14.79769681, dec: -79.04475077, mag: 3.83, ci: 1.433, },
		    '1105158': { id: '1105158', con: 'Leo', name: '', ra: 10.5468532, dec: 9.306586, mag: 3.84, ci: -0.148, },
		    '1112579': { id: '1112579', con: 'Vel', name: '', ra: 10.621717, dec: -48.22562, mag: 3.84, ci: 0.3, },
		    '1277088': { id: '1277088', con: 'Mus', name: '', ra: 12.54111548, dec: -72.13298676, mag: 3.84, ci: -0.157, },
		    '1074425': { id: '1074425', con: 'Vel', name: '', ra: 10.24559863, dec: -42.12193872, mag: 3.85, ci: 0.051, },
		    '1278400': { id: '1278400', con: 'Dra', name: '', ra: 12.558058, dec: 69.788238, mag: 3.85, ci: -0.116, },
		    '1283764': { id: '1283764', con: 'Cen', name: '', ra: 12.62837907, dec: -48.54130499, mag: 3.85, ci: 0.049, },
		    '1392970': { id: '1392970', con: 'Cen', name: '', ra: 13.97798559, dec: -44.80358591, mag: 3.87, ci: -0.208, },
		    '1456034': { id: '1456034', con: 'Vir', name: '', ra: 14.717673, dec: -5.658207, mag: 3.87, ci: 0.385, },
		    '1036347': { id: '1036347', con: 'Leo', name: 'Rasalas', ra: 9.8793937, dec: 26.00695148, mag: 3.88, ci: 1.222, },
		    '1496623': { id: '1496623', con: 'Lup', name: '', ra: 15.19890935, dec: -48.73782139, mag: 3.88, ci: -0.029, },
		    '1260755': { id: '1260755', con: 'Vir', name: 'Zaniah', ra: 12.33176502, dec: -0.66679342, mag: 3.89, ci: 0.026, },
		    '1013912': { id: '1013912', con: 'Hya', name: 'Ukdah', ra: 9.66426713, dec: -1.14280908, mag: 3.9, ci: 1.313, },
		    '1179448': { id: '1179448', con: 'Cen', name: '', ra: 11.35011378, dec: -54.49103279, mag: 3.9, ci: -0.157, },
		    '1353568': { id: '1353568', con: 'Cen', name: '', ra: 13.51740485, dec: -39.40730757, mag: 3.9, ci: 1.186, },
		    '1271521': { id: '1271521', con: 'Cen', name: '', ra: 12.46732827, dec: -50.23063622, mag: 3.91, ci: -0.192, },
		    '1486876': { id: '1486876', con: 'Lup', name: '', ra: 15.08532189, dec: -47.05118067, mag: 3.91, ci: -0.144, },
		    '1161865': { id: '1161865', con: 'Car', name: '', ra: 11.143164, dec: -58.97503773, mag: 3.93, ci: 1.225, },
		    '1249547': { id: '1249547', con: 'Cen', name: '', ra: 12.19419852, dec: -52.36845068, mag: 3.97, ci: -0.156, },
		    '1091048': { id: '1091048', con: 'Car', name: '', ra: 10.40658529, dec: -74.03161376, mag: 3.99, ci: 0.369, },
		    '1345331': { id: '1345331', con: 'UMa', name: 'Alcor', ra: 13.42042677, dec: 54.98795585, mag: 3.99, ci: 0.169, },
		    '1183425': { id: '1183425', con: 'Leo', name: '', ra: 11.39873915, dec: 10.52953361, mag: 4, ci: 0.423, },
		    '1454462': { id: '1454462', con: 'Cen', name: '', ra: 14.69933095, dec: -37.79349398, mag: 4.01, ci: -0.157, },
		    '1245131': { id: '1245131', con: 'Crv', name: 'Alchiba', ra: 12.140225, dec: -24.728875, mag: 4.02, ci: 0.334, },
		    '1305489': { id: '1305489', con: 'Cru', name: '', ra: 12.90989599, dec: -57.17791894, mag: 4.03, ci: -0.18, },
		    '1213527': { id: '1213527', con: 'Vir', name: '', ra: 11.76432288, dec: 6.52938127, mag: 4.04, ci: 1.501, },
		    '1430621': { id: '1430621', con: 'Boo', name: '', ra: 14.41994331, dec: 51.85074211, mag: 4.04, ci: 0.497, },
		    '1179611': { id: '1179611', con: 'Leo', name: '', ra: 11.35227596, dec: 6.02932234, mag: 4.05, ci: -0.058, },
		    '1379743': { id: '1379743', con: 'Boo', name: '', ra: 13.82462248, dec: 15.79791084, mag: 4.05, ci: 1.52, },
		    '1424191': { id: '1424191', con: 'Cen', name: '', ra: 14.34261985, dec: -37.88529327, mag: 4.05, ci: -0.03, },
		    '1448609': { id: '1448609', con: 'Lup', name: '', ra: 14.63145188, dec: -49.4258314, mag: 4.05, ci: -0.152, },
		    '1184791': { id: '1184791', con: 'Crt', name: '', ra: 11.414702, dec: -17.68401, mag: 4.06, ci: 0.216, },
		    '1257605': { id: '1257605', con: 'Mus', name: '', ra: 12.29285504, dec: -67.96073518, mag: 4.06, ci: 1.603, },
		    '1258755': { id: '1258755', con: 'Cru', name: '', ra: 12.30728999, dec: -64.00307083, mag: 4.06, ci: -0.168, },
		    '1456872': { id: '1456872', con: 'Cen', name: '', ra: 14.72762224, dec: -35.1736592, mag: 4.06, ci: 1.356, },
		    '1417791': { id: '1417791', con: 'Vir', name: 'Syrma', ra: 14.266908, dec: -6.000547, mag: 4.07, ci: 0.511, },
		    '1492242': { id: '1492242', con: 'Lup', name: '', ra: 15.14739442, dec: -45.27984571, mag: 4.07, ci: -0.162, },
		    '1004592': { id: '1004592', con: 'Car', name: '', ra: 9.57406953, dec: -59.22975471, mag: 4.08, ci: -0.013, },
		    '1148268': { id: '1148268', con: 'Crt', name: 'Alkes', ra: 10.99624027, dec: -18.29878471, mag: 4.08, ci: 1.079, },
		    '1034133': { id: '1034133', con: 'Hya', name: 'Zhang', ra: 9.85797034, dec: -14.84661184, mag: 4.11, ci: 0.918, },
		    '1109637': { id: '1109637', con: 'Cha', name: '', ra: 10.59114096, dec: -78.60778663, mag: 4.11, ci: 1.58, },
		    '1214488': { id: '1214488', con: 'Cen', name: '', ra: 11.77522861, dec: -61.17839713, mag: 4.11, ci: 0.895, },
		    '1240894': { id: '1240894', con: 'Vir', name: '', ra: 12.08681664, dec: 8.73297201, mag: 4.12, ci: 0.967, },
		    '1243147': { id: '1243147', con: 'Cru', name: '', ra: 12.1146944, dec: -64.61373057, mag: 4.14, ci: 0.353, },
		    '1413399': { id: '1413399', con: 'Vir', name: 'Kang', ra: 14.21492928, dec: -10.2737004, mag: 4.18, ci: 1.323, },
		    '1418295': { id: '1418295', con: 'Boo', name: 'Xuange', ra: 14.27306086, dec: 46.08830597, mag: 4.18, ci: 0.087, },
		    '1379697': { id: '1379697', con: 'Cen', name: '', ra: 13.82408892, dec: -34.45077493, mag: 4.19, ci: 1.52, },
		    '1097027': { id: '1097027', con: 'LMi', name: '', ra: 10.46472353, dec: 36.70722132, mag: 4.2, ci: 0.908, },
		    '1327572': { id: '1327572', con: 'Com', name: '', ra: 13.19788732, dec: 27.87818125, mag: 4.23, ci: 0.572, },
		    '1374446': { id: '1374446', con: 'Cen', name: '', ra: 13.76145711, dec: -33.04372296, mag: 4.23, ci: 0.39, },
		    '1397226': { id: '1397226', con: 'Vir', name: '', ra: 14.02744238, dec: 1.54453325, mag: 4.23, ci: 0.121, },
		    '1258630': { id: '1258630', con: 'Cha', name: '', ra: 12.30578466, dec: -79.31223842, mag: 4.24, ci: -0.123, },
		    '1278740': { id: '1278740', con: 'CVn', name: 'Chara', ra: 12.56237349, dec: 41.35747839, mag: 4.24, ci: 0.588, },
		    '1304032': { id: '1304032', con: 'Cen', name: '', ra: 12.89061048, dec: -40.17886835, mag: 4.25, ci: 0.224, },
		    '1433845': { id: '1433845', con: 'UMi', name: '', ra: 14.45876156, dec: 75.69599492, mag: 4.25, ci: 1.431, },
		    '1321276': { id: '1321276', con: 'Cen', name: '', ra: 13.11517761, dec: -49.90624735, mag: 4.27, ci: -0.182, },
		    '1009234': { id: '1009234', con: 'Dra', name: '', ra: 9.61813623, dec: 81.32638272, mag: 4.28, ci: 1.488, },
		    '1095760': { id: '1095760', con: 'Ant', name: '', ra: 10.45252809, dec: -31.06777987, mag: 4.28, ci: 1.429, },
		    '1116039': { id: '1116039', con: 'Vel', name: '', ra: 10.65510926, dec: -55.60326723, mag: 4.29, ci: 1.025, },
		    '1223422': { id: '1223422', con: 'Hya', name: '', ra: 11.88181315, dec: -33.90809452, mag: 4.29, ci: -0.1, },
		    '1141828': { id: '1141828', con: 'Leo', name: '', ra: 10.92688927, dec: 24.74972237, mag: 4.3, ci: 0.016, },
		    '1201410': { id: '1201410', con: 'Leo', name: '', ra: 11.61581416, dec: -0.82374681, mag: 4.3, ci: 0.983, },
		    '1218875': { id: '1218875', con: 'Cen', name: '', ra: 11.828077, dec: -63.788478, mag: 4.3, ci: -0.149, },
		    '1276555': { id: '1276555', con: 'Crv', name: '', ra: 12.53450741, dec: -16.19600226, mag: 4.3, ci: 0.388, },
		    '1423851': { id: '1423851', con: 'Cen', name: '', ra: 14.33876186, dec: -56.38649515, mag: 4.3, ci: 0.082, },
		    '1432986': { id: '1432986', con: 'Oct', name: '', ra: 14.44867558, dec: -83.66788522, mag: 4.31, ci: 1.3, },
		    '1237882': { id: '1237882', con: 'Cru', name: '', ra: 12.0504171, dec: -63.31293112, mag: 4.32, ci: 0.28, },
		    '1325157': { id: '1325157', con: 'Com', name: 'Diadem', ra: 13.16646858, dec: 17.52944436, mag: 4.32, ci: 0.455, },
		    '1383129': { id: '1383129', con: 'Cen', name: '', ra: 13.86377171, dec: -32.99406889, mag: 4.32, ci: -0.146, },
		    '1468068': { id: '1468068', con: 'Lup', name: '', ra: 14.86063932, dec: -43.57535769, mag: 4.32, ci: -0.154, },
		    '1175645': { id: '1175645', con: 'UMa', name: 'Alula Australis', ra: 11.30303213, dec: 31.52919433, mag: 4.33, ci: 0.59, },
		    '1303621': { id: '1303621', con: 'Cen', name: '', ra: 12.88525162, dec: -48.94331067, mag: 4.33, ci: 1.344, },
		    '1431987': { id: '1431987', con: 'Lup', name: '', ra: 14.43633667, dec: -45.37926984, mag: 4.33, ci: 0.434, },
		    '1008806': { id: '1008806', con: 'Vel', name: '', ra: 9.61376084, dec: -49.35503644, mag: 4.34, ci: 0.173, },
		    '1397335': { id: '1397335', con: 'Cen', name: '', ra: 14.02875051, dec: -45.60341726, mag: 4.34, ci: 0.598, },
		    '1270119': { id: '1270119', con: 'Com', name: '', ra: 12.44896482, dec: 28.26842484, mag: 4.35, ci: 1.128, },
		    '1403579': { id: '1403579', con: 'Cen', name: '', ra: 14.10076868, dec: -41.17963189, mag: 4.36, ci: -0.198, },
		    '1148873': { id: '1148873', con: 'Vel', name: '', ra: 11.00257357, dec: -42.22585363, mag: 4.37, ci: 0.116, },
		    '1325111': { id: '1325111', con: 'Vir', name: '', ra: 13.165831, dec: -5.53901, mag: 4.38, ci: -0.008, },
		    '1062698': { id: '1062698', con: 'Leo', name: '', ra: 10.13174183, dec: 9.99750678, mag: 4.39, ci: 1.448, },
		    '1483603': { id: '1483603', con: 'Vir', name: '', ra: 15.04834408, dec: 2.09130414, mag: 4.39, ci: 1.026, },
		    '1427523': { id: '1427523', con: 'Cen', name: '', ra: 14.38395552, dec: -39.51181573, mag: 4.41, ci: -0.185, },
		    '1152310': { id: '1152310', con: 'Leo', name: '', ra: 11.03882659, dec: 20.17984033, mag: 4.42, ci: 0.053, },
		    '1466184': { id: '1466184', con: 'Hya', name: '', ra: 14.838147, dec: -27.960371, mag: 4.42, ci: 1.366, },
		    '1441044': { id: '1441044', con: 'Lup', name: '', ra: 14.54362685, dec: -50.45716322, mag: 4.44, ci: -0.177, },
		    '1109837': { id: '1109837', con: 'Car', name: '', ra: 10.59313869, dec: -57.55763043, mag: 4.45, ci: 1.604, },
		    '1126382': { id: '1126382', con: 'Cha', name: '', ra: 10.76305658, dec: -80.5401905, mag: 4.45, ci: -0.188, },
		    '1173470': { id: '1173470', con: 'Leo', name: '', ra: 11.27769462, dec: -3.65160365, mag: 4.45, ci: 0.21, },
		    '1166393': { id: '1166393', con: 'Crt', name: '', ra: 11.194302, dec: -22.825847, mag: 4.46, ci: 0.025, },
		    '1244712': { id: '1244712', con: 'Cen', name: '', ra: 12.13478462, dec: -50.66127675, mag: 4.46, ci: -0.163, },
		    '1005266': { id: '1005266', con: 'UMa', name: '', ra: 9.5803986, dec: 52.05147831, mag: 4.47, ci: 0.027, },
		    '1220923': { id: '1220923', con: 'Cen', name: '', ra: 11.85241409, dec: -45.17347025, mag: 4.47, ci: 1.283, },
		    '1443997': { id: '1443997', con: 'Boo', name: '', ra: 14.57800471, dec: 29.74512688, mag: 4.47, ci: 0.364, },
		    '1475654': { id: '1475654', con: 'Lib', name: '', ra: 14.95305513, dec: -4.34645575, mag: 4.47, ci: 0.318, },
		    '1062760': { id: '1062760', con: 'Sex', name: '', ra: 10.13230187, dec: -0.37165259, mag: 4.48, ci: -0.032, },
		    '1061863': { id: '1061863', con: 'LMi', name: '', ra: 10.12382258, dec: 35.24469466, mag: 4.49, ci: 0.19, },
		    '1452665': { id: '1452665', con: 'Boo', name: '', ra: 14.67876884, dec: 16.41834243, mag: 4.49, ci: -0.002, },
		    '1085004': { id: '1085004', con: 'Vel', name: '', ra: 10.34855366, dec: -56.04321873, mag: 4.5, ci: -0.102, },
		    '1216567': { id: '1216567', con: 'Leo', name: '', ra: 11.79975998, dec: 20.21893252, mag: 4.5, ci: 0.547, },
		    '1376679': { id: '1376679', con: 'Boo', name: '', ra: 13.78770638, dec: 17.45689887, mag: 4.5, ci: 0.508, },
		    '1013016': { id: '1013016', con: 'Car', name: '', ra: 9.65583219, dec: -61.32806004, mag: 4.51, ci: -0.07, },
		    '1341852': { id: '1341852', con: 'Cen', name: '', ra: 13.37720504, dec: -60.98840339, mag: 4.52, ci: -0.141, },
		    '1343675': { id: '1343675', con: 'Cen', name: '', ra: 13.40013419, dec: -64.53566699, mag: 4.52, ci: 0.822, },
		    '1422216': { id: '1422216', con: 'Vir', name: 'Khambalia', ra: 14.31849778, dec: -13.37109165, mag: 4.52, ci: 0.128, },
		    '1485886': { id: '1485886', con: 'Boo', name: '', ra: 15.07409489, dec: 26.94764897, mag: 4.52, ci: 1.24, },
		    '1414220': { id: '1414220', con: 'Boo', name: '', ra: 14.22472418, dec: 51.78996582, mag: 4.53, ci: 0.233, },
		    '1000290': { id: '1000290', con: 'Hya', name: '', ra: 9.53303482, dec: -1.18466713, mag: 4.54, ci: 0.109, },
		    '1004194': { id: '1004194', con: 'LMi', name: '', ra: 9.57038374, dec: 36.39755932, mag: 4.54, ci: 0.914, },
		    '1004652': { id: '1004652', con: 'UMa', name: '', ra: 9.57468362, dec: 69.83034343, mag: 4.54, ci: 0.781, },
		    '1467720': { id: '1467720', con: 'Boo', name: '', ra: 14.856493, dec: 19.10046, mag: 4.54, ci: 0.72, },
		    '1497052': { id: '1497052', con: 'Lib', name: '', ra: 15.203692, dec: -19.79171, mag: 4.54, ci: -0.071, },
		    '1035228': { id: '1035228', con: 'UMa', name: '', ra: 9.86843369, dec: 54.06433787, mag: 4.55, ci: 0.038, },
		    '1171406': { id: '1171406', con: 'Leo', name: '', ra: 11.25339655, dec: 23.09551311, mag: 4.56, ci: 1.657, },
		    '1431931': { id: '1431931', con: 'Lup', name: '', ra: 14.43561716, dec: -45.22142437, mag: 4.56, ci: -0.147, },
		    '1034485': { id: '1034485', con: 'Vel', name: '', ra: 9.86129634, dec: -46.54761854, mag: 4.58, ci: 1.172, },
		    '1122866': { id: '1122866', con: 'Car', name: '', ra: 10.72563697, dec: -60.56661767, mag: 4.58, ci: 1.7, },
		    '1328137': { id: '1328137', con: 'Cen', name: '', ra: 13.20488555, dec: -59.9205756, mag: 4.58, ci: -0.073, },
		    '1382525': { id: '1382525', con: 'Dra', name: '', ra: 13.85720558, dec: 64.72327274, mag: 4.58, ci: 1.572, },
		    '1082782': { id: '1082782', con: 'Vel', name: '', ra: 10.3268752, dec: -55.02930088, mag: 4.59, ci: 1.6, },
		    '1167682': { id: '1167682', con: 'Car', name: '', ra: 11.21000383, dec: -60.31762926, mag: 4.59, ci: 0.541, },
		    '1057744': { id: '1057744', con: 'Hya', name: '', ra: 10.085408, dec: -13.06462501, mag: 4.6, ci: -0.087, },
		    '1143498': { id: '1143498', con: 'Ant', name: '', ra: 10.94529201, dec: -37.13776866, mag: 4.6, ci: 1.006, },
		    '1459175': { id: '1459175', con: 'Boo', name: '', ra: 14.75401691, dec: 16.96427649, mag: 4.6, ci: 0.972, },
		    '1156602': { id: '1156602', con: 'Leo', name: '', ra: 11.08361903, dec: 7.33600866, mag: 4.62, ci: 0.332, },
		    '1158877': { id: '1158877', con: 'Car', name: '', ra: 11.10900792, dec: -62.42411235, mag: 4.62, ci: 0.988, },
		    '1198443': { id: '1198443', con: 'Cen', name: '', ra: 11.57934902, dec: -54.26409128, mag: 4.62, ci: -0.077, },
		    '1294902': { id: '1294902', con: 'Cru', name: '', ra: 12.77297635, dec: -56.48880994, mag: 4.62, ci: -0.15, },
		    '1305561': { id: '1305561', con: 'Cru', name: '', ra: 12.91088413, dec: -59.14670296, mag: 4.62, ci: -0.153, },
		    '1286580': { id: '1286580', con: 'Cen', name: '', ra: 12.66459149, dec: -39.98730167, mag: 4.63, ci: -0.082, },
		    '1367403': { id: '1367403', con: 'UMa', name: '', ra: 13.67896466, dec: 54.68163243, mag: 4.63, ci: 1.63, },
		    '1476180': { id: '1476180', con: 'UMi', name: '', ra: 14.95972367, dec: 65.93246407, mag: 4.63, ci: 1.59, },
		    '1375813': { id: '1375813', con: 'Cen', name: '', ra: 13.77760542, dec: -51.43276374, mag: 4.64, ci: 0.955, },
		    '1096208': { id: '1096208', con: 'Car', name: '', ra: 10.45679715, dec: -57.63880666, mag: 4.65, ci: 0.474, },
		    '1234908': { id: '1234908', con: 'Vir', name: '', ra: 12.01455297, dec: 6.61433025, mag: 4.65, ci: 0.122, },
		    '1139281': { id: '1139281', con: 'UMa', name: '', ra: 10.89965019, dec: 43.18995877, mag: 4.66, ci: -0.039, },
		    '1285764': { id: '1285764', con: 'Vir', name: '', ra: 12.65410195, dec: -7.9955635, mag: 4.66, ci: 1.24, },
		    '1289980': { id: '1289980', con: 'Cen', name: '', ra: 12.70984765, dec: -48.81310586, mag: 4.66, ci: 1.075, },
		    '1011518': { id: '1011518', con: 'Hya', name: '', ra: 9.64091315, dec: 4.64929342, mag: 4.68, ci: 1.31, },
		    '1049252': { id: '1049252', con: 'Leo', name: '', ra: 10.00355725, dec: 8.04422465, mag: 4.68, ci: 1.589, },
		    '1115019': { id: '1115019', con: 'LMi', name: '', ra: 10.645337, dec: 31.97623934, mag: 4.68, ci: 0.823, },
		    '1354877': { id: '1354877', con: 'Vir', name: '', ra: 13.53274582, dec: -6.25581602, mag: 4.68, ci: 1.606, },
		    '1358440': { id: '1358440', con: 'CVn', name: '', ra: 13.57423902, dec: 49.01597692, mag: 4.68, ci: 0.132, },
		    '1115087': { id: '1115087', con: 'Car', name: '', ra: 10.64583203, dec: -59.18299597, mag: 4.69, ci: 1.562, },
		    '1293985': { id: '1293985', con: 'Cru', name: '', ra: 12.76056985, dec: -60.98131765, mag: 4.69, ci: 1.049, },
		    '1201035': { id: '1201035', con: 'Crt', name: '', ra: 11.61136465, dec: -9.8022421, mag: 4.7, ci: -0.073, },
		    '1205779': { id: '1205779', con: 'Hya', name: '', ra: 11.67021934, dec: -34.74466153, mag: 4.7, ci: -0.07, },
		    '1212047': { id: '1212047', con: 'Crt', name: '', ra: 11.74604932, dec: -18.35068448, mag: 4.71, ci: 0.958, },
		    '1320436': { id: '1320436', con: 'Cen', name: '', ra: 13.10463962, dec: -48.46329751, mag: 4.71, ci: -0.148, },
		    '1391528': { id: '1391528', con: 'Cen', name: '', ra: 13.96080106, dec: -63.68669457, mag: 4.71, ci: 1.075, },
		    '1093631': { id: '1093631', con: 'LMi', name: '', ra: 10.43189272, dec: 33.79612051, mag: 4.72, ci: 0.26, },
		    '1101179': { id: '1101179', con: 'Car', name: '', ra: 10.50559147, dec: -71.99279102, mag: 4.72, ci: 0.042, },
		    '1105870': { id: '1105870', con: 'UMa', name: '', ra: 10.55385806, dec: 40.42555611, mag: 4.72, ci: 0.222, },
		    '1239663': { id: '1239663', con: 'Cru', name: '', ra: 12.07200495, dec: -63.16571068, mag: 4.72, ci: -0.081, },
		    '1261818': { id: '1261818', con: 'Com', name: '', ra: 12.34528527, dec: 17.79287347, mag: 4.72, ci: 1.01, },
		    '1335048': { id: '1335048', con: 'CVn', name: '', ra: 13.29237235, dec: 40.57260979, mag: 4.72, ci: 0.306, },
		    '1151507': { id: '1151507', con: 'Leo', name: '', ra: 11.03046542, dec: -2.48458683, mag: 4.73, ci: 1.593, },
		    '1336207': { id: '1336207', con: 'Vir', name: '', ra: 13.306763, dec: -18.311196, mag: 4.74, ci: 0.709, },
		    '1409201': { id: '1409201', con: 'Cen', name: '', ra: 14.16522616, dec: -53.43894633, mag: 4.74, ci: 0.938, },
		    '1216910': { id: '1216910', con: 'Mus', name: '', ra: 11.80403754, dec: -66.81490926, mag: 4.75, ci: 1.522, },
		    '1385133': { id: '1385133', con: 'Cen', name: '', ra: 13.88681691, dec: -31.9276129, mag: 4.75, ci: -0.111, },
		    '1417997': { id: '1417997', con: 'Boo', name: '', ra: 14.26942474, dec: 51.36723206, mag: 4.75, ci: 0.236, },
		    '1016398': { id: '1016398', con: 'Hya', name: '', ra: 9.68805743, dec: -23.59151217, mag: 4.76, ci: -0.117, },
		    '1120717': { id: '1120717', con: 'Car', name: '', ra: 10.70392206, dec: -64.46642672, mag: 4.76, ci: -0.139, },
		    '1176942': { id: '1176942', con: 'UMa', name: '', ra: 11.318864, dec: 38.185557, mag: 4.76, ci: 0.113, },
		    '1266245': { id: '1266245', con: 'CVn', name: '', ra: 12.40041566, dec: 51.56225799, mag: 4.76, ci: 0.877, },
		    '1310921': { id: '1310921', con: 'Com', name: '', ra: 12.98206737, dec: 17.40944591, mag: 4.76, ci: 1.568, },
		    '1348425': { id: '1348425', con: 'Vir', name: '', ra: 13.45754558, dec: -15.97357817, mag: 4.76, ci: 1.096, },
		    '1383072': { id: '1383072', con: 'CVn', name: '', ra: 13.86318775, dec: 34.44424002, mag: 4.76, ci: 1.611, },
		    '1426939': { id: '1426939', con: 'Cen', name: '', ra: 14.3769658, dec: -58.45911009, mag: 4.76, ci: 0.795, },
		    '1192343': { id: '1192343', con: 'Leo', name: '', ra: 11.50524786, dec: -3.00349814, mag: 4.77, ci: 1.529, },
		    '1305175': { id: '1305175', con: 'Vir', name: '', ra: 12.90587808, dec: -9.53898928, mag: 4.77, ci: 1.59, },
		    '1021386': { id: '1021386', con: 'Ant', name: '', ra: 9.73669346, dec: -27.76947025, mag: 4.78, ci: 0.516, },
		    '1082970': { id: '1082970', con: 'Leo', name: '', ra: 10.32893578, dec: 19.47091207, mag: 4.78, ci: 0.452, },
		    '1264243': { id: '1264243', con: 'Com', name: '', ra: 12.37508676, dec: 25.8461567, mag: 4.78, ci: 0.515, },
		    '1335127': { id: '1335127', con: 'Vir', name: '', ra: 13.29341186, dec: 5.46987345, mag: 4.78, ci: 1.638, },
		    '1424395': { id: '1424395', con: 'Lup', name: '', ra: 14.34516127, dec: -45.18706343, mag: 4.78, ci: 0.31, },
		    '1427604': { id: '1427604', con: 'Hya', name: '', ra: 14.38493731, dec: -27.75401574, mag: 4.78, ci: 1.3, },
		    '1332080': { id: '1332080', con: 'Mus', name: '', ra: 13.25415038, dec: -67.89458602, mag: 4.79, ci: -0.078, },
		    '1269580': { id: '1269580', con: 'Cru', name: '', ra: 12.44191256, dec: -63.12223768, mag: 4.799, ci: -0.155, },
		    '1123801': { id: '1123801', con: 'Car', name: '', ra: 10.735258, dec: -63.961072, mag: 4.8, ci: -0.134, },
		    '1175646': { id: '1175646', con: 'UMa', name: '', ra: 11.30303213, dec: 31.52919433, mag: 4.8, ci: 0, },
		    '1280124': { id: '1280124', con: 'Com', name: '', ra: 12.58085525, dec: 22.62924164, mag: 4.8, ci: 0.012, },
		    '1321598': { id: '1321598', con: 'Com', name: '', ra: 13.11964732, dec: 27.62474074, mag: 4.8, ci: 1.482, },
		    '1407662': { id: '1407662', con: 'UMi', name: '', ra: 14.14748, dec: 77.54751495, mag: 4.8, ci: 1.368, },
		    '1420641': { id: '1420641', con: 'Boo', name: '', ra: 14.29994943, dec: 35.50950229, mag: 4.8, ci: 1.057, },
		    '1456525': { id: '1456525', con: 'Boo', name: '', ra: 14.72371186, dec: 26.52785236, mag: 4.8, ci: 1.672, },
		    '1482487': { id: '1482487', con: 'Boo', name: '', ra: 15.03514118, dec: 25.00814033, mag: 4.8, ci: 1.506, },
		    '1005689': { id: '1005689', con: 'Lyn', name: '', ra: 9.58439721, dec: 39.62149299, mag: 4.81, ci: 0.992, },
		    '1184398': { id: '1184398', con: 'Crt', name: '', ra: 11.4101642, dec: -10.85932411, mag: 4.81, ci: 1.556, },
		    '1434825': { id: '1434825', con: 'Vir', name: 'Elgafar', ra: 14.47003823, dec: -2.22795257, mag: 4.81, ci: 0.693, },
		    '1087496': { id: '1087496', con: 'Vel', name: '', ra: 10.3721068, dec: -41.64996002, mag: 4.82, ci: 1.095, },
		    '1101652': { id: '1101652', con: 'UMa', name: '', ra: 10.51043859, dec: 55.98053929, mag: 4.82, ci: 0.541, },
		    '1269597': { id: '1269597', con: 'Cen', name: '', ra: 12.44215539, dec: -51.4506369, mag: 4.82, ci: -0.141, },
		    '1362656': { id: '1362656', con: 'CVn', name: '', ra: 13.624345, dec: 36.294898, mag: 4.82, ci: 0.239, },
		    '1409884': { id: '1409884', con: 'Boo', name: '', ra: 14.17331467, dec: 25.09167937, mag: 4.82, ci: 0.541, },
		    '1316972': { id: '1316972', con: 'Cen', name: '', ra: 13.05925186, dec: -49.5272638, mag: 4.83, ci: 0.029, },
		    '1484850': { id: '1484850', con: 'Boo', name: '', ra: 15.06313911, dec: 47.65404245, mag: 4.83, ci: 0.647, },
		    '1497984': { id: '1497984', con: 'Lup', name: '', ra: 15.21377486, dec: -44.50041892, mag: 4.83, ci: -0.177, },
		    '1149513': { id: '1149513', con: 'Leo', name: '', ra: 11.00934657, dec: 3.61749809, mag: 4.84, ci: 1.144, },
		    '1212726': { id: '1212726', con: 'Vir', name: '', ra: 11.75473324, dec: 8.25812036, mag: 4.84, ci: 0.174, },
		    '1423095': { id: '1423095', con: 'Boo', name: '', ra: 14.3292318, dec: 16.30695159, mag: 4.84, ci: 1.228, },
		    '1064477': { id: '1064477', con: 'Vel', name: '', ra: 10.14895526, dec: -51.81126308, mag: 4.85, ci: -0.12, },
		    '1327828': { id: '1327828', con: 'Cen', name: '', ra: 13.20088475, dec: -37.80302414, mag: 4.85, ci: 0.693, },
		    '1108968': { id: '1108968', con: 'Dra', name: '', ra: 10.58485894, dec: 75.71295573, mag: 4.86, ci: 0.957, },
		    '1334616': { id: '1334616', con: 'Mus', name: '', ra: 13.2869477, dec: -66.78343773, mag: 4.86, ci: 1.48, },
		    '1428000': { id: '1428000', con: 'Boo', name: '', ra: 14.3896373, dec: 8.44664538, mag: 4.86, ci: 0.01, },
		    '1454005': { id: '1454005', con: 'Boo', name: '', ra: 14.69409737, dec: 8.16176273, mag: 4.86, ci: 0.992, },
		    '1038833': { id: '1038833', con: 'Hya', name: '', ra: 9.90342213, dec: -25.93234583, mag: 4.87, ci: 1.199, },
		    '1112461': { id: '1112461', con: 'Hya', name: '', ra: 10.62047922, dec: -27.41263773, mag: 4.87, ci: 1.626, },
		    '1127992': { id: '1127992', con: 'Car', name: '', ra: 10.780898, dec: -64.383474, mag: 4.87, ci: -0.149, },
		    '1233061': { id: '1233061', con: 'Cha', name: '', ra: 11.99376712, dec: -78.22185407, mag: 4.88, ci: -0.054, },
		    '1289086': { id: '1289086', con: 'Vir', name: '', ra: 12.69807109, dec: 10.23562633, mag: 4.88, ci: 0.076, },
		    '1312672': { id: '1312672', con: 'Com', name: '', ra: 13.00457527, dec: 30.78501699, mag: 4.88, ci: 1.165, },
		    '1102819': { id: '1102819', con: 'Vel', name: '', ra: 10.52272817, dec: -53.7154822, mag: 4.89, ci: 0.5, },
		    '1112994': { id: '1112994', con: 'Hya', name: '', ra: 10.62590894, dec: -13.38454335, mag: 4.89, ci: 2.8, },
		    '1214497': { id: '1214497', con: 'Cen', name: '', ra: 11.77529807, dec: -40.50035427, mag: 4.89, ci: 0.664, },
		    '1221942': { id: '1221942', con: 'Mus', name: '', ra: 11.86423297, dec: -65.20591736, mag: 4.89, ci: -0.123, },
		    '1303859': { id: '1303859', con: 'Com', name: '', ra: 12.88826154, dec: 21.24490755, mag: 4.89, ci: 0.904, },
		    '1420978': { id: '1420978', con: 'Aps', name: '', ra: 14.30385923, dec: -81.00776096, mag: 4.89, ci: 0.243, },
		    '1300463': { id: '1300463', con: 'Cen', name: '', ra: 12.84476848, dec: -33.99930731, mag: 4.9, ci: -0.031, },
		    '1330787': { id: '1330787', con: 'Cen', name: '', ra: 13.237578, dec: -59.103235, mag: 4.9, ci: 0.489, },
		    '1114800': { id: '1114800', con: 'Hya', name: '', ra: 10.64304182, dec: -16.87656933, mag: 4.91, ci: 0.922, },
		    '1289155': { id: '1289155', con: 'Cru', name: '', ra: 12.69904675, dec: -59.6858208, mag: 4.91, ci: -0.044, },
		    '1358895': { id: '1358895', con: 'CVn', name: '', ra: 13.57994679, dec: 37.18241443, mag: 4.91, ci: 0.404, },
		    '1480885': { id: '1480885', con: 'Lib', name: '', ra: 15.01620811, dec: -8.51894413, mag: 4.91, ci: 0, },
		    '1157124': { id: '1157124', con: 'Hya', name: '', ra: 11.08886309, dec: -27.29361407, mag: 4.92, ci: 0.369, },
		    '1269440': { id: '1269440', con: 'Com', name: '', ra: 12.44001802, dec: 27.26823928, mag: 4.92, ci: 0.277, },
		    '1357980': { id: '1357980', con: 'Vir', name: '', ra: 13.56886995, dec: 3.65896576, mag: 4.92, ci: 0.029, },
		    '1380096': { id: '1380096', con: 'Boo', name: '', ra: 13.8285654, dec: 21.26410755, mag: 4.92, ci: 1.432, },
		    '1458787': { id: '1458787', con: 'Cen', name: '', ra: 14.74977841, dec: -35.19182826, mag: 4.92, ci: 0.013, },
		    '1018060': { id: '1018060', con: 'Hya', name: '', ra: 9.70400446, dec: -23.91556854, mag: 4.93, ci: 0.534, },
		    '1195066': { id: '1195066', con: 'Hya', name: '', ra: 11.5378893, dec: -29.26101934, mag: 4.93, ci: 0.54, },
		    '1206707': { id: '1206707', con: 'Cen', name: '', ra: 11.681565, dec: -62.09010277, mag: 4.93, ci: 1.111, },
		    '1256015': { id: '1256015', con: 'Com', name: '', ra: 12.27237175, dec: 23.94541234, mag: 4.93, ci: 0.957, },
		    '1301794': { id: '1301794', con: 'Com', name: '', ra: 12.86164488, dec: 27.54071548, mag: 4.93, ci: 0.681, },
		    '1313286': { id: '1313286', con: 'UMa', name: '', ra: 13.012125, dec: 56.366338, mag: 4.93, ci: 0.368, },
		    '1410544': { id: '1410544', con: 'Vir', name: '', ra: 14.18069048, dec: -16.30203102, mag: 4.93, ci: 1.684, },
		    '1467213': { id: '1467213', con: 'Lib', name: '', ra: 14.85029803, dec: -2.2991505, mag: 4.93, ci: 0.988, },
		    '1490009': { id: '1490009', con: 'Boo', name: '', ra: 15.12168512, dec: 24.86919657, mag: 4.93, ci: 0.429, },
		    '1039980': { id: '1039980', con: 'Hya', name: 'Felis', ra: 9.91450229, dec: -19.00935839, mag: 4.94, ci: 1.559, },
		    '1090591': { id: '1090591', con: 'UMa', name: '', ra: 10.40217942, dec: 65.56642121, mag: 4.94, ci: -0.052, },
		    '1102268': { id: '1102268', con: 'Car', name: '', ra: 10.51723847, dec: -73.2214912, mag: 4.94, ci: 1.677, },
		    '1323973': { id: '1323973', con: 'Hya', name: '', ra: 13.15090769, dec: -23.11806651, mag: 4.94, ci: 1.048, },
		    '1330050': { id: '1330050', con: 'CVn', name: '', ra: 13.22859481, dec: 40.15288514, mag: 4.94, ci: 1.061, },
		    '1189066': { id: '1189066', con: 'Leo', name: '', ra: 11.46562213, dec: 2.85626784, mag: 4.95, ci: 1, },
		    '1279966': { id: '1279966', con: 'Dra', name: '', ra: 12.57889177, dec: 70.02177076, mag: 4.95, ci: 1.312, },
		    '1380304': { id: '1380304', con: 'Vir', name: '', ra: 13.83118992, dec: -18.1341664, mag: 4.96, ci: 1.059, },
		    '1088638': { id: '1088638', con: 'Car', name: '', ra: 10.38281853, dec: -66.90149527, mag: 4.97, ci: -0.128, },
		    '1261312': { id: '1261312', con: 'Vir', name: '', ra: 12.33916127, dec: 3.31257122, mag: 4.97, ci: 1.172, },
		    '1349846': { id: '1349846', con: 'Vir', name: '', ra: 13.47383621, dec: 13.77878712, mag: 4.97, ci: 0.714, },
		    '1434789': { id: '1434789', con: 'Hya', name: '', ra: 14.469564, dec: -29.491638, mag: 4.97, ci: -0.074, },
		    '1149806': { id: '1149806', con: 'Leo', name: '', ra: 11.01244525, dec: 6.10144912, mag: 4.98, ci: 0.166, },
		    '1219249': { id: '1219249', con: 'Mus', name: '', ra: 11.8323924, dec: -70.22579164, mag: 4.98, ci: 1.36, },
		    '1270185': { id: '1270185', con: 'Com', name: '', ra: 12.44980449, dec: 26.82570069, mag: 4.98, ci: 0.088, },
		    '1000221': { id: '1000221', con: 'Leo', name: '', ra: 9.532427, dec: 11.29982727, mag: 4.99, ci: 1.046, },
		    '1181969': { id: '1181969', con: 'UMa', name: '', ra: 11.38044019, dec: 43.48270463, mag: 4.99, ci: 0.998, },
		    '1256223': { id: '1256223', con: 'Com', name: '', ra: 12.2750379, dec: 33.06152753, mag: 4.99, ci: 1.14, },
		    '1368810': { id: '1368810', con: 'Cen', name: '', ra: 13.6957675, dec: -54.55937774, mag: 4.99, ci: -0.055, },
		    '1412513': { id: '1412513', con: 'Vir', name: '', ra: 14.20439019, dec: 2.40943027, mag: 4.99, ci: -0.118, },
		    '1009450': { id: '1009450', con: 'Leo', name: '', ra: 9.62018688, dec: 6.83578162, mag: 5, ci: 1.051, },
		    '1182526': { id: '1182526', con: 'Cen', name: '', ra: 11.38685695, dec: -36.16477108, mag: 5, ci: 1.464, },
		    '1210288': { id: '1210288', con: 'Cen', name: '', ra: 11.72533103, dec: -62.48939602, mag: 5, ci: 0.784, },
		    '1004054': { id: '1004054', con: 'Vel', name: '', ra: 9.56910931, dec: -51.25526601, mag: 5.01, ci: -0.18, },
		    '1122084': { id: '1122084', con: 'UMa', name: '', ra: 10.71778814, dec: 69.07621341, mag: 5.01, ci: 1.406, },
		    '1204805': { id: '1204805', con: 'Mus', name: '', ra: 11.65821945, dec: -65.39776073, mag: 5.01, ci: 0.804, },
		    '1259500': { id: '1259500', con: 'Cen', name: '', ra: 12.31659834, dec: -55.14300541, mag: 5.01, ci: 1.6, },
		    '1268715': { id: '1268715', con: 'CVn', name: '', ra: 12.43081588, dec: 39.01861677, mag: 5.01, ci: 0.955, },
		    '1274104': { id: '1274104', con: 'Dra', name: '', ra: 12.50185078, dec: 69.20112924, mag: 5.01, ci: 1.621, },
		    '1002392': { id: '1002392', con: 'Hya', name: '', ra: 9.55346113, dec: -21.11572169, mag: 5.02, ci: 1.023, },
		    '1105385': { id: '1105385', con: 'Vel', name: '', ra: 10.54912881, dec: -47.00335326, mag: 5.02, ci: 1.045, },
		    '1142032': { id: '1142032', con: 'UMa', name: '', ra: 10.92899562, dec: 33.5069282, mag: 5.02, ci: 1.101, },
		    '1390033': { id: '1390033', con: 'Boo', name: '', ra: 13.94282803, dec: 27.4920812, mag: 5.02, ci: 1.441, },
		    '1469697': { id: '1469697', con: 'Cen', name: '', ra: 14.8808539, dec: -37.80316481, mag: 5.02, ci: -0.155, },
		    '1147773': { id: '1147773', con: 'UMa', name: 'Chalawan', ra: 10.99110354, dec: 40.43026, mag: 5.03, ci: 0.624, },
		    '1280480': { id: '1280480', con: 'Com', name: '', ra: 12.58548875, dec: 18.3770576, mag: 5.03, ci: 1.152, },
		    '1368600': { id: '1368600', con: 'Vir', name: '', ra: 13.69354889, dec: -8.70298216, mag: 5.03, ci: 1.623, },
		    '1416305': { id: '1416305', con: 'Cen', name: '', ra: 14.24920491, dec: -57.08612682, mag: 5.03, ci: -0.074, },
		    '1240266': { id: '1240266', con: 'Cha', name: '', ra: 12.07957538, dec: -76.51906023, mag: 5.04, ci: 1.491, },
		    '1327835': { id: '1327835', con: 'Vir', name: '', ra: 13.20098392, dec: -16.19860137, mag: 5.04, ci: 0.46, },
		    '1345168': { id: '1345168', con: 'Mus', name: '', ra: 13.41864416, dec: -74.88781707, mag: 5.04, ci: 1.11, },
		    '1351286': { id: '1351286', con: 'Cen', name: '', ra: 13.49034838, dec: -51.16513641, mag: 5.04, ci: 0.059, },
		    '1059614': { id: '1059614', con: 'Vel', name: '', ra: 10.10311669, dec: -47.36996955, mag: 5.06, ci: 0.88, },
		    '1149956': { id: '1149956', con: 'UMa', name: '', ra: 11.01400648, dec: 39.21208797, mag: 5.06, ci: 0.255, },
		    '1426615': { id: '1426615', con: 'Aps', name: '', ra: 14.37310246, dec: -80.1089414, mag: 5.06, ci: -0.108, },
		    '1000246': { id: '1000246', con: 'Leo', name: '', ra: 9.53266029, dec: 9.71576409, mag: 5.07, ci: 1.364, },
		    '1003587': { id: '1003587', con: 'Cha', name: '', ra: 9.56482612, dec: -80.9412587, mag: 5.07, ci: -0.139, },
		    '1014668': { id: '1014668', con: 'Hya', name: '', ra: 9.67176755, dec: -14.33229143, mag: 5.07, ci: -0.149, },
		    '1035935': { id: '1035935', con: 'Sex', name: '', ra: 9.87512522, dec: -8.10499898, mag: 5.07, ci: 0.038, },
		    '1108440': { id: '1108440', con: 'Leo', name: '', ra: 10.58000387, dec: 6.9537457, mag: 5.07, ci: 0.921, },
		    '1194370': { id: '1194370', con: 'Cen', name: '', ra: 11.529463, dec: -59.44205936, mag: 5.07, ci: 1.026, },
		    '1413210': { id: '1413210', con: 'Hya', name: '', ra: 14.21278449, dec: -27.26118424, mag: 5.07, ci: 1.13, },
		    '1029091': { id: '1029091', con: 'UMa', name: '', ra: 9.80982547, dec: 46.0210054, mag: 5.08, ci: 0.619, },
		    '1101100': { id: '1101100', con: 'Sex', name: '', ra: 10.5048558, dec: -0.63703152, mag: 5.08, ci: -0.138, },
		    '1107166': { id: '1107166', con: 'Hya', name: '', ra: 10.56691237, dec: -23.74516511, mag: 5.08, ci: 1.596, },
		    '1111069': { id: '1111069', con: 'Car', name: '', ra: 10.60569958, dec: -59.56439388, mag: 5.08, ci: 1.172, },
		    '1122680': { id: '1122680', con: 'LMi', name: '', ra: 10.72359893, dec: 23.18840286, mag: 5.08, ci: 0.042, },
		    '1182727': { id: '1182727', con: 'Crt', name: '', ra: 11.38941089, dec: -18.77997839, mag: 5.08, ci: 0.439, },
		    '1305511': { id: '1305511', con: 'Cru', name: '', ra: 12.91024804, dec: -57.16868306, mag: 5.08, ci: -0.089, },
		    '1474997': { id: '1474997', con: 'Cir', name: '', ra: 14.9455523, dec: -62.78101019, mag: 5.08, ci: -0.023, },
		    '1025486': { id: '1025486', con: 'UMa', name: '', ra: 9.77546234, dec: 57.12807191, mag: 5.09, ci: 1.594, },
		    '1031506': { id: '1031506', con: 'Vel', name: '', ra: 9.83253846, dec: -45.73273585, mag: 5.09, ci: -0.098, },
		    '1182714': { id: '1182714', con: 'Mus', name: '', ra: 11.3892684, dec: -64.95464259, mag: 5.09, ci: -0.061, },
		    '1255522': { id: '1255522', con: 'Com', name: '', ra: 12.26671854, dec: 14.89906906, mag: 5.09, ci: 0.068, },
		    '1217621': { id: '1217621', con: 'Hya', name: '', ra: 11.81252298, dec: -26.74977661, mag: 5.1, ci: 1.594, },
		    '1334215': { id: '1334215', con: 'Cen', name: '', ra: 13.28142635, dec: -31.50619715, mag: 5.1, ci: 0.959, },
		    '1429161': { id: '1429161', con: 'Vir', name: '', ra: 14.40315123, dec: 5.82013268, mag: 5.1, ci: 0.124, },
		    '1044868': { id: '1044868', con: 'LMi', name: '', ra: 9.96140379, dec: 41.05563156, mag: 5.11, ci: 0.481, },
		    '1161834': { id: '1161834', con: 'Car', name: '', ra: 11.14277726, dec: -61.9471782, mag: 5.11, ci: 0.195, },
		    '1346600': { id: '1346600', con: 'Cen', name: '', ra: 13.43549415, dec: -39.75509201, mag: 5.11, ci: 1.181, },
		    '1003317': { id: '1003317', con: 'Vel', name: '', ra: 9.5623654, dec: -49.00518865, mag: 5.12, ci: -0.114, },
		    '1120269': { id: '1120269', con: 'UMa', name: '', ra: 10.69904104, dec: 65.71628508, mag: 5.12, ci: 1.207, },
		    '1138624': { id: '1138624', con: 'UMa', name: '', ra: 10.89290375, dec: 54.58512957, mag: 5.12, ci: 1.355, },
		    '1194438': { id: '1194438', con: 'Cen', name: '', ra: 11.53022214, dec: -59.51564911, mag: 5.12, ci: 0.432, },
		    '1281319': { id: '1281319', con: 'Cen', name: '', ra: 12.59598086, dec: -41.02194433, mag: 5.12, ci: 0.224, },
		    '1295237': { id: '1295237', con: 'Com', name: '', ra: 12.77743394, dec: 16.57768995, mag: 5.12, ci: 1.346, },
		    '1195925': { id: '1195925', con: 'Hya', name: '', ra: 11.5483697, dec: -31.08722282, mag: 5.13, ci: 1.581, },
		    '1406342': { id: '1406342', con: 'Boo', name: '', ra: 14.13215419, dec: 43.85445186, mag: 5.13, ci: 1.493, },
		    '1487176': { id: '1487176', con: 'Lup', name: '', ra: 15.08865734, dec: -41.06723543, mag: 5.13, ci: 1.011, },
		    '1128160': { id: '1128160', con: 'Vel', name: '', ra: 10.78263101, dec: -56.7571888, mag: 5.14, ci: -0.08, },
		    '1190009': { id: '1190009', con: 'Cen', name: '', ra: 11.47641021, dec: -42.67420441, mag: 5.14, ci: -0.028, },
		    '1201485': { id: '1201485', con: 'Cen', name: '', ra: 11.61681284, dec: -61.28344122, mag: 5.14, ci: 1.105, },
		    '1250294': { id: '1250294', con: 'Cam', name: '', ra: 12.20331772, dec: 77.61624402, mag: 5.14, ci: 0.358, },
		    '1262096': { id: '1262096', con: 'Crv', name: '', ra: 12.3488092, dec: -13.56572344, mag: 5.14, ci: 1.048, },
		    '1335992': { id: '1335992', con: 'CVn', name: '', ra: 13.30403065, dec: 49.68205999, mag: 5.14, ci: -0.049, },
		    '1422808': { id: '1422808', con: 'Vir', name: '', ra: 14.32568912, dec: -2.26552131, mag: 5.14, ci: 1.023, },
		    '1019283': { id: '1019283', con: 'UMa', name: '', ra: 9.71588529, dec: 72.25262039, mag: 5.15, ci: 1.029, },
		    '1072316': { id: '1072316', con: 'Car', name: '', ra: 10.2251758, dec: -66.37281028, mag: 5.15, ci: 0.217, },
		    '1159994': { id: '1159994', con: 'Cen', name: '', ra: 11.12130121, dec: -42.63868077, mag: 5.15, ci: 0.029, },
		    '1202969': { id: '1202969', con: 'Cen', name: '', ra: 11.63535887, dec: -61.82653113, mag: 5.15, ci: -0.04, },
		    '1238777': { id: '1238777', con: 'Cen', name: '', ra: 12.0609922, dec: -42.4340575, mag: 5.15, ci: 0.417, },
		    '1263750': { id: '1263750', con: 'Mus', name: '', ra: 12.36870747, dec: -67.5221065, mag: 5.15, ci: 0.195, },
		    '1322549': { id: '1322549', con: 'Vir', name: '', ra: 13.1316145, dec: -10.74040422, mag: 5.15, ci: 1.138, },
		    '1376206': { id: '1376206', con: 'Cen', name: '', ra: 13.78232028, dec: -36.25193049, mag: 5.15, ci: -0.007, },
		    '1460173': { id: '1460173', con: 'Hya', name: '', ra: 14.76668899, dec: -25.44317839, mag: 5.15, ci: 0.315, },
		    '1466774': { id: '1466774', con: 'Lib', name: '', ra: 14.844773, dec: -15.997237, mag: 5.15, ci: 0.401, },
		    '1109095': { id: '1109095', con: 'UMa', name: '', ra: 10.586017, dec: 57.082637, mag: 5.16, ci: 0.349, },
		    '1387308': { id: '1387308', con: 'Vir', name: '', ra: 13.91170751, dec: -1.50312263, mag: 5.16, ci: 1.093, },
		    '1486404': { id: '1486404', con: 'Cir', name: '', ra: 15.08005166, dec: -64.03134878, mag: 5.16, ci: 0.935, },
		    '1227891': { id: '1227891', con: 'Crt', name: '', ra: 11.93359842, dec: -17.15082944, mag: 5.17, ci: -0.022, },
		    '1244373': { id: '1244373', con: 'Mus', name: '', ra: 12.13052223, dec: -75.36702124, mag: 5.17, ci: 1.278, },
		    '1266647': { id: '1266647', con: 'Com', name: '', ra: 12.40514743, dec: 26.09858356, mag: 5.17, ci: 0.082, },
		    '1288341': { id: '1288341', con: 'Crv', name: '', ra: 12.68776424, dec: -13.01389683, mag: 5.17, ci: 0.432, },
		    '1308565': { id: '1308565', con: 'Cen', name: '', ra: 12.95120956, dec: -51.19875254, mag: 5.17, ci: -0.066, },
		    '1122878': { id: '1122878', con: 'UMa', name: '', ra: 10.72580263, dec: 46.2038717, mag: 5.18, ci: 0.324, },
		    '1174376': { id: '1174376', con: 'Leo', name: '', ra: 11.28816666, dec: 2.01055696, mag: 5.18, ci: 1.511, },
		    '1185956': { id: '1185956', con: 'Cen', name: '', ra: 11.42865184, dec: -63.97247626, mag: 5.18, ci: 0.495, },
		    '1412258': { id: '1412258', con: 'UMi', name: '', ra: 14.20111406, dec: 69.43254398, mag: 5.18, ci: 1.595, },
		    '1473430': { id: '1473430', con: 'Cir', name: '', ra: 14.9262668, dec: -60.11416394, mag: 5.18, ci: 1.161, },
		    '1099771': { id: '1099771', con: 'Sex', name: '', ra: 10.49130621, dec: -2.73907657, mag: 5.19, ci: -0.05, },
		    '1200155': { id: '1200155', con: 'Dra', name: '', ra: 11.60077612, dec: 69.32295609, mag: 5.19, ci: 0.974, },
		    '1334072': { id: '1334072', con: 'Vir', name: '', ra: 13.2795876, dec: 9.42415796, mag: 5.19, ci: 0.585, },
		    '1489031': { id: '1489031', con: 'Lib', name: '', ra: 15.11044332, dec: -16.25681541, mag: 5.19, ci: 1.589, },
		    '1207820': { id: '1207820', con: 'Hya', name: '', ra: 11.69554132, dec: -32.4994051, mag: 5.2, ci: 1.475, },
		    '1261601': { id: '1261601', con: 'Crv', name: '', ra: 12.34268, dec: -22.215901, mag: 5.2, ci: -0.09, },
		    '1319779': { id: '1319779', con: 'CVn', name: '', ra: 13.095678, dec: 35.798899, mag: 5.2, ci: -0.059, },
		    '1392754': { id: '1392754', con: 'Hya', name: '', ra: 13.975319, dec: -24.972249, mag: 5.2, ci: -0.086, },
		    '1185639': { id: '1185639', con: 'Cen', name: '', ra: 11.42484825, dec: -36.06306414, mag: 5.21, ci: 0.979, },
		    '1333002': { id: '1333002', con: 'Vir', name: '', ra: 13.26632562, dec: -19.94310164, mag: 5.21, ci: 1.011, },
		    '1356324': { id: '1356324', con: 'Vir', name: '', ra: 13.54946465, dec: -10.16500048, mag: 5.21, ci: 0.964, },
		    '1167888': { id: '1167888', con: 'Car', name: '', ra: 11.21255737, dec: -64.16976994, mag: 5.22, ci: -0.082, },
		    '1187172': { id: '1187172', con: 'Cen', name: '', ra: 11.44317188, dec: -61.11517037, mag: 5.22, ci: -0.077, },
		    '1236593': { id: '1236593', con: 'UMa', name: '', ra: 12.03522274, dec: 43.04564026, mag: 5.22, ci: 0.283, },
		    '1293968': { id: '1293968', con: 'Vir', name: '', ra: 12.76029392, dec: 7.67332584, mag: 5.22, ci: 0.322, },
		    '1423234': { id: '1423234', con: 'Cen', name: '', ra: 14.3309731, dec: -61.27297145, mag: 5.22, ci: 0.281, },
		    '1461635': { id: '1461635', con: 'Lup', name: '', ra: 14.78369298, dec: -52.38351631, mag: 5.22, ci: 0.984, },
		    '1046943': { id: '1046943', con: 'Ant', name: '', ra: 9.98118775, dec: -35.89097275, mag: 5.23, ci: 0.3, },
		    '1127424': { id: '1127424', con: 'Car', name: '', ra: 10.774889, dec: -64.263242, mag: 5.23, ci: -0.077, },
		    '1138503': { id: '1138503', con: 'Hya', name: '', ra: 10.89153673, dec: -20.13873046, mag: 5.23, ci: 0.48, },
		    '1306592': { id: '1306592', con: 'Dra', name: 'Taiyi', ra: 12.92459638, dec: 65.43847425, mag: 5.23, ci: 0.303, },
		    '1462615': { id: '1462615', con: 'Hya', name: '', ra: 14.7957796, dec: -26.0874994, mag: 5.23, ci: 0.938, },
		    '1203411': { id: '1203411', con: 'Vir', name: '', ra: 11.64100205, dec: 8.13429773, mag: 5.24, ci: 1.499, },
		    '1326938': { id: '1326938', con: 'Cen', name: '', ra: 13.18978239, dec: -43.36855809, mag: 5.24, ci: 1.049, },
		    '1488594': { id: '1488594', con: 'Boo', name: '', ra: 15.10464357, dec: 54.55631929, mag: 5.24, ci: 0.958, },
		    '1079416': { id: '1079416', con: 'Sex', name: '', ra: 10.29383399, dec: -8.06891415, mag: 5.25, ci: 0.336, },
		    '1102348': { id: '1102348', con: 'Cam', name: '', ra: 10.51795882, dec: 82.55859795, mag: 5.25, ci: 0.399, },
		    '1045796': { id: '1045796', con: 'Leo', name: '', ra: 9.97038223, dec: 12.44479925, mag: 5.26, ci: -0.035, },
		    '1064107': { id: '1064107', con: 'Car', name: '', ra: 10.14520779, dec: -65.81543305, mag: 5.26, ci: 0.973, },
		    '1136898': { id: '1136898', con: 'Car', name: '', ra: 10.875235, dec: -57.24040283, mag: 5.26, ci: 0.13, },
		    '1199988': { id: '1199988', con: 'Cen', name: '', ra: 11.59877361, dec: -47.64163733, mag: 5.26, ci: 0.257, },
		    '1206555': { id: '1206555', con: 'Leo', name: '', ra: 11.67974099, dec: 21.35272392, mag: 5.26, ci: 0.984, },
		    '1225989': { id: '1225989', con: 'Hya', name: '', ra: 11.91181659, dec: -25.71388759, mag: 5.26, ci: 0.883, },
		    '1383504': { id: '1383504', con: 'Cen', name: '', ra: 13.86801788, dec: -52.81153174, mag: 5.26, ci: -0.084, },
		    '1406861': { id: '1406861', con: 'Boo', name: '', ra: 14.1381396, dec: 49.4581709, mag: 5.26, ci: 1.637, },
		    '1041503': { id: '1041503', con: 'UMa', name: '', ra: 9.92861184, dec: 49.81984578, mag: 5.27, ci: 0.086, },
		    '1072104': { id: '1072104', con: 'Vel', name: '', ra: 10.22301214, dec: -51.23297322, mag: 5.27, ci: 0.257, },
		    '1098735': { id: '1098735', con: 'Car', name: '', ra: 10.4812709, dec: -64.17227846, mag: 5.27, ci: 1.856, },
		    '1215064': { id: '1215064', con: 'UMa', name: '', ra: 11.78211741, dec: 55.62819024, mag: 5.27, ci: 1.276, },
		    '1290312': { id: '1290312', con: 'Cru', name: '', ra: 12.71396299, dec: -63.05862211, mag: 5.27, ci: 0.195, },
		    '1347423': { id: '1347423', con: 'Vir', name: '', ra: 13.44532425, dec: -12.70766245, mag: 5.27, ci: 1.477, },
		    '1471733': { id: '1471733', con: 'Lib', name: '', ra: 14.9055918, dec: -24.64220598, mag: 5.27, ci: 1.336, },
		    '1011348': { id: '1011348', con: 'Lyn', name: '', ra: 9.63938199, dec: 40.23979341, mag: 5.28, ci: 0.223, },
		    '1213359': { id: '1213359', con: 'Cen', name: '', ra: 11.76221356, dec: -45.69013472, mag: 5.28, ci: -0.118, },
		    '1234885': { id: '1234885', con: 'Crv', name: '', ra: 12.0142109, dec: -19.6589841, mag: 5.28, ci: -0.192, },
		    '1260621': { id: '1260621', con: 'CVn', name: '', ra: 12.33019734, dec: 48.98414896, mag: 5.28, ci: 1.623, },
		    '1034845': { id: '1034845', con: 'Leo', name: '', ra: 9.86473106, dec: 24.39536395, mag: 5.29, ci: 0.229, },
		    '1272653': { id: '1272653', con: 'Com', name: '', ra: 12.48186181, dec: 25.91284986, mag: 5.29, ci: -0.056, },
		    '1416161': { id: '1416161', con: 'Boo', name: '', ra: 14.24745838, dec: 10.10060559, mag: 5.29, ci: 1.007, },
		    '1015377': { id: '1015377', con: 'Car', name: '', ra: 9.6784913, dec: -57.98355239, mag: 5.3, ci: 0.195, },
		    '1066487': { id: '1066487', con: 'Hya', name: '', ra: 10.16830167, dec: -12.81592239, mag: 5.3, ci: 0.368, },
		    '1190648': { id: '1190648', con: 'UMa', name: '', ra: 11.48447824, dec: 39.33697101, mag: 5.3, ci: 0.019, },
		    '1172314': { id: '1172314', con: 'Leo', name: '', ra: 11.26441495, dec: 13.30756743, mag: 5.31, ci: 1.189, },
		    '1206933': { id: '1206933', con: 'UMa', name: '', ra: 11.68417117, dec: 34.20163504, mag: 5.31, ci: 0.723, },
		    '1216453': { id: '1216453', con: 'Vir', name: '', ra: 11.7985831, dec: 8.24588835, mag: 5.31, ci: 0.038, },
		    '1252792': { id: '1252792', con: 'Cen', name: '', ra: 12.23408487, dec: -45.72390606, mag: 5.31, ci: 1.4, },
		    '1330694': { id: '1330694', con: 'Vir', name: '', ra: 13.23635987, dec: -19.93094761, mag: 5.31, ci: 0.862, },
		    '1131836': { id: '1131836', con: 'Leo', name: '', ra: 10.82095292, dec: 10.54520104, mag: 5.32, ci: 0.035, },
		    '1208873': { id: '1208873', con: 'Dra', name: '', ra: 11.70787853, dec: 66.7449041, mag: 5.32, ci: 1.267, },
		    '1265672': { id: '1265672', con: 'Cen', name: '', ra: 12.39317232, dec: -35.41267857, mag: 5.32, ci: -0.066, },
		    '1345342': { id: '1345342', con: 'Cen', name: '', ra: 13.42053527, dec: -64.48514651, mag: 5.32, ci: 0.411, },
		    '1464820': { id: '1464820', con: 'Lib', name: '', ra: 14.82195759, dec: -14.14895589, mag: 5.32, ci: 0.066, },
		    '1473643': { id: '1473643', con: 'Cen', name: '', ra: 14.9290856, dec: -33.85578491, mag: 5.32, ci: 0.046, },
		    '1127078': { id: '1127078', con: 'Car', name: '', ra: 10.77126477, dec: -64.5145634, mag: 5.33, ci: -0.096, },
		    '1334677': { id: '1334677', con: 'Vir', name: '', ra: 13.28767458, dec: 13.67575284, mag: 5.33, ci: 1.304, },
		    '1089472': { id: '1089472', con: 'Ant', name: '', ra: 10.39147083, dec: -38.00984075, mag: 5.34, ci: 0.251, },
		    '1240093': { id: '1240093', con: 'Mus', name: '', ra: 12.07746936, dec: -68.32892447, mag: 5.34, ci: -0.012, },
		    '1244917': { id: '1244917', con: 'Cen', name: '', ra: 12.13741954, dec: -48.69248683, mag: 5.34, ci: -0.01, },
		    '1307143': { id: '1307143', con: 'Cru', name: '', ra: 12.9325373, dec: -56.83580345, mag: 5.34, ci: 0.01, },
		    '1430038': { id: '1430038', con: 'Lib', name: '', ra: 14.41350734, dec: -24.80631279, mag: 5.34, ci: 0.962, },
		    '1000903': { id: '1000903', con: 'Vel', name: '', ra: 9.53869037, dec: -40.64933164, mag: 5.35, ci: 0.897, },
		    '1370671': { id: '1370671', con: 'Vir', name: '', ra: 13.71769776, dec: 3.53790026, mag: 5.35, ci: 1.091, },
		    '1020584': { id: '1020584', con: 'Leo', name: '', ra: 9.72886248, dec: 14.021692, mag: 5.36, ci: 1.61, },
		    '1121462': { id: '1121462', con: 'Car', name: '', ra: 10.71126805, dec: -59.21576017, mag: 5.36, ci: 0.213, },
		    '1126491': { id: '1126491', con: 'LMi', name: '', ra: 10.76441534, dec: 30.68231211, mag: 5.36, ci: -0.05, },
		    '1233544': { id: '1233544', con: 'Vir', name: '', ra: 11.99914241, dec: 3.65519708, mag: 5.36, ci: -0.001, },
		    '1342366': { id: '1342366', con: 'Vir', name: '', ra: 13.38364265, dec: -17.73527571, mag: 5.36, ci: 0.987, },
		    '1459242': { id: '1459242', con: 'Cir', name: '', ra: 14.75481515, dec: -62.87564935, mag: 5.36, ci: 0.308, },
		    '1050610': { id: '1050610', con: 'LMi', name: '', ra: 10.016849, dec: 31.92366903, mag: 5.37, ci: 0.676, },
		    '1167612': { id: '1167612', con: 'Cen', name: '', ra: 11.2091824, dec: -49.10099454, mag: 5.37, ci: 0.175, },
		    '1273899': { id: '1273899', con: 'UMa', name: '', ra: 12.49925838, dec: 58.40574408, mag: 5.37, ci: 0.205, },
		    '1312193': { id: '1312193', con: 'Dra', name: '', ra: 12.99863045, dec: 66.59727576, mag: 5.37, ci: 1.282, },
		    '1476564': { id: '1476564', con: 'Aps', name: '', ra: 14.96471778, dec: -76.66265445, mag: 5.37, ci: 1.442, },
		    '1264676': { id: '1264676', con: 'Cru', name: '', ra: 12.38039753, dec: -57.67613118, mag: 5.38, ci: -0.098, },
		    '1270820': { id: '1270820', con: 'Cru', name: '', ra: 12.45801663, dec: -58.99175507, mag: 5.38, ci: 1.543, },
		    '1298573': { id: '1298573', con: 'Cam', name: '', ra: 12.82046251, dec: 83.41290442, mag: 5.38, ci: 0.033, },
		    '1369198': { id: '1369198', con: 'Cen', name: '', ra: 13.70030262, dec: -58.78707588, mag: 5.38, ci: -0.029, },
		    '1437812': { id: '1437812', con: 'Lup', name: '', ra: 14.50581952, dec: -49.51902628, mag: 5.38, ci: 0.056, },
		    '1474401': { id: '1474401', con: 'Lup', name: '', ra: 14.93812575, dec: -52.8095511, mag: 5.38, ci: 0.142, },
		    '1183583': { id: '1183583', con: 'Leo', name: '', ra: 11.40064628, dec: 1.40776211, mag: 5.39, ci: 0.938, },
		    '1196924': { id: '1196924', con: 'Cen', name: '', ra: 11.56032479, dec: -40.58662264, mag: 5.39, ci: 0.117, },
		    '1447824': { id: '1447824', con: 'Lup', name: '', ra: 14.62226506, dec: -46.13342992, mag: 5.39, ci: 0.927, },
		    '1449974': { id: '1449974', con: 'Boo', name: '', ra: 14.64728496, dec: 44.40450064, mag: 5.39, ci: 0.03, },
		    '1006727': { id: '1006727', con: 'LMi', name: '', ra: 9.59430737, dec: 35.8101674, mag: 5.4, ci: 0.77, },
		    '1169320': { id: '1169320', con: 'Leo', name: '', ra: 11.22932006, dec: -0.06950134, mag: 5.4, ci: -0.02, },
		    '1349884': { id: '1349884', con: 'UMa', name: '', ra: 13.47419093, dec: 59.94578626, mag: 5.4, ci: -0.01, },
		    '1432374': { id: '1432374', con: 'Boo', name: '', ra: 14.44093463, dec: 19.22690148, mag: 5.4, ci: 0.231, },
		    '1283767': { id: '1283767', con: 'Hya', name: '', ra: 12.62841112, dec: -27.13888683, mag: 5.41, ci: 0.334, },
		    '1376911': { id: '1376911', con: 'Vir', name: '', ra: 13.79038665, dec: -17.85983971, mag: 5.41, ci: 1.623, },
		    '1422421': { id: '1422421', con: 'Boo', name: '', ra: 14.32118918, dec: 13.00429686, mag: 5.41, ci: 0.385, },
		    '1077773': { id: '1077773', con: 'Leo', name: '', ra: 10.27798288, dec: 13.72833029, mag: 5.42, ci: 1.65, },
		    '1215608': { id: '1215608', con: 'Cen', name: '', ra: 11.78865028, dec: -57.69649741, mag: 5.42, ci: 1.664, },
		    '1278627': { id: '1278627', con: 'CVn', name: '', ra: 12.56081122, dec: 33.2475848, mag: 5.42, ci: 1.011, },
		    '1293324': { id: '1293324', con: 'CVn', name: 'La Superba', ra: 12.75217471, dec: 45.44025077, mag: 5.42, ci: 2.994, },
		    '1435497': { id: '1435497', con: 'Vir', name: '', ra: 14.47825623, dec: -6.900543, mag: 5.42, ci: 1.49, },
		    '1025165': { id: '1025165', con: 'Cha', name: '', ra: 9.77239875, dec: -76.77611867, mag: 5.43, ci: 0.901, },
		    '1104168': { id: '1104168', con: 'Leo', name: '', ra: 10.53660404, dec: 14.13726791, mag: 5.43, ci: 1.696, },
		    '1156446': { id: '1156446', con: 'Ant', name: '', ra: 11.08172114, dec: -35.80467697, mag: 5.43, ci: 0.021, },
		    '1162066': { id: '1162066', con: 'Hya', name: '', ra: 11.14555527, dec: -28.08066766, mag: 5.43, ci: 0.069, },
		    '1296370': { id: '1296370', con: 'Dra', name: 'Tianyi', ra: 12.79287316, dec: 66.79030351, mag: 5.43, ci: 1.567, },
		    '1009449': { id: '1009449', con: 'Vel', name: '', ra: 9.62018193, dec: -53.66842114, mag: 5.44, ci: 0.137, },
		    '1128014': { id: '1128014', con: 'Hya', name: '', ra: 10.78112634, dec: -17.29688174, mag: 5.44, ci: 0.112, },
		    '1231127': { id: '1231127', con: 'Cru', name: '', ra: 11.97089581, dec: -56.31731219, mag: 5.44, ci: -0.062, },
		    '1322819': { id: '1322819', con: 'Mus', name: '', ra: 13.1353208, dec: -65.30597435, mag: 5.44, ci: -0.033, },
		    '1138871': { id: '1138871', con: 'Leo', name: '', ra: 10.89547587, dec: -2.12920913, mag: 5.45, ci: 0.966, },
		    '1248743': { id: '1248743', con: 'Crv', name: '', ra: 12.18440007, dec: -23.60242334, mag: 5.45, ci: 0.055, },
		    '1271939': { id: '1271939', con: 'Cen', name: '', ra: 12.47290731, dec: -39.04116998, mag: 5.45, ci: -0.073, },
		    '1305989': { id: '1305989', con: 'Oct', name: '', ra: 12.91630426, dec: -85.12338582, mag: 5.45, ci: 0.991, },
		    '1483713': { id: '1483713', con: 'Lup', name: '', ra: 15.04979912, dec: -32.64329244, mag: 5.45, ci: -0.127, },
		    '1495705': { id: '1495705', con: 'Lup', name: '', ra: 15.18777278, dec: -55.34603507, mag: 5.45, ci: 1.118, },
		    '1125630': { id: '1125630', con: 'Cha', name: '', ra: 10.75457071, dec: -80.46958566, mag: 5.46, ci: 0.957, },
		    '1195182': { id: '1195182', con: 'UMa', name: '', ra: 11.539097, dec: 61.08252, mag: 5.46, ci: 0.515, },
		    '1202279': { id: '1202279', con: 'Cen', name: '', ra: 11.62610887, dec: -47.74731498, mag: 5.46, ci: 1.23, },
		    '1291905': { id: '1291905', con: 'Hya', name: '', ra: 12.73348074, dec: -28.32395909, mag: 5.46, ci: 1.346, },
		    '1306404': { id: '1306404', con: 'Cen', name: '', ra: 12.92206392, dec: -42.91573121, mag: 5.46, ci: 1.668, },
		    '1365638': { id: '1365638', con: 'UMa', name: '', ra: 13.65845829, dec: 52.92120313, mag: 5.46, ci: 0.113, },
		    '1377201': { id: '1377201', con: 'Cen', name: '', ra: 13.79403935, dec: -50.32067992, mag: 5.46, ci: 1.351, },
		    '1404551': { id: '1404551', con: 'Vir', name: '', ra: 14.11189532, dec: -9.31351601, mag: 5.46, ci: 0.347, },
		    '1112821': { id: '1112821', con: 'Car', name: '', ra: 10.62418624, dec: -58.73333698, mag: 5.47, ci: 0.5, },
		    '1149015': { id: '1149015', con: 'UMa', name: '', ra: 11.00408462, dec: 45.52627463, mag: 5.47, ci: 1.466, },
		    '1259283': { id: '1259283', con: 'Dra', name: '', ra: 12.31388438, dec: 75.16055352, mag: 5.47, ci: 0.054, },
		    '1273291': { id: '1273291', con: 'Com', name: '', ra: 12.49084513, dec: 24.10892615, mag: 5.47, ci: 0.445, },
		    '1275202': { id: '1275202', con: 'Com', name: '', ra: 12.51682249, dec: 24.56716766, mag: 5.47, ci: 0.056, },
		    '1339171': { id: '1339171', con: 'Cen', name: '', ra: 13.34384023, dec: -52.74782513, mag: 5.47, ci: -0.125, },
		    '1398258': { id: '1398258', con: 'Hya', name: '', ra: 14.03966165, dec: -27.42977325, mag: 5.47, ci: 1.331, },
		    '1466492': { id: '1466492', con: 'Boo', name: '', ra: 14.84156841, dec: 37.27204901, mag: 5.47, ci: 1.03, },
		    '1203721': { id: '1203721', con: 'Crt', name: '', ra: 11.64444642, dec: -13.20197304, mag: 5.48, ci: 0.52, },
		    '1278775': { id: '1278775', con: 'Vir', name: '', ra: 12.56298592, dec: -9.45207689, mag: 5.48, ci: -0.035, },
		    '1467784': { id: '1467784', con: 'Dra', name: '', ra: 14.85734336, dec: 59.29398474, mag: 5.48, ci: 1.369, },
		    '1475049': { id: '1475049', con: 'Lib', name: '', ra: 14.94614204, dec: -11.40970119, mag: 5.48, ci: 1.491, },
		    '1077017': { id: '1077017', con: 'LMi', name: '', ra: 10.27067558, dec: 29.31050105, mag: 5.49, ci: 0.02, },
		    '1127309': { id: '1127309', con: 'Leo', name: '', ra: 10.77368814, dec: 14.19464688, mag: 5.49, ci: 0.908, },
		    '1276038': { id: '1276038', con: 'Cru', name: '', ra: 12.52786978, dec: -59.42392288, mag: 5.49, ci: 0.622, },
		    '1285581': { id: '1285581', con: 'Com', name: '', ra: 12.65203029, dec: 21.06255805, mag: 5.49, ci: 0.978, },
		    '1048655': { id: '1048655', con: 'UMa', name: '', ra: 9.99769051, dec: 56.81180806, mag: 5.5, ci: 1.487, },
		    '1109184': { id: '1109184', con: 'Ant', name: '', ra: 10.58690271, dec: -39.56259238, mag: 5.5, ci: 3.015, },
		    '1127287': { id: '1127287', con: 'Leo', name: '', ra: 10.77348507, dec: 18.89152513, mag: 5.5, ci: 1.134, },
		    '1198694': { id: '1198694', con: 'Cen', name: '', ra: 11.58245899, dec: -49.13650484, mag: 5.5, ci: 1.041, },
		    '1362265': { id: '1362265', con: 'UMi', name: '', ra: 13.61971868, dec: 71.2422535, mag: 5.5, ci: 1.219, },
		    '1374774': { id: '1374774', con: 'Vir', name: '', ra: 13.76564263, dec: -12.42652059, mag: 5.5, ci: 0.898, },
		    '1010754': { id: '1010754', con: 'Vel', name: '', ra: 9.63373734, dec: -43.19095103, mag: 5.51, ci: 0.985, },
		    '1117455': { id: '1117455', con: 'Car', name: '', ra: 10.66984468, dec: -65.10020917, mag: 5.51, ci: -0.158, },
		    '1122030': { id: '1122030', con: 'LMi', name: '', ra: 10.71718912, dec: 26.32555063, mag: 5.51, ci: 0.16, },
		    '1153807': { id: '1153807', con: 'Crt', name: '', ra: 11.05413358, dec: -11.30346505, mag: 5.51, ci: 0.938, },
		    '1245790': { id: '1245790', con: 'Cen', name: '', ra: 12.14849694, dec: -41.23160479, mag: 5.51, ci: -0.097, },
		    '1376291': { id: '1376291', con: 'CVn', name: '', ra: 13.78327072, dec: 38.54269659, mag: 5.51, ci: 1.036, },
		    '1437521': { id: '1437521', con: 'Lup', name: '', ra: 14.50239681, dec: -45.32135967, mag: 5.51, ci: -0.087, },
		    '1476141': { id: '1476141', con: 'Vir', name: '', ra: 14.95923645, dec: -0.16760718, mag: 5.51, ci: 1.131, },
		    '1080245': { id: '1080245', con: 'Ant', name: '', ra: 10.30210862, dec: -28.99200013, mag: 5.52, ci: 0.277, },
		    '1090611': { id: '1090611', con: 'LMi', name: '', ra: 10.40238971, dec: 33.71852994, mag: 5.52, ci: 1.186, },
		    '1100120': { id: '1100120', con: 'Cam', name: '', ra: 10.49484924, dec: 84.25200659, mag: 5.52, ci: 0.244, },
		    '1159428': { id: '1159428', con: 'Leo', name: '', ra: 11.11505662, dec: 1.95552473, mag: 5.52, ci: 0.955, },
		    '1261277': { id: '1261277', con: 'Com', name: '', ra: 12.33879882, dec: 26.61948037, mag: 5.52, ci: 1.091, },
		    '1356160': { id: '1356160', con: 'Vir', name: '', ra: 13.54767823, dec: -15.3630129, mag: 5.52, ci: 1.228, },
		    '1481395': { id: '1481395', con: 'Lib', name: '', ra: 15.02217389, dec: -2.7549283, mag: 5.52, ci: 1.692, },
		    '1483855': { id: '1483855', con: 'Boo', name: '', ra: 15.05168189, dec: 35.20579433, mag: 5.52, ci: 1.023, },
		    '1050143': { id: '1050143', con: 'Cha', name: '', ra: 10.01216377, dec: -82.21467218, mag: 5.53, ci: 0.035, },
		    '1227394': { id: '1227394', con: 'Leo', name: '', ra: 11.9279261, dec: 15.64681765, mag: 5.53, ci: 0.116, },
		    '1320563': { id: '1320563', con: 'Com', name: '', ra: 13.10627887, dec: 22.61618644, mag: 5.53, ci: 1.461, },
		    '1385644': { id: '1385644', con: 'Cen', name: '', ra: 13.89242486, dec: -35.66417573, mag: 5.53, ci: 0.444, },
		    '1413920': { id: '1413920', con: 'Cen', name: '', ra: 14.22122466, dec: -53.66567311, mag: 5.53, ci: 1.438, },
		    '1415043': { id: '1415043', con: 'Boo', name: '', ra: 14.23477211, dec: 12.9594461, mag: 5.53, ci: 0.537, },
		    '1416949': { id: '1416949', con: 'Vir', name: '', ra: 14.256691, dec: -18.20069, mag: 5.53, ci: 0.001, },
		    '1192580': { id: '1192580', con: 'Leo', name: '', ra: 11.50806387, dec: 18.40980076, mag: 5.54, ci: 1.056, },
		    '1207302': { id: '1207302', con: 'Cen', name: '', ra: 11.68883052, dec: -43.09566428, mag: 5.54, ci: 0.044, },
		    '1234711': { id: '1234711', con: 'Vir', name: '', ra: 12.012347, dec: -10.446014, mag: 5.54, ci: 0.76, },
		    '1261995': { id: '1261995', con: 'UMa', name: '', ra: 12.34746705, dec: 57.8641199, mag: 5.54, ci: 1.452, },
		    '1115683': { id: '1115683', con: 'UMa', name: '', ra: 10.65157104, dec: 53.66829936, mag: 5.55, ci: 1.27, },
		    '1183795': { id: '1183795', con: 'Mus', name: '', ra: 11.40309087, dec: -72.25660473, mag: 5.55, ci: 0.017, },
		    '1299232': { id: '1299232', con: 'Mus', name: '', ra: 12.82915796, dec: -71.98625324, mag: 5.55, ci: 1.154, },
		    '1372708': { id: '1372708', con: 'Vir', name: '', ra: 13.7416185, dec: -16.17907544, mag: 5.55, ci: 0.805, },
		    '1423626': { id: '1423626', con: 'Lup', name: '', ra: 14.33602929, dec: -43.0588456, mag: 5.55, ci: 0.907, },
		    '1446381': { id: '1446381', con: 'Lup', name: '', ra: 14.60528688, dec: -46.24545049, mag: 5.55, ci: 1.489, },
		    '1454109': { id: '1454109', con: 'Boo', name: '', ra: 14.69542261, dec: 11.660662, mag: 5.55, ci: 0.941, },
		    '1004776': { id: '1004776', con: 'Hya', name: '', ra: 9.57573547, dec: -5.91494886, mag: 5.56, ci: 1.159, },
		    '1020522': { id: '1020522', con: 'Vel', name: '', ra: 9.72839851, dec: -53.89128255, mag: 5.56, ci: -0.042, },
		    '1033230': { id: '1033230', con: 'Car', name: '', ra: 9.84877323, dec: -62.74511543, mag: 5.56, ci: 1.316, },
		    '1203248': { id: '1203248', con: 'UMa', name: '', ra: 11.63904726, dec: 43.62543102, mag: 5.56, ci: 0.348, },
		    '1222423': { id: '1222423', con: 'Cen', name: '', ra: 11.86952243, dec: -56.98774421, mag: 5.56, ci: 0.069, },
		    '1270022': { id: '1270022', con: 'Hya', name: '', ra: 12.44769141, dec: -32.83011809, mag: 5.56, ci: 0.007, },
		    '1367659': { id: '1367659', con: 'Oct', name: '', ra: 13.68207918, dec: -85.78604576, mag: 5.56, ci: 0.183, },
		    '1430481': { id: '1430481', con: 'Cir', name: '', ra: 14.41842366, dec: -68.19533276, mag: 5.56, ci: 0.435, },
		    '1008610': { id: '1008610', con: 'Leo', name: '', ra: 9.61190336, dec: 31.16174362, mag: 5.57, ci: 1.594, },
		    '1099970': { id: '1099970', con: 'Ant', name: '', ra: 10.49316033, dec: -30.60705552, mag: 5.57, ci: -0.041, },
		    '1106336': { id: '1106336', con: 'LMi', name: '', ra: 10.55858632, dec: 34.98869552, mag: 5.57, ci: 0.029, },
		    '1135118': { id: '1135118', con: 'UMa', name: '', ra: 10.8565896, dec: 59.32012323, mag: 5.57, ci: 1.16, },
		    '1289170': { id: '1289170', con: 'Vir', name: '', ra: 12.69919913, dec: 6.80661506, mag: 5.57, ci: 0.002, },
		    '1323338': { id: '1323338', con: 'Vir', name: '', ra: 13.14235195, dec: -8.98438295, mag: 5.57, ci: 1.178, },
		    '1365740': { id: '1365740', con: 'Boo', name: '', ra: 13.65961564, dec: 10.74626535, mag: 5.57, ci: 0.348, },
		    '1426548': { id: '1426548', con: 'Cen', name: '', ra: 14.37214422, dec: -34.78679199, mag: 5.57, ci: -0.088, },
		    '1025455': { id: '1025455', con: 'Vel', name: '', ra: 9.77510276, dec: -44.75505929, mag: 5.58, ci: -0.176, },
		    '1095150': { id: '1095150', con: 'Vel', name: '', ra: 10.44692299, dec: -54.8773044, mag: 5.58, ci: 1.556, },
		    '1099779': { id: '1099779', con: 'Hya', name: '', ra: 10.49138157, dec: -29.66383239, mag: 5.58, ci: 1.42, },
		    '1159324': { id: '1159324', con: 'Car', name: '', ra: 11.11385857, dec: -70.87792963, mag: 5.58, ci: -0.07, },
		    '1185787': { id: '1185787', con: 'Leo', name: '', ra: 11.42677026, dec: 16.45653973, mag: 5.58, ci: 0.39, },
		    '1226473': { id: '1226473', con: 'Vir', name: '', ra: 11.91753693, dec: 8.44394509, mag: 5.58, ci: 0.937, },
		    '1278527': { id: '1278527', con: 'Crv', name: '', ra: 12.55951646, dec: -12.83020357, mag: 5.58, ci: 0.861, },
		    '1317255': { id: '1317255', con: 'Vir', name: '', ra: 13.06280194, dec: -20.58342448, mag: 5.58, ci: 0.554, },
		    '1435403': { id: '1435403', con: 'Boo', name: '', ra: 14.47717048, dec: 49.84485145, mag: 5.58, ci: 0.864, },
		    '1061370': { id: '1061370', con: 'Hya', name: '', ra: 10.11930537, dec: -17.14173337, mag: 5.59, ci: 1.49, },
		    '1075814': { id: '1075814', con: 'Vel', name: '', ra: 10.25876802, dec: -43.11236788, mag: 5.59, ci: 1.52, },
		    '1102219': { id: '1102219', con: 'Hya', name: '', ra: 10.51662199, dec: -13.58847225, mag: 5.59, ci: -0.028, },
		    '1230305': { id: '1230305', con: 'Cru', name: '', ra: 11.96111348, dec: -62.44874789, mag: 5.59, ci: -0.152, },
		    '1231932': { id: '1231932', con: 'Cru', name: '', ra: 11.97990638, dec: -64.33955918, mag: 5.59, ci: 0.174, },
		    '1236006': { id: '1236006', con: 'UMa', name: '', ra: 12.02763026, dec: 36.04208124, mag: 5.59, ci: 1.019, },
		    '1320863': { id: '1320863', con: 'Cen', name: '', ra: 13.10974499, dec: -41.58844399, mag: 5.59, ci: 1.05, },
		    '1470229': { id: '1470229', con: 'Aps', name: '', ra: 14.8871031, dec: -73.19007534, mag: 5.59, ci: 0.82, },
		    '1487345': { id: '1487345', con: 'Boo', name: '', ra: 15.09050955, dec: 48.15097126, mag: 5.59, ci: -0.005, },
		    '1093331': { id: '1093331', con: 'Sex', name: '', ra: 10.4289641, dec: -7.05982539, mag: 5.6, ci: 1.528, },
		    '1250244': { id: '1250244', con: 'Com', name: '', ra: 12.20258042, dec: 20.54206307, mag: 5.6, ci: 0.961, },
		    '1338753': { id: '1338753', con: 'CVn', name: '', ra: 13.33859745, dec: 40.15054852, mag: 5.6, ci: 1.204, },
		    '1357966': { id: '1357966', con: 'UMa', name: '', ra: 13.568698, dec: 55.348434, mag: 5.6, ci: -0.014, },
		    '1017607': { id: '1017607', con: 'Lyn', name: '', ra: 9.70009526, dec: 39.75785143, mag: 5.61, ci: 0.951, },
		    '1092501': { id: '1092501', con: 'Leo', name: '', ra: 10.42088762, dec: 8.78484747, mag: 5.61, ci: 1.63, },
		    '1132884': { id: '1132884', con: 'Ant', name: '', ra: 10.83250528, dec: -34.05818395, mag: 5.61, ci: 0.038, },
		    '1307219': { id: '1307219', con: 'CVn', name: '', ra: 12.93350106, dec: 38.31469771, mag: 5.61, ci: 0.337, },
		    '1366067': { id: '1366067', con: 'Cen', name: '', ra: 13.66348545, dec: -40.05170837, mag: 5.61, ci: 1.301, },
		    '1378581': { id: '1378581', con: 'CVn', name: '', ra: 13.81076005, dec: 31.19021023, mag: 5.61, ci: 1.032, },
		    '1415947': { id: '1415947', con: 'Cen', name: '', ra: 14.24518386, dec: -41.83749182, mag: 5.61, ci: 0.929, },
		    '1462132': { id: '1462132', con: 'Hya', name: '', ra: 14.78959875, dec: -25.62426545, mag: 5.61, ci: -0.043, },
		    '1009377': { id: '1009377', con: 'Ant', name: '', ra: 9.6194142, dec: -32.17865012, mag: 5.62, ci: 1.023, },
		    '1033902': { id: '1033902', con: 'Vel', name: '', ra: 9.85547765, dec: -46.19386492, mag: 5.62, ci: 1.166, },
		    '1220770': { id: '1220770', con: 'Vir', name: '', ra: 11.85061998, dec: -5.33333225, mag: 5.62, ci: 1.058, },
		    '1474751': { id: '1474751', con: 'Lup', name: '', ra: 14.94222491, dec: -47.87917592, mag: 5.62, ci: -0.035, },
		    '1121534': { id: '1121534', con: 'Ant', name: '', ra: 10.71199593, dec: -32.71566501, mag: 5.63, ci: 0.006, },
		    '1198866': { id: '1198866', con: 'UMa', name: '', ra: 11.58469557, dec: 54.78539485, mag: 5.63, ci: 1.032, },
		    '1274350': { id: '1274350', con: 'Crv', name: '', ra: 12.50484561, dec: -23.69641597, mag: 5.63, ci: 1.67, },
		    '1321264': { id: '1321264', con: 'Cen', name: '', ra: 13.11507179, dec: -35.86202704, mag: 5.63, ci: 0.05, },
		    '1362307': { id: '1362307', con: 'Cen', name: '', ra: 13.6201133, dec: -61.69186476, mag: 5.63, ci: 0.493, },
		    '1367800': { id: '1367800', con: 'Boo', name: '', ra: 13.6839853, dec: 22.49576993, mag: 5.63, ci: 1.009, },
		    '1466261': { id: '1466261', con: 'UMi', name: '', ra: 14.83900569, dec: 82.51194279, mag: 5.63, ci: 0.671, },
		    '1474537': { id: '1474537', con: 'Boo', name: '', ra: 14.93973345, dec: 49.62844663, mag: 5.63, ci: 0.533, },
		    '1020299': { id: '1020299', con: 'Leo', name: '', ra: 9.72590599, dec: 29.97447333, mag: 5.64, ci: 0.111, },
		    '1067924': { id: '1067924', con: 'Sex', name: '', ra: 10.18218423, dec: -8.41846328, mag: 5.64, ci: 1.304, },
		    '1195782': { id: '1195782', con: 'Cen', name: '', ra: 11.54668952, dec: -40.43619827, mag: 5.64, ci: 1.578, },
		    '1199037': { id: '1199037', con: 'Cen', name: '', ra: 11.58702289, dec: -47.37257704, mag: 5.64, ci: 1.682, },
		    '1201837': { id: '1201837', con: 'Cha', name: '', ra: 11.6210087, dec: -75.89654384, mag: 5.64, ci: 0.362, },
		    '1319934': { id: '1319934', con: 'CVn', name: '', ra: 13.09785202, dec: 45.26855167, mag: 5.64, ci: 1.135, },
		    '1331152': { id: '1331152', con: 'Vir', name: '', ra: 13.242023, dec: 11.33165921, mag: 5.64, ci: 1.514, },
		    '1478980': { id: '1478980', con: 'Boo', name: '', ra: 14.9935964, dec: 39.26533514, mag: 5.64, ci: 0.336, },
		    '1025257': { id: '1025257', con: 'Sex', name: '', ra: 9.77322531, dec: 1.78558493, mag: 5.65, ci: 0.342, },
		    '1139790': { id: '1139790', con: 'Crt', name: '', ra: 10.90493797, dec: -13.75803518, mag: 5.65, ci: 0.832, },
		    '1294895': { id: '1294895', con: 'Vir', name: '', ra: 12.77292892, dec: 9.53968799, mag: 5.65, ci: 0.989, },
		    '1297476': { id: '1297476', con: 'Hya', name: '', ra: 12.80729378, dec: -27.59738702, mag: 5.65, ci: 0.947, },
		    '1346196': { id: '1346196', con: 'Mus', name: '', ra: 13.43063927, dec: -70.62725026, mag: 5.65, ci: -0.018, },
		    '1350994': { id: '1350994', con: 'Vir', name: '', ra: 13.48694451, dec: 10.81831152, mag: 5.65, ci: 1.052, },
		    '1477553': { id: '1477553', con: 'Hya', name: '', ra: 14.977571, dec: -27.65725456, mag: 5.65, ci: 0.262, },
		    '1482094': { id: '1482094', con: 'Oct', name: '', ra: 15.03077835, dec: -83.22764601, mag: 5.65, ci: 0.962, },
		    '1486370': { id: '1486370', con: 'Oct', name: '', ra: 15.07970061, dec: -83.03830999, mag: 5.65, ci: 1.273, },
		    '1081898': { id: '1081898', con: 'Car', name: '', ra: 10.31804734, dec: -64.67606875, mag: 5.66, ci: 0.042, },
		    '1083884': { id: '1083884', con: 'Vel', name: '', ra: 10.33797658, dec: -47.69909252, mag: 5.66, ci: 1.667, },
		    '1134784': { id: '1134784', con: 'UMa', name: '', ra: 10.85305887, dec: 56.58224731, mag: 5.66, ci: 1.132, },
		    '1249847': { id: '1249847', con: 'Com', name: '', ra: 12.19754927, dec: 25.87028231, mag: 5.66, ci: 1.401, },
		    '1265379': { id: '1265379', con: 'Crv', name: '', ra: 12.38932981, dec: -24.84066862, mag: 5.66, ci: 1.153, },
		    '1388054': { id: '1388054', con: 'Cen', name: '', ra: 13.92003916, dec: -52.16081901, mag: 5.66, ci: -0.072, },
		    '1025252': { id: '1025252', con: 'Leo', name: '', ra: 9.77314675, dec: 11.81004149, mag: 5.67, ci: 1.489, },
		    '1108861': { id: '1108861', con: 'Leo', name: '', ra: 10.58393283, dec: 8.65043178, mag: 5.67, ci: 0.059, },
		    '1155844': { id: '1155844', con: 'Vel', name: '', ra: 11.07533388, dec: -47.67910331, mag: 5.67, ci: 0.256, },
		    '1453106': { id: '1453106', con: 'Cen', name: '', ra: 14.68371975, dec: -36.13485899, mag: 5.67, ci: -0.081, },
		    '1491590': { id: '1491590', con: 'Boo', name: '', ra: 15.1399398, dec: 26.3011469, mag: 5.67, ci: 1.24, },
		    '1009081': { id: '1009081', con: 'Ant', name: '', ra: 9.61672398, dec: -25.29675747, mag: 5.68, ci: 1.116, },
		    '1053794': { id: '1053794', con: 'Leo', name: '', ra: 10.04693055, dec: 21.94925927, mag: 5.68, ci: -0.178, },
		    '1219935': { id: '1219935', con: 'Cen', name: '', ra: 11.84091067, dec: -62.649381, mag: 5.68, ci: 0.233, },
		    '1270956': { id: '1270956', con: 'UMa', name: '', ra: 12.45975058, dec: 55.71272234, mag: 5.68, ci: 1.582, },
		    '1273620': { id: '1273620', con: 'Com', name: '', ra: 12.49534441, dec: 20.89610688, mag: 5.68, ci: 0.093, },
		    '1284597': { id: '1284597', con: 'Vir', name: '', ra: 12.63955699, dec: 1.85466173, mag: 5.68, ci: 1.592, },
		    '1375735': { id: '1375735', con: 'UMa', name: '', ra: 13.77657208, dec: 54.43268734, mag: 5.68, ci: -0.039, },
		    '1459521': { id: '1459521', con: 'Vir', name: '', ra: 14.75839034, dec: 0.71727172, mag: 5.68, ci: -0.021, },
		    '1464815': { id: '1464815', con: 'Lib', name: '', ra: 14.82187384, dec: -24.25146715, mag: 5.68, ci: 1.275, },
		    '1465376': { id: '1465376', con: 'Boo', name: '', ra: 14.82815729, dec: 48.72099922, mag: 5.68, ci: 0.501, },
		    '1158047': { id: '1158047', con: 'Hya', name: '', ra: 11.09932485, dec: -27.2878552, mag: 5.69, ci: -0.067, },
		    '1255692': { id: '1255692', con: 'CVn', name: '', ra: 12.26876374, dec: 40.6601801, mag: 5.69, ci: 1.586, },
		    '1340588': { id: '1340588', con: 'Vir', name: '', ra: 13.36156813, dec: 2.08724077, mag: 5.69, ci: 0.045, },
		    '1347707': { id: '1347707', con: 'Cen', name: '', ra: 13.4489213, dec: -41.49756297, mag: 5.69, ci: 1.477, },
		    '1355799': { id: '1355799', con: 'Hya', name: '', ra: 13.54330516, dec: -28.6927695, mag: 5.69, ci: 0.037, },
		    '1402548': { id: '1402548', con: 'Aps', name: '', ra: 14.08885516, dec: -76.79675983, mag: 5.69, ci: 1.239, },
		    '1056421': { id: '1056421', con: 'Hya', name: '', ra: 10.07248358, dec: -24.28553806, mag: 5.7, ci: 0.303, },
		    '1069324': { id: '1069324', con: 'Car', name: '', ra: 10.19623935, dec: -58.06054693, mag: 5.7, ci: -0.118, },
		    '1147401': { id: '1147401', con: 'Hya', name: '', ra: 10.98715094, dec: -33.73758892, mag: 5.7, ci: 0.374, },
		    '1162196': { id: '1162196', con: 'Leo', name: '', ra: 11.14696933, dec: 24.65846166, mag: 5.7, ci: 0.081, },
		    '1282871': { id: '1282871', con: 'Com', name: '', ra: 12.61620349, dec: 17.0895368, mag: 5.7, ci: 1.436, },
		    '1300821': { id: '1300821', con: 'Cen', name: '', ra: 12.84941045, dec: -52.78742442, mag: 5.7, ci: 0.127, },
		    '1322222': { id: '1322222', con: 'Cen', name: '', ra: 13.12730078, dec: -53.45976227, mag: 5.7, ci: -0.061, },
		    '1359943': { id: '1359943', con: 'Vir', name: '', ra: 13.59202674, dec: -5.39619019, mag: 5.7, ci: 0.95, },
		    '1386069': { id: '1386069', con: 'UMa', name: '', ra: 13.89750389, dec: 53.72867699, mag: 5.7, ci: -0.032, },
		    '1456269': { id: '1456269', con: 'Lib', name: '', ra: 14.72043076, dec: -24.99775446, mag: 5.7, ci: 0.006, },
		    '1496672': { id: '1496672', con: 'Lup', name: '', ra: 15.19935173, dec: -48.74370397, mag: 5.7, ci: 0.144, },
		    '1039951': { id: '1039951', con: 'Vel', name: '', ra: 9.91423085, dec: -50.24396376, mag: 5.71, ci: 0.006, },
		    '1056889': { id: '1056889', con: 'UMa', name: '', ra: 10.07675647, dec: 53.89171643, mag: 5.71, ci: 0.507, },
		    '1111387': { id: '1111387', con: 'Hya', name: '', ra: 10.60899526, dec: -12.23012033, mag: 5.71, ci: 0.528, },
		    '1162957': { id: '1162957', con: 'UMa', name: '', ra: 11.15530021, dec: 36.30938179, mag: 5.71, ci: 1.4, },
		    '1200898': { id: '1200898', con: 'Hya', name: '', ra: 11.60970705, dec: -33.57004701, mag: 5.71, ci: 1.02, },
		    '1257531': { id: '1257531', con: 'Com', name: '', ra: 12.29182662, dec: 28.93718568, mag: 5.71, ci: 0.16, },
		    '1268082': { id: '1268082', con: 'Cen', name: '', ra: 12.42270407, dec: -35.1864157, mag: 5.71, ci: -0.066, },
		    '1298111': { id: '1298111', con: 'Com', name: '', ra: 12.81505953, dec: 14.12258506, mag: 5.71, ci: 0.024, },
		    '1301273': { id: '1301273', con: 'Cru', name: '', ra: 12.85499301, dec: -60.32978399, mag: 5.71, ci: 0.344, },
		    '1385141': { id: '1385141', con: 'Boo', name: '', ra: 13.8869251, dec: 17.93287063, mag: 5.71, ci: 0.845, },
		    '1482062': { id: '1482062', con: 'Vir', name: '', ra: 15.03025776, dec: -0.14030721, mag: 5.71, ci: 1.509, },
		    '1018066': { id: '1018066', con: 'UMa', name: '', ra: 9.70411762, dec: 69.23753894, mag: 5.72, ci: 1.131, },
		    '1032802': { id: '1032802', con: 'Vel', name: '', ra: 9.84498218, dec: -46.93392606, mag: 5.72, ci: 1.085, },
		    '1038995': { id: '1038995', con: 'Vel', name: '', ra: 9.90490463, dec: -45.28350847, mag: 5.72, ci: -0.114, },
		    '1247337': { id: '1247337', con: 'Vir', name: '', ra: 12.16761595, dec: 5.80700663, mag: 5.72, ci: 0.352, },
		    '1254339': { id: '1254339', con: 'Dra', name: '', ra: 12.25235831, dec: 70.20000848, mag: 5.72, ci: 1.179, },
		    '1361969': { id: '1361969', con: 'Boo', name: '', ra: 13.61641197, dec: 24.61329774, mag: 5.72, ci: 1.593, },
		    '1418670': { id: '1418670', con: 'Cir', name: '', ra: 14.2774201, dec: -66.58789625, mag: 5.72, ci: -0.095, },
		    '1456981': { id: '1456981', con: 'Boo', name: '', ra: 14.72900947, dec: 40.45925564, mag: 5.72, ci: 1.398, },
		    '1475673': { id: '1475673', con: 'Boo', name: '', ra: 14.95324398, dec: 16.38812666, mag: 5.72, ci: 0.951, },
		    '1476026': { id: '1476026', con: 'Lib', name: '', ra: 14.95777776, dec: -21.41549841, mag: 5.72, ci: 1.024, },
		    '1009156': { id: '1009156', con: 'Leo', name: '', ra: 9.6173834, dec: 16.43795211, mag: 5.73, ci: 1.223, },
		    '1087238': { id: '1087238', con: 'UMa', name: '', ra: 10.36960092, dec: 41.22953015, mag: 5.73, ci: 0.531, },
		    '1140855': { id: '1140855', con: 'UMa', name: '', ra: 10.91616145, dec: 34.03479819, mag: 5.73, ci: 1.032, },
		    '1186270': { id: '1186270', con: 'UMa', name: '', ra: 11.43253044, dec: 55.85045902, mag: 5.73, ci: 0.988, },
		    '1207613': { id: '1207613', con: 'UMa', name: '', ra: 11.69284956, dec: 31.74605669, mag: 5.73, ci: 0.44, },
		    '1218888': { id: '1218888', con: 'UMa', name: '', ra: 11.82825399, dec: 34.93175522, mag: 5.73, ci: 0.467, },
		    '1263847': { id: '1263847', con: 'Mus', name: '', ra: 12.3700085, dec: -68.30731789, mag: 5.73, ci: 1.038, },
		    '1361718': { id: '1361718', con: 'Hya', name: '', ra: 13.6134587, dec: -26.4952036, mag: 5.73, ci: 0.22, },
		    '1367298': { id: '1367298', con: 'Boo', name: '', ra: 13.67790706, dec: 19.95571758, mag: 5.73, ci: 0.017, },
		    '1383070': { id: '1383070', con: 'Cir', name: '', ra: 13.86317552, dec: -69.40125157, mag: 5.73, ci: 1.704, },
		    '1000933': { id: '1000933', con: 'Hya', name: '', ra: 9.53900274, dec: -19.40030215, mag: 5.74, ci: 0.135, },
		    '1080094': { id: '1080094', con: 'UMa', name: '', ra: 10.30056338, dec: 65.1083507, mag: 5.74, ci: 0.163, },
		    '1120034': { id: '1120034', con: 'UMa', name: '', ra: 10.69673866, dec: 68.4435042, mag: 5.74, ci: 1.315, },
		    '1123378': { id: '1123378', con: 'Car', name: '', ra: 10.73088674, dec: -64.2490407, mag: 5.74, ci: 0.012, },
		    '1168988': { id: '1168988', con: 'Car', name: '', ra: 11.2252176, dec: -59.61932101, mag: 5.74, ci: -0.106, },
		    '1191498': { id: '1191498', con: 'Leo', name: '', ra: 11.49495716, dec: 15.41326724, mag: 5.74, ci: 1.371, },
		    '1277280': { id: '1277280', con: 'Crv', name: '', ra: 12.54333314, dec: -13.8591063, mag: 5.74, ci: 0.376, },
		    '1347722': { id: '1347722', con: 'Cam', name: '', ra: 13.44911063, dec: 78.64387511, mag: 5.74, ci: 0.769, },
		    '1366358': { id: '1366358', con: 'Cen', name: '', ra: 13.6666131, dec: -49.94995625, mag: 5.74, ci: 1.496, },
		    '1387474': { id: '1387474', con: 'Cir', name: '', ra: 13.91364215, dec: -67.65210113, mag: 5.74, ci: 1.49, },
		    '1440917': { id: '1440917', con: 'Dra', name: '', ra: 14.54192708, dec: 55.39801097, mag: 5.74, ci: 1.529, },
		    '1443967': { id: '1443967', con: 'Boo', name: '', ra: 14.57767276, dec: 49.36835381, mag: 5.74, ci: 1.56, },
		    '1446976': { id: '1446976', con: 'Cen', name: '', ra: 14.61225907, dec: -40.2115845, mag: 5.74, ci: -0.112, },
		    '1449080': { id: '1449080', con: 'Boo', name: '', ra: 14.63683031, dec: 43.64213008, mag: 5.74, ci: 1.481, },
		    '1460863': { id: '1460863', con: 'Lup', name: '', ra: 14.77472072, dec: -47.44111993, mag: 5.74, ci: 0.066, },
		    '1048219': { id: '1048219', con: 'Leo', name: '', ra: 9.99339279, dec: 29.64523256, mag: 5.75, ci: 1.059, },
		    '1169182': { id: '1169182', con: 'Cen', name: '', ra: 11.22760948, dec: -53.23181463, mag: 5.75, ci: 1.309, },
		    '1245767': { id: '1245767', con: 'Cen', name: '', ra: 12.14827792, dec: -44.325989, mag: 5.75, ci: 0.24, },
		    '1303946': { id: '1303946', con: 'Cru', name: '', ra: 12.8894155, dec: -60.32848788, mag: 5.75, ci: 0.295, },
		    '1305946': { id: '1305946', con: 'CVn', name: '', ra: 12.91570025, dec: 47.19672045, mag: 5.75, ci: 1.451, },
		    '1345156': { id: '1345156', con: 'Com', name: '', ra: 13.41852188, dec: 23.85441617, mag: 5.75, ci: 0.09, },
		    '1491273': { id: '1491273', con: 'Lup', name: '', ra: 15.13670094, dec: -40.58393199, mag: 5.75, ci: -0.113, },
		    '1494402': { id: '1494402', con: 'Lib', name: '', ra: 15.17184195, dec: -26.33262489, mag: 5.75, ci: 1.045, },
		    '1103755': { id: '1103755', con: 'Vel', name: '', ra: 10.53262099, dec: -45.06669452, mag: 5.76, ci: -0.194, },
		    '1197920': { id: '1197920', con: 'Leo', name: '', ra: 11.57276397, dec: 3.06016365, mag: 5.76, ci: 0.48, },
		    '1279937': { id: '1279937', con: 'Cen', name: '', ra: 12.57844256, dec: -44.67301793, mag: 5.76, ci: 0.683, },
		    '1298649': { id: '1298649', con: 'Com', name: '', ra: 12.82151441, dec: 27.55238007, mag: 5.76, ci: 0.051, },
		    '1328490': { id: '1328490', con: 'Vir', name: '', ra: 13.20914439, dec: 11.55609925, mag: 5.76, ci: 1.499, },
		    '1339598': { id: '1339598', con: 'Cen', name: '', ra: 13.34936077, dec: -46.88000845, mag: 5.76, ci: 1.106, },
		    '1344416': { id: '1344416', con: 'Vir', name: '', ra: 13.40922948, dec: -5.16400368, mag: 5.76, ci: 0.415, },
		    '1392928': { id: '1392928', con: 'Boo', name: '', ra: 13.97747922, dec: 21.69621411, mag: 5.76, ci: -0.002, },
		    '1462920': { id: '1462920', con: 'Hya', name: '', ra: 14.79932177, dec: -26.64615326, mag: 5.76, ci: -0.007, },
		    '1464811': { id: '1464811', con: 'Boo', name: 'Merga', ra: 14.82185273, dec: 46.11620792, mag: 5.76, ci: 0.482, },
		    '1493184': { id: '1493184', con: 'TrA', name: '', ra: 15.15830938, dec: -67.08413439, mag: 5.76, ci: 0.675, },
		    '1005394': { id: '1005394', con: 'UMa', name: '', ra: 9.58153524, dec: 72.20568237, mag: 5.77, ci: 0.53, },
		    '1071075': { id: '1071075', con: 'Sex', name: '', ra: 10.21343452, dec: 4.61468019, mag: 5.77, ci: 1.178, },
		    '1122547': { id: '1122547', con: 'Sex', name: '', ra: 10.72237231, dec: 4.74672049, mag: 5.77, ci: 1.168, },
		    '1168576': { id: '1168576', con: 'Cen', name: '', ra: 11.22074613, dec: -44.37221883, mag: 5.77, ci: 1.661, },
		    '1191424': { id: '1191424', con: 'Crt', name: '', ra: 11.49405883, dec: -24.4640334, mag: 5.77, ci: 0.067, },
		    '1251968': { id: '1251968', con: 'Cen', name: '', ra: 12.22362168, dec: -38.9291836, mag: 5.77, ci: -0.144, },
		    '1332449': { id: '1332449', con: 'CVn', name: '', ra: 13.25887822, dec: 40.85521628, mag: 5.77, ci: 0.198, },
		    '1383060': { id: '1383060', con: 'Cen', name: '', ra: 13.86311559, dec: -46.89866554, mag: 5.77, ci: -0.153, },
		    '1394893': { id: '1394893', con: 'Hya', name: '', ra: 14.00003337, dec: -25.01040295, mag: 5.77, ci: 0.48, },
		    '1490196': { id: '1490196', con: 'Lup', name: '', ra: 15.12387544, dec: -49.08861481, mag: 5.77, ci: 0.92, },
		    '1072242': { id: '1072242', con: 'Vel', name: '', ra: 10.22444299, dec: -51.75579908, mag: 5.78, ci: 0.136, },
		    '1240949': { id: '1240949', con: 'Cam', name: 'Tonatiuh', ra: 12.08753247, dec: 76.90573431, mag: 5.78, ci: 1.029, },
		    '1273822': { id: '1273822', con: 'Cru', name: '', ra: 12.49838918, dec: -56.524939, mag: 5.78, ci: 1.572, },
		    '1281658': { id: '1281658', con: 'Cen', name: '', ra: 12.60028704, dec: -39.86949816, mag: 5.78, ci: 0.003, },
		    '1326623': { id: '1326623', con: 'Cen', name: '', ra: 13.18579978, dec: -42.23288449, mag: 5.78, ci: 0.521, },
		    '1460327': { id: '1460327', con: 'Boo', name: '', ra: 14.76831814, dec: 15.13178622, mag: 5.78, ci: 1.335, },
		    '1471782': { id: '1471782', con: 'Lib', name: '', ra: 14.90635361, dec: -11.89834677, mag: 5.78, ci: 0.982, },
		    '1033702': { id: '1033702', con: 'Car', name: '', ra: 9.85335235, dec: -59.42577497, mag: 5.79, ci: 1.354, },
		    '1100801': { id: '1100801', con: 'LMi', name: '', ra: 10.50179091, dec: 38.92513225, mag: 5.79, ci: 0.087, },
		    '1123168': { id: '1123168', con: 'UMa', name: '', ra: 10.72870401, dec: 57.19920101, mag: 5.79, ci: -0.038, },
		    '1163828': { id: '1163828', con: 'Hya', name: '', ra: 11.1648314, dec: -32.36752428, mag: 5.79, ci: 0.027, },
		    '1169691': { id: '1169691', con: 'Leo', name: '', ra: 11.23384303, dec: 8.0606945, mag: 5.79, ci: 1.128, },
		    '1265880': { id: '1265880', con: 'Cen', name: '', ra: 12.39576142, dec: -38.91138984, mag: 5.79, ci: -0.064, },
		    '1311851': { id: '1311851', con: 'Vir', name: '', ra: 12.99431215, dec: -3.81192012, mag: 5.79, ci: 0.203, },
		    '1324173': { id: '1324173', con: 'Vir', name: '', ra: 13.15345432, dec: 10.02246547, mag: 5.79, ci: 1.025, },
		    '1366608': { id: '1366608', con: 'Cen', name: '', ra: 13.66964083, dec: -64.57655163, mag: 5.79, ci: 0.401, },
		    '1015946': { id: '1015946', con: 'Car', name: '', ra: 9.68394094, dec: -57.25953728, mag: 5.8, ci: 1.083, },
		    '1024865': { id: '1024865', con: 'Leo', name: '', ra: 9.76945664, dec: 6.70855461, mag: 5.8, ci: 1.639, },
		    '1065496': { id: '1065496', con: 'Car', name: '', ra: 10.15839373, dec: -68.68281268, mag: 5.8, ci: 0.015, },
		    '1081135': { id: '1081135', con: 'Vel', name: '', ra: 10.31053013, dec: -56.11039359, mag: 5.8, ci: 0.481, },
		    '1133386': { id: '1133386', con: 'Sex', name: '', ra: 10.83834886, dec: -8.8977623, mag: 5.8, ci: 0.156, },
		    '1184924': { id: '1184924', con: 'Leo', name: '', ra: 11.41636837, dec: 11.43029375, mag: 5.8, ci: 1.376, },
		    '1187445': { id: '1187445', con: 'Cen', name: '', ra: 11.44646197, dec: -53.15992258, mag: 5.8, ci: 0.517, },
		    '1200524': { id: '1200524', con: 'Leo', name: '', ra: 11.60499164, dec: 27.78127041, mag: 5.8, ci: 0.248, },
		    '1257506': { id: '1257506', con: 'UMa', name: '', ra: 12.29155588, dec: 53.19133064, mag: 5.8, ci: 1.33, },
		    '1460344': { id: '1460344', con: 'Lib', name: '', ra: 14.76854659, dec: -23.15301548, mag: 5.8, ci: 0.98, },
		    '1465749': { id: '1465749', con: 'Boo', name: '', ra: 14.83288838, dec: 28.61583191, mag: 5.8, ci: 0.046, },
		    '1078764': { id: '1078764', con: 'Leo', name: '', ra: 10.28737194, dec: 23.10621677, mag: 5.81, ci: 0.5, },
		    '1148597': { id: '1148597', con: 'Vel', name: '', ra: 10.99982725, dec: -43.80711058, mag: 5.81, ci: -0.064, },
		    '1336281': { id: '1336281', con: 'CVn', name: '', ra: 13.30770255, dec: 34.0983062, mag: 5.81, ci: 1.366, },
		    '1341382': { id: '1341382', con: 'Cen', name: '', ra: 13.37119051, dec: -52.18295629, mag: 5.81, ci: 0.072, },
		    '1364447': { id: '1364447', con: 'Hya', name: '', ra: 13.64502055, dec: -29.56086008, mag: 5.81, ci: 0.431, },
		    '1374332': { id: '1374332', con: 'Hya', name: '', ra: 13.76024775, dec: -26.11601257, mag: 5.81, ci: 0.023, },
		    '1182407': { id: '1182407', con: 'Cen', name: '', ra: 11.38559205, dec: -56.77935516, mag: 5.82, ci: -0.004, },
		    '1254134': { id: '1254134', con: 'Crv', name: '', ra: 12.24988451, dec: -20.84422498, mag: 5.82, ci: 1.052, },
		    '1267668': { id: '1267668', con: 'UMa', name: '', ra: 12.41755742, dec: 56.77783221, mag: 5.82, ci: 1.622, },
		    '1334637': { id: '1334637', con: 'Cen', name: '', ra: 13.28720084, dec: -43.97946674, mag: 5.82, ci: 0.187, },
		    '1346609': { id: '1346609', con: 'UMi', name: '', ra: 13.43557423, dec: 72.39147465, mag: 5.82, ci: 1.652, },
		    '1389701': { id: '1389701', con: 'Cen', name: '', ra: 13.9388268, dec: -46.59294897, mag: 5.82, ci: 1.14, },
		    '1491865': { id: '1491865', con: 'Boo', name: '', ra: 15.14321211, dec: 25.10863623, mag: 5.82, ci: 1.233, },
		    '1042981': { id: '1042981', con: 'Ant', name: '', ra: 9.94319261, dec: -33.41849815, mag: 5.83, ci: 1.202, },
		    '1190658': { id: '1190658', con: 'UMa', name: '', ra: 11.48460135, dec: 61.77836482, mag: 5.83, ci: 0.382, },
		    '1227831': { id: '1227831', con: 'UMa', name: '', ra: 11.93289345, dec: 56.59856242, mag: 5.83, ci: 1.101, },
		    '1297770': { id: '1297770', con: 'UMa', name: '', ra: 12.81096242, dec: 60.31989265, mag: 5.83, ci: 0.467, },
		    '1386239': { id: '1386239', con: 'Cen', name: '', ra: 13.89923349, dec: -47.12816058, mag: 5.83, ci: -0.053, },
		    '1433388': { id: '1433388', con: 'Lup', name: '', ra: 14.45337943, dec: -46.13425149, mag: 5.83, ci: 0.311, },
		    '1449143': { id: '1449143', con: 'Boo', name: '', ra: 14.63756152, dec: 54.0233387, mag: 5.83, ci: 0.007, },
		    '1482483': { id: '1482483', con: 'Hya', name: '', ra: 15.03512103, dec: -28.06061569, mag: 5.83, ci: 0.164, },
		    '1077805': { id: '1077805', con: 'Leo', name: '', ra: 10.27826561, dec: 25.37070655, mag: 5.84, ci: 1.206, },
		    '1115743': { id: '1115743', con: 'LMi', name: '', ra: 10.65212008, dec: 37.91000047, mag: 5.84, ci: 0.595, },
		    '1200633': { id: '1200633', con: 'Cen', name: '', ra: 11.60621231, dec: -61.05243301, mag: 5.84, ci: -0.102, },
		    '1288489': { id: '1288489', con: 'Cen', name: '', ra: 12.68971786, dec: -46.14558009, mag: 5.84, ci: 1.475, },
		    '1307580': { id: '1307580', con: 'UMa', name: '', ra: 12.93821664, dec: 54.09947889, mag: 5.84, ci: 0.204, },
		    '1330850': { id: '1330850', con: 'Cha', name: '', ra: 13.23814707, dec: -78.44745353, mag: 5.84, ci: 1.04, },
		    '1331396': { id: '1331396', con: 'Cen', name: '', ra: 13.2453513, dec: -48.957029, mag: 5.84, ci: 1.061, },
		    '1419888': { id: '1419888', con: 'Boo', name: '', ra: 14.29123677, dec: 15.26337907, mag: 5.84, ci: 1.678, },
		    '1439152': { id: '1439152', con: 'Cir', name: '', ra: 14.52123592, dec: -67.71718473, mag: 5.84, ci: 1.006, },
		    '1499515': { id: '1499515', con: 'Lib', name: '', ra: 15.23147565, dec: -26.19357347, mag: 5.84, ci: 1.139, },
		    '1042739': { id: '1042739', con: 'Leo', name: '', ra: 9.94054902, dec: 8.93315853, mag: 5.85, ci: 1.129, },
		    '1132078': { id: '1132078', con: 'Car', name: '', ra: 10.82345237, dec: -59.32376873, mag: 5.85, ci: 0.008, },
		    '1132564': { id: '1132564', con: 'Sex', name: '', ra: 10.82874647, dec: -9.85269681, mag: 5.85, ci: 1.074, },
		    '1221697': { id: '1221697', con: 'Hya', name: '', ra: 11.86155818, dec: -30.83480763, mag: 5.85, ci: 0.554, },
		    '1251985': { id: '1251985', con: 'Vir', name: '', ra: 12.22387176, dec: 10.26234165, mag: 5.85, ci: 0.262, },
		    '1368446': { id: '1368446', con: 'Dra', name: '', ra: 13.69163678, dec: 64.82241101, mag: 5.85, ci: 0.073, },
		    '1472149': { id: '1472149', con: 'Cen', name: '', ra: 14.91053189, dec: -33.3005743, mag: 5.85, ci: 1.429, },
		    '1491959': { id: '1491959', con: 'Lup', name: '', ra: 15.14422162, dec: -42.86792211, mag: 5.85, ci: -0.123, },
		    '1046087': { id: '1046087', con: 'UMa', name: '', ra: 9.97298667, dec: 72.87951381, mag: 5.86, ci: 1.155, },
		    '1068419': { id: '1068419', con: 'LMi', name: '', ra: 10.18688318, dec: 37.40189763, mag: 5.86, ci: 1.282, },
		    '1148934': { id: '1148934', con: 'Crt', name: '', ra: 11.00324827, dec: -14.08337488, mag: 5.86, ci: 1.501, },
		    '1280491': { id: '1280491', con: 'Com', name: '', ra: 12.58560201, dec: 21.88138621, mag: 5.86, ci: 1.242, },
		    '1285504': { id: '1285504', con: 'Hya', name: '', ra: 12.6509615, dec: -30.42237474, mag: 5.86, ci: 1.207, },
		    '1421546': { id: '1421546', con: 'Vir', name: '', ra: 14.310627, dec: -18.715968, mag: 5.86, ci: 0.013, },
		    '1442316': { id: '1442316', con: 'Lup', name: '', ra: 14.55832445, dec: -52.67952164, mag: 5.86, ci: 1.085, },
		    '1442383': { id: '1442383', con: 'Lup', name: '', ra: 14.55899399, dec: -54.99862297, mag: 5.86, ci: 0.482, },
		    '1466151': { id: '1466151', con: 'Boo', name: '', ra: 14.83772525, dec: 23.91183812, mag: 5.86, ci: 0.576, },
		    '1130179': { id: '1130179', con: 'Hya', name: '', ra: 10.80391984, dec: -31.68785046, mag: 5.87, ci: 0.028, },
		    '1185717': { id: '1185717', con: 'Cen', name: '', ra: 11.42585998, dec: -37.7475736, mag: 5.87, ci: 1.503, },
		    '1295379': { id: '1295379', con: 'Cen', name: '', ra: 12.7795079, dec: -33.31548244, mag: 5.87, ci: 1.326, },
		    '1299786': { id: '1299786', con: 'CVn', name: '', ra: 12.83631641, dec: 37.51693959, mag: 5.87, ci: 0.17, },
		    '1385876': { id: '1385876', con: 'Cen', name: '', ra: 13.89530411, dec: -53.3733251, mag: 5.87, ci: 0.009, },
		    '1422075': { id: '1422075', con: 'Hya', name: '', ra: 14.31691619, dec: -25.81542876, mag: 5.87, ci: 0.518, },
		    '1433271': { id: '1433271', con: 'Cir', name: '', ra: 14.45196856, dec: -65.82164506, mag: 5.87, ci: 1.502, },
		    '1085253': { id: '1085253', con: 'UMa', name: '', ra: 10.35092817, dec: 68.74765151, mag: 5.88, ci: 0.241, },
		    '1147852': { id: '1147852', con: 'Crt', name: '', ra: 10.99192442, dec: -16.35370243, mag: 5.88, ci: 1.6, },
		    '1173528': { id: '1173528', con: 'UMa', name: '', ra: 11.27829178, dec: 49.47624895, mag: 5.88, ci: 1.102, },
		    '1276680': { id: '1276680', con: 'Mus', name: '', ra: 12.53610392, dec: -73.00105257, mag: 5.88, ci: 1.078, },
		    '1282659': { id: '1282659', con: 'Vir', name: '', ra: 12.61315422, dec: -5.83189751, mag: 5.88, ci: 0.072, },
		    '1296061': { id: '1296061', con: 'UMa', name: '', ra: 12.78859719, dec: 62.78115773, mag: 5.88, ci: 0.215, },
		    '1342777': { id: '1342777', con: 'Vir', name: '', ra: 13.38858144, dec: -4.9244277, mag: 5.88, ci: 1.431, },
		    '1346822': { id: '1346822', con: 'CVn', name: '', ra: 13.43794506, dec: 46.02805414, mag: 5.88, ci: 0.985, },
		    '1375185': { id: '1375185', con: 'CVn', name: '', ra: 13.77042966, dec: 41.08874261, mag: 5.88, ci: 0.211, },
		    '1445231': { id: '1445231', con: 'Cen', name: '', ra: 14.59207801, dec: -41.51743833, mag: 5.88, ci: -0.085, },
		    '1477891': { id: '1477891', con: 'Lib', name: '', ra: 14.98155002, dec: -11.14401406, mag: 5.88, ci: 1.274, },
		    '1481231': { id: '1481231', con: 'Cen', name: '', ra: 15.02030481, dec: -38.05839891, mag: 5.88, ci: 1.246, },
		    '1495547': { id: '1495547', con: 'Oct', name: '', ra: 15.18578278, dec: -84.78781701, mag: 5.88, ci: -0.031, },
		    '1088848': { id: '1088848', con: 'LMi', name: '', ra: 10.38509097, dec: 33.90814241, mag: 5.89, ci: 0.147, },
		    '1113850': { id: '1113850', con: 'Car', name: '', ra: 10.63406846, dec: -57.25630455, mag: 5.89, ci: -0.128, },
		    '1163432': { id: '1163432', con: 'UMa', name: '', ra: 11.16069454, dec: 43.20773357, mag: 5.89, ci: 1.564, },
		    '1195165': { id: '1195165', con: 'Mus', name: '', ra: 11.53888814, dec: -66.96182431, mag: 5.89, ci: 1.136, },
		    '1226403': { id: '1226403', con: 'Cen', name: '', ra: 11.91667085, dec: -63.27917714, mag: 5.89, ci: 0.21, },
		    '1237363': { id: '1237363', con: 'Mus', name: '', ra: 12.04380347, dec: -69.19228874, mag: 5.89, ci: -0.08, },
		    '1239601': { id: '1239601', con: 'Com', name: '', ra: 12.07127806, dec: 21.4591662, mag: 5.89, ci: 0.248, },
		    '1304527': { id: '1304527', con: 'Cru', name: '', ra: 12.89692174, dec: -60.376237, mag: 5.89, ci: 0.2, },
		    '1305986': { id: '1305986', con: 'Cen', name: '', ra: 12.91625569, dec: -44.1519575, mag: 5.89, ci: 0.633, },
		    '1341221': { id: '1341221', con: 'Vir', name: '', ra: 13.369358, dec: 5.15476469, mag: 5.89, ci: 0.109, },
		    '1382131': { id: '1382131', con: 'CVn', name: '', ra: 13.85256024, dec: 34.66440271, mag: 5.89, ci: 1.635, },
		    '1414491': { id: '1414491', con: 'Vir', name: '', ra: 14.22799713, dec: -0.84546449, mag: 5.89, ci: 0.489, },
		    '1463842': { id: '1463842', con: 'Cen', name: '', ra: 14.81056895, dec: -36.6346988, mag: 5.89, ci: 1.369, },
		    '1016924': { id: '1016924', con: 'Leo', name: '', ra: 9.69308791, dec: 31.2778138, mag: 5.9, ci: 1.579, },
		    '1038024': { id: '1038024', con: 'Sex', name: '', ra: 9.89525682, dec: 5.95857159, mag: 5.9, ci: 1.662, },
		    '1103624': { id: '1103624', con: 'LMi', name: '', ra: 10.53093772, dec: 32.37955401, mag: 5.9, ci: 0.114, },
		    '1144170': { id: '1144170', con: 'Vel', name: '', ra: 10.95217964, dec: -50.76501678, mag: 5.9, ci: 0.173, },
		    '1176656': { id: '1176656', con: 'Leo', name: '', ra: 11.31526637, dec: 1.65039716, mag: 5.9, ci: 1.04, },
		    '1217483': { id: '1217483', con: 'Leo', name: '', ra: 11.81075243, dec: 14.28421705, mag: 5.9, ci: 0.303, },
		    '1259071': { id: '1259071', con: 'Vir', name: '', ra: 12.31119956, dec: -0.78718713, mag: 5.9, ci: 0.168, },
		    '1329611': { id: '1329611', con: 'Cen', name: '', ra: 13.2231531, dec: -50.69983308, mag: 5.9, ci: -0.011, },
		    '1389877': { id: '1389877', con: 'Vir', name: '', ra: 13.94107703, dec: 1.05058213, mag: 5.9, ci: 0.217, },
		    '1449116': { id: '1449116', con: 'Boo', name: '', ra: 14.63721866, dec: 18.2983783, mag: 5.9, ci: 1.099, },
		    '1461716': { id: '1461716', con: 'Cen', name: '', ra: 14.78474873, dec: -38.29063532, mag: 5.9, ci: 1.336, },
		    '1474304': { id: '1474304', con: 'Boo', name: '', ra: 14.93700853, dec: 14.44626273, mag: 5.9, ci: -0.031, },
		    '1496823': { id: '1496823', con: 'Ser', name: '', ra: 15.20118493, dec: 18.97601716, mag: 5.9, ci: 1.414, },
		    '1066532': { id: '1066532', con: 'Sex', name: '', ra: 10.1687613, dec: -8.40816569, mag: 5.91, ci: 0.026, },
		    '1072741': { id: '1072741', con: 'Ant', name: '', ra: 10.22942268, dec: -40.34605085, mag: 5.91, ci: 1.204, },
		    '1104732': { id: '1104732', con: 'Vel', name: '', ra: 10.54266918, dec: -44.61850189, mag: 5.91, ci: 0.92, },
		    '1138539': { id: '1138539', con: 'UMa', name: '', ra: 10.89186316, dec: 69.853878, mag: 5.91, ci: 1.01, },
		    '1141979': { id: '1141979', con: 'Leo', name: '', ra: 10.9284433, dec: 0.73693427, mag: 5.91, ci: 0.425, },
		    '1142431': { id: '1142431', con: 'Leo', name: '', ra: 10.93374191, dec: 6.18537051, mag: 5.91, ci: 1.256, },
		    '1250497': { id: '1250497', con: 'Cru', name: '', ra: 12.20610616, dec: -62.95077218, mag: 5.91, ci: 0.253, },
		    '1263522': { id: '1263522', con: 'Cru', name: '', ra: 12.3659522, dec: -56.37438142, mag: 5.91, ci: 1.533, },
		    '1291414': { id: '1291414', con: 'Vir', name: '', ra: 12.72723611, dec: -1.57699473, mag: 5.91, ci: 0.85, },
		    '1303553': { id: '1303553', con: 'Cen', name: '', ra: 12.88449088, dec: -54.95247163, mag: 5.91, ci: 1.309, },
		    '1324931': { id: '1324931', con: 'Com', name: '', ra: 13.16329082, dec: 16.84861404, mag: 5.91, ci: 1.45, },
		    '1325256': { id: '1325256', con: 'CVn', name: '', ra: 13.16756003, dec: 38.49898421, mag: 5.91, ci: 0.294, },
		    '1328840': { id: '1328840', con: 'Mus', name: '', ra: 13.21355658, dec: -66.22674819, mag: 5.91, ci: 0.048, },
		    '1330725': { id: '1330725', con: 'Cen', name: '', ra: 13.23669107, dec: -58.68393978, mag: 5.91, ci: 1.084, },
		    '1362569': { id: '1362569', con: 'Cen', name: '', ra: 13.62318727, dec: -46.42787886, mag: 5.91, ci: -0.11, },
		    '1370097': { id: '1370097', con: 'UMi', name: '', ra: 13.71088866, dec: 78.06444376, mag: 5.91, ci: 1, },
		    '1385081': { id: '1385081', con: 'CVn', name: '', ra: 13.88618909, dec: 28.64813563, mag: 5.91, ci: 0.202, },
		    '1440949': { id: '1440949', con: 'Boo', name: '', ra: 14.5423729, dec: 22.26005816, mag: 5.91, ci: 0.391, },
		    '1463972': { id: '1463972', con: 'Cir', name: '', ra: 14.81237441, dec: -66.59356484, mag: 5.91, ci: -0.106, },
		    '1469348': { id: '1469348', con: 'Cir', name: '', ra: 14.87646123, dec: -63.80982386, mag: 5.91, ci: 0.66, },
		    '1478616': { id: '1478616', con: 'Vir', name: '', ra: 14.98975425, dec: 4.56776025, mag: 5.91, ci: 1.615, },
		    '1481539': { id: '1481539', con: 'Dra', name: '', ra: 15.02419201, dec: 60.20445225, mag: 5.91, ci: 0.107, },
		    '1002783': { id: '1002783', con: 'Hya', name: '', ra: 9.55723607, dec: -22.86388097, mag: 5.92, ci: 0.023, },
		    '1130894': { id: '1130894', con: 'Sex', name: '', ra: 10.8112656, dec: -1.95889702, mag: 5.92, ci: 1.608, },
		    '1298393': { id: '1298393', con: 'Cam', name: '', ra: 12.81852435, dec: 83.4178331, mag: 5.92, ci: 0.015, },
		    '1327547': { id: '1327547', con: 'Mus', name: '', ra: 13.19762218, dec: -69.94202071, mag: 5.92, ci: 0.415, },
		    '1358739': { id: '1358739', con: 'Vir', name: '', ra: 13.57790406, dec: -13.21430754, mag: 5.92, ci: 0.02, },
		    '1369718': { id: '1369718', con: 'Cam', name: '', ra: 13.70641514, dec: 82.75240857, mag: 5.92, ci: 0.993, },
		    '1375336': { id: '1375336', con: 'CVn', name: '', ra: 13.77196143, dec: 38.50362404, mag: 5.92, ci: 0.948, },
		    '1376965': { id: '1376965', con: 'Cen', name: '', ra: 13.79101082, dec: -50.24929299, mag: 5.92, ci: 0.279, },
		    '1393835': { id: '1393835', con: 'Cen', name: '', ra: 13.98819036, dec: -50.36964728, mag: 5.92, ci: 0.957, },
		    '1479805': { id: '1479805', con: 'Aps', name: '', ra: 15.00313882, dec: -77.16054836, mag: 5.92, ci: 1.052, },
		    '1052365': { id: '1052365', con: 'Car', name: '', ra: 10.03336066, dec: -60.42088673, mag: 5.93, ci: 0.263, },
		    '1089398': { id: '1089398', con: 'Sex', name: '', ra: 10.39068827, dec: -4.07403332, mag: 5.93, ci: -0.048, },
		    '1092072': { id: '1092072', con: 'Car', name: '', ra: 10.41650542, dec: -58.57630116, mag: 5.93, ci: 0.315, },
		    '1141340': { id: '1141340', con: 'Car', name: '', ra: 10.92145001, dec: -60.51700669, mag: 5.93, ci: 1.065, },
		    '1187947': { id: '1187947', con: 'Crt', name: '', ra: 11.45264349, dec: -12.3567479, mag: 5.93, ci: 0.49, },
		    '1227385': { id: '1227385', con: 'Hya', name: '', ra: 11.92781457, dec: -28.47710403, mag: 5.93, ci: 1.499, },
		    '1307899': { id: '1307899', con: 'Mus', name: '', ra: 12.9421361, dec: -72.18521398, mag: 5.93, ci: 1.115, },
		    '1316390': { id: '1316390', con: 'Mus', name: '', ra: 13.05148142, dec: -71.47573534, mag: 5.93, ci: 0.002, },
		    '1399840': { id: '1399840', con: 'Cen', name: '', ra: 14.05736301, dec: -56.2134335, mag: 5.93, ci: 1.207, },
		    '1422588': { id: '1422588', con: 'Cen', name: '', ra: 14.32329977, dec: -37.0029024, mag: 5.93, ci: 0.082, },
		    '1452637': { id: '1452637', con: 'Boo', name: '', ra: 14.67844237, dec: 13.53432244, mag: 5.93, ci: 0.238, },
		    '1192622': { id: '1192622', con: 'UMa', name: '', ra: 11.5086476, dec: 43.17324388, mag: 5.94, ci: 0.524, },
		    '1195772': { id: '1195772', con: 'Crt', name: '', ra: 11.54653799, dec: -7.82752594, mag: 5.94, ci: 1.38, },
		    '1202579': { id: '1202579', con: 'Mus', name: '', ra: 11.63010535, dec: -67.6203803, mag: 5.94, ci: 1.013, },
		    '1261089': { id: '1261089', con: 'Crv', name: '', ra: 12.3363238, dec: -22.17571253, mag: 5.94, ci: 0.824, },
		    '1428908': { id: '1428908', con: 'Boo', name: '', ra: 14.40024345, dec: 8.24396826, mag: 5.94, ci: 0.066, },
		    '1001918': { id: '1001918', con: 'Hya', name: '', ra: 9.54882639, dec: -13.5168039, mag: 5.95, ci: 1.501, },
		    '1030622': { id: '1030622', con: 'Ant', name: '', ra: 9.82446777, dec: -37.18676422, mag: 5.95, ci: 1.245, },
		    '1038225': { id: '1038225', con: 'Vel', name: '', ra: 9.8972496, dec: -51.14671578, mag: 5.95, ci: -0.152, },
		    '1077527': { id: '1077527', con: 'Leo', name: '', ra: 10.27563594, dec: 23.50309602, mag: 5.95, ci: 0.655, },
		    '1125279': { id: '1125279', con: 'UMa', name: '', ra: 10.75111944, dec: 67.41138435, mag: 5.95, ci: 2.382, },
		    '1134642': { id: '1134642', con: 'Sex', name: '', ra: 10.85150262, dec: -3.09266856, mag: 5.95, ci: 1.475, },
		    '1140094': { id: '1140094', con: 'Car', name: '', ra: 10.90822305, dec: -61.82661669, mag: 5.95, ci: 1.736, },
		    '1154417': { id: '1154417', con: 'Leo', name: '', ra: 11.06016445, dec: -0.00083005, mag: 5.95, ci: 1.218, },
		    '1198373': { id: '1198373', con: 'Leo', name: '', ra: 11.57846995, dec: 16.79696213, mag: 5.95, ci: -0.156, },
		    '1206463': { id: '1206463', con: 'Cen', name: '', ra: 11.67846711, dec: -53.96860548, mag: 5.95, ci: 1.67, },
		    '1232584': { id: '1232584', con: 'UMa', name: '', ra: 11.9882047, dec: 33.16700226, mag: 5.95, ci: 1.153, },
		    '1240528': { id: '1240528', con: 'Cru', name: '', ra: 12.08256041, dec: -60.96825376, mag: 5.95, ci: 1.691, },
		    '1242481': { id: '1242481', con: 'Mus', name: '', ra: 12.10672843, dec: -65.70818349, mag: 5.95, ci: 0.613, },
		    '1246836': { id: '1246836', con: 'Vir', name: '', ra: 12.16147498, dec: 1.89788963, mag: 5.95, ci: 1.12, },
		    '1267870': { id: '1267870', con: 'Vir', name: '', ra: 12.41993489, dec: -11.61058726, mag: 5.95, ci: 0.043, },
		    '1293132': { id: '1293132', con: 'CVn', name: '', ra: 12.74983446, dec: 39.27891614, mag: 5.95, ci: 0.557, },
		    '1324888': { id: '1324888', con: 'Vir', name: '', ra: 13.16257765, dec: -10.3293275, mag: 5.95, ci: 1.49, },
		    '1388722': { id: '1388722', con: 'Cha', name: '', ra: 13.92746582, dec: -82.66619389, mag: 5.95, ci: 1.411, },
		    '1009860': { id: '1009860', con: 'Ant', name: '', ra: 9.62455592, dec: -36.0959975, mag: 5.96, ci: 1.118, },
		    '1013237': { id: '1013237', con: 'UMa', name: '', ra: 9.6577426, dec: 67.27223035, mag: 5.96, ci: 1.528, },
		    '1115518': { id: '1115518', con: 'Car', name: '', ra: 10.64989487, dec: -58.81685417, mag: 5.96, ci: 1.692, },
		    '1198084': { id: '1198084', con: 'Hya', name: '', ra: 11.57485776, dec: -32.83133644, mag: 5.96, ci: 0.811, },
		    '1276372': { id: '1276372', con: 'Cru', name: '', ra: 12.53225243, dec: -63.50585371, mag: 5.96, ci: 0.263, },
		    '1362148': { id: '1362148', con: 'Cen', name: '', ra: 13.61833599, dec: -44.14320111, mag: 5.96, ci: 0.936, },
		    '1370459': { id: '1370459', con: 'Cen', name: '', ra: 13.71528381, dec: -41.40105438, mag: 5.96, ci: 1.019, },
		    '1371543': { id: '1371543', con: 'Cen', name: '', ra: 13.72780131, dec: -42.06752687, mag: 5.96, ci: -0.075, },
		    '1396123': { id: '1396123', con: 'Cir', name: '', ra: 14.01456865, dec: -66.26890922, mag: 5.96, ci: 0.352, },
		    '1408737': { id: '1408737', con: 'Cen', name: '', ra: 14.15973115, dec: -51.50467613, mag: 5.96, ci: -0.053, },
		    '1437087': { id: '1437087', con: 'Vir', name: '', ra: 14.49736634, dec: 0.82892821, mag: 5.96, ci: 0.159, },
		    '1044064': { id: '1044064', con: 'UMa', name: '', ra: 9.9537806, dec: 57.41819737, mag: 5.97, ci: 0.895, },
		    '1080878': { id: '1080878', con: 'Vel', name: '', ra: 10.30784543, dec: -41.66848818, mag: 5.97, ci: -0.063, },
		    '1120121': { id: '1120121', con: 'Cha', name: '', ra: 10.69764307, dec: -79.78328867, mag: 5.97, ci: -0.071, },
		    '1313859': { id: '1313859', con: 'Com', name: '', ra: 13.01933773, dec: 17.12314564, mag: 5.97, ci: 0.971, },
		    '1346702': { id: '1346702', con: 'Vir', name: '', ra: 13.43650422, dec: -1.19247336, mag: 5.97, ci: 0.183, },
		    '1375903': { id: '1375903', con: 'Boo', name: '', ra: 13.77870076, dec: 25.70223623, mag: 5.97, ci: 0.523, },
		    '1380162': { id: '1380162', con: 'UMa', name: '', ra: 13.82930772, dec: 61.48930662, mag: 5.97, ci: 0.974, },
		    '1488948': { id: '1488948', con: 'Lup', name: '', ra: 15.10922107, dec: -30.91848197, mag: 5.97, ci: -0.076, },
		    '1067406': { id: '1067406', con: 'Vel', name: '', ra: 10.17714401, dec: -41.71524798, mag: 5.98, ci: 1.239, },
		    '1105133': { id: '1105133', con: 'Car', name: '', ra: 10.54661391, dec: -58.66674548, mag: 5.98, ci: 0.29, },
		    '1129948': { id: '1129948', con: 'Car', name: '', ra: 10.80150209, dec: -59.91916106, mag: 5.98, ci: 0.274, },
		    '1210193': { id: '1210193', con: 'Cen', name: '', ra: 11.72421866, dec: -37.19015905, mag: 5.98, ci: 1.449, },
		    '1321895': { id: '1321895', con: 'Cen', name: '', ra: 13.12341773, dec: -59.86046878, mag: 5.98, ci: 0.435, },
		    '1370193': { id: '1370193', con: 'CVn', name: '', ra: 13.71206397, dec: 34.98901981, mag: 5.98, ci: 0.857, },
		    '1396779': { id: '1396779', con: 'Boo', name: '', ra: 14.02234168, dec: 8.89490385, mag: 5.98, ci: 0.089, },
		    '1417871': { id: '1417871', con: 'Boo', name: '', ra: 14.26781688, dec: 18.91179831, mag: 5.98, ci: 0, },
		    '1494119': { id: '1494119', con: 'Lup', name: '', ra: 15.16870114, dec: -38.7925067, mag: 5.98, ci: 0.867, },
		    '1499840': { id: '1499840', con: 'Boo', name: '', ra: 15.23501204, dec: 31.78784435, mag: 5.98, ci: 1.552, },
		    '1017261': { id: '1017261', con: 'Vel', name: '', ra: 9.69664684, dec: -55.2137588, mag: 5.99, ci: -0.119, },
		    '1138830': { id: '1138830', con: 'Car', name: '', ra: 10.89500558, dec: -70.72030352, mag: 5.99, ci: -0.02, },
		    '1147897': { id: '1147897', con: 'UMa', name: '', ra: 10.99244124, dec: 36.09310643, mag: 5.99, ci: 1.595, },
		    '1177138': { id: '1177138', con: 'Car', name: '', ra: 11.32123212, dec: -64.58248915, mag: 5.99, ci: 0.471, },
		    '1290707': { id: '1290707', con: 'Cru', name: '', ra: 12.71921606, dec: -56.17622622, mag: 5.99, ci: -0.074, },
		    '1302162': { id: '1302162', con: 'Cen', name: '', ra: 12.86581375, dec: -39.68042834, mag: 5.99, ci: -0.098, },
		    '1313104': { id: '1313104', con: 'Vir', name: '', ra: 13.00998508, dec: -3.368496, mag: 5.99, ci: 1.119, },
		    '1428568': { id: '1428568', con: 'Lup', name: '', ra: 14.39682845, dec: -53.17624715, mag: 5.99, ci: 1.099, },
		    '1438995': { id: '1438995', con: 'Cen', name: '', ra: 14.51967783, dec: -38.86971058, mag: 5.99, ci: 1.06, },
		    '1082494': { id: '1082494', con: 'UMa', name: '', ra: 10.32410796, dec: 48.3967644, mag: 6, ci: 1.022, },
		    '1096240': { id: '1096240', con: 'Car', name: '', ra: 10.45702316, dec: -65.70466237, mag: 6, ci: 0.091, },
		    '1096317': { id: '1096317', con: 'UMa', name: '', ra: 10.45778876, dec: 41.60103876, mag: 6, ci: 0.166, },
		    '1248653': { id: '1248653', con: 'Cam', name: '', ra: 12.18332965, dec: 81.70982964, mag: 6, ci: 1.618, },
		    '1273911': { id: '1273911', con: 'Cen', name: '', ra: 12.49941297, dec: -41.73590219, mag: 6, ci: 1.515, },
		    '1285081': { id: '1285081', con: 'Crv', name: '', ra: 12.64572573, dec: -18.25010393, mag: 6, ci: 0.31, },
		    '1305129': { id: '1305129', con: 'Vir', name: '', ra: 12.90518321, dec: -11.64857065, mag: 6, ci: 0.068, },
		    '1310739': { id: '1310739', con: 'Dra', name: '', ra: 12.9798135, dec: 75.47249447, mag: 6, ci: 1.03, },
		    '1320535': { id: '1320535', con: 'Com', name: '', ra: 13.10589996, dec: 21.15340517, mag: 6, ci: 0.393, },
		    '1339391': { id: '1339391', con: 'Cen', name: '', ra: 13.34676087, dec: -55.80069283, mag: 6, ci: 0.236, },
		    '1364632': { id: '1364632', con: 'Cen', name: '', ra: 13.64693132, dec: -57.62271912, mag: 6, ci: 1.138, },
		    '1370486': { id: '1370486', con: 'Cen', name: '', ra: 13.7155863, dec: -56.76796893, mag: 6, ci: -0.096, },
		    '1381066': { id: '1381066', con: 'Vir', name: '', ra: 13.84018832, dec: 5.49721766, mag: 6, ci: 0.899, },
		    '1390007': { id: '1390007', con: 'Cen', name: '', ra: 13.9424841, dec: -54.70466522, mag: 6, ci: 0.78, },
		    '1440665': { id: '1440665', con: 'Boo', name: '', ra: 14.53895196, dec: 26.67728063, mag: 6, ci: 0.23, },
		    '1470469': { id: '1470469', con: 'Boo', name: '', ra: 14.88993541, dec: 19.15279881, mag: 6, ci: 0.841, },
		    '1892152': { id: '1892152', con: 'Lyr', name: 'Vega', ra: 18.61560722, dec: 38.78299311, mag: 0.03, ci: -0.001, },
		    '1620181': { id: '1620181', con: 'Sco', name: 'Antares', ra: 16.49012987, dec: -26.43194608, mag: 1.06, ci: 1.865, },
		    '1736373': { id: '1736373', con: 'Sco', name: 'Shaula', ra: 17.56014625, dec: -37.10374835, mag: 1.62, ci: -0.231, },
		    '1860159': { id: '1860159', con: 'Sgr', name: 'Kaus Australis', ra: 18.40287398, dec: -34.3843146, mag: 1.79, ci: -0.031, },
		    '1744036': { id: '1744036', con: 'Sco', name: 'Sargas', ra: 17.62197938, dec: -42.99782155, mag: 1.86, ci: 0.406, },
		    '1652557': { id: '1652557', con: 'TrA', name: 'Atria', ra: 16.81108178, dec: -69.02771555, mag: 1.91, ci: 1.447, },
		    '1939772': { id: '1939772', con: 'Sgr', name: 'Nunki', ra: 18.92108797, dec: -26.29659428, mag: 2.05, ci: -0.134, },
		    '1739115': { id: '1739115', con: 'Oph', name: 'Rasalhague', ra: 17.58222355, dec: 12.56057584, mag: 2.08, ci: 0.155, },
		    '1531073': { id: '1531073', con: 'CrB', name: 'Alphecca', ra: 15.5781082, dec: 26.71491041, mag: 2.22, ci: 0.032, },
		    '1786378': { id: '1786378', con: 'Dra', name: 'Eltanin', ra: 17.943437, dec: 51.488895, mag: 2.24, ci: 1.521, },
		    '1571952': { id: '1571952', con: 'Sco', name: 'Dschubba', ra: 16.005557, dec: -22.62171, mag: 2.29, ci: -0.117, },
		    '1655045': { id: '1655045', con: 'Sco', name: 'Larawag', ra: 16.83605898, dec: -34.29322839, mag: 2.29, ci: 1.144, },
		    '1754884': { id: '1754884', con: 'Sco', name: '', ra: 17.70813327, dec: -39.02992092, mag: 2.39, ci: -0.171, },
		    '1691452': { id: '1691452', con: 'Oph', name: 'Sabik', ra: 17.172968, dec: -15.72491, mag: 2.43, ci: 0.059, },
		    '1633277': { id: '1633277', con: 'Oph', name: '', ra: 16.619316, dec: -10.56709, mag: 2.54, ci: 0.038, },
		    '1579861': { id: '1579861', con: 'Sco', name: 'Acrab', ra: 16.09062, dec: -19.805453, mag: 2.56, ci: -0.065, },
		    '1958706': { id: '1958706', con: 'Sgr', name: 'Ascella', ra: 19.043532, dec: -29.880105, mag: 2.6, ci: 0.062, },
		    '1504124': { id: '1504124', con: 'Lib', name: 'Zubeneschamali', ra: 15.283449, dec: -9.382917, mag: 2.61, ci: -0.071, },
		    '1546069': { id: '1546069', con: 'Ser', name: 'Unukalhai', ra: 15.737798, dec: 6.425627, mag: 2.63, ci: 1.167, },
		    '1730564': { id: '1730564', con: 'Sco', name: 'Lesath', ra: 17.51273196, dec: -37.29581257, mag: 2.7, ci: -0.179, },
		    '1851931': { id: '1851931', con: 'Sgr', name: 'Kaus Media', ra: 18.34990047, dec: -29.8281024, mag: 2.72, ci: 1.38, },
		    '1594252': { id: '1594252', con: 'Oph', name: 'Yed Prior', ra: 16.239094, dec: -3.694323, mag: 2.73, ci: 1.584, },
		    '1610738': { id: '1610738', con: 'Dra', name: 'Athebyne', ra: 16.39986, dec: 61.514213, mag: 2.73, ci: 0.91, },
		    '1756859': { id: '1756859', con: 'Oph', name: 'Cebalrai', ra: 17.72454241, dec: 4.56730027, mag: 2.76, ci: 1.168, },
		    '1621525': { id: '1621525', con: 'Her', name: 'Kornephoros', ra: 16.503668, dec: 21.489613, mag: 2.78, ci: 0.947, },
		    '1699111': { id: '1699111', con: 'Her', name: 'Rasalgethi', ra: 17.24412575, dec: 14.39036763, mag: 2.78, ci: 1.164, },
		    '1729878': { id: '1729878', con: 'Dra', name: 'Rastaban', ra: 17.507213, dec: 52.301387, mag: 2.79, ci: 0.954, },
		    '1531762': { id: '1531762', con: 'Lup', name: '', ra: 15.58566887, dec: -41.16678306, mag: 2.8, ci: -0.216, },
		    '1640223': { id: '1640223', con: 'Her', name: '', ra: 16.688113, dec: 31.602726, mag: 2.81, ci: 0.65, },
		    '1631184': { id: '1631184', con: 'Sco', name: 'Paikauhale', ra: 16.59804256, dec: -28.21601356, mag: 2.82, ci: -0.206, },
		    '1869896': { id: '1869896', con: 'Sgr', name: 'Kaus Borealis', ra: 18.46617795, dec: -25.42170006, mag: 2.82, ci: 1.025, },
		    '1563802': { id: '1563802', con: 'TrA', name: '', ra: 15.919083, dec: -63.430727, mag: 2.83, ci: 0.315, },
		    '1719402': { id: '1719402', con: 'Ara', name: '', ra: 17.42166377, dec: -55.52988502, mag: 2.84, ci: 1.479, },
		    '1732725': { id: '1732725', con: 'Ara', name: '', ra: 17.53069193, dec: -49.87614279, mag: 2.84, ci: -0.136, },
		    '1506959': { id: '1506959', con: 'TrA', name: '', ra: 15.31516216, dec: -68.67954332, mag: 2.87, ci: 0.014, },
		    '1977196': { id: '1977196', con: 'Sgr', name: 'Albaldah', ra: 19.162731, dec: -21.023615, mag: 2.88, ci: 0.377, },
		    '1569628': { id: '1569628', con: 'Sco', name: 'Fang', ra: 15.980865, dec: -26.114105, mag: 2.89, ci: -0.18, },
		    '1605930': { id: '1605930', con: 'Sco', name: 'Alniyat', ra: 16.35314238, dec: -25.59280657, mag: 2.9, ci: 0.299, },
		    '1810796': { id: '1810796', con: 'Sgr', name: 'Alnasl', ra: 18.09680182, dec: -30.42409858, mag: 2.98, ci: 0.981, },
		    '1765472': { id: '1765472', con: 'Sco', name: '', ra: 17.79307811, dec: -40.12699529, mag: 2.99, ci: 0.509, },
		    '1965965': { id: '1965965', con: 'Aql', name: 'Okab', ra: 19.09016881, dec: 13.86347684, mag: 2.99, ci: 0.014, },
		    '1509654': { id: '1509654', con: 'UMi', name: 'Pherkad', ra: 15.345483, dec: 71.834016, mag: 3, ci: 0.058, },
		    '1657873': { id: '1657873', con: 'Sco', name: 'Xamidimura', ra: 16.864509, dec: -38.04738, mag: 3, ci: -0.2, },
		    '1984515': { id: '1984515', con: 'Dra', name: 'Altais', ra: 19.2092499, dec: 67.66154123, mag: 3.07, ci: 0.99, },
		    '1842810': { id: '1842810', con: 'Sgr', name: '', ra: 18.29378698, dec: -36.76168819, mag: 3.1, ci: 1.582, },
		    '1669624': { id: '1669624', con: 'Ara', name: '', ra: 16.97700366, dec: -55.99014141, mag: 3.12, ci: 1.552, },
		    '1699761': { id: '1699761', con: 'Her', name: 'Sarin', ra: 17.25053089, dec: 24.83920293, mag: 3.12, ci: 0.08, },
		    '1699785': { id: '1699785', con: 'Her', name: '', ra: 17.25078708, dec: 36.80916352, mag: 3.16, ci: 1.437, },
		    '1688572': { id: '1688572', con: 'Dra', name: 'Aldhibah', ra: 17.146448, dec: 65.714683, mag: 3.17, ci: -0.12, },
		    '1914343': { id: '1914343', con: 'Sgr', name: '', ra: 18.76094075, dec: -26.99077697, mag: 3.17, ci: -0.107, },
		    '1668004': { id: '1668004', con: 'Oph', name: '', ra: 16.9611381, dec: 9.37503097, mag: 3.19, ci: 1.16, },
		    '1770449': { id: '1770449', con: 'Sco', name: 'Fuyue', ra: 17.83096789, dec: -37.04330034, mag: 3.19, ci: 1.192, },
		    '1510619': { id: '1510619', con: 'Lup', name: '', ra: 15.35620153, dec: -40.6475107, mag: 3.22, ci: -0.227, },
		    '1600859': { id: '1600859', con: 'Oph', name: 'Yed Posterior', ra: 16.305358, dec: -4.692511, mag: 3.23, ci: 0.966, },
		    '1852788': { id: '1852788', con: 'Ser', name: '', ra: 18.35516681, dec: -2.89882468, mag: 3.23, ci: 0.941, },
		    '1949264': { id: '1949264', con: 'Lyr', name: 'Sulafat', ra: 18.98239517, dec: 32.68955708, mag: 3.25, ci: -0.049, },
		    '1712828': { id: '1712828', con: 'Oph', name: '', ra: 17.366827, dec: -24.999545, mag: 3.27, ci: -0.186, },
		    '1515856': { id: '1515856', con: 'Dra', name: 'Edasich', ra: 15.4154929, dec: 58.96606176, mag: 3.29, ci: 1.166, },
		    '1719590': { id: '1719590', con: 'Ara', name: '', ra: 17.423239, dec: -56.377727, mag: 3.31, ci: -0.15, },
		    '1694599': { id: '1694599', con: 'Sco', name: '', ra: 17.20255354, dec: -43.2391912, mag: 3.32, ci: 0.441, },
		    '1792720': { id: '1792720', con: 'Oph', name: '', ra: 17.98377542, dec: -9.7736295, mag: 3.32, ci: 0.987, },
		    '1969933': { id: '1969933', con: 'Sgr', name: '', ra: 19.11566829, dec: -27.67042392, mag: 3.32, ci: 1.169, },
		    '1512521': { id: '1512521', con: 'Lup', name: '', ra: 15.37802038, dec: -44.68962812, mag: 3.37, ci: -0.191, },
		    '1571655': { id: '1571655', con: 'Lup', name: '', ra: 16.00203541, dec: -38.3967029, mag: 3.42, ci: -0.206, },
		    '1763009': { id: '1763009', con: 'Her', name: '', ra: 17.77430961, dec: 27.72067433, mag: 3.42, ci: 0.75, },
		    '1968094': { id: '1968094', con: 'Aql', name: '', ra: 19.10415, dec: -4.882554, mag: 3.43, ci: -0.096, },
		    '1501875': { id: '1501875', con: 'Boo', name: '', ra: 15.25837856, dec: 33.31483226, mag: 3.46, ci: 0.961, },
		    '1642954': { id: '1642954', con: 'Her', name: '', ra: 16.7149347, dec: 38.92225677, mag: 3.48, ci: 0.916, },
		    '1867342': { id: '1867342', con: 'Tel', name: '', ra: 18.44955985, dec: -45.96846635, mag: 3.49, ci: -0.179, },
		    '1925862': { id: '1925862', con: 'Lyr', name: 'Sheliak', ra: 18.83466512, dec: 33.36266874, mag: 3.52, ci: 0.003, },
		    '1946081': { id: '1946081', con: 'Sgr', name: '', ra: 18.962167, dec: -21.10665345, mag: 3.52, ci: 1.151, },
		    '1554954': { id: '1554954', con: 'Ser', name: '', ra: 15.827002, dec: -3.430208, mag: 3.54, ci: -0.036, },
		    '1744620': { id: '1744620', con: 'Ser', name: '', ra: 17.62644484, dec: -15.39855661, mag: 3.54, ci: 0.262, },
		    '1852081': { id: '1852081', con: 'Dra', name: '', ra: 18.350736, dec: 72.732843, mag: 3.55, ci: 0.489, },
		    '1658655': { id: '1658655', con: 'Sco', name: 'Pipirima', ra: 16.87226237, dec: -38.01753493, mag: 3.56, ci: -0.21, },
		    '1511236': { id: '1511236', con: 'Lup', name: '', ra: 15.36343616, dec: -36.26137509, mag: 3.57, ci: 1.534, },
		    '1534623': { id: '1534623', con: 'Lib', name: '', ra: 15.61706954, dec: -28.13507606, mag: 3.6, ci: 1.361, },
		    '1731202': { id: '1731202', con: 'Ara', name: '', ra: 17.518308, dec: -60.68384975, mag: 3.6, ci: -0.104, },
		    '1761579': { id: '1761579', con: 'Pav', name: '', ra: 17.76221838, dec: -64.72387503, mag: 3.61, ci: 1.161, },
		    '1662549': { id: '1662549', con: 'Sco', name: '', ra: 16.90972398, dec: -42.36131128, mag: 3.62, ci: 1.393, },
		    '1549241': { id: '1549241', con: 'Ser', name: '', ra: 15.76979321, dec: 15.42181924, mag: 3.65, ci: 0.073, },
		    '1812871': { id: '1812871', con: 'Ara', name: '', ra: 18.11052002, dec: -50.09148467, mag: 3.65, ci: -0.101, },
		    '1520353': { id: '1520353', con: 'CrB', name: 'Nusakan', ra: 15.46381429, dec: 29.10569774, mag: 3.66, ci: 0.319, },
		    '1537189': { id: '1537189', con: 'Lib', name: '', ra: 15.64427, dec: -29.777754, mag: 3.66, ci: -0.177, },
		    '1789344': { id: '1789344', con: 'Her', name: '', ra: 17.9627464, dec: 29.24787829, mag: 3.7, ci: 0.935, },
		    '1556907': { id: '1556907', con: 'Ser', name: '', ra: 15.84693517, dec: 4.47773211, mag: 3.71, ci: 0.147, },
		    '1814751': { id: '1814751', con: 'Oph', name: '', ra: 18.122496, dec: 9.563847, mag: 3.71, ci: 0.159, },
		    '1779064': { id: '1779064', con: 'Dra', name: 'Grumium', ra: 17.89214733, dec: 56.8726474, mag: 3.73, ci: 1.177, },
		    '1607186': { id: '1607186', con: 'Her', name: '', ra: 16.365338, dec: 19.15313, mag: 3.74, ci: 0.299, },
		    '1766141': { id: '1766141', con: 'Oph', name: '', ra: 17.7982113, dec: 2.70727672, mag: 3.75, ci: 0.043, },
		    '1964061': { id: '1964061', con: 'Sgr', name: '', ra: 19.07805048, dec: -21.7414935, mag: 3.76, ci: 1.012, },
		    '1654424': { id: '1654424', con: 'Ara', name: '', ra: 16.82976548, dec: -59.04137698, mag: 3.77, ci: 1.562, },
		    '1531256': { id: '1531256', con: 'Ser', name: '', ra: 15.5800407, dec: 10.53889165, mag: 3.8, ci: 0.268, },
		    '1996759': { id: '1996759', con: 'Cyg', name: '', ra: 19.28504694, dec: 53.36845789, mag: 3.8, ci: 0.95, },
		    '1543652': { id: '1543652', con: 'CrB', name: '', ra: 15.71238144, dec: 26.29562122, mag: 3.81, ci: 0.02, },
		    '1622717': { id: '1622717', con: 'Oph', name: 'Marfik', ra: 16.51523187, dec: 1.98395581, mag: 3.82, ci: 0.022, },
		    '1748451': { id: '1748451', con: 'Her', name: '', ra: 17.6577457, dec: 46.00632921, mag: 3.82, ci: -0.179, },
		    '1815294': { id: '1815294', con: 'Her', name: '', ra: 18.12570865, dec: 28.76248822, mag: 3.84, ci: -0.018, },
		    '1832169': { id: '1832169', con: 'Sgr', name: 'Polis', ra: 18.229392, dec: -21.058834, mag: 3.84, ci: 0.195, },
		    '1565898': { id: '1565898', con: 'Ser', name: '', ra: 15.940882, dec: 15.661617, mag: 3.85, ci: 0.478, },
		    '1858948': { id: '1858948', con: 'Her', name: '', ra: 18.39496968, dec: 21.76974973, mag: 3.85, ci: 1.168, },
		    '1888020': { id: '1888020', con: 'Sct', name: '', ra: 18.58678517, dec: -8.24406995, mag: 3.85, ci: 1.317, },
		    '1596098': { id: '1596098', con: 'TrA', name: '', ra: 16.25729747, dec: -63.6856802, mag: 3.86, ci: 1.105, },
		    '1627015': { id: '1627015', con: 'Aps', name: '', ra: 16.55752293, dec: -78.897149, mag: 3.86, ci: 0.923, },
		    '1785490': { id: '1785490', con: 'Her', name: '', ra: 17.93755023, dec: 37.2505392, mag: 3.86, ci: 1.35, },
		    '1566583': { id: '1566583', con: 'Sco', name: 'Iklil', ra: 15.94807653, dec: -29.21407343, mag: 3.87, ci: -0.199, },
		    '1532313': { id: '1532313', con: 'Lib', name: 'Zubenelhakrabi', ra: 15.592105, dec: -14.789537, mag: 3.91, ci: 1.007, },
		    '1603378': { id: '1603378', con: 'Her', name: '', ra: 16.32901042, dec: 46.31336906, mag: 3.91, ci: -0.151, },
		    '1672659': { id: '1672659', con: 'Her', name: '', ra: 17.00482605, dec: 30.92640766, mag: 3.92, ci: -0.018, },
		    '1581994': { id: '1581994', con: 'Sco', name: '', ra: 16.113452, dec: -20.669192, mag: 3.93, ci: -0.046, },
		    '1797155': { id: '1797155', con: 'Oph', name: '', ra: 18.01075442, dec: 2.93156477, mag: 3.93, ci: 0.029, },
		    '1557133': { id: '1557133', con: 'Lup', name: '', ra: 15.84931577, dec: -33.62717361, mag: 3.97, ci: -0.045, },
		    '1590330': { id: '1590330', con: 'Sco', name: 'Jabbah', ra: 16.199926, dec: -19.460708, mag: 4, ci: 0.076, },
		    '1574377': { id: '1574377', con: 'Dra', name: '', ra: 16.0314853, dec: 58.5652533, mag: 4.01, ci: 0.528, },
		    '1603554': { id: '1603554', con: 'Nor', name: '', ra: 16.33067317, dec: -50.15550924, mag: 4.01, ci: 1.08, },
		    '1907306': { id: '1907306', con: 'Pav', name: '', ra: 18.7172599, dec: -71.4281107, mag: 4.01, ci: 1.134, },
		    '1951017': { id: '1951017', con: 'Aql', name: '', ra: 18.99371056, dec: 15.0682972, mag: 4.02, ci: 1.082, },
		    '1956251': { id: '1956251', con: 'Aql', name: '', ra: 19.02800761, dec: -5.73911695, mag: 4.02, ci: 1.079, },
		    '1809872': { id: '1809872', con: 'Oph', name: '', ra: 18.09093627, dec: 2.49979492, mag: 4.03, ci: 0.86, },
		    '1671358': { id: '1671358', con: 'Ara', name: '', ra: 16.99306873, dec: -53.16044073, mag: 4.06, ci: 1.452, },
		    '1504889': { id: '1504889', con: 'Cir', name: '', ra: 15.291917, dec: -58.801208, mag: 4.07, ci: 0.088, },
		    '1939955': { id: '1939955', con: 'Lyr', name: '', ra: 18.9222504, dec: 43.94609071, mag: 4.08, ci: 1.397, },
		    '1553435': { id: '1553435', con: 'Ser', name: 'Gudja', ra: 15.81232686, dec: 18.14156492, mag: 4.09, ci: 1.616, },
		    '1872069': { id: '1872069', con: 'Tel', name: '', ra: 18.48051647, dec: -49.07058505, mag: 4.1, ci: 0.995, },
		    '1977888': { id: '1977888', con: 'CrA', name: '', ra: 19.16715492, dec: -39.34079447, mag: 4.1, ci: 1.163, },
		    '1534163': { id: '1534163', con: 'TrA', name: '', ra: 15.61200614, dec: -66.31703907, mag: 4.11, ci: 1.161, },
		    '1976434': { id: '1976434', con: 'CrA', name: 'Meridiana', ra: 19.15787258, dec: -37.90447819, mag: 4.11, ci: 0.042, },
		    '1561678': { id: '1561678', con: 'Lib', name: '', ra: 15.89709401, dec: -16.72929324, mag: 4.13, ci: 1.003, },
		    '1528372': { id: '1528372', con: 'CrB', name: '', ra: 15.54882831, dec: 31.35912981, mag: 4.14, ci: -0.127, },
		    '1567659': { id: '1567659', con: 'CrB', name: '', ra: 15.95979166, dec: 26.87787278, mag: 4.14, ci: 1.231, },
		    '1716130': { id: '1716130', con: 'Her', name: '', ra: 17.394708, dec: 37.145946, mag: 4.15, ci: -0.011, },
		    '1721505': { id: '1721505', con: 'Oph', name: '', ra: 17.43950464, dec: -24.17530784, mag: 4.16, ci: 0.283, },
		    '1631984': { id: '1631984', con: 'Sco', name: '', ra: 16.6062423, dec: -35.2553257, mag: 4.18, ci: 1.535, },
		    '1914354': { id: '1914354', con: 'Her', name: '', ra: 18.76103487, dec: 20.54630642, mag: 4.19, ci: 0.483, },
		    '1628126': { id: '1628126', con: 'Her', name: '', ra: 16.56838343, dec: 42.43702714, mag: 4.2, ci: -0.013, },
		    '1648185': { id: '1648185', con: 'UMi', name: '', ra: 16.76618031, dec: 82.03725358, mag: 4.21, ci: 0.897, },
		    '1581654': { id: '1581654', con: 'Lup', name: '', ra: 16.10987304, dec: -36.80228417, mag: 4.22, ci: -0.184, },
		    '1615993': { id: '1615993', con: 'Oph', name: '', ra: 16.450399, dec: -18.456251, mag: 4.22, ci: 0.217, },
		    '1851317': { id: '1851317', con: 'Dra', name: '', ra: 18.34594906, dec: 71.33780684, mag: 4.22, ci: -0.093, },
		    '1918340': { id: '1918340', con: 'Sct', name: '', ra: 18.78624257, dec: -4.74786905, mag: 4.22, ci: 1.087, },
		    '1931715': { id: '1931715', con: 'Pav', name: '', ra: 18.870288, dec: -62.187593, mag: 4.22, ci: -0.15, },
		    '1937728': { id: '1937728', con: 'Lyr', name: '', ra: 18.90841214, dec: 36.89861113, mag: 4.22, ci: 1.575, },
		    '1585110': { id: '1585110', con: 'Her', name: '', ra: 16.14616023, dec: 44.9349181, mag: 4.23, ci: -0.045, },
		    '1643286': { id: '1643286', con: 'Aps', name: '', ra: 16.71796, dec: -77.51743677, mag: 4.23, ci: 1.06, },
		    '1968557': { id: '1968557', con: 'CrA', name: '', ra: 19.10698612, dec: -37.06349317, mag: 4.23, ci: 0.523, },
		    '1623469': { id: '1623469', con: 'Sco', name: '', ra: 16.52303705, dec: -34.70436902, mag: 4.24, ci: -0.168, },
		    '1752626': { id: '1752626', con: 'Ser', name: '', ra: 17.69024238, dec: -12.87530581, mag: 4.24, ci: 0.086, },
		    '1742451': { id: '1742451', con: 'Sco', name: '', ra: 17.60912236, dec: -38.635355, mag: 4.26, ci: 1.075, },
		    '1799483': { id: '1799483', con: 'Her', name: '', ra: 18.02511327, dec: 21.5957774, mag: 4.26, ci: 0.406, },
		    '1506323': { id: '1506323', con: 'Lup', name: '', ra: 15.30888616, dec: -47.87519956, mag: 4.27, ci: -0.086, },
		    '1723545': { id: '1723545', con: 'Oph', name: '', ra: 17.45590941, dec: -29.86703242, mag: 4.28, ci: 0.402, },
		    '1545725': { id: '1545725', con: 'UMi', name: '', ra: 15.734299, dec: 77.794493, mag: 4.29, ci: 0.038, },
		    '1623087': { id: '1623087', con: 'Oph', name: '', ra: 16.51899099, dec: -16.61273106, mag: 4.29, ci: 0.924, },
		    '1515210': { id: '1515210', con: 'Boo', name: 'Alkalurops', ra: 15.40817453, dec: 37.3771697, mag: 4.31, ci: 0.309, },
		    '1582955': { id: '1582955', con: 'Sco', name: '', ra: 16.12342426, dec: -20.86876363, mag: 4.31, ci: 0.831, },
		    '1710584': { id: '1710584', con: 'Ser', name: '', ra: 17.34712792, dec: -12.84688063, mag: 4.32, ci: 0.037, },
		    '1700333': { id: '1700333', con: 'Oph', name: 'Guniibuu', ra: 17.255836, dec: -26.602829, mag: 4.33, ci: 0.855, },
		    '1818119': { id: '1818119', con: 'Pav', name: '', ra: 18.14300365, dec: -63.66853771, mag: 4.33, ci: 0.228, },
		    '1848916': { id: '1848916', con: 'Lyr', name: '', ra: 18.33103051, dec: 36.0645453, mag: 4.33, ci: 1.162, },
		    '1536227': { id: '1536227', con: 'Lup', name: '', ra: 15.63422319, dec: -42.56734635, mag: 4.34, ci: 1.412, },
		    '1721819': { id: '1721819', con: 'Oph', name: '', ra: 17.44191125, dec: 4.14035686, mag: 4.34, ci: 1.48, },
		    '1911989': { id: '1911989', con: 'Lyr', name: '', ra: 18.74620956, dec: 37.60511039, mag: 4.34, ci: 0.192, },
		    '1917920': { id: '1917920', con: 'Her', name: '', ra: 18.78368528, dec: 18.18151474, mag: 4.34, ci: 0.148, },
		    '1505350': { id: '1505350', con: 'Lup', name: '', ra: 15.29717724, dec: -30.14867667, mag: 4.35, ci: 1.1, },
		    '1733502': { id: '1733502', con: 'UMi', name: 'Yildun', ra: 17.53694102, dec: 86.58646256, mag: 4.35, ci: 0.021, },
		    '1857696': { id: '1857696', con: 'Pav', name: '', ra: 18.38711828, dec: -61.4939018, mag: 4.35, ci: 1.462, },
		    '1994807': { id: '1994807', con: 'Lyr', name: '', ra: 19.27280378, dec: 38.13373018, mag: 4.35, ci: 1.258, },
		    '1818591': { id: '1818591', con: 'Her', name: '', ra: 18.14596968, dec: 20.81455574, mag: 4.37, ci: -0.164, },
		    '1661524': { id: '1661524', con: 'Oph', name: '', ra: 16.90013102, dec: 10.16536115, mag: 4.39, ci: -0.088, },
		    '1710946': { id: '1710946', con: 'Oph', name: '', ra: 17.350101, dec: -21.112933, mag: 4.39, ci: 0.394, },
		    '1944137': { id: '1944137', con: 'Pav', name: '', ra: 18.94917457, dec: -67.23349812, mag: 4.4, ci: 0.53, },
		    '1730521': { id: '1730521', con: 'Her', name: 'Maasym', ra: 17.51230828, dec: 26.1106477, mag: 4.41, ci: 1.434, },
		    '1791309': { id: '1791309', con: 'Her', name: '', ra: 17.97504148, dec: 30.18928273, mag: 4.41, ci: 0.38, },
		    '1549660': { id: '1549660', con: 'Ser', name: '', ra: 15.77405929, dec: 7.3530724, mag: 4.42, ci: 0.604, },
		    '1800152': { id: '1800152', con: 'Oph', name: '', ra: 18.02922196, dec: 1.30506816, mag: 4.42, ci: 0.046, },
		    '1987904': { id: '1987904', con: 'Lyr', name: 'Aladfar', ra: 19.22930203, dec: 39.14596968, mag: 4.43, ci: -0.15, },
		    '1624750': { id: '1624750', con: 'Oph', name: '', ra: 16.535611, dec: -21.46639, mag: 4.45, ci: 0.13, },
		    '1992717': { id: '1992717', con: 'Dra', name: '', ra: 19.25916979, dec: 73.3554735, mag: 4.45, ci: 1.257, },
		    '1616268': { id: '1616268', con: 'Nor', name: '', ra: 16.45306554, dec: -47.55479139, mag: 4.46, ci: -0.07, },
		    '1513551': { id: '1513551', con: 'Cir', name: '', ra: 15.389625, dec: -59.320787, mag: 4.48, ci: 0.169, },
		    '1610915': { id: '1610915', con: 'Oph', name: '', ra: 16.4017173, dec: -20.03732496, mag: 4.48, ci: 0.996, },
		    '1541794': { id: '1541794', con: 'Ser', name: '', ra: 15.6925154, dec: 19.67040458, mag: 4.51, ci: 0.062, },
		    '1825222': { id: '1825222', con: 'Tel', name: '', ra: 18.18715562, dec: -45.95441762, mag: 4.52, ci: 1.009, },
		    '1722038': { id: '1722038', con: 'Oph', name: '', ra: 17.443856, dec: -5.086596, mag: 4.53, ci: 0.385, },
		    '1765413': { id: '1765413', con: 'Sgr', name: '', ra: 17.7926735, dec: -27.83079164, mag: 4.53, ci: 0.6, },
		    '1513222': { id: '1513222', con: 'Lup', name: '', ra: 15.38593073, dec: -36.85849088, mag: 4.54, ci: -0.155, },
		    '1532861': { id: '1532861', con: 'Lup', name: '', ra: 15.59812489, dec: -44.9583459, mag: 4.55, ci: -0.175, },
		    '1604965': { id: '1604965', con: 'Sco', name: '', ra: 16.34393878, dec: -24.16932398, mag: 4.55, ci: 0.758, },
		    '1816745': { id: '1816745', con: 'Sgr', name: '', ra: 18.1347162, dec: -28.45709441, mag: 4.55, ci: 0.938, },
		    '1740637': { id: '1740637', con: 'Ara', name: '', ra: 17.5943311, dec: -46.50568316, mag: 4.56, ci: -0.02, },
		    '1613233': { id: '1613233', con: 'Her', name: 'Cujam', ra: 16.42359859, dec: 14.03327273, mag: 4.57, ci: 0.002, },
		    '1613517': { id: '1613517', con: 'Oph', name: '', ra: 16.42642843, dec: -23.44719629, mag: 4.57, ci: 0.227, },
		    '1753735': { id: '1753735', con: 'Dra', name: 'Dziban', ra: 17.6989871, dec: 72.148847, mag: 4.57, ci: 0.434, },
		    '1938405': { id: '1938405', con: 'Her', name: '', ra: 18.91246786, dec: 22.64507578, mag: 4.57, ci: 0.782, },
		    '1973614': { id: '1973614', con: 'CrA', name: '', ra: 19.13915841, dec: -40.49669605, mag: 4.57, ci: 1.07, },
		    '1590836': { id: '1590836', con: 'Sco', name: '', ra: 16.20505695, dec: -27.92637613, mag: 4.58, ci: -0.172, },
		    '1745161': { id: '1745161', con: 'Oph', name: '', ra: 17.6307538, dec: -8.11876693, mag: 4.58, ci: 0.132, },
		    '1554914': { id: '1554914', con: 'CrB', name: '', ra: 15.82656865, dec: 26.068393, mag: 4.59, ci: 0.794, },
		    '1561338': { id: '1561338', con: 'Sco', name: '', ra: 15.89353281, dec: -25.32713753, mag: 4.59, ci: -0.073, },
		    '1910941': { id: '1910941', con: 'Lyr', name: '', ra: 18.73968517, dec: 39.6127459, mag: 4.59, ci: 0.18, },
		    '1516466': { id: '1516466', con: 'Lup', name: '', ra: 15.42228242, dec: -38.73362687, mag: 4.6, ci: 0, },
		    '1559881': { id: '1559881', con: 'Her', name: '', ra: 15.87792851, dec: 42.45151818, mag: 4.6, ci: 0.563, },
		    '1530295': { id: '1530295', con: 'Lib', name: '', ra: 15.56963942, dec: -10.06452979, mag: 4.61, ci: 1, },
		    '1617365': { id: '1617365', con: 'Oph', name: '', ra: 16.46338346, dec: -8.37167379, mag: 4.62, ci: 0.185, },
		    '1796755': { id: '1796755', con: 'Ser', name: '', ra: 18.00805847, dec: -3.69027123, mag: 4.62, ci: 0.39, },
		    '1883853': { id: '1883853', con: 'CrA', name: '', ra: 18.55838469, dec: -42.31250882, mag: 4.62, ci: 0.994, },
		    '1942320': { id: '1942320', con: 'Ser', name: 'Alya', ra: 18.93699637, dec: 4.20359728, mag: 4.62, ci: 0.161, },
		    '1557163': { id: '1557163', con: 'Sco', name: '', ra: 15.8496512, dec: -25.75129441, mag: 4.63, ci: -0.072, },
		    '1576872': { id: '1576872', con: 'Nor', name: '', ra: 16.05891486, dec: -57.77506378, mag: 4.63, ci: 0.252, },
		    '1878407': { id: '1878407', con: 'Pav', name: '', ra: 18.52289616, dec: -62.27830805, mag: 4.63, ci: -0.116, },
		    '1928944': { id: '1928944', con: 'Dra', name: '', ra: 18.85336061, dec: 59.38834934, mag: 4.63, ci: 1.185, },
		    '1538327': { id: '1538327', con: 'CrB', name: '', ra: 15.656299, dec: 36.635812, mag: 4.64, ci: -0.103, },
		    '1541216': { id: '1541216', con: 'Lup', name: '', ra: 15.68649371, dec: -44.66120584, mag: 4.64, ci: 0.413, },
		    '1654490': { id: '1654490', con: 'Oph', name: '', ra: 16.83056353, dec: -10.78303255, mag: 4.64, ci: 0.478, },
		    '1704641': { id: '1704641', con: 'Her', name: '', ra: 17.2945151, dec: 37.29149097, mag: 4.64, ci: 0.043, },
		    '1814641': { id: '1814641', con: 'Oph', name: '', ra: 18.12176663, dec: 8.7338679, mag: 4.64, ci: 0.951, },
		    '1576393': { id: '1576393', con: 'Nor', name: '', ra: 16.05358278, dec: -49.22969901, mag: 4.65, ci: 0.902, },
		    '1538946': { id: '1538946', con: 'Lup', name: '', ra: 15.66277151, dec: -34.41192278, mag: 4.66, ci: 0.964, },
		    '1808736': { id: '1808736', con: 'Sgr', name: '', ra: 18.08367356, dec: -29.58008828, mag: 4.66, ci: 0.774, },
		    '1843950': { id: '1843950', con: 'Sgr', name: '', ra: 18.3008868, dec: -27.04264383, mag: 4.66, ci: 1.629, },
		    '1858853': { id: '1858853', con: 'Sct', name: '', ra: 18.39432855, dec: -8.93440847, mag: 4.66, ci: 0.932, },
		    '1795551': { id: '1795551', con: 'Her', name: '', ra: 18.00094868, dec: 16.75091743, mag: 4.67, ci: 1.254, },
		    '1872985': { id: '1872985', con: 'Sct', name: '', ra: 18.48662592, dec: -14.56581214, mag: 4.67, ci: 0.076, },
		    '1910837': { id: '1910837', con: 'Lyr', name: '', ra: 18.738984, dec: 39.670123, mag: 4.67, ci: 0.17, },
		    '1604467': { id: '1604467', con: 'Aps', name: '', ra: 16.33911185, dec: -78.69574141, mag: 4.68, ci: 1.68, },
		    '1661495': { id: '1661495', con: 'Sco', name: '', ra: 16.89992404, dec: -42.36202508, mag: 4.7, ci: 0.444, },
		    '1905285': { id: '1905285', con: 'Sct', name: '', ra: 18.70456312, dec: -9.0525494, mag: 4.7, ci: 0.358, },
		    '1575766': { id: '1575766', con: 'Her', name: '', ra: 16.04663791, dec: 46.03669958, mag: 4.72, ci: -0.094, },
		    '1702667': { id: '1702667', con: 'Oph', name: '', ra: 17.27685758, dec: -0.445297, mag: 4.72, ci: 1.119, },
		    '1581496': { id: '1581496', con: 'Nor', name: '', ra: 16.10817362, dec: -45.17321012, mag: 4.73, ci: 0.23, },
		    '1585430': { id: '1585430', con: 'CrB', name: '', ra: 16.14952491, dec: 36.49092289, mag: 4.73, ci: 1.015, },
		    '1557642': { id: '1557642', con: 'Ser', name: '', ra: 15.85441917, dec: 20.97791955, mag: 4.74, ci: 1.534, },
		    '1794815': { id: '1794815', con: 'Sgr', name: '', ra: 17.99654278, dec: -23.81612685, mag: 4.74, ci: -0.03, },
		    '1960021': { id: '1960021', con: 'CrA', name: '', ra: 19.05191058, dec: -42.09510289, mag: 4.74, ci: -0.027, },
		    '1542426': { id: '1542426', con: 'Lib', name: '', ra: 15.69910992, dec: -19.67882583, mag: 4.75, ci: 1.574, },
		    '1543571': { id: '1543571', con: 'Lup', name: '', ra: 15.71139437, dec: -34.71040422, mag: 4.75, ci: -0.151, },
		    '1712790': { id: '1712790', con: 'Aps', name: '', ra: 17.36652147, dec: -67.77066774, mag: 4.76, ci: 1.194, },
		    '1750470': { id: '1750470', con: 'Ara', name: '', ra: 17.67328544, dec: -49.41558601, mag: 4.76, ci: 0.415, },
		    '1994398': { id: '1994398', con: 'Vul', name: '', ra: 19.27028908, dec: 21.3904264, mag: 4.76, ci: -0.058, },
		    '1743243': { id: '1743243', con: 'Dra', name: '', ra: 17.61585954, dec: 68.75796949, mag: 4.77, ci: 0.43, },
		    '1803620': { id: '1803620', con: 'Oph', name: '', ra: 18.05135558, dec: -8.18034956, mag: 4.77, ci: 0.41, },
		    '1881510': { id: '1881510', con: 'Dra', name: '', ra: 18.54292347, dec: 57.0455989, mag: 4.77, ci: 0.611, },
		    '1731827': { id: '1731827', con: 'Oph', name: '', ra: 17.52359811, dec: -23.96264277, mag: 4.78, ci: 0.016, },
		    '1771163': { id: '1771163', con: 'Sco', name: '', ra: 17.83641991, dec: -40.090434, mag: 4.78, ci: 0.259, },
		    '1913799': { id: '1913799', con: 'Pav', name: '', ra: 18.75747285, dec: -64.87125755, mag: 4.78, ci: 0.199, },
		    '1557586': { id: '1557586', con: 'CrB', name: '', ra: 15.8538699, dec: 35.65738425, mag: 4.79, ci: 0.996, },
		    '1621506': { id: '1621506', con: 'Sco', name: '', ra: 16.50346542, dec: -25.11522081, mag: 4.79, ci: -0.116, },
		    '1768938': { id: '1768938', con: 'Sco', name: '', ra: 17.81957695, dec: -31.70320547, mag: 4.79, ci: -0.028, },
		    '1796172': { id: '1796172', con: 'Oph', name: '', ra: 18.00438852, dec: 4.36861876, mag: 4.79, ci: -0.1, },
		    '1600818': { id: '1600818', con: 'Sco', name: '', ra: 16.30497209, dec: -28.61401816, mag: 4.8, ci: 0.008, },
		    '1703971': { id: '1703971', con: 'Her', name: '', ra: 17.28876859, dec: 33.10010172, mag: 4.8, ci: -0.166, },
		    '1863120': { id: '1863120', con: 'Sgr', name: '', ra: 18.42250646, dec: -20.54164289, mag: 4.81, ci: 1.31, },
		    '1574989': { id: '1574989', con: 'Ser', name: '', ra: 16.03824768, dec: 22.80445158, mag: 4.82, ci: 0.066, },
		    '1607443': { id: '1607443', con: 'Ser', name: '', ra: 16.36787465, dec: 1.02904029, mag: 4.82, ci: 0.338, },
		    '1653528': { id: '1653528', con: 'Her', name: '', ra: 16.82061609, dec: 45.98331218, mag: 4.82, ci: 0.087, },
		    '1673996': { id: '1673996', con: 'Oph', name: '', ra: 17.01766709, dec: -4.22264404, mag: 4.82, ci: 1.483, },
		    '1864772': { id: '1864772', con: 'Dra', name: 'Fafnir', ra: 18.43309368, dec: 65.56348038, mag: 4.82, ci: 1.179, },
		    '1937440': { id: '1937440', con: 'Dra', name: '', ra: 18.90662729, dec: 71.29719057, mag: 4.82, ci: 1.151, },
		    '1618852': { id: '1618852', con: 'Her', name: '', ra: 16.47737466, dec: 41.88167735, mag: 4.83, ci: 1.289, },
		    '1680911': { id: '1680911', con: 'Sco', name: '', ra: 17.08037555, dec: -34.12292923, mag: 4.83, ci: 0.257, },
		    '1915463': { id: '1915463', con: 'Lyr', name: '', ra: 18.76791111, dec: 26.66213209, mag: 4.83, ci: 1.199, },
		    '1944427': { id: '1944427', con: 'Sct', name: '', ra: 18.95101922, dec: -5.84630936, mag: 4.83, ci: 1.057, },
		    '1948702': { id: '1948702', con: 'CrA', name: '', ra: 18.97871572, dec: -37.10734814, mag: 4.83, ci: 0.396, },
		    '1625591': { id: '1625591', con: 'Her', name: '', ra: 16.54341443, dec: 11.48804267, mag: 4.84, ci: 1.495, },
		    '1639577': { id: '1639577', con: 'Dra', name: '', ra: 16.6819777, dec: 64.58904572, mag: 4.84, ci: 1.212, },
		    '1647028': { id: '1647028', con: 'Dra', name: '', ra: 16.75494654, dec: 56.78184947, mag: 4.84, ci: 0.375, },
		    '1505053': { id: '1505053', con: 'Cir', name: '', ra: 15.29413682, dec: -63.61046633, mag: 4.85, ci: 1.26, },
		    '1786838': { id: '1786838', con: 'Sco', name: '', ra: 17.94650595, dec: -44.34224252, mag: 4.85, ci: 1.176, },
		    '1851596': { id: '1851596', con: 'Oph', name: '', ra: 18.34779484, dec: 3.37716851, mag: 4.85, ci: 0.911, },
		    '1947987': { id: '1947987', con: 'Tel', name: '', ra: 18.97437945, dec: -52.93863011, mag: 4.85, ci: -0.051, },
		    '1607479': { id: '1607479', con: 'CrB', name: '', ra: 16.36828402, dec: 30.89199456, mag: 4.86, ci: 0.97, },
		    '1628097': { id: '1628097', con: 'Nor', name: '', ra: 16.56806185, dec: -44.04531723, mag: 4.86, ci: 0.045, },
		    '1635936': { id: '1635936', con: 'Her', name: '', ra: 16.6457906, dec: 48.92834608, mag: 4.86, ci: 1.562, },
		    '1733607': { id: '1733607', con: 'Dra', name: '', ra: 17.537767, dec: 55.172958, mag: 4.86, ci: 0.279, },
		    '1756768': { id: '1756768', con: 'Oph', name: '', ra: 17.723833, dec: -21.683194, mag: 4.86, ci: 0.469, },
		    '1910793': { id: '1910793', con: 'Sgr', name: '', ra: 18.73871158, dec: -35.64199177, mag: 4.86, ci: -0.168, },
		    '1936851': { id: '1936851', con: 'Sgr', name: 'Ainalrami', ra: 18.90282685, dec: -22.74483882, mag: 4.86, ci: 1.412, },
		    '1992695': { id: '1992695', con: 'Sgr', name: '', ra: 19.25900703, dec: -25.25668133, mag: 4.86, ci: 0.569, },
		    '1665116': { id: '1665116', con: 'Dra', name: '', ra: 16.93380282, dec: 65.13480035, mag: 4.88, ci: 0.481, },
		    '1789428': { id: '1789428', con: 'Sco', name: '', ra: 17.9632787, dec: -41.71629653, mag: 4.88, ci: 1.617, },
		    '1908620': { id: '1908620', con: 'Sct', name: '', ra: 18.72534781, dec: -8.27522293, mag: 4.88, ci: 1.112, },
		    '1998161': { id: '1998161', con: 'Sgr', name: '', ra: 19.29391079, dec: -18.95291023, mag: 4.88, ci: 1.013, },
		    '1682004': { id: '1682004', con: 'Her', name: '', ra: 17.08963621, dec: 12.7408249, mag: 4.89, ci: 0.125, },
		    '1733422': { id: '1733422', con: 'Dra', name: '', ra: 17.536251, dec: 55.184243, mag: 4.89, ci: 0.251, },
		    '1576647': { id: '1576647', con: 'Lup', name: '', ra: 16.05671918, dec: -38.60254099, mag: 4.9, ci: -0.146, },
		    '1579874': { id: '1579874', con: 'Sco', name: '', ra: 16.09071, dec: -19.80186, mag: 4.9, ci: -0.024, },
		    '1618519': { id: '1618519', con: 'TrA', name: '', ra: 16.47448352, dec: -70.08439912, mag: 4.9, ci: 0.555, },
		    '1500600': { id: '1500600', con: 'Lup', name: '', ra: 15.24369988, dec: -31.51912559, mag: 4.91, ci: 0.374, },
		    '1640704': { id: '1640704', con: 'Oph', name: '', ra: 16.69288422, dec: -17.74216611, mag: 4.91, ci: 1.095, },
		    '1681916': { id: '1681916', con: 'Dra', name: '', ra: 17.08893732, dec: 54.47032257, mag: 4.91, ci: 0.471, },
		    '1514776': { id: '1514776', con: 'Lib', name: '', ra: 15.40330194, dec: -10.32226004, mag: 4.92, ci: 0.453, },
		    '1813349': { id: '1813349', con: 'CrA', name: '', ra: 18.11386424, dec: -43.42500014, mag: 4.92, ci: 0.255, },
		    '1850053': { id: '1850053', con: 'Her', name: '', ra: 18.33830975, dec: 21.96129974, mag: 4.92, ci: 1.594, },
		    '1879439': { id: '1879439', con: 'Tel', name: '', ra: 18.52928719, dec: -45.91481266, mag: 4.92, ci: -0.101, },
		    '1934387': { id: '1934387', con: 'Dra', name: '', ra: 18.88709531, dec: 50.70822961, mag: 4.92, ci: 0.903, },
		    '1590338': { id: '1590338', con: 'Sco', name: '', ra: 16.19999886, dec: -10.06422024, mag: 4.93, ci: 0.087, },
		    '1617736': { id: '1617736', con: 'Dra', name: '', ra: 16.4664, dec: 68.768137, mag: 4.94, ci: -0.051, },
		    '1951978': { id: '1951978', con: 'Lyr', name: '', ra: 19.000229, dec: 32.1455074, mag: 4.94, ci: 1.465, },
		    '1568566': { id: '1568566', con: 'Lib', name: '', ra: 15.96982486, dec: -14.2793582, mag: 4.95, ci: -0.08, },
		    '1592815': { id: '1592815', con: 'Nor', name: '', ra: 16.22464679, dec: -54.63046557, mag: 4.95, ci: 1.017, },
		    '1599457': { id: '1599457', con: 'UMi', name: '', ra: 16.29174725, dec: 75.75532538, mag: 4.95, ci: 0.393, },
		    '1567949': { id: '1567949', con: 'Dra', name: '', ra: 15.96317823, dec: 54.74976585, mag: 4.96, ci: 0.269, },
		    '1576565': { id: '1576565', con: 'Sco', name: '', ra: 16.05572859, dec: -25.86524237, mag: 4.96, ci: 1.234, },
		    '1811337': { id: '1811337', con: 'Her', name: '', ra: 18.10052775, dec: 22.21888054, mag: 4.96, ci: 1.656, },
		    '1826541': { id: '1826541', con: 'Sgr', name: '', ra: 18.19537076, dec: -23.701234, mag: 4.96, ci: 1.055, },
		    '1827011': { id: '1827011', con: 'Her', name: '', ra: 18.19837695, dec: 31.40535096, mag: 4.96, ci: 1.643, },
		    '1539780': { id: '1539780', con: 'Lib', name: '', ra: 15.6713599, dec: -23.81808486, mag: 4.97, ci: 1.302, },
		    '1598660': { id: '1598660', con: 'Nor', name: '', ra: 16.28359294, dec: -50.06812195, mag: 4.97, ci: 0.788, },
		    '1677728': { id: '1677728', con: 'Her', name: '', ra: 17.0521866, dec: 14.09194848, mag: 4.97, ci: 1.6, },
		    '1526641': { id: '1526641', con: 'Boo', name: '', ra: 15.52971621, dec: 40.89933676, mag: 4.98, ci: 0.086, },
		    '1573670': { id: '1573670', con: 'CrB', name: '', ra: 16.02404593, dec: 29.85105897, mag: 4.98, ci: -0.05, },
		    '1859464': { id: '1859464', con: 'Dra', name: '', ra: 18.398507, dec: 58.800736, mag: 4.98, ci: 0.082, },
		    '1942386': { id: '1942386', con: 'Ser', name: '', ra: 18.93739921, dec: 4.20209847, mag: 4.98, ci: 0.204, },
		    '1511732': { id: '1511732', con: 'Lup', name: '', ra: 15.36896401, dec: -47.92779162, mag: 4.99, ci: 0.515, },
		    '1513299': { id: '1513299', con: 'CrB', name: '', ra: 15.38675, dec: 30.287812, mag: 4.99, ci: 0.577, },
		    '1570671': { id: '1570671', con: 'Lup', name: '', ra: 15.991741, dec: -41.74444011, mag: 4.99, ci: 0.988, },
		    '1832520': { id: '1832520', con: 'Dra', name: '', ra: 18.23161991, dec: 64.39728774, mag: 4.99, ci: 0.44, },
		    '1526086': { id: '1526086', con: 'UMi', name: '', ra: 15.52359059, dec: 77.34936187, mag: 5, ci: 1.545, },
		    '1578146': { id: '1578146', con: 'Sco', name: '', ra: 16.07281516, dec: -11.37310381, mag: 5, ci: 0, },
		    '1584015': { id: '1584015', con: 'Her', name: 'Marsic', ra: 16.13459039, dec: 17.04697981, mag: 5, ci: 0.931, },
		    '1792883': { id: '1792883', con: 'Sgr', name: '', ra: 17.98480023, dec: -30.25302294, mag: 5, ci: 1.654, },
		    '1815121': { id: '1815121', con: 'Her', name: '', ra: 18.12464835, dec: 43.46189559, mag: 5, ci: 0.913, },
		    '1939349': { id: '1939349', con: 'Sgr', name: '', ra: 18.91864912, dec: -22.67131098, mag: 5, ci: 1.348, },
		    '1955619': { id: '1955619', con: 'Lyr', name: '', ra: 19.02399347, dec: 46.93482327, mag: 5, ci: 0.186, },
		    '1988323': { id: '1988323', con: 'Dra', name: '', ra: 19.23198527, dec: 57.70509492, mag: 5, ci: 1.156, },
		    '1709589': { id: '1709589', con: 'Her', name: '', ra: 17.33857529, dec: 18.05707872, mag: 5.01, ci: 1.654, },
		    '1504275': { id: '1504275', con: 'UMi', name: '', ra: 15.28497041, dec: 71.82389796, mag: 5.02, ci: 1.369, },
		    '1768707': { id: '1768707', con: 'Dra', name: '', ra: 17.81785764, dec: 50.78105385, mag: 5.02, ci: 0.043, },
		    '1769556': { id: '1769556', con: 'Dra', name: '', ra: 17.82417565, dec: 76.9628803, mag: 5.02, ci: 0.518, },
		    '1853387': { id: '1853387', con: 'Dra', name: '', ra: 18.35907279, dec: 49.12159199, mag: 5.02, ci: 1.619, },
		    '1912143': { id: '1912143', con: 'Aql', name: '', ra: 18.74720492, dec: 2.06003941, mag: 5.02, ci: -0.055, },
		    '1945137': { id: '1945137', con: 'Sgr', name: '', ra: 18.95568803, dec: -20.65634646, mag: 5.02, ci: 0.137, },
		    '1657672': { id: '1657672', con: 'Her', name: '', ra: 16.86257292, dec: 24.65643027, mag: 5.03, ci: 1.246, },
		    '1675470': { id: '1675470', con: 'Sco', name: '', ra: 17.03128958, dec: -32.14352536, mag: 5.03, ci: -0.1, },
		    '1706386': { id: '1706386', con: 'Oph', name: '', ra: 17.3102752, dec: 10.86447427, mag: 5.03, ci: 1.539, },
		    '1906236': { id: '1906236', con: 'Dra', name: '', ra: 18.710543, dec: 55.539457, mag: 5.03, ci: -0.07, },
		    '1504046': { id: '1504046', con: 'Cir', name: '', ra: 15.28247051, dec: -60.95725531, mag: 5.04, ci: -0.077, },
		    '1507547': { id: '1507547', con: 'Ser', name: '', ra: 15.32188841, dec: 1.76540542, mag: 5.04, ci: 0.54, },
		    '1525265': { id: '1525265', con: 'Boo', name: '', ra: 15.51548847, dec: 40.83304841, mag: 5.04, ci: 1.589, },
		    '1560880': { id: '1560880', con: 'Lib', name: '', ra: 15.888905, dec: -20.16704, mag: 5.04, ci: -0.014, },
		    '1813861': { id: '1813861', con: 'Her', name: '', ra: 18.117097, dec: 30.56214, mag: 5.05, ci: 0.528, },
		    '1692044': { id: '1692044', con: 'Sco', name: '', ra: 17.17842291, dec: -44.55770735, mag: 5.06, ci: 0.867, },
		    '1631739': { id: '1631739', con: 'Dra', name: '', ra: 16.60381127, dec: 52.92441435, mag: 5.07, ci: -0.027, },
		    '1689962': { id: '1689962', con: 'Her', name: '', ra: 17.15923569, dec: 40.77702932, mag: 5.07, ci: 1.275, },
		    '1732981': { id: '1732981', con: 'Dra', name: '', ra: 17.5327414, dec: 68.1350229, mag: 5.07, ci: 1.077, },
		    '1880146': { id: '1880146', con: 'Tel', name: '', ra: 18.53387392, dec: -45.75738358, mag: 5.07, ci: -0.127, },
		    '1970031': { id: '1970031', con: 'Aql', name: '', ra: 19.11627775, dec: 11.07123635, mag: 5.07, ci: -0.055, },
		    '1938320': { id: '1938320', con: 'Sct', name: '', ra: 18.91197606, dec: -15.60304096, mag: 5.08, ci: 0.141, },
		    '1557630': { id: '1557630', con: 'Ser', name: '', ra: 15.85433204, dec: -3.09049186, mag: 5.09, ci: 0.135, },
		    '1588799': { id: '1588799', con: 'Sco', name: '', ra: 16.18390848, dec: -29.41621848, mag: 5.09, ci: 1.131, },
		    '1768185': { id: '1768185', con: 'Her', name: '', ra: 17.8136521, dec: 25.62286878, mag: 5.09, ci: 1.141, },
		    '1855306': { id: '1855306', con: 'CrA', name: '', ra: 18.37182544, dec: -38.65689718, mag: 5.09, ci: 1.498, },
		    '1573380': { id: '1573380', con: 'Her', name: '', ra: 16.02064361, dec: 17.81840469, mag: 5.1, ci: 0.992, },
		    '1649343': { id: '1649343', con: 'TrA', name: '', ra: 16.77777518, dec: -67.10968925, mag: 5.1, ci: -0.08, },
		    '1717199': { id: '1717199', con: 'Sco', name: '', ra: 17.40363564, dec: -44.16257102, mag: 5.1, ci: -0.052, },
		    '1818938': { id: '1818938', con: 'Her', name: '', ra: 18.14801801, dec: 20.0452338, mag: 5.1, ci: 0.176, },
		    '1564338': { id: '1564338', con: 'TrA', name: '', ra: 15.92488917, dec: -68.60299876, mag: 5.11, ci: 1.108, },
		    '1860291': { id: '1860291', con: 'Lyr', name: '', ra: 18.40382907, dec: 39.50723859, mag: 5.11, ci: 0.047, },
		    '1909309': { id: '1909309', con: 'CrA', name: '', ra: 18.7297064, dec: -38.32344263, mag: 5.11, ci: 0.075, },
		    '1975647': { id: '1975647', con: 'Dra', name: '', ra: 19.152743, dec: 76.56050147, mag: 5.11, ci: 0.308, },
		    '1758316': { id: '1758316', con: 'Ara', name: 'Cervantes', ra: 17.73575132, dec: -51.83405661, mag: 5.12, ci: 0.694, },
		    '1852000': { id: '1852000', con: 'Her', name: '', ra: 18.35028325, dec: 28.86995524, mag: 5.12, ci: 0.212, },
		    '1878582': { id: '1878582', con: 'Sgr', name: '', ra: 18.5239713, dec: -18.40269738, mag: 5.12, ci: 0.016, },
		    '1887621': { id: '1887621', con: 'Sct', name: '', ra: 18.58399797, dec: -10.97720758, mag: 5.12, ci: 0.926, },
		    '1530982': { id: '1530982', con: 'Lib', name: '', ra: 15.57703251, dec: -28.04699619, mag: 5.13, ci: 1.306, },
		    '1595771': { id: '1595771', con: 'Nor', name: '', ra: 16.25425413, dec: -47.37202573, mag: 5.13, ci: -0.114, },
		    '1710744': { id: '1710744', con: 'Her', name: '', ra: 17.34839046, dec: 24.49943372, mag: 5.13, ci: 0, },
		    '1982155': { id: '1982155', con: 'Dra', name: '', ra: 19.19460233, dec: 56.85921466, mag: 5.13, ci: 1.008, },
		    '1531909': { id: '1531909', con: 'CrB', name: '', ra: 15.58747757, dec: 39.01006635, mag: 5.14, ci: 1.65, },
		    '1566591': { id: '1566591', con: 'Lup', name: '', ra: 15.94819164, dec: -33.9661125, mag: 5.14, ci: 0.129, },
		    '1705281': { id: '1705281', con: 'Oph', name: '', ra: 17.300189, dec: -24.286901, mag: 5.14, ci: 1.046, },
		    '1948389': { id: '1948389', con: 'Pav', name: '', ra: 18.97679103, dec: -60.20054835, mag: 5.14, ci: 1.355, },
		    '1987766': { id: '1987766', con: 'Aql', name: '', ra: 19.22852871, dec: 2.29370724, mag: 5.14, ci: -0.071, },
		    '1500615': { id: '1500615', con: 'UMi', name: '', ra: 15.24398277, dec: 67.34672278, mag: 5.15, ci: 0.55, },
		    '1502697': { id: '1502697', con: 'Lup', name: '', ra: 15.26778521, dec: -41.49114915, mag: 5.15, ci: 0.564, },
		    '1521605': { id: '1521605', con: 'Ser', name: '', ra: 15.47728807, dec: 1.84208399, mag: 5.15, ci: 0.245, },
		    '1647949': { id: '1647949', con: 'Her', name: '', ra: 16.76385873, dec: 8.58261485, mag: 5.15, ci: 1.535, },
		    '1517171': { id: '1517171', con: 'Ser', name: '', ra: 15.4298323, dec: 15.42803736, mag: 5.16, ci: 1.65, },
		    '1530707': { id: '1530707', con: 'Lib', name: '', ra: 15.57403134, dec: -9.18342084, mag: 5.16, ci: -0.09, },
		    '1880974': { id: '1880974', con: 'CrA', name: '', ra: 18.5392585, dec: -39.70400154, mag: 5.16, ci: 0.079, },
		    '1778525': { id: '1778525', con: 'Her', name: '', ra: 17.88834213, dec: 40.00794243, mag: 5.17, ci: 1.166, },
		    '1968336': { id: '1968336', con: 'Tel', name: '', ra: 19.105543, dec: -52.34091201, mag: 5.17, ci: 0.532, },
		    '1932896': { id: '1932896', con: 'Tel', name: '', ra: 18.87767868, dec: -52.107373, mag: 5.18, ci: 0.962, },
		    '1550033': { id: '1550033', con: 'Dra', name: '', ra: 15.77777933, dec: 62.59955885, mag: 5.19, ci: 0.062, },
		    '1622555': { id: '1622555', con: 'TrA', name: '', ra: 16.51371122, dec: -61.63350031, mag: 5.19, ci: 1.236, },
		    '1720765': { id: '1720765', con: 'Ara', name: '', ra: 17.433345, dec: -50.63350693, mag: 5.19, ci: 1.055, },
		    '1607979': { id: '1607979', con: 'CrB', name: '', ra: 16.37261783, dec: 33.79905099, mag: 5.2, ci: 1.631, },
		    '1867962': { id: '1867962', con: 'Ser', name: '', ra: 18.45347652, dec: 0.19608294, mag: 5.2, ci: 0.487, },
		    '1919742': { id: '1919742', con: 'CrA', name: '', ra: 18.79572751, dec: -40.40616238, mag: 5.2, ci: 0.781, },
		    '1944337': { id: '1944337', con: 'Lyr', name: '', ra: 18.950441, dec: 32.901273, mag: 5.2, ci: 0.594, },
		    '1971221': { id: '1971221', con: 'Lyr', name: '', ra: 19.1237726, dec: 32.50173295, mag: 5.2, ci: 0.367, },
		    '1556041': { id: '1556041', con: 'Ser', name: '', ra: 15.83820756, dec: 2.19651263, mag: 5.21, ci: 1.019, },
		    '1715306': { id: '1715306', con: 'Ara', name: '', ra: 17.3877986, dec: -47.46820144, mag: 5.21, ci: -0.097, },
		    '1651158': { id: '1651158', con: 'Her', name: '', ra: 16.79622741, dec: 5.24674443, mag: 5.22, ci: -0.001, },
		    '1924821': { id: '1924821', con: 'Sgr', name: '', ra: 18.82780746, dec: -20.32465569, mag: 5.22, ci: 1.404, },
		    '1925372': { id: '1925372', con: 'Lyr', name: '', ra: 18.83136573, dec: 32.55106181, mag: 5.22, ci: 0.1, },
		    '1543494': { id: '1543494', con: 'Lup', name: '', ra: 15.71064322, dec: -37.4249345, mag: 5.23, ci: 0.987, },
		    '1594796': { id: '1594796', con: 'CrB', name: '', ra: 16.24468169, dec: 33.858616, mag: 5.23, ci: 0.599, },
		    '1657380': { id: '1657380', con: 'Sco', name: '', ra: 16.85936713, dec: -41.23053271, mag: 5.23, ci: 0.047, },
		    '1662571': { id: '1662571', con: 'Oph', name: '', ra: 16.90991484, dec: -6.15397998, mag: 5.23, ci: 1.1, },
		    '1739246': { id: '1739246', con: 'Dra', name: '', ra: 17.58321651, dec: 61.87456936, mag: 5.23, ci: 0.602, },
		    '1975242': { id: '1975242', con: 'Aql', name: '', ra: 19.14997564, dec: 6.0732071, mag: 5.23, ci: 0.346, },
		    '1593419': { id: '1593419', con: 'Sco', name: '', ra: 16.23080719, dec: -11.83774529, mag: 5.24, ci: 1.394, },
		    '1617217': { id: '1617217', con: 'Oph', name: '', ra: 16.46207117, dec: -7.5979333, mag: 5.24, ci: 1.721, },
		    '1622101': { id: '1622101', con: 'Her', name: '', ra: 16.50931905, dec: 20.47918822, mag: 5.24, ci: 1.274, },
		    '1860495': { id: '1860495', con: 'CrA', name: '', ra: 18.40506682, dec: -44.11025647, mag: 5.24, ci: -0.163, },
		    '1535859': { id: '1535859', con: 'Boo', name: '', ra: 15.63044404, dec: 40.3534327, mag: 5.25, ci: 0.886, },
		    '1745680': { id: '1745680', con: 'Ara', name: '', ra: 17.63486558, dec: -54.50043304, mag: 5.25, ci: 0.195, },
		    '1801752': { id: '1801752', con: 'Her', name: '', ra: 18.03973605, dec: 20.83362848, mag: 5.25, ci: -0.1, },
		    '1856651': { id: '1856651', con: 'Her', name: '', ra: 18.38028881, dec: 17.82661676, mag: 5.25, ci: 1.25, },
		    '1914641': { id: '1914641', con: 'Dra', name: '', ra: 18.76299074, dec: 74.08555318, mag: 5.25, ci: 0.953, },
		    '1970889': { id: '1970889', con: 'Lyr', name: '', ra: 19.12170255, dec: 36.10015915, mag: 5.25, ci: -0.109, },
		    '1522846': { id: '1522846', con: 'Lup', name: '', ra: 15.49007495, dec: -46.73270438, mag: 5.26, ci: 1.731, },
		    '1533779': { id: '1533779', con: 'Ser', name: '', ra: 15.60821639, dec: 10.01016535, mag: 5.26, ci: 0.925, },
		    '1606999': { id: '1606999', con: 'Dra', name: '', ra: 16.36353085, dec: 69.10939609, mag: 5.26, ci: 1.115, },
		    '1951347': { id: '1951347', con: 'Lyr', name: '', ra: 18.99596783, dec: 26.23040713, mag: 5.26, ci: 1.228, },
		    '1604638': { id: '1604638', con: 'Aps', name: '', ra: 16.34079358, dec: -78.66749647, mag: 5.27, ci: 1.413, },
		    '1674959': { id: '1674959', con: 'Her', name: '', ra: 17.02676701, dec: 33.56826917, mag: 5.27, ci: 0.028, },
		    '1677753': { id: '1677753', con: 'Ara', name: '', ra: 17.05241762, dec: -53.23699418, mag: 5.27, ci: 0.498, },
		    '1949633': { id: '1949633', con: 'Aql', name: '', ra: 18.98492755, dec: 13.62224432, mag: 5.27, ci: 0.573, },
		    '1500397': { id: '1500397', con: 'Boo', name: '', ra: 15.24143293, dec: 29.16429616, mag: 5.28, ci: 0.062, },
		    '1617686': { id: '1617686', con: 'TrA', name: '', ra: 16.46592954, dec: -64.05794152, mag: 5.28, ci: 0.383, },
		    '1634694': { id: '1634694', con: 'Dra', name: '', ra: 16.63346134, dec: 56.01555196, mag: 5.28, ci: 1.055, },
		    '1722535': { id: '1722535', con: 'Ara', name: '', ra: 17.4477734, dec: -45.8430321, mag: 5.28, ci: -0.058, },
		    '1885000': { id: '1885000', con: 'Sgr', name: '', ra: 18.56604615, dec: -33.01656315, mag: 5.28, ci: -0.115, },
		    '1998646': { id: '1998646', con: 'Aql', name: '', ra: 19.29694381, dec: 11.59542347, mag: 5.28, ci: 0.196, },
		    '1836137': { id: '1836137', con: 'Sgr', name: '', ra: 18.253585, dec: -20.72827, mag: 5.29, ci: 0.007, },
		    '1938487': { id: '1938487', con: 'Oct', name: '', ra: 18.91309091, dec: -87.60584344, mag: 5.29, ci: 1.304, },
		    '1715477': { id: '1715477', con: 'Oph', name: '', ra: 17.38933073, dec: -28.14283193, mag: 5.3, ci: 1.549, },
		    '1847007': { id: '1847007', con: 'Her', name: '', ra: 18.31963344, dec: 24.4460597, mag: 5.3, ci: 1.508, },
		    '1624021': { id: '1624021', con: 'Sco', name: '', ra: 16.528269, dec: -41.81714208, mag: 5.31, ci: 0.299, },
		    '1729793': { id: '1729793', con: 'Oph', name: '', ra: 17.50660608, dec: -1.06282207, mag: 5.31, ci: 0.715, },
		    '1977508': { id: '1977508', con: 'Pav', name: '', ra: 19.16468555, dec: -68.42444704, mag: 5.31, ci: 0.901, },
		    '1501431': { id: '1501431', con: 'Ser', name: '', ra: 15.25315371, dec: 4.93936037, mag: 5.32, ci: 1.092, },
		    '1608159': { id: '1608159', con: 'Nor', name: '', ra: 16.37444308, dec: -49.57235741, mag: 5.32, ci: -0.047, },
		    '1695191': { id: '1695191', con: 'Oph', name: '', ra: 17.20772468, dec: 10.58516861, mag: 5.32, ci: 1.593, },
		    '1856826': { id: '1856826', con: 'Sgr', name: '', ra: 18.38141014, dec: -36.66955555, mag: 5.33, ci: -0.121, },
		    '1947403': { id: '1947403', con: 'Aql', name: '', ra: 18.97076319, dec: 17.36091616, mag: 5.33, ci: 0.731, },
		    '1542159': { id: '1542159', con: 'Ser', name: '', ra: 15.69650458, dec: 12.8475302, mag: 5.34, ci: 0.033, },
		    '1659726': { id: '1659726', con: 'Her', name: '', ra: 16.88279387, dec: 31.70167563, mag: 5.34, ci: 0.319, },
		    '1510118': { id: '1510118', con: 'Ser', name: '', ra: 15.35055461, dec: 0.7153338, mag: 5.35, ci: 1.191, },
		    '1562969': { id: '1562969', con: 'Her', name: '', ra: 15.91051401, dec: 43.13856536, mag: 5.35, ci: 1.645, },
		    '1584097': { id: '1584097', con: 'Sco', name: '', ra: 16.13544055, dec: -26.32667695, mag: 5.35, ci: 1.643, },
		    '1620705': { id: '1620705', con: 'Nor', name: '', ra: 16.49509085, dec: -46.24323255, mag: 5.35, ci: 0.488, },
		    '1663983': { id: '1663983', con: 'Her', name: '', ra: 16.92282438, dec: 18.43321077, mag: 5.35, ci: 1.407, },
		    '1742625': { id: '1742625', con: 'Her', name: '', ra: 17.61045936, dec: 48.58563313, mag: 5.35, ci: 1.142, },
		    '1942484': { id: '1942484', con: 'CrA', name: '', ra: 18.93804218, dec: -42.71067127, mag: 5.35, ci: 0.998, },
		    '1984826': { id: '1984826', con: 'Aql', name: '', ra: 19.21130853, dec: -7.93951799, mag: 5.35, ci: 0.094, },
		    '1515602': { id: '1515602', con: 'Lup', name: '', ra: 15.41250208, dec: -39.71025508, mag: 5.36, ci: -0.093, },
		    '1537599': { id: '1537599', con: 'Lib', name: '', ra: 15.64848914, dec: -19.30189584, mag: 5.36, ci: 0.883, },
		    '1709327': { id: '1709327', con: 'Her', name: '', ra: 17.33606635, dec: 25.53760929, mag: 5.36, ci: 0.063, },
		    '1841385': { id: '1841385', con: 'Tel', name: '', ra: 18.28542559, dec: -56.02335146, mag: 5.36, ci: -0.05, },
		    '1943486': { id: '1943486', con: 'CrA', name: '', ra: 18.94458215, dec: -37.34324617, mag: 5.36, ci: -0.147, },
		    '1599054': { id: '1599054', con: 'Dra', name: '', ra: 16.28759636, dec: 59.75502225, mag: 5.37, ci: 1.551, },
		    '1610790': { id: '1610790', con: 'Sco', name: '', ra: 16.40035815, dec: -39.19297957, mag: 5.37, ci: 0.625, },
		    '1803029': { id: '1803029', con: 'Sgr', name: '', ra: 18.04752772, dec: -24.28246659, mag: 5.37, ci: 0.495, },
		    '1877695': { id: '1877695', con: 'Sgr', name: '', ra: 18.51801226, dec: -32.98910218, mag: 5.37, ci: 0.182, },
		    '1916172': { id: '1916172', con: 'Sgr', name: '', ra: 18.77239099, dec: -22.39217778, mag: 5.37, ci: 1.591, },
		    '1916224': { id: '1916224', con: 'Dra', name: '', ra: 18.77284216, dec: 75.43396705, mag: 5.37, ci: 0.049, },
		    '1511239': { id: '1511239', con: 'Boo', name: '', ra: 15.36349303, dec: 32.93369512, mag: 5.38, ci: -0.051, },
		    '1561781': { id: '1561781', con: 'Sco', name: '', ra: 15.8983094, dec: -24.53315764, mag: 5.38, ci: -0.011, },
		    '1710259': { id: '1710259', con: 'Her', name: '', ra: 17.34432419, dec: 32.46774663, mag: 5.38, ci: 0.619, },
		    '1874225': { id: '1874225', con: 'Ser', name: '', ra: 18.49471652, dec: -1.98530811, mag: 5.38, ci: 0.961, },
		    '1884956': { id: '1884956', con: 'Dra', name: '', ra: 18.56574832, dec: 52.35351346, mag: 5.38, ci: 1.091, },
		    '1891004': { id: '1891004', con: 'Oph', name: '', ra: 18.60773211, dec: 9.12249652, mag: 5.38, ci: 0.387, },
		    '1919077': { id: '1919077', con: 'Sct', name: '', ra: 18.79137473, dec: -5.70514269, mag: 5.38, ci: 1.28, },
		    '1994785': { id: '1994785', con: 'Tel', name: '', ra: 19.27270623, dec: -45.46603048, mag: 5.38, ci: 1.349, },
		    '1549077': { id: '1549077', con: 'Ser', name: '', ra: 15.76823271, dec: -1.80419091, mag: 5.39, ci: -0.035, },
		    '1573048': { id: '1573048', con: 'CrB', name: '', ra: 16.01740566, dec: 33.30350761, mag: 5.39, ci: 0.612, },
		    '1586874': { id: '1586874', con: 'Ser', name: '', ra: 16.16403246, dec: -3.46673428, mag: 5.39, ci: 1.446, },
		    '1663174': { id: '1663174', con: 'Her', name: '', ra: 16.91532523, dec: 20.95849089, mag: 5.39, ci: 0.966, },
		    '1713005': { id: '1713005', con: 'Aps', name: '', ra: 17.36829883, dec: -70.12320647, mag: 5.39, ci: -0.042, },
		    '1849663': { id: '1849663', con: 'Ser', name: '', ra: 18.3357759, dec: -15.83169552, mag: 5.39, ci: 1.473, },
		    '1952527': { id: '1952527', con: 'Dra', name: '', ra: 19.003799, dec: 50.53346487, mag: 5.39, ci: -0.182, },
		    '1526248': { id: '1526248', con: 'Aps', name: '', ra: 15.52522827, dec: -73.38958753, mag: 5.4, ci: -0.146, },
		    '1608202': { id: '1608202', con: 'CrB', name: '', ra: 16.37478279, dec: 33.70348512, mag: 5.4, ci: 1.523, },
		    '1611887': { id: '1611887', con: 'Sco', name: '', ra: 16.41104394, dec: -29.70341255, mag: 5.4, ci: 0.625, },
		    '1912447': { id: '1912447', con: 'CrA', name: '', ra: 18.74921027, dec: -39.68618647, mag: 5.4, ci: 0.85, },
		    '1959464': { id: '1959464', con: 'Aql', name: '', ra: 19.04847241, dec: -3.69898972, mag: 5.4, ci: -0.005, },
		    '1964654': { id: '1964654', con: 'Dra', name: '', ra: 19.08199025, dec: 53.39665719, mag: 5.4, ci: -0.014, },
		    '1964770': { id: '1964770', con: 'Aql', name: '', ra: 19.08268696, dec: -4.03141908, mag: 5.4, ci: 1.12, },
		    '1545755': { id: '1545755', con: 'Lib', name: '', ra: 15.73455539, dec: -15.67283385, mag: 5.41, ci: 0.238, },
		    '1561821': { id: '1561821', con: 'Sco', name: '', ra: 15.89885096, dec: -23.97809846, mag: 5.41, ci: -0.033, },
		    '1618702': { id: '1618702', con: 'Oph', name: '', ra: 16.47610571, dec: 0.66500293, mag: 5.41, ci: 1.461, },
		    '1687178': { id: '1687178', con: 'Her', name: '', ra: 17.13390701, dec: 35.93517397, mag: 5.41, ci: 0.309, },
		    '1726606': { id: '1726606', con: 'Oph', name: '', ra: 17.48045965, dec: 0.33062738, mag: 5.41, ci: 0.237, },
		    '1846967': { id: '1846967', con: 'Oph', name: '', ra: 18.31931564, dec: 7.25976505, mag: 5.41, ci: 1.084, },
		    '1854898': { id: '1854898', con: 'Her', name: '', ra: 18.36908362, dec: 23.28517648, mag: 5.41, ci: 1.633, },
		    '1891385': { id: '1891385', con: 'Lyr', name: '', ra: 18.61037362, dec: 33.46903861, mag: 5.41, ci: -0.101, },
		    '1611663': { id: '1611663', con: 'Sco', name: '', ra: 16.40882064, dec: -37.56604698, mag: 5.42, ci: -0.104, },
		    '1898606': { id: '1898606', con: 'CrA', name: '', ra: 18.65976661, dec: -43.1858789, mag: 5.42, ci: 1.654, },
		    '1506813': { id: '1506813', con: 'Cir', name: '', ra: 15.31365048, dec: -60.49633415, mag: 5.43, ci: -0.089, },
		    '1537472': { id: '1537472', con: 'Nor', name: '', ra: 15.64707574, dec: -52.37269558, mag: 5.43, ci: 0.005, },
		    '1564829': { id: '1564829', con: 'CrB', name: '', ra: 15.92988535, dec: 37.94695678, mag: 5.43, ci: 0.352, },
		    '1569185': { id: '1569185', con: 'Sco', name: '', ra: 15.97635195, dec: -24.83149237, mag: 5.43, ci: -0.092, },
		    '1590554': { id: '1590554', con: 'Sco', name: '', ra: 16.2020318, dec: -8.54757962, mag: 5.43, ci: 0.118, },
		    '1690414': { id: '1690414', con: 'Oph', name: '', ra: 17.16331974, dec: -10.52330063, mag: 5.43, ci: 0.465, },
		    '1782973': { id: '1782973', con: 'Dra', name: '', ra: 17.91976424, dec: 72.00512635, mag: 5.43, ci: 0.34, },
		    '1891446': { id: '1891446', con: 'Oph', name: '', ra: 18.61085413, dec: 6.67180631, mag: 5.43, ci: 0.386, },
		    '1931855': { id: '1931855', con: 'Her', name: '', ra: 18.87123005, dec: 21.4251427, mag: 5.43, ci: -0.068, },
		    '1533328': { id: '1533328', con: 'Lup', name: '', ra: 15.60336104, dec: -44.39682257, mag: 5.44, ci: 1.497, },
		    '1581244': { id: '1581244', con: 'Dra', name: '', ra: 16.10546587, dec: 67.81013528, mag: 5.44, ci: -0.019, },
		    '1602585': { id: '1602585', con: 'Nor', name: '', ra: 16.32156896, dec: -42.67396919, mag: 5.44, ci: 0.099, },
		    '1786848': { id: '1786848', con: 'Oph', name: '', ra: 17.9465959, dec: -4.0818186, mag: 5.44, ci: 1.162, },
		    '1867136': { id: '1867136', con: 'Tel', name: '', ra: 18.44833648, dec: -48.11724087, mag: 5.44, ci: 0.855, },
		    '1562887': { id: '1562887', con: 'Ser', name: '', ra: 15.90961436, dec: 20.3109694, mag: 5.45, ci: 1.588, },
		    '1598165': { id: '1598165', con: 'Nor', name: '', ra: 16.27868882, dec: -53.81110867, mag: 5.45, ci: 1.696, },
		    '1838056': { id: '1838056', con: 'CrA', name: '', ra: 18.26484753, dec: -44.20646137, mag: 5.45, ci: 0.962, },
		    '1518003': { id: '1518003', con: 'Boo', name: '', ra: 15.43816223, dec: 34.3359958, mag: 5.46, ci: 1.41, },
		    '1519555': { id: '1519555', con: 'Lup', name: '', ra: 15.4550361, dec: -36.76756325, mag: 5.46, ci: -0.15, },
		    '1592436': { id: '1592436', con: 'Her', name: '', ra: 16.22095285, dec: 5.02108645, mag: 5.46, ci: 1.472, },
		    '1631986': { id: '1631986', con: 'Sco', name: '', ra: 16.60626789, dec: -42.85886253, mag: 5.46, ci: 0.338, },
		    '1661571': { id: '1661571', con: 'Sco', name: '', ra: 16.90051103, dec: -41.80638311, mag: 5.46, ci: 0.176, },
		    '1922575': { id: '1922575', con: 'CrA', name: '', ra: 18.81402491, dec: -43.68003818, mag: 5.46, ci: 0.133, },
		    '1938702': { id: '1938702', con: 'Lyr', name: '', ra: 18.91449371, dec: 41.60272615, mag: 5.46, ci: 1.034, },
		    '1998407': { id: '1998407', con: 'Vul', name: '', ra: 19.29545507, dec: 23.02551713, mag: 5.46, ci: 0.02, },
		    '1571943': { id: '1571943', con: 'Lib', name: '', ra: 16.00544304, dec: -16.53334149, mag: 5.47, ci: 0.517, },
		    '1707249': { id: '1707249', con: 'Ara', name: '', ra: 17.31773624, dec: -46.63615308, mag: 5.47, ci: 0.764, },
		    '1783543': { id: '1783543', con: 'Her', name: '', ra: 17.92366364, dec: 26.04998988, mag: 5.47, ci: 0.341, },
		    '1823182': { id: '1823182', con: 'Pav', name: '', ra: 18.17393269, dec: -62.0022259, mag: 5.47, ci: 0.592, },
		    '1830708': { id: '1830708', con: 'CrA', name: '', ra: 18.22019402, dec: -41.33611529, mag: 5.47, ci: -0.155, },
		    '1858714': { id: '1858714', con: 'Oct', name: '', ra: 18.39345823, dec: -75.04427574, mag: 5.47, ci: 0.043, },
		    '1881881': { id: '1881881', con: 'Sct', name: '', ra: 18.54536744, dec: -14.86566365, mag: 5.47, ci: 1.998, },
		    '1882167': { id: '1882167', con: 'Lyr', name: '', ra: 18.54721018, dec: 30.55420683, mag: 5.47, ci: -0.077, },
		    '1543829': { id: '1543829', con: 'Boo', name: '', ra: 15.71410007, dec: 52.36090175, mag: 5.48, ci: -0.042, },
		    '1588497': { id: '1588497', con: 'UMi', name: '', ra: 16.18042331, dec: 75.87756111, mag: 5.48, ci: -0.093, },
		    '1603700': { id: '1603700', con: 'Her', name: '', ra: 16.33198342, dec: 39.70859484, mag: 5.48, ci: 0.41, },
		    '1649559': { id: '1649559', con: 'Sco', name: '', ra: 16.77998808, dec: -39.37696182, mag: 5.48, ci: 0.975, },
		    '1655295': { id: '1655295', con: 'Her', name: '', ra: 16.838717, dec: 7.24768382, mag: 5.48, ci: 0.108, },
		    '1667147': { id: '1667147', con: 'Sco', name: '', ra: 16.95310451, dec: -33.25949387, mag: 5.48, ci: 1.606, },
		    '1596396': { id: '1596396', con: 'Sco', name: '', ra: 16.2603528, dec: -8.36943873, mag: 5.49, ci: 0.652, },
		    '1816632': { id: '1816632', con: 'Her', name: '', ra: 18.13395502, dec: 36.40127055, mag: 5.49, ci: 1.161, },
		    '1833512': { id: '1833512', con: 'Sgr', name: '', ra: 18.23775037, dec: -21.71316392, mag: 5.49, ci: 1.528, },
		    '1884812': { id: '1884812', con: 'Sgr', name: '', ra: 18.56485706, dec: -24.03228275, mag: 5.49, ci: 1.795, },
		    '1963416': { id: '1963416', con: 'Sgr', name: '', ra: 19.07362704, dec: -31.0470795, mag: 5.49, ci: 0.026, },
		    '1527888': { id: '1527888', con: 'Lib', name: '', ra: 15.54352845, dec: -19.6704593, mag: 5.5, ci: 0.197, },
		    '1528425': { id: '1528425', con: 'Ser', name: '', ra: 15.54942705, dec: -1.18640297, mag: 5.5, ci: 1.092, },
		    '1586929': { id: '1586929', con: 'Sco', name: '', ra: 16.16460837, dec: -33.54580332, mag: 5.5, ci: -0.075, },
		    '1628481': { id: '1628481', con: 'Aps', name: '', ra: 16.57203891, dec: -70.9880943, mag: 5.5, ci: 1.235, },
		    '1630965': { id: '1630965', con: 'TrA', name: '', ra: 16.59578298, dec: -65.49539873, mag: 5.5, ci: 0.949, },
		    '1823851': { id: '1823851', con: 'Oph', name: '', ra: 18.17786115, dec: 3.32425293, mag: 5.5, ci: 1.204, },
		    '1508792': { id: '1508792', con: 'CrB', name: '', ra: 15.3357107, dec: 29.61621072, mag: 5.51, ci: 1.015, },
		    '1657129': { id: '1657129', con: 'Oph', name: '', ra: 16.85692288, dec: 1.21597029, mag: 5.51, ci: 0.055, },
		    '1709669': { id: '1709669', con: 'Her', name: '', ra: 17.3392003, dec: 46.24078398, mag: 5.51, ci: 1.586, },
		    '1771602': { id: '1771602', con: 'Her', name: '', ra: 17.83969237, dec: 29.32214007, mag: 5.51, ci: 1.071, },
		    '1929979': { id: '1929979', con: 'Dra', name: '', ra: 18.85970879, dec: 52.97519673, mag: 5.51, ci: 0.843, },
		    '1932365': { id: '1932365', con: 'Tel', name: '', ra: 18.8742306, dec: -46.59511868, mag: 5.51, ci: 1.641, },
		    '1950425': { id: '1950425', con: 'Sgr', name: '', ra: 18.98994529, dec: -12.84051772, mag: 5.51, ci: -0.038, },
		    '1953803': { id: '1953803', con: 'Dra', name: '', ra: 19.01207134, dec: 55.65830024, mag: 5.51, ci: 0.862, },
		    '1986511': { id: '1986511', con: 'Sgr', name: '', ra: 19.22097863, dec: -12.28258428, mag: 5.51, ci: 1.442, },
		    '1503229': { id: '1503229', con: 'Lib', name: '', ra: 15.27305852, dec: -22.39941433, mag: 5.52, ci: 1.357, },
		    '1722436': { id: '1722436', con: 'Her', name: '', ra: 17.4469802, dec: 20.08097207, mag: 5.52, ci: -0.119, },
		    '1816001': { id: '1816001', con: 'Sgr', name: '', ra: 18.1300944, dec: -17.15415886, mag: 5.52, ci: 1.132, },
		    '1858370': { id: '1858370', con: 'Sgr', name: '', ra: 18.39134082, dec: -36.23798801, mag: 5.52, ci: 1.015, },
		    '1997042': { id: '1997042', con: 'Pav', name: '', ra: 19.28672931, dec: -66.66101161, mag: 5.52, ci: 0.17, },
		    '1528362': { id: '1528362', con: 'Lib', name: '', ra: 15.54867275, dec: -16.8528434, mag: 5.53, ci: -0.148, },
		    '1553765': { id: '1553765', con: 'Lib', name: '', ra: 15.81577735, dec: -3.81851336, mag: 5.53, ci: 0.12, },
		    '1572671': { id: '1572671', con: 'Lib', name: '', ra: 16.01323114, dec: -8.41135548, mag: 5.53, ci: 0.043, },
		    '1603045': { id: '1603045', con: 'Sco', name: '', ra: 16.32576091, dec: -30.90671456, mag: 5.53, ci: 0.466, },
		    '1613203': { id: '1613203', con: 'Her', name: '', ra: 16.42338061, dec: 37.39405677, mag: 5.53, ci: 0.174, },
		    '1631668': { id: '1631668', con: 'Dra', name: '', ra: 16.60317256, dec: 52.9000481, mag: 5.53, ci: -0.06, },
		    '1669070': { id: '1669070', con: 'Ara', name: '', ra: 16.9716505, dec: -50.64118523, mag: 5.53, ci: 0.016, },
		    '1703466': { id: '1703466', con: 'Sco', name: '', ra: 17.28434571, dec: -32.66283895, mag: 5.53, ci: 0.514, },
		    '1755620': { id: '1755620', con: 'Sco', name: '', ra: 17.71419394, dec: -36.94556502, mag: 5.53, ci: 1.553, },
		    '1822269': { id: '1822269', con: 'Sgr', name: '', ra: 18.16828071, dec: -30.72869109, mag: 5.53, ci: 0.979, },
		    '1969130': { id: '1969130', con: 'Lyr', name: '', ra: 19.1104818, dec: 28.62859314, mag: 5.53, ci: 0.296, },
		    '1510261': { id: '1510261', con: 'Lib', name: '', ra: 15.35211414, dec: -5.82484982, mag: 5.54, ci: 1.047, },
		    '1552010': { id: '1552010', con: 'TrA', name: '', ra: 15.79809123, dec: -65.44241038, mag: 5.54, ci: 0.231, },
		    '1567132': { id: '1567132', con: 'Ser', name: '', ra: 15.9540478, dec: 14.41448071, mag: 5.54, ci: 1.141, },
		    '1695336': { id: '1695336', con: 'Dra', name: '', ra: 17.20905036, dec: 62.87433245, mag: 5.54, ci: 0.216, },
		    '1738779': { id: '1738779', con: 'Ser', name: '', ra: 17.57954194, dec: -11.2420008, mag: 5.54, ci: 0.013, },
		    '1753822': { id: '1753822', con: 'Her', name: '', ra: 17.69962187, dec: 15.95245305, mag: 5.54, ci: 0.387, },
		    '1613738': { id: '1613738', con: 'UMi', name: '', ra: 16.42866328, dec: 78.96385053, mag: 5.55, ci: 0.249, },
		    '1641267': { id: '1641267', con: 'Oph', name: '', ra: 16.69824729, dec: -19.92436743, mag: 5.55, ci: 0.436, },
		    '1650415': { id: '1650415', con: 'Ara', name: '', ra: 16.78879372, dec: -58.34144454, mag: 5.55, ci: -0.096, },
		    '1712315': { id: '1712315', con: 'Her', name: '', ra: 17.36211665, dec: 39.97465891, mag: 5.55, ci: 0.667, },
		    '1512435': { id: '1512435', con: 'Boo', name: '', ra: 15.37704783, dec: 39.58146158, mag: 5.56, ci: 1.626, },
		    '1683805': { id: '1683805', con: 'Her', name: '', ra: 17.10501328, dec: 22.08415403, mag: 5.56, ci: 1.299, },
		    '1754847': { id: '1754847', con: 'Her', name: '', ra: 17.70787841, dec: 24.56405727, mag: 5.56, ci: 1.436, },
		    '1837357': { id: '1837357', con: 'Lyr', name: '', ra: 18.26077166, dec: 42.15934474, mag: 5.56, ci: -0.111, },
		    '1940448': { id: '1940448', con: 'Sgr', name: '', ra: 18.92527913, dec: -16.37663611, mag: 5.56, ci: 0.445, },
		    '1944963': { id: '1944963', con: 'Ser', name: '', ra: 18.95460848, dec: 2.53534622, mag: 5.56, ci: 0.004, },
		    '1973439': { id: '1973439', con: 'Sgr', name: '', ra: 19.1379728, dec: -19.29028737, mag: 5.56, ci: -0.087, },
		    '1544512': { id: '1544512', con: 'Oct', name: '', ra: 15.72137161, dec: -84.46527257, mag: 5.57, ci: 0.118, },
		    '1545617': { id: '1545617', con: 'CrB', name: '', ra: 15.73313904, dec: 32.51580786, mag: 5.57, ci: 1.076, },
		    '1547881': { id: '1547881', con: 'Ser', name: '', ra: 15.756523, dec: 5.44731744, mag: 5.57, ci: 0.035, },
		    '1585980': { id: '1585980', con: 'Nor', name: '', ra: 16.15515212, dec: -57.93431762, mag: 5.57, ci: -0.024, },
		    '1640318': { id: '1640318', con: 'Ara', name: '', ra: 16.68901258, dec: -48.76298276, mag: 5.57, ci: 0.169, },
		    '1666461': { id: '1666461', con: 'Oph', name: '', ra: 16.94666893, dec: -23.15027759, mag: 5.57, ci: -0.018, },
		    '1731707': { id: '1731707', con: 'Oph', name: '', ra: 17.52259293, dec: 2.72450656, mag: 5.57, ci: 0.844, },
		    '1821958': { id: '1821958', con: 'Her', name: '', ra: 18.16638778, dec: 36.46628087, mag: 5.57, ci: 0.915, },
		    '1778732': { id: '1778732', con: 'Sco', name: '', ra: 17.88985076, dec: -34.89516062, mag: 5.58, ci: 1.098, },
		    '1837444': { id: '1837444', con: 'Pav', name: '', ra: 18.26128245, dec: -63.05536894, mag: 5.58, ci: 0.944, },
		    '1862351': { id: '1862351', con: 'Sgr', name: '', ra: 18.41706253, dec: -30.75657585, mag: 5.58, ci: 1.138, },
		    '1935693': { id: '1935693', con: 'Lyr', name: '', ra: 18.89543333, dec: 36.97172277, mag: 5.58, ci: -0.138, },
		    '1940298': { id: '1940298', con: 'Aql', name: '', ra: 18.92429257, dec: 6.61529503, mag: 5.58, ci: 1.041, },
		    '1992150': { id: '1992150', con: 'Aql', name: '', ra: 19.25558078, dec: 15.08365642, mag: 5.58, ci: 1.067, },
		    '1507002': { id: '1507002', con: 'Lup', name: '', ra: 15.31565994, dec: -40.78822271, mag: 5.59, ci: -0.099, },
		    '1566610': { id: '1566610', con: 'Lup', name: '', ra: 15.94836541, dec: -33.96426744, mag: 5.59, ci: 0.072, },
		    '1995208': { id: '1995208', con: 'Aql', name: '', ra: 19.27528686, dec: 4.83479483, mag: 5.59, ci: 0.101, },
		    '1647177': { id: '1647177', con: 'Her', name: '', ra: 16.75625553, dec: 15.74529736, mag: 5.6, ci: 1.637, },
		    '1700276': { id: '1700276', con: 'Sco', name: '', ra: 17.25534638, dec: -33.54841597, mag: 5.6, ci: -0.056, },
		    '1924578': { id: '1924578', con: 'CrA', name: '', ra: 18.82638731, dec: -43.4341034, mag: 5.6, ci: -0.077, },
		    '1550148': { id: '1550148', con: 'Lup', name: '', ra: 15.7789491, dec: -34.68244945, mag: 5.61, ci: -0.117, },
		    '1569808': { id: '1569808', con: 'CrB', name: '', ra: 15.98269779, dec: 36.64377576, mag: 5.61, ci: 1.529, },
		    '1596735': { id: '1596735', con: 'Nor', name: '', ra: 16.26383227, dec: -57.91234894, mag: 5.61, ci: 0.137, },
		    '1624173': { id: '1624173', con: 'Her', name: '', ra: 16.52978564, dec: 45.5982727, mag: 5.61, ci: 0.125, },
		    '1736126': { id: '1736126', con: 'Oph', name: '', ra: 17.55829036, dec: -5.74480336, mag: 5.61, ci: 0.187, },
		    '1764487': { id: '1764487', con: 'Her', name: '', ra: 17.78556672, dec: 17.69700315, mag: 5.61, ci: 0.036, },
		    '1851798': { id: '1851798', con: 'Her', name: '', ra: 18.3491581, dec: 29.85892422, mag: 5.61, ci: 0.231, },
		    '1502345': { id: '1502345', con: 'Ser', name: '', ra: 15.26363267, dec: 0.37214125, mag: 5.62, ci: 0.181, },
		    '1590048': { id: '1590048', con: 'CrB', name: '', ra: 16.1966811, dec: 36.42508892, mag: 5.62, ci: 1.352, },
		    '1640869': { id: '1640869', con: 'Ara', name: '', ra: 16.6945073, dec: -49.65155787, mag: 5.62, ci: -0.043, },
		    '1784510': { id: '1784510', con: 'Her', name: '', ra: 17.93078077, dec: 22.46422279, mag: 5.62, ci: 1.249, },
		    '1888770': { id: '1888770', con: 'Her', name: '', ra: 18.59177823, dec: 23.60561882, mag: 5.62, ci: 1.015, },
		    '1942861': { id: '1942861', con: 'Dra', name: '', ra: 18.9404768, dec: 65.25808778, mag: 5.62, ci: 0.938, },
		    '1564347': { id: '1564347', con: 'Sco', name: '', ra: 15.92502141, dec: -26.26598888, mag: 5.63, ci: 0.141, },
		    '1583288': { id: '1583288', con: 'Ser', name: '', ra: 16.12709402, dec: 9.89174241, mag: 5.63, ci: 0.2, },
		    '1625569': { id: '1625569', con: 'Her', name: '', ra: 16.54324575, dec: 5.52122167, mag: 5.63, ci: -0.044, },
		    '1682299': { id: '1682299', con: 'Oph', name: '', ra: 17.09229418, dec: -0.89206967, mag: 5.63, ci: 0.104, },
		    '1730881': { id: '1730881', con: 'Her', name: '', ra: 17.51538127, dec: 31.15813671, mag: 5.63, ci: 0.96, },
		    '1871134': { id: '1871134', con: 'CrA', name: '', ra: 18.47419839, dec: -38.99566992, mag: 5.63, ci: 0.14, },
		    '1875522': { id: '1875522', con: 'Sgr', name: '', ra: 18.50329567, dec: -18.72879433, mag: 5.63, ci: 1.057, },
		    '1958294': { id: '1958294', con: 'Sgr', name: '', ra: 19.04102117, dec: -24.84682266, mag: 5.63, ci: 1.232, },
		    '1964776': { id: '1964776', con: 'Lyr', name: '', ra: 19.08274297, dec: 31.74406961, mag: 5.63, ci: 1.548, },
		    '1521018': { id: '1521018', con: 'Lib', name: '', ra: 15.47094637, dec: -16.71648385, mag: 5.64, ci: 1.545, },
		    '1539896': { id: '1539896', con: 'Aps', name: '', ra: 15.67259227, dec: -73.44668611, mag: 5.64, ci: -0.04, },
		    '1646079': { id: '1646079', con: 'Sco', name: '', ra: 16.74516465, dec: -40.83967471, mag: 5.64, ci: -0.093, },
		    '1672288': { id: '1672288', con: 'Ara', name: '', ra: 17.00174451, dec: -54.59717683, mag: 5.64, ci: 0.194, },
		    '1863874': { id: '1863874', con: 'Oph', name: '', ra: 18.42744415, dec: 8.03200565, mag: 5.64, ci: 0.884, },
		    '1936999': { id: '1936999', con: 'Lyr', name: '', ra: 18.90367982, dec: 27.9095299, mag: 5.64, ci: 1.361, },
		    '1508705': { id: '1508705', con: 'Boo', name: '', ra: 15.33476408, dec: 51.95851605, mag: 5.65, ci: 0.122, },
		    '1511231': { id: '1511231', con: 'Lup', name: '', ra: 15.36337532, dec: -48.31762869, mag: 5.65, ci: 0.639, },
		    '1513255': { id: '1513255', con: 'Cir', name: '', ra: 15.38625159, dec: -60.65717134, mag: 5.65, ci: 0.489, },
		    '1535589': { id: '1535589', con: 'UMi', name: '', ra: 15.62753545, dec: 69.28333961, mag: 5.65, ci: 1.371, },
		    '1720152': { id: '1720152', con: 'Dra', name: '', ra: 17.42815384, dec: 60.04839961, mag: 5.65, ci: 0.024, },
		    '1735905': { id: '1735905', con: 'Her', name: '', ra: 17.55634023, dec: 19.25667493, mag: 5.65, ci: 0.505, },
		    '1874386': { id: '1874386', con: 'Dra', name: '', ra: 18.49582381, dec: 77.54706531, mag: 5.65, ci: 1.192, },
		    '1992038': { id: '1992038', con: 'Sge', name: '', ra: 19.25482263, dec: 21.23211728, mag: 5.65, ci: 0.121, },
		    '1995027': { id: '1995027', con: 'Aql', name: '', ra: 19.274108, dec: 14.54461948, mag: 5.65, ci: -0.02, },
		    '1620828': { id: '1620828', con: 'Oph', name: '', ra: 16.49636796, dec: -14.55087357, mag: 5.66, ci: 0.823, },
		    '1694821': { id: '1694821', con: 'Sco', name: '', ra: 17.20450121, dec: -39.50695049, mag: 5.66, ci: 0.042, },
		    '1732693': { id: '1732693', con: 'Her', name: '', ra: 17.53043918, dec: 28.4074972, mag: 5.66, ci: -0.001, },
		    '1590767': { id: '1590767', con: 'Sco', name: '', ra: 16.20445536, dec: -28.4173147, mag: 5.67, ci: 0.012, },
		    '1610383': { id: '1610383', con: 'Dra', name: '', ra: 16.39642878, dec: 61.69651174, mag: 5.67, ci: 0.956, },
		    '1618168': { id: '1618168', con: 'Nor', name: '', ra: 16.47087735, dec: -58.59979085, mag: 5.67, ci: 0.008, },
		    '1821748': { id: '1821748', con: 'Oph', name: '', ra: 18.16500396, dec: 3.11982892, mag: 5.67, ci: 0.49, },
		    '1883567': { id: '1883567', con: 'CrA', name: '', ra: 18.55642597, dec: -38.72598705, mag: 5.67, ci: -0.06, },
		    '1943660': { id: '1943660', con: 'Dra', name: '', ra: 18.94584699, dec: 57.81484609, mag: 5.67, ci: 1.155, },
		    '1506134': { id: '1506134', con: 'Ser', name: '', ra: 15.30680711, dec: 20.572762, mag: 5.68, ci: 0.972, },
		    '1706769': { id: '1706769', con: 'Her', name: '', ra: 17.31347976, dec: 28.82296651, mag: 5.68, ci: 0.981, },
		    '1736459': { id: '1736459', con: 'Her', name: '', ra: 17.56094125, dec: 16.31756805, mag: 5.68, ci: 1.002, },
		    '1771809': { id: '1771809', con: 'Ara', name: '', ra: 17.84122132, dec: -53.61240613, mag: 5.68, ci: -0.099, },
		    '1909529': { id: '1909529', con: 'Lyr', name: '', ra: 18.73099763, dec: 31.92661721, mag: 5.68, ci: 0.36, },
		    '1936425': { id: '1936425', con: 'Sgr', name: '', ra: 18.90002567, dec: -21.35984248, mag: 5.68, ci: 1.206, },
		    '1584655': { id: '1584655', con: 'Ser', name: '', ra: 16.14113205, dec: 8.53431039, mag: 5.69, ci: 1.575, },
		    '1673831': { id: '1673831', con: 'Her', name: '', ra: 17.01614877, dec: 22.63209541, mag: 5.69, ci: 1.332, },
		    '1712371': { id: '1712371', con: 'Dra', name: '', ra: 17.36260267, dec: 53.4204318, mag: 5.69, ci: 1.463, },
		    '1716802': { id: '1716802', con: 'Ara', name: '', ra: 17.40029873, dec: -62.86415383, mag: 5.69, ci: -0.147, },
		    '1738645': { id: '1738645', con: 'Sco', name: '', ra: 17.57846971, dec: -32.58165822, mag: 5.69, ci: 0.045, },
		    '1767292': { id: '1767292', con: 'Her', name: '', ra: 17.80687991, dec: 20.56544129, mag: 5.69, ci: 0.938, },
		    '1795198': { id: '1795198', con: 'Her', name: '', ra: 17.99894639, dec: 45.50137899, mag: 5.69, ci: 1.562, },
		    '1874846': { id: '1874846', con: 'Tel', name: '', ra: 18.49887314, dec: -47.22054872, mag: 5.69, ci: 1.258, },
		    '1917153': { id: '1917153', con: 'Sct', name: '', ra: 18.77870096, dec: -10.1250452, mag: 5.69, ci: 0.584, },
		    '1942021': { id: '1942021', con: 'Her', name: '', ra: 18.93503358, dec: 18.10541487, mag: 5.69, ci: 1.092, },
		    '1955226': { id: '1955226', con: 'Lyr', name: '', ra: 19.02148794, dec: 26.29141274, mag: 5.69, ci: -0.086, },
		    '1580624': { id: '1580624', con: 'Aps', name: '', ra: 16.09883813, dec: -72.40089879, mag: 5.7, ci: 1.169, },
		    '1716995': { id: '1716995', con: 'Her', name: '', ra: 17.40182956, dec: 22.96028298, mag: 5.7, ci: 0.229, },
		    '1519909': { id: '1519909', con: 'TrA', name: '', ra: 15.45918955, dec: -64.53150602, mag: 5.71, ci: 1.646, },
		    '1551047': { id: '1551047', con: 'Ser', name: '', ra: 15.78814412, dec: 14.1153642, mag: 5.71, ci: 0.094, },
		    '1820830': { id: '1820830', con: 'Oph', name: '', ra: 18.15941294, dec: 3.9932855, mag: 5.71, ci: 0.363, },
		    '1857643': { id: '1857643', con: 'Sct', name: '', ra: 18.38671162, dec: -12.01475552, mag: 5.71, ci: 0.006, },
		    '1869927': { id: '1869927', con: 'Ser', name: '', ra: 18.46632572, dec: 6.19410491, mag: 5.71, ci: -0.034, },
		    '1879913': { id: '1879913', con: 'CrA', name: '', ra: 18.53228377, dec: -43.50738461, mag: 5.71, ci: 1.322, },
		    '1922016': { id: '1922016', con: 'Pav', name: '', ra: 18.81052927, dec: -65.07767746, mag: 5.71, ci: 0.268, },
		    '1512460': { id: '1512460', con: 'Dra', name: '', ra: 15.37733744, dec: 63.34144035, mag: 5.72, ci: 1.315, },
		    '1514244': { id: '1514244', con: 'Lib', name: '', ra: 15.397844, dec: -12.3694992, mag: 5.72, ci: 1.039, },
		    '1582722': { id: '1582722', con: 'Lup', name: '', ra: 16.12116955, dec: -36.75566512, mag: 5.72, ci: 0.298, },
		    '1596175': { id: '1596175', con: 'Her', name: '', ra: 16.25795387, dec: 18.80808577, mag: 5.72, ci: 1.126, },
		    '1724838': { id: '1724838', con: 'Ara', name: '', ra: 17.46600224, dec: -52.29718153, mag: 5.72, ci: 1.169, },
		    '1735373': { id: '1735373', con: 'Her', name: '', ra: 17.55201603, dec: 41.24344692, mag: 5.72, ci: 1.089, },
		    '1800517': { id: '1800517', con: 'Sgr', name: '', ra: 18.03177228, dec: -22.78029493, mag: 5.72, ci: -0.03, },
		    '1810856': { id: '1810856', con: 'Her', name: '', ra: 18.09711406, dec: 32.23067884, mag: 5.72, ci: 1.179, },
		    '1564355': { id: '1564355', con: 'Her', name: '', ra: 15.92516415, dec: 42.56619317, mag: 5.73, ci: -0.102, },
		    '1576850': { id: '1576850', con: 'UMi', name: '', ra: 16.05870793, dec: 76.79394216, mag: 5.73, ci: 0.051, },
		    '1655817': { id: '1655817', con: 'Her', name: '', ra: 16.84415498, dec: 29.80653865, mag: 5.73, ci: 1.626, },
		    '1680052': { id: '1680052', con: 'Ara', name: '', ra: 17.07353306, dec: -57.71216637, mag: 5.73, ci: -0.097, },
		    '1756620': { id: '1756620', con: 'Her', name: '', ra: 17.7226569, dec: 24.32782406, mag: 5.73, ci: 0.683, },
		    '1912077': { id: '1912077', con: 'Lyr', name: '', ra: 18.74672408, dec: 37.59461672, mag: 5.73, ci: 0.285, },
		    '1960463': { id: '1960463', con: 'CrA', name: '', ra: 19.05491567, dec: -38.2531483, mag: 5.73, ci: 0.328, },
		    '1503574': { id: '1503574', con: 'Cir', name: '', ra: 15.27686015, dec: -60.90401297, mag: 5.74, ci: -0.057, },
		    '1525266': { id: '1525266', con: 'Dra', name: '', ra: 15.51548989, dec: 64.20869894, mag: 5.74, ci: 0.976, },
		    '1557405': { id: '1557405', con: 'Nor', name: '', ra: 15.85189002, dec: -55.05553289, mag: 5.74, ci: 0.017, },
		    '1569822': { id: '1569822', con: 'TrA', name: '', ra: 15.98281877, dec: -65.03758981, mag: 5.74, ci: -0.066, },
		    '1589786': { id: '1589786', con: 'Her', name: '', ra: 16.19389868, dec: 23.49480116, mag: 5.74, ci: 1.519, },
		    '1640932': { id: '1640932', con: 'Oph', name: '', ra: 16.69513373, dec: 1.18122559, mag: 5.74, ci: 0.336, },
		    '1648822': { id: '1648822', con: 'Ara', name: '', ra: 16.77256239, dec: -58.50359414, mag: 5.74, ci: -0.101, },
		    '1672413': { id: '1672413', con: 'Oph', name: '', ra: 17.00264286, dec: -24.9890702, mag: 5.74, ci: 0.407, },
		    '1708319': { id: '1708319', con: 'UMi', name: '', ra: 17.32697489, dec: 80.13639983, mag: 5.74, ci: 1.499, },
		    '1745833': { id: '1745833', con: 'Ser', name: '', ra: 17.63597336, dec: -10.92626952, mag: 5.74, ci: 1.228, },
		    '1792448': { id: '1792448', con: 'Sgr', name: '', ra: 17.98213587, dec: -36.85837638, mag: 5.74, ci: 0.915, },
		    '1795844': { id: '1795844', con: 'Dra', name: '', ra: 18.00255736, dec: 80.00409427, mag: 5.74, ci: 0.516, },
		    '1811900': { id: '1811900', con: 'Ser', name: '', ra: 18.10422123, dec: -4.75125108, mag: 5.74, ci: 0.968, },
		    '1874880': { id: '1874880', con: 'Pav', name: '', ra: 18.49909402, dec: -57.52314607, mag: 5.74, ci: 0.987, },
		    '1884256': { id: '1884256', con: 'Sct', name: '', ra: 18.56083944, dec: -14.8536142, mag: 5.74, ci: 0.043, },
		    '1893674': { id: '1893674', con: 'Dra', name: '', ra: 18.62597386, dec: 62.52658993, mag: 5.74, ci: -0.045, },
		    '1500173': { id: '1500173', con: 'TrA', name: '', ra: 15.23865905, dec: -70.07947217, mag: 5.75, ci: 3.271, },
		    '1583262': { id: '1583262', con: 'Sco', name: '', ra: 16.12678199, dec: -12.74540062, mag: 5.75, ci: 0.018, },
		    '1611470': { id: '1611470', con: 'Dra', name: '', ra: 16.407037, dec: 55.205096, mag: 5.75, ci: 0.001, },
		    '1717797': { id: '1717797', con: 'Her', name: '', ra: 17.40876017, dec: 16.30100644, mag: 5.75, ci: 0.074, },
		    '1757961': { id: '1757961', con: 'Dra', name: 'Alruba', ra: 17.73310464, dec: 53.80171468, mag: 5.75, ci: 0.017, },
		    '1536573': { id: '1536573', con: 'Boo', name: '', ra: 15.63783888, dec: 46.79769604, mag: 5.76, ci: 0.353, },
		    '1565328': { id: '1565328', con: 'TrA', name: '', ra: 15.93497663, dec: -60.48249044, mag: 5.76, ci: 0.087, },
		    '1604593': { id: '1604593', con: 'Nor', name: '', ra: 16.34034736, dec: -55.13970511, mag: 5.76, ci: 0.97, },
		    '1623208': { id: '1623208', con: 'Her', name: '', ra: 16.52039776, dec: 22.19545684, mag: 5.76, ci: 1.605, },
		    '1676251': { id: '1676251', con: 'Her', name: '', ra: 17.03852675, dec: 25.50562055, mag: 5.76, ci: 1.018, },
		    '1706746': { id: '1706746', con: 'Sco', name: '', ra: 17.31328524, dec: -44.12974611, mag: 5.76, ci: -0.049, },
		    '1714993': { id: '1714993', con: 'Ara', name: '', ra: 17.38531209, dec: -56.52554936, mag: 5.76, ci: 0.994, },
		    '1717363': { id: '1717363', con: 'Ara', name: '', ra: 17.40522151, dec: -60.67380143, mag: 5.76, ci: -0.067, },
		    '1744482': { id: '1744482', con: 'Her', name: '', ra: 17.62530348, dec: 24.3099892, mag: 5.76, ci: 0.114, },
		    '1786604': { id: '1786604', con: 'Sgr', name: '', ra: 17.94495595, dec: -28.0653975, mag: 5.76, ci: 0.207, },
		    '1852972': { id: '1852972', con: 'Sgr', name: '', ra: 18.35638516, dec: -18.86000385, mag: 5.76, ci: 0.67, },
		    '1877682': { id: '1877682', con: 'Her', name: '', ra: 18.51790262, dec: 16.92855825, mag: 5.76, ci: 0.053, },
		    '1893776': { id: '1893776', con: 'Ser', name: '', ra: 18.62665622, dec: -0.30947746, mag: 5.76, ci: 0.067, },
		    '1908882': { id: '1908882', con: 'Pav', name: '', ra: 18.72703873, dec: -64.55142167, mag: 5.76, ci: 0.967, },
		    '1532960': { id: '1532960', con: 'Dra', name: '', ra: 15.59917799, dec: 54.63054517, mag: 5.77, ci: 0.051, },
		    '1631948': { id: '1631948', con: 'Oph', name: '', ra: 16.60595818, dec: -2.32458466, mag: 5.77, ci: 0.827, },
		    '1639105': { id: '1639105', con: 'Her', name: '', ra: 16.677413, dec: 4.21979133, mag: 5.77, ci: -0.004, },
		    '1716685': { id: '1716685', con: 'Oph', name: '', ra: 17.39933801, dec: 8.85257423, mag: 5.77, ci: 1.251, },
		    '1778383': { id: '1778383', con: 'Oph', name: '', ra: 17.88727359, dec: 6.10141993, mag: 5.77, ci: 0.425, },
		    '1878550': { id: '1878550', con: 'Sct', name: '', ra: 18.52380414, dec: -10.79583606, mag: 5.77, ci: 0.379, },
		    '1555775': { id: '1555775', con: 'Nor', name: '', ra: 15.83530124, dec: -53.2097716, mag: 5.78, ci: -0.076, },
		    '1564397': { id: '1564397', con: 'Nor', name: '', ra: 15.92565153, dec: -60.1776411, mag: 5.78, ci: 0.355, },
		    '1567292': { id: '1567292', con: 'Lup', name: '', ra: 15.95592358, dec: -36.18537076, mag: 5.78, ci: 1.095, },
		    '1592645': { id: '1592645', con: 'Nor', name: '', ra: 16.22297125, dec: -55.54094785, mag: 5.78, ci: 0.365, },
		    '1663260': { id: '1663260', con: 'Sco', name: '', ra: 16.91625137, dec: -41.15085471, mag: 5.78, ci: 0.132, },
		    '1730638': { id: '1730638', con: 'UMi', name: '', ra: 17.5132163, dec: 86.96805177, mag: 5.78, ci: 0.239, },
		    '1752338': { id: '1752338', con: 'Ara', name: '', ra: 17.68784468, dec: -46.92182997, mag: 5.78, ci: -0.004, },
		    '1774449': { id: '1774449', con: 'Pav', name: '', ra: 17.85985333, dec: -60.16405687, mag: 5.78, ci: 1.008, },
		    '1895987': { id: '1895987', con: 'Sgr', name: '', ra: 18.64186509, dec: -23.50489403, mag: 5.78, ci: -0.018, },
		    '1969161': { id: '1969161', con: 'Vul', name: '', ra: 19.11066627, dec: 24.25079636, mag: 5.78, ci: 0.104, },
		    '1535823': { id: '1535823', con: 'Lib', name: '', ra: 15.63001106, dec: -23.14170657, mag: 5.79, ci: 1.074, },
		    '1576539': { id: '1576539', con: 'CrB', name: '', ra: 16.05537903, dec: 36.63178937, mag: 5.79, ci: 0.586, },
		    '1618152': { id: '1618152', con: 'Sco', name: '', ra: 16.47068546, dec: -37.17988323, mag: 5.79, ci: 1.104, },
		    '1671322': { id: '1671322', con: 'TrA', name: '', ra: 16.99276707, dec: -69.26816691, mag: 5.79, ci: -0.103, },
		    '1816055': { id: '1816055', con: 'Her', name: '', ra: 18.13041761, dec: 26.0973343, mag: 5.79, ci: 0.127, },
		    '1888030': { id: '1888030', con: 'Her', name: '', ra: 18.58683341, dec: 18.20340409, mag: 5.79, ci: 0.006, },
		    '1986418': { id: '1986418', con: 'Sgr', name: '', ra: 19.22046345, dec: -25.90678577, mag: 5.79, ci: 1.387, },
		    '1542374': { id: '1542374', con: 'Ser', name: '', ra: 15.69853162, dec: 18.46403541, mag: 5.8, ci: 0.207, },
		    '1598226': { id: '1598226', con: 'CrB', name: '', ra: 16.2791078, dec: 29.15026213, mag: 5.8, ci: 0.063, },
		    '1738427': { id: '1738427', con: 'Oph', name: '', ra: 17.57685932, dec: 9.58670467, mag: 5.8, ci: 0.04, },
		    '1924241': { id: '1924241', con: 'Tel', name: '', ra: 18.82426195, dec: -45.81010524, mag: 5.8, ci: 0.891, },
		    '1559267': { id: '1559267', con: 'Dra', name: '', ra: 15.87126593, dec: 55.82671156, mag: 5.81, ci: 0.972, },
		    '1753803': { id: '1753803', con: 'Dra', name: '', ra: 17.69947115, dec: 72.15690621, mag: 5.81, ci: 0.53, },
		    '1841563': { id: '1841563', con: 'Sgr', name: '', ra: 18.28656309, dec: -17.37388506, mag: 5.81, ci: 1.569, },
		    '1864755': { id: '1864755', con: 'Her', name: '', ra: 18.43299653, dec: 29.82893217, mag: 5.81, ci: 0.068, },
		    '1524847': { id: '1524847', con: 'Lib', name: '', ra: 15.51122328, dec: -16.60946279, mag: 5.82, ci: 1.056, },
		    '1530063': { id: '1530063', con: 'Lup', name: '', ra: 15.56714095, dec: -40.06643222, mag: 5.82, ci: 1.695, },
		    '1536576': { id: '1536576', con: 'Lib', name: '', ra: 15.63785579, dec: -21.01631764, mag: 5.82, ci: 1.077, },
		    '1572749': { id: '1572749', con: 'Ser', name: '', ra: 16.01420411, dec: 4.42736332, mag: 5.82, ci: 1.003, },
		    '1718177': { id: '1718177', con: 'Oph', name: '', ra: 17.41167512, dec: -21.44147779, mag: 5.82, ci: 0.939, },
		    '1785613': { id: '1785613', con: 'Oph', name: '', ra: 17.93844467, dec: 0.67035279, mag: 5.82, ci: 0.058, },
		    '1899636': { id: '1899636', con: 'Sct', name: '', ra: 18.66677469, dec: -7.79079655, mag: 5.82, ci: 1.536, },
		    '1912130': { id: '1912130', con: 'Sgr', name: '', ra: 18.74711168, dec: -25.01091649, mag: 5.82, ci: 0.033, },
		    '1913877': { id: '1913877', con: 'Ser', name: '', ra: 18.75789214, dec: 5.50000042, mag: 5.82, ci: 0.041, },
		    '1928258': { id: '1928258', con: 'Sct', name: '', ra: 18.84958572, dec: -9.77409788, mag: 5.82, ci: 0.594, },
		    '1961124': { id: '1961124', con: 'Aql', name: '', ra: 19.05895865, dec: 1.81876257, mag: 5.82, ci: 0.182, },
		    '1611041': { id: '1611041', con: 'Her', name: '', ra: 16.40300836, dec: 6.94820742, mag: 5.83, ci: 0.018, },
		    '1631661': { id: '1631661', con: 'Her', name: '', ra: 16.60311155, dec: 46.61332862, mag: 5.83, ci: 1.044, },
		    '1635434': { id: '1635434', con: 'Sco', name: '', ra: 16.6406365, dec: -43.39842479, mag: 5.83, ci: -0.053, },
		    '1722263': { id: '1722263', con: 'Her', name: '', ra: 17.44562276, dec: 48.2600643, mag: 5.83, ci: 0.121, },
		    '1731920': { id: '1731920', con: 'Aps', name: '', ra: 17.52429589, dec: -80.85913346, mag: 5.83, ci: 1.617, },
		    '1816057': { id: '1816057', con: 'Her', name: '', ra: 18.13043272, dec: 26.10128647, mag: 5.83, ci: 0.158, },
		    '1537049': { id: '1537049', con: 'Boo', name: '', ra: 15.64283278, dec: 50.42327136, mag: 5.84, ci: 0.847, },
		    '1567780': { id: '1567780', con: 'Sco', name: '', ra: 15.96123999, dec: -20.98308295, mag: 5.84, ci: 0.012, },
		    '1641022': { id: '1641022', con: 'Sco', name: '', ra: 16.69595945, dec: -33.14575832, mag: 5.84, ci: 0.653, },
		    '1662307': { id: '1662307', con: 'Sco', name: '', ra: 16.90748403, dec: -42.47889153, mag: 5.84, ci: 0.626, },
		    '1735376': { id: '1735376', con: 'Sco', name: '', ra: 17.55205277, dec: -41.17306581, mag: 5.84, ci: 0.041, },
		    '1776232': { id: '1776232', con: 'Sco', name: '', ra: 17.87215605, dec: -34.41684639, mag: 5.84, ci: 1.129, },
		    '1811578': { id: '1811578', con: 'Ser', name: '', ra: 18.10205549, dec: -8.32395495, mag: 5.84, ci: 0.184, },
		    '1897774': { id: '1897774', con: 'Tel', name: '', ra: 18.65397048, dec: -47.90976773, mag: 5.84, ci: 0.233, },
		    '1938486': { id: '1938486', con: 'Dra', name: '', ra: 18.91308895, dec: 48.85940632, mag: 5.84, ci: 0.452, },
		    '1535402': { id: '1535402', con: 'Dra', name: '', ra: 15.62555786, dec: 54.50872972, mag: 5.85, ci: 1.098, },
		    '1551603': { id: '1551603', con: 'Dra', name: '', ra: 15.79386781, dec: 55.37663993, mag: 5.85, ci: 0.249, },
		    '1896907': { id: '1896907', con: 'Sgr', name: '', ra: 18.64816701, dec: -21.0518731, mag: 5.85, ci: 0.673, },
		    '1983248': { id: '1983248', con: 'Cyg', name: '', ra: 19.20139647, dec: 49.85575094, mag: 5.85, ci: 0.666, },
		    '1545676': { id: '1545676', con: 'Ser', name: '', ra: 15.73383841, dec: 2.51516744, mag: 5.86, ci: 0.684, },
		    '1555481': { id: '1555481', con: 'Nor', name: '', ra: 15.8326373, dec: -48.91240728, mag: 5.86, ci: 0.068, },
		    '1585056': { id: '1585056', con: 'Sco', name: '', ra: 16.14547816, dec: -23.68541716, mag: 5.86, ci: 0.02, },
		    '1589199': { id: '1589199', con: 'Sco', name: '', ra: 16.18825157, dec: -41.11980355, mag: 5.86, ci: 0.273, },
		    '1650418': { id: '1650418', con: 'Her', name: '', ra: 16.78881837, dec: 42.23891439, mag: 5.86, ci: 1.504, },
		    '1660496': { id: '1660496', con: 'Oph', name: '', ra: 16.8903415, dec: -20.41556249, mag: 5.86, ci: 0.685, },
		    '1714575': { id: '1714575', con: 'Ara', name: '', ra: 17.38200731, dec: -58.01031935, mag: 5.86, ci: 1.075, },
		    '1794354': { id: '1794354', con: 'Oph', name: '', ra: 17.99354554, dec: -4.82112428, mag: 5.86, ci: 1.561, },
		    '1824867': { id: '1824867', con: 'CrA', name: '', ra: 18.18487835, dec: -41.35911395, mag: 5.86, ci: 0.295, },
		    '1825306': { id: '1825306', con: 'Aps', name: '', ra: 18.18772292, dec: -75.89151132, mag: 5.86, ci: 1.253, },
		    '1828911': { id: '1828911', con: 'Aps', name: '', ra: 18.20945224, dec: -73.67240647, mag: 5.86, ci: 0.464, },
		    '1977709': { id: '1977709', con: 'CrA', name: '', ra: 19.16601541, dec: -41.89225448, mag: 5.86, ci: -0.08, },
		    '1563008': { id: '1563008', con: 'Sco', name: '', ra: 15.91098023, dec: -25.24373914, mag: 5.87, ci: -0.065, },
		    '1696693': { id: '1696693', con: 'Ara', name: '', ra: 17.22163246, dec: -67.19659014, mag: 5.87, ci: 1.07, },
		    '1743681': { id: '1743681', con: 'Dra', name: '', ra: 17.61913468, dec: 72.45579034, mag: 5.87, ci: 1.016, },
		    '1759481': { id: '1759481', con: 'Sco', name: '', ra: 17.74500262, dec: -42.72928685, mag: 5.87, ci: 0.163, },
		    '1874007': { id: '1874007', con: 'Her', name: '', ra: 18.49325316, dec: 23.86619948, mag: 5.87, ci: -0.096, },
		    '1506188': { id: '1506188', con: 'Ser', name: '', ra: 15.30725742, dec: -0.46123521, mag: 5.88, ci: 1.507, },
		    '1672023': { id: '1672023', con: 'Oph', name: '', ra: 16.99936262, dec: -25.09219956, mag: 5.88, ci: 1.607, },
		    '1775983': { id: '1775983', con: 'Sco', name: '', ra: 17.87046129, dec: -34.79919725, mag: 5.88, ci: -0.111, },
		    '1881997': { id: '1881997', con: 'Her', name: '', ra: 18.54615444, dec: 23.61680126, mag: 5.88, ci: 1.49, },
		    '1882373': { id: '1882373', con: 'Pav', name: '', ra: 18.54870515, dec: -73.96560253, mag: 5.88, ci: 0.992, },
		    '1973815': { id: '1973815', con: 'Cyg', name: '', ra: 19.14049696, dec: 52.42573221, mag: 5.88, ci: 1.086, },
		    '1992367': { id: '1992367', con: 'Lyr', name: '', ra: 19.25690535, dec: 30.52638796, mag: 5.88, ci: 1.665, },
		    '1517939': { id: '1517939', con: 'TrA', name: '', ra: 15.43742355, dec: -68.30916786, mag: 5.89, ci: 1, },
		    '1553171': { id: '1553171', con: 'CrB', name: '', ra: 15.80955959, dec: 28.15674583, mag: 5.89, ci: 0.608, },
		    '1590037': { id: '1590037', con: 'Her', name: '', ra: 16.19655539, dec: 42.37456986, mag: 5.89, ci: 1.464, },
		    '1608196': { id: '1608196', con: 'Nor', name: '', ra: 16.37474067, dec: -43.91204561, mag: 5.89, ci: 1.121, },
		    '1640395': { id: '1640395', con: 'TrA', name: '', ra: 16.68975294, dec: -68.29611773, mag: 5.89, ci: -0.078, },
		    '1702513': { id: '1702513', con: 'Oph', name: '', ra: 17.27547695, dec: 1.21054673, mag: 5.89, ci: 0.023, },
		    '1744337': { id: '1744337', con: 'Ara', name: '', ra: 17.62425397, dec: -50.05970198, mag: 5.89, ci: 1.109, },
		    '1805664': { id: '1805664', con: 'Sgr', name: '', ra: 18.06456828, dec: -24.36073278, mag: 5.89, ci: 0.031, },
		    '1916494': { id: '1916494', con: 'Aql', name: '', ra: 18.77461015, dec: -0.96169649, mag: 5.89, ci: 0.131, },
		    '1922705': { id: '1922705', con: 'Her', name: '', ra: 18.8148298, dec: 19.3287271, mag: 5.89, ci: 0.022, },
		    '1946795': { id: '1946795', con: 'Lyr', name: '', ra: 18.96719384, dec: 38.2661859, mag: 5.89, ci: -0.09, },
		    '1961005': { id: '1961005', con: 'Pav', name: '', ra: 19.05823782, dec: -68.75554728, mag: 5.89, ci: 0.553, },
		    '1520393': { id: '1520393', con: 'Dra', name: '', ra: 15.46428434, dec: 60.670215, mag: 5.9, ci: 1.441, },
		    '1580884': { id: '1580884', con: 'Sco', name: '', ra: 16.10177205, dec: -23.60630363, mag: 5.9, ci: -0.071, },
		    '1723233': { id: '1723233', con: 'Ara', name: '', ra: 17.45346222, dec: -50.63036817, mag: 5.9, ci: 0.063, },
		    '1869523': { id: '1869523', con: 'Sgr', name: '', ra: 18.46374581, dec: -29.81686668, mag: 5.9, ci: 0.517, },
		    '1578525': { id: '1578525', con: 'Lup', name: '', ra: 16.0768938, dec: -37.86294659, mag: 5.91, ci: 0.409, },
		    '1594302': { id: '1594302', con: 'Sco', name: '', ra: 16.23954605, dec: -33.01108841, mag: 5.91, ci: 1.021, },
		    '1654076': { id: '1654076', con: 'Her', name: '', ra: 16.82629447, dec: 13.26115475, mag: 5.91, ci: 0.015, },
		    '1661519': { id: '1661519', con: 'Ara', name: '', ra: 16.90009997, dec: -57.9095102, mag: 5.91, ci: 1.592, },
		    '1678683': { id: '1678683', con: 'Her', name: '', ra: 17.06091723, dec: 13.60534634, mag: 5.91, ci: 0.01, },
		    '1679016': { id: '1679016', con: 'Sco', name: '', ra: 17.06415023, dec: -38.1525772, mag: 5.91, ci: 0.409, },
		    '1707037': { id: '1707037', con: 'Sco', name: '', ra: 17.315842, dec: -34.989792, mag: 5.91, ci: 1.082, },
		    '1714563': { id: '1714563', con: 'Sco', name: '', ra: 17.38187431, dec: -37.22078758, mag: 5.91, ci: 1.075, },
		    '1776879': { id: '1776879', con: 'Oph', name: '', ra: 17.87651194, dec: 1.30501635, mag: 5.91, ci: 1.573, },
		    '1917135': { id: '1917135', con: 'Dra', name: '', ra: 18.77863552, dec: 52.98795784, mag: 5.91, ci: -0.096, },
		    '1941801': { id: '1941801', con: 'Sgr', name: '', ra: 18.93352079, dec: -23.17374928, mag: 5.91, ci: -0.021, },
		    '1948863': { id: '1948863', con: 'Aql', name: '', ra: 18.97970119, dec: 13.90665008, mag: 5.91, ci: 0.251, },
		    '1990345': { id: '1990345', con: 'CrA', name: '', ra: 19.24432279, dec: -45.19352534, mag: 5.91, ci: 0.902, },
		    '1625281': { id: '1625281', con: 'Dra', name: '', ra: 16.54046709, dec: 60.82332424, mag: 5.92, ci: 0.039, },
		    '1640766': { id: '1640766', con: 'Her', name: '', ra: 16.69352767, dec: 26.91688105, mag: 5.92, ci: 0.402, },
		    '1533773': { id: '1533773', con: 'Ser', name: '', ra: 15.6081224, dec: 16.11908712, mag: 5.93, ci: 0.354, },
		    '1546236': { id: '1546236', con: 'Lup', name: '', ra: 15.73963343, dec: -41.81913448, mag: 5.93, ci: -0.007, },
		    '1574683': { id: '1574683', con: 'Dra', name: '', ra: 16.03487752, dec: 52.91591869, mag: 5.93, ci: 1.498, },
		    '1585446': { id: '1585446', con: 'Ser', name: '', ra: 16.14968892, dec: 3.45447697, mag: 5.93, ci: 1.471, },
		    '1585762': { id: '1585762', con: 'Ser', name: '', ra: 16.15311352, dec: 6.37869708, mag: 5.93, ci: 0.988, },
		    '1602385': { id: '1602385', con: 'Her', name: '', ra: 16.31978161, dec: 49.03816102, mag: 5.93, ci: 1.369, },
		    '1636530': { id: '1636530', con: 'Sco', name: '', ra: 16.65145156, dec: -37.21737404, mag: 5.93, ci: -0.035, },
		    '1688581': { id: '1688581', con: 'Sco', name: '', ra: 17.14653835, dec: -30.40372926, mag: 5.93, ci: 0.276, },
		    '1707510': { id: '1707510', con: 'Ara', name: '', ra: 17.32014147, dec: -59.69461949, mag: 5.93, ci: 1.389, },
		    '1726253': { id: '1726253', con: 'Ara', name: '', ra: 17.47747657, dec: -55.16968529, mag: 5.93, ci: 1.113, },
		    '1765526': { id: '1765526', con: 'Ser', name: '', ra: 17.7935499, dec: -14.72582331, mag: 5.93, ci: 0.009, },
		    '1785654': { id: '1785654', con: 'Ser', name: '', ra: 17.93862102, dec: -15.81251808, mag: 5.93, ci: 0.024, },
		    '1879941': { id: '1879941', con: 'Ser', name: '', ra: 18.53249818, dec: -1.00297526, mag: 5.93, ci: 0.17, },
		    '1894541': { id: '1894541', con: 'Sgr', name: '', ra: 18.63178504, dec: -21.39772484, mag: 5.93, ci: 0.189, },
		    '1925084': { id: '1925084', con: 'Lyr', name: '', ra: 18.82942055, dec: 32.81282215, mag: 5.93, ci: -0.154, },
		    '1962205': { id: '1962205', con: 'Tel', name: '', ra: 19.06598824, dec: -51.01860356, mag: 5.93, ci: 1.236, },
		    '1966664': { id: '1966664', con: 'Sgr', name: '', ra: 19.09477209, dec: -15.66041905, mag: 5.93, ci: -0.015, },
		    '1982424': { id: '1982424', con: 'Lyr', name: '', ra: 19.19611345, dec: 31.28345845, mag: 5.93, ci: -0.062, },
		    '1549887': { id: '1549887', con: 'Dra', name: '', ra: 15.77632224, dec: 55.47478977, mag: 5.94, ci: 1.404, },
		    '1665886': { id: '1665886', con: 'Ara', name: '', ra: 16.94132461, dec: -52.2837582, mag: 5.94, ci: -0.069, },
		    '1693673': { id: '1693673', con: 'Ara', name: '', ra: 17.19407838, dec: -48.87339845, mag: 5.94, ci: 1.786, },
		    '1722330': { id: '1722330', con: 'Her', name: '', ra: 17.44615185, dec: 34.69580045, mag: 5.94, ci: -0.017, },
		    '1744659': { id: '1744659', con: 'Ser', name: '', ra: 17.62672322, dec: -15.57103979, mag: 5.94, ci: 0.357, },
		    '1774322': { id: '1774322', con: 'Sco', name: '', ra: 17.85903714, dec: -40.77246415, mag: 5.94, ci: 1.572, },
		    '1812263': { id: '1812263', con: 'Sgr', name: '', ra: 18.10658899, dec: -36.01979105, mag: 5.94, ci: 0.615, },
		    '1539235': { id: '1539235', con: 'Nor', name: '', ra: 15.66570677, dec: -59.90833363, mag: 5.95, ci: 0.505, },
		    '1542370': { id: '1542370', con: 'Aps', name: '', ra: 15.69852247, dec: -76.0819548, mag: 5.95, ci: -0.034, },
		    '1563577': { id: '1563577', con: 'Lib', name: '', ra: 15.91676903, dec: -19.38292445, mag: 5.95, ci: -0.013, },
		    '1598775': { id: '1598775', con: 'TrA', name: '', ra: 16.28483634, dec: -67.94128658, mag: 5.95, ci: 0.159, },
		    '1661021': { id: '1661021', con: 'Sco', name: '', ra: 16.89511824, dec: -43.05097338, mag: 5.95, ci: 1.643, },
		    '1673224': { id: '1673224', con: 'Sco', name: '', ra: 17.01027437, dec: -35.93413364, mag: 5.95, ci: 1.161, },
		    '1696150': { id: '1696150', con: 'Sco', name: '', ra: 17.21626614, dec: -32.43832903, mag: 5.95, ci: 0.071, },
		    '1700800': { id: '1700800', con: 'Sco', name: '', ra: 17.25998561, dec: -38.59394682, mag: 5.95, ci: 0.58, },
		    '1787570': { id: '1787570', con: 'Oph', name: '', ra: 17.95120316, dec: 0.06666181, mag: 5.95, ci: 0.11, },
		    '1873308': { id: '1873308', con: 'Oct', name: '', ra: 18.48887371, dec: -80.23270514, mag: 5.95, ci: 1.173, },
		    '1969887': { id: '1969887', con: 'Tel', name: '', ra: 19.11544624, dec: -48.29914438, mag: 5.95, ci: -0.017, },
		    '1502452': { id: '1502452', con: 'Lup', name: '', ra: 15.2649072, dec: -48.07365827, mag: 5.96, ci: 0.21, },
		    '1645997': { id: '1645997', con: 'Ara', name: '', ra: 16.74437326, dec: -53.15230958, mag: 5.96, ci: 1.23, },
		    '1836139': { id: '1836139', con: 'Sgr', name: '', ra: 18.253603, dec: -20.387974, mag: 5.96, ci: -0.023, },
		    '1836341': { id: '1836341', con: 'Dra', name: '', ra: 18.25474402, dec: 68.75580833, mag: 5.96, ci: 1.055, },
		    '1959881': { id: '1959881', con: 'Sgr', name: '', ra: 19.05105567, dec: -19.24569104, mag: 5.96, ci: 1.158, },
		    '1531946': { id: '1531946', con: 'Dra', name: '', ra: 15.5878326, dec: 53.92214832, mag: 5.97, ci: 1.184, },
		    '1602067': { id: '1602067', con: 'Sco', name: '', ra: 16.31678328, dec: -14.87282052, mag: 5.97, ci: 1.475, },
		    '1705983': { id: '1705983', con: 'Her', name: '', ra: 17.30646341, dec: 38.81139347, mag: 5.97, ci: 1.011, },
		    '1752885': { id: '1752885', con: 'Oph', name: '', ra: 17.69231196, dec: 6.31315877, mag: 5.97, ci: 1.271, },
		    '1759920': { id: '1759920', con: 'Pav', name: '', ra: 17.74885071, dec: -57.54554108, mag: 5.97, ci: 0.912, },
		    '1823437': { id: '1823437', con: 'Dra', name: '', ra: 18.17545562, dec: 54.28655392, mag: 5.97, ci: 0.943, },
		    '1552599': { id: '1552599', con: 'Ser', name: '', ra: 15.80369637, dec: 13.78907784, mag: 5.98, ci: 1.272, },
		    '1672936': { id: '1672936', con: 'Ara', name: '', ra: 17.00748976, dec: -48.6478359, mag: 5.98, ci: 0.883, },
		    '1683862': { id: '1683862', con: 'Sco', name: '', ra: 17.10560765, dec: -37.22759478, mag: 5.98, ci: 0.076, },
		    '1687568': { id: '1687568', con: 'Oph', name: '', ra: 17.13745958, dec: -17.60905335, mag: 5.98, ci: 1.011, },
		    '1700310': { id: '1700310', con: 'Oph', name: '', ra: 17.25563522, dec: -14.58415219, mag: 5.98, ci: 1.096, },
		    '1724155': { id: '1724155', con: 'Oph', name: '', ra: 17.46043087, dec: -29.72456696, mag: 5.98, ci: 0.01, },
		    '1726795': { id: '1726795', con: 'Sco', name: '', ra: 17.48224659, dec: -36.77827925, mag: 5.98, ci: 1.112, },
		    '1808280': { id: '1808280', con: 'Sgr', name: '', ra: 18.08066087, dec: -35.90144467, mag: 5.98, ci: 1.16, },
		    '1826610': { id: '1826610', con: 'Her', name: '', ra: 18.19586655, dec: 33.44705292, mag: 5.98, ci: 0.045, },
		    '1952097': { id: '1952097', con: 'Pav', name: '', ra: 19.00098969, dec: -66.65361946, mag: 5.98, ci: 0.977, },
		    '1512432': { id: '1512432', con: 'Dra', name: '', ra: 15.37701641, dec: 62.04707872, mag: 5.99, ci: -0.033, },
		    '1643330': { id: '1643330', con: 'UMi', name: '', ra: 16.71841443, dec: 77.51397719, mag: 5.99, ci: 0.43, },
		    '1646552': { id: '1646552', con: 'Sco', name: '', ra: 16.75005265, dec: -28.5096577, mag: 5.99, ci: 0.103, },
		    '1660269': { id: '1660269', con: 'Her', name: '', ra: 16.8882102, dec: 47.41672875, mag: 5.99, ci: 1.325, },
		    '1664048': { id: '1664048', con: 'Ara', name: '', ra: 16.92352513, dec: -63.26966702, mag: 5.99, ci: 0.059, },
		    '1700956': { id: '1700956', con: 'Her', name: '', ra: 17.26151966, dec: 23.74275619, mag: 5.99, ci: 1.335, },
		    '1731770': { id: '1731770', con: 'Ara', name: '', ra: 17.52313463, dec: -56.92096239, mag: 5.99, ci: -0.045, },
		    '1791708': { id: '1791708', con: 'Sgr', name: '', ra: 17.97751362, dec: -28.75908795, mag: 5.99, ci: -0.077, },
		    '1840769': { id: '1840769', con: 'Ser', name: '', ra: 18.28141723, dec: -3.00740174, mag: 5.99, ci: 0.89, },
		    '1856028': { id: '1856028', con: 'Oph', name: '', ra: 18.37647731, dec: 12.02968239, mag: 5.99, ci: 0.056, },
		    '1924856': { id: '1924856', con: 'Sct', name: '', ra: 18.82804315, dec: -5.91286359, mag: 5.99, ci: 1.568, },
		    '1938717': { id: '1938717', con: 'Lyr', name: '', ra: 18.91459031, dec: 33.96854795, mag: 5.99, ci: 0.922, },
		    '1540919': { id: '1540919', con: 'Ser', name: '', ra: 15.68308342, dec: 16.02458709, mag: 6, ci: 0.908, },
		    '1558058': { id: '1558058', con: 'Nor', name: '', ra: 15.85872674, dec: -47.06080351, mag: 6, ci: 1.152, },
		    '1576920': { id: '1576920', con: 'Lup', name: '', ra: 16.0595439, dec: -32.00053256, mag: 6, ci: 0.47, },
		    '1681793': { id: '1681793', con: 'Oph', name: '', ra: 17.08800512, dec: 0.70255983, mag: 6, ci: 0.578, },
		    '1705396': { id: '1705396', con: 'Her', name: '', ra: 17.30137173, dec: 17.31788934, mag: 6, ci: 0.015, },
		    '1752533': { id: '1752533', con: 'Dra', name: '', ra: 17.68938354, dec: 51.81816437, mag: 6, ci: 1.068, },
		    '1779963': { id: '1779963', con: 'Sco', name: '', ra: 17.89854766, dec: -34.75272186, mag: 6, ci: -0.06, },
		    '1899324': { id: '1899324', con: 'Dra', name: '', ra: 18.66467144, dec: 52.19607557, mag: 6, ci: -0.067, },
		    '1969720': { id: '1969720', con: 'Sgr', name: '', ra: 19.11447731, dec: -16.22926693, mag: 6, ci: -0.025, },
		    '2089783': { id: '2089783', con: 'Aql', name: 'Altair', ra: 19.84630057, dec: 8.86738491, mag: 0.76, ci: 0.221, },
		    '2469000': { id: '2469000', con: 'PsA', name: 'Fomalhaut', ra: 22.96078488, dec: -29.62183701, mag: 1.17, ci: 0.145, },
		    '2220894': { id: '2220894', con: 'Cyg', name: 'Deneb', ra: 20.69053151, dec: 45.28033423, mag: 1.25, ci: 0.092, },
		    '2389094': { id: '2389094', con: 'Gru', name: 'Alnair', ra: 22.13718789, dec: -46.96061593, mag: 1.73, ci: -0.07, },
		    '2183027': { id: '2183027', con: 'Pav', name: 'Peacock', ra: 20.42745823, dec: -56.73488071, mag: 1.94, ci: -0.118, },
		    '2445914': { id: '2445914', con: 'Gru', name: 'Tiaki', ra: 22.71112486, dec: -46.88458025, mag: 2.07, ci: 1.61, },
		    '2174213': { id: '2174213', con: 'Cyg', name: 'Sadr', ra: 20.37047292, dec: 40.25667904, mag: 2.23, ci: 0.673, },
		    '2347023': { id: '2347023', con: 'Peg', name: 'Enif', ra: 21.736433, dec: 9.875011, mag: 2.38, ci: 1.52, },
		    '2477939': { id: '2477939', con: 'Peg', name: 'Scheat', ra: 23.06290462, dec: 28.08278481, mag: 2.44, ci: 1.655, },
		    '2299133': { id: '2299133', con: 'Cep', name: 'Alderamin', ra: 21.30963, dec: 62.585573, mag: 2.45, ci: 0.257, },
		    '2232181': { id: '2232181', con: 'Cyg', name: 'Aljanah', ra: 20.77018972, dec: 33.97025353, mag: 2.48, ci: 1.021, },
		    '2479353': { id: '2479353', con: 'Peg', name: 'Markab', ra: 23.079348, dec: 15.205264, mag: 2.49, ci: -0.002, },
		    '2076374': { id: '2076374', con: 'Aql', name: 'Tarazed', ra: 19.77099443, dec: 10.61326319, mag: 2.72, ci: 1.507, },
		    '2352054': { id: '2352054', con: 'Cap', name: 'Deneb Algedi', ra: 21.784011, dec: -16.127286, mag: 2.85, ci: 0.18, },
		    '2072556': { id: '2072556', con: 'Cyg', name: 'Fawaris', ra: 19.749574, dec: 45.13081, mag: 2.86, ci: -0.002, },
		    '2406725': { id: '2406725', con: 'Tuc', name: '', ra: 22.30835991, dec: -60.25959646, mag: 2.87, ci: 1.39, },
		    '2323395': { id: '2323395', con: 'Aqr', name: 'Sadalsuud', ra: 21.525982, dec: -5.571172, mag: 2.9, ci: 0.828, },
		    '2446484': { id: '2446484', con: 'Peg', name: 'Matar', ra: 22.7167053, dec: 30.22124754, mag: 2.93, ci: 0.852, },
		    '2384866': { id: '2384866', con: 'Aqr', name: 'Sadalmelik', ra: 22.09639885, dec: -0.31984929, mag: 2.95, ci: 0.969, },
		    '2364036': { id: '2364036', con: 'Gru', name: 'Aldhanab', ra: 21.89881363, dec: -37.3648735, mag: 3, ci: -0.084, },
		    '2032106': { id: '2032106', con: 'Cyg', name: 'Albireo', ra: 19.51202391, dec: 27.95967854, mag: 3.05, ci: 1.088, },
		    '2171237': { id: '2171237', con: 'Cap', name: 'Dabih', ra: 20.35018672, dec: -14.78140739, mag: 3.05, ci: 0.79, },
		    '2211969': { id: '2211969', con: 'Ind', name: '', ra: 20.62612049, dec: -47.29150209, mag: 3.11, ci: 0.998, },
		    '2288218': { id: '2288218', con: 'Cyg', name: '', ra: 21.21560564, dec: 30.22694106, mag: 3.21, ci: 0.99, },
		    '2524646': { id: '2524646', con: 'Cep', name: 'Errai', ra: 23.65577767, dec: 77.6323124, mag: 3.21, ci: 1.031, },
		    '2317987': { id: '2317987', con: 'Cep', name: 'Alfirk', ra: 21.477662, dec: 70.560716, mag: 3.23, ci: -0.201, },
		    '2146295': { id: '2146295', con: 'Aql', name: '', ra: 20.188413, dec: -0.821461, mag: 3.24, ci: -0.066, },
		    '2464399': { id: '2464399', con: 'Aqr', name: 'Skat', ra: 22.910837, dec: -15.82082, mag: 3.27, ci: 0.066, },
		    '2018381': { id: '2018381', con: 'Aql', name: '', ra: 19.42497188, dec: 3.11478558, mag: 3.36, ci: 0.319, },
		    '2393646': { id: '2393646', con: 'Cep', name: '', ra: 22.18090994, dec: 58.20125999, mag: 3.39, ci: 1.558, },
		    '2230077': { id: '2230077', con: 'Cep', name: '', ra: 20.75482691, dec: 61.83878016, mag: 3.41, ci: 0.912, },
		    '2444039': { id: '2444039', con: 'Peg', name: 'Homam', ra: 22.691033, dec: 10.831364, mag: 3.41, ci: -0.086, },
		    '2229248': { id: '2229248', con: 'Pav', name: '', ra: 20.74930395, dec: -66.20321518, mag: 3.42, ci: 0.163, },
		    '2455096': { id: '2455096', con: 'Gru', name: '', ra: 22.8092493, dec: -51.31687677, mag: 3.49, ci: 0.083, },
		    '2456848': { id: '2456848', con: 'Cep', name: '', ra: 22.82800469, dec: 66.20040964, mag: 3.5, ci: 1.053, },
		    '2112347': { id: '2112347', con: 'Sge', name: '', ra: 19.97928575, dec: 19.49214977, mag: 3.51, ci: 1.571, },
		    '2457353': { id: '2457353', con: 'Peg', name: 'Sadalbari', ra: 22.83338727, dec: 24.60157698, mag: 3.51, ci: 0.933, },
		    '2392548': { id: '2392548', con: 'Peg', name: 'Biham', ra: 22.169996, dec: 6.197865, mag: 3.52, ci: 0.086, },
		    '2139414': { id: '2139414', con: 'Pav', name: '', ra: 20.14544678, dec: -66.18206983, mag: 3.55, ci: 0.751, },
		    '2163643': { id: '2163643', con: 'Cap', name: 'Algedi', ra: 20.300904, dec: -12.544852, mag: 3.58, ci: 0.883, },
		    '2475282': { id: '2475282', con: 'And', name: '', ra: 23.032017, dec: 42.325979, mag: 3.62, ci: -0.099, },
		    '2211936': { id: '2211936', con: 'Del', name: 'Rotanev', ra: 20.62581554, dec: 14.59511021, mag: 3.64, ci: 0.425, },
		    '2423886': { id: '2423886', con: 'Aqr', name: '', ra: 22.480531, dec: -0.019972, mag: 3.65, ci: 0.406, },
		    '2251606': { id: '2251606', con: 'Ind', name: '', ra: 20.91350072, dec: -58.45415412, mag: 3.67, ci: 1.25, },
		    '2079759': { id: '2079759', con: 'Sge', name: '', ra: 19.78979663, dec: 18.53428307, mag: 3.68, ci: 1.313, },
		    '2485733': { id: '2485733', con: 'Aqr', name: '', ra: 23.157443, dec: -21.17241, mag: 3.68, ci: 1.202, },
		    '2339523': { id: '2339523', con: 'Cap', name: 'Nashira', ra: 21.668181, dec: -16.662308, mag: 3.69, ci: 0.32, },
		    '2496250': { id: '2496250', con: 'Psc', name: '', ra: 23.28609376, dec: 3.28228654, mag: 3.7, ci: 0.916, },
		    '2102729': { id: '2102729', con: 'Aql', name: 'Alshain', ra: 19.92188674, dec: 6.40676319, mag: 3.71, ci: 0.855, },
		    '2272176': { id: '2272176', con: 'Cyg', name: '', ra: 21.08218416, dec: 43.92785195, mag: 3.72, ci: 1.609, },
		    '2342086': { id: '2342086', con: 'Oct', name: '', ra: 21.691253, dec: -77.390046, mag: 3.73, ci: 1.008, },
		    '2461296': { id: '2461296', con: 'Aqr', name: '', ra: 22.87691, dec: -7.579599, mag: 3.73, ci: 1.626, },
		    '2291904': { id: '2291904', con: 'Cyg', name: '', ra: 21.24651725, dec: 38.04538156, mag: 3.74, ci: 0.393, },
		    '2029314': { id: '2029314', con: 'Cyg', name: '', ra: 19.49509967, dec: 51.72978175, mag: 3.76, ci: 0.148, },
		    '2427859': { id: '2427859', con: 'Lac', name: '', ra: 22.521515, dec: 50.282491, mag: 3.76, ci: 0.031, },
		    '2216760': { id: '2216760', con: 'Del', name: 'Sualocin', ra: 20.660635, dec: 15.912072, mag: 3.77, ci: -0.057, },
		    '2314277': { id: '2314277', con: 'Cap', name: '', ra: 21.444452, dec: -22.411332, mag: 3.77, ci: 1.002, },
		    '2386928': { id: '2386928', con: 'Peg', name: '', ra: 22.11685179, dec: 25.34511025, mag: 3.77, ci: 0.435, },
		    '2235603': { id: '2235603', con: 'Aqr', name: 'Albali', ra: 20.79459785, dec: -9.49577641, mag: 3.78, ci: 0, },
		    '2152426': { id: '2152426', con: 'Cyg', name: '', ra: 20.22719621, dec: 46.74133072, mag: 3.8, ci: 1.27, },
		    '2522357': { id: '2522357', con: 'And', name: '', ra: 23.62606751, dec: 46.45815324, mag: 3.81, ci: 0.984, },
		    '2082118': { id: '2082118', con: 'Dra', name: '', ra: 19.80285, dec: 70.26793, mag: 3.84, ci: 0.888, },
		    '2412000': { id: '2412000', con: 'Aqr', name: 'Sadachbia', ra: 22.360938, dec: -1.387331, mag: 3.86, ci: -0.057, },
		    '2094650': { id: '2094650', con: 'Aql', name: '', ra: 19.8745469, dec: 1.00565902, mag: 3.87, ci: 0.63, },
		    '2486972': { id: '2486972', con: 'Gru', name: '', ra: 23.17264936, dec: -45.24671916, mag: 3.88, ci: 0.998, },
		    '2105497': { id: '2105497', con: 'Cyg', name: '', ra: 19.93843681, dec: 35.08342314, mag: 3.89, ci: 1.019, },
		    '2008520': { id: '2008520', con: 'Sgr', name: '', ra: 19.36121085, dec: -17.84720025, mag: 3.92, ci: 0.228, },
		    '2293929': { id: '2293929', con: 'Equ', name: 'Kitalpha', ra: 21.26373002, dec: 5.24786527, mag: 3.92, ci: 0.549, },
		    '2256522': { id: '2256522', con: 'Cyg', name: '', ra: 20.95289467, dec: 41.16715777, mag: 3.94, ci: 0.027, },
		    '2011001': { id: '2011001', con: 'Sgr', name: 'Arkab Prior', ra: 19.3773033, dec: -44.45896074, mag: 3.96, ci: -0.085, },
		    '2014135': { id: '2014135', con: 'Sgr', name: 'Rukbat', ra: 19.39810471, dec: -40.61593839, mag: 3.96, ci: -0.105, },
		    '2157062': { id: '2157062', con: 'Cyg', name: '', ra: 20.25786656, dec: 47.71421473, mag: 3.96, ci: 1.451, },
		    '2503767': { id: '2503767', con: 'Aqr', name: '', ra: 23.382842, dec: -20.10058, mag: 3.96, ci: 1.082, },
		    '2117369': { id: '2117369', con: 'Pav', name: '', ra: 20.00987499, dec: -72.91050438, mag: 3.97, ci: -0.032, },
		    '2424578': { id: '2424578', con: 'Gru', name: '', ra: 22.48782624, dec: -43.49556021, mag: 3.97, ci: 1.022, },
		    '2451979': { id: '2451979', con: 'Peg', name: '', ra: 22.775521, dec: 23.565654, mag: 3.97, ci: 1.07, },
		    '2327959': { id: '2327959', con: 'Cyg', name: '', ra: 21.56634777, dec: 45.59183521, mag: 3.98, ci: 0.885, },
		    '2496587': { id: '2496587', con: 'Tuc', name: '', ra: 23.29049515, dec: -58.23573669, mag: 3.99, ci: 0.41, },
		    '2192305': { id: '2192305', con: 'Cyg', name: '', ra: 20.4899263, dec: 30.368555, mag: 4.01, ci: 0.404, },
		    '2201580': { id: '2201580', con: 'Del', name: 'Aldulfin', ra: 20.553547, dec: 11.303263, mag: 4.03, ci: -0.123, },
		    '2551223': { id: '2551223', con: 'Psc', name: '', ra: 23.98852488, dec: 6.86331901, mag: 4.03, ci: 0.419, },
		    '2434398': { id: '2434398', con: 'Aqr', name: '', ra: 22.589272, dec: -0.117498, mag: 4.04, ci: -0.083, },
		    '2456709': { id: '2456709', con: 'Aqr', name: '', ra: 22.82652815, dec: -13.59262957, mag: 4.05, ci: 1.57, },
		    '2424437': { id: '2424437', con: 'Cep', name: '', ra: 22.48618451, dec: 58.4152036, mag: 4.07, ci: 0.778, },
		    '2274304': { id: '2274304', con: 'Cap', name: '', ra: 21.099118, dec: -17.232861, mag: 4.08, ci: -0.01, },
		    '2305862': { id: '2305862', con: 'Peg', name: '', ra: 21.36811121, dec: 19.80450879, mag: 4.08, ci: 1.108, },
		    '2473749': { id: '2473749', con: 'Gru', name: '', ra: 23.01466896, dec: -52.75413675, mag: 4.11, ci: 0.96, },
		    '2102592': { id: '2102592', con: 'Sgr', name: '', ra: 19.921027, dec: -41.86827352, mag: 4.12, ci: 1.063, },
		    '2245042': { id: '2245042', con: 'Cap', name: '', ra: 20.86369193, dec: -26.91913232, mag: 4.12, ci: 1.633, },
		    '2425399': { id: '2425399', con: 'Gru', name: '', ra: 22.49595451, dec: -43.74921705, mag: 4.12, ci: 1.57, },
		    '2231926': { id: '2231926', con: 'Cap', name: '', ra: 20.76826, dec: -25.270898, mag: 4.13, ci: 0.426, },
		    '2451242': { id: '2451242', con: 'Oct', name: '', ra: 22.76763673, dec: -81.38161865, mag: 4.13, ci: 0.208, },
		    '2525456': { id: '2525456', con: 'Psc', name: '', ra: 23.66584478, dec: 5.62629106, mag: 4.13, ci: 0.507, },
		    '2347857': { id: '2347857', con: 'Peg', name: '', ra: 21.74409098, dec: 25.645031, mag: 4.14, ci: 0.425, },
		    '2402405': { id: '2402405', con: 'Lac', name: '', ra: 22.26615999, dec: 37.74874008, mag: 4.14, ci: 1.447, },
		    '2526052': { id: '2526052', con: 'And', name: '', ra: 23.67347401, dec: 44.33393551, mag: 4.15, ci: -0.071, },
		    '2403906': { id: '2403906', con: 'Aqr', name: 'Ancha', ra: 22.28056584, dec: -7.78328831, mag: 4.17, ci: 0.979, },
		    '2400800': { id: '2400800', con: 'Cep', name: '', ra: 22.250544, dec: 57.043587, mag: 4.18, ci: 0.278, },
		    '2442754': { id: '2442754', con: 'PsA', name: '', ra: 22.67759527, dec: -27.04361888, mag: 4.18, ci: -0.105, },
		    '2452206': { id: '2452206', con: 'Peg', name: '', ra: 22.77821713, dec: 12.17288835, mag: 4.2, ci: 0.502, },
		    '2466420': { id: '2466420', con: 'PsA', name: '', ra: 22.93247277, dec: -32.53962916, mag: 4.2, ci: 0.952, },
		    '2192749': { id: '2192749', con: 'Cep', name: '', ra: 20.493015, dec: 62.994105, mag: 4.21, ci: 0.199, },
		    '2313874': { id: '2313874', con: 'Pav', name: '', ra: 21.440705, dec: -65.366198, mag: 4.21, ci: 0.494, },
		    '2230964': { id: '2230964', con: 'Cyg', name: '', ra: 20.76104278, dec: 30.71971549, mag: 4.22, ci: 1.051, },
		    '2296972': { id: '2296972', con: 'Cyg', name: '', ra: 21.29026466, dec: 39.39468006, mag: 4.22, ci: 0.098, },
		    '2492335': { id: '2492335', con: 'Aqr', name: '', ra: 23.23870961, dec: -6.04900112, mag: 4.22, ci: 1.545, },
		    '2345801': { id: '2345801', con: 'Cep', name: '', ra: 21.72512804, dec: 58.78004333, mag: 4.23, ci: 2.242, },
		    '2351597': { id: '2351597', con: 'Cyg', name: '', ra: 21.779891, dec: 49.30957, mag: 4.23, ci: -0.12, },
		    '2494515': { id: '2494515', con: 'Aqr', name: '', ra: 23.26485994, dec: -9.08773573, mag: 4.24, ci: 1.107, },
		    '2349232': { id: '2349232', con: 'Cep', name: '', ra: 21.75748, dec: 61.120806, mag: 4.25, ci: 0.474, },
		    '2381451': { id: '2381451', con: 'Cep', name: 'Kurhah', ra: 22.0631812, dec: 64.62796997, mag: 4.26, ci: 0.379, },
		    '2012471': { id: '2012471', con: 'Sgr', name: 'Arkab Posterior', ra: 19.38698243, dec: -44.79978637, mag: 4.27, ci: 0.35, },
		    '2233277': { id: '2233277', con: 'Del', name: '', ra: 20.77763888, dec: 16.12429081, mag: 4.27, ci: 1.042, },
		    '2510181': { id: '2510181', con: 'Psc', name: '', ra: 23.4661377, dec: 6.37898978, mag: 4.27, ci: 1.062, },
		    '2151854': { id: '2151854', con: 'Cyg', name: '', ra: 20.22329633, dec: 56.56772172, mag: 4.28, ci: 0.114, },
		    '2306147': { id: '2306147', con: 'Cap', name: '', ra: 21.37077661, dec: -16.83454194, mag: 4.28, ci: 0.888, },
		    '2392166': { id: '2392166', con: 'Peg', name: '', ra: 22.16645639, dec: 33.17822027, mag: 4.28, ci: 0.471, },
		    '2482251': { id: '2482251', con: 'Gru', name: '', ra: 23.11464967, dec: -43.52035831, mag: 4.28, ci: 0.423, },
		    '2385967': { id: '2385967', con: 'Aqr', name: '', ra: 22.10728585, dec: -13.86968033, mag: 4.29, ci: -0.075, },
		    '2428193': { id: '2428193', con: 'PsA', name: '', ra: 22.52509197, dec: -32.34607797, mag: 4.29, ci: 0.011, },
		    '2523094': { id: '2523094', con: 'And', name: '', ra: 23.63561169, dec: 43.26807471, mag: 4.29, ci: -0.083, },
		    '2162591': { id: '2162591', con: 'Cap', name: '', ra: 20.29413034, dec: -12.50821473, mag: 4.3, ci: 0.928, },
		    '2213778': { id: '2213778', con: 'Aql', name: '', ra: 20.63896785, dec: -1.10511663, mag: 4.31, ci: 0.949, },
		    '2347631': { id: '2347631', con: 'Peg', name: '', ra: 21.7418599, dec: 17.35001622, mag: 4.34, ci: 1.161, },
		    '2424990': { id: '2424990', con: 'Lac', name: '', ra: 22.49217244, dec: 47.70688812, mag: 4.34, ci: 1.679, },
		    '2348377': { id: '2348377', con: 'PsA', name: '', ra: 21.74911395, dec: -33.02578052, mag: 4.35, ci: -0.053, },
		    '2048742': { id: '2048742', con: 'Aql', name: '', ra: 19.612022, dec: -1.286601, mag: 4.36, ci: -0.079, },
		    '2115042': { id: '2115042', con: 'Sgr', name: '', ra: 19.99560529, dec: -35.27630705, mag: 4.37, ci: -0.15, },
		    '2139856': { id: '2139856', con: 'Cep', name: '', ra: 20.14815287, dec: 77.71142163, mag: 4.38, ci: -0.046, },
		    '2507722': { id: '2507722', con: 'Aqr', name: '', ra: 23.43410717, dec: -20.64201578, mag: 4.38, ci: 1.46, },
		    '2516487': { id: '2516487', con: 'Scl', name: '', ra: 23.549515, dec: -37.81827844, mag: 4.38, ci: -0.095, },
		    '2058478': { id: '2058478', con: 'Sge', name: 'Sham', ra: 19.66827544, dec: 18.01389215, mag: 4.39, ci: 0.777, },
		    '2061170': { id: '2061170', con: 'Sge', name: '', ra: 19.68414963, dec: 17.47604483, mag: 4.39, ci: 1.041, },
		    '2301633': { id: '2301633', con: 'Ind', name: '', ra: 21.331096, dec: -53.449427, mag: 4.39, ci: 0.191, },
		    '2371128': { id: '2371128', con: 'Ind', name: '', ra: 21.96529969, dec: -54.99257315, mag: 4.4, ci: 0.297, },
		    '2297900': { id: '2297900', con: 'Cyg', name: '', ra: 21.298632, dec: 34.896898, mag: 4.41, ci: -0.103, },
		    '2483624': { id: '2483624', con: 'Cep', name: '', ra: 23.13162264, dec: 75.38753356, mag: 4.41, ci: 0.802, },
		    '2497203': { id: '2497203', con: 'Aqr', name: '', ra: 23.298393, dec: -9.182513, mag: 4.41, ci: -0.144, },
		    '2498377': { id: '2498377', con: 'Scl', name: '', ra: 23.31373315, dec: -32.53202066, mag: 4.41, ci: 1.109, },
		    '2415210': { id: '2415210', con: 'Lac', name: '', ra: 22.39267317, dec: 52.22904846, mag: 4.42, ci: 1.015, },
		    '2506846': { id: '2506846', con: 'Peg', name: 'Alkarab', ra: 23.4229955, dec: 23.40410164, mag: 4.42, ci: 0.617, },
		    '2123017': { id: '2123017', con: 'Sgr', name: '', ra: 20.04429991, dec: -27.70984656, mag: 4.43, ci: 1.64, },
		    '2178414': { id: '2178414', con: 'Cyg', name: '', ra: 20.39767338, dec: 32.19018145, mag: 4.43, ci: 1.331, },
		    '2225762': { id: '2225762', con: 'Del', name: '', ra: 20.72431506, dec: 15.07457822, mag: 4.43, ci: 0.302, },
		    '2235734': { id: '2235734', con: 'Aqr', name: '', ra: 20.79562154, dec: -5.02769968, mag: 4.43, ci: 1.639, },
		    '2026703': { id: '2026703', con: 'Vul', name: 'Anser', ra: 19.47842473, dec: 24.66490581, mag: 4.44, ci: 1.502, },
		    '2041414': { id: '2041414', con: 'Aql', name: '', ra: 19.56815361, dec: 7.37894182, mag: 4.45, ci: 1.176, },
		    '2461145': { id: '2461145', con: 'PsA', name: '', ra: 22.87542566, dec: -32.87555453, mag: 4.46, ci: -0.037, },
		    '2291283': { id: '2291283', con: 'Equ', name: '', ra: 21.24133717, dec: 10.0069808, mag: 4.47, ci: 0.529, },
		    '2385423': { id: '2385423', con: 'Gru', name: '', ra: 22.10191271, dec: -39.54335163, mag: 4.47, ci: 1.349, },
		    '2478094': { id: '2478094', con: 'Psc', name: 'Fumalsamakah', ra: 23.06461506, dec: 3.82004928, mag: 4.48, ci: -0.115, },
		    '2481975': { id: '2481975', con: 'Aqr', name: '', ra: 23.111345, dec: -23.743115, mag: 4.48, ci: 0.892, },
		    '2047935': { id: '2047935', con: 'Cyg', name: '', ra: 19.60737039, dec: 50.22109911, mag: 4.49, ci: 0.395, },
		    '2276684': { id: '2276684', con: 'Cap', name: '', ra: 21.11879676, dec: -25.00585286, mag: 4.49, ci: 1.604, },
		    '2346958': { id: '2346958', con: 'Cyg', name: '', ra: 21.73571494, dec: 28.74264837, mag: 4.49, ci: 0.512, },
		    '2528171': { id: '2528171', con: 'Psc', name: '', ra: 23.70077962, dec: 1.78004045, mag: 4.49, ci: 0.2, },
		    '2528990': { id: '2528990', con: 'Aqr', name: '', ra: 23.71204017, dec: -14.54490451, mag: 4.49, ci: -0.032, },
		    '2552072': { id: '2552072', con: 'Tuc', name: '', ra: 23.99860547, dec: -65.57713312, mag: 4.49, ci: -0.075, },
		    '2157813': { id: '2157813', con: 'Vul', name: '', ra: 20.26281494, dec: 27.81424753, mag: 4.5, ci: 1.258, },
		    '2281713': { id: '2281713', con: 'Aqr', name: '', ra: 21.15990234, dec: -11.37169266, mag: 4.5, ci: 0.926, },
		    '2318114': { id: '2318114', con: 'Cap', name: '', ra: 21.47872223, dec: -21.80718172, mag: 4.5, ci: 0.889, },
		    '2389361': { id: '2389361', con: 'PsA', name: '', ra: 22.13972421, dec: -32.98846662, mag: 4.5, ci: 0.054, },
		    '2398816': { id: '2398816', con: 'Lac', name: '', ra: 22.23131374, dec: 39.71492837, mag: 4.5, ci: 1.385, },
		    '2442546': { id: '2442546', con: 'Lac', name: '', ra: 22.6752385, dec: 44.27630691, mag: 4.5, ci: 1.318, },
		    '2123442': { id: '2123442', con: 'Dra', name: '', ra: 20.04696423, dec: 67.87356441, mag: 4.51, ci: 1.313, },
		    '2227111': { id: '2227111', con: 'Ind', name: '', ra: 20.73398125, dec: -51.9209739, mag: 4.51, ci: 0.278, },
		    '2333785': { id: '2333785', con: 'Cap', name: '', ra: 21.618008, dec: -19.466011, mag: 4.51, ci: -0.18, },
		    '2421545': { id: '2421545', con: 'Tuc', name: '', ra: 22.45554643, dec: -64.96635976, mag: 4.51, ci: -0.029, },
		    '2544581': { id: '2544581', con: 'Cas', name: '', ra: 23.90639745, dec: 57.49938359, mag: 4.51, ci: 1.19, },
		    '2008656': { id: '2008656', con: 'Sgr', name: '', ra: 19.36211767, dec: -15.95501735, mag: 4.52, ci: 0.079, },
		    '2230222': { id: '2230222', con: 'Cep', name: '', ra: 20.75586884, dec: 57.5797272, mag: 4.52, ci: 0.535, },
		    '2320421': { id: '2320421', con: 'Peg', name: '', ra: 21.49913746, dec: 23.63883727, mag: 4.52, ci: 1.618, },
		    '2426591': { id: '2426591', con: 'Lac', name: '', ra: 22.508128, dec: 43.123376, mag: 4.52, ci: -0.086, },
		    '2234967': { id: '2234967', con: 'Cyg', name: '', ra: 20.790149, dec: 36.490717, mag: 4.53, ci: -0.083, },
		    '2489893': { id: '2489893', con: 'And', name: '', ra: 23.20916806, dec: 49.4062064, mag: 4.53, ci: 0.302, },
		    '2107312': { id: '2107312', con: 'Sgr', name: '', ra: 19.94912, dec: -27.169899, mag: 4.54, ci: 1.462, },
		    '2482435': { id: '2482435', con: 'Peg', name: '', ra: 23.11673917, dec: 9.40949244, mag: 4.54, ci: 1.559, },
		    '2511666': { id: '2511666', con: 'Peg', name: '', ra: 23.48591609, dec: 12.76055418, mag: 4.54, ci: 0.939, },
		    '2342884': { id: '2342884', con: 'Cep', name: '', ra: 21.6986923, dec: 71.31141939, mag: 4.55, ci: 1.108, },
		    '2410985': { id: '2410985', con: 'Lac', name: '', ra: 22.35042999, dec: 46.53656838, mag: 4.55, ci: -0.1, },
		    '2416851': { id: '2416851', con: 'Lac', name: '', ra: 22.40860844, dec: 49.47639824, mag: 4.55, ci: 0.092, },
		    '2245723': { id: '2245723', con: 'Vul', name: '', ra: 20.86880038, dec: 27.09697503, mag: 4.56, ci: 0.835, },
		    '2275591': { id: '2275591', con: 'Cyg', name: '', ra: 21.11002602, dec: 47.648404, mag: 4.56, ci: 1.569, },
		    '2097495': { id: '2097495', con: 'Vul', name: '', ra: 19.89102546, dec: 24.07959907, mag: 4.57, ci: -0.047, },
		    '2500738': { id: '2500738', con: 'Peg', name: 'Salm', ra: 23.34395634, dec: 23.74033926, mag: 4.58, ci: 0.18, },
		    '2048705': { id: '2048705', con: 'Sgr', name: '', ra: 19.611786, dec: -24.883623, mag: 4.59, ci: -0.075, },
		    '2537198': { id: '2537198', con: 'Scl', name: '', ra: 23.81542947, dec: -28.13026985, mag: 4.59, ci: 0.001, },
		    '2005964': { id: '2005964', con: 'Dra', name: '', ra: 19.34446959, dec: 65.71452899, mag: 4.6, ci: 0.033, },
		    '2203242': { id: '2203242', con: 'Cyg', name: '', ra: 20.56505177, dec: 35.25085332, mag: 4.61, ci: 1.593, },
		    '2549081': { id: '2549081', con: 'Peg', name: '', ra: 23.96264633, dec: 25.1414001, mag: 4.63, ci: 1.584, },
		    '2020982': { id: '2020982', con: 'Aql', name: '', ra: 19.44196905, dec: 0.33856476, mag: 4.64, ci: 0.576, },
		    '2206664': { id: '2206664', con: 'Del', name: '', ra: 20.58848235, dec: 14.67421103, mag: 4.64, ci: 0.12, },
		    '2437598': { id: '2437598', con: 'Lac', name: '', ra: 22.62289365, dec: 51.54511916, mag: 4.64, ci: 0.254, },
		    '2478535': { id: '2478535', con: 'And', name: '', ra: 23.06971784, dec: 50.05208912, mag: 4.64, ci: 1.058, },
		    '2118756': { id: '2118756', con: 'Vul', name: '', ra: 20.01834684, dec: 27.75357235, mag: 4.66, ci: 0.184, },
		    '2036555': { id: '2036555', con: 'Dra', name: 'Alsafi', ra: 19.53933116, dec: 69.6611839, mag: 4.67, ci: 0.786, },
		    '2264983': { id: '2264983', con: 'Mic', name: '', ra: 21.02151649, dec: -32.25776111, mag: 4.67, ci: 0.89, },
		    '2056412': { id: '2056412', con: 'Cyg', name: '', ra: 19.6562794, dec: 30.1533234, mag: 4.68, ci: 0.971, },
		    '2335058': { id: '2335058', con: 'Aqr', name: 'Bunda', ra: 21.62919716, dec: -7.85420249, mag: 4.68, ci: 0.175, },
		    '2447423': { id: '2447423', con: 'Aqr', name: '', ra: 22.72645363, dec: -18.83037521, mag: 4.68, ci: 1.358, },
		    '2343214': { id: '2343214', con: 'Cyg', name: 'Azelfafage', ra: 21.70157304, dec: 51.18961817, mag: 4.69, ci: -0.119, },
		    '2380698': { id: '2380698', con: 'Ind', name: '', ra: 22.05601538, dec: -56.78597448, mag: 4.69, ci: 1.056, },
		    '2519187': { id: '2519187', con: 'Phe', name: '', ra: 23.58460134, dec: -42.61508989, mag: 4.69, ci: 0.078, },
		    '2104188': { id: '2104188', con: 'Sgr', name: 'Terebellum', ra: 19.93065516, dec: -26.29949408, mag: 4.7, ci: 0.748, },
		    '2283139': { id: '2283139', con: 'Equ', name: '', ra: 21.1723614, dec: 10.13157595, mag: 4.7, ci: 0.262, },
		    '2464065': { id: '2464065', con: 'Cep', name: '', ra: 22.90693395, dec: 84.34617707, mag: 4.7, ci: 1.418, },
		    '2516873': { id: '2516873', con: 'Aqr', name: '', ra: 23.554618, dec: -20.914504, mag: 4.7, ci: 0.02, },
		    '2099705': { id: '2099705', con: 'Aql', name: 'Libertas', ra: 19.90413393, dec: 8.46145444, mag: 4.71, ci: 1.023, },
		    '2297940': { id: '2297940', con: 'Mic', name: '', ra: 21.29896808, dec: -32.17254439, mag: 4.71, ci: 0.07, },
		    '2486344': { id: '2486344', con: 'Aqr', name: '', ra: 23.16524897, dec: -22.45762372, mag: 4.71, ci: 0.674, },
		    '2344249': { id: '2344249', con: 'Cap', name: '', ra: 21.71097435, dec: -18.86632186, mag: 4.72, ci: 0.868, },
		    '2246934': { id: '2246934', con: 'Aqr', name: '', ra: 20.87756471, dec: -8.98331511, mag: 4.73, ci: 0.325, },
		    '2034994': { id: '2034994', con: 'Cyg', name: '', ra: 19.5295338, dec: 34.45296571, mag: 4.74, ci: -0.15, },
		    '2262009': { id: '2262009', con: 'Cyg', name: '', ra: 20.99709811, dec: 47.52094498, mag: 4.74, ci: -0.084, },
		    '2380619': { id: '2380619', con: 'Aqr', name: '', ra: 22.05523429, dec: -2.15536379, mag: 4.74, ci: -0.1, },
		    '2522700': { id: '2522700', con: 'Phe', name: '', ra: 23.63083172, dec: -45.49234598, mag: 4.74, ci: 0.082, },
		    '2207318': { id: '2207318', con: 'Pav', name: '', ra: 20.59301421, dec: -60.58174899, mag: 4.75, ci: 0.291, },
		    '2498113': { id: '2498113', con: 'Cep', name: '', ra: 23.31041386, dec: 68.11147467, mag: 4.75, ci: 0.836, },
		    '2335390': { id: '2335390', con: 'Cep', name: '', ra: 21.632007, dec: 62.08194, mag: 4.76, ci: 0.246, },
		    '2482582': { id: '2482582', con: 'Peg', name: '', ra: 23.11853878, dec: 25.46826185, mag: 4.76, ci: 1.285, },
		    '2125426': { id: '2125426', con: 'Sgr', name: '', ra: 20.05929374, dec: -37.94070715, mag: 4.77, ci: 1.417, },
		    '2162963': { id: '2162963', con: 'Cyg', name: '', ra: 20.29644465, dec: 38.03292997, mag: 4.77, ci: 0.377, },
		    '2170351': { id: '2170351', con: 'Cap', name: 'Alshat', ra: 20.34439331, dec: -12.75908049, mag: 4.77, ci: -0.047, },
		    '2190994': { id: '2190994', con: 'Cap', name: '', ra: 20.48100543, dec: -17.8137256, mag: 4.77, ci: 0.386, },
		    '2453445': { id: '2453445', con: 'Cep', name: '', ra: 22.79140504, dec: 83.15383207, mag: 4.77, ci: 1.257, },
		    '2411463': { id: '2411463', con: 'Peg', name: '', ra: 22.35537158, dec: 28.33052742, mag: 4.78, ci: -0.01, },
		    '2422398': { id: '2422398', con: 'Peg', name: '', ra: 22.4643117, dec: 4.69566169, mag: 4.78, ci: 1.039, },
		    '2156521': { id: '2156521', con: 'Vul', name: '', ra: 20.25441518, dec: 25.59194889, mag: 4.79, ci: -0.181, },
		    '2391861': { id: '2391861', con: 'Cep', name: '', ra: 22.16345293, dec: 72.34120543, mag: 4.79, ci: 0.919, },
		    '2401818': { id: '2401818', con: 'Gru', name: '', ra: 22.26025546, dec: -41.34669335, mag: 4.79, ci: 0.79, },
		    '2151577': { id: '2151577', con: 'Cyg', name: '', ra: 20.22168158, dec: 46.81567203, mag: 4.8, ci: 0.1, },
		    '2248210': { id: '2248210', con: 'Cyg', name: '', ra: 20.88743207, dec: 44.38726677, mag: 4.8, ci: -0.134, },
		    '2303324': { id: '2303324', con: 'Mic', name: '', ra: 21.34601032, dec: -40.80950379, mag: 4.8, ci: 0.029, },
		    '2418141': { id: '2418141', con: 'Aqr', name: '', ra: 22.42128406, dec: 1.37739729, mag: 4.8, ci: -0.171, },
		    '2444524': { id: '2444524', con: 'Peg', name: '', ra: 22.69594617, dec: 29.307631, mag: 4.8, ci: -0.013, },
		    '2214193': { id: '2214193', con: 'Vul', name: '', ra: 20.64203791, dec: 21.20118746, mag: 4.81, ci: -0.03, },
		    '2238424': { id: '2238424', con: 'Cyg', name: '', ra: 20.81563625, dec: 46.11413556, mag: 4.81, ci: 0.571, },
		    '2271134': { id: '2271134', con: 'Cap', name: '', ra: 21.073417, dec: -19.854991, mag: 4.82, ci: 0.169, },
		    '2411780': { id: '2411780', con: 'Peg', name: '', ra: 22.35863197, dec: 12.20518618, mag: 4.82, ci: -0.132, },
		    '2426860': { id: '2426860', con: 'Aqr', name: '', ra: 22.51078213, dec: -10.67796039, mag: 4.82, ci: -0.053, },
		    '2496998': { id: '2496998', con: 'And', name: '', ra: 23.29573507, dec: 49.01530047, mag: 4.82, ci: 1.668, },
		    '2527794': { id: '2527794', con: 'Aqr', name: '', ra: 23.69605735, dec: -17.81653484, mag: 4.82, ci: 0.822, },
		    '2112887': { id: '2112887', con: 'Sgr', name: '', ra: 19.98255473, dec: -26.19576704, mag: 4.84, ci: 0.882, },
		    '2447287': { id: '2447287', con: 'Gru', name: '', ra: 22.72499366, dec: -41.41434573, mag: 4.84, ci: 1.027, },
		    '2450581': { id: '2450581', con: 'Gru', name: '', ra: 22.76052249, dec: -53.50012248, mag: 4.84, ci: 1.18, },
		    '2481877': { id: '2481877', con: 'Cas', name: '', ra: 23.110226, dec: 59.41976, mag: 4.84, ci: -0.06, },
		    '2212014': { id: '2212014', con: 'Pav', name: '', ra: 20.62647576, dec: -61.52991906, mag: 4.86, ci: 0.447, },
		    '2384659': { id: '2384659', con: 'Peg', name: '', ra: 22.09465301, dec: 5.05853081, mag: 4.86, ci: 1.443, },
		    '2076688': { id: '2076688', con: 'Sgr', name: '', ra: 19.77270559, dec: -19.76111302, mag: 4.87, ci: 1.061, },
		    '2329421': { id: '2329421', con: 'Cyg', name: '', ra: 21.57960194, dec: 38.53405887, mag: 4.87, ci: 1.085, },
		    '2044498': { id: '2044498', con: 'Tel', name: '', ra: 19.58694093, dec: -48.09920243, mag: 4.88, ci: 1.096, },
		    '2534769': { id: '2534769', con: 'Cas', name: '', ra: 23.78429306, dec: 58.6519874, mag: 4.88, ci: 1.122, },
		    '2550351': { id: '2550351', con: 'Psc', name: '', ra: 23.97788268, dec: -3.55598079, mag: 4.88, ci: 0.93, },
		    '2550824': { id: '2550824', con: 'Cas', name: '', ra: 23.983482, dec: 55.754928, mag: 4.88, ci: -0.071, },
		    '2070533': { id: '2070533', con: 'Cyg', name: '', ra: 19.73794584, dec: 37.35435889, mag: 4.89, ci: 0.948, },
		    '2240850': { id: '2240850', con: 'Mic', name: '', ra: 20.83280172, dec: -33.7797206, mag: 4.89, ci: 1.004, },
		    '2440524': { id: '2440524', con: 'Lac', name: '', ra: 22.654355, dec: 39.050269, mag: 4.89, ci: -0.207, },
		    '2512789': { id: '2512789', con: 'Cas', name: '', ra: 23.500536, dec: 58.54892, mag: 4.89, ci: -0.122, },
		    '2090628': { id: '2090628', con: 'Vul', name: '', ra: 19.85114151, dec: 22.61004685, mag: 4.9, ci: -0.153, },
		    '2239756': { id: '2239756', con: 'Ind', name: '', ra: 20.82471177, dec: -46.22682865, mag: 4.9, ci: 1.494, },
		    '2103596': { id: '2103596', con: 'Cyg', name: '', ra: 19.92716434, dec: 52.43896872, mag: 4.91, ci: 0.124, },
		    '2192925': { id: '2192925', con: 'Aql', name: '', ra: 20.49416665, dec: -2.88553365, mag: 4.91, ci: 1.16, },
		    '2210024': { id: '2210024', con: 'Aql', name: '', ra: 20.61212006, dec: -2.54995537, mag: 4.91, ci: 1.606, },
		    '2430606': { id: '2430606', con: 'Tuc', name: '', ra: 22.55001797, dec: -61.9821241, mag: 4.91, ci: 1.612, },
		    '2465285': { id: '2465285', con: 'Peg', name: '', ra: 22.92046411, dec: 8.81615347, mag: 4.91, ci: -0.003, },
		    '2229063': { id: '2229063', con: 'Vul', name: '', ra: 20.74791714, dec: 25.2706023, mag: 4.92, ci: 1.183, },
		    '2049248': { id: '2049248', con: 'Aql', name: '', ra: 19.61484706, dec: -7.02747711, mag: 4.93, ci: -0.046, },
		    '2135898': { id: '2135898', con: 'Tel', name: '', ra: 20.12309895, dec: -52.88079032, mag: 4.93, ci: 1.591, },
		    '2141284': { id: '2141284', con: 'Cyg', name: '', ra: 20.1571164, dec: 36.83961894, mag: 4.93, ci: -0.139, },
		    '2154705': { id: '2154705', con: 'Cyg', name: '', ra: 20.24223126, dec: 36.80630735, mag: 4.93, ci: 0.151, },
		    '2234444': { id: '2234444', con: 'Cyg', name: '', ra: 20.78632038, dec: 34.37413032, mag: 4.93, ci: 1.294, },
		    '2495813': { id: '2495813', con: 'Aqr', name: '', ra: 23.28081644, dec: -7.72650053, mag: 4.93, ci: 1.613, },
		    '2530732': { id: '2530732', con: 'Peg', name: '', ra: 23.73318926, dec: 29.36145541, mag: 4.93, ci: 0.935, },
		    '2154085': { id: '2154085', con: 'Aql', name: '', ra: 20.23794968, dec: 15.19760993, mag: 4.94, ci: 0.072, },
		    '2193956': { id: '2193956', con: 'Cyg', name: '', ra: 20.50098341, dec: 48.95156859, mag: 4.94, ci: -0.087, },
		    '2392436': { id: '2392436', con: 'PsA', name: '', ra: 22.16910556, dec: -32.54840635, mag: 4.94, ci: 0.489, },
		    '2104265': { id: '2104265', con: 'Cyg', name: '', ra: 19.93104514, dec: 38.48670686, mag: 4.95, ci: -0.086, },
		    '2120541': { id: '2120541', con: 'Pav', name: '', ra: 20.02909621, dec: -59.37589062, mag: 4.95, ci: 1.356, },
		    '2460405': { id: '2460405', con: 'Lac', name: '', ra: 22.86723201, dec: 43.31242075, mag: 4.95, ci: 1.559, },
		    '2508805': { id: '2508805', con: 'Psc', name: '', ra: 23.44887657, dec: 1.2556063, mag: 4.95, ci: 0.036, },
		    '2533853': { id: '2533853', con: 'Psc', name: '', ra: 23.77319905, dec: 3.48680914, mag: 4.95, ci: 2.508, },
		    '2506173': { id: '2506173', con: 'Cas', name: '', ra: 23.41396189, dec: 62.2828071, mag: 4.96, ci: 1.676, },
		    '2517725': { id: '2517725', con: 'Peg', name: '', ra: 23.5658896, dec: 31.32528185, mag: 4.97, ci: 1.383, },
		    '2525226': { id: '2525226', con: 'Aqr', name: '', ra: 23.66307436, dec: -14.22216917, mag: 4.97, ci: 0.257, },
		    '2533370': { id: '2533370', con: 'And', name: '', ra: 23.76723571, dec: 46.42026893, mag: 4.97, ci: 1.086, },
		    '2005652': { id: '2005652', con: 'Aql', name: '', ra: 19.34247382, dec: -5.41576633, mag: 4.98, ci: 0.937, },
		    '2104440': { id: '2104440', con: 'Cyg', name: '', ra: 19.93204945, dec: 58.84596771, mag: 4.98, ci: 1.584, },
		    '2014797': { id: '2014797', con: 'Cyg', name: '', ra: 19.40210534, dec: 29.62134672, mag: 4.99, ci: -0.12, },
		    '2127610': { id: '2127610', con: 'Sgr', name: '', ra: 20.07210926, dec: -32.05629774, mag: 4.99, ci: 1.208, },
		    '2389450': { id: '2389450', con: 'PsA', name: '', ra: 22.14053658, dec: -34.04383939, mag: 4.99, ci: 1.499, },
		    '2467209': { id: '2467209', con: 'Lac', name: '', ra: 22.94055504, dec: 49.73354575, mag: 4.99, ci: 1.778, },
		    '2498553': { id: '2498553', con: 'Aqr', name: '', ra: 23.31602179, dec: -9.610743, mag: 4.99, ci: -0.022, },
		    '2042736': { id: '2042736', con: 'Vul', name: '', ra: 19.5763602, dec: 19.77340131, mag: 5, ci: -0.093, },
		    '2076881': { id: '2076881', con: 'Cyg', name: '', ra: 19.77377766, dec: 33.72759409, mag: 5, ci: 0.476, },
		    '2548845': { id: '2548845', con: 'Tuc', name: '', ra: 23.95974331, dec: -64.29822447, mag: 5, ci: 0.06, },
		    '2084473': { id: '2084473', con: 'Sge', name: '', ra: 19.81629437, dec: 19.14204156, mag: 5.01, ci: 0.095, },
		    '2110120': { id: '2110120', con: 'Sgr', name: '', ra: 19.96584179, dec: -15.49150531, mag: 5.01, ci: 0.055, },
		    '2017807': { id: '2017807', con: 'Sgr', name: '', ra: 19.42124545, dec: -24.50857986, mag: 5.02, ci: 0.235, },
		    '2353200': { id: '2353200', con: 'PsA', name: '', ra: 21.79559665, dec: -30.89830014, mag: 5.02, ci: 0.042, },
		    '2011525': { id: '2011525', con: 'Tel', name: '', ra: 19.38089042, dec: -54.42393097, mag: 5.03, ci: 0.02, },
		    '2031934': { id: '2031934', con: 'Aql', name: '', ra: 19.5110659, dec: -2.78888641, mag: 5.03, ci: 1.77, },
		    '2089362': { id: '2089362', con: 'Cyg', name: '', ra: 19.84381204, dec: 52.98800313, mag: 5.03, ci: 1.286, },
		    '2251049': { id: '2251049', con: 'Vul', name: '', ra: 20.90934375, dec: 28.05762242, mag: 5.03, ci: 1.481, },
		    '2298906': { id: '2298906', con: 'Cyg', name: '', ra: 21.30755183, dec: 43.94594383, mag: 5.04, ci: -0.061, },
		    '2333542': { id: '2333542', con: 'Cyg', name: '', ra: 21.61582634, dec: 40.41352152, mag: 5.04, ci: 0.198, },
		    '2373473': { id: '2373473', con: 'Cep', name: '', ra: 21.98749072, dec: 73.17989435, mag: 5.04, ci: 0.439, },
		    '2438208': { id: '2438208', con: 'Aqr', name: 'Situla', ra: 22.62927224, dec: -4.22805501, mag: 5.04, ci: 1.14, },
		    '2394737': { id: '2394737', con: 'Cep', name: '', ra: 22.191828, dec: 59.414488, mag: 5.05, ci: 0.192, },
		    '2485829': { id: '2485829', con: 'Peg', name: '', ra: 23.15873806, dec: 8.67716555, mag: 5.05, ci: 1.484, },
		    '2500365': { id: '2500365', con: 'Psc', name: '', ra: 23.33905108, dec: 5.38130566, mag: 5.05, ci: 1.204, },
		    '2535867': { id: '2535867', con: 'Cep', name: '', ra: 23.79854718, dec: 67.80680778, mag: 5.05, ci: 0.007, },
		    '2060553': { id: '2060553', con: 'Cyg', name: '', ra: 19.68060644, dec: 45.52494249, mag: 5.06, ci: 0.426, },
		    '2065404': { id: '2065404', con: 'Sgr', name: '', ra: 19.70864815, dec: -16.12399283, mag: 5.06, ci: 0.319, },
		    '2119448': { id: '2119448', con: 'Cyg', name: '', ra: 20.02265663, dec: 50.10469424, mag: 5.06, ci: 1.122, },
		    '2214221': { id: '2214221', con: 'Vul', name: '', ra: 20.64219841, dec: 24.11595778, mag: 5.06, ci: -0.133, },
		    '2241103': { id: '2241103', con: 'Cyg', name: '', ra: 20.8347031, dec: 44.05930639, mag: 5.06, ci: 0.198, },
		    '2244325': { id: '2244325', con: 'Ind', name: '', ra: 20.8583472, dec: -51.60818118, mag: 5.06, ci: 1.125, },
		    '2289034': { id: '2289034', con: 'Pav', name: '', ra: 21.22236406, dec: -70.12626542, mag: 5.06, ci: 1.578, },
		    '2542044': { id: '2542044', con: 'Peg', name: '', ra: 23.87480194, dec: 19.12028556, mag: 5.06, ci: 1.587, },
		    '2215619': { id: '2215619', con: 'Del', name: '', ra: 20.65216201, dec: 10.08620498, mag: 5.07, ci: 0.702, },
		    '2356846': { id: '2356846', con: 'Peg', name: '', ra: 21.83074854, dec: 30.17421474, mag: 5.07, ci: 0.01, },
		    '2383732': { id: '2383732', con: 'Cep', name: '', ra: 22.085775, dec: 62.279814, mag: 5.07, ci: 0.24, },
		    '2134553': { id: '2134553', con: 'Vul', name: '', ra: 20.11483568, dec: 23.61442289, mag: 5.08, ci: -0.162, },
		    '2187123': { id: '2187123', con: 'Cap', name: '', ra: 20.45533611, dec: -18.21172389, mag: 5.08, ci: -0.049, },
		    '2362898': { id: '2362898', con: 'Cap', name: '', ra: 21.88826989, dec: -13.5517694, mag: 5.08, ci: 0.378, },
		    '2435050': { id: '2435050', con: 'Cep', name: '', ra: 22.59614862, dec: 73.64318931, mag: 5.08, ci: 0.395, },
		    '2129919': { id: '2129919', con: 'Sge', name: '', ra: 20.08597074, dec: 19.99106987, mag: 5.09, ci: 1.058, },
		    '2339697': { id: '2339697', con: 'Cyg', name: '', ra: 21.66975311, dec: 43.27383202, mag: 5.09, ci: 1.601, },
		    '2362540': { id: '2362540', con: 'Peg', name: '', ra: 21.88438018, dec: 25.92513943, mag: 5.09, ci: -0.155, },
		    '2385296': { id: '2385296', con: 'Lac', name: '', ra: 22.10054229, dec: 45.01434906, mag: 5.09, ci: 1.568, },
		    '2409297': { id: '2409297', con: 'Oct', name: '', ra: 22.33379799, dec: -80.43974779, mag: 5.09, ci: 1.276, },
		    '2476264': { id: '2476264', con: 'And', name: '', ra: 23.04343958, dec: 42.75780095, mag: 5.09, ci: 0.094, },
		    '2503894': { id: '2503894', con: 'Peg', name: '', ra: 23.38460309, dec: 12.31391783, mag: 5.09, ci: 1.315, },
		    '2529843': { id: '2529843', con: 'Peg', name: '', ra: 23.72287746, dec: 10.33153625, mag: 5.09, ci: 1.692, },
		    '2000587': { id: '2000587', con: 'Aql', name: '', ra: 19.30902677, dec: 1.08511912, mag: 5.1, ci: 1.143, },
		    '2338553': { id: '2338553', con: 'Aqr', name: '', ra: 21.65924074, dec: 2.24355816, mag: 5.1, ci: 1.034, },
		    '2348459': { id: '2348459', con: 'Cap', name: '', ra: 21.75007041, dec: -9.08243042, mag: 5.1, ci: 1.108, },
		    '2472566': { id: '2472566', con: 'Cas', name: '', ra: 23.00141725, dec: 56.94537539, mag: 5.1, ci: 1.011, },
		    '2541546': { id: '2541546', con: 'Oct', name: '', ra: 23.86846859, dec: -82.01881778, mag: 5.1, ci: 0.934, },
		    '2217688': { id: '2217688', con: 'Pav', name: '', ra: 20.66739923, dec: -60.54889126, mag: 5.11, ci: 0.544, },
		    '2237461': { id: '2237461', con: 'Mic', name: '', ra: 20.80809595, dec: -43.98853195, mag: 5.11, ci: 0.361, },
		    '2368905': { id: '2368905', con: 'Cep', name: '', ra: 21.94420533, dec: 63.62556024, mag: 5.11, ci: 1.547, },
		    '2403215': { id: '2403215', con: 'Gru', name: '', ra: 22.27404278, dec: -41.62721764, mag: 5.11, ci: 0.93, },
		    '2439561': { id: '2439561', con: 'Lac', name: '', ra: 22.643868, dec: 56.79563023, mag: 5.11, ci: 1.537, },
		    '2448207': { id: '2448207', con: 'Lac', name: '', ra: 22.73485514, dec: 41.81923469, mag: 5.11, ci: 0.96, },
		    '2032213': { id: '2032213', con: 'Cyg', name: '', ra: 19.51260943, dec: 27.96526807, mag: 5.12, ci: -0.095, },
		    '2044234': { id: '2044234', con: 'Aql', name: '', ra: 19.58534937, dec: -10.56044139, mag: 5.12, ci: 1.122, },
		    '2090512': { id: '2090512', con: 'Aql', name: '', ra: 19.85045649, dec: 10.41572455, mag: 5.12, ci: 0.563, },
		    '2203271': { id: '2203271', con: 'Mic', name: '', ra: 20.56529753, dec: -44.51604942, mag: 5.12, ci: 0.999, },
		    '2411903': { id: '2411903', con: 'Aqr', name: '', ra: 22.35988011, dec: -21.59823135, mag: 5.12, ci: 1.057, },
		    '2477570': { id: '2477570', con: 'PsA', name: '', ra: 23.0582818, dec: -34.74942143, mag: 5.12, ci: 0.305, },
		    '2271733': { id: '2271733', con: 'Oct', name: '', ra: 21.07862836, dec: -77.02376733, mag: 5.13, ci: 0.49, },
		    '2550703': { id: '2550703', con: 'Phe', name: '', ra: 23.98216042, dec: -52.74580552, mag: 5.13, ci: 1.121, },
		    '2018333': { id: '2018333', con: 'Vul', name: '', ra: 19.42461159, dec: 19.79836718, mag: 5.14, ci: 0.999, },
		    '2096989': { id: '2096989', con: 'Cyg', name: '', ra: 19.88816, dec: 57.523482, mag: 5.14, ci: -0.125, },
		    '2165147': { id: '2165147', con: 'Cyg', name: '', ra: 20.31085256, dec: 34.98277945, mag: 5.14, ci: 0.66, },
		    '2222181': { id: '2222181', con: 'Pav', name: '', ra: 20.69918763, dec: -66.76068201, mag: 5.14, ci: -0.061, },
		    '2115555': { id: '2115555', con: 'Cyg', name: '', ra: 19.9986654, dec: 37.04288613, mag: 5.15, ci: -0.133, },
		    '2216267': { id: '2216267', con: 'Aqr', name: '', ra: 20.65691408, dec: 0.48645087, mag: 5.15, ci: 1.06, },
		    '2217703': { id: '2217703', con: 'Cap', name: '', ra: 20.66748474, dec: -18.13866131, mag: 5.15, ci: 1.647, },
		    '2233247': { id: '2233247', con: 'Del', name: '', ra: 20.77746362, dec: 16.12412538, mag: 5.15, ci: 0.495, },
		    '2488819': { id: '2488819', con: 'Peg', name: '', ra: 23.19560838, dec: 8.72011319, mag: 5.15, ci: 0.139, },
		    '2307415': { id: '2307415', con: 'Equ', name: '', ra: 21.38155906, dec: 6.81114101, mag: 5.16, ci: 0.064, },
		    '2342204': { id: '2342204', con: 'Cap', name: '', ra: 21.69246127, dec: -14.04761146, mag: 5.16, ci: 0.672, },
		    '2460940': { id: '2460940', con: 'Peg', name: '', ra: 22.87335436, dec: 9.83566698, mag: 5.16, ci: 0.487, },
		    '2017030': { id: '2017030', con: 'Aql', name: '', ra: 19.41616674, dec: 11.94441423, mag: 5.17, ci: 0.761, },
		    '2020005': { id: '2020005', con: 'Cyg', name: '', ra: 19.43586818, dec: 36.3178979, mag: 5.17, ci: -0.12, },
		    '2048471': { id: '2048471', con: 'Cyg', name: '', ra: 19.61054899, dec: 44.69493523, mag: 5.17, ci: 0.928, },
		    '2272801': { id: '2272801', con: 'Ind', name: '', ra: 21.08729143, dec: -54.72703897, mag: 5.17, ci: 1.201, },
		    '2293554': { id: '2293554', con: 'Cap', name: '', ra: 21.26052779, dec: -20.65169723, mag: 5.17, ci: 1.161, },
		    '2540532': { id: '2540532', con: 'Aqr', name: '', ra: 23.855927, dec: -18.909163, mag: 5.17, ci: -0.122, },
		    '2055824': { id: '2055824', con: 'Aql', name: '', ra: 19.6532339, dec: 5.39777571, mag: 5.18, ci: -0.001, },
		    '2089174': { id: '2089174', con: 'Cyg', name: '', ra: 19.84277662, dec: 38.72241828, mag: 5.18, ci: 1.665, },
		    '2157149': { id: '2157149', con: 'Vul', name: '', ra: 20.25839956, dec: 23.50890841, mag: 5.18, ci: 1.016, },
		    '2197479': { id: '2197479', con: 'Dra', name: '', ra: 20.52511594, dec: 74.9546214, mag: 5.18, ci: 0.1, },
		    '2344987': { id: '2344987', con: 'Cep', name: '', ra: 21.7177895, dec: 72.32008433, mag: 5.18, ci: 1.063, },
		    '2535044': { id: '2535044', con: 'Phe', name: '', ra: 23.7877767, dec: -50.2264582, mag: 5.18, ci: -0.164, },
		    '2154001': { id: '2154001', con: 'Vul', name: '', ra: 20.23736927, dec: 28.69481596, mag: 5.19, ci: 0.191, },
		    '2253346': { id: '2253346', con: 'Del', name: '', ra: 20.92685824, dec: 13.72153343, mag: 5.19, ci: 1.119, },
		    '2300639': { id: '2300639', con: 'Cep', name: '', ra: 21.3228379, dec: 64.8718543, mag: 5.19, ci: -0.045, },
		    '2439584': { id: '2439584', con: 'Cep', name: '', ra: 22.64418074, dec: 63.58447528, mag: 5.19, ci: 0.083, },
		    '2503322': { id: '2503322', con: 'Aqr', name: '', ra: 23.37754535, dec: -15.03934818, mag: 5.19, ci: 0.203, },
		    '2275209': { id: '2275209', con: 'Mic', name: '', ra: 21.1068551, dec: -32.34162054, mag: 5.2, ci: 1.104, },
		    '2276178': { id: '2276178', con: 'Cyg', name: '', ra: 21.114794, dec: 38.749415, mag: 5.2, ci: 1.069, },
		    '2498777': { id: '2498777', con: 'Aqr', name: '', ra: 23.318518, dec: -13.458552, mag: 5.2, ci: 0.787, },
		    '2433310': { id: '2433310', con: 'Aqr', name: '', ra: 22.57823247, dec: -20.70821219, mag: 5.21, ci: 0.446, },
		    '2011512': { id: '2011512', con: 'Vul', name: '', ra: 19.3808014, dec: 26.26240815, mag: 5.22, ci: -0.119, },
		    '2119797': { id: '2119797', con: 'Dra', name: '', ra: 20.02459504, dec: 64.82097234, mag: 5.22, ci: 1.598, },
		    '2319459': { id: '2319459', con: 'Cyg', name: '', ra: 21.49081945, dec: 46.54058824, mag: 5.22, ci: 0.965, },
		    '2514312': { id: '2514312', con: 'And', name: 'Veritate', ra: 23.52150392, dec: 39.23619899, mag: 5.22, ci: 1.029, },
		    '2121286': { id: '2121286', con: 'Vul', name: '', ra: 20.03373695, dec: 24.9379885, mag: 5.23, ci: 0.374, },
		    '2107774': { id: '2107774', con: 'Pav', name: '', ra: 19.9517527, dec: -58.90134985, mag: 5.24, ci: 0.014, },
		    '2215955': { id: '2215955', con: 'Cap', name: '', ra: 20.65453492, dec: -14.95477825, mag: 5.24, ci: -0.129, },
		    '2260507': { id: '2260507', con: 'Equ', name: '', ra: 20.98475204, dec: 4.29461464, mag: 5.24, ci: 0.457, },
		    '2343051': { id: '2343051', con: 'Cap', name: '', ra: 21.70019391, dec: -23.26285875, mag: 5.24, ci: 0.991, },
		    '2395262': { id: '2395262', con: 'Cep', name: '', ra: 22.19688007, dec: 56.83935792, mag: 5.24, ci: 0.534, },
		    '2453539': { id: '2453539', con: 'Aqr', name: '', ra: 22.79253457, dec: -19.61337688, mag: 5.24, ci: 0.941, },
		    '2531002': { id: '2531002', con: 'Aqr', name: '', ra: 23.736688, dec: -18.276938, mag: 5.24, ci: -0.084, },
		    '2288467': { id: '2288467', con: 'Mic', name: '', ra: 21.21751875, dec: -39.4249239, mag: 5.25, ci: 0.46, },
		    '2444071': { id: '2444071', con: 'Lac', name: '', ra: 22.69129171, dec: 40.22545188, mag: 5.25, ci: -0.137, },
		    '2477626': { id: '2477626', con: 'Cep', name: '', ra: 23.05913351, dec: 67.20921049, mag: 5.25, ci: 1.248, },
		    '2381593': { id: '2381593', con: 'Cep', name: '', ra: 22.0647161, dec: 63.11991736, mag: 5.26, ci: 1.557, },
		    '2160801': { id: '2160801', con: 'Cyg', name: '', ra: 20.28202424, dec: 40.36506871, mag: 5.27, ci: 1.65, },
		    '2358680': { id: '2358680', con: 'Oct', name: '', ra: 21.848413, dec: -82.718904, mag: 5.27, ci: 0.756, },
		    '2383510': { id: '2383510', con: 'Cep', name: '', ra: 22.08347184, dec: 62.78567019, mag: 5.27, ci: 1.413, },
		    '2397580': { id: '2397580', con: 'Cep', name: '', ra: 22.21961596, dec: 86.10796795, mag: 5.27, ci: -0.03, },
		    '2528694': { id: '2528694', con: 'Aqr', name: '', ra: 23.70772839, dec: -15.44802909, mag: 5.27, ci: 1.344, },
		    '2065540': { id: '2065540', con: 'Aql', name: '', ra: 19.70945006, dec: 11.8265928, mag: 5.28, ci: 0.575, },
		    '2105300': { id: '2105300', con: 'Aql', name: '', ra: 19.93729223, dec: 11.42372088, mag: 5.28, ci: 0.014, },
		    '2167109': { id: '2167109', con: 'Cap', name: '', ra: 20.32322334, dec: -19.11853278, mag: 5.28, ci: 1.394, },
		    '2417023': { id: '2417023', con: 'Ind', name: '', ra: 22.4102472, dec: -72.25541086, mag: 5.28, ci: 0.66, },
		    '2533342': { id: '2533342', con: 'Aqr', name: '', ra: 23.766922, dec: -18.67834, mag: 5.28, ci: 0.299, },
		    '2314604': { id: '2314604', con: 'Cyg', name: '', ra: 21.44767318, dec: 48.83516687, mag: 5.29, ci: 0.108, },
		    '2324456': { id: '2324456', con: 'Gru', name: '', ra: 21.53496575, dec: -41.17930886, mag: 5.29, ci: 1.109, },
		    '2350326': { id: '2350326', con: 'Peg', name: '', ra: 21.76787896, dec: 22.94888042, mag: 5.29, ci: 1.381, },
		    '2383112': { id: '2383112', con: 'Aqr', name: '', ra: 22.0798396, dec: -0.90634365, mag: 5.29, ci: 0.231, },
		    '2060218': { id: '2060218', con: 'Sgr', name: '', ra: 19.67871775, dec: -16.29326879, mag: 5.3, ci: 1.109, },
		    '2115378': { id: '2115378', con: 'Sgr', name: '', ra: 19.99759905, dec: -34.69780779, mag: 5.3, ci: 0.17, },
		    '2160477': { id: '2160477', con: 'Vul', name: '', ra: 20.27974632, dec: 24.6710989, mag: 5.3, ci: 0.951, },
		    '2176622': { id: '2176622', con: 'Aql', name: '', ra: 20.38630394, dec: 5.34298481, mag: 5.3, ci: 0.983, },
		    '2258849': { id: '2258849', con: 'Vul', name: '', ra: 20.97120886, dec: 22.32590963, mag: 5.3, ci: 1.419, },
		    '2260484': { id: '2260484', con: 'Equ', name: '', ra: 20.98457191, dec: 4.29350516, mag: 5.3, ci: 0.464, },
		    '2279631': { id: '2279631', con: 'Cap', name: '', ra: 21.142673, dec: -21.193669, mag: 5.3, ci: 0, },
		    '2315539': { id: '2315539', con: 'Cyg', name: '', ra: 21.45593452, dec: 37.11679933, mag: 5.3, ci: -0.14, },
		    '2343527': { id: '2343527', con: 'Peg', name: '', ra: 21.70429198, dec: 5.68013635, mag: 5.3, ci: 1.653, },
		    '2483289': { id: '2483289', con: 'And', name: '', ra: 23.1275737, dec: 46.38722951, mag: 5.3, ci: 1.409, },
		    '2526338': { id: '2526338', con: 'Scl', name: '', ra: 23.67726381, dec: -32.07312821, mag: 5.3, ci: 0.965, },
		    '2542221': { id: '2542221', con: 'Peg', name: '', ra: 23.87697259, dec: 10.94732487, mag: 5.3, ci: 0.186, },
		    '2293773': { id: '2293773', con: 'Cap', name: '', ra: 21.26245591, dec: -15.17149893, mag: 5.31, ci: 1.639, },
		    '2417581': { id: '2417581', con: 'Tuc', name: '', ra: 22.41565533, dec: -57.79744484, mag: 5.31, ci: 0.665, },
		    '2092844': { id: '2092844', con: 'Sgr', name: '', ra: 19.86405703, dec: -39.87437082, mag: 5.32, ci: -0.045, },
		    '2120874': { id: '2120874', con: 'Pav', name: '', ra: 20.03123939, dec: -66.9439675, mag: 5.32, ci: 1.218, },
		    '2146012': { id: '2146012', con: 'Sgr', name: '', ra: 20.18664973, dec: -36.10119781, mag: 5.32, ci: 0.868, },
		    '2268201': { id: '2268201', con: 'Mic', name: '', ra: 21.04943134, dec: -38.6314474, mag: 5.32, ci: 0.424, },
		    '2457917': { id: '2457917', con: 'Oct', name: '', ra: 22.83967013, dec: -80.12384567, mag: 5.32, ci: -0.126, },
		    '2081638': { id: '2081638', con: 'Tel', name: '', ra: 19.80033281, dec: -56.36260803, mag: 5.33, ci: 0.196, },
		    '2115933': { id: '2115933', con: 'Sge', name: '', ra: 20.00091929, dec: 17.51651179, mag: 5.33, ci: 1.576, },
		    '2399537': { id: '2399537', con: 'Aqr', name: '', ra: 22.238342, dec: -21.074566, mag: 5.33, ci: 0.812, },
		    '2517141': { id: '2517141', con: 'Peg', name: '', ra: 23.55780388, dec: 22.49877751, mag: 5.33, ci: 1.481, },
		    '2043014': { id: '2043014', con: 'Cyg', name: '', ra: 19.57812757, dec: 42.41250848, mag: 5.34, ci: 0.06, },
		    '2249138': { id: '2249138', con: 'Mic', name: '', ra: 20.8944961, dec: -39.80986309, mag: 5.34, ci: 1.318, },
		    '2357366': { id: '2357366', con: 'Peg', name: '', ra: 21.835749, dec: 17.285851, mag: 5.34, ci: 0.394, },
		    '2396897': { id: '2396897', con: 'Peg', name: '', ra: 22.21328438, dec: 34.60458821, mag: 5.34, ci: 1.134, },
		    '2403852': { id: '2403852', con: 'Aqr', name: '', ra: 22.28001235, dec: -12.83143396, mag: 5.34, ci: 1.132, },
		    '2468141': { id: '2468141', con: 'Lac', name: '', ra: 22.95125079, dec: 48.68406511, mag: 5.34, ci: -0.102, },
		    '2409578': { id: '2409578', con: 'Aqr', name: '', ra: 22.33664362, dec: -7.821101, mag: 5.35, ci: -0.048, },
		    '2502395': { id: '2502395', con: 'Peg', name: '', ra: 23.36525919, dec: 31.81245495, mag: 5.35, ci: -0.101, },
		    '2524379': { id: '2524379', con: 'And', name: '', ra: 23.6523142, dec: 50.47172762, mag: 5.35, ci: -0.061, },
		    '2235330': { id: '2235330', con: 'Dra', name: '', ra: 20.79262696, dec: 80.55226046, mag: 5.36, ci: 1.144, },
		    '2406309': { id: '2406309', con: 'Gru', name: '', ra: 22.30433667, dec: -53.62707393, mag: 5.36, ci: 0.614, },
		    '2527526': { id: '2527526', con: 'Aqr', name: '', ra: 23.6929136, dec: -18.02708, mag: 5.36, ci: 1.58, },
		    '2392061': { id: '2392061', con: 'PsA', name: '', ra: 22.16547263, dec: -34.01496867, mag: 5.37, ci: 0.241, },
		    '2395625': { id: '2395625', con: 'Cep', name: '', ra: 22.20055932, dec: 60.75910568, mag: 5.37, ci: 1.184, },
		    '2410049': { id: '2410049', con: 'Peg', name: '', ra: 22.34099345, dec: 5.78949685, mag: 5.37, ci: -0.037, },
		    '2479227': { id: '2479227', con: 'Gru', name: '', ra: 23.07767439, dec: -53.96490673, mag: 5.37, ci: 1.453, },
		    '2089787': { id: '2089787', con: 'Aql', name: '', ra: 19.84632876, dec: -10.76351378, mag: 5.38, ci: 0.402, },
		    '2133200': { id: '2133200', con: 'Cyg', name: '', ra: 20.10604619, dec: 35.97246924, mag: 5.38, ci: 0.85, },
		    '2189473': { id: '2189473', con: 'Dra', name: '', ra: 20.47071831, dec: 81.42270933, mag: 5.38, ci: 1.01, },
		    '2264766': { id: '2264766', con: 'Cyg', name: '', ra: 21.01970171, dec: 46.15577396, mag: 5.38, ci: -0.206, },
		    '2309748': { id: '2309748', con: 'Cap', name: '', ra: 21.40266471, dec: -20.85187098, mag: 5.38, ci: 1.176, },
		    '2394184': { id: '2394184', con: 'Lac', name: '', ra: 22.18608486, dec: 50.82338662, mag: 5.38, ci: 0.152, },
		    '2043450': { id: '2043450', con: 'Cyg', name: '', ra: 19.58081328, dec: 29.46295717, mag: 5.39, ci: 0.581, },
		    '2085735': { id: '2085735', con: 'Pav', name: '', ra: 19.82369601, dec: -72.50337656, mag: 5.39, ci: 0.234, },
		    '2203349': { id: '2203349', con: 'Del', name: '', ra: 20.56584449, dec: 13.02727179, mag: 5.39, ci: 0.093, },
		    '2316119': { id: '2316119', con: 'Vul', name: '', ra: 21.46112713, dec: 27.60859255, mag: 5.39, ci: 0.049, },
		    '2486499': { id: '2486499', con: 'Peg', name: '', ra: 23.16707269, dec: 9.82208892, mag: 5.39, ci: -0.068, },
		    '2130970': { id: '2130970', con: 'Dra', name: '', ra: 20.09246625, dec: 61.99541695, mag: 5.4, ci: 1.191, },
		    '2297973': { id: '2297973', con: 'Cap', name: '', ra: 21.29924611, dec: -17.98513813, mag: 5.4, ci: -0.118, },
		    '2056602': { id: '2056602', con: 'Cyg', name: '', ra: 19.65735654, dec: 42.81828148, mag: 5.41, ci: -0.063, },
		    '2089695': { id: '2089695', con: 'Pav', name: '', ra: 19.84577928, dec: -59.19368413, mag: 5.41, ci: 0.082, },
		    '2222792': { id: '2222792', con: 'Cyg', name: '', ra: 20.70350838, dec: 50.3400275, mag: 5.41, ci: -0.107, },
		    '2239311': { id: '2239311', con: 'Pav', name: '', ra: 20.8217145, dec: -68.77652228, mag: 5.41, ci: 1.122, },
		    '2288928': { id: '2288928', con: 'Mic', name: '', ra: 21.22148058, dec: -27.6193465, mag: 5.41, ci: 1.425, },
		    '2212507': { id: '2212507', con: 'Del', name: '', ra: 20.63031073, dec: 11.37767251, mag: 5.42, ci: 0.05, },
		    '2316305': { id: '2316305', con: 'Cep', name: '', ra: 21.46281733, dec: 66.80909587, mag: 5.42, ci: -0.099, },
		    '2484703': { id: '2484703', con: 'Psc', name: '', ra: 23.14470136, dec: 2.12787808, mag: 5.42, ci: 0.908, },
		    '2376264': { id: '2376264', con: 'PsA', name: '', ra: 22.01395686, dec: -28.45377033, mag: 5.43, ci: -0.095, },
		    '2393264': { id: '2393264', con: 'Aqr', name: '', ra: 22.1770785, dec: -11.56493989, mag: 5.43, ci: -0.117, },
		    '2456989': { id: '2456989', con: 'Lac', name: '', ra: 22.82953242, dec: 55.902772, mag: 5.43, ci: 1.167, },
		    '2458901': { id: '2458901', con: 'Gru', name: '', ra: 22.85059977, dec: -39.15683538, mag: 5.43, ci: 1.444, },
		    '2471622': { id: '2471622', con: 'Psc', name: '', ra: 22.99095973, dec: 0.96292437, mag: 5.43, ci: 0.982, },
		    '2537076': { id: '2537076', con: 'Cas', name: '', ra: 23.81393375, dec: 62.21447398, mag: 5.43, ci: 0.67, },
		    '2151392': { id: '2151392', con: 'Aql', name: '', ra: 20.22052244, dec: -1.00933366, mag: 5.44, ci: 1.43, },
		    '2197006': { id: '2197006', con: 'Cyg', name: '', ra: 20.52189346, dec: 49.22029351, mag: 5.44, ci: 1.566, },
		    '2479925': { id: '2479925', con: 'Aqr', name: '', ra: 23.08605258, dec: -7.69379531, mag: 5.44, ci: 0.312, },
		    '2499243': { id: '2499243', con: 'And', name: '', ra: 23.32494675, dec: 48.62532236, mag: 5.44, ci: 1.014, },
		    '2018366': { id: '2018366', con: 'Sgr', name: '', ra: 19.42490544, dec: -23.96245577, mag: 5.45, ci: 1.442, },
		    '2051820': { id: '2051820', con: 'Aql', name: '', ra: 19.62981046, dec: -4.64764168, mag: 5.45, ci: 0.429, },
		    '2280054': { id: '2280054', con: 'Oct', name: 'Polaris Australis', ra: 21.14634819, dec: -88.95649871, mag: 5.45, ci: 0.283, },
		    '2368378': { id: '2368378', con: 'Gru', name: '', ra: 21.93965831, dec: -37.25365453, mag: 5.45, ci: 0.084, },
		    '2399564': { id: '2399564', con: 'PsA', name: '', ra: 22.23854186, dec: -27.7669083, mag: 5.45, ci: -0.121, },
		    '2425592': { id: '2425592', con: 'Cep', name: '', ra: 22.49804974, dec: 78.82428226, mag: 5.45, ci: 0.093, },
		    '2468720': { id: '2468720', con: 'Peg', name: 'Helvetios', ra: 22.95777244, dec: 20.76882977, mag: 5.45, ci: 0.666, },
		    '2005789': { id: '2005789', con: 'Aql', name: '', ra: 19.34324629, dec: -0.89216022, mag: 5.46, ci: -0.041, },
		    '2029764': { id: '2029764', con: 'Sgr', name: '', ra: 19.49782921, dec: -26.98560742, mag: 5.46, ci: 1.12, },
		    '2051191': { id: '2051191', con: 'Sgr', name: '', ra: 19.62622625, dec: -14.30180081, mag: 5.46, ci: 0.501, },
		    '2108130': { id: '2108130', con: 'Cyg', name: '', ra: 19.95385212, dec: 40.36783048, mag: 5.46, ci: -0.09, },
		    '2335067': { id: '2335067', con: 'Peg', name: '', ra: 21.62928611, dec: 19.31861057, mag: 5.46, ci: 0.321, },
		    '2218357': { id: '2218357', con: 'Mic', name: '', ra: 20.6721746, dec: -33.43184453, mag: 5.47, ci: 1.118, },
		    '2249613': { id: '2249613', con: 'Cyg', name: '', ra: 20.89830336, dec: 33.43789346, mag: 5.47, ci: 1.522, },
		    '2318161': { id: '2318161', con: 'Pav', name: '', ra: 21.47914632, dec: -69.50538774, mag: 5.47, ci: 1.553, },
		    '2419390': { id: '2419390', con: 'Cep', name: '', ra: 22.43356092, dec: 70.77089367, mag: 5.47, ci: 1.216, },
		    '2423613': { id: '2423613', con: 'Gru', name: '', ra: 22.47755802, dec: -39.13179149, mag: 5.47, ci: 0.959, },
		    '2232499': { id: '2232499', con: 'Mic', name: '', ra: 20.77224171, dec: -39.19926485, mag: 5.48, ci: -0.078, },
		    '2248358': { id: '2248358', con: 'Cyg', name: '', ra: 20.88849091, dec: 45.18167407, mag: 5.48, ci: 1.088, },
		    '2309818': { id: '2309818', con: 'Aqr', name: '', ra: 21.40319259, dec: -12.8781081, mag: 5.48, ci: 0.297, },
		    '2311811': { id: '2311811', con: 'Aqr', name: '', ra: 21.42137726, dec: -3.55674469, mag: 5.48, ci: 1.451, },
		    '2068511': { id: '2068511', con: 'Sgr', name: '', ra: 19.72598323, dec: -15.47009998, mag: 5.49, ci: 0.46, },
		    '2255998': { id: '2255998', con: 'Aqr', name: '', ra: 20.94834068, dec: -9.69753835, mag: 5.49, ci: 1.474, },
		    '2405585': { id: '2405585', con: 'Oct', name: '', ra: 22.29738733, dec: -77.51155277, mag: 5.49, ci: 0.312, },
		    '2522826': { id: '2522826', con: 'Peg', name: '', ra: 23.63244513, dec: 18.40067093, mag: 5.49, ci: 0.01, },
		    '2535904': { id: '2535904', con: 'Psc', name: '', ra: 23.79903969, dec: -2.76159936, mag: 5.49, ci: 0.941, },
		    '2068954': { id: '2068954', con: 'Vul', name: '', ra: 19.72859033, dec: 25.77191429, mag: 5.5, ci: 0.939, },
		    '2173821': { id: '2173821', con: 'Vul', name: '', ra: 20.36761956, dec: 24.4460984, mag: 5.5, ci: -0.09, },
		    '2314892': { id: '2314892', con: 'Mic', name: '', ra: 21.45045, dec: -42.54791924, mag: 5.5, ci: 0.392, },
		    '2373573': { id: '2373573', con: 'Gru', name: '', ra: 21.98830905, dec: -38.3950945, mag: 5.5, ci: 0.996, },
		    '2510299': { id: '2510299', con: 'Oct', name: '', ra: 23.46771827, dec: -87.48221318, mag: 5.5, ci: 1.278, },
		    '2075701': { id: '2075701', con: 'Sgr', name: '', ra: 19.76700492, dec: -31.90857501, mag: 5.51, ci: 0.024, },
		    '2112019': { id: '2112019', con: 'Cyg', name: '', ra: 19.97721737, dec: 30.98367529, mag: 5.51, ci: -0.06, },
		    '2127107': { id: '2127107', con: 'Aql', name: '', ra: 20.06897658, dec: 7.27796431, mag: 5.51, ci: 1.063, },
		    '2144275': { id: '2144275', con: 'Vul', name: '', ra: 20.17598253, dec: 26.90416838, mag: 5.51, ci: 0.087, },
		    '2147619': { id: '2147619', con: 'Vul', name: '', ra: 20.19665927, dec: 26.80899038, mag: 5.51, ci: 1.397, },
		    '2259173': { id: '2259173', con: 'Del', name: 'Musica', ra: 20.97387043, dec: 10.83928434, mag: 5.51, ci: 0.934, },
		    '2300428': { id: '2300428', con: 'Cep', name: '', ra: 21.32102437, dec: 58.62349521, mag: 5.51, ci: 1.114, },
		    '2345060': { id: '2345060', con: 'Cyg', name: '', ra: 21.71846394, dec: 41.15497251, mag: 5.51, ci: 1.615, },
		    '2425743': { id: '2425743', con: 'Peg', name: '', ra: 22.49942637, dec: 4.43168968, mag: 5.51, ci: 0.385, },
		    '2471833': { id: '2471833', con: 'PsA', name: '', ra: 22.99326596, dec: -29.46231285, mag: 5.51, ci: 0.271, },
		    '2243204': { id: '2243204', con: 'Mic', name: '', ra: 20.85021076, dec: -37.91333149, mag: 5.52, ci: 1.38, },
		    '2358512': { id: '2358512', con: 'Ind', name: '', ra: 21.84643889, dec: -69.62940163, mag: 5.52, ci: 1.378, },
		    '2361542': { id: '2361542', con: 'Peg', name: '', ra: 21.87497708, dec: 28.79354167, mag: 5.52, ci: 0.426, },
		    '2393297': { id: '2393297', con: 'Cep', name: '', ra: 22.17744109, dec: 70.13256661, mag: 5.52, ci: 0.391, },
		    '2421159': { id: '2421159', con: 'Cep', name: '', ra: 22.45147555, dec: 65.13226762, mag: 5.52, ci: 0.302, },
		    '2450660': { id: '2450660', con: 'Gru', name: '', ra: 22.76132836, dec: -46.54732953, mag: 5.52, ci: 1.302, },
		    '2003424': { id: '2003424', con: 'Aql', name: '', ra: 19.32759687, dec: 12.37468275, mag: 5.53, ci: 0.265, },
		    '2220034': { id: '2220034', con: 'Cyg', name: '', ra: 20.68403985, dec: 32.30729009, mag: 5.53, ci: 0.871, },
		    '2270465': { id: '2270465', con: 'Aqr', name: '', ra: 21.06797533, dec: -5.82320498, mag: 5.53, ci: 0.683, },
		    '2322333': { id: '2322333', con: 'Cep', name: '', ra: 21.51647, dec: 60.459432, mag: 5.53, ci: 0.102, },
		    '2352684': { id: '2352684', con: 'Cep', name: '', ra: 21.79036031, dec: 60.69268916, mag: 5.53, ci: 1.575, },
		    '2398697': { id: '2398697', con: 'Lac', name: '', ra: 22.23034482, dec: 45.44061605, mag: 5.53, ci: 0.021, },
		    '2415110': { id: '2415110', con: 'Aqr', name: '', ra: 22.39190221, dec: -24.76266194, mag: 5.53, ci: 0.979, },
		    '2464570': { id: '2464570', con: 'Aqr', name: '', ra: 22.91263048, dec: -16.27195479, mag: 5.53, ci: 1.111, },
		    '2479510': { id: '2479510', con: 'Ind', name: '', ra: 23.08117224, dec: -68.82022599, mag: 5.53, ci: 0.395, },
		    '2508401': { id: '2508401', con: 'Gru', name: '', ra: 23.44349334, dec: -52.72160527, mag: 5.53, ci: 0.409, },
		    '2093380': { id: '2093380', con: 'Vul', name: '', ra: 19.86710942, dec: 24.99216113, mag: 5.54, ci: 0.68, },
		    '2109613': { id: '2109613', con: 'Sge', name: '', ra: 19.96262399, dec: 16.78916072, mag: 5.54, ci: -0.048, },
		    '2253414': { id: '2253414', con: 'Del', name: '', ra: 20.9273814, dec: 12.56855351, mag: 5.54, ci: 0.131, },
		    '2261156': { id: '2261156', con: 'Cep', name: '', ra: 20.99038408, dec: 59.43858923, mag: 5.54, ci: 1.411, },
		    '2369420': { id: '2369420', con: 'Peg', name: '', ra: 21.94899199, dec: 12.07649236, mag: 5.54, ci: 0.054, },
		    '2497555': { id: '2497555', con: 'Gru', name: '', ra: 23.30274582, dec: -40.82435893, mag: 5.54, ci: 0.445, },
		    '2033717': { id: '2033717', con: 'Cyg', name: '', ra: 19.52203641, dec: 50.30670881, mag: 5.55, ci: 1.274, },
		    '2245769': { id: '2245769', con: 'Aqr', name: '', ra: 20.8690818, dec: -5.50705939, mag: 5.55, ci: -0.076, },
		    '2258956': { id: '2258956', con: 'Cyg', name: '', ra: 20.97207319, dec: 44.47171264, mag: 5.55, ci: 0.973, },
		    '2275243': { id: '2275243', con: 'Mic', name: '', ra: 21.10708879, dec: -41.38596249, mag: 5.55, ci: 1.35, },
		    '2378415': { id: '2378415', con: 'Cep', name: '', ra: 22.034604, dec: 58.000366, mag: 5.55, ci: 0.017, },
		    '2380550': { id: '2380550', con: 'Aqr', name: '', ra: 22.05457213, dec: -6.52240775, mag: 5.55, ci: 0.959, },
		    '2420309': { id: '2420309', con: 'Aqr', name: '', ra: 22.44285753, dec: -16.74192724, mag: 5.55, ci: 0.618, },
		    '2474401': { id: '2474401', con: 'PsA', name: '', ra: 23.022052, dec: -28.85395893, mag: 5.55, ci: 1.349, },
		    '2494135': { id: '2494135', con: 'Cep', name: '', ra: 23.26048236, dec: 70.88807685, mag: 5.55, ci: 0.263, },
		    '2518596': { id: '2518596', con: 'And', name: '', ra: 23.57709358, dec: 40.23643951, mag: 5.55, ci: 0.096, },
		    '2534734': { id: '2534734', con: 'Cas', name: '', ra: 23.78386645, dec: 57.45136147, mag: 5.55, ci: 1.63, },
		    '2100413': { id: '2100413', con: 'Vul', name: '', ra: 19.90863178, dec: 24.31939011, mag: 5.56, ci: -0.018, },
		    '2423564': { id: '2423564', con: 'Ind', name: '', ra: 22.47713082, dec: -67.48905948, mag: 5.56, ci: 0.208, },
		    '2494059': { id: '2494059', con: 'Aqr', name: '', ra: 23.25951587, dec: -3.49638234, mag: 5.56, ci: 0.062, },
		    '2499114': { id: '2499114', con: 'Aqr', name: '', ra: 23.32332704, dec: -5.12435461, mag: 5.56, ci: 0.386, },
		    '2503162': { id: '2503162', con: 'Cas', name: '', ra: 23.37570388, dec: 60.13348565, mag: 5.56, ci: 1.679, },
		    '2506193': { id: '2506193', con: 'Peg', name: '', ra: 23.41412028, dec: 32.38488441, mag: 5.56, ci: -0.075, },
		    '2508920': { id: '2508920', con: 'Cep', name: '', ra: 23.45023883, dec: 87.30749983, mag: 5.56, ci: 0.25, },
		    '2020425': { id: '2020425', con: 'Sgr', name: '', ra: 19.43865476, dec: -21.77669581, mag: 5.57, ci: 1.228, },
		    '2028427': { id: '2028427', con: 'Aql', name: '', ra: 19.48948718, dec: 14.59601942, mag: 5.57, ci: 1.05, },
		    '2235892': { id: '2235892', con: 'Del', name: '', ra: 20.79675864, dec: 6.00819368, mag: 5.57, ci: -0.01, },
		    '2326855': { id: '2326855', con: 'Gru', name: '', ra: 21.55653228, dec: -44.84870126, mag: 5.57, ci: 1.044, },
		    '2351147': { id: '2351147', con: 'Cap', name: '', ra: 21.77558277, dec: -11.36595306, mag: 5.57, ci: -0.002, },
		    '2354122': { id: '2354122', con: 'Gru', name: '', ra: 21.80437507, dec: -47.3036138, mag: 5.57, ci: 0.601, },
		    '2379971': { id: '2379971', con: 'Cyg', name: '', ra: 22.04907201, dec: 44.64987239, mag: 5.57, ci: -0.029, },
		    '2490842': { id: '2490842', con: 'Cas', name: '', ra: 23.22138224, dec: 57.16835643, mag: 5.57, ci: 1, },
		    '2548237': { id: '2548237', con: 'Cas', name: '', ra: 23.95235323, dec: 55.70570359, mag: 5.57, ci: 0.478, },
		    '2164730': { id: '2164730', con: 'Cyg', name: '', ra: 20.30795961, dec: 36.99980448, mag: 5.58, ci: 0.056, },
		    '2173890': { id: '2173890', con: 'Cyg', name: '', ra: 20.36815739, dec: 45.79499316, mag: 5.58, ci: 1.077, },
		    '2303890': { id: '2303890', con: 'Peg', name: '', ra: 21.35122053, dec: 23.8559678, mag: 5.58, ci: 1.057, },
		    '2390806': { id: '2390806', con: 'Peg', name: '', ra: 22.15378725, dec: 33.17233623, mag: 5.58, ci: 0.985, },
		    '2398558': { id: '2398558', con: 'PsA', name: '', ra: 22.22900944, dec: -25.18090377, mag: 5.58, ci: 0.497, },
		    '2495598': { id: '2495598', con: 'Cas', name: '', ra: 23.27841754, dec: 53.21347274, mag: 5.58, ci: 0.556, },
		    '2501014': { id: '2501014', con: 'Peg', name: '', ra: 23.34709876, dec: 30.41492146, mag: 5.58, ci: 1.501, },
		    '2003449': { id: '2003449', con: 'Sgr', name: '', ra: 19.32777636, dec: -35.42145565, mag: 5.59, ci: -0.122, },
		    '2005882': { id: '2005882', con: 'Sgr', name: '', ra: 19.34393, dec: -22.402535, mag: 5.59, ci: 0.276, },
		    '2039291': { id: '2039291', con: 'Tel', name: '', ra: 19.55600545, dec: -45.27175282, mag: 5.59, ci: -0.02, },
		    '2168889': { id: '2168889', con: 'Dra', name: '', ra: 20.33500375, dec: 68.88031712, mag: 5.59, ci: 1.472, },
		    '2210824': { id: '2210824', con: 'Vul', name: '', ra: 20.61796502, dec: 26.46194842, mag: 5.59, ci: -0.05, },
		    '2225100': { id: '2225100', con: 'Cep', name: '', ra: 20.71972864, dec: 66.65744698, mag: 5.59, ci: 0.218, },
		    '2259309': { id: '2259309', con: 'Cyg', name: '', ra: 20.97501416, dec: 50.46189903, mag: 5.59, ci: -0.144, },
		    '2311877': { id: '2311877', con: 'Cyg', name: '', ra: 21.42209687, dec: 46.71433828, mag: 5.59, ci: 0.335, },
		    '2541382': { id: '2541382', con: 'Psc', name: '', ra: 23.86606611, dec: 2.93038557, mag: 5.59, ci: 1.527, },
		    '2551436': { id: '2551436', con: 'Scl', name: '', ra: 23.99108235, dec: -29.48516758, mag: 5.59, ci: 1.599, },
		    '2020183': { id: '2020183', con: 'Vul', name: '', ra: 19.43701288, dec: 20.097735, mag: 5.6, ci: -0.006, },
		    '2093256': { id: '2093256', con: 'Cyg', name: '', ra: 19.86640788, dec: 47.02734464, mag: 5.6, ci: -0.078, },
		    '2101094': { id: '2101094', con: 'Aql', name: '', ra: 19.91244338, dec: 0.2736294, mag: 5.6, ci: 0.098, },
		    '2174808': { id: '2174808', con: 'Sgr', name: '', ra: 20.37430701, dec: -42.04955476, mag: 5.6, ci: 0.002, },
		    '2235928': { id: '2235928', con: 'Cyg', name: '', ra: 20.79702412, dec: 47.83186869, mag: 5.6, ci: 1.466, },
		    '2279803': { id: '2279803', con: 'Cyg', name: '', ra: 21.14413717, dec: 30.20563408, mag: 5.6, ci: -0.048, },
		    '2376673': { id: '2376673', con: 'Aqr', name: '', ra: 22.01805985, dec: 0.6047165, mag: 5.6, ci: 1.279, },
		    '2424372': { id: '2424372', con: 'Peg', name: '', ra: 22.48555067, dec: 9.12903445, mag: 5.6, ci: 1.578, },
		    '2467134': { id: '2467134', con: 'Lac', name: '', ra: 22.93989705, dec: 41.60387495, mag: 5.6, ci: -0.149, },
		    '2484265': { id: '2484265', con: 'Scl', name: '', ra: 23.13918534, dec: -28.82367732, mag: 5.6, ci: 0.882, },
		    '2506789': { id: '2506789', con: 'Tuc', name: '', ra: 23.42207366, dec: -56.84898359, mag: 5.6, ci: 1.063, },
		    '2509271': { id: '2509271', con: 'Cep', name: '', ra: 23.45461823, dec: 70.35978491, mag: 5.6, ci: 0.163, },
		    '2376686': { id: '2376686', con: 'Peg', name: '', ra: 22.0181527, dec: 13.11982155, mag: 5.61, ci: 0.336, },
		    '2459402': { id: '2459402', con: 'Cep', name: '', ra: 22.85627145, dec: 61.69676901, mag: 5.61, ci: 0.775, },
		    '2128387': { id: '2128387', con: 'Cyg', name: '', ra: 20.07671514, dec: 32.21859971, mag: 5.62, ci: 0.76, },
		    '2357115': { id: '2357115', con: 'Ind', name: '', ra: 21.83336796, dec: -64.71253715, mag: 5.62, ci: 1.018, },
		    '2384980': { id: '2384980', con: 'Ind', name: '', ra: 22.09750487, dec: -59.63607218, mag: 5.62, ci: 1.468, },
		    '2414461': { id: '2414461', con: 'Gru', name: '', ra: 22.38555201, dec: -45.92848834, mag: 5.62, ci: 0.372, },
		    '2482270': { id: '2482270', con: 'Gru', name: '', ra: 23.11489544, dec: -38.89230027, mag: 5.62, ci: 0.006, },
		    '2097051': { id: '2097051', con: 'Aql', name: '', ra: 19.88853778, dec: -3.11446088, mag: 5.63, ci: 0.231, },
		    '2187715': { id: '2187715', con: 'Cyg', name: '', ra: 20.45951597, dec: 38.44034549, mag: 5.63, ci: 0.072, },
		    '2271448': { id: '2271448', con: 'Equ', name: '', ra: 21.07629203, dec: 5.50286116, mag: 5.63, ci: 1.65, },
		    '2307620': { id: '2307620', con: 'Cap', name: '', ra: 21.38347097, dec: -22.66904963, mag: 5.63, ci: 1.641, },
		    '2352363': { id: '2352363', con: 'Peg', name: '', ra: 21.78721171, dec: 2.68612557, mag: 5.63, ci: 0.012, },
		    '2509240': { id: '2509240', con: 'Tuc', name: '', ra: 23.45416467, dec: -58.47610948, mag: 5.63, ci: 0.983, },
		    '2518611': { id: '2518611', con: 'Peg', name: '', ra: 23.57727856, dec: 33.49732841, mag: 5.63, ci: 1.042, },
		    '2046816': { id: '2046816', con: 'Sgr', name: '', ra: 19.60045931, dec: -24.71908406, mag: 5.64, ci: 0.185, },
		    '2060215': { id: '2060215', con: 'Aql', name: '', ra: 19.67870088, dec: -0.6212553, mag: 5.64, ci: 0.123, },
		    '2178490': { id: '2178490', con: 'Sgr', name: '', ra: 20.39810421, dec: -42.42284643, mag: 5.64, ci: 0.201, },
		    '2286044': { id: '2286044', con: 'Cep', name: '', ra: 21.19672614, dec: 59.98654761, mag: 5.64, ci: 0.11, },
		    '2313757': { id: '2313757', con: 'Mic', name: '', ra: 21.43968725, dec: -37.82942822, mag: 5.64, ci: 1.185, },
		    '2425845': { id: '2425845', con: 'Peg', name: '', ra: 22.50050394, dec: 32.5726405, mag: 5.64, ci: -0.031, },
		    '2495963': { id: '2495963', con: 'Tuc', name: '', ra: 23.28269287, dec: -62.00118278, mag: 5.64, ci: 0.521, },
		    '2116659': { id: '2116659', con: 'Sgr', name: '', ra: 20.00562546, dec: -33.70345393, mag: 5.65, ci: 0.498, },
		    '2154186': { id: '2154186', con: 'Tel', name: '', ra: 20.23861922, dec: -52.44576848, mag: 5.65, ci: 1.497, },
		    '2376779': { id: '2376779', con: 'Peg', name: '', ra: 22.01923189, dec: 8.25716857, mag: 5.65, ci: 1.44, },
		    '2501586': { id: '2501586', con: 'Scl', name: '', ra: 23.35430513, dec: -26.98676953, mag: 5.65, ci: 0.817, },
		    '2022109': { id: '2022109', con: 'Sgr', name: '', ra: 19.44902311, dec: -29.74322767, mag: 5.66, ci: -0.014, },
		    '2049684': { id: '2049684', con: 'Sgr', name: '', ra: 19.61759473, dec: -18.23105054, mag: 5.66, ci: 1.237, },
		    '2199627': { id: '2199627', con: 'Cap', name: '', ra: 20.53991531, dec: -9.85339035, mag: 5.66, ci: 0.689, },
		    '2244261': { id: '2244261', con: 'Vul', name: '', ra: 20.85784374, dec: 28.25050359, mag: 5.66, ci: 0.616, },
		    '2336565': { id: '2336565', con: 'Peg', name: '', ra: 21.64220575, dec: 5.77174268, mag: 5.66, ci: 0.265, },
		    '2343363': { id: '2343363', con: 'Aqr', name: '', ra: 21.70280902, dec: 1.28525661, mag: 5.66, ci: 1.446, },
		    '2439904': { id: '2439904', con: 'PsA', name: '', ra: 22.64762934, dec: -33.08134715, mag: 5.66, ci: 0.037, },
		    '2472585': { id: '2472585', con: 'PsA', name: '', ra: 23.00160849, dec: -25.16417827, mag: 5.66, ci: 1.253, },
		    '2511465': { id: '2511465', con: 'Tuc', name: '', ra: 23.48360606, dec: -63.11065345, mag: 5.66, ci: -0.142, },
		    '2522483': { id: '2522483', con: 'Aqr', name: '', ra: 23.62765566, dec: -13.06024123, mag: 5.66, ci: 1.025, },
		    '2050363': { id: '2050363', con: 'Sge', name: '', ra: 19.62149826, dec: 16.4628005, mag: 5.67, ci: 1.007, },
		    '2127782': { id: '2127782', con: 'Aql', name: '', ra: 20.07309779, dec: -0.7093067, mag: 5.67, ci: 1.301, },
		    '2244643': { id: '2244643', con: 'Pav', name: '', ra: 20.86068734, dec: -62.42932555, mag: 5.67, ci: 0.203, },
		    '2281221': { id: '2281221', con: 'Pav', name: '', ra: 21.156052, dec: -73.172968, mag: 5.67, ci: 0.59, },
		    '2310545': { id: '2310545', con: 'Vul', name: '', ra: 21.40944604, dec: 26.17455655, mag: 5.67, ci: 0.323, },
		    '2089345': { id: '2089345', con: 'Cyg', name: '', ra: 19.84370201, dec: 40.59976295, mag: 5.68, ci: -0.058, },
		    '2113527': { id: '2113527', con: 'Vul', name: '', ra: 19.98626085, dec: 23.10128678, mag: 5.68, ci: 0.345, },
		    '2183099': { id: '2183099', con: 'Vul', name: '', ra: 20.42792447, dec: 21.40964232, mag: 5.68, ci: 0.921, },
		    '2215254': { id: '2215254', con: 'Cyg', name: '', ra: 20.64986578, dec: 30.33426826, mag: 5.68, ci: 1.088, },
		    '2222155': { id: '2222155', con: 'Cyg', name: '', ra: 20.69902818, dec: 41.71687758, mag: 5.68, ci: -0.107, },
		    '2253781': { id: '2253781', con: 'Cyg', name: '', ra: 20.93050111, dec: 47.41765698, mag: 5.68, ci: 0.408, },
		    '2305705': { id: '2305705', con: 'Cyg', name: '', ra: 21.36678271, dec: 49.38884588, mag: 5.68, ci: 1.1, },
		    '2453802': { id: '2453802', con: 'Aqr', name: '', ra: 22.79521377, dec: -14.0564292, mag: 5.68, ci: -0.016, },
		    '2474113': { id: '2474113', con: 'Gru', name: '', ra: 23.01877125, dec: -50.95003501, mag: 5.68, ci: 1.411, },
		    '2483443': { id: '2483443', con: 'And', name: '', ra: 23.12927326, dec: 49.29577577, mag: 5.68, ci: 0.449, },
		    '2486139': { id: '2486139', con: 'Cas', name: '', ra: 23.16226046, dec: 59.33269354, mag: 5.68, ci: 0.315, },
		    '2487440': { id: '2487440', con: 'Peg', name: '', ra: 23.17851017, dec: 17.59437025, mag: 5.68, ci: 1.33, },
		    '2520895': { id: '2520895', con: 'Psc', name: '', ra: 23.60646826, dec: 2.10222138, mag: 5.68, ci: 0.449, },
		    '2121166': { id: '2121166', con: 'Sgr', name: '', ra: 20.03294471, dec: -13.63721424, mag: 5.69, ci: 0.079, },
		    '2171695': { id: '2171695', con: 'Dra', name: '', ra: 20.35320127, dec: 63.98011805, mag: 5.69, ci: 1.561, },
		    '2214664': { id: '2214664', con: 'Del', name: '', ra: 20.6455517, dec: 13.31512704, mag: 5.69, ci: 1.509, },
		    '2263274': { id: '2263274', con: 'Del', name: '', ra: 21.00769107, dec: 19.32958163, mag: 5.69, ci: 1.588, },
		    '2274454': { id: '2274454', con: 'Mic', name: '', ra: 21.10031886, dec: -30.1251222, mag: 5.69, ci: 1.047, },
		    '2345632': { id: '2345632', con: 'Cyg', name: '', ra: 21.72379255, dec: 38.28359186, mag: 5.69, ci: -0.01, },
		    '2363478': { id: '2363478', con: 'Peg', name: '', ra: 21.89371633, dec: 19.66842272, mag: 5.69, ci: 0.011, },
		    '2384469': { id: '2384469', con: 'Peg', name: '', ra: 22.09296524, dec: 28.96398132, mag: 5.69, ci: -0.048, },
		    '2024341': { id: '2024341', con: 'Tel', name: '', ra: 19.46336583, dec: -54.32527185, mag: 5.7, ci: 1.406, },
		    '2028505': { id: '2028505', con: 'Sgr', name: '', ra: 19.48995662, dec: -43.44519383, mag: 5.7, ci: 0.214, },
		    '2100740': { id: '2100740', con: 'Aql', name: '', ra: 19.91045881, dec: -8.22729774, mag: 5.7, ci: -0.079, },
		    '2147022': { id: '2147022', con: 'Dra', name: '', ra: 20.19302774, dec: 62.0785349, mag: 5.7, ci: 0.53, },
		    '2156880': { id: '2156880', con: 'Cyg', name: '', ra: 20.25660242, dec: 33.72908174, mag: 5.7, ci: 0.926, },
		    '2255777': { id: '2255777', con: 'Cap', name: '', ra: 20.94648097, dec: -26.29637421, mag: 5.7, ci: 0.507, },
		    '2309436': { id: '2309436', con: 'Vul', name: '', ra: 21.39967423, dec: 24.27413833, mag: 5.7, ci: 0.314, },
		    '2329557': { id: '2329557', con: 'Cap', name: '', ra: 21.58084726, dec: -20.08427935, mag: 5.7, ci: 0.423, },
		    '2360674': { id: '2360674', con: 'Cep', name: '', ra: 21.866954, dec: 55.796743, mag: 5.7, ci: -0.081, },
		    '2429410': { id: '2429410', con: 'Cep', name: '', ra: 22.53784073, dec: 76.22644388, mag: 5.7, ci: 0.02, },
		    '2539455': { id: '2539455', con: 'Aqr', name: '', ra: 23.8425792, dec: -14.40149413, mag: 5.7, ci: 1.488, },
		    '2020088': { id: '2020088', con: 'Sgr', name: '', ra: 19.43640048, dec: -15.05325335, mag: 5.71, ci: 0.007, },
		    '2042064': { id: '2042064', con: 'Cyg', name: '', ra: 19.57216398, dec: 51.23662245, mag: 5.71, ci: 0.475, },
		    '2104681': { id: '2104681', con: 'Sge', name: '', ra: 19.93368437, dec: 16.63480419, mag: 5.71, ci: 0.903, },
		    '2167709': { id: '2167709', con: 'Dra', name: '', ra: 20.32686617, dec: 62.25747566, mag: 5.71, ci: -0.043, },
		    '2311702': { id: '2311702', con: 'Aqr', name: '', ra: 21.42028507, dec: -9.74854648, mag: 5.71, ci: 0.208, },
		    '2364436': { id: '2364436', con: 'Aqr', name: '', ra: 21.90288161, dec: -4.27618364, mag: 5.71, ci: 1.185, },
		    '2018030': { id: '2018030', con: 'Sgr', name: '', ra: 19.42266545, dec: -13.89712255, mag: 5.72, ci: 1.372, },
		    '2400332': { id: '2400332', con: 'Lac', name: '', ra: 22.24565799, dec: 42.95391289, mag: 5.72, ci: 0.014, },
		    '2431646': { id: '2431646', con: 'Lac', name: '', ra: 22.56129154, dec: 56.62473566, mag: 5.72, ci: 0.966, },
		    '2443114': { id: '2443114', con: 'Peg', name: '', ra: 22.6813035, dec: 14.54921356, mag: 5.72, ci: 0.723, },
		    '2465212': { id: '2465212', con: 'Aqr', name: '', ra: 22.91971051, dec: -4.98787921, mag: 5.72, ci: 0.881, },
		    '2467743': { id: '2467743', con: 'Gru', name: '', ra: 22.94661129, dec: -47.96922126, mag: 5.72, ci: 0.226, },
		    '2548781': { id: '2548781', con: 'Oct', name: '', ra: 23.95913021, dec: -82.16980442, mag: 5.72, ci: 1.055, },
		    '2023384': { id: '2023384', con: 'Cyg', name: '', ra: 19.45721047, dec: 52.32043839, mag: 5.73, ci: -0.002, },
		    '2125283': { id: '2125283', con: 'Aql', name: '', ra: 20.05833798, dec: 16.03125452, mag: 5.73, ci: -0.095, },
		    '2125626': { id: '2125626', con: 'Cyg', name: '', ra: 20.0603904, dec: 29.89680549, mag: 5.73, ci: 0.749, },
		    '2156595': { id: '2156595', con: 'Cap', name: '', ra: 20.25483116, dec: -27.03297414, mag: 5.73, ci: 0.878, },
		    '2186368': { id: '2186368', con: 'Cyg', name: '', ra: 20.45062918, dec: 49.38336367, mag: 5.73, ci: 0.339, },
		    '2293807': { id: '2293807', con: 'Ind', name: '', ra: 21.26274198, dec: -53.26308956, mag: 5.73, ci: 0.191, },
		    '2332090': { id: '2332090', con: 'PsA', name: '', ra: 21.60304826, dec: -26.17151868, mag: 5.73, ci: 0.234, },
		    '2343751': { id: '2343751', con: 'Cyg', name: '', ra: 21.70637812, dec: 41.07702277, mag: 5.73, ci: 0.055, },
		    '2435202': { id: '2435202', con: 'Lac', name: '', ra: 22.59785642, dec: 39.63433835, mag: 5.73, ci: -0.16, },
		    '2466077': { id: '2466077', con: 'Lac', name: '', ra: 22.92902961, dec: 36.35138865, mag: 5.73, ci: -0.051, },
		    '2531000': { id: '2531000', con: 'Tuc', name: '', ra: 23.7366793, dec: -64.40445167, mag: 5.73, ci: 1.393, },
		    '2112175': { id: '2112175', con: 'Pav', name: '', ra: 19.97813592, dec: -69.16395754, mag: 5.74, ci: 0.224, },
		    '2337354': { id: '2337354', con: 'Cep', name: '', ra: 21.6493383, dec: 57.48904196, mag: 5.74, ci: 0.2, },
		    '2365676': { id: '2365676', con: 'Cep', name: '', ra: 21.91476521, dec: 56.6112279, mag: 5.74, ci: 0.655, },
		    '2387742': { id: '2387742', con: 'Peg', name: '', ra: 22.12460931, dec: 19.47552254, mag: 5.74, ci: 0.331, },
		    '2531614': { id: '2531614', con: 'Oct', name: '', ra: 23.74467861, dec: -78.79143435, mag: 5.74, ci: 1.108, },
		    '2535043': { id: '2535043', con: 'Aqr', name: '', ra: 23.78775383, dec: -11.91112591, mag: 5.74, ci: 1.068, },
		    '2083694': { id: '2083694', con: 'Aql', name: '', ra: 19.81170164, dec: 11.81580106, mag: 5.75, ci: 0.546, },
		    '2116784': { id: '2116784', con: 'Pav', name: '', ra: 20.0064132, dec: -66.94937197, mag: 5.75, ci: 1.033, },
		    '2220830': { id: '2220830', con: 'Mic', name: '', ra: 20.6899049, dec: -31.59828712, mag: 5.75, ci: 1.551, },
		    '2223708': { id: '2223708', con: 'Dra', name: '', ra: 20.70978854, dec: 82.53116054, mag: 5.75, ci: 0, },
		    '2279606': { id: '2279606', con: 'Pav', name: '', ra: 21.14241571, dec: -63.92825477, mag: 5.75, ci: 1.18, },
		    '2282981': { id: '2282981', con: 'Cyg', name: '', ra: 21.17099272, dec: 53.56310101, mag: 5.75, ci: -0.111, },
		    '2300840': { id: '2300840', con: 'Cyg', name: '', ra: 21.32465233, dec: 49.51029885, mag: 5.75, ci: -0.119, },
		    '2317031': { id: '2317031', con: 'Cyg', name: '', ra: 21.46895877, dec: 32.22533519, mag: 5.75, ci: 0.333, },
		    '2383801': { id: '2383801', con: 'Peg', name: '', ra: 22.08648162, dec: 26.6736913, mag: 5.75, ci: 1.249, },
		    '2404369': { id: '2404369', con: 'Aqr', name: '', ra: 22.28513873, dec: -5.38716489, mag: 5.75, ci: 0.878, },
		    '2406216': { id: '2406216', con: 'Cep', name: '', ra: 22.30351398, dec: 62.8043882, mag: 5.75, ci: 1.256, },
		    '2505385': { id: '2505385', con: 'Gru', name: '', ra: 23.40368353, dec: -51.89117382, mag: 5.75, ci: 1.611, },
		    '2509055': { id: '2509055', con: 'And', name: '', ra: 23.45205602, dec: 42.91201277, mag: 5.75, ci: -0.007, },
		    '2020662': { id: '2020662', con: 'Aql', name: '', ra: 19.44003742, dec: 13.0237971, mag: 5.76, ci: 0.456, },
		    '2038002': { id: '2038002', con: 'Tel', name: '', ra: 19.54828319, dec: -53.18562045, mag: 5.76, ci: 0.3, },
		    '2095097': { id: '2095097', con: 'Tel', name: '', ra: 19.87714463, dec: -54.97102951, mag: 5.76, ci: 0.915, },
		    '2099418': { id: '2099418', con: 'Aql', name: '', ra: 19.90229919, dec: -8.57420842, mag: 5.76, ci: 1.664, },
		    '2164559': { id: '2164559', con: 'Cyg', name: '', ra: 20.30687644, dec: 55.39705565, mag: 5.76, ci: 0.118, },
		    '2201777': { id: '2201777', con: 'Oct', name: '', ra: 20.55490015, dec: -80.96487094, mag: 5.76, ci: 1.122, },
		    '2263083': { id: '2263083', con: 'Ind', name: '', ra: 21.00596733, dec: -51.2653161, mag: 5.76, ci: 0.48, },
		    '2310267': { id: '2310267', con: 'Mic', name: '', ra: 21.40689308, dec: -41.00671785, mag: 5.76, ci: -0.036, },
		    '2396197': { id: '2396197', con: 'Cep', name: '', ra: 22.20623579, dec: 63.29103276, mag: 5.76, ci: 1.645, },
		    '2416735': { id: '2416735', con: 'Aqr', name: '', ra: 22.40751674, dec: -13.52937044, mag: 5.76, ci: 0.97, },
		    '2420392': { id: '2420392', con: 'Peg', name: '', ra: 22.44371889, dec: 4.39376075, mag: 5.76, ci: 0.519, },
		    '2428393': { id: '2428393', con: 'Oct', name: '', ra: 22.52708641, dec: -85.96725156, mag: 5.76, ci: 1.02, },
		    '2471228': { id: '2471228', con: 'Peg', name: '', ra: 22.98661488, dec: 11.72885982, mag: 5.76, ci: 0.293, },
		    '2542519': { id: '2542519', con: 'Aqr', name: '', ra: 23.88070241, dec: -8.99675639, mag: 5.76, ci: 1.171, },
		    '2275380': { id: '2275380', con: 'Cyg', name: '', ra: 21.10840103, dec: 31.18465889, mag: 5.77, ci: 0.554, },
		    '2326023': { id: '2326023', con: 'Cyg', name: '', ra: 21.54905353, dec: 49.97763661, mag: 5.77, ci: -0.042, },
		    '2337470': { id: '2337470', con: 'Peg', name: '', ra: 21.65033042, dec: 20.26545082, mag: 5.77, ci: 0.314, },
		    '2493238': { id: '2493238', con: 'Gru', name: '', ra: 23.24961683, dec: -41.10539574, mag: 5.77, ci: 1.16, },
		    '2501109': { id: '2501109', con: 'And', name: '', ra: 23.34812898, dec: 38.18232576, mag: 5.77, ci: 0.468, },
		    '2537945': { id: '2537945', con: 'Psc', name: '', ra: 23.82429874, dec: 1.07613016, mag: 5.77, ci: 0.167, },
		    '2540530': { id: '2540530', con: 'Peg', name: '', ra: 23.8559026, dec: 9.31335068, mag: 5.77, ci: 1.661, },
		    '2203265': { id: '2203265', con: 'Cyg', name: '', ra: 20.5652343, dec: 46.69387647, mag: 5.78, ci: -0.14, },
		    '2251578': { id: '2251578', con: 'Cap', name: '', ra: 20.9132823, dec: -17.92289527, mag: 5.78, ci: 1.122, },
		    '2315330': { id: '2315330', con: 'Cap', name: '', ra: 21.45411646, dec: -21.19621018, mag: 5.78, ci: 1.44, },
		    '2359845': { id: '2359845', con: 'Peg', name: '', ra: 21.85951379, dec: 19.82668373, mag: 5.78, ci: -0.1, },
		    '2393262': { id: '2393262', con: 'Peg', name: '', ra: 22.17706449, dec: 11.62454229, mag: 5.78, ci: 1.617, },
		    '2417963': { id: '2417963', con: 'Ind', name: '', ra: 22.41961188, dec: -70.43162231, mag: 5.78, ci: 0.396, },
		    '2545097': { id: '2545097', con: 'Psc', name: '', ra: 23.91295083, dec: 0.10930789, mag: 5.78, ci: 1.466, },
		    '2027532': { id: '2027532', con: 'Aql', name: '', ra: 19.48360777, dec: 1.95045022, mag: 5.79, ci: 0.088, },
		    '2101273': { id: '2101273', con: 'Cyg', name: '', ra: 19.91340288, dec: 36.99567648, mag: 5.79, ci: 0.773, },
		    '2218860': { id: '2218860', con: 'Cap', name: '', ra: 20.67569965, dec: -16.12418213, mag: 5.79, ci: 0.997, },
		    '2330403': { id: '2330403', con: 'Aqr', name: '', ra: 21.58822817, dec: -3.98330454, mag: 5.79, ci: 1.11, },
		    '2378014': { id: '2378014', con: 'Cyg', name: '', ra: 22.03071878, dec: 52.88225688, mag: 5.79, ci: -0.106, },
		    '2388380': { id: '2388380', con: 'Peg', name: '', ra: 22.13064025, dec: 21.70292659, mag: 5.79, ci: -0.077, },
		    '2416157': { id: '2416157', con: 'Aqr', name: '', ra: 22.40191216, dec: -4.83702866, mag: 5.79, ci: -0.033, },
		    '2424436': { id: '2424436', con: 'Peg', name: '', ra: 22.48617437, dec: 26.76319884, mag: 5.79, ci: 1.252, },
		    '2462906': { id: '2462906', con: 'Lac', name: '', ra: 22.89448674, dec: 44.74914526, mag: 5.79, ci: 0.282, },
		    '2478265': { id: '2478265', con: 'Gru', name: '', ra: 23.06656682, dec: -41.47889579, mag: 5.79, ci: 1.069, },
		    '2117950': { id: '2117950', con: 'Sgr', name: '', ra: 20.01342354, dec: -45.11292027, mag: 5.8, ci: 0.295, },
		    '2126990': { id: '2126990', con: 'Sge', name: '', ra: 20.06839607, dec: 17.07017106, mag: 5.8, ci: 0.6, },
		    '2390381': { id: '2390381', con: 'Aqr', name: '', ra: 22.14971915, dec: -18.51959147, mag: 5.8, ci: -0.154, },
		    '2403988': { id: '2403988', con: 'Aqr', name: '', ra: 22.28126827, dec: -9.04006408, mag: 5.8, ci: 1.158, },
		    '2437345': { id: '2437345', con: 'Cep', name: '', ra: 22.62026746, dec: 75.37181138, mag: 5.8, ci: 1.594, },
		    '2462608': { id: '2462608', con: 'Aqr', name: '', ra: 22.89130681, dec: -11.61651304, mag: 5.8, ci: -0.082, },
		    '2010265': { id: '2010265', con: 'Aql', name: '', ra: 19.37265142, dec: -0.25234255, mag: 5.81, ci: 1.093, },
		    '2132855': { id: '2132855', con: 'Cyg', name: '', ra: 20.10384627, dec: 53.1656863, mag: 5.81, ci: 0.445, },
		    '2152004': { id: '2152004', con: 'Cep', name: '', ra: 20.22433765, dec: 60.64056562, mag: 5.81, ci: 1.476, },
		    '2303898': { id: '2303898', con: 'Equ', name: '', ra: 21.3513404, dec: 7.35450603, mag: 5.81, ci: 1.663, },
		    '2482758': { id: '2482758', con: 'Gru', name: '', ra: 23.12076995, dec: -50.68668799, mag: 5.81, ci: 0.486, },
		    '2499767': { id: '2499767', con: 'And', name: '', ra: 23.3312279, dec: 42.07805967, mag: 5.81, ci: 1.512, },
		    '2522322': { id: '2522322', con: 'And', name: '', ra: 23.6255673, dec: 44.42903936, mag: 5.81, ci: -0.064, },
		    '2551469': { id: '2551469', con: 'And', name: '', ra: 23.99144376, dec: 33.72431127, mag: 5.81, ci: 0.539, },
		    '2027353': { id: '2027353', con: 'Vul', name: '', ra: 19.48252298, dec: 24.76871551, mag: 5.82, ci: 1.023, },
		    '2169538': { id: '2169538', con: 'Sge', name: '', ra: 20.33927933, dec: 17.79292711, mag: 5.82, ci: 1.5, },
		    '2436343': { id: '2436343', con: 'PsA', name: '', ra: 22.60984485, dec: -31.66378907, mag: 5.82, ci: 1.074, },
		    '2454568': { id: '2454568', con: 'Lac', name: '', ra: 22.80306545, dec: 37.41669388, mag: 5.82, ci: 1.024, },
		    '2463608': { id: '2463608', con: 'Lac', name: '', ra: 22.9019407, dec: 40.37690937, mag: 5.82, ci: 1.136, },
		    '2516951': { id: '2516951', con: 'Oct', name: '', ra: 23.55544034, dec: -77.3853271, mag: 5.82, ci: 0.681, },
		    '2079984': { id: '2079984', con: 'Cyg', name: '', ra: 19.79104972, dec: 38.40761573, mag: 5.83, ci: -0.087, },
		    '2163789': { id: '2163789', con: 'Cyg', name: '', ra: 20.30193808, dec: 40.73205465, mag: 5.83, ci: 0.073, },
		    '2255025': { id: '2255025', con: 'Cyg', name: '', ra: 20.94041054, dec: 50.72860299, mag: 5.83, ci: 0.337, },
		    '2266630': { id: '2266630', con: 'Cep', name: '', ra: 21.03583241, dec: 56.66973947, mag: 5.83, ci: -0.058, },
		    '2286868': { id: '2286868', con: 'Mic', name: '', ra: 21.20380846, dec: -40.26935982, mag: 5.83, ci: 0.45, },
		    '2298397': { id: '2298397', con: 'Aqr', name: '', ra: 21.30307574, dec: -4.5194747, mag: 5.83, ci: -0.13, },
		    '2380627': { id: '2380627', con: 'Peg', name: '', ra: 22.05528662, dec: 11.38654806, mag: 5.83, ci: -0.05, },
		    '2420515': { id: '2420515', con: 'Cep', name: '', ra: 22.44510999, dec: 78.78584889, mag: 5.83, ci: 0.171, },
		    '2486408': { id: '2486408', con: 'Gru', name: '', ra: 23.16594024, dec: -42.86123587, mag: 5.83, ci: 0.475, },
		    '2008982': { id: '2008982', con: 'Sgr', name: '', ra: 19.36413778, dec: -18.30838799, mag: 5.84, ci: 1.062, },
		    '2020884': { id: '2020884', con: 'Vul', name: '', ra: 19.44130193, dec: 19.89149279, mag: 5.84, ci: 1.558, },
		    '2025737': { id: '2025737', con: 'Aql', name: '', ra: 19.47244409, dec: 2.93002759, mag: 5.84, ci: -0.003, },
		    '2149329': { id: '2149329', con: 'Cap', name: '', ra: 20.2071862, dec: -12.61749772, mag: 5.84, ci: 0.476, },
		    '2318649': { id: '2318649', con: 'Peg', name: '', ra: 21.48327179, dec: 22.17943116, mag: 5.84, ci: 1.37, },
		    '2366878': { id: '2366878', con: 'Cep', name: '', ra: 21.92527571, dec: 65.32080354, mag: 5.84, ci: -0.037, },
		    '2439928': { id: '2439928', con: 'Peg', name: '', ra: 22.64794136, dec: 19.52226059, mag: 5.84, ci: 0.922, },
		    '2451419': { id: '2451419', con: 'Lac', name: '', ra: 22.76950617, dec: 44.54605436, mag: 5.84, ci: 0.358, },
		    '2014292': { id: '2014292', con: 'Lyr', name: '', ra: 19.39902814, dec: 43.38817074, mag: 5.85, ci: 0.924, },
		    '2436962': { id: '2436962', con: 'Gru', name: '', ra: 22.61634874, dec: -40.59102894, mag: 5.85, ci: 0.06, },
		    '2473527': { id: '2473527', con: 'Psc', name: '', ra: 23.01191666, dec: 3.01180193, mag: 5.85, ci: 1.343, },
		    '2491060': { id: '2491060', con: 'Peg', name: '', ra: 23.22402875, dec: 11.06500549, mag: 5.85, ci: 1.004, },
		    '2542063': { id: '2542063', con: 'Aqr', name: '', ra: 23.87499739, dec: -14.25121403, mag: 5.85, ci: 1.252, },
		    '2069051': { id: '2069051', con: 'Cyg', name: '', ra: 19.72919348, dec: 41.77310775, mag: 5.86, ci: 1.598, },
		    '2163571': { id: '2163571', con: 'Cap', name: '', ra: 20.30038829, dec: -21.80996392, mag: 5.86, ci: 1.002, },
		    '2182522': { id: '2182522', con: 'Sgr', name: '', ra: 20.4241191, dec: -28.66327003, mag: 5.86, ci: 1.101, },
		    '2239293': { id: '2239293', con: 'Cap', name: '', ra: 20.8215594, dec: -25.78123657, mag: 5.86, ci: -0.069, },
		    '2461960': { id: '2461960', con: 'Peg', name: '', ra: 22.88396274, dec: 16.84119793, mag: 5.86, ci: 1.132, },
		    '2519080': { id: '2519080', con: 'Cep', name: '', ra: 23.58306712, dec: 71.64204763, mag: 5.86, ci: 1.681, },
		    '2538267': { id: '2538267', con: 'And', name: '', ra: 23.82804474, dec: 36.42527985, mag: 5.86, ci: 0.806, },
		    '2115207': { id: '2115207', con: 'Aql', name: '', ra: 19.99647828, dec: -9.95825755, mag: 5.87, ci: 0.598, },
		    '2158414': { id: '2158414', con: 'Cyg', name: '', ra: 20.26683668, dec: 45.5795302, mag: 5.87, ci: 0.447, },
		    '2178096': { id: '2178096', con: 'Cyg', name: '', ra: 20.39565807, dec: 37.4764488, mag: 5.87, ci: -0.173, },
		    '2242491': { id: '2242491', con: 'Aqr', name: '', ra: 20.84493804, dec: -12.54490861, mag: 5.87, ci: 1.075, },
		    '2303886': { id: '2303886', con: 'Aqr', name: '', ra: 21.35119969, dec: -4.56012471, mag: 5.87, ci: 0.912, },
		    '2398392': { id: '2398392', con: 'Peg', name: '', ra: 22.22741656, dec: 28.60801329, mag: 5.87, ci: 1.169, },
		    '2093873': { id: '2093873', con: 'Sgr', name: '', ra: 19.87000116, dec: -19.04500191, mag: 5.88, ci: 0.979, },
		    '2120538': { id: '2120538', con: 'Vul', name: '', ra: 20.0290867, dec: 24.80042444, mag: 5.88, ci: -0.134, },
		    '2275156': { id: '2275156', con: 'Cep', name: '', ra: 21.10647232, dec: 71.43179849, mag: 5.88, ci: 0.386, },
		    '2345003': { id: '2345003', con: 'Cap', name: '', ra: 21.71788815, dec: -14.39971437, mag: 5.88, ci: 0.255, },
		    '2403216': { id: '2403216', con: 'Cep', name: '', ra: 22.2740459, dec: 57.22023812, mag: 5.88, ci: 0.95, },
		    '2429666': { id: '2429666', con: 'Lac', name: '', ra: 22.54066037, dec: 39.77972894, mag: 5.88, ci: 0.166, },
		    '2432247': { id: '2432247', con: 'Aqr', name: '', ra: 22.56747597, dec: -1.57426761, mag: 5.88, ci: 0.977, },
		    '2442323': { id: '2442323', con: 'PsA', name: '', ra: 22.67286257, dec: -30.6588692, mag: 5.88, ci: 1.297, },
		    '2486153': { id: '2486153', con: 'Scl', name: '', ra: 23.16239743, dec: -28.08857032, mag: 5.88, ci: 1.311, },
		    '2033835': { id: '2033835', con: 'Vul', name: '', ra: 19.52267206, dec: 26.61717099, mag: 5.89, ci: 0.915, },
		    '2041555': { id: '2041555', con: 'Sgr', name: '', ra: 19.56902352, dec: -40.03463743, mag: 5.89, ci: 0.105, },
		    '2054392': { id: '2054392', con: 'Cyg', name: '', ra: 19.64477312, dec: 54.97379082, mag: 5.89, ci: 0.482, },
		    '2074646': { id: '2074646', con: 'Aql', name: '', ra: 19.76109669, dec: 7.61316045, mag: 5.89, ci: 0.18, },
		    '2192418': { id: '2192418', con: 'Cyg', name: '', ra: 20.49086414, dec: 56.06819624, mag: 5.89, ci: -0.052, },
		    '2213709': { id: '2213709', con: 'Oct', name: '', ra: 20.63850148, dec: -81.28906316, mag: 5.89, ci: 1.692, },
		    '2257586': { id: '2257586', con: 'Cap', name: '', ra: 20.96129028, dec: -16.03153952, mag: 5.89, ci: 0.18, },
		    '2300638': { id: '2300638', con: 'Cyg', name: '', ra: 21.32282826, dec: 38.23748144, mag: 5.89, ci: 0.505, },
		    '2458918': { id: '2458918', con: 'Cep', name: '', ra: 22.85084392, dec: 85.37373842, mag: 5.89, ci: 1.34, },
		    '2492727': { id: '2492727', con: 'Cep', name: '', ra: 23.24363955, dec: 74.23126885, mag: 5.89, ci: -0.01, },
		    '2526982': { id: '2526982', con: 'Aqr', name: '', ra: 23.68580937, dec: -11.68064803, mag: 5.89, ci: 0.984, },
		    '2528020': { id: '2528020', con: 'Psc', name: '', ra: 23.6990804, dec: 7.25054851, mag: 5.89, ci: 0.101, },
		    '2070612': { id: '2070612', con: 'Dra', name: '', ra: 19.73844991, dec: 69.33706631, mag: 5.9, ci: 0.072, },
		    '2118447': { id: '2118447', con: 'Aql', name: '', ra: 20.01638254, dec: 8.55773244, mag: 5.9, ci: 1.529, },
		    '2192146': { id: '2192146', con: 'Cyg', name: '', ra: 20.4889974, dec: 36.45472855, mag: 5.9, ci: 0.407, },
		    '2486696': { id: '2486696', con: 'Gru', name: '', ra: 23.1693711, dec: -40.59154631, mag: 5.9, ci: 1.565, },
		    '2004946': { id: '2004946', con: 'Dra', name: '', ra: 19.33778714, dec: 57.64513172, mag: 5.91, ci: 1.626, },
		    '2017279': { id: '2017279', con: 'Sgr', name: '', ra: 19.41778929, dec: -29.30935943, mag: 5.91, ci: 1.278, },
		    '2088127': { id: '2088127', con: 'Tel', name: '', ra: 19.83723881, dec: -47.55738784, mag: 5.91, ci: 1.678, },
		    '2093641': { id: '2093641', con: 'Cyg', name: '', ra: 19.86865744, dec: 47.93179224, mag: 5.91, ci: -0.174, },
		    '2148171': { id: '2148171', con: 'Vul', name: '', ra: 20.20019463, dec: 26.47880793, mag: 5.91, ci: -0.107, },
		    '2162279': { id: '2162279', con: 'Dra', name: '', ra: 20.29203693, dec: 66.85368503, mag: 5.91, ci: 0.602, },
		    '2214331': { id: '2214331', con: 'Vul', name: '', ra: 20.64305311, dec: 23.68049063, mag: 5.91, ci: 0.953, },
		    '2227867': { id: '2227867', con: 'Cep', name: '', ra: 20.73945872, dec: 56.48840256, mag: 5.91, ci: 1.643, },
		    '2232077': { id: '2232077', con: 'Cap', name: '', ra: 20.76944094, dec: -21.51403284, mag: 5.91, ci: 0.066, },
		    '2273348': { id: '2273348', con: 'Cep', name: '', ra: 21.09146231, dec: 78.12639253, mag: 5.91, ci: -0.065, },
		    '2457886': { id: '2457886', con: 'Lac', name: '', ra: 22.83938202, dec: 41.95339377, mag: 5.91, ci: 0.062, },
		    '2465008': { id: '2465008', con: 'Lac', name: '', ra: 22.91740185, dec: 37.0768261, mag: 5.91, ci: 0.397, },
		    '2487084': { id: '2487084', con: 'And', name: '', ra: 23.17422417, dec: 43.5442701, mag: 5.91, ci: 0.45, },
		    '2517987': { id: '2517987', con: 'Psc', name: '', ra: 23.56917135, dec: -1.2475673, mag: 5.91, ci: 0.299, },
		    '2113956': { id: '2113956', con: 'Cyg', name: '', ra: 19.98900593, dec: 45.7725428, mag: 5.92, ci: 0.185, },
		    '2255037': { id: '2255037', con: 'Cyg', name: '', ra: 20.94052663, dec: 49.19585209, mag: 5.92, ci: 1.054, },
		    '2293699': { id: '2293699', con: 'Cep', name: '', ra: 21.26179105, dec: 77.01229521, mag: 5.92, ci: 1.531, },
		    '2366250': { id: '2366250', con: 'Ind', name: '', ra: 21.91983181, dec: -61.8866048, mag: 5.92, ci: 0.393, },
		    '2415156': { id: '2415156', con: 'Aqr', name: '', ra: 22.39226445, dec: -7.19442376, mag: 5.92, ci: 0.998, },
		    '2444847': { id: '2444847', con: 'Peg', name: '', ra: 22.69929312, dec: 14.51639409, mag: 5.92, ci: 1.114, },
		    '2495539': { id: '2495539', con: 'Gru', name: '', ra: 23.2777198, dec: -44.48916469, mag: 5.92, ci: 1.053, },
		    '2066066': { id: '2066066', con: 'Cyg', name: '', ra: 19.71239039, dec: 32.42674309, mag: 5.93, ci: 0.118, },
		    '2267248': { id: '2267248', con: 'Mic', name: '', ra: 21.04087964, dec: -38.53097403, mag: 5.93, ci: 1.106, },
		    '2269887': { id: '2269887', con: 'Cyg', name: '', ra: 21.06322869, dec: 53.2858946, mag: 5.93, ci: 1.001, },
		    '2312703': { id: '2312703', con: 'Cyg', name: '', ra: 21.42972923, dec: 36.66738536, mag: 5.93, ci: 0.033, },
		    '2395341': { id: '2395341', con: 'Peg', name: '', ra: 22.19759211, dec: 16.04055368, mag: 5.93, ci: 0.951, },
		    '2444293': { id: '2444293', con: 'Lac', name: '', ra: 22.69334768, dec: 41.5491194, mag: 5.93, ci: 0.998, },
		    '2448197': { id: '2448197', con: 'Lac', name: '', ra: 22.73477589, dec: 39.4653133, mag: 5.93, ci: 1.49, },
		    '2539038': { id: '2539038', con: 'Aqr', name: '', ra: 23.8374251, dec: -9.97413665, mag: 5.93, ci: 1.133, },
		    '2542620': { id: '2542620', con: 'Psc', name: '', ra: 23.88210143, dec: -3.155485, mag: 5.93, ci: 1.069, },
		    '2193521': { id: '2193521', con: 'Cap', name: '', ra: 20.49830789, dec: -18.58318004, mag: 5.94, ci: 0.062, },
		    '2273264': { id: '2273264', con: 'Equ', name: '', ra: 21.09075994, dec: 5.95817479, mag: 5.94, ci: 0.538, },
		    '2348267': { id: '2348267', con: 'Cep', name: '', ra: 21.74813281, dec: 62.46056822, mag: 5.94, ci: 0.312, },
		    '2380172': { id: '2380172', con: 'Oct', name: '', ra: 22.05105817, dec: -76.11843189, mag: 5.94, ci: 0.399, },
		    '2442221': { id: '2442221', con: 'Lac', name: '', ra: 22.67177988, dec: 53.84592791, mag: 5.94, ci: 0.946, },
		    '2474735': { id: '2474735', con: 'Aqr', name: '', ra: 23.02547497, dec: -4.71145763, mag: 5.94, ci: 0.992, },
		    '2116480': { id: '2116480', con: 'Sgr', name: '', ra: 20.00442582, dec: -37.70172179, mag: 5.95, ci: 0.989, },
		    '2175555': { id: '2175555', con: 'Cyg', name: '', ra: 20.37924914, dec: 41.02601424, mag: 5.95, ci: 1.632, },
		    '2259719': { id: '2259719', con: 'Aqr', name: '', ra: 20.97828882, dec: -14.48312312, mag: 5.95, ci: 0.244, },
		    '2425419': { id: '2425419', con: 'PsA', name: '', ra: 22.49611552, dec: -27.10726607, mag: 5.95, ci: 0.362, },
		    '2518873': { id: '2518873', con: 'Aqr', name: '', ra: 23.58037765, dec: -15.24600533, mag: 5.95, ci: 1.35, },
		    '2524424': { id: '2524424', con: 'Cep', name: '', ra: 23.65282674, dec: 75.29288518, mag: 5.95, ci: 0.124, },
		    '2534159': { id: '2534159', con: 'Cep', name: '', ra: 23.77687119, dec: 66.78225111, mag: 5.95, ci: -0.049, },
		    '2538240': { id: '2538240', con: 'Peg', name: '', ra: 23.82760967, dec: 28.84238891, mag: 5.95, ci: 0.187, },
		    '2548510': { id: '2548510', con: 'Tuc', name: '', ra: 23.95552472, dec: -62.95657683, mag: 5.95, ci: 0.101, },
		    '2168651': { id: '2168651', con: 'Del', name: '', ra: 20.33338661, dec: 13.54808288, mag: 5.96, ci: 0.299, },
		    '2192437': { id: '2192437', con: 'Dra', name: '', ra: 20.49099129, dec: 81.09127333, mag: 5.96, ci: 0.942, },
		    '2255339': { id: '2255339', con: 'Cyg', name: '', ra: 20.94299412, dec: 44.92472628, mag: 5.96, ci: 0.02, },
		    '2331820': { id: '2331820', con: 'Cyg', name: '', ra: 21.60069335, dec: 45.37458472, mag: 5.96, ci: 1.341, },
		    '2346713': { id: '2346713', con: 'Cap', name: '', ra: 21.73360158, dec: -14.74937141, mag: 5.96, ci: 0.219, },
		    '2347653': { id: '2347653', con: 'Peg', name: '', ra: 21.74203623, dec: 14.7719391, mag: 5.96, ci: 0.587, },
		    '2372835': { id: '2372835', con: 'Cep', name: '', ra: 21.98153439, dec: 62.69798477, mag: 5.96, ci: 1.64, },
		    '2407626': { id: '2407626', con: 'Aqr', name: '', ra: 22.31687242, dec: -13.30499266, mag: 5.96, ci: 1.075, },
		    '2499120': { id: '2499120', con: 'Aqr', name: '', ra: 23.32336337, dec: -18.07538047, mag: 5.96, ci: 1.534, },
		    '2058542': { id: '2058542', con: 'Sgr', name: '', ra: 19.66865686, dec: -23.42908618, mag: 5.97, ci: 1.038, },
		    '2137596': { id: '2137596', con: 'Aql', name: '', ra: 20.13383998, dec: -0.67818334, mag: 5.97, ci: 1.023, },
		    '2217712': { id: '2217712', con: 'Cyg', name: '', ra: 20.66754458, dec: 43.45888044, mag: 5.97, ci: 1.186, },
		    '2288981': { id: '2288981', con: 'Mic', name: '', ra: 21.2219341, dec: -36.42352845, mag: 5.97, ci: 0.967, },
		    '2299678': { id: '2299678', con: 'Equ', name: '', ra: 21.31445171, dec: 11.203377, mag: 5.97, ci: 1.612, },
		    '2311039': { id: '2311039', con: 'Cep', name: '', ra: 21.41376369, dec: 80.5248308, mag: 5.97, ci: 0.95, },
		    '2324721': { id: '2324721', con: 'PsA', name: '', ra: 21.53738055, dec: -33.94462193, mag: 5.97, ci: 0.051, },
		    '2382806': { id: '2382806', con: 'PsA', name: '', ra: 22.07687975, dec: -26.8223607, mag: 5.97, ci: -0.167, },
		    '2395786': { id: '2395786', con: 'Peg', name: '', ra: 22.20224861, dec: 24.9506449, mag: 5.97, ci: 1.5, },
		    '2434766': { id: '2434766', con: 'Aqr', name: '', ra: 22.59343738, dec: -23.99109454, mag: 5.97, ci: 0.984, },
		    '2476453': { id: '2476453', con: 'Aqr', name: '', ra: 23.04562547, dec: -20.87071321, mag: 5.97, ci: 0.946, },
		    '2483067': { id: '2483067', con: 'Peg', name: '', ra: 23.12464295, dec: 21.13425287, mag: 5.97, ci: 0.259, },
		    '2033380': { id: '2033380', con: 'Pav', name: '', ra: 19.51971303, dec: -68.43391957, mag: 5.98, ci: 1.638, },
		    '2049202': { id: '2049202', con: 'Aql', name: '', ra: 19.61457012, dec: 11.27320168, mag: 5.98, ci: 0.881, },
		    '2061308': { id: '2061308', con: 'Aql', name: '', ra: 19.68486925, dec: 13.8156836, mag: 5.98, ci: -0.078, },
		    '2262485': { id: '2262485', con: 'Equ', name: '', ra: 21.00110536, dec: 7.51621959, mag: 5.98, ci: 0.283, },
		    '2343061': { id: '2343061', con: 'Cyg', name: '', ra: 21.70030098, dec: 35.51020355, mag: 5.98, ci: 2.5, },
		    '2393161': { id: '2393161', con: 'Aqr', name: '', ra: 22.17604065, dec: -4.26685307, mag: 5.98, ci: 0.981, },
		    '2443015': { id: '2443015', con: 'Tuc', name: '', ra: 22.68025524, dec: -57.42232511, mag: 5.98, ci: 1.45, },
		    '2497808': { id: '2497808', con: 'And', name: '', ra: 23.30647877, dec: 41.77367842, mag: 5.98, ci: 0.215, },
		    '2524655': { id: '2524655', con: 'Cep', name: '', ra: 23.65587243, dec: 74.00261412, mag: 5.98, ci: 0.889, },
		    '2063312': { id: '2063312', con: 'Cyg', name: '', ra: 19.6969315, dec: 50.52506086, mag: 5.99, ci: 0.643, },
		    '2124712': { id: '2124712', con: 'Sge', name: '', ra: 20.0545553, dec: 18.50099751, mag: 5.99, ci: 1.42, },
		    '2215500': { id: '2215500', con: 'Del', name: '', ra: 20.65138026, dec: 15.8381991, mag: 5.99, ci: -0.145, },
		    '2222423': { id: '2222423', con: 'Oct', name: '', ra: 20.70082937, dec: -76.18059229, mag: 5.99, ci: 0.45, },
		    '2244160': { id: '2244160', con: 'Aqr', name: '', ra: 20.85715303, dec: -5.62660692, mag: 5.99, ci: 0.464, },
		    '2251459': { id: '2251459', con: 'Cep', name: '', ra: 20.91231706, dec: 75.92557088, mag: 5.99, ci: 0.946, },
		    '2307487': { id: '2307487', con: 'Aqr', name: '', ra: 21.38229308, dec: -9.3193335, mag: 5.99, ci: 1.516, },
		    '2445828': { id: '2445828', con: 'Gru', name: '', ra: 22.71024434, dec: -47.21080377, mag: 5.99, ci: 0.584, },
		    '2459362': { id: '2459362', con: 'PsA', name: '', ra: 22.85581626, dec: -29.53631058, mag: 5.99, ci: 0.907, },
		    '2509816': { id: '2509816', con: 'Peg', name: '', ra: 23.46121841, dec: 25.16728388, mag: 5.99, ci: -0.066, },
		    '2523434': { id: '2523434', con: 'Oct', name: '', ra: 23.63996988, dec: -76.86955769, mag: 5.99, ci: 0.907, },
		    '2525414': { id: '2525414', con: 'Peg', name: '', ra: 23.66528874, dec: 9.67729285, mag: 5.99, ci: 0.212, },
		    '2040267': { id: '2040267', con: 'Cyg', name: '', ra: 19.56155755, dec: 49.26231623, mag: 6, ci: 1.545, },
		    '2081033': { id: '2081033', con: 'Vul', name: '', ra: 19.79681677, dec: 25.38405983, mag: 6, ci: 0.993, },
		    '2084645': { id: '2084645', con: 'Aql', name: '', ra: 19.81727865, dec: -10.87075994, mag: 6, ci: 1.233, },
		    '2296628': { id: '2296628', con: 'Cep', name: '', ra: 21.28729107, dec: 55.7980076, mag: 6, ci: 1.447, },
		    '2350671': { id: '2350671', con: 'Cap', name: '', ra: 21.77118592, dec: -9.27593658, mag: 6, ci: 1.629, },
		    '2375063': { id: '2375063', con: 'Peg', name: '', ra: 22.0022022, dec: 6.71744064, mag: 6, ci: -0.112, },
		    '2422246': { id: '2422246', con: 'Peg', name: '', ra: 22.46284861, dec: 31.84004321, mag: 6, ci: 1.442, },
	    },
	    shortestDayOfYear: 355,
	    longestDayOfYear: 172,
	    theCenterEl: null,
    },
    computed: {
	    thePlanetsExceptMoon: function() {
		    return this.thePlanets.filter(function(planet) { return planet.name != 'Moon'; });
	    },
	    theKeyPlanets: function() {
		    return this.thePlanets.filter(function(planet) { return ['Moon', 'Uranus', 'Neptune', 'Pluto'].indexOf(planet.name) > -1; });
	    },
	    houseRotation: function() {
		    var t = this;
		    var placements = t.placements();
		    if (placements && placements['Rising'] && placements['Rising'].referenceSign) {
			    var firstHouse = t.theZodiac.filter(function(constellation) { return constellation.name == placements['Rising'].referenceSign; })[0];
			    return (firstHouse.order - 1) * 30;
		    }
		    return 0;
	    },
	    tickScaleIsTiny: function() {
		    return this.tickScale < 3;
	    },
	    segmentHeight: function() {
		    return this.tickScaleIsTiny ? 10 : 13;
	    },
	    selectedAspect: function() {
		    var t = this;
		    var selectedPlanets = t.selectedPlanets;
		    if (!selectedPlanets) return;
		    var selectedPlanetNames = Object.keys(selectedPlanets);
		    if (selectedPlanetNames.length == 2) {
			    if (t.aspects[selectedPlanetNames[0]]) {
				    return t.aspects[selectedPlanetNames[0]][selectedPlanetNames[1]];
			    }
		    }
	    },
	    loadTimeDayPercent: function() {
		    return (new Date(this.loadTime).getHours() * 60 + new Date(this.loadTime).getMinutes()) / 1440;
	    },
	    tickCount: function() {
		    return Math.floor(35 / (this.tickScale / 7.2));
	    },
	    aspectsSequence: function() {
		    var t = this;
		    var aspectsSequence = [];
		    for (var i = 0; i < t.tickCount; i++) {
			    aspectsRow = {};
			    t.thePlanets.forEach(function(p1) {
				    if (true 
					    ) {
					    aspectsRow[p1.name] = {};
					    t.thePlanets.forEach(function(p2) {
						    if (p1.order < p2.order
							    ) {
							    aspectsRow[p1.name][p2.name] = t.getAspect(p1, p2, t.loadTime + 20000000 * i);
							    //aspectsRow[p1.name][p2.name] = t.getAspect(p1, p2, t.dateTime + t.stepIncrement * i);
						    }
					    });
				    }
			    });
			    aspectsSequence.push(aspectsRow);
		    }
		    return aspectsSequence;
	    },
	    aspectsInTheAspectsSequence: function() {
		    var t = this;
		    var aspectsInTheAspectsSequence = {};
		    t.aspectsSequence.forEach(function(aspectsSequenceStep) {
			    for (var p1name in aspectsSequenceStep) {
				    for (var p2name in aspectsSequenceStep[p1name]) {
					    if (aspectsSequenceStep[p1name][p2name] != null) {
						    if (!aspectsInTheAspectsSequence[p1name]) {
							    aspectsInTheAspectsSequence[p1name] = {};
						    }
						    aspectsInTheAspectsSequence[p1name][p2name] = true;
					    }
				    }
			    }
		    });
		    return aspectsInTheAspectsSequence;
	    },
	    tripleAspectsInTheAspectsSequence: function() {
		    var t = this;
		    var tripleAspectsInTheAspectsSequence = {};

		    t.aspectsSequence.forEach(function(aspectsSequenceStep, ind) {
			    for (var p1name in aspectsSequenceStep) {
				    for (var p2name in aspectsSequenceStep[p1name]) {
					    if (aspectsSequenceStep[p1name][p2name] != null) {
							    t.thePlanetsExceptMoon.forEach(function(planet) {
								    if (aspectsSequenceStep[p1name][planet.name] && aspectsSequenceStep[p2name][planet.name]) {
									    if (!tripleAspectsInTheAspectsSequence[p1name]) {
										    tripleAspectsInTheAspectsSequence[p1name] = {};
									    }
									    if (!tripleAspectsInTheAspectsSequence[p1name][p2name]) {
										    tripleAspectsInTheAspectsSequence[p1name][p2name] = {};
									    }
									    tripleAspectsInTheAspectsSequence[p1name][p2name][planet.name] = true;
								    }
							    });
						    }
					    }
				    }
			   });
		    return tripleAspectsInTheAspectsSequence;
	    },
	    stackedTripleAspectsInTheAspectsSequence: function() {
		    var t = this;
		    var stackedTripleAspectsInTheAspectsSequence = [[]];

		    // Fill in stackedTripleAspectsInTheAspectsSequence with a null value for each step visible in the current sequence view
		    t.aspectsSequence.forEach(function() { stackedTripleAspectsInTheAspectsSequence[0].push(null); });
		    
		    // Go through the 3-planet combinations that are in aspect anywhere in the current sequence view
		    for (var p1name in t.tripleAspectsInTheAspectsSequence) {
			    for (var p2name in t.tripleAspectsInTheAspectsSequence[p1name]) {
				    for (var p3name in t.tripleAspectsInTheAspectsSequence[p1name][p2name]) {
					    var aspectStart = -1;
					    t.aspectsSequence.forEach(function(step, ind) { if (aspectStart == -1 && step[p1name][p2name] && step[p1name][p3name] && step[p2name][p3name]) { aspectStart = ind; } });
					    var aspectEnd = -1;
					    t.aspectsSequence.forEach(function(step, ind) { if (step[p1name][p2name] && step[p1name][p3name] && step[p2name][p3name]) { aspectEnd = ind; } });

					    // Check if any rows in the sequence have space for this aspect
					    // If not, add a new row
					    var rowWithSpace = -1;
					    stackedTripleAspectsInTheAspectsSequence.forEach(function(row, ind) {
						    var rowHasSpace = true;
						    for (var i = aspectStart; i <= aspectEnd; i++) {
							    if (row[i]) { 
								    rowHasSpace = false; 
							    }
						    }
						    if (rowHasSpace) { 
							    if (rowWithSpace == -1) { rowWithSpace = ind; }
						    } else if (ind == stackedTripleAspectsInTheAspectsSequence.length - 1) {
							    var newRow = [];
							    t.aspectsSequence.forEach(function() { newRow.push(null); });
							    stackedTripleAspectsInTheAspectsSequence.push(newRow);
							    rowWithSpace = stackedTripleAspectsInTheAspectsSequence.length - 1;
						    }
					    });

					    // Fill in the spaces in the row with space
					    for (var i = aspectStart; i <= aspectEnd; i++) {
						    if (t.aspectsSequence[i][p1name][p2name] && t.aspectsSequence[i][p1name][p3name] && t.aspectsSequence[i][p2name][p3name]) {
							    var aspect = {};
							    aspect.p1name = p1name;
							    aspect.p1symbol = t.thePlanets.filter(function(el) { return el.name == p1name; })[0].symbol;
							    aspect.p1color = t.thePlanets.filter(function(el) { return el.name == p1name; })[0].color;
							    aspect.p2name = p2name; 
							    aspect.p2symbol = t.thePlanets.filter(function(el) { return el.name == p2name; })[0].symbol;
							    aspect.p2color = t.thePlanets.filter(function(el) { return el.name == p2name; })[0].color;
							    aspect.p3name = p3name; 
							    aspect.p3symbol = t.thePlanets.filter(function(el) { return el.name == p3name; })[0].symbol;
							    aspect.p3color = t.thePlanets.filter(function(el) { return el.name == p3name; })[0].color;
							    aspect.length = aspectEnd - aspectStart;
							    if (i == aspectStart) { aspect.start = true; } else { aspect.start = false; }
							    if (i == aspectEnd) { aspect.end = true; } else { aspect.end = false; }
							    stackedTripleAspectsInTheAspectsSequence[rowWithSpace][i] = aspect;
						    }
					    }
				    }
			    }
		    }
		    return stackedTripleAspectsInTheAspectsSequence;
	    },
	    stackedAspectsInTheAspectsSequence: function() {
		    var t = this;
		    var stackedAspectsInTheAspectsSequence = [[]];

		    // Fill in stackedAspectsInTheAspectsSequence with a null value for each step visible in the current sequence view
		    t.aspectsSequence.forEach(function() { stackedAspectsInTheAspectsSequence[0].push(null); });
		    
		    // Go through the 2-planet combinations that are in aspect anywhere in the current sequence view
		    for (var p1name in t.aspectsInTheAspectsSequence) {
			    for (var p2name in t.aspectsInTheAspectsSequence[p1name]) {
				    // Sequence aspects aren't really sustainted "objects"...they're just a series of adjacent objects that look like a sustained object when you display them side-by-side
				    // This means that to lay them out on the sequence view we need to find the start & end for each aspect so we can reserve that range of grid squares in the sequence view
				    // NOTE: This means if a pair is in aspect, then leaves aspect, then returns to aspect within the sequence view range, the empty space between those aspects
				    //       will be reserved along with the in-aspect spaces (i.e. not available for use by another aspect)
				    var aspectStart = -1;
				    t.aspectsSequence.forEach(function(step, ind) { if (aspectStart == -1 && step[p1name][p2name]) { aspectStart = ind; } });
				    var aspectEnd = -1;
				    t.aspectsSequence.forEach(function(step, ind) { if (step[p1name][p2name]) { aspectEnd = ind; } });

				    // Check if any rows in the sequence have space for this aspect
				    // If not, add a new row
				    var rowWithSpace = -1;
				    stackedAspectsInTheAspectsSequence.forEach(function(row, ind) {
					    var rowHasSpace = true;
					    for (var i = aspectStart; i <= aspectEnd; i++) {
						    if (row[i]) { 
							    rowHasSpace = false; 
						    }
					    }
					    if (rowHasSpace) { 
						    if (rowWithSpace == -1) { rowWithSpace = ind; }
					    } else if (ind == stackedAspectsInTheAspectsSequence.length - 1) {
						    var newRow = [];
						    t.aspectsSequence.forEach(function() { newRow.push(null); });
						    stackedAspectsInTheAspectsSequence.push(newRow);
						    rowWithSpace = stackedAspectsInTheAspectsSequence.length - 1;
					    }
				    });

				    // Fill in the spaces in the row with space
				    for (var i = aspectStart; i <= aspectEnd; i++) {
					    if (t.aspectsSequence[i][p1name][p2name]) {
						    var aspect = JSON.parse(JSON.stringify(t.aspectsSequence[i][p1name][p2name]));
						    aspect.p1name = p1name;
						    aspect.p1symbol = t.thePlanets.filter(function(el) { return el.name == p1name; })[0].symbol;
						    aspect.p1color = t.thePlanets.filter(function(el) { return el.name == p1name; })[0].color;
						    aspect.p2name = p2name; 
						    aspect.p2symbol = t.thePlanets.filter(function(el) { return el.name == p2name; })[0].symbol;
						    aspect.p2color = t.thePlanets.filter(function(el) { return el.name == p2name; })[0].color;
						    aspect.length = aspectEnd - aspectStart;
						    if (i == aspectStart) { aspect.start = true; } else { aspect.start = false; }
						    if (i == aspectEnd) { aspect.end = true; } else { aspect.end = false; }
						    stackedAspectsInTheAspectsSequence[rowWithSpace][i] = aspect;
					    }
				    }
			    }
		    }
		    return stackedAspectsInTheAspectsSequence;
	    },
	    aspects: function() {
		    var t = this;
		    if (!t.showAspects) { return; }
		    t.dateTime; // We need to reference t.dateTime to get the aspects to show up on load
		    var aspects = {};
		    if (!document.getElementById('Sun-container')) { return {}; }
		    t.thePlanets.forEach(function(p1) {
			    aspects[p1.name] = {};
			    t.thePlanets.forEach(function(p2) {
				    if (p1.name != p2.name) {
					    aspects[p1.name][p2.name] = {};
					    p1angle = t.planetAngle(p1.name, t.dateTime);
					    p2angle = t.planetAngle(p2.name, t.dateTime);

					    angleDiff = Math.abs(p1angle - p2angle);
					    if (angleDiff > 180) { angleDiff = 360 - angleDiff; }

					    aspects[p1.name][p2.name].angle = angleDiff;
					    aspects[p1.name][p2.name].p1angle = p1angle;
					    aspects[p1.name][p2.name].p2angle = p2angle;
					    aspects[p1.name][p2.name].p1order = p1.order;
					    aspects[p1.name][p2.name].p2order = p2.order;
					    var maxOrb = 2;

					    if (Math.abs(angleDiff - 0) < maxOrb) { 
						    aspects[p1.name][p2.name].aspect = 'Conjunct';
						    aspects[p1.name][p2.name].color = '#FC8367';
						    aspects[p1.name][p2.name].symbol = String.fromCodePoint(0x260C);
						    aspects[p1.name][p2.name].orb = Math.round((angleDiff - 0) * 10)/10;
						    aspects[p1.name][p2.name].strength = 1 - Math.abs((angleDiff - 0) / maxOrb);
					    } else if (Math.abs(angleDiff - 180) < maxOrb) { 
						    aspects[p1.name][p2.name].aspect = 'Opposition';
						    aspects[p1.name][p2.name].color = '#CBFFF8';
						    aspects[p1.name][p2.name].symbol = String.fromCodePoint(0x260D);
						    aspects[p1.name][p2.name].orb = Math.round((angleDiff - 180) * 10)/10;
						    aspects[p1.name][p2.name].strength = 1 - Math.abs((angleDiff - 180) / maxOrb);
					    } else if (Math.abs(angleDiff - 120) < maxOrb) { 
						    aspects[p1.name][p2.name].aspect = 'Trine';
						    aspects[p1.name][p2.name].color = '#FDD652';
						    aspects[p1.name][p2.name].symbol = String.fromCodePoint(0x25B3);
						    aspects[p1.name][p2.name].orb = Math.round((angleDiff - 120) * 10)/10;
						    aspects[p1.name][p2.name].strength = 1 - Math.abs((angleDiff - 120) / maxOrb);
					    } else if (Math.abs(angleDiff - 90) < maxOrb) { 
						    aspects[p1.name][p2.name].aspect = 'Square';
						    aspects[p1.name][p2.name].color = '#4281D4';
						    aspects[p1.name][p2.name].symbol = String.fromCodePoint(0x25A1);
						    aspects[p1.name][p2.name].orb = Math.round((angleDiff - 90) * 10)/10;
						    aspects[p1.name][p2.name].strength = 1 - Math.abs((angleDiff - 90) / maxOrb);
					    } else if (Math.abs(angleDiff - 60) < maxOrb) { 
						    aspects[p1.name][p2.name].aspect = 'Sextile';
						    aspects[p1.name][p2.name].color = '#9EF597';
						    aspects[p1.name][p2.name].symbol = String.fromCodePoint(0x26B9);
						    aspects[p1.name][p2.name].orb = Math.round((angleDiff - 60) * 10)/10;
						    aspects[p1.name][p2.name].strength = 1 - Math.abs((angleDiff - 60) / maxOrb);
					    } else {
						    delete aspects[p1.name][p2.name];
					    }
					    if (p1.name == 'Moon' || p2.name == 'Moon') {
						    delete aspects[p1.name][p2.name];
					    }
					    if (aspects[p1.name] && aspects[p1.name][p2.name]) { aspects[p1.name][p2.name].strength *= 4; }
				    }
			    });
		    });
		    for (var key in aspects) {
			    var props = Object.getOwnPropertyNames(aspects[key]);
			    if (props.length == 0) { delete aspects[key]; }
		    }
		    return aspects;
	    },
	    theCenterRotation: function() {
		    return -(180 + this.$root.sunAngle() - (360 * this.$root.dayPercent()));
	    },
	    northSouthNodeRotation: function() {
		    var referenceTime = 1689658882319;
		    var msFromReferenceTime = this.$root.dateTime - referenceTime;
		    // Wikipedia says nodes travel 19.5 degrees per year, but 19.8 matches the sample dates here - https://people.com/north-node-south-node-everything-to-know-8694483
		    var rotationPerMILLI = 19.8 / this.$root.MILLIS_IN_YEAR;
		    return (msFromReferenceTime * rotationPerMILLI) % 360 - 15;
	    },
	    dateShown: function() {
		    return new Date(this.dateTime);
	    },
	    loadDateShown: function() {
		    return new Date(this.loadTime);
	    },
	    dateShownPercentOfDayDone: function() {
		    var hours = this.dateShown.getHours();
		    var minutes = this.dateShown.getMinutes();
		    var hoursAsMinutes = hours * 60;
		    var totalMinutes = minutes + hoursAsMinutes;
		    var MINUTES_IN_A_DAY = 24 * 60;
		    return totalMinutes / MINUTES_IN_A_DAY;
	    },
	    starsInTheLines: function() {
		    starsInTheLines = {};
		    this.theLines.forEach(function(line) {
			    starsInTheLines[line.fromID] = true;
			    starsInTheLines[line.toID] = true;
		    });
		    return starsInTheLines;
	    },
	    theStarsFiltered: function() {
		    var $root = this.$root;
		    var theStarsFiltered = {};
		    for (const id in $root.theStars) {
			    var star = $root.theStars[id];
			    if (
				    (['Arcturus', 'Fomalhaut', 'Betelgeuse', 'Altair', 'Algol'].indexOf(star.name) > -1)
				    || ($root.starsInTheLines[star.id] || $root.starsInTheLines[star.name])
				    || ($root.isZodiac(star) && star.dec > -45 && star.dec <= 40 && star.mag <= 4.0)
			       ) {
				    theStarsFiltered[id] = $root.theStars[id];
			       }
		    }
		    return theStarsFiltered;
	    },
	    theStarsNameLookup: function() {
		    var $root = this.$root;
		    var theStarsNameLookup = {};
		    for (const id in $root.theStarsFiltered) {
			    var star = $root.theStarsFiltered[id];
			    if (star.name) {
				    theStarsNameLookup[star.name] = star.id;
			    }
			    theStarsNameLookup[star.id] = star.id;
		    }
		    return theStarsNameLookup;
	    },
	    moonAngle: function() {
		    return this.$root.planetAngle('Moon', this.dateTime);
	    },
    },
    methods: {
	    incrementRotateX() {
		    if (this.rotateX >= 355) {
			    this.rotateX = 0;
		    } else {
			    if (this.rotateX >= 85 && this.rotateX < 95) {
				    this.rotateX += 1;
			    } else {
				    this.rotateX += 5;
			    }
		    }
	    },
	    decrementRotateX() {
		    if (this.rotateX <= 0) {
			    this.rotateX = 355;
		    } else {
			    if (this.rotateX > 85 && this.rotateX <= 95) {
				    this.rotateX -= 1;
			    } else {
				    this.rotateX -= 5;
			    }
		    }
	    },
	    incrementAdditionalRotation() {
		    if (this.additionalRotation >= 355) {
			    this.additionalRotation = 0;
		    } else {
			    this.additionalRotation += 5;
		    }
	    },
	    decrementAdditionalRotation() {
		    if (this.additionalRotation <= 0) {
			    this.additionalRotation = 355;
		    } else {
			    this.additionalRotation -= 5;
		    }
	    },
	    dateDSTAdjusted: function(date) {
		    if (!date) { date = this.dateShown; }
		    if (!this.isDST(date)) { return new Date(date.getTime()); }
		    return new Date(date.getTime() - (60 * 60 * 1000));
	    },
	    isDST: function(date) {
		    if (!date) { date = this.dateShown; }
		    var month = date.getMonth() + 1;
		    if (month >= 4 && month <= 10) { return true };
		    if (month == 12 || month == 1 || month == 2) { return false };

		    // Starts 2nd Sunday of March
		    if (month == 3) {
			    if (date.getDate() > 14) { return true; }
			    if (date.getDate() <= 7) { return false; }
			    var dateOfPreviousSunday = (date.getDate() - date.getDay())
			    if (dateOfPreviousSunday <= 7) { return false; }
			    return true;
		    }
		    // Ends 1st Sunday of November
		    if (month == 11) {
			    if (date.getDate() > 7) { return false; }
			    var dateOfPreviousSunday = (date.getDate() - date.getDay())
			    if (dateOfPreviousSunday <= 0) { return true; }
			    return false;
		    }
	    },
	    sunAngle: function(dateTime) {
		    if (!dateTime) { dateTime = this.dateTime; }
		    return this.$root.planetAngle('Sun', dateTime);
	    },
	    thePlanet: function(planetName) {
		    for (var i = 0; i < this.thePlanets.length; i++) {
			    if (this.thePlanets[i].name == planetName) { return this.thePlanets[i]; }
		    }
	    },
	    getAspect: function(p1, p2, dateTime) {
		    if (p1.name == 'Moon' || p2.name == 'Moon') { return null; }
		    var p1angle = this.planetAngle(p1.name, dateTime);
		    var p2angle = this.planetAngle(p2.name, dateTime);

		    var angleDiff = Math.abs(p1angle - p2angle);
		    if (angleDiff > 180) { angleDiff = 360 - angleDiff; }

		    var maxOrb = 2;

		    if (Math.abs(angleDiff - 0) < maxOrb) { 
			    return {
				    color: '#EC7357',
				    symbol: String.fromCodePoint(0x260C),
			    };
		    } else if (Math.abs(angleDiff - 180) < maxOrb) { 
			    return {
				    color: '#A6FAEF',
				    symbol: String.fromCodePoint(0x260D),
			    };
		    } else if (Math.abs(angleDiff - 120) < maxOrb) { 
			    return {
				    color: '#FDD652',
				    symbol: String.fromCodePoint(0x25B3),
			    };
		    } else if (Math.abs(angleDiff - 90) < maxOrb) { 
			    return {
				    color: '#4281A4',
				    symbol: String.fromCodePoint(0x25A1),
			    };
		    } else if (Math.abs(angleDiff - 60) < maxOrb) { 
			    return {
				    color: '#AEE5A7',
				    symbol: String.fromCodePoint(0x26B9),
			    };
		    }

		    return null;
	    },
	    togglePlanetSelection: function(planetName, ignoreAspects) {
		    var t = this;
		    if (this.sequenceView) { return; }
		    
		    if (this.selectedPlanets == null) { Vue.set(this, 'selectedPlanets', {}); }

		    if (this.selectedPlanets[planetName]) {
			    Vue.delete(this.selectedPlanets, planetName);
		    } else {
			    if (t.showAspects && !ignoreAspects && Object.keys(this.selectedPlanets).length == 0) {
				    for (var aspectedPlanet in t.aspects[planetName]) {
					    Vue.set(this.selectedPlanets, aspectedPlanet, true);
				    }
			    }
			    Vue.set(this.selectedPlanets, planetName, true);
		    }

		    if (Object.keys(this.selectedPlanets).length == 0) {
			    Vue.set(this, 'selectedPlanets', null);
		    }
	    },
	    selectAspect: function(p1name, p2name, p3name) {
		    if (this.selectedPlanets && (
			    (Object.keys(this.selectedPlanets).length == 2 && this.selectedPlanets[p1name] && this.selectedPlanets[p2name])
			    || (Object.keys(this.selectedPlanets).length == 3 && this.selectedPlanets[p1name] && this.selectedPlanets[p2name] && this.selectedPlanets[p3name])
		    )) {
			    Vue.set(this, 'selectedPlanets', null);
		    } else {
			    Vue.set(this, 'selectedPlanets', null);
			    this.togglePlanetSelection(p1name, true);
			    this.togglePlanetSelection(p2name, true);
			    if (p3name) { this.togglePlanetSelection(p3name, true); }
		    }
	    },
	    midnightOverage: function(dateTime) {
		    var dateWithOverage = new Date(dateTime);
		    var $root = this.$root;
		    var hours = dateWithOverage.getHours();
		    var minutes = dateWithOverage.getMinutes();
		    var seconds = dateWithOverage.getSeconds();
		    var milliseconds = dateWithOverage.getMilliseconds();

		    var overage = hours * this.HOUR + minutes * this.MINUTE + seconds * this.SECOND + milliseconds;
		    return overage;
	    },
	    humanReadableDateTime: function(dateTime, dateOnly, noYear) {
		    var dateToShow = new Date(dateTime);
		    var $root = this.$root;
		    var hours = dateToShow.getHours() == 0 ? 12 : (dateToShow.getHours() > 12 ? dateToShow.getHours() - 12 : dateToShow.getHours());
		    var minutes = (dateToShow.getMinutes() < 10 ? '0' : '') + dateToShow.getMinutes();
		    var ampm = dateToShow.getHours() >= 12 ? 'PM' : 'AM';
		    var month = (dateToShow.getMonth() < 9 && !noYear ? '0' : '') + (dateToShow.getMonth() + 1);
		    var date = (dateToShow.getDate() < 10 ? '0' : '') + dateToShow.getDate();
		    var year = dateToShow.getFullYear();

		    var timePortion = hours + ':' + minutes + ampm;
		    var datePortion = month + '/' + date;
		    if (!noYear) { datePortion += ('/' + year); }
		    if (dateOnly) { return datePortion; }
		    return timePortion + ' ' + datePortion;
	    },
	    tickScaleUp: function() {
		    if (this.tickScale > 100) { return; }
		    else if (this.tickScale < 1) { this.tickScale += .5; }
		    else { this.tickScale++; }
	    },
	    tickScaleDown: function() {
		    if (this.tickScale < 1) { return; }
		    else if (this.tickScale < 2) { this.tickScale -= .5; }
		    else { this.tickScale--; }
	    },
	    stepIncrementDown: function() {
		    var i = this.stepIncrements.indexOf(this.stepIncrement / this.factor);
		    if (i == 0) { return; }
		    this.stepIncrement = this.stepIncrements[i - 1] * this.factor;
	    },
	    stepIncrementUp: function() {
		    var i = this.stepIncrements.indexOf(this.stepIncrement / this.factor);
		    if (i == this.stepIncrements.length - 1) { return; }
		    this.stepIncrement = this.stepIncrements[i + 1] * this.factor;
	    },
	    saveDateTime: function() {
		    Vue.set(this.savedDateTimes, this.dateTime, { 
			    time: this.dateTime, 
			    name: this.humanReadableDateTime(this.dateTime),
		    });
	    },
	    angleFromMoonToSun: function() {
		    var moonEl = document.getElementById('Moon-disc');
		    var sunEl = document.getElementById('Sun-disc');
		    if (moonEl && sunEl) {
			    return this.angleFromToEls(moonEl.getBoundingClientRect(), sunEl.getBoundingClientRect(), true);
		    } else {
			    return 0;
		    }
	    },
	    placements: function(dateTime) {
		    var t = this;
		    if (!dateTime) { dateTime = t.dateTime; }
		    var placements = {};
		    t.thePlanets.forEach(function(planet) {
			    var angle = t.planetAngle(planet.name, dateTime);
			    placements[planet.name] = {};
			    placements[planet.name].angle = angle;
			    placements[planet.name].sign = t.angleToSign(angle);
			    if (t.referenceMoment) {
				    var referenceAngle = t.planetAngle(planet.name, t.referenceMoment);
				    placements[planet.name].referenceAngle = referenceAngle;
				    placements[planet.name].referenceSign = t.angleToSign(referenceAngle);
			    }
		    });
		    var risingAngle = this.sunAngle(dateTime) - (360 * this.dayPercent()) - this.shaderSeasonRotation() + 90;
		    placements['Rising'] = {
			    angle: risingAngle,
			    sign: t.angleToSign(risingAngle),
		    }

		    if (t.referenceMoment) {
			    var referenceRisingAngle = this.sunAngle(t.referenceMoment) - (360 * this.dayPercent(new Date(t.referenceMoment))) - this.shaderSeasonRotation(new Date(t.referenceMoment)) + 90;
			    placements['Rising'].referenceAngle = referenceRisingAngle;
			    placements['Rising'].referenceSign = t.angleToSign(referenceRisingAngle);
		    }
		    return placements;
	    },
	    angleToSign(angle) {
		    return this.theZodiac[Math.floor(((360 + (-angle + 24.2 + 14.9)) % 360) / 30)].name;
	    },
	    dayOfYear(date) {
		    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
	    },
	    dayLengthCoefficient(date) {
		    return Math.sin((this.dayOfYear(date) - 172 + 91.25) / (365 / (2 * Math.PI)));
	    },
	    shaderSeasonRotation(date) {
		    if (!date) { date = this.dateShown; }
		    var delta = 0
		    var maxRotationDegs = 20 - delta;
		    return this.dayLengthCoefficient(date) * maxRotationDegs - delta;
	    },
	    isZodiac: function(star) {
		    return [
			   'Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib', 'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc', 
		    //'RA', 
		    //'EQU', 
		    //'ECL', 
		    ].indexOf(star.con) > -1;
	    },
	    dayPercent: function(date) {
		    if (!date) { date = this.dateShown; }
		    return (this.dateDSTAdjusted(date).getHours() * 60 + this.dateDSTAdjusted(date).getMinutes()) / 1440;
	    },
	    planetAngle: function(planetName, dateTime) {
		    if (!dateTime) { dateTime = this.dateTime; }
		    if (['NN', 'SN'].indexOf(planetName) > -1) { return 0; }
		    var $root = this.$root;
		    var rads;
		    var degs;
		    /*if (['Ceres', 'Eros', 'Pallas', 'Vesta', 'Chiron', 'Lilith', 'Juno'].indexOf(planetName) > -1) {
			    rads = 2.8 + this.calculateCelestialPosition(this.dateShown, planetName);
			    degs = 50 + (rads * 180 / Math.PI);
			    if (planetName == 'Chiron') { degs += 180; }
			    if (planetName == 'Eros') { degs += 200; }
			    if (planetName == 'Juno') { degs -= 81; }
			    if (planetName == 'Vesta') { degs -= 70; }
			    return -degs;
		    }*/
		    var planetX = Astronomy.GeoVector(planetName, new Date(dateTime), false).x;
		    var planetY = Astronomy.GeoVector(planetName, new Date(dateTime), false).y;
		    var firstAngle = Math.atan2(100, 0);
		    var secondAngle = Math.atan2(planetY, planetX);
		    rads = secondAngle - firstAngle;
		    degs = 50 + (rads * 180 / Math.PI);
		    degs = -degs;
		    if (degs < 0) { degs += 360; }
		    return degs;
	    },
	    angleSign: function(angle) {
		    var t = this;
		    angle = t.normalizeAngle(-angle + 15);
		    var theZodiac = t.theZodiac;
		    var angleDodecan = ~~(angle / 30);
		    return theZodiac[angleDodecan];
	    },
	    calculateCelestialPosition: function(date, bodyName) {
		    var $root = this.$root;
		    const orbitalElements = {
			    Ceres: {
				    semiMajorAxis: 2.7677,
				    eccentricity: 0.0758,
				    inclination: 10.594,
				    longitudeOfAscendingNode: 80.393,
				    argumentOfPerihelion: 73.597,
				    meanAnomalyAtEpoch: 95.989,
				    epochJD: 2451545.0,
				    meanDailyMotion: 0.214094,
			    },
			    Chiron: {
				    semiMajorAxis: 13.67,
				    eccentricity: 0.382,
				    inclination: 6.94,
				    longitudeOfAscendingNode: 209.37,
				    argumentOfPerihelion: 339.29,
				    meanAnomalyAtEpoch: 2.99,
				    epochJD: 2451545.0,
				    meanDailyMotion: 0.0476,
			    },
			    Juno: {
				    semiMajorAxis: 2.668,
				    eccentricity: 0.2579,
				    inclination: 12.991,
				    longitudeOfAscendingNode: 169.851,
				    argumentOfPerihelion: 247.959,
				    meanAnomalyAtEpoch: 219.888,
				    epochJD: 2451545.0,
				    meanDailyMotion: 0.21315,
			    },
			    Vesta: {
				    semiMajorAxis: 2.362,
				    eccentricity: 0.0885,
				    inclination: 7.133,
				    longitudeOfAscendingNode: 103.962,
				    argumentOfPerihelion: 150.064,
				    meanAnomalyAtEpoch: 149.847,
				    epochJD: 2451545.0,
				    meanDailyMotion: 0.27206,
			    },
			    Pallas: {
				    semiMajorAxis: 2.773,
				    eccentricity: 0.2312,
				    inclination: 34.837,
				    longitudeOfAscendingNode: 173.096,
				    argumentOfPerihelion: 309.824,
				    meanAnomalyAtEpoch: 77.373,
				    epochJD: 2451545.0,
				    meanDailyMotion: 0.21317,
			    },
			    Eros: {
				    semiMajorAxis: 1.458,
				    eccentricity: 0.2227,
				    inclination: 10.829,
				    longitudeOfAscendingNode: 304.435,
				    argumentOfPerihelion: 178.813,
				    meanAnomalyAtEpoch: 12.585,
				    epochJD: 2451545.0,
				    meanDailyMotion: 0.5597,
			    }
		    };
		    // Special case for Lilith (Mean Lunar Apogee)
		    if (bodyName === 'Lilith') {
			    return $root.calculateLilithPosition(date);
		    }

		    const elements = orbitalElements[bodyName];

		    if (!elements) {
			    throw new Error(`Unknown celestial body: ${bodyName}`);
		    }

		    // Convert date to Julian Date
		    const jd = $root.dateToJulianDate(date);

		    // Calculate days since epoch
		    const daysSinceEpoch = jd - elements.epochJD;

		    // Calculate mean anomaly at the given date
		    let meanAnomaly = elements.meanAnomalyAtEpoch + 
			    (elements.meanDailyMotion * daysSinceEpoch);

		    // Normalize to 0-360 degrees
		    meanAnomaly = $root.normalizeAngle(meanAnomaly);

		    // Convert to radians for calculations
		    const e = elements.eccentricity;
		    const M = meanAnomaly * Math.PI / 180;

		    // Solve Kepler's equation for eccentric anomaly
		    // Using iterative method with tolerance check
		    let E = M;
		    const tolerance = 1e-8;
		    let delta = 1;
		    let iterations = 0;
		    const maxIterations = 30;

		    while (Math.abs(delta) > tolerance && iterations < maxIterations) {
			    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
			    E -= delta;
			    iterations++;
		    }

		    // Calculate true anomaly
		    const v = 2 * Math.atan(Math.sqrt((1 + e)/(1 - e)) * Math.tan(E/2));

		    // Calculate heliocentric distance
		    const a = elements.semiMajorAxis;
		    const r = a * (1 - e * Math.cos(E));

		    // Convert orbital elements to radians
		    const inc = elements.inclination * Math.PI / 180;
		    const omega = elements.argumentOfPerihelion * Math.PI / 180;
		    const Omega = elements.longitudeOfAscendingNode * Math.PI / 180;

		    // Calculate heliocentric coordinates
		    const x = r * (Math.cos(Omega) * Math.cos(v + omega) - 
				    Math.sin(Omega) * Math.sin(v + omega) * Math.cos(inc));
		    const y = r * (Math.sin(Omega) * Math.cos(v + omega) + 
				    Math.cos(Omega) * Math.sin(v + omega) * Math.cos(inc));
		    const z = r * Math.sin(v + omega) * Math.sin(inc);

		    // Get Sun's position relative to Earth at the given date
		    const sunPos = $root.calculateSunPosition(date);

		    // Calculate geocentric position by adding Sun's position
		    const geoX = x - sunPos.x;
		    const geoY = y - sunPos.y;

		    // Calculate the angle in radians
		    const angle = Math.atan2(geoY, geoX);

		    return angle;
	    },
	    calculateLilithPosition: function(date) {
		    var $root = this.$root;
		    const jd = $root.dateToJulianDate(date);
		    const T = (jd - 2451545.0) / 36525; // Julian centuries since J2000.0

		    // Mean elements for Lilith
		    let meanLongitude = 280.93435 + 
			    36519.93632 * T + 
			    0.11576 * T * T -
			    0.00003 * T * T * T;

		    // Normalize to 0-360 degrees
		    meanLongitude = $root.normalizeAngle(meanLongitude);

		    // Convert to radians
		    return meanLongitude * Math.PI / 180;
	    },
	    dateToJulianDate: function(date) {
		    var $root = this.$root;
		    const year = date.getFullYear();
		    const month = date.getMonth() + 1;
		    const day = date.getDate();
		    const hour = date.getHours();
		    const minute = date.getMinutes();
		    const second = date.getSeconds();

		    let y = year;
		    let m = month;
		    if (month <= 2) {
			    y -= 1;
			    m += 12;
		    }

		    const a = Math.floor(y / 100);
		    const b = 2 - a + Math.floor(a / 4);

		    const jd = Math.floor(365.25 * (y + 4716)) +
			    Math.floor(30.6001 * (m + 1)) +
			    day + b - 1524.5 +
			    hour / 24.0 + minute / 1440.0 + second / 86400.0;

		    return jd;
	    },
	    normalizeAngle: function(angle) {
		    angle = angle % 360;
		    return angle < 0 ? angle + 360 : angle;
	    },
	    calculateSunPosition: function(date) {
		    var $root = this.$root;
		    const jd = $root.dateToJulianDate(date);
		    const T = (jd - 2451545.0) / 36525; // Julian centuries since J2000.0

		    // Mean elements
		    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T; // Mean longitude
		    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;  // Mean anomaly

		    // Equation of center
		    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180) +
			    (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
			    0.000289 * Math.sin(3 * M * Math.PI / 180);

		    // Sun's true longitude
		    const L = L0 + C;

		    // Convert to radians
		    const Lrad = L * Math.PI / 180;

		    // Distance in AU (simplified)
		    const R = 1.00014 - 0.01671 * Math.cos(M * Math.PI / 180) - 
			    0.00014 * Math.cos(2 * M * Math.PI / 180);

		    return {
			    x: R * Math.cos(Lrad),
				    y: R * Math.sin(Lrad)
		    };
	    },
	    fadeOutAndIn: function(callback) {
		    var $root = this.$root;
		    $root.faderID = setInterval(function() { 
			    $root.faderOpacity += 0.01; 
			    if ($root.faderOpacity >= 1) {
				    clearInterval($root.faderID);
				    $root.faderID = -1;
				    callback();
				    $root.faderID = setInterval(function() { 
					    $root.faderOpacity -= 0.01; 
					    if ($root.faderOpacity <= 0) {
						    clearInterval($root.faderID);
						    $root.faderID = -1;
						    $root.runClock();
					    }
				    }, 10);
			    }
		    }, 10);
	    },
	    stepTime: function() {
		    var $root = this.$root;
		    $root.dateTime += $root.stepIncrement;
		    if ($root.referenceMoment && $root.dateTime > $root.referenceMoment) { 
			    $root.stopClock();
			    $root.fadeOutAndIn(function() { $root.dateTime = $root.loadTime; });
		    }
		    if (document.getElementById('tick-cursor') && ~~document.getElementById('tick-cursor').style.left.replace('px','') > 480) {
			    $root.loadTime = $root.dateTime;
		    }
	    },
	    stepTimeBack: function() {
		    this.$root.dateTime -= this.$root.stepIncrement;
	    },
	    runClock : function(){          
		    var $root = this.$root;
		    $root.clockID = setInterval(function(){ $root.stepTime(); }, 100);
	    },
	    stopClock: function() {
		    clearInterval(this.$root.clockID);
		    this.$root.clockID = -1;
	    },
	    distanceFromToEls: function(fromEl, toEl) {
		    if (!fromEl || !toEl) { return 10; }
		    return this.distanceFromTo(fromEl.top, fromEl.left, toEl.top, toEl.left);
	    },
	    distanceFromTo: function(originTop, originLeft, targetTop, targetLeft) {
		    var a = originTop - targetTop;
		    var b = originLeft - targetLeft;
		    return Math.sqrt((a * a) + (b * b));
	    },
	    angleFromToEls: function(fromEl, toEl, fromCenter) {
			if (fromCenter) {
				return this.angleFromTo(
					fromEl.top + (fromEl.height / 2), 
					fromEl.left + (fromEl.width / 2), 
					toEl.top + (toEl.height / 2), 
					toEl.left + (toEl.width / 2)
				);
			} else {
				return this.angleFromTo(fromEl.top, fromEl.left, toEl.top, toEl.left);
			}
	    },
	    angleFromTo: function(originTop, originLeft, targetTop, targetLeft) {
		    return (-90 + (Math.atan2(targetTop - originTop, targetLeft - originLeft) * 180 / Math.PI));
	    },
    },
    mounted: function() {
	    var $root = this.$root;
	    //this.runClock();
	    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
	    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
	    window.scroll({ top: .5 * vh, left: .5 * vw, });
	    setTimeout(function() { 
		    if (typeof $root.localStorage.getItem('savedDateTimes') == 'undefined' || $root.localStorage.getItem('savedDateTimes') == null) {
			    $root.localStorage.setItem('savedDateTimes', JSON.stringify({}));
		    }
		    Vue.set($root, 'savedDateTimes', JSON.parse($root.localStorage.getItem('savedDateTimes')));

		    $root.theCenterEl = document.getElementById('the-center').getBoundingClientRect();
		    $root.dateTime++;
		    //Vue.set($root, 'dateTime', $root.dateTime + 6.7*$root.MONTHISH);
		    //Vue.set($root, 'showLines', true);
	    }, 100);
    },
    watch: {
	    savedDateTimes: function(newSavedDateTimes) {
		    this.localStorage.setItem('savedDateTimes', JSON.stringify(newSavedDateTimes));
	    }
    },
});
