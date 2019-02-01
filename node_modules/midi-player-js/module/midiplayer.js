(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MidiPlayer = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

/**
 * Constants used in player.
 */
var Constants = {
	VERSION: '2.0.5',
	NOTES: [],
	CIRCLE_OF_FOURTHS: ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb', 'Bbb', 'Ebb', 'Abb'],
	CIRCLE_OF_FIFTHS: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'E#']
};

// Builds notes object for reference against binary values.
var allNotes = [['C'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E'], ['F'], ['F#', 'Gb'], ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B']];
var counter = 0;

// All available octaves.

var _loop = function _loop(i) {
	allNotes.forEach(function (noteGroup) {
		noteGroup.forEach(function (note) {
			return Constants.NOTES[counter] = note + i;
		});
		counter++;
	});
};

for (var i = -1; i <= 9; i++) {
	_loop(i);
}

exports.Constants = Constants;

},{}],2:[function(require,module,exports){
"use strict";

var Player = require("./player");
var Utils = require("./utils");
var Constants = require("./constants");

module.exports = {
    Player: Player.Player,
    Utils: Utils.Utils,
    Constants: Constants.Constants
};

},{"./constants":1,"./player":3,"./utils":5}],3:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Utils = require("./utils").Utils;
var Track = require("./track").Track;

// Polyfill Uint8Array.forEach: Doesn't exist on Safari <10
if (!Uint8Array.prototype.forEach) {
	Object.defineProperty(Uint8Array.prototype, 'forEach', {
		value: Array.prototype.forEach
	});
}

/**
 * Main player class.  Contains methods to load files, start, stop.
 * @param {function} - Callback to fire for each MIDI event.  Can also be added with on('midiEvent', fn)
 * @param {array} - Array buffer of MIDI file (optional).
 */

var Player = function () {
	function Player(eventHandler, buffer) {
		_classCallCheck(this, Player);

		this.sampleRate = 5; // milliseconds
		this.startTime = 0;
		this.buffer = buffer || null;
		this.division;
		this.format;
		this.setIntervalId = false;
		this.tracks = [];
		this.instruments = [];
		this.defaultTempo = 120;
		this.tempo = null;
		this.startTick = 0;
		this.tick = 0;
		this.lastTick = null;
		this.inLoop = false;
		this.totalTicks = 0;
		this.events = [];
		this.totalEvents = 0;
		this.eventListeners = {};

		if (typeof eventHandler === 'function') this.on('midiEvent', eventHandler);
	}

	/**
  * Load a file into the player (Node.js only).
  * @param {string} path - Path of file.
  * @return {Player}
  */


	_createClass(Player, [{
		key: "loadFile",
		value: function loadFile(path) {
			var fs = require('fs');
			this.buffer = fs.readFileSync(path);
			return this.fileLoaded();
		}

		/**
   * Load an array buffer into the player.
   * @param {array} arrayBuffer - Array buffer of file to be loaded.
   * @return {Player}
   */

	}, {
		key: "loadArrayBuffer",
		value: function loadArrayBuffer(arrayBuffer) {
			this.buffer = new Uint8Array(arrayBuffer);
			return this.fileLoaded();
		}

		/**
   * Load a data URI into the player.
   * @param {string} dataUri - Data URI to be loaded.
   * @return {Player}
   */

	}, {
		key: "loadDataUri",
		value: function loadDataUri(dataUri) {
			// convert base64 to raw binary data held in a string.
			// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
			var byteString = Utils.atob(dataUri.split(',')[1]);

			// write the bytes of the string to an ArrayBuffer
			var ia = new Uint8Array(byteString.length);
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}

			this.buffer = ia;
			return this.fileLoaded();
		}

		/**
   * Get filesize of loaded file in number of bytes.
   * @return {number} - The filesize.
   */

	}, {
		key: "getFilesize",
		value: function getFilesize() {
			return this.buffer ? this.buffer.length : 0;
		}

		/**
   * Sets default tempo, parses file for necessary information, and does a dry run to calculate total length.
   * Populates this.events & this.totalTicks.
   * @return {Player}
   */

	}, {
		key: "fileLoaded",
		value: function fileLoaded() {
			if (!this.validate()) throw 'Invalid MIDI file; should start with MThd';
			return this.setTempo(this.defaultTempo).getDivision().getFormat().getTracks().dryRun();
		}

		/**
   * Validates file using simple means - first four bytes should == MThd.
   * @return {boolean}
   */

	}, {
		key: "validate",
		value: function validate() {
			return Utils.bytesToLetters(this.buffer.subarray(0, 4)) === 'MThd';
		}

		/**
   * Gets MIDI file format for loaded file.
   * @return {Player}
   */

	}, {
		key: "getFormat",
		value: function getFormat() {
			/*
   MIDI files come in 3 variations:
   Format 0 which contain a single track
   Format 1 which contain one or more simultaneous tracks
   (ie all tracks are to be played simultaneously).
   Format 2 which contain one or more independant tracks
   (ie each track is to be played independantly of the others).
   return Utils.bytesToNumber(this.buffer.subarray(8, 10));
   */

			this.format = Utils.bytesToNumber(this.buffer.subarray(8, 10));
			return this;
		}

		/**
   * Parses out tracks, places them in this.tracks and initializes this.pointers
   * @return {Player}
   */

	}, {
		key: "getTracks",
		value: function getTracks() {
			this.tracks = [];
			var trackOffset = 0;
			while (trackOffset < this.buffer.length) {
				if (Utils.bytesToLetters(this.buffer.subarray(trackOffset, trackOffset + 4)) == 'MTrk') {
					var trackLength = Utils.bytesToNumber(this.buffer.subarray(trackOffset + 4, trackOffset + 8));
					this.tracks.push(new Track(this.tracks.length, this.buffer.subarray(trackOffset + 8, trackOffset + 8 + trackLength)));
				}

				trackOffset += Utils.bytesToNumber(this.buffer.subarray(trackOffset + 4, trackOffset + 8)) + 8;
			}
			return this;
		}

		/**
   * Enables a track for playing.
   * @param {number} trackNumber - Track number
   * @return {Player}
   */

	}, {
		key: "enableTrack",
		value: function enableTrack(trackNumber) {
			this.tracks[trackNumber - 1].enable();
			return this;
		}

		/**
   * Disables a track for playing.
   * @param {number} - Track number
   * @return {Player}
   */

	}, {
		key: "disableTrack",
		value: function disableTrack(trackNumber) {
			this.tracks[trackNumber - 1].disable();
			return this;
		}

		/**
   * Gets quarter note division of loaded MIDI file.
   * @return {Player}
   */

	}, {
		key: "getDivision",
		value: function getDivision() {
			this.division = Utils.bytesToNumber(this.buffer.subarray(12, 14));
			return this;
		}

		/**
   * The main play loop.
   * @param {boolean} - Indicates whether or not this is being called simply for parsing purposes.  Disregards timing if so.
   * @return {undefined}
   */

	}, {
		key: "playLoop",
		value: function playLoop(dryRun) {
			if (!this.inLoop) {
				this.inLoop = true;
				this.tick = this.getCurrentTick();

				this.tracks.forEach(function (track) {
					// Handle next event
					if (!dryRun && this.endOfFile()) {
						//console.log('end of file')
						this.triggerPlayerEvent('endOfFile');
						this.stop();
					} else {
						var event = track.handleEvent(this.tick, dryRun);

						if (dryRun && event) {
							if (event.hasOwnProperty('name') && event.name === 'Set Tempo') {
								// Grab tempo if available.
								this.defaultTempo = event.data;
								this.setTempo(event.data);
							}
							if (event.hasOwnProperty('name') && event.name === 'Program Change') {
								if (!this.instruments.includes(event.value)) {
									this.instruments.push(event.value);
								}
							}
						} else if (event) this.emitEvent(event);
					}
				}, this);

				if (!dryRun) this.triggerPlayerEvent('playing', { tick: this.tick });
				this.inLoop = false;
			}
		}

		/**
   * Setter for tempo.
   * @param {number} - Tempo in bpm (defaults to 120)
   */

	}, {
		key: "setTempo",
		value: function setTempo(tempo) {
			this.tempo = tempo;
			return this;
		}

		/**
   * Setter for startTime.
   * @param {number} - UTC timestamp
   */

	}, {
		key: "setStartTime",
		value: function setStartTime(startTime) {
			this.startTime = startTime;
		}

		/**
   * Start playing loaded MIDI file if not already playing.
   * @return {Player}
   */

	}, {
		key: "play",
		value: function play() {
			if (this.isPlaying()) throw 'Already playing...';

			// Initialize
			if (!this.startTime) this.startTime = new Date().getTime();

			// Start play loop
			//window.requestAnimationFrame(this.playLoop.bind(this));
			this.setIntervalId = setInterval(this.playLoop.bind(this), this.sampleRate);

			return this;
		}

		/**
   * Pauses playback if playing.
   * @return {Player}
   */

	}, {
		key: "pause",
		value: function pause() {
			clearInterval(this.setIntervalId);
			this.setIntervalId = false;
			this.startTick = this.tick;
			this.startTime = 0;
			return this;
		}

		/**
   * Stops playback if playing.
   * @return {Player}
   */

	}, {
		key: "stop",
		value: function stop() {
			clearInterval(this.setIntervalId);
			this.setIntervalId = false;
			this.startTick = 0;
			this.startTime = 0;
			this.resetTracks();
			return this;
		}

		/**
   * Skips player pointer to specified tick.
   * @param {number} - Tick to skip to.
   * @return {Player}
   */

	}, {
		key: "skipToTick",
		value: function skipToTick(tick) {
			this.stop();
			this.startTick = tick;

			// Need to set track event indexes to the nearest possible event to the specified tick.
			this.tracks.forEach(function (track) {
				track.setEventIndexByTick(tick);
			});
			return this;
		}

		/**
   * Skips player pointer to specified percentage.
   * @param {number} - Percent value in integer format.
   * @return {Player}
   */

	}, {
		key: "skipToPercent",
		value: function skipToPercent(percent) {
			if (percent < 0 || percent > 100) throw "Percent must be number between 1 and 100.";
			this.skipToTick(Math.round(percent / 100 * this.totalTicks));
			return this;
		}

		/**
   * Skips player pointer to specified seconds.
   * @param {number} - Seconds to skip to.
   * @return {Player}
   */

	}, {
		key: "skipToSeconds",
		value: function skipToSeconds(seconds) {
			var songTime = this.getSongTime();
			if (seconds < 0 || seconds > songTime) throw seconds + " seconds not within song time of " + songTime;
			this.skipToPercent(seconds / songTime * 100);
			return this;
		}

		/**
   * Checks if player is playing
   * @return {boolean}
   */

	}, {
		key: "isPlaying",
		value: function isPlaying() {
			return this.setIntervalId > 0 || _typeof(this.setIntervalId) === 'object';
		}

		/**
   * Plays the loaded MIDI file without regard for timing and saves events in this.events.  Essentially used as a parser.
   * @return {Player}
   */

	}, {
		key: "dryRun",
		value: function dryRun() {
			// Reset tracks first
			this.resetTracks();
			while (!this.endOfFile()) {
				this.playLoop(true);
			}this.events = this.getEvents();
			this.totalEvents = this.getTotalEvents();
			this.totalTicks = this.getTotalTicks();
			this.startTick = 0;
			this.startTime = 0;

			// Leave tracks in pristine condish
			this.resetTracks();

			//console.log('Song time: ' + this.getSongTime() + ' seconds / ' + this.totalTicks + ' ticks.');

			this.triggerPlayerEvent('fileLoaded', this);
			return this;
		}

		/**
   * Resets play pointers for all tracks.
   * @return {Player}
   */

	}, {
		key: "resetTracks",
		value: function resetTracks() {
			this.tracks.forEach(function (track) {
				return track.reset();
			});
			return this;
		}

		/**
   * Gets an array of events grouped by track.
   * @return {array}
   */

	}, {
		key: "getEvents",
		value: function getEvents() {
			return this.tracks.map(function (track) {
				return track.events;
			});
		}

		/**
   * Gets total number of ticks in the loaded MIDI file.
   * @return {number}
   */

	}, {
		key: "getTotalTicks",
		value: function getTotalTicks() {
			return Math.max.apply(null, this.tracks.map(function (track) {
				return track.delta;
			}));
		}

		/**
   * Gets total number of events in the loaded MIDI file.
   * @return {number}
   */

	}, {
		key: "getTotalEvents",
		value: function getTotalEvents() {
			return this.tracks.reduce(function (a, b) {
				return { events: { length: a.events.length + b.events.length } };
			}, { events: { length: 0 } }).events.length;
		}

		/**
   * Gets song duration in seconds.
   * @return {number}
   */

	}, {
		key: "getSongTime",
		value: function getSongTime() {
			return this.totalTicks / this.division / this.tempo * 60;
		}

		/**
   * Gets remaining number of seconds in playback.
   * @return {number}
   */

	}, {
		key: "getSongTimeRemaining",
		value: function getSongTimeRemaining() {
			return Math.round((this.totalTicks - this.getCurrentTick()) / this.division / this.tempo * 60);
		}

		/**
   * Gets remaining percent of playback.
   * @return {number}
   */

	}, {
		key: "getSongPercentRemaining",
		value: function getSongPercentRemaining() {
			return Math.round(this.getSongTimeRemaining() / this.getSongTime() * 100);
		}

		/**
   * Number of bytes processed in the loaded MIDI file.
   * @return {number}
   */

	}, {
		key: "bytesProcessed",
		value: function bytesProcessed() {
			// Currently assume header chunk is strictly 14 bytes
			return 14 + this.tracks.length * 8 + this.tracks.reduce(function (a, b) {
				return { pointer: a.pointer + b.pointer };
			}, { pointer: 0 }).pointer;
		}

		/**
   * Number of events played up to this point.
   * @return {number}
   */

	}, {
		key: "eventsPlayed",
		value: function eventsPlayed() {
			return this.tracks.reduce(function (a, b) {
				return { eventIndex: a.eventIndex + b.eventIndex };
			}, { eventIndex: 0 }).eventIndex;
		}

		/**
   * Determines if the player pointer has reached the end of the loaded MIDI file.
   * Used in two ways:
   * 1. If playing result is based on loaded JSON events.
   * 2. If parsing (dryRun) it's based on the actual buffer length vs bytes processed.
   * @return {boolean}
   */

	}, {
		key: "endOfFile",
		value: function endOfFile() {
			if (this.isPlaying()) {
				return this.totalTicks - this.tick <= 0;
			}

			return this.bytesProcessed() == this.buffer.length;
		}

		/**
   * Gets the current tick number in playback.
   * @return {number}
   */

	}, {
		key: "getCurrentTick",
		value: function getCurrentTick() {
			if (!this.startTime && this.tick) return this.startTick;else if (!this.startTime) return 0;
			return Math.round((new Date().getTime() - this.startTime) / 1000 * (this.division * (this.tempo / 60))) + this.startTick;
		}

		/**
   * Sends MIDI event out to listener.
   * @param {object}
   * @return {Player}
   */

	}, {
		key: "emitEvent",
		value: function emitEvent(event) {
			this.triggerPlayerEvent('midiEvent', event);
			return this;
		}

		/**
   * Subscribes events to listeners
   * @param {string} - Name of event to subscribe to.
   * @param {function} - Callback to fire when event is broadcast.
   * @return {Player}
   */

	}, {
		key: "on",
		value: function on(playerEvent, fn) {
			if (!this.eventListeners.hasOwnProperty(playerEvent)) this.eventListeners[playerEvent] = [];
			this.eventListeners[playerEvent].push(fn);
			return this;
		}

		/**
   * Broadcasts event to trigger subscribed callbacks.
   * @param {string} - Name of event.
   * @param {object} - Data to be passed to subscriber callback.
   * @return {Player}
   */

	}, {
		key: "triggerPlayerEvent",
		value: function triggerPlayerEvent(playerEvent, data) {
			if (this.eventListeners.hasOwnProperty(playerEvent)) this.eventListeners[playerEvent].forEach(function (fn) {
				return fn(data || {});
			});
			return this;
		}
	}]);

	return Player;
}();

exports.Player = Player;

},{"./track":4,"./utils":5,"fs":undefined}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Constants = require("./constants").Constants;
var Utils = require("./utils").Utils;

/**
 * Class representing a track.  Contains methods for parsing events and keeping track of pointer.
 */

var Track = function () {
	function Track(index, data) {
		_classCallCheck(this, Track);

		this.enabled = true;
		this.eventIndex = 0;
		this.pointer = 0;
		this.lastTick = 0;
		this.lastStatus = null;
		this.index = index;
		this.data = data;
		this.delta = 0;
		this.runningDelta = 0;
		this.events = [];
	}

	/**
  * Resets all stateful track informaion used during playback.
  * @return {Track}
  */


	_createClass(Track, [{
		key: "reset",
		value: function reset() {
			this.enabled = true;
			this.eventIndex = 0;
			this.pointer = 0;
			this.lastTick = 0;
			this.lastStatus = null;
			this.delta = 0;
			this.runningDelta = 0;
			return this;
		}

		/**
   * Sets this track to be enabled during playback.
   * @return {Track}
   */

	}, {
		key: "enable",
		value: function enable() {
			this.enabled = true;
			return this;
		}

		/**
   * Sets this track to be disabled during playback.
   * @return {Track}
   */

	}, {
		key: "disable",
		value: function disable() {
			this.enabled = false;
			return this;
		}

		/**
   * Sets the track event index to the nearest event to the given tick.
   * @param {number} tick
   * @return {Track}
   */

	}, {
		key: "setEventIndexByTick",
		value: function setEventIndexByTick(tick) {
			tick = tick || 0;

			for (var i in this.events) {
				if (this.events[i].tick >= tick) {
					this.eventIndex = i;
					return this;
				}
			}
		}

		/**
   * Gets byte located at pointer position.
   * @return {number}
   */

	}, {
		key: "getCurrentByte",
		value: function getCurrentByte() {
			return this.data[this.pointer];
		}

		/**
   * Gets count of delta bytes and current pointer position.
   * @return {number}
   */

	}, {
		key: "getDeltaByteCount",
		value: function getDeltaByteCount() {
			// Get byte count of delta VLV
			// http://www.ccarh.org/courses/253/handout/vlv/
			// If byte is greater or equal to 80h (128 decimal) then the next byte
			// is also part of the VLV,
			// else byte is the last byte in a VLV.
			var currentByte = this.getCurrentByte();
			var byteCount = 1;

			while (currentByte >= 128) {
				currentByte = this.data[this.pointer + byteCount];
				byteCount++;
			}

			return byteCount;
		}

		/**
   * Get delta value at current pointer position.
   * @return {number}
   */

	}, {
		key: "getDelta",
		value: function getDelta() {
			return Utils.readVarInt(this.data.subarray(this.pointer, this.pointer + this.getDeltaByteCount()));
		}

		/**
   * Handles event within a given track starting at specified index
   * @param {number} currentTick
   * @param {boolean} dryRun - If true events will be parsed and returned regardless of time.
   */

	}, {
		key: "handleEvent",
		value: function handleEvent(currentTick, dryRun) {
			dryRun = dryRun || false;

			if (dryRun) {
				var elapsedTicks = currentTick - this.lastTick;
				var delta = this.getDelta();
				var eventReady = elapsedTicks >= delta;

				if (this.pointer < this.data.length && (dryRun || eventReady)) {
					var _event = this.parseEvent();
					if (this.enabled) return _event;
					// Recursively call this function for each event ahead that has 0 delta time?
				}
			} else {
				// Let's actually play the MIDI from the generated JSON events created by the dry run.
				if (this.events[this.eventIndex] && this.events[this.eventIndex].tick <= currentTick) {
					this.eventIndex++;
					if (this.enabled) return this.events[this.eventIndex - 1];
				}
			}

			return null;
		}

		/**
   * Get string data from event.
   * @param {number} eventStartIndex
   * @return {string}
   */

	}, {
		key: "getStringData",
		value: function getStringData(eventStartIndex) {
			var currentByte = this.pointer;
			var byteCount = 1;
			var length = Utils.readVarInt(this.data.subarray(eventStartIndex + 2, eventStartIndex + 2 + byteCount));
			var stringLength = length;

			return Utils.bytesToLetters(this.data.subarray(eventStartIndex + byteCount + 2, eventStartIndex + byteCount + length + 2));
		}

		/**
   * Parses event into JSON and advances pointer for the track
   * @return {object}
   */

	}, {
		key: "parseEvent",
		value: function parseEvent() {
			var eventStartIndex = this.pointer + this.getDeltaByteCount();
			var eventJson = {};
			var deltaByteCount = this.getDeltaByteCount();
			eventJson.track = this.index + 1;
			eventJson.delta = this.getDelta();
			this.lastTick = this.lastTick + eventJson.delta;
			this.runningDelta += eventJson.delta;
			eventJson.tick = this.runningDelta;
			eventJson.byteIndex = this.pointer;

			//eventJson.raw = event;
			if (this.data[eventStartIndex] == 0xff) {
				// Meta Event

				// If this is a meta event we should emit the data and immediately move to the next event
				// otherwise if we let it run through the next cycle a slight delay will accumulate if multiple tracks
				// are being played simultaneously

				switch (this.data[eventStartIndex + 1]) {
					case 0x00:
						// Sequence Number
						eventJson.name = 'Sequence Number';
						break;
					case 0x01:
						// Text Event
						eventJson.name = 'Text Event';
						eventJson.string = this.getStringData(eventStartIndex);
						break;
					case 0x02:
						// Copyright Notice
						eventJson.name = 'Copyright Notice';
						break;
					case 0x03:
						// Sequence/Track Name
						eventJson.name = 'Sequence/Track Name';
						eventJson.string = this.getStringData(eventStartIndex);
						break;
					case 0x04:
						// Instrument Name
						eventJson.name = 'Instrument Name';
						eventJson.string = this.getStringData(eventStartIndex);
						break;
					case 0x05:
						// Lyric
						eventJson.name = 'Lyric';
						eventJson.string = this.getStringData(eventStartIndex);
						break;
					case 0x06:
						// Marker
						eventJson.name = 'Marker';
						break;
					case 0x07:
						// Cue Point
						eventJson.name = 'Cue Point';
						eventJson.string = this.getStringData(eventStartIndex);
						break;
					case 0x09:
						// Device Name
						eventJson.name = 'Device Name';
						eventJson.string = this.getStringData(eventStartIndex);
						break;
					case 0x20:
						// MIDI Channel Prefix
						eventJson.name = 'MIDI Channel Prefix';
						break;
					case 0x21:
						// MIDI Port
						eventJson.name = 'MIDI Port';
						eventJson.data = Utils.bytesToNumber([this.data[eventStartIndex + 3]]);
						break;
					case 0x2F:
						// End of Track
						eventJson.name = 'End of Track';
						break;
					case 0x51:
						// Set Tempo
						eventJson.name = 'Set Tempo';
						eventJson.data = Math.round(60000000 / Utils.bytesToNumber(this.data.subarray(eventStartIndex + 3, eventStartIndex + 6)));
						this.tempo = eventJson.data;
						break;
					case 0x54:
						// SMTPE Offset
						eventJson.name = 'SMTPE Offset';
						break;
					case 0x58:
						// Time Signature
						// FF 58 04 nn dd cc bb
						eventJson.name = 'Time Signature';
						eventJson.data = this.data.subarray(eventStartIndex + 3, eventStartIndex + 7);
						eventJson.timeSignature = "" + eventJson.data[0] + "/" + Math.pow(2, eventJson.data[1]);
						break;
					case 0x59:
						// Key Signature
						// FF 59 02 sf mi
						eventJson.name = 'Key Signature';
						eventJson.data = this.data.subarray(eventStartIndex + 3, eventStartIndex + 5);

						if (eventJson.data[0] >= 0) {
							eventJson.keySignature = Constants.CIRCLE_OF_FIFTHS[eventJson.data[0]];
						} else if (eventJson.data[0] < 0) {
							eventJson.keySignature = Constants.CIRCLE_OF_FOURTHS[Math.abs(eventJson.data[0])];
						}

						if (eventJson.data[1] == 0) {
							eventJson.keySignature += " Major";
						} else if (eventJson.data[1] == 1) {
							eventJson.keySignature += " Minor";
						}

						break;
					case 0x7F:
						// Sequencer-Specific Meta-event
						eventJson.name = 'Sequencer-Specific Meta-event';
						break;
					default:
						eventJson.name = 'Unknown: ' + this.data[eventStartIndex + 1].toString(16);
						break;
				}

				var length = this.data[this.pointer + deltaByteCount + 2];
				// Some meta events will have vlv that needs to be handled

				this.pointer += deltaByteCount + 3 + length;
			} else if (this.data[eventStartIndex] == 0xf0) {
				// Sysex
				eventJson.name = 'Sysex';
				var length = this.data[this.pointer + deltaByteCount + 1];
				this.pointer += deltaByteCount + 2 + length;
			} else {
				// Voice event
				if (this.data[eventStartIndex] < 0x80) {
					// Running status
					eventJson.running = true;
					eventJson.noteNumber = this.data[eventStartIndex];
					eventJson.noteName = Constants.NOTES[this.data[eventStartIndex]];
					eventJson.velocity = this.data[eventStartIndex + 1];

					if (this.lastStatus <= 0x8f) {
						eventJson.name = 'Note off';
						eventJson.channel = this.lastStatus - 0x80 + 1;
					} else if (this.lastStatus <= 0x9f) {
						eventJson.name = 'Note on';
						eventJson.channel = this.lastStatus - 0x90 + 1;
					}

					this.pointer += deltaByteCount + 2;
				} else {
					this.lastStatus = this.data[eventStartIndex];

					if (this.data[eventStartIndex] <= 0x8f) {
						// Note off
						eventJson.name = 'Note off';
						eventJson.channel = this.lastStatus - 0x80 + 1;
						eventJson.noteNumber = this.data[eventStartIndex + 1];
						eventJson.noteName = Constants.NOTES[this.data[eventStartIndex + 1]];
						eventJson.velocity = Math.round(this.data[eventStartIndex + 2] / 127 * 100);
						this.pointer += deltaByteCount + 3;
					} else if (this.data[eventStartIndex] <= 0x9f) {
						// Note on
						eventJson.name = 'Note on';
						eventJson.channel = this.lastStatus - 0x90 + 1;
						eventJson.noteNumber = this.data[eventStartIndex + 1];
						eventJson.noteName = Constants.NOTES[this.data[eventStartIndex + 1]];
						eventJson.velocity = Math.round(this.data[eventStartIndex + 2] / 127 * 100);
						this.pointer += deltaByteCount + 3;
					} else if (this.data[eventStartIndex] <= 0xaf) {
						// Polyphonic Key Pressure
						eventJson.name = 'Polyphonic Key Pressure';
						eventJson.channel = this.lastStatus - 0xa0 + 1;
						eventJson.note = Constants.NOTES[this.data[eventStartIndex + 1]];
						eventJson.pressure = event[2];
						this.pointer += deltaByteCount + 3;
					} else if (this.data[eventStartIndex] <= 0xbf) {
						// Controller Change
						eventJson.name = 'Controller Change';
						eventJson.channel = this.lastStatus - 0xb0 + 1;
						eventJson.number = this.data[eventStartIndex + 1];
						eventJson.value = this.data[eventStartIndex + 2];
						this.pointer += deltaByteCount + 3;
					} else if (this.data[eventStartIndex] <= 0xcf) {
						// Program Change
						eventJson.name = 'Program Change';
						eventJson.channel = this.lastStatus - 0xc0 + 1;
						eventJson.value = this.data[eventStartIndex + 1];
						this.pointer += deltaByteCount + 2;
					} else if (this.data[eventStartIndex] <= 0xdf) {
						// Channel Key Pressure
						eventJson.name = 'Channel Key Pressure';
						eventJson.channel = this.lastStatus - 0xd0 + 1;
						this.pointer += deltaByteCount + 2;
					} else if (this.data[eventStartIndex] <= 0xef) {
						// Pitch Bend
						eventJson.name = 'Pitch Bend';
						eventJson.channel = this.lastStatus - 0xe0 + 1;
						this.pointer += deltaByteCount + 3;
					} else {
						eventJson.name = 'Unknown.  Pointer: ' + this.pointer.toString() + ' ' + eventStartIndex.toString() + ' ' + this.data.length;
					}
				}
			}

			this.delta += eventJson.delta;
			this.events.push(eventJson);

			return eventJson;
		}

		/**
   * Returns true if pointer has reached the end of the track.
   * @param {boolean}
   */

	}, {
		key: "endOfTrack",
		value: function endOfTrack() {
			if (this.data[this.pointer + 1] == 0xff && this.data[this.pointer + 2] == 0x2f && this.data[this.pointer + 3] == 0x00) {
				return true;
			}

			return false;
		}
	}]);

	return Track;
}();

module.exports.Track = Track;

},{"./constants":1,"./utils":5}],5:[function(require,module,exports){
(function (Buffer){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Contains misc static utility methods.
 */
var Utils = function () {
	function Utils() {
		_classCallCheck(this, Utils);
	}

	_createClass(Utils, null, [{
		key: 'byteToHex',


		/**
   * Converts a single byte to a hex string.
   * @param {number} byte
   * @return {string}
   */
		value: function byteToHex(byte) {
			// Ensure hex string always has two chars
			return ('0' + byte.toString(16)).slice(-2);
		}

		/**
   * Converts an array of bytes to a hex string.
   * @param {array} byteArray
   * @return {string}
   */

	}, {
		key: 'bytesToHex',
		value: function bytesToHex(byteArray) {
			var hex = [];
			byteArray.forEach(function (byte) {
				return hex.push(Utils.byteToHex(byte));
			});
			return hex.join('');
		}

		/**
   * Converts a hex string to a number.
   * @param {string} hexString
   * @return {number}
   */

	}, {
		key: 'hexToNumber',
		value: function hexToNumber(hexString) {
			return parseInt(hexString, 16);
		}

		/**
   * Converts an array of bytes to a number.
   * @param {array} byteArray
   * @return {number}
   */

	}, {
		key: 'bytesToNumber',
		value: function bytesToNumber(byteArray) {
			return Utils.hexToNumber(Utils.bytesToHex(byteArray));
		}

		/**
   * Converts an array of bytes to letters.
   * @param {array} byteArray
   * @return {string}
   */

	}, {
		key: 'bytesToLetters',
		value: function bytesToLetters(byteArray) {
			var letters = [];
			byteArray.forEach(function (byte) {
				return letters.push(String.fromCharCode(byte));
			});
			return letters.join('');
		}

		/**
   * Converts a decimal to it's binary representation.
   * @param {number} dec
   * @return {string}
   */

	}, {
		key: 'decToBinary',
		value: function decToBinary(dec) {
			return (dec >>> 0).toString(2);
		}

		/**
   * Reads a variable length value.
   * @param {array} byteArray
   * @return {number}
   */

	}, {
		key: 'readVarInt',
		value: function readVarInt(byteArray) {
			var result = 0;
			byteArray.forEach(function (number) {
				var b = number;
				if (b & 0x80) {
					result += b & 0x7f;
					result <<= 7;
				} else {
					/* b is the last byte */
					result += b;
				}
			});

			return result;
		}

		/**
   * Decodes base-64 encoded string
   * @param {string} string
   * @return {string}
   */

	}, {
		key: 'atob',
		value: function (_atob) {
			function atob(_x) {
				return _atob.apply(this, arguments);
			}

			atob.toString = function () {
				return _atob.toString();
			};

			return atob;
		}(function (string) {
			if (typeof atob === 'function') return atob(string);
			return new Buffer(string, 'base64').toString('binary');
		})
	}]);

	return Utils;
}();

exports.Utils = Utils;

}).call(this,require("buffer").Buffer)

},{"buffer":undefined}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29uc3RhbnRzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3BsYXllci5qcyIsInNyYy90cmFjay5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7OztBQUdBLElBQUksWUFBWTtBQUNmLFVBQVMsT0FETTtBQUVmLFFBQU8sRUFGUTtBQUdmLG9CQUFtQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsSUFBWCxFQUFpQixJQUFqQixFQUF1QixJQUF2QixFQUE2QixJQUE3QixFQUFtQyxJQUFuQyxFQUF5QyxJQUF6QyxFQUErQyxJQUEvQyxFQUFxRCxLQUFyRCxFQUE0RCxLQUE1RCxFQUFtRSxLQUFuRSxDQUhKO0FBSWYsbUJBQWtCLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLEVBQTBCLEdBQTFCLEVBQStCLElBQS9CLEVBQXFDLElBQXJDLEVBQTJDLElBQTNDLEVBQWlELElBQWpELEVBQXVELElBQXZELEVBQTZELElBQTdEO0FBSkgsQ0FBaEI7O0FBT0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUQsQ0FBRCxFQUFRLENBQUMsSUFBRCxFQUFNLElBQU4sQ0FBUixFQUFxQixDQUFDLEdBQUQsQ0FBckIsRUFBNEIsQ0FBQyxJQUFELEVBQU0sSUFBTixDQUE1QixFQUF5QyxDQUFDLEdBQUQsQ0FBekMsRUFBK0MsQ0FBQyxHQUFELENBQS9DLEVBQXNELENBQUMsSUFBRCxFQUFNLElBQU4sQ0FBdEQsRUFBbUUsQ0FBQyxHQUFELENBQW5FLEVBQTBFLENBQUMsSUFBRCxFQUFNLElBQU4sQ0FBMUUsRUFBdUYsQ0FBQyxHQUFELENBQXZGLEVBQThGLENBQUMsSUFBRCxFQUFNLElBQU4sQ0FBOUYsRUFBMkcsQ0FBQyxHQUFELENBQTNHLENBQWY7QUFDQSxJQUFJLFVBQVUsQ0FBZDs7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QUFNLFVBQU4sQ0FBaUIsU0FBakIsQ0FBbEIsQ0FBUDtBQUNBOztBQUVEOzs7Ozs7OztpQ0FLc0IsUyxFQUFXO0FBQ2hDLE9BQUksVUFBVSxFQUFkO0FBQ0EsYUFBVSxPQUFWLENBQWtCO0FBQUEsV0FBUSxRQUFRLElBQVIsQ0FBYSxPQUFPLFlBQVAsQ0FBb0IsSUFBcEIsQ0FBYixDQUFSO0FBQUEsSUFBbEI7QUFDQSxVQUFPLFFBQVEsSUFBUixDQUFhLEVBQWIsQ0FBUDtBQUNBOztBQUVEOzs7Ozs7Ozs4QkFLbUIsRyxFQUFLO0FBQ3BCLFVBQU8sQ0FBQyxRQUFRLENBQVQsRUFBWSxRQUFaLENBQXFCLENBQXJCLENBQVA7QUFDSDs7QUFFRDs7Ozs7Ozs7NkJBS2tCLFMsRUFBVztBQUM1QixPQUFJLFNBQVMsQ0FBYjtBQUNBLGFBQVUsT0FBVixDQUFrQixrQkFBVTtBQUMzQixRQUFJLElBQUksTUFBUjtBQUNBLFFBQUksSUFBSSxJQUFSLEVBQWM7QUFDYixlQUFXLElBQUksSUFBZjtBQUNBLGdCQUFXLENBQVg7QUFDQSxLQUhELE1BR087QUFDTjtBQUNBLGVBQVUsQ0FBVjtBQUNBO0FBQ0QsSUFURDs7QUFXQSxVQUFPLE1BQVA7QUFDQTs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBS1ksTSxFQUFRO0FBQ25CLE9BQUksT0FBTyxJQUFQLEtBQWdCLFVBQXBCLEVBQWdDLE9BQU8sS0FBSyxNQUFMLENBQVA7QUFDaEMsVUFBTyxJQUFJLE1BQUosQ0FBVyxNQUFYLEVBQW1CLFFBQW5CLEVBQTZCLFFBQTdCLENBQXNDLFFBQXRDLENBQVA7QUFDQSxHOzs7Ozs7QUFHRixRQUFRLEtBQVIsR0FBZ0IsS0FBaEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIi8qKlxuICogQ29uc3RhbnRzIHVzZWQgaW4gcGxheWVyLlxuICovXG52YXIgQ29uc3RhbnRzID0ge1xuXHRWRVJTSU9OOiAnMi4wLjUnLFxuXHROT1RFUzogW10sXG5cdENJUkNMRV9PRl9GT1VSVEhTOiBbJ0MnLCAnRicsICdCYicsICdFYicsICdBYicsICdEYicsICdHYicsICdDYicsICdGYicsICdCYmInLCAnRWJiJywgJ0FiYiddLFxuXHRDSVJDTEVfT0ZfRklGVEhTOiBbJ0MnLCAnRycsICdEJywgJ0EnLCAnRScsICdCJywgJ0YjJywgJ0MjJywgJ0cjJywgJ0QjJywgJ0EjJywgJ0UjJ11cbn07XG5cbi8vIEJ1aWxkcyBub3RlcyBvYmplY3QgZm9yIHJlZmVyZW5jZSBhZ2FpbnN0IGJpbmFyeSB2YWx1ZXMuXG52YXIgYWxsTm90ZXMgPSBbWydDJ10sIFsnQyMnLCdEYiddLCBbJ0QnXSwgWydEIycsJ0ViJ10sIFsnRSddLFsnRiddLCBbJ0YjJywnR2InXSwgWydHJ10sIFsnRyMnLCdBYiddLCBbJ0EnXSwgWydBIycsJ0JiJ10sIFsnQiddXTtcbnZhciBjb3VudGVyID0gMDtcblxuLy8gQWxsIGF2YWlsYWJsZSBvY3RhdmVzLlxuZm9yIChsZXQgaSA9IC0xOyBpIDw9IDk7IGkrKykge1xuXHRhbGxOb3Rlcy5mb3JFYWNoKG5vdGVHcm91cCA9PiB7XG5cdFx0bm90ZUdyb3VwLmZvckVhY2gobm90ZSA9PiBDb25zdGFudHMuTk9URVNbY291bnRlcl0gPSBub3RlICsgaSk7XG5cdFx0Y291bnRlciArKztcblx0fSk7XG59XG5cbmV4cG9ydHMuQ29uc3RhbnRzID0gQ29uc3RhbnRzOyIsImNvbnN0IFBsYXllciA9IHJlcXVpcmUoXCIuL3BsYXllclwiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCBDb25zdGFudHMgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFBsYXllcjpQbGF5ZXIuUGxheWVyLFxuICAgIFV0aWxzOlV0aWxzLlV0aWxzLFxuICAgIENvbnN0YW50czpDb25zdGFudHMuQ29uc3RhbnRzXG59IiwiY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5VdGlscztcbmNvbnN0IFRyYWNrID0gcmVxdWlyZShcIi4vdHJhY2tcIikuVHJhY2s7XG5cbi8vIFBvbHlmaWxsIFVpbnQ4QXJyYXkuZm9yRWFjaDogRG9lc24ndCBleGlzdCBvbiBTYWZhcmkgPDEwXG5pZiAoIVVpbnQ4QXJyYXkucHJvdG90eXBlLmZvckVhY2gpIHtcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KFVpbnQ4QXJyYXkucHJvdG90eXBlLCAnZm9yRWFjaCcsIHtcblx0XHR2YWx1ZTogQXJyYXkucHJvdG90eXBlLmZvckVhY2hcblx0fSk7XG59XG5cbi8qKlxuICogTWFpbiBwbGF5ZXIgY2xhc3MuICBDb250YWlucyBtZXRob2RzIHRvIGxvYWQgZmlsZXMsIHN0YXJ0LCBzdG9wLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gLSBDYWxsYmFjayB0byBmaXJlIGZvciBlYWNoIE1JREkgZXZlbnQuICBDYW4gYWxzbyBiZSBhZGRlZCB3aXRoIG9uKCdtaWRpRXZlbnQnLCBmbilcbiAqIEBwYXJhbSB7YXJyYXl9IC0gQXJyYXkgYnVmZmVyIG9mIE1JREkgZmlsZSAob3B0aW9uYWwpLlxuICovXG5jbGFzcyBQbGF5ZXIge1xuXHRjb25zdHJ1Y3RvcihldmVudEhhbmRsZXIsIGJ1ZmZlcikge1xuXHRcdHRoaXMuc2FtcGxlUmF0ZSA9IDU7IC8vIG1pbGxpc2Vjb25kc1xuXHRcdHRoaXMuc3RhcnRUaW1lID0gMDtcblx0XHR0aGlzLmJ1ZmZlciA9IGJ1ZmZlciB8fCBudWxsO1xuXHRcdHRoaXMuZGl2aXNpb247XG5cdFx0dGhpcy5mb3JtYXQ7XG5cdFx0dGhpcy5zZXRJbnRlcnZhbElkID0gZmFsc2U7XG5cdFx0dGhpcy50cmFja3MgPSBbXTtcblx0XHR0aGlzLmluc3RydW1lbnRzID0gW107XG5cdFx0dGhpcy5kZWZhdWx0VGVtcG8gPSAxMjA7XG5cdFx0dGhpcy50ZW1wbyA9IG51bGw7XG5cdFx0dGhpcy5zdGFydFRpY2sgPSAwO1xuXHRcdHRoaXMudGljayA9IDA7XG5cdFx0dGhpcy5sYXN0VGljayA9IG51bGw7XG5cdFx0dGhpcy5pbkxvb3AgPSBmYWxzZTtcblx0XHR0aGlzLnRvdGFsVGlja3MgPSAwO1xuXHRcdHRoaXMuZXZlbnRzID0gW107XG5cdFx0dGhpcy50b3RhbEV2ZW50cyA9IDA7XG5cdFx0dGhpcy5ldmVudExpc3RlbmVycyA9IHt9O1xuXG5cdFx0aWYgKHR5cGVvZihldmVudEhhbmRsZXIpID09PSAnZnVuY3Rpb24nKSB0aGlzLm9uKCdtaWRpRXZlbnQnLCBldmVudEhhbmRsZXIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIExvYWQgYSBmaWxlIGludG8gdGhlIHBsYXllciAoTm9kZS5qcyBvbmx5KS5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBQYXRoIG9mIGZpbGUuXG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdGxvYWRGaWxlKHBhdGgpIHtcblx0XHR2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuXHRcdHRoaXMuYnVmZmVyID0gZnMucmVhZEZpbGVTeW5jKHBhdGgpO1xuXHRcdHJldHVybiB0aGlzLmZpbGVMb2FkZWQoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBMb2FkIGFuIGFycmF5IGJ1ZmZlciBpbnRvIHRoZSBwbGF5ZXIuXG5cdCAqIEBwYXJhbSB7YXJyYXl9IGFycmF5QnVmZmVyIC0gQXJyYXkgYnVmZmVyIG9mIGZpbGUgdG8gYmUgbG9hZGVkLlxuXHQgKiBAcmV0dXJuIHtQbGF5ZXJ9XG5cdCAqL1xuXHRsb2FkQXJyYXlCdWZmZXIoYXJyYXlCdWZmZXIpIHtcblx0XHR0aGlzLmJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcblx0XHRyZXR1cm4gdGhpcy5maWxlTG9hZGVkKCk7XG5cdH1cblxuXHQvKipcblx0ICogTG9hZCBhIGRhdGEgVVJJIGludG8gdGhlIHBsYXllci5cblx0ICogQHBhcmFtIHtzdHJpbmd9IGRhdGFVcmkgLSBEYXRhIFVSSSB0byBiZSBsb2FkZWQuXG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdGxvYWREYXRhVXJpKGRhdGFVcmkpIHtcblx0XHQvLyBjb252ZXJ0IGJhc2U2NCB0byByYXcgYmluYXJ5IGRhdGEgaGVsZCBpbiBhIHN0cmluZy5cblx0XHQvLyBkb2Vzbid0IGhhbmRsZSBVUkxFbmNvZGVkIERhdGFVUklzIC0gc2VlIFNPIGFuc3dlciAjNjg1MDI3NiBmb3IgY29kZSB0aGF0IGRvZXMgdGhpc1xuXHRcdHZhciBieXRlU3RyaW5nID0gVXRpbHMuYXRvYihkYXRhVXJpLnNwbGl0KCcsJylbMV0pO1xuXG5cdFx0Ly8gd3JpdGUgdGhlIGJ5dGVzIG9mIHRoZSBzdHJpbmcgdG8gYW4gQXJyYXlCdWZmZXJcblx0XHR2YXIgaWEgPSBuZXcgVWludDhBcnJheShieXRlU3RyaW5nLmxlbmd0aCk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBieXRlU3RyaW5nLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpYVtpXSA9IGJ5dGVTdHJpbmcuY2hhckNvZGVBdChpKTtcblx0XHR9XG5cblx0XHR0aGlzLmJ1ZmZlciA9IGlhO1xuXHRcdHJldHVybiB0aGlzLmZpbGVMb2FkZWQoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgZmlsZXNpemUgb2YgbG9hZGVkIGZpbGUgaW4gbnVtYmVyIG9mIGJ5dGVzLlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9IC0gVGhlIGZpbGVzaXplLlxuXHQgKi9cblx0Z2V0RmlsZXNpemUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuYnVmZmVyID8gdGhpcy5idWZmZXIubGVuZ3RoIDogMDtcblx0fVxuXG5cdC8qKlxuXHQgKiBTZXRzIGRlZmF1bHQgdGVtcG8sIHBhcnNlcyBmaWxlIGZvciBuZWNlc3NhcnkgaW5mb3JtYXRpb24sIGFuZCBkb2VzIGEgZHJ5IHJ1biB0byBjYWxjdWxhdGUgdG90YWwgbGVuZ3RoLlxuXHQgKiBQb3B1bGF0ZXMgdGhpcy5ldmVudHMgJiB0aGlzLnRvdGFsVGlja3MuXG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdGZpbGVMb2FkZWQoKSB7XG5cdFx0aWYgKCF0aGlzLnZhbGlkYXRlKCkpIHRocm93ICdJbnZhbGlkIE1JREkgZmlsZTsgc2hvdWxkIHN0YXJ0IHdpdGggTVRoZCc7XG5cdFx0cmV0dXJuIHRoaXMuc2V0VGVtcG8odGhpcy5kZWZhdWx0VGVtcG8pLmdldERpdmlzaW9uKCkuZ2V0Rm9ybWF0KCkuZ2V0VHJhY2tzKCkuZHJ5UnVuKCk7XG5cdH1cblxuXHQvKipcblx0ICogVmFsaWRhdGVzIGZpbGUgdXNpbmcgc2ltcGxlIG1lYW5zIC0gZmlyc3QgZm91ciBieXRlcyBzaG91bGQgPT0gTVRoZC5cblx0ICogQHJldHVybiB7Ym9vbGVhbn1cblx0ICovXG5cdHZhbGlkYXRlKCkge1xuXHRcdHJldHVybiBVdGlscy5ieXRlc1RvTGV0dGVycyh0aGlzLmJ1ZmZlci5zdWJhcnJheSgwLCA0KSkgPT09ICdNVGhkJztcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIE1JREkgZmlsZSBmb3JtYXQgZm9yIGxvYWRlZCBmaWxlLlxuXHQgKiBAcmV0dXJuIHtQbGF5ZXJ9XG5cdCAqL1xuXHRnZXRGb3JtYXQoKSB7XG5cdFx0Lypcblx0XHRNSURJIGZpbGVzIGNvbWUgaW4gMyB2YXJpYXRpb25zOlxuXHRcdEZvcm1hdCAwIHdoaWNoIGNvbnRhaW4gYSBzaW5nbGUgdHJhY2tcblx0XHRGb3JtYXQgMSB3aGljaCBjb250YWluIG9uZSBvciBtb3JlIHNpbXVsdGFuZW91cyB0cmFja3Ncblx0XHQoaWUgYWxsIHRyYWNrcyBhcmUgdG8gYmUgcGxheWVkIHNpbXVsdGFuZW91c2x5KS5cblx0XHRGb3JtYXQgMiB3aGljaCBjb250YWluIG9uZSBvciBtb3JlIGluZGVwZW5kYW50IHRyYWNrc1xuXHRcdChpZSBlYWNoIHRyYWNrIGlzIHRvIGJlIHBsYXllZCBpbmRlcGVuZGFudGx5IG9mIHRoZSBvdGhlcnMpLlxuXHRcdHJldHVybiBVdGlscy5ieXRlc1RvTnVtYmVyKHRoaXMuYnVmZmVyLnN1YmFycmF5KDgsIDEwKSk7XG5cdFx0Ki9cblxuXHRcdHRoaXMuZm9ybWF0ID0gVXRpbHMuYnl0ZXNUb051bWJlcih0aGlzLmJ1ZmZlci5zdWJhcnJheSg4LCAxMCkpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlcyBvdXQgdHJhY2tzLCBwbGFjZXMgdGhlbSBpbiB0aGlzLnRyYWNrcyBhbmQgaW5pdGlhbGl6ZXMgdGhpcy5wb2ludGVyc1xuXHQgKiBAcmV0dXJuIHtQbGF5ZXJ9XG5cdCAqL1xuXHRnZXRUcmFja3MoKSB7XG5cdFx0dGhpcy50cmFja3MgPSBbXTtcblx0XHRsZXQgdHJhY2tPZmZzZXQgPSAwO1xuXHRcdHdoaWxlICh0cmFja09mZnNldCA8IHRoaXMuYnVmZmVyLmxlbmd0aCkge1xuXHRcdFx0aWYgKFV0aWxzLmJ5dGVzVG9MZXR0ZXJzKHRoaXMuYnVmZmVyLnN1YmFycmF5KHRyYWNrT2Zmc2V0LCB0cmFja09mZnNldCArIDQpKSA9PSAnTVRyaycpIHtcblx0XHRcdFx0bGV0IHRyYWNrTGVuZ3RoID0gVXRpbHMuYnl0ZXNUb051bWJlcih0aGlzLmJ1ZmZlci5zdWJhcnJheSh0cmFja09mZnNldCArIDQsIHRyYWNrT2Zmc2V0ICsgOCkpO1xuXHRcdFx0XHR0aGlzLnRyYWNrcy5wdXNoKG5ldyBUcmFjayh0aGlzLnRyYWNrcy5sZW5ndGgsIHRoaXMuYnVmZmVyLnN1YmFycmF5KHRyYWNrT2Zmc2V0ICsgOCwgdHJhY2tPZmZzZXQgKyA4ICsgdHJhY2tMZW5ndGgpKSk7XG5cdFx0XHR9XG5cblx0XHRcdHRyYWNrT2Zmc2V0ICs9IFV0aWxzLmJ5dGVzVG9OdW1iZXIodGhpcy5idWZmZXIuc3ViYXJyYXkodHJhY2tPZmZzZXQgKyA0LCB0cmFja09mZnNldCArIDgpKSArIDg7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIEVuYWJsZXMgYSB0cmFjayBmb3IgcGxheWluZy5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHRyYWNrTnVtYmVyIC0gVHJhY2sgbnVtYmVyXG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdGVuYWJsZVRyYWNrKHRyYWNrTnVtYmVyKSB7XG5cdFx0dGhpcy50cmFja3NbdHJhY2tOdW1iZXIgLSAxXS5lbmFibGUoKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBEaXNhYmxlcyBhIHRyYWNrIGZvciBwbGF5aW5nLlxuXHQgKiBAcGFyYW0ge251bWJlcn0gLSBUcmFjayBudW1iZXJcblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0ZGlzYWJsZVRyYWNrKHRyYWNrTnVtYmVyKSB7XG5cdFx0dGhpcy50cmFja3NbdHJhY2tOdW1iZXIgLSAxXS5kaXNhYmxlKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyBxdWFydGVyIG5vdGUgZGl2aXNpb24gb2YgbG9hZGVkIE1JREkgZmlsZS5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0Z2V0RGl2aXNpb24oKSB7XG5cdFx0dGhpcy5kaXZpc2lvbiA9IFV0aWxzLmJ5dGVzVG9OdW1iZXIodGhpcy5idWZmZXIuc3ViYXJyYXkoMTIsIDE0KSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIG1haW4gcGxheSBsb29wLlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IC0gSW5kaWNhdGVzIHdoZXRoZXIgb3Igbm90IHRoaXMgaXMgYmVpbmcgY2FsbGVkIHNpbXBseSBmb3IgcGFyc2luZyBwdXJwb3Nlcy4gIERpc3JlZ2FyZHMgdGltaW5nIGlmIHNvLlxuXHQgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG5cdCAqL1xuXHRwbGF5TG9vcChkcnlSdW4pIHtcblx0XHRpZiAoIXRoaXMuaW5Mb29wKSB7XG5cdFx0XHR0aGlzLmluTG9vcCA9IHRydWU7XG5cdFx0XHR0aGlzLnRpY2sgPSB0aGlzLmdldEN1cnJlbnRUaWNrKCk7XG5cblx0XHRcdHRoaXMudHJhY2tzLmZvckVhY2goZnVuY3Rpb24odHJhY2spIHtcblx0XHRcdFx0Ly8gSGFuZGxlIG5leHQgZXZlbnRcblx0XHRcdFx0aWYgKCFkcnlSdW4gJiYgdGhpcy5lbmRPZkZpbGUoKSkge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2VuZCBvZiBmaWxlJylcblx0XHRcdFx0XHR0aGlzLnRyaWdnZXJQbGF5ZXJFdmVudCgnZW5kT2ZGaWxlJyk7XG5cdFx0XHRcdFx0dGhpcy5zdG9wKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bGV0IGV2ZW50ID0gdHJhY2suaGFuZGxlRXZlbnQodGhpcy50aWNrLCBkcnlSdW4pO1xuXG5cdFx0XHRcdFx0aWYgKGRyeVJ1biAmJiBldmVudCkge1xuXHRcdFx0XHRcdFx0aWYgKGV2ZW50Lmhhc093blByb3BlcnR5KCduYW1lJykgJiYgZXZlbnQubmFtZSA9PT0gJ1NldCBUZW1wbycpIHtcblx0XHRcdFx0XHRcdFx0Ly8gR3JhYiB0ZW1wbyBpZiBhdmFpbGFibGUuXG5cdFx0XHRcdFx0XHRcdHRoaXMuZGVmYXVsdFRlbXBvID0gZXZlbnQuZGF0YTtcblx0XHRcdFx0XHRcdFx0dGhpcy5zZXRUZW1wbyhldmVudC5kYXRhKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmIChldmVudC5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpICYmIGV2ZW50Lm5hbWUgPT09ICdQcm9ncmFtIENoYW5nZScpIHtcblx0XHRcdFx0XHRcdFx0aWYgKCF0aGlzLmluc3RydW1lbnRzLmluY2x1ZGVzKGV2ZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuaW5zdHJ1bWVudHMucHVzaChldmVudC52YWx1ZSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKGV2ZW50KSB0aGlzLmVtaXRFdmVudChldmVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSwgdGhpcyk7XG5cblx0XHRcdGlmICghZHJ5UnVuKSB0aGlzLnRyaWdnZXJQbGF5ZXJFdmVudCgncGxheWluZycsIHt0aWNrOiB0aGlzLnRpY2t9KTtcblx0XHRcdHRoaXMuaW5Mb29wID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFNldHRlciBmb3IgdGVtcG8uXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSAtIFRlbXBvIGluIGJwbSAoZGVmYXVsdHMgdG8gMTIwKVxuXHQgKi9cblx0c2V0VGVtcG8odGVtcG8pIHtcblx0XHR0aGlzLnRlbXBvID0gdGVtcG87XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU2V0dGVyIGZvciBzdGFydFRpbWUuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSAtIFVUQyB0aW1lc3RhbXBcblx0ICovXG5cdHNldFN0YXJ0VGltZShzdGFydFRpbWUpIHtcblx0XHR0aGlzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBTdGFydCBwbGF5aW5nIGxvYWRlZCBNSURJIGZpbGUgaWYgbm90IGFscmVhZHkgcGxheWluZy5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0cGxheSgpIHtcblx0XHRpZiAodGhpcy5pc1BsYXlpbmcoKSkgdGhyb3cgJ0FscmVhZHkgcGxheWluZy4uLic7XG5cblx0XHQvLyBJbml0aWFsaXplXG5cdFx0aWYgKCF0aGlzLnN0YXJ0VGltZSkgdGhpcy5zdGFydFRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG5cdFx0Ly8gU3RhcnQgcGxheSBsb29wXG5cdFx0Ly93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMucGxheUxvb3AuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5zZXRJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwodGhpcy5wbGF5TG9vcC5iaW5kKHRoaXMpLCB0aGlzLnNhbXBsZVJhdGUpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogUGF1c2VzIHBsYXliYWNrIGlmIHBsYXlpbmcuXG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdHBhdXNlKCkge1xuXHRcdGNsZWFySW50ZXJ2YWwodGhpcy5zZXRJbnRlcnZhbElkKTtcblx0XHR0aGlzLnNldEludGVydmFsSWQgPSBmYWxzZTtcblx0XHR0aGlzLnN0YXJ0VGljayA9IHRoaXMudGljaztcblx0XHR0aGlzLnN0YXJ0VGltZSA9IDA7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU3RvcHMgcGxheWJhY2sgaWYgcGxheWluZy5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0c3RvcCgpIHtcblx0XHRjbGVhckludGVydmFsKHRoaXMuc2V0SW50ZXJ2YWxJZCk7XG5cdFx0dGhpcy5zZXRJbnRlcnZhbElkID0gZmFsc2U7XG5cdFx0dGhpcy5zdGFydFRpY2sgPSAwO1xuXHRcdHRoaXMuc3RhcnRUaW1lID0gMDtcblx0XHR0aGlzLnJlc2V0VHJhY2tzKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU2tpcHMgcGxheWVyIHBvaW50ZXIgdG8gc3BlY2lmaWVkIHRpY2suXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSAtIFRpY2sgdG8gc2tpcCB0by5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0c2tpcFRvVGljayh0aWNrKSB7XG5cdFx0dGhpcy5zdG9wKCk7XG5cdFx0dGhpcy5zdGFydFRpY2sgPSB0aWNrO1xuXG5cdFx0Ly8gTmVlZCB0byBzZXQgdHJhY2sgZXZlbnQgaW5kZXhlcyB0byB0aGUgbmVhcmVzdCBwb3NzaWJsZSBldmVudCB0byB0aGUgc3BlY2lmaWVkIHRpY2suXG5cdFx0dGhpcy50cmFja3MuZm9yRWFjaChmdW5jdGlvbih0cmFjaykge1xuXHRcdFx0dHJhY2suc2V0RXZlbnRJbmRleEJ5VGljayh0aWNrKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTa2lwcyBwbGF5ZXIgcG9pbnRlciB0byBzcGVjaWZpZWQgcGVyY2VudGFnZS5cblx0ICogQHBhcmFtIHtudW1iZXJ9IC0gUGVyY2VudCB2YWx1ZSBpbiBpbnRlZ2VyIGZvcm1hdC5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0c2tpcFRvUGVyY2VudChwZXJjZW50KSB7XG5cdFx0aWYgKHBlcmNlbnQgPCAwIHx8IHBlcmNlbnQgPiAxMDApIHRocm93IFwiUGVyY2VudCBtdXN0IGJlIG51bWJlciBiZXR3ZWVuIDEgYW5kIDEwMC5cIjtcblx0XHR0aGlzLnNraXBUb1RpY2soTWF0aC5yb3VuZChwZXJjZW50IC8gMTAwICogdGhpcy50b3RhbFRpY2tzKSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU2tpcHMgcGxheWVyIHBvaW50ZXIgdG8gc3BlY2lmaWVkIHNlY29uZHMuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSAtIFNlY29uZHMgdG8gc2tpcCB0by5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0c2tpcFRvU2Vjb25kcyhzZWNvbmRzKSB7XG5cdFx0dmFyIHNvbmdUaW1lID0gdGhpcy5nZXRTb25nVGltZSgpO1xuXHRcdGlmIChzZWNvbmRzIDwgMCB8fCBzZWNvbmRzID4gc29uZ1RpbWUpIHRocm93IHNlY29uZHMgKyBcIiBzZWNvbmRzIG5vdCB3aXRoaW4gc29uZyB0aW1lIG9mIFwiICsgc29uZ1RpbWU7XG5cdFx0dGhpcy5za2lwVG9QZXJjZW50KHNlY29uZHMgLyBzb25nVGltZSAqIDEwMCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIHBsYXllciBpcyBwbGF5aW5nXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59XG5cdCAqL1xuXHRpc1BsYXlpbmcoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0SW50ZXJ2YWxJZCA+IDAgfHwgdHlwZW9mIHRoaXMuc2V0SW50ZXJ2YWxJZCA9PT0gJ29iamVjdCc7XG5cdH1cblxuXHQvKipcblx0ICogUGxheXMgdGhlIGxvYWRlZCBNSURJIGZpbGUgd2l0aG91dCByZWdhcmQgZm9yIHRpbWluZyBhbmQgc2F2ZXMgZXZlbnRzIGluIHRoaXMuZXZlbnRzLiAgRXNzZW50aWFsbHkgdXNlZCBhcyBhIHBhcnNlci5cblx0ICogQHJldHVybiB7UGxheWVyfVxuXHQgKi9cblx0ZHJ5UnVuKCkge1xuXHRcdC8vIFJlc2V0IHRyYWNrcyBmaXJzdFxuXHRcdHRoaXMucmVzZXRUcmFja3MoKTtcblx0XHR3aGlsZSAoIXRoaXMuZW5kT2ZGaWxlKCkpIHRoaXMucGxheUxvb3AodHJ1ZSk7XG5cdFx0dGhpcy5ldmVudHMgPSB0aGlzLmdldEV2ZW50cygpO1xuXHRcdHRoaXMudG90YWxFdmVudHMgPSB0aGlzLmdldFRvdGFsRXZlbnRzKCk7XG5cdFx0dGhpcy50b3RhbFRpY2tzID0gdGhpcy5nZXRUb3RhbFRpY2tzKCk7XG5cdFx0dGhpcy5zdGFydFRpY2sgPSAwO1xuXHRcdHRoaXMuc3RhcnRUaW1lID0gMDtcblxuXHRcdC8vIExlYXZlIHRyYWNrcyBpbiBwcmlzdGluZSBjb25kaXNoXG5cdFx0dGhpcy5yZXNldFRyYWNrcygpO1xuXG5cdFx0Ly9jb25zb2xlLmxvZygnU29uZyB0aW1lOiAnICsgdGhpcy5nZXRTb25nVGltZSgpICsgJyBzZWNvbmRzIC8gJyArIHRoaXMudG90YWxUaWNrcyArICcgdGlja3MuJyk7XG5cblx0XHR0aGlzLnRyaWdnZXJQbGF5ZXJFdmVudCgnZmlsZUxvYWRlZCcsIHRoaXMpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlc2V0cyBwbGF5IHBvaW50ZXJzIGZvciBhbGwgdHJhY2tzLlxuXHQgKiBAcmV0dXJuIHtQbGF5ZXJ9XG5cdCAqL1xuXHRyZXNldFRyYWNrcygpIHtcblx0XHR0aGlzLnRyYWNrcy5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLnJlc2V0KCkpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgYW4gYXJyYXkgb2YgZXZlbnRzIGdyb3VwZWQgYnkgdHJhY2suXG5cdCAqIEByZXR1cm4ge2FycmF5fVxuXHQgKi9cblx0Z2V0RXZlbnRzKCkge1xuXHRcdHJldHVybiB0aGlzLnRyYWNrcy5tYXAodHJhY2sgPT4gdHJhY2suZXZlbnRzKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHRvdGFsIG51bWJlciBvZiB0aWNrcyBpbiB0aGUgbG9hZGVkIE1JREkgZmlsZS5cblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0Z2V0VG90YWxUaWNrcygpIHtcblx0XHRyZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgdGhpcy50cmFja3MubWFwKHRyYWNrID0+IHRyYWNrLmRlbHRhKSk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0b3RhbCBudW1iZXIgb2YgZXZlbnRzIGluIHRoZSBsb2FkZWQgTUlESSBmaWxlLlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRnZXRUb3RhbEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy50cmFja3MucmVkdWNlKChhLCBiKSA9PiB7cmV0dXJuIHtldmVudHM6IHtsZW5ndGg6IGEuZXZlbnRzLmxlbmd0aCArIGIuZXZlbnRzLmxlbmd0aH19fSwge2V2ZW50czoge2xlbmd0aDogMH19KS5ldmVudHMubGVuZ3RoO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgc29uZyBkdXJhdGlvbiBpbiBzZWNvbmRzLlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRnZXRTb25nVGltZSgpIHtcblx0XHRyZXR1cm4gdGhpcy50b3RhbFRpY2tzIC8gdGhpcy5kaXZpc2lvbiAvIHRoaXMudGVtcG8gKiA2MDtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHJlbWFpbmluZyBudW1iZXIgb2Ygc2Vjb25kcyBpbiBwbGF5YmFjay5cblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0Z2V0U29uZ1RpbWVSZW1haW5pbmcoKSB7XG5cdFx0cmV0dXJuIE1hdGgucm91bmQoKHRoaXMudG90YWxUaWNrcyAtIHRoaXMuZ2V0Q3VycmVudFRpY2soKSkgLyB0aGlzLmRpdmlzaW9uIC8gdGhpcy50ZW1wbyAqIDYwKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHJlbWFpbmluZyBwZXJjZW50IG9mIHBsYXliYWNrLlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRnZXRTb25nUGVyY2VudFJlbWFpbmluZygpIHtcblx0XHRyZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmdldFNvbmdUaW1lUmVtYWluaW5nKCkgLyB0aGlzLmdldFNvbmdUaW1lKCkgKiAxMDApO1xuXHR9XG5cblx0LyoqXG5cdCAqIE51bWJlciBvZiBieXRlcyBwcm9jZXNzZWQgaW4gdGhlIGxvYWRlZCBNSURJIGZpbGUuXG5cdCAqIEByZXR1cm4ge251bWJlcn1cblx0ICovXG5cdGJ5dGVzUHJvY2Vzc2VkKCkge1xuXHRcdC8vIEN1cnJlbnRseSBhc3N1bWUgaGVhZGVyIGNodW5rIGlzIHN0cmljdGx5IDE0IGJ5dGVzXG5cdFx0cmV0dXJuIDE0ICsgdGhpcy50cmFja3MubGVuZ3RoICogOCArIHRoaXMudHJhY2tzLnJlZHVjZSgoYSwgYikgPT4ge3JldHVybiB7cG9pbnRlcjogYS5wb2ludGVyICsgYi5wb2ludGVyfX0sIHtwb2ludGVyOiAwfSkucG9pbnRlcjtcblx0fVxuXG5cdC8qKlxuXHQgKiBOdW1iZXIgb2YgZXZlbnRzIHBsYXllZCB1cCB0byB0aGlzIHBvaW50LlxuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRldmVudHNQbGF5ZWQoKSB7XG5cdFx0cmV0dXJuIHRoaXMudHJhY2tzLnJlZHVjZSgoYSwgYikgPT4ge3JldHVybiB7ZXZlbnRJbmRleDogYS5ldmVudEluZGV4ICsgYi5ldmVudEluZGV4fX0sIHtldmVudEluZGV4OiAwfSkuZXZlbnRJbmRleDtcblx0fVxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIHRoZSBwbGF5ZXIgcG9pbnRlciBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBsb2FkZWQgTUlESSBmaWxlLlxuXHQgKiBVc2VkIGluIHR3byB3YXlzOlxuXHQgKiAxLiBJZiBwbGF5aW5nIHJlc3VsdCBpcyBiYXNlZCBvbiBsb2FkZWQgSlNPTiBldmVudHMuXG5cdCAqIDIuIElmIHBhcnNpbmcgKGRyeVJ1bikgaXQncyBiYXNlZCBvbiB0aGUgYWN0dWFsIGJ1ZmZlciBsZW5ndGggdnMgYnl0ZXMgcHJvY2Vzc2VkLlxuXHQgKiBAcmV0dXJuIHtib29sZWFufVxuXHQgKi9cblx0ZW5kT2ZGaWxlKCkge1xuXHRcdGlmICh0aGlzLmlzUGxheWluZygpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy50b3RhbFRpY2tzIC0gdGhpcy50aWNrIDw9IDA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuYnl0ZXNQcm9jZXNzZWQoKSA9PSB0aGlzLmJ1ZmZlci5sZW5ndGg7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0aGUgY3VycmVudCB0aWNrIG51bWJlciBpbiBwbGF5YmFjay5cblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0Z2V0Q3VycmVudFRpY2soKSB7XG5cdFx0aWYoIXRoaXMuc3RhcnRUaW1lICYmIHRoaXMudGljaykgcmV0dXJuIHRoaXMuc3RhcnRUaWNrO1xuXHRcdGVsc2UgaWYoIXRoaXMuc3RhcnRUaW1lKSByZXR1cm4gMDtcblx0XHRyZXR1cm4gTWF0aC5yb3VuZCgoKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAtIHRoaXMuc3RhcnRUaW1lKSAvIDEwMDAgKiAodGhpcy5kaXZpc2lvbiAqICh0aGlzLnRlbXBvIC8gNjApKSkgKyB0aGlzLnN0YXJ0VGljaztcblx0fVxuXG5cdC8qKlxuXHQgKiBTZW5kcyBNSURJIGV2ZW50IG91dCB0byBsaXN0ZW5lci5cblx0ICogQHBhcmFtIHtvYmplY3R9XG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdGVtaXRFdmVudChldmVudCkge1xuXHRcdHRoaXMudHJpZ2dlclBsYXllckV2ZW50KCdtaWRpRXZlbnQnLCBldmVudCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU3Vic2NyaWJlcyBldmVudHMgdG8gbGlzdGVuZXJzXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSAtIE5hbWUgb2YgZXZlbnQgdG8gc3Vic2NyaWJlIHRvLlxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSAtIENhbGxiYWNrIHRvIGZpcmUgd2hlbiBldmVudCBpcyBicm9hZGNhc3QuXG5cdCAqIEByZXR1cm4ge1BsYXllcn1cblx0ICovXG5cdG9uKHBsYXllckV2ZW50LCBmbikge1xuXHRcdGlmICghdGhpcy5ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShwbGF5ZXJFdmVudCkpIHRoaXMuZXZlbnRMaXN0ZW5lcnNbcGxheWVyRXZlbnRdID0gW107XG5cdFx0dGhpcy5ldmVudExpc3RlbmVyc1twbGF5ZXJFdmVudF0ucHVzaChmbik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogQnJvYWRjYXN0cyBldmVudCB0byB0cmlnZ2VyIHN1YnNjcmliZWQgY2FsbGJhY2tzLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gLSBOYW1lIG9mIGV2ZW50LlxuXHQgKiBAcGFyYW0ge29iamVjdH0gLSBEYXRhIHRvIGJlIHBhc3NlZCB0byBzdWJzY3JpYmVyIGNhbGxiYWNrLlxuXHQgKiBAcmV0dXJuIHtQbGF5ZXJ9XG5cdCAqL1xuXHR0cmlnZ2VyUGxheWVyRXZlbnQocGxheWVyRXZlbnQsIGRhdGEpIHtcblx0XHRpZiAodGhpcy5ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShwbGF5ZXJFdmVudCkpIHRoaXMuZXZlbnRMaXN0ZW5lcnNbcGxheWVyRXZlbnRdLmZvckVhY2goZm4gPT4gZm4oZGF0YSB8fCB7fSkpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn1cblxuZXhwb3J0cy5QbGF5ZXIgPSBQbGF5ZXI7XG4iLCJjb25zdCBDb25zdGFudHMgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIikuQ29uc3RhbnRzO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5VdGlscztcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSB0cmFjay4gIENvbnRhaW5zIG1ldGhvZHMgZm9yIHBhcnNpbmcgZXZlbnRzIGFuZCBrZWVwaW5nIHRyYWNrIG9mIHBvaW50ZXIuXG4gKi9cbmNsYXNzIFRyYWNrXHR7XG5cdGNvbnN0cnVjdG9yKGluZGV4LCBkYXRhKSB7XG5cdFx0dGhpcy5lbmFibGVkID0gdHJ1ZTtcblx0XHR0aGlzLmV2ZW50SW5kZXggPSAwO1xuXHRcdHRoaXMucG9pbnRlciA9IDA7XG5cdFx0dGhpcy5sYXN0VGljayA9IDA7XG5cdFx0dGhpcy5sYXN0U3RhdHVzID0gbnVsbDtcblx0XHR0aGlzLmluZGV4ID0gaW5kZXg7XG5cdFx0dGhpcy5kYXRhID0gZGF0YTtcblx0XHR0aGlzLmRlbHRhID0gMDtcblx0XHR0aGlzLnJ1bm5pbmdEZWx0YSA9IDA7XG5cdFx0dGhpcy5ldmVudHMgPSBbXTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNldHMgYWxsIHN0YXRlZnVsIHRyYWNrIGluZm9ybWFpb24gdXNlZCBkdXJpbmcgcGxheWJhY2suXG5cdCAqIEByZXR1cm4ge1RyYWNrfVxuXHQgKi9cblx0cmVzZXQoKSB7XG5cdFx0dGhpcy5lbmFibGVkID0gdHJ1ZTtcblx0XHR0aGlzLmV2ZW50SW5kZXggPSAwO1xuXHRcdHRoaXMucG9pbnRlciA9IDA7XG5cdFx0dGhpcy5sYXN0VGljayA9IDA7XG5cdFx0dGhpcy5sYXN0U3RhdHVzID0gbnVsbDtcblx0XHR0aGlzLmRlbHRhID0gMDtcblx0XHR0aGlzLnJ1bm5pbmdEZWx0YSA9IDA7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogU2V0cyB0aGlzIHRyYWNrIHRvIGJlIGVuYWJsZWQgZHVyaW5nIHBsYXliYWNrLlxuXHQgKiBAcmV0dXJuIHtUcmFja31cblx0ICovXG5cdGVuYWJsZSgpIHtcblx0XHR0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNldHMgdGhpcyB0cmFjayB0byBiZSBkaXNhYmxlZCBkdXJpbmcgcGxheWJhY2suXG5cdCAqIEByZXR1cm4ge1RyYWNrfVxuXHQgKi9cblx0ZGlzYWJsZSgpIHtcblx0XHR0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSB0cmFjayBldmVudCBpbmRleCB0byB0aGUgbmVhcmVzdCBldmVudCB0byB0aGUgZ2l2ZW4gdGljay5cblx0ICogQHBhcmFtIHtudW1iZXJ9IHRpY2tcblx0ICogQHJldHVybiB7VHJhY2t9XG5cdCAqL1xuXHRzZXRFdmVudEluZGV4QnlUaWNrKHRpY2spIHtcblx0XHR0aWNrID0gdGljayB8fCAwO1xuXG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzLmV2ZW50cykge1xuXHRcdFx0aWYgKHRoaXMuZXZlbnRzW2ldLnRpY2sgPj0gdGljaykge1xuXHRcdFx0XHR0aGlzLmV2ZW50SW5kZXggPSBpO1xuXHRcdFx0XHRyZXR1cm4gdGhpcztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyBieXRlIGxvY2F0ZWQgYXQgcG9pbnRlciBwb3NpdGlvbi5cblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0Z2V0Q3VycmVudEJ5dGUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnBvaW50ZXJdO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgY291bnQgb2YgZGVsdGEgYnl0ZXMgYW5kIGN1cnJlbnQgcG9pbnRlciBwb3NpdGlvbi5cblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0Z2V0RGVsdGFCeXRlQ291bnQoKSB7XG5cdFx0Ly8gR2V0IGJ5dGUgY291bnQgb2YgZGVsdGEgVkxWXG5cdFx0Ly8gaHR0cDovL3d3dy5jY2FyaC5vcmcvY291cnNlcy8yNTMvaGFuZG91dC92bHYvXG5cdFx0Ly8gSWYgYnl0ZSBpcyBncmVhdGVyIG9yIGVxdWFsIHRvIDgwaCAoMTI4IGRlY2ltYWwpIHRoZW4gdGhlIG5leHQgYnl0ZVxuXHQgICAgLy8gaXMgYWxzbyBwYXJ0IG9mIHRoZSBWTFYsXG5cdCAgIFx0Ly8gZWxzZSBieXRlIGlzIHRoZSBsYXN0IGJ5dGUgaW4gYSBWTFYuXG5cdCAgIFx0dmFyIGN1cnJlbnRCeXRlID0gdGhpcy5nZXRDdXJyZW50Qnl0ZSgpO1xuXHQgICBcdHZhciBieXRlQ291bnQgPSAxO1xuXG5cdFx0d2hpbGUgKGN1cnJlbnRCeXRlID49IDEyOCkge1xuXHRcdFx0Y3VycmVudEJ5dGUgPSB0aGlzLmRhdGFbdGhpcy5wb2ludGVyICsgYnl0ZUNvdW50XTtcblx0XHRcdGJ5dGVDb3VudCsrO1xuXHRcdH1cblxuXHRcdHJldHVybiBieXRlQ291bnQ7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IGRlbHRhIHZhbHVlIGF0IGN1cnJlbnQgcG9pbnRlciBwb3NpdGlvbi5cblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0Z2V0RGVsdGEoKSB7XG5cdFx0cmV0dXJuIFV0aWxzLnJlYWRWYXJJbnQodGhpcy5kYXRhLnN1YmFycmF5KHRoaXMucG9pbnRlciwgdGhpcy5wb2ludGVyICsgdGhpcy5nZXREZWx0YUJ5dGVDb3VudCgpKSk7XG5cdH1cblxuXHQvKipcblx0ICogSGFuZGxlcyBldmVudCB3aXRoaW4gYSBnaXZlbiB0cmFjayBzdGFydGluZyBhdCBzcGVjaWZpZWQgaW5kZXhcblx0ICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRUaWNrXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gZHJ5UnVuIC0gSWYgdHJ1ZSBldmVudHMgd2lsbCBiZSBwYXJzZWQgYW5kIHJldHVybmVkIHJlZ2FyZGxlc3Mgb2YgdGltZS5cblx0ICovXG5cdGhhbmRsZUV2ZW50KGN1cnJlbnRUaWNrLCBkcnlSdW4pIHtcblx0XHRkcnlSdW4gPSBkcnlSdW4gfHwgZmFsc2U7XG5cblx0XHRpZiAoZHJ5UnVuKSB7XG5cdFx0XHR2YXIgZWxhcHNlZFRpY2tzID0gY3VycmVudFRpY2sgLSB0aGlzLmxhc3RUaWNrO1xuXHRcdFx0dmFyIGRlbHRhID0gdGhpcy5nZXREZWx0YSgpO1xuXHRcdFx0dmFyIGV2ZW50UmVhZHkgPSBlbGFwc2VkVGlja3MgPj0gZGVsdGE7XG5cblx0XHRcdGlmICh0aGlzLnBvaW50ZXIgPCB0aGlzLmRhdGEubGVuZ3RoICYmIChkcnlSdW4gfHwgZXZlbnRSZWFkeSkpIHtcblx0XHRcdFx0bGV0IGV2ZW50ID0gdGhpcy5wYXJzZUV2ZW50KCk7XG5cdFx0XHRcdGlmICh0aGlzLmVuYWJsZWQpIHJldHVybiBldmVudDtcblx0XHRcdFx0Ly8gUmVjdXJzaXZlbHkgY2FsbCB0aGlzIGZ1bmN0aW9uIGZvciBlYWNoIGV2ZW50IGFoZWFkIHRoYXQgaGFzIDAgZGVsdGEgdGltZT9cblx0XHRcdH1cblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBMZXQncyBhY3R1YWxseSBwbGF5IHRoZSBNSURJIGZyb20gdGhlIGdlbmVyYXRlZCBKU09OIGV2ZW50cyBjcmVhdGVkIGJ5IHRoZSBkcnkgcnVuLlxuXHRcdFx0aWYgKHRoaXMuZXZlbnRzW3RoaXMuZXZlbnRJbmRleF0gJiYgdGhpcy5ldmVudHNbdGhpcy5ldmVudEluZGV4XS50aWNrIDw9IGN1cnJlbnRUaWNrKSB7XG5cdFx0XHRcdHRoaXMuZXZlbnRJbmRleCsrO1xuXHRcdFx0XHRpZiAodGhpcy5lbmFibGVkKSByZXR1cm4gdGhpcy5ldmVudHNbdGhpcy5ldmVudEluZGV4IC0gMV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHQvKipcblx0ICogR2V0IHN0cmluZyBkYXRhIGZyb20gZXZlbnQuXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBldmVudFN0YXJ0SW5kZXhcblx0ICogQHJldHVybiB7c3RyaW5nfVxuXHQgKi9cblx0Z2V0U3RyaW5nRGF0YShldmVudFN0YXJ0SW5kZXgpIHtcblx0XHR2YXIgY3VycmVudEJ5dGUgPSB0aGlzLnBvaW50ZXI7XG5cdFx0dmFyIGJ5dGVDb3VudCA9IDE7XG5cdFx0dmFyIGxlbmd0aCA9IFV0aWxzLnJlYWRWYXJJbnQodGhpcy5kYXRhLnN1YmFycmF5KGV2ZW50U3RhcnRJbmRleCArIDIsIGV2ZW50U3RhcnRJbmRleCArIDIgKyBieXRlQ291bnQpKTtcblx0XHR2YXIgc3RyaW5nTGVuZ3RoID0gbGVuZ3RoO1xuXG5cdFx0cmV0dXJuIFV0aWxzLmJ5dGVzVG9MZXR0ZXJzKHRoaXMuZGF0YS5zdWJhcnJheShldmVudFN0YXJ0SW5kZXggKyBieXRlQ291bnQgKyAyLCBldmVudFN0YXJ0SW5kZXggKyBieXRlQ291bnQgKyBsZW5ndGggKyAyKSk7XG5cdH1cblxuXHQvKipcblx0ICogUGFyc2VzIGV2ZW50IGludG8gSlNPTiBhbmQgYWR2YW5jZXMgcG9pbnRlciBmb3IgdGhlIHRyYWNrXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICovXG5cdHBhcnNlRXZlbnQoKSB7XG5cdFx0dmFyIGV2ZW50U3RhcnRJbmRleCA9IHRoaXMucG9pbnRlciArIHRoaXMuZ2V0RGVsdGFCeXRlQ291bnQoKTtcblx0XHR2YXIgZXZlbnRKc29uID0ge307XG5cdFx0dmFyIGRlbHRhQnl0ZUNvdW50ID0gdGhpcy5nZXREZWx0YUJ5dGVDb3VudCgpO1xuXHRcdGV2ZW50SnNvbi50cmFjayA9IHRoaXMuaW5kZXggKyAxO1xuXHRcdGV2ZW50SnNvbi5kZWx0YSA9IHRoaXMuZ2V0RGVsdGEoKTtcblx0XHR0aGlzLmxhc3RUaWNrID0gdGhpcy5sYXN0VGljayArIGV2ZW50SnNvbi5kZWx0YTtcblx0XHR0aGlzLnJ1bm5pbmdEZWx0YSArPSBldmVudEpzb24uZGVsdGE7XG5cdFx0ZXZlbnRKc29uLnRpY2sgPSB0aGlzLnJ1bm5pbmdEZWx0YTtcblx0XHRldmVudEpzb24uYnl0ZUluZGV4ID0gdGhpcy5wb2ludGVyO1xuXG5cdFx0Ly9ldmVudEpzb24ucmF3ID0gZXZlbnQ7XG5cdFx0aWYgKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdID09IDB4ZmYpIHtcblx0XHRcdC8vIE1ldGEgRXZlbnRcblxuXHRcdFx0Ly8gSWYgdGhpcyBpcyBhIG1ldGEgZXZlbnQgd2Ugc2hvdWxkIGVtaXQgdGhlIGRhdGEgYW5kIGltbWVkaWF0ZWx5IG1vdmUgdG8gdGhlIG5leHQgZXZlbnRcblx0XHRcdC8vIG90aGVyd2lzZSBpZiB3ZSBsZXQgaXQgcnVuIHRocm91Z2ggdGhlIG5leHQgY3ljbGUgYSBzbGlnaHQgZGVsYXkgd2lsbCBhY2N1bXVsYXRlIGlmIG11bHRpcGxlIHRyYWNrc1xuXHRcdFx0Ly8gYXJlIGJlaW5nIHBsYXllZCBzaW11bHRhbmVvdXNseVxuXG5cdFx0XHRzd2l0Y2godGhpcy5kYXRhW2V2ZW50U3RhcnRJbmRleCArIDFdKSB7XG5cdFx0XHRcdGNhc2UgMHgwMDogLy8gU2VxdWVuY2UgTnVtYmVyXG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnU2VxdWVuY2UgTnVtYmVyJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAweDAxOiAvLyBUZXh0IEV2ZW50XG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnVGV4dCBFdmVudCc7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnN0cmluZyA9IHRoaXMuZ2V0U3RyaW5nRGF0YShldmVudFN0YXJ0SW5kZXgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4MDI6IC8vIENvcHlyaWdodCBOb3RpY2Vcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdDb3B5cmlnaHQgTm90aWNlJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAweDAzOiAvLyBTZXF1ZW5jZS9UcmFjayBOYW1lXG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnU2VxdWVuY2UvVHJhY2sgTmFtZSc7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnN0cmluZyA9IHRoaXMuZ2V0U3RyaW5nRGF0YShldmVudFN0YXJ0SW5kZXgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4MDQ6IC8vIEluc3RydW1lbnQgTmFtZVxuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ0luc3RydW1lbnQgTmFtZSc7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnN0cmluZyA9IHRoaXMuZ2V0U3RyaW5nRGF0YShldmVudFN0YXJ0SW5kZXgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4MDU6IC8vIEx5cmljXG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnTHlyaWMnO1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5zdHJpbmcgPSB0aGlzLmdldFN0cmluZ0RhdGEoZXZlbnRTdGFydEluZGV4KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAweDA2OiAvLyBNYXJrZXJcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdNYXJrZXInO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4MDc6IC8vIEN1ZSBQb2ludFxuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ0N1ZSBQb2ludCc7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnN0cmluZyA9IHRoaXMuZ2V0U3RyaW5nRGF0YShldmVudFN0YXJ0SW5kZXgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4MDk6IC8vIERldmljZSBOYW1lXG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnRGV2aWNlIE5hbWUnO1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5zdHJpbmcgPSB0aGlzLmdldFN0cmluZ0RhdGEoZXZlbnRTdGFydEluZGV4KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAweDIwOiAvLyBNSURJIENoYW5uZWwgUHJlZml4XG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnTUlESSBDaGFubmVsIFByZWZpeCc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgMHgyMTogLy8gTUlESSBQb3J0XG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnTUlESSBQb3J0Jztcblx0XHRcdFx0XHRldmVudEpzb24uZGF0YSA9IFV0aWxzLmJ5dGVzVG9OdW1iZXIoW3RoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAzXV0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4MkY6IC8vIEVuZCBvZiBUcmFja1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ0VuZCBvZiBUcmFjayc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgMHg1MTogLy8gU2V0IFRlbXBvXG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnU2V0IFRlbXBvJztcblx0XHRcdFx0XHRldmVudEpzb24uZGF0YSA9IE1hdGgucm91bmQoNjAwMDAwMDAgLyBVdGlscy5ieXRlc1RvTnVtYmVyKHRoaXMuZGF0YS5zdWJhcnJheShldmVudFN0YXJ0SW5kZXggKyAzLCBldmVudFN0YXJ0SW5kZXggKyA2KSkpO1xuXHRcdFx0XHRcdHRoaXMudGVtcG8gPSBldmVudEpzb24uZGF0YTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAweDU0OiAvLyBTTVRQRSBPZmZzZXRcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdTTVRQRSBPZmZzZXQnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIDB4NTg6IC8vIFRpbWUgU2lnbmF0dXJlXG5cdFx0XHRcdFx0Ly8gRkYgNTggMDQgbm4gZGQgY2MgYmJcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdUaW1lIFNpZ25hdHVyZSc7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLmRhdGEgPSB0aGlzLmRhdGEuc3ViYXJyYXkoZXZlbnRTdGFydEluZGV4ICsgMywgZXZlbnRTdGFydEluZGV4ICsgNyk7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnRpbWVTaWduYXR1cmUgPSBcIlwiICsgZXZlbnRKc29uLmRhdGFbMF0gKyBcIi9cIiArIE1hdGgucG93KDIsIGV2ZW50SnNvbi5kYXRhWzFdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAweDU5OiAvLyBLZXkgU2lnbmF0dXJlXG5cdFx0XHRcdFx0Ly8gRkYgNTkgMDIgc2YgbWlcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdLZXkgU2lnbmF0dXJlJztcblx0XHRcdFx0XHRldmVudEpzb24uZGF0YSA9IHRoaXMuZGF0YS5zdWJhcnJheShldmVudFN0YXJ0SW5kZXggKyAzLCBldmVudFN0YXJ0SW5kZXggKyA1KTtcblxuXHRcdFx0XHRcdGlmIChldmVudEpzb24uZGF0YVswXSA+PSAwKSB7XG5cdFx0XHRcdFx0XHRldmVudEpzb24ua2V5U2lnbmF0dXJlID0gQ29uc3RhbnRzLkNJUkNMRV9PRl9GSUZUSFNbZXZlbnRKc29uLmRhdGFbMF1dO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChldmVudEpzb24uZGF0YVswXSA8IDApIHtcblx0XHRcdFx0XHRcdGV2ZW50SnNvbi5rZXlTaWduYXR1cmUgPSBDb25zdGFudHMuQ0lSQ0xFX09GX0ZPVVJUSFNbTWF0aC5hYnMoZXZlbnRKc29uLmRhdGFbMF0pXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZXZlbnRKc29uLmRhdGFbMV0gPT0gMCkge1xuXHRcdFx0XHRcdFx0ZXZlbnRKc29uLmtleVNpZ25hdHVyZSArPSBcIiBNYWpvclwiO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChldmVudEpzb24uZGF0YVsxXSA9PSAxKSB7XG5cdFx0XHRcdFx0XHRldmVudEpzb24ua2V5U2lnbmF0dXJlICs9IFwiIE1pbm9yXCI7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgMHg3RjogLy8gU2VxdWVuY2VyLVNwZWNpZmljIE1ldGEtZXZlbnRcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdTZXF1ZW5jZXItU3BlY2lmaWMgTWV0YS1ldmVudCc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnVW5rbm93bjogJyArIHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAxXS50b1N0cmluZygxNik7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBsZW5ndGggPSB0aGlzLmRhdGFbdGhpcy5wb2ludGVyICsgZGVsdGFCeXRlQ291bnQgKyAyXTtcblx0XHRcdC8vIFNvbWUgbWV0YSBldmVudHMgd2lsbCBoYXZlIHZsdiB0aGF0IG5lZWRzIHRvIGJlIGhhbmRsZWRcblxuXHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMyArIGxlbmd0aDtcblxuXHRcdH0gZWxzZSBpZih0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4XSA9PSAweGYwKSB7XG5cdFx0XHQvLyBTeXNleFxuXHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnU3lzZXgnO1xuXHRcdFx0dmFyIGxlbmd0aCA9IHRoaXMuZGF0YVt0aGlzLnBvaW50ZXIgKyBkZWx0YUJ5dGVDb3VudCArIDFdO1xuXHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMiArIGxlbmd0aDtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBWb2ljZSBldmVudFxuXHRcdFx0aWYgKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdIDwgMHg4MCkge1xuXHRcdFx0XHQvLyBSdW5uaW5nIHN0YXR1c1xuXHRcdFx0XHRldmVudEpzb24ucnVubmluZyA9IHRydWU7XG5cdFx0XHRcdGV2ZW50SnNvbi5ub3RlTnVtYmVyID0gdGhpcy5kYXRhW2V2ZW50U3RhcnRJbmRleF07XG5cdFx0XHRcdGV2ZW50SnNvbi5ub3RlTmFtZSA9IENvbnN0YW50cy5OT1RFU1t0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4XV07XG5cdFx0XHRcdGV2ZW50SnNvbi52ZWxvY2l0eSA9IHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAxXTtcblxuXHRcdFx0XHRpZiAodGhpcy5sYXN0U3RhdHVzIDw9IDB4OGYpIHtcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdOb3RlIG9mZic7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLmNoYW5uZWwgPSB0aGlzLmxhc3RTdGF0dXMgLSAweDgwICsgMTtcblxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMubGFzdFN0YXR1cyA8PSAweDlmKSB7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnTm90ZSBvbic7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLmNoYW5uZWwgPSB0aGlzLmxhc3RTdGF0dXMgLSAweDkwICsgMTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMucG9pbnRlciArPSBkZWx0YUJ5dGVDb3VudCArIDI7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMubGFzdFN0YXR1cyA9IHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdO1xuXG5cdFx0XHRcdGlmICh0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4XSA8PSAweDhmKSB7XG5cdFx0XHRcdFx0Ly8gTm90ZSBvZmZcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdOb3RlIG9mZic7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLmNoYW5uZWwgPSB0aGlzLmxhc3RTdGF0dXMgLSAweDgwICsgMTtcblx0XHRcdFx0XHRldmVudEpzb24ubm90ZU51bWJlciA9IHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAxXTtcblx0XHRcdFx0XHRldmVudEpzb24ubm90ZU5hbWUgPSBDb25zdGFudHMuTk9URVNbdGhpcy5kYXRhW2V2ZW50U3RhcnRJbmRleCArIDFdXTtcblx0XHRcdFx0XHRldmVudEpzb24udmVsb2NpdHkgPSBNYXRoLnJvdW5kKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAyXSAvIDEyNyAqIDEwMCk7XG5cdFx0XHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMztcblxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdIDw9IDB4OWYpIHtcblx0XHRcdFx0XHQvLyBOb3RlIG9uXG5cdFx0XHRcdFx0ZXZlbnRKc29uLm5hbWUgPSAnTm90ZSBvbic7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLmNoYW5uZWwgPSB0aGlzLmxhc3RTdGF0dXMgLSAweDkwICsgMTtcblx0XHRcdFx0XHRldmVudEpzb24ubm90ZU51bWJlciA9IHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAxXTtcblx0XHRcdFx0XHRldmVudEpzb24ubm90ZU5hbWUgPSBDb25zdGFudHMuTk9URVNbdGhpcy5kYXRhW2V2ZW50U3RhcnRJbmRleCArIDFdXTtcblx0XHRcdFx0XHRldmVudEpzb24udmVsb2NpdHkgPSBNYXRoLnJvdW5kKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAyXSAvIDEyNyAqIDEwMCk7XG5cdFx0XHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMztcblxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdIDw9IDB4YWYpIHtcblx0XHRcdFx0XHQvLyBQb2x5cGhvbmljIEtleSBQcmVzc3VyZVxuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ1BvbHlwaG9uaWMgS2V5IFByZXNzdXJlJztcblx0XHRcdFx0XHRldmVudEpzb24uY2hhbm5lbCA9IHRoaXMubGFzdFN0YXR1cyAtIDB4YTAgKyAxO1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5ub3RlID0gQ29uc3RhbnRzLk5PVEVTW3RoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXggKyAxXV07XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnByZXNzdXJlID0gZXZlbnRbMl07XG5cdFx0XHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMztcblxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdIDw9IDB4YmYpIHtcblx0XHRcdFx0XHQvLyBDb250cm9sbGVyIENoYW5nZVxuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ0NvbnRyb2xsZXIgQ2hhbmdlJztcblx0XHRcdFx0XHRldmVudEpzb24uY2hhbm5lbCA9IHRoaXMubGFzdFN0YXR1cyAtIDB4YjAgKyAxO1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5udW1iZXIgPSB0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4ICsgMV07XG5cdFx0XHRcdFx0ZXZlbnRKc29uLnZhbHVlID0gdGhpcy5kYXRhW2V2ZW50U3RhcnRJbmRleCArIDJdO1xuXHRcdFx0XHRcdHRoaXMucG9pbnRlciArPSBkZWx0YUJ5dGVDb3VudCArIDM7XG5cblx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4XSA8PSAweGNmKSB7XG5cdFx0XHRcdFx0Ly8gUHJvZ3JhbSBDaGFuZ2Vcblx0XHRcdFx0XHRldmVudEpzb24ubmFtZSA9ICdQcm9ncmFtIENoYW5nZSc7XG5cdFx0XHRcdFx0ZXZlbnRKc29uLmNoYW5uZWwgPSB0aGlzLmxhc3RTdGF0dXMgLSAweGMwICsgMTtcblx0XHRcdFx0XHRldmVudEpzb24udmFsdWUgPSB0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4ICsgMV07XG5cdFx0XHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMjtcblxuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZGF0YVtldmVudFN0YXJ0SW5kZXhdIDw9IDB4ZGYpIHtcblx0XHRcdFx0XHQvLyBDaGFubmVsIEtleSBQcmVzc3VyZVxuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ0NoYW5uZWwgS2V5IFByZXNzdXJlJztcblx0XHRcdFx0XHRldmVudEpzb24uY2hhbm5lbCA9IHRoaXMubGFzdFN0YXR1cyAtIDB4ZDAgKyAxO1xuXHRcdFx0XHRcdHRoaXMucG9pbnRlciArPSBkZWx0YUJ5dGVDb3VudCArIDI7XG5cblx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLmRhdGFbZXZlbnRTdGFydEluZGV4XSA8PSAweGVmKSB7XG5cdFx0XHRcdFx0Ly8gUGl0Y2ggQmVuZFxuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ1BpdGNoIEJlbmQnO1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5jaGFubmVsID0gdGhpcy5sYXN0U3RhdHVzIC0gMHhlMCArIDE7XG5cdFx0XHRcdFx0dGhpcy5wb2ludGVyICs9IGRlbHRhQnl0ZUNvdW50ICsgMztcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGV2ZW50SnNvbi5uYW1lID0gJ1Vua25vd24uICBQb2ludGVyOiAnICsgdGhpcy5wb2ludGVyLnRvU3RyaW5nKCkgKyAnICcgICsgZXZlbnRTdGFydEluZGV4LnRvU3RyaW5nKCkgKyAnICcgKyB0aGlzLmRhdGEubGVuZ3RoO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5kZWx0YSArPSBldmVudEpzb24uZGVsdGE7XG5cdFx0dGhpcy5ldmVudHMucHVzaChldmVudEpzb24pO1xuXG5cdFx0cmV0dXJuIGV2ZW50SnNvbjtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgcG9pbnRlciBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSB0cmFjay5cblx0ICogQHBhcmFtIHtib29sZWFufVxuXHQgKi9cblx0ZW5kT2ZUcmFjaygpIHtcblx0XHRpZiAodGhpcy5kYXRhW3RoaXMucG9pbnRlciArIDFdID09IDB4ZmYgJiYgdGhpcy5kYXRhW3RoaXMucG9pbnRlciArIDJdID09IDB4MmYgJiYgdGhpcy5kYXRhW3RoaXMucG9pbnRlciArIDNdID09IDB4MDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cy5UcmFjayA9IFRyYWNrOyIsIi8qKlxuICogQ29udGFpbnMgbWlzYyBzdGF0aWMgdXRpbGl0eSBtZXRob2RzLlxuICovXG5jbGFzcyBVdGlscyB7XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc2luZ2xlIGJ5dGUgdG8gYSBoZXggc3RyaW5nLlxuXHQgKiBAcGFyYW0ge251bWJlcn0gYnl0ZVxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdCAqL1xuXHRzdGF0aWMgYnl0ZVRvSGV4KGJ5dGUpIHtcblx0XHQvLyBFbnN1cmUgaGV4IHN0cmluZyBhbHdheXMgaGFzIHR3byBjaGFyc1xuXHRcdHJldHVybiAoJzAnICsgYnl0ZS50b1N0cmluZygxNikpLnNsaWNlKC0yKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhbiBhcnJheSBvZiBieXRlcyB0byBhIGhleCBzdHJpbmcuXG5cdCAqIEBwYXJhbSB7YXJyYXl9IGJ5dGVBcnJheVxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdCAqL1xuXHRzdGF0aWMgYnl0ZXNUb0hleChieXRlQXJyYXkpIHtcblx0XHR2YXIgaGV4ID0gW107XG5cdFx0Ynl0ZUFycmF5LmZvckVhY2goYnl0ZSA9PiBoZXgucHVzaChVdGlscy5ieXRlVG9IZXgoYnl0ZSkpKTtcblx0XHRyZXR1cm4gaGV4LmpvaW4oJycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgaGV4IHN0cmluZyB0byBhIG51bWJlci5cblx0ICogQHBhcmFtIHtzdHJpbmd9IGhleFN0cmluZ1xuXHQgKiBAcmV0dXJuIHtudW1iZXJ9XG5cdCAqL1xuXHRzdGF0aWMgaGV4VG9OdW1iZXIoaGV4U3RyaW5nKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KGhleFN0cmluZywgMTYpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGFuIGFycmF5IG9mIGJ5dGVzIHRvIGEgbnVtYmVyLlxuXHQgKiBAcGFyYW0ge2FycmF5fSBieXRlQXJyYXlcblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0c3RhdGljIGJ5dGVzVG9OdW1iZXIoYnl0ZUFycmF5KSB7XG5cdFx0cmV0dXJuIFV0aWxzLmhleFRvTnVtYmVyKFV0aWxzLmJ5dGVzVG9IZXgoYnl0ZUFycmF5KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYW4gYXJyYXkgb2YgYnl0ZXMgdG8gbGV0dGVycy5cblx0ICogQHBhcmFtIHthcnJheX0gYnl0ZUFycmF5XG5cdCAqIEByZXR1cm4ge3N0cmluZ31cblx0ICovXG5cdHN0YXRpYyBieXRlc1RvTGV0dGVycyhieXRlQXJyYXkpIHtcblx0XHR2YXIgbGV0dGVycyA9IFtdO1xuXHRcdGJ5dGVBcnJheS5mb3JFYWNoKGJ5dGUgPT4gbGV0dGVycy5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSkpKTtcblx0XHRyZXR1cm4gbGV0dGVycy5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGRlY2ltYWwgdG8gaXQncyBiaW5hcnkgcmVwcmVzZW50YXRpb24uXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkZWNcblx0ICogQHJldHVybiB7c3RyaW5nfVxuXHQgKi9cblx0c3RhdGljIGRlY1RvQmluYXJ5KGRlYykge1xuICAgIFx0cmV0dXJuIChkZWMgPj4+IDApLnRvU3RyaW5nKDIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlYWRzIGEgdmFyaWFibGUgbGVuZ3RoIHZhbHVlLlxuXHQgKiBAcGFyYW0ge2FycmF5fSBieXRlQXJyYXlcblx0ICogQHJldHVybiB7bnVtYmVyfVxuXHQgKi9cblx0c3RhdGljIHJlYWRWYXJJbnQoYnl0ZUFycmF5KSB7XG5cdFx0dmFyIHJlc3VsdCA9IDA7XG5cdFx0Ynl0ZUFycmF5LmZvckVhY2gobnVtYmVyID0+IHtcblx0XHRcdHZhciBiID0gbnVtYmVyO1xuXHRcdFx0aWYgKGIgJiAweDgwKSB7XG5cdFx0XHRcdHJlc3VsdCArPSAoYiAmIDB4N2YpO1xuXHRcdFx0XHRyZXN1bHQgPDw9IDc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvKiBiIGlzIHRoZSBsYXN0IGJ5dGUgKi9cblx0XHRcdFx0cmVzdWx0ICs9IGI7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0LyoqXG5cdCAqIERlY29kZXMgYmFzZS02NCBlbmNvZGVkIHN0cmluZ1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nXG5cdCAqIEByZXR1cm4ge3N0cmluZ31cblx0ICovXG5cdHN0YXRpYyBhdG9iKHN0cmluZykge1xuXHRcdGlmICh0eXBlb2YgYXRvYiA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGF0b2Ioc3RyaW5nKTtcblx0XHRyZXR1cm4gbmV3IEJ1ZmZlcihzdHJpbmcsICdiYXNlNjQnKS50b1N0cmluZygnYmluYXJ5Jyk7XG5cdH1cbn1cblxuZXhwb3J0cy5VdGlscyA9IFV0aWxzOyJdfQ==
