// UI creation
!function () {

	"use strict";

	/*|================================================================|*/
	/*|                          UI creation                           |*/
	/*|================================================================|*/
	var initToggleAndWordGroup = function (isOn) {
		var mainBlock = document.getElementById("mainBlock");
		var className = ["pure-toggle-checkbox"];
		var toggleCheckbox = mainBlock.getElementsByClassName(className)[0];
		console.log(isOn);
		if (isOn) {
			toggleCheckbox.checked = true;
		}

		var wordGroupsDict = {};
		wordGroupsDict["C72E04"] = { groupName: "C72E04", isOn: isOn, words: [{text: "demo"}] };
		wordGroupsDict["FA9507"] = { groupName: "FA9507", isOn: isOn, words: [{text: "shooting stars"}, {text:"meteor shower"}] };
		wordGroupsDict["CACF44"] = { groupName: "CACF44", isOn: isOn, words: [{text: "William and Kate"}] };
		wordGroupsDict["27AB99"] = { groupName: "27AB99", isOn: isOn, words: [{text: "your health"}] };

		Object.keys(wordGroupsDict).forEach(function(color) {
			wordGroupsDict[color].words.forEach(function(wordMap) {
				getWikipediaResult(wordMap.text).done(function(data) {
					var result = data[2][0];
					result = result + " " + data[3][0];					
					wordMap.result = result;
				}).fail(function() {
					alert('error');
				});
			});
		});

		setTimeout(function() {
			console.log(wordGroupsDict);
		}, 5000);

		toggleCheckbox.addEventListener("change", wordGroupToogleHandlerFactory(wordGroupsDict));
	};

	var loadFormData = function () {
		chrome.storage.sync.get('personInfo', function (personInfo) {
			var personDetails = (personInfo && personInfo.personInfo) || null;
			console.log("initial person Details: ");
			console.log(personDetails);
			if (personDetails) {
				if (personDetails.location) {
					document.getElementById("location").value = personDetails.location;
				}
				if (personDetails.profession) {
					document.getElementById("profession").value = personDetails.profession;
				}
				if (personDetails.native) {
					document.getElementById("native").value = personDetails.native;
				}
			}
		});

		var elementSave = document.getElementById('save');
		// onClick's logic below:
		elementSave.addEventListener('click', function () {
			var location = document.getElementById("location").value;
			var profession = document.getElementById("profession").value;
			var native = document.getElementById("native").value;

			var personInfo = {};
			personInfo["location"] = location;
			personInfo["profession"] = profession;
			personInfo["native"] = native;

			chrome.storage.sync.set({
				personInfo: personInfo
			}, function () {
				console.log("personInfo saved");
			});
		});

		var elementReset = document.getElementById('reset');
		// reset logic below:
		elementReset.addEventListener('click', function () {
			console.log("reset!");
			chrome.storage.sync.clear(function () {
				var error = chrome.runtime.lastError;
				if (error) {
					console.error(error);
				}
			});
			document.getElementById("location").value = "";
			document.getElementById("profession").value = "";
			document.getElementById("native").value = "";
		});
		console.log("start");
		getWikipediaResult("helicopter");
	}

	var getWikipediaResult = function (search) {
		var url = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + search + "&format=json&limit=1&callback=?";
		var result = "";
		return $.ajax({
			type: "GET",
			url: url,
			async: false,
			dataType: "json"
		});
	};


	/*|================================================================|*/
	/*|                 load UI data and event binding                 |*/
	/*|================================================================|*/
	var getDefaultWordGroup = function (groupName) {
		return {
			groupName: groupName,
			isOn: false,
			words: []
		};
	};
	var createNewGroupInDict = function (wordGroupsDict, groupName) {
		var wordGroup = wordGroupsDict[groupName];

		if (!wordGroup) {
			wordGroup = getDefaultWordGroup(groupName);
			wordGroupsDict[groupName] = wordGroup;
		}
	};
	var saveAndSendMsg = function (wordGroupsDict) {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			var messageBody = wordGroupsDict;
			chrome.tabs.sendMessage(tabs[0].id, messageBody, function (response) {
				// console.log(response.content);
			});
		});
	};
	var wordGroupToogleHandlerFactory = function (wordGroupsDict) {
		return function (event) {
			chrome.storage.sync.set({
				isOn: event.target.checked
			}, function () {
				console.log("isOn saved :" + event.target.checked);
			});
			Object.keys(wordGroupsDict).forEach(function (key) {
				wordGroupsDict[key].isOn = event.target.checked;
			});
			console.log(wordGroupsDict);
			saveAndSendMsg(wordGroupsDict);
		};
	};
	var wordListChangeHandlerFactory = function (wordGroupsDict) {
		return function (event) {
			var groupName = event.target.dataset.bgColor;
			var wordGroup = wordGroupsDict[groupName];
			wordGroup.words = event.target.value.match(/[^\s]+/g) || [];

			saveAndSendMsg(wordGroupsDict);
		};
	};


	/*|================================================================|*/
	/*|                    load extension settings                     |*/
	/*|================================================================|*/
	chrome.storage.sync.get('isOn', function (isOn) {
		// I just dont know how chrome.storage.sync works...
		// + nothing inside, return {}
		// + find the key, return {key: value}
		// var wordGroupsDict = wordGroups.wordGroupsDict || wordGroups;
		isOn = isOn.isOn || false;
		/*|================================================================|*/
		/*|                   popup UI and event binding                   |*/
		/*|================================================================|*/
		// use default for 1st time		
		initToggleAndWordGroup(isOn);
	});

	loadFormData();
}();
