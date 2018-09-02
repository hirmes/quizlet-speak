/*

	The Chrome extension has one user preference: A dropdown menu that lists
	all available voices as well as a default option to attempt to automatically
	detect the voice.

	This file builds the dropdown and sets up a listener so that the choice the
	user makes is saved in localStorage.

	Because the voice list on Chrome must be gathered asynchronously, we add a
	listener to speechSynthesis.onvoiceschanged 

*/



// globals to avoid linter errors
var chrome = chrome;
var voices = voices;

function populateVoiceList() {

	voices = speechSynthesis.getVoices();

	if (typeof speechSynthesis === 'undefined') {
		let popupTitle = document.getElementById('popup-title');
		popupTitle.innerText = 'Could not find any synthetic voices';
		return;
	}
	// console.log('  speechSynthesis exists');

	let chooser = document.getElementById('language-chooser');

	if (chooser && voices && voices.length > 0) {

		let firstOption = document.createElement('option');
		firstOption.text = 'Attempt Language Detection';
		chooser.appendChild(firstOption);
		let dividerOption = document.createElement('option');
		dividerOption.text = '-------';
		dividerOption.disabled = 'disabled';
		chooser.appendChild(dividerOption);

		chrome.storage.sync.get(['voiceName'], function (data) {

			let voiceNamePref = data.voiceName;

			voices.sort( (a,b) => a.lang < b.lang ? -1 : 1 ); // sort alphabetically

			for (let voice of voices) {
				let voiceOption = document.createElement('option');
				voiceOption.text = voice.lang + ' (' + voice.name + ')';
				voiceOption.value = voice.name;
				chooser.appendChild(voiceOption);
				if (voiceNamePref == voice.name) {
					chooser.selectedIndex = voiceOption.index;
				}
			}
		});
		
		chooser.onchange = function() {
			var index = this.selectedIndex;
			chrome.storage.sync.set({ 'voiceName': this.children[index].value });
		};
	} else {
		// console.log('  voices do NOT exist');
		// chrome.runtime.sendMessage({
		// 	msg: 'popup needs voices'
		// });
	}

}

populateVoiceList();
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
	speechSynthesis.onvoiceschanged = populateVoiceList;
}