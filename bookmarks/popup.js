
// 调用后台登录
$('#btn-login').click(e => 
{
	var bg = chrome.extension.getBackgroundPage();
	var tname = $('#username').val();
	var tpwd = $('#pwd').val();
	bg.teamfaceLogin(tname,tpwd);
	closeMyDoc();
});

// 调用后台退出
$('#btn-quiet').click(e => 
{
	var bg = chrome.extension.getBackgroundPage();
	bg.teamfaceQuiet();
	closeMyDoc();
});

function closeMyDoc()
{
	window.opener=null;
	window.open('','_self');
	window.close();
}

// 获取当前选项卡ID
function getCurrentTabId(callback)
{
	chrome.windows.getCurrent(function(currentWindow)
	{
		chrome.tabs.query({active: true, windowId: currentWindow.id}, function(tabs)
		{
			if(callback) callback(tabs.length ? tabs[0].id: null);
		});
	});
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
	console.log('收到来自content-script的消息：');
	console.log(request, sender, sendResponse);
	sendResponse('我是popup，我已收到你的消息：' + JSON.stringify(request));
});

// 向content-script主动发送消息
function sendMessageToContentScript(message, callback)
{
	getCurrentTabId((tabId) =>
	{
		alert("t");
		chrome.tabs.sendMessage(tabId, message, function(response)
		{
			alert(message);
			if(callback) callback(response);
		});
	});
}
