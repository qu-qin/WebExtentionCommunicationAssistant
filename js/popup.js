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
		wordGroupsDict["C72E04"] = {groupName: "C72E04", isOn: isOn, words:["demo", "the"]};
		wordGroupsDict["FA9507"] = {groupName: "FA9507", isOn: isOn, words:["romance"]};
		wordGroupsDict["CACF44"] = {groupName: "CACF44", isOn: isOn, words:["William and Kate"]};
		wordGroupsDict["27AB99"] = {groupName: "27AB99", isOn: isOn, words:["your health"]};

		toggleCheckbox.addEventListener("change", wordGroupToogleHandlerFactory(wordGroupsDict));
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
			Object.keys(wordGroupsDict).forEach(function(key) {
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
}();
