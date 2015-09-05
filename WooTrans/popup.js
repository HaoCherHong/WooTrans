//----------------GA-----------------
var _AnalyticsCode = 'UA-61516445-2';

var _gaq = _gaq || [];
_gaq.push(['_setAccount', _AnalyticsCode]);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(ga, s);
})();
//----------------GA-----------------

var wootalkUrl = 'https://wootalk.today/'
var wooTransObjects;
var currentWooTrans;
var confirmDialog, confirmButton, cancelButton, confirmLabel, spacer;
var confirmCallback;

//Share button
function share() {
	//Track event
	_gaq.push(['_trackEvent', 'action', 'share']);

	var win = window.open('https://chrome.google.com/webstore/detail/jonegeahehknbgnifdfbnidfpfigpdcp/?utm_source=wootrans&utm_medium=share%20link&utm_campaign=interlink', '_blank');
	win.focus();
}

//Save button
function save() {
	getWooTransObject(function(wooTrans) {
		var name = document.getElementById("textfield_name").value;
		wooTrans.name = name;
		wooTrans.saved = true
		wooTransObjects.push(wooTrans)

		//Check if reached new max number of saves
		chrome.storage.sync.get('maxNumOfSaves', function(items) {
			var savesNum = wooTransObjects.length
			if(items.maxNumOfSaves == undefined || savesNum > items.maxNumOfSaves) {
				//Reached new record, save and track event
				chrome.storage.sync.set({'maxNumOfSaves': savesNum})
				_gaq.push(['_trackEvent', 'record', 'saves', 'max', savesNum]);
				_gaq.push(['_trackEvent', 'record', 'saves: ' + savesNum]);
			}

			chrome.storage.sync.set({'wooTransObjects': wooTransObjects})
			
			//Track event and close
			_gaq.push(['_trackEvent', 'action', 'save']);
			window.location.reload()
		})
	});
}

//Rename button
function rename() {
	getWooTransObject(function(wooTrans) {
		var name = document.getElementById("textfield_name").value;
		wooTrans.name = name;

		chrome.storage.sync.set({'wooTransObjects': wooTransObjects})
		
		//Track event and close
		_gaq.push(['_trackEvent', 'action', 'rename']);
		window.location.reload();
	})
}

//New button
function newConversation() {
	chrome.cookies.remove({ 'url': 'https://wootalk.today/', 'name': '_wootalk_session' }, function(details) {
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.reload(tab.id)
			
			//Track event and close
			_gaq.push(['_trackEvent', 'action', 'new conversation']);
			window.close();
		});
	});
}

//WooTrans link
function trans(wooTrans) {
	chrome.cookies.set({ 'url': 'https://wootalk.today/', 'name': '_wootalk_session', 'value':wooTrans.id }, function(details) {
		 chrome.tabs.query({'active': true}, function(tab){
			chrome.tabs.reload(tab.id)

			//Track event and close
			_gaq.push(['_trackEvent', 'action', 'trans']);
			window.close()
		});
	});
}

//Delete
function remove(wooTrans) {
	wooTransObjects.splice(wooTransObjects.indexOf(wooTrans), 1)
	chrome.storage.sync.set({'wooTransObjects': wooTransObjects})

	//Track event and close
	_gaq.push(['_trackEvent', 'action', 'remove']);
	window.location.reload();
}

function hide(element) {
	if(element.className.indexOf('hidden') === -1) {
		element.className += ' hidden'
	}
}

function show(element) {
	element.className = element.className.replace(/\bhidden\b/,'');
}

function confirm(text, callback) {
	confirmLabel.innerText = text
	
	if(confirmCallback) {
		confirmButton.removeEventListener('click', confirmCallback);
	}
	confirmCallback = callback
	
	if(!callback) {
		hide(cancelButton)
		hide(spacer)
	} else {
		show(cancelButton)
		show(spacer)
		confirmButton.addEventListener('click', confirmCallback)
	}

	show(confirmDialog)
}

//Add WooTrans Object to list
function addToList(wooTrans) {
	var list  = document.getElementById('wootrans_list')
	var div = document.createElement('div')
	
	var label = document.createElement('label')
	label.innerText = wooTrans.name
	if(currentWooTrans == wooTrans) {
		label.className = 'current'
	}
	div.appendChild(label)
	
	var removeLink  = document.createElement('span')
	removeLink.className = 'remove_link'
	removeLink.innerText = '刪除'
	removeLink.addEventListener('click', function() {
		confirm('確定要刪除此對話嗎？', function() {
			remove(wooTrans)
		})
	});
	div.appendChild(removeLink)
	
	if(currentWooTrans != wooTrans) {
		var transButton = document.createElement('button')
		transButton.className = 'button trans_link'
		transButton.innerText = '切換'
		transButton.addEventListener('click', function() {
			if(currentWooTrans.saved) {
				trans(wooTrans)
			} else {
				confirm('對話還沒儲存，確定要切換嗎？', function() {
					trans(wooTrans)
				})
			}
		});
		div.appendChild(transButton)
	}
	
	list.appendChild(div)
}

function getWooTransObject(callback) {
	chrome.cookies.get({ 'url': 'https://wootalk.today/', 'name': '_wootalk_session' }, function(cookie) {
		var id = cookie.value;
		if(wooTransObjects[id] != undefined) {
			callback(wooTransObjects[id])
		} else {
			var newWooTrans = {
				id: cookie.value,
				name: '新對話',
				timestamp: Date.now(),
				saved: false
			}
			callback(newWooTrans)
		}
	});
}

document.addEventListener('DOMContentLoaded', function() {
	//chrome.storage.sync.clear()
	
	chrome.tabs.getSelected(null, function(tab) {
		if(tab.url != wootalkUrl) {
			chrome.tabs.create({index: tab.index + 1, url: wootalkUrl + '?utm_source=WooTrans&utm_medium=Action%20Button&utm_campaign=WooTrans'})
		}
	});

	//Setup confirm dialog, cancel, confirm button
	confirmDialog = document.getElementById('confirm_dialog')
	confirmButton = document.getElementById('button_confirm')
	cancelButton = document.getElementById('button_cancel')
	spacer = document.getElementById('spacer')
	confirmLabel = document.getElementById('dialog_label')
	cancelButton.addEventListener('click', function() {
		hide(confirmDialog)
	})
	confirmButton.addEventListener('click', function() {
		hide(confirmDialog)	
	})

	//Get data
	chrome.storage.sync.get('wooTransObjects', function(items) {
	
		if(items.wooTransObjects != undefined) {
			wooTransObjects = items.wooTransObjects;
			//Remap id to the array index
			for(var i =  0; i < wooTransObjects.length; i++) {
				wooTransObjects[wooTransObjects[i].id] = wooTransObjects[i];
			}
		} else {
			wooTransObjects = [];
		}
		
		getWooTransObject(function(wooTrans) {
			currentWooTrans = wooTrans;
			document.getElementById('textfield_name').value = currentWooTrans.name
			if(wooTrans.saved) {
				document.getElementById('button_save').innerText = '命名'
				document.getElementById('button_save').addEventListener('click', rename);
			} else {
				document.getElementById('button_save').innerText = '儲存'
				document.getElementById('button_save').addEventListener('click', save);
			}
			
			document.getElementById('wootrans_list').innerHTML = '';
			for(var i =  0; i < wooTransObjects.length; i++) {
				addToList(wooTransObjects[i])
			}
			
			
			document.getElementById('button_new').addEventListener('click', function() {
				if(wooTransObjects.length >= 4) {
					confirm('達到對話上限了 ：（')
				} else {
					if(currentWooTrans.saved) {
						newConversation();
					} else {
						confirm('對話還沒儲存，確定要切換嗎？', function() {
							newConversation();
						})
					}
				}
			});
			document.getElementById('button_share').addEventListener('click', share);
		});
	});

	//Check if just installed
	chrome.storage.sync.get('installedVersion', function(items) {
		var currentVersion = chrome.app.getDetails().version
		var installedVersion = items.installedVersion
		if(installedVersion == undefined || currentVersion > installedVersion) {
			chrome.storage.sync.set({'installedVersion': currentVersion})
			_gaq.push(['_trackEvent', 'other', 'installed', currentVersion.toString()]);
		}
	})
});