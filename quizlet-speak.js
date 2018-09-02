/*

	- First set up a listener that waits for a message from quizlet-speak.content-script.js	
	- If a message is received it means it is time to convert the text from that message to speech

 */


// globals to avoid linter errors
var chrome = chrome;
let voices;

let autoDetectMapping = {
	'iw': 'he-IL',	// Hebrew
	'no': 'nb-NO',	// Norwegian
	'cs': 'cs-CZ'	// Czech
};

chrome.runtime.onMessage.addListener(function (req, sender) {
	console.log('quizlet-speak onMessage ' + req.msg + ' (sender: ' + sender);
	if (req.msg == 'speak this text') {
		speak(req);
	} else {
		// console.log('quizlet-speak.js got a mesage it doesn\'t know what to do with: ' + req.msg);
	}

	return true;
});

function speak(textInfo, callback) {
	console.log('speak()');
	var u = new SpeechSynthesisUtterance();
	u.text = textInfo.textToSpeak;
	u.lang = 'en-US';
	console.log('  languageIdentifier: ' + textInfo.languageIdentifier);

	if (voices && voices.length > 0) {
		console.log('  voices found');
		let voiceNamePref = null, speechVoice;
		chrome.storage.sync.get(['voiceName'], function (data) {
			console.log('  data.voiceName: ' + data.voiceName);
			voiceNamePref = data.voiceName;

			if (voiceNamePref != null) {
				if (voiceNamePref == 'Attempt Language Detection') {
					// see if we can match the languageIdentifier with anything in our little db
					let matchedVoice = '';
					for (let key in autoDetectMapping) {
						console.log(key);
						if ( key == textInfo.languageIdentifier ) {
							console.log('found a match!');
							matchedVoice = autoDetectMapping[key];
						}
					}
					if ( matchedVoice != '' ) {
						// now we try to match the standard language ID (xx-XX) with the voices object
						// if there are mulitple hits, randomly choose one
						let matchedVoices = [];
						for (let voice in voices) {
							if ( voices[voice].lang == matchedVoice ) {
								// console.log('YES! a hit');
								matchedVoices.push(voices[voice]);
							}
						}
						if ( matchedVoices.length > 0 ) {
							speechVoice = matchedVoices[Math.floor(Math.random() * matchedVoices.length)];
						} else {
							// console.log('Weird-- we matched a languageIdentifier to something in autoDetectMapping, but then it didnt find a voice for it');
							return;
						}
					
					} else {
						// console.log('Could not auto match with this language (' + textInfo.languageIdentifier +').  Please select from the dropdown menu instead.');
						return;
					}
				} else {
					speechVoice = voices.filter(function (voice) {
						return voice.name == voiceNamePref;
					})[0];
				}	
			} else {
				speechVoice = voices.filter(function (voice) {
					return voice.name == 'Nora';
				})[0];
			}

			u.voice = speechVoice;
			u.rate = 1.0;
			u.text = textInfo.textToSpeak;

			speechSynthesis.speak(u);
		});

	} else {
		console.log('  TRIED TO SPEAK BUT I HAVE NO VOICE!');
	}

	u.onend = function () {
		if (callback) {
			callback();
		}
	};

	u.onerror = function (e) {
		if (callback) {
			callback(e);
		}
	};
}

function getVoiceList() {

	if (typeof speechSynthesis === 'undefined') {
		return;
	}
	// console.log('  speechSynthesis exists');

	voices = speechSynthesis.getVoices();

	if (voices && voices.length > 0) {
		voices.sort((a, b) => a.lang < b.lang ? -1 : 1); // sort alphabetically
	} else {
		console.log('  did NOT get voices');
	}

}

getVoiceList();
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
	speechSynthesis.onvoiceschanged = getVoiceList;
}