!function () {
	"use strict";

	// init highlight CSS
	var ruleExistenceDict = {};
	var sheet = (function () {
		var style = document.createElement("style");
		style.appendChild(document.createTextNode(""));	// WebKit hack @@
		document.head.appendChild(style);
		return style.sheet;
	})();

	// highlight word in DOM (textnode only)
	var highlightWordInTextNodeOnly = function (word, bgColorCode, result) {

		// skip empty word
		if (word == null || word.length === 0) return;

		// DOM tree walker
		var wordRegex = new RegExp(word, "gi");
		var treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
			acceptNode: function (node) {
				var result = NodeFilter.FILTER_SKIP;
				if (wordRegex.test(node.nodeValue)) result = NodeFilter.FILTER_ACCEPT;
				return result;
			}
		}, false);

		// get textnode
		var skipTagName = {
			"NOSCRIPT": true,
			"SCRIPT": true,
			"STYLE": true
		};
		var nodeList = [];
		while (treeWalker.nextNode()) {
			if (!skipTagName[treeWalker.currentNode.parentNode.tagName]) {
				nodeList.push(treeWalker.currentNode);
			}
		}

		// highlight all filtered textnode
		nodeList.forEach(function (n) {
			var rangeList = [];

			// find sub-string ranges
			var startingIndex = 0;
			do {
				// console.log(word, startingIndex, n.parentNode, n.textContent);
				startingIndex = n.textContent.indexOf(word, startingIndex + 1);
				if (startingIndex !== -1) {
					var wordRange = document.createRange();
					wordRange.setStart(n, startingIndex);
					wordRange.setEnd(n, startingIndex + word.length);
					rangeList.push(wordRange);
				}
			} while (startingIndex !== -1);

			// highlight all ranges
			rangeList.forEach(function (r) {
				highlightRange(r, bgColorCode, result);
			});
		});
	};
	// highlight word in DOM (keyword can be across multi tag)
	var highlightWordAcrossNode = function (word, bgColorCode, result) {

		// reset cursor
		window.getSelection().removeAllRanges();

		// find keyword ranges
		var rangeList = [];
		if (window.find(word, true, false, false, false, false, false)) {
			do {
				rangeList.push(window.getSelection().getRangeAt(0));
				// don't modify the range here, cursor in find() will be corrupted
			} while (window.find(word, true, false, false, false, false, false));
			// reset scroll position, window.find() will select the last word...
			window.scrollTo(0, 0);
		} else {
			console.log("[highlightWordAcrossNode] nothing found", word, bgColorCode, document.title);
		}

		// highlight all ranges
		rangeList.forEach(function (r) {
			highlightRange(r, bgColorCode, result);
		});
	};
	// highlight the keyword by surround it by `i`
	var highlightRange = function (range, bgColorCode, result) {

		// create wrapping i
		var iNode = document.createElement("i");
		var selectorName = iNode.className = "chrome-extension-highlight-".concat(bgColorCode);
		iNode.classList.add("chrome-extension-highlight");

		// add highlight class style in CSS
		if (!ruleExistenceDict[bgColorCode]) {
			sheet.insertRule([".", selectorName, " { background: #", bgColorCode, " !important; }"].join(""), 0);
			//text-decoration: underline wavy blue;
			//sheet.insertRule([".", selectorName, " { text-decoration-color: #", bgColorCode, " !important; }"].join(""), 0);
			ruleExistenceDict[bgColorCode] = true;
			console.log(sheet);
		}

		// range.surroundContents(iNode) will throw exception if word across multi tag
		iNode.appendChild(range.extractContents());
		range.insertNode(iNode);

		iNode.setAttribute("title", result.description + "  " + result.link);
	
		tippy(iNode, {
			placement: "top",
			offset: "0, 2",
			animation: "shift-away",
			arrow: "true",
			arrowType: "arrow",
			size: "large",
			theme: 'honeybee'
		});
		chrome.runtime.sendMessage({result: result}, function(response) {
			console.log(response);
		});

	};

	// highlight all keywords by its colour
	var highlightAllWords = function (wordGroupsDict) {

		var highlightWordFunction;
		if (window.find) {
			highlightWordFunction = highlightWordAcrossNode;
			// alternative: https://github.com/timdown/rangy/wiki/Highlighter-Module
		} else {
			console.log("window.find() function not exists, only textnode will be searched");
			highlightWordFunction = highlightWordInTextNodeOnly;
		}

		// for each group, highlight all its words
		Object.keys(wordGroupsDict).forEach(function (groupName) {
			if (wordGroupsDict[groupName].isOn) {
				wordGroupsDict[groupName].words.forEach(function (word) {
					console.log("word details:")
					console.log(word["text"]);
					console.log(word["result"]);
					highlightWordFunction(word["text"], groupName, word["result"]);
				});
			}
		});
	};

	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {
			if(request.method == "getText"){
				var text = "";
				var elements = document.body.getElementsByTagName("*");
				for (var i = 0; i<elements.length; i++){
					text = text + elements[i].innerText;
				}
				
				//console.log("----body:" + document.getElementById("mainContent").innerText);
				var content = document.body.innerText.trim() + document.getElementById("main").innerText.trim() + text;
			
				console.log("----------body:" + content.replace(/(\r\n|\n|\r)/gm," "));

				sendResponse({data: content.replace(/(\r\n|\n|\r)/gm," "), method: "getText"}); //same as innerText
			}
		}
	);

	// get words from storage
	chrome.storage.sync.get('wordGroupsDict', function (wordGroupsDict) {

		if (!wordGroupsDict.wordGroupsDict) return;
		else wordGroupsDict = wordGroupsDict.wordGroupsDict;

		// highlightAllWords(wordGroupsDict);
		// body may not loaded... hard-code some delay
		setTimeout(highlightAllWords, 500, wordGroupsDict);

		// may use observer to due with it
		// var observer = new MutationObserver(function(mutations) {
		// 	mutations.forEach(function(mutation) {
		// 		console.log(mutation);
		// 	});
		// })
		// var minConfig = { attributes: true, childList: true, characterData: true };
		// minConfig.subtree = true;
		// observer.observe(document.body, minConfig);
	});

	// on word list change
	chrome.runtime.onMessage.addListener(function (messageBody, sender, sendResponse) {

		// console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");

		// remove all highlight first
		[].slice.call(document.getElementsByClassName("chrome-extension-highlight")).forEach(function (e) {
			var parentNode = e.parentNode;
			while (e.firstChild) parentNode.insertBefore(e.firstChild, e);
			parentNode.removeChild(e);
		});

		highlightAllWords(messageBody);
		if (sendResponse) sendResponse({ content: "highlight done!" });
	});
}();
