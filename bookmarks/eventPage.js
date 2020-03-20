var total = 0;
var flag = false;
var currentTabId;
var serverDomain="http://192.168.1.172:8080/custom-resume/common/";
chrome.browserAction.onClicked.addListener(function(tab) {
	alert('clicked!');
  	counter = 40;
  	console.log('Turning ' + tab.url);
  	flag = true;
  	currentTabId = tab.id;
	chrome.tabs.getSelected(null, function(tab) {
		sendMsg(tab.id);
	});
});

chrome.webNavigation.onCompleted.addListener(function( tab ){
	console.log('加载完成***' + tab.tabId );
});

function teamfaceQuiet()
{
	console.log('quiet!');
	chrome.storage.local.clear();
	chrome.browserAction.setBadgeText({text: ''});
	alert('已退出！');
}

function teamfaceLogin(tname,tpwd)
{
	chrome.storage.local.clear();
 	var sererUrl=serverDomain+"login";
	chrome.browserAction.setBadgeText({text: ""});
 	getCurrentTab(tab => {
		if(tab!=null)
		{
			tabId = tab.id;
			curl = tab.url;
			$.ajax({
				url: sererUrl,
				cache: false,
				type: "post",
				data:JSON.stringify({'userName':tname,'passWord':tpwd,'url':curl}),
				contentType: "application/json; charset=utf-8",
		    	dataType: "json"
			}).done(function(msg) {
				console.log('登录成功!'+JSON.stringify(msg));
				chrome.storage.local.set({'token': msg.token});
		    	chrome.storage.local.set({'mainTabId':tabId});
		    	chrome.storage.local.set({'pageNum':-1});
		    	chrome.storage.local.set({'rowCount':msg.data.rowCount});
		    	sendMsg(tabId,'init');
			}).fail(function(msg) {
				alert('登录失败!'+JSON.stringify(msg));
				chrome.storage.local.remove('token');
			});
		}
	});
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	var ctabid= sender.tab.id;
  	var cmd = request.cmd;
  	var cookie = request.cookie;
	var articleData = request.msg;
	var articleUrl = request.url;
	var json = request.json;
	var sererUrl=serverDomain+"/saveResume";
	console.log("cmd:"+cmd);
	
	if('end' == cmd)
  	{
  		//确保不会自动运行
		flag = false;
	}
	else if('checkCompleted'==cmd)
  	{
  		sleep(2000);
  		sendMsg(ctabid,cmd);
  	}
  	else if('sleep'==cmd)
  	{
  		sleep(parseInt(articleData));
  		sendMsg(ctabid,cmd);
  	}
  	else if('gcookie'==cmd)
  	{
  		getCookie(request.domain,request.name,cookie => {
			name_v=cookie;
			sendMsg(ctabid,cmd,request.name,name_v);	
		});
  	}
	else if('no'==cmd)
	{
		chrome.storage.local.get('mainTabId', function (items) {
	    	var options= items;
	    	if (typeof(options['mainTabId'])!="undefined")
	    	{
	    		mainTabId = options['mainTabId'];
	    		sendMsg(mainTabId,'cannext');
	    	}
	    });
	}
	else if(cmd.indexOf('wgcookie')>=0)
  	{
  		chrome.cookies.get({url:request.domain,name:request.name},function(ccookie){
		    name_v= ccookie.value;
		    cookie=cookie+";"+request.name+"="+name_v+";";
		    if('wgcookie'==cmd)
		    {
		    	cmd = 'cannext';
		    }
		    else
		    {
		    	cmd = 'one';
		    }
		    submitData(ctabid,articleData,articleUrl,cmd,cookie);
		});
  	}
	else
	{
		submitData(ctabid,articleData,articleUrl,cmd,cookie);
	}
	
 });

function submitData(tabid,articleData,articleUrl,cmd,cookie)
{
	sleep(2000);
	var sererUrl=serverDomain+"/saveResume";
	$.ajax({
			url:sererUrl,
			cache: false,
			type: "POST",
			data: JSON.stringify({'resumeInfo':articleData,'resumeUrl':articleUrl,'resumeType':cmd,'cookie':cookie}),
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(msg) {
			console.log("success:"+JSON.stringify(msg));
			chrome.storage.local.get('mainTabId', function (items) {
	    	var options= items;
		    	if (typeof(options['mainTabId'])!="undefined")
		    	{
		    		if('cannext' == msg.cmd || 'one' == msg.cmd)
		    		{
		    			total++;
		    		}
		    		chrome.browserAction.setBadgeText({text: total.toString()});
		    		mainTabId = options['mainTabId'];
		    		sendMsg(mainTabId,msg.cmd,msg.data);
		    	}
		    });
		}).fail(function(msg) {
			console.log("fail:"+JSON.stringify(msg)); 
		});
}

chrome.contextMenus.create({
	title: "解析简历",
	onclick: function(info,tab){
		chrome.storage.local.set({'mainTabId':tab.id});
		console.log('解析简历***' + JSON.stringify(tab) );
		sendMsg(tab.id,'parse');
	}
});

chrome.contextMenus.create({
	title: "下载简历",
	onclick: function(info,tab){
		console.log('下载简历***' + JSON.stringify(tab) );
		sendMsg(tab.id,'download');
	}
});

chrome.contextMenus.create({
	title: "解析列表简历",
	onclick: function(info,tab){
		chrome.storage.local.set({'mainTabId':tab.id});
		console.log('解析列表简历***' + JSON.stringify(tab) );
		sendMsg(tab.id,'parseList');
	}
});

chrome.contextMenus.create({
	title: "解析本地简历",
	onclick: function(info,tab){
		chrome.storage.local.set({'mainTabId':tab.id});
		console.log('解析本地简历***' + JSON.stringify(tab) );
		sendMsg(tab.id,'parseLocal');
	}
});

function checkTabs()
{
	chrome.tabs.query({currentWindow: true}, function(tabs) {
		var length=tabs.length;
		console.log('tabs.length:' + length );
		if(length<2)
		{
			getCurrentTabId(tabId => {
				chrome.tabs.sendMessage(tabId, {"cmd":"next"});
			});
		}
		else
		{
			sleep(15000);
			checkTabs();
		}
	});
}

//参数n为休眠时间，单位为毫秒:
function sleep(n) 
{
    var start = new Date().getTime();
    while (true) 
    {
        if (new Date().getTime() - start > n) 
        {
            break;
        }
    }
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

// 获取当前选项卡
function getCurrentTab(callback)
{
	chrome.windows.getCurrent(function(currentWindow)
	{
		chrome.tabs.query({active: true, windowId: currentWindow.id}, function(tabs)
		{
			if(callback) callback(tabs.length ? tabs[0]: null);
		});
	});
}

function getCookie(url,name,callback)
{
	chrome.cookies.get({url:url,name:name},function(cookie){
	    t_value= cookie.value;
	    if(callback) callback(cookie.value);
	});
}

 function sendSku2Info(colores){
	 chrome.tabs.query(
			{active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {"cmd":"ok", "sku": colores}, 
				function(response) {    
					console.log(response);  	
				}); });
}
 
function sendMsg( tabid ){
	console.log(tabid + "--sendMsg()----eventPage.js");
	chrome.tabs.sendMessage(tabid, {greeting: "start working"}, function(response) {
	});
}

function sendMsg(tabid, cmd){
	chrome.tabs.sendMessage(tabid,{"cmd": cmd}, function(response) {});
}

function sendMsg(tabid, cmd,data){
	chrome.tabs.sendMessage(tabid,{"cmd": cmd,"key":data}, function(response) {});
}

function sendMsg(tabid, cmd,key,msg){
	chrome.tabs.sendMessage(tabid,{"cmd": cmd,"key":key,"msg":msg}, function(response) {});
}

// web请求监听，最后一个参数表示阻塞式，需单独声明权限：webRequestBlocking
//chrome.webRequest.onBeforeRequest.addListener(details => {
	// cancel 表示取消本次请求
	//if(details.type == 'image') return {cancel: true};
	//console.log(JSON.stringify(details));
//}, {urls: ["<all_urls>"]}, ["blocking"]);
