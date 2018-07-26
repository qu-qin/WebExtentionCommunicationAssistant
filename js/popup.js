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
		var settings = document.getElementById('image');
						var form = document.getElementById('form');
						settings.addEventListener('click', function () {
							console.log("settings clicked");
							if (form.style.display === "none") {
								form.style.display = "block";
							} else {
								form.style.display = "none";
							}
						});

		var alltext = "";
		chrome.tabs.getSelected(null, function (tab) {
			chrome.tabs.sendRequest(tab.id, { method: "getText" }, function (response) {
				setTimeout(function () {
					if (response && response.method == "getText") {
						alltext = response.data;
						console.log("all text:")
						console.log(alltext);
						var wordGroupsDict = {};
						wordGroupsDict["FA9507"] = { groupName: "FA9507", isOn: isOn };
						wordGroupsDict["C72E05"] = { groupName: "C72E05", isOn: isOn, words: [{ text: "meteor shower" }] };

						buildAndGetResult(alltext).done(function (data) {
							console.log("data: " + data);
							var phrases = data.phrases;
							console.log("phrases: " + phrases)
							var list = getWordsToHighlight(phrases);
							console.log("list: " + list);
							var builtList = buidList(list);
							console.log("builtList: " + builtList);
							wordGroupsDict["FA9507"].words = builtList;
							Object.keys(wordGroupsDict).forEach(function (color) {
								if (wordGroupsDict[color].words) {
									wordGroupsDict[color].words.forEach(function (wordMap) {
										getWikipediaResult(wordMap.text).done(function (data) {
											wordMap.result = { description: data[2][0] || "", link: data[3][0] || "https://www.bing.com/search?q=" + wordMap.text};
										}).fail(function () {
											alert('error');
										});
									});
								}
							});
							$(".toggle").css("visibility","visible");
							$(".load").css("visibility","hidden");

						}).fail(function () {
							alert("error again");
						});
				
						toggleCheckbox.addEventListener("change", wordGroupToogleHandlerFactory(wordGroupsDict));						
					}
				}, 5);
			});
		});



	};
	var buidList = function (list) {
		var result = [];
		list.forEach(function (word) {
			console.log("current word: " + word);
			result.push({ text: word });
		});
		return result;
	}

	var addResultElements = function (wordGroupsDict) {

		var html = [];

		Object.keys(wordGroupsDict).forEach(function (color) {
			if (wordGroupsDict[color].words) {
				var words = wordGroupsDict[color].words;
				for (var i = 0; i < words.length; i++) {
					var description = null;
					var link = null;
					if (words[i].result) {
						description = words[i].result.description;
						link = words[i].result.link;
					}
					html.push("<div>");
					html.push("<div class='word'>" + words[i].text + "</div>");
					html.push("<div class='description'>" + description + "</div>");
					html.push("<div class='link'><a class='link2' href='link'>" + link + "</a></div>");
					html.push("</div>");
					if (i != words.length - 1) {
						html.push("<hr>");
					}
				}
				// wordGroupsDict[color].words.forEach(function (wordMap) {
				// 	html.push("<div>");
				// 	html.push("<div class='word'>" + wordMap.text + "</div>");
				// 	html.push("<div class='result'>" + wordMap.result + "</div>");
				// 	html.push("</div>");					
				// 	html.push("<hr>");
				// });
			}
		});

		$(".result-list").html(html.join(""));

	}
	var getWordsToHighlight = function (result) {
		var list = [];
		result.forEach((p) => {
			
				console.log("p: " + p);
				list.push(p.text);
			
		})
		return list;
	}
	var buildAndGetResult = function (alltext) {
		var data = {
			"sender": ["location:USA", "profession:Journalism", "native:English"],
			"recipients": [[]
				//["location:" + document.getElementById("location").value, "profession:" + document.getElementById("profession").value, "native:" + document.getElementById("native").value]
			],
			"text": alltext
		};
		console.log("----------------data:");
		console.log(data);
		return $.ajax({
			url: 'https://bocgapi.azurewebsites.net/api/analyzer',
			dataType: 'json',
			type: 'post',
			contentType: 'application/json',
			data: JSON.stringify(data),
		});
	}

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
			if (event.target.checked) {
				addResultElements(wordGroupsDict);
			}
			if (!event.target.checked) {
				$(".result-list").html("");
			}
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
		isOn = false;
		/*|================================================================|*/
		/*|                   popup UI and event binding                   |*/
		/*|================================================================|*/
		// use default for 1st time		
		initToggleAndWordGroup(isOn);
		loadFormData();
	});
	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			console.log("request result:" + request.result);
		});
}();
