
/*
 	A bit hacky, but basically the way this works is:
 	- Use MutationObserver to wait for the DOM to change
 	- (filtering for items that have changed class (which includes new items))
 	- see if any elements with the class "notranslate" exist
 	  because that means there is one or more foreign words on the page
 	- Pull out the word and send a message to quizlet-speak.js where the text to
 	  speech code is
*/

// globals to avoid linter errors
var chrome = chrome;

let previousWord = '';

let findTextToSpeak = function () {
	// console.log("findTextToSpeak");
	let textToSpeak, languageIdentifier;

	let elArray = document.getElementsByClassName('notranslate');
	// console.log('elArray.length: ' + elArray.length);

	if (elArray.length > 0) {

		if (document.getElementsByClassName('SetPageHeader-termCount').length > 0 ||
			document.getElementsByClassName('AssistantCheckpointView').length > 0) { // ignore results page
			// console.log('non-learning screen, bailing');
			return;
		}

		// find the foreign language
		let pickedItem = {};
		if (elArray[0].classList.contains('lang-en') == false) {
			// console.log('found non-english item in 0');
			pickedItem = elArray[0];
		} else if (elArray.length == 2 && elArray[1].classList.contains('lang-en') == false) {
			// console.log('found non-english item in 1');
			pickedItem = elArray[1];
		} else {
			// console.log('top two matches both english, bailing');
			return;
		}

		languageIdentifier = '';
		for (let className of pickedItem.classList) {
			if (className.startsWith('lang') && className != 'lang-en') {
				languageIdentifier = className;
				languageIdentifier = languageIdentifier.replace('lang-','');
			} 
		}
		if (languageIdentifier == '' ) {
			// console.log('could not find foreign lang, bailing');
			return;
		}
		
		textToSpeak = pickedItem.textContent;
		// console.log('textToSpeak: ' + textToSpeak);

		if (previousWord != textToSpeak) {
			previousWord = textToSpeak;
			chrome.runtime.sendMessage({ msg: 'speak this text', textToSpeak: textToSpeak, languageIdentifier: languageIdentifier });
		} else {
			// console.log("i just said that");
		}

	} else {
		// console.log("could not find 'notranslate' element");
	}
};

const observer = new MutationObserver(() => {
	// console.log("MutationObserver");
	findTextToSpeak();
});

observer.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: ['class']
});