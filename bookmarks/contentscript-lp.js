var checklength=0;
var resumeLinks = [];
var cookie =document.cookie;
var currentUrl = window.location.href;
//注册前台页面监听事件
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	var ccmd = request.cmd;
  	var currentUrl = window.location.href;

  	console.log(currentUrl+","+ccmd);
  	if('grab' == ccmd)
  	{
		chrome.storage.local.set({'pageNum':1});
	  		console.log("resumeLinks start!");
	  		getResumeLinks(ttresumeLinks => {
				resumeLinks = ttresumeLinks;
				console.log("resumeLinks length:"+resumeLinks.length);
				if(resumeLinks.length>0)
				{
					var clink = resumeLinks[0];
					resumeLinks.splice(0,1);
					console.log("resumeLinks length:"+resumeLinks.length);
					openNewWindow(clink);
				}
				
			});
	}
	else if('checkCompleted' == ccmd)
	{
		checkCompleted();
	}
	else if('cannext' == ccmd)
	{
		if(resumeLinks.length>0)
		{
			var clink = resumeLinks[0];
			resumeLinks.splice(0,1);
			console.log("resumeLinks length:"+resumeLinks.length);
			openNewWindow(clink);
		}
		else
		{
			chrome.storage.local.remove('parseResumeList');
			// getResumeLinks(ttresumeLinks => {
			// 	resumeLinks = ttresumeLinks;
			// 	console.log("resumeLinks length:"+resumeLinks.length);
			// 	if(resumeLinks.length>0)
			// 	{
			// 		var clink = resumeLinks[0];
			// 		resumeLinks.splice(0,1);
			// 		console.log("resumeLinks length:"+resumeLinks.length);
			// 		openNewWindow(clink);
			// 	}
				
			// });
		}
	}
	else if('parse' == ccmd)
  	{
  		
  		if(currentUrl.indexOf("showresumedetail")>0)
  		{
  			chrome.storage.local.set({'parseResume':'1'});
  			getResume("one");
  		}
  		
  	}
  	else if('parseList' == ccmd)
  	{
  		if(currentUrl.indexOf("showrecvresumelist")>0)
		{
			chrome.storage.local.set({'parseResumeList':'1'});
			chrome.storage.local.set({'pageNum':1});
  			listResume();
		}
  		
  	}
  	else if('download' == ccmd)
  	{
  		downloadResume();
  	}
});

if(currentUrl.indexOf("showresumedetail")>0)
{
	getToken(token => {
		console.log("current page is Resume,"+token);
		if('no'!= token)
		{
			chrome.storage.local.get('parseResumeList', function (items) {
		    	var options= items;
		    	console.log(options['parseResumeList'],'check');
		    	if (typeof(options['parseResumeList'])!="undefined")
		    	{
		    		sendMsg(currentUrl,"", "checkCompleted");
		    	}
		    });
    
		}
	});
}

// if(currentUrl.indexOf("showresumedetail")>0)
// {
// 	getToken(token => {
// 		console.log("current page is Resume,"+token);
// 		if('no'!= token)
// 		{
// 			sendMsg(currentUrl,"", "checkCompleted");
// 		}
// 	});
// }
// else if(currentUrl.indexOf("showrecvresumelist")>0)
// {
// 	getToken(token => {
// 		console.log("current page is resumelinks,"+token);
// 		if('no'!= token)
// 		{
// 			console.log("current page is resumelinks!");
// 			getResumeLinks(ttresumeLinks => {
// 				resumeLinks = ttresumeLinks;
// 				console.log("resumeLinks length:"+resumeLinks.length);
// 				if(resumeLinks.length>0)
// 				{
// 					var clink = resumeLinks[0];
// 					resumeLinks.splice(0,1);
// 					console.log("resumeLinks length:"+resumeLinks.length);
// 					openNewWindow(clink);
// 				}
				
// 			});
// 		}
// 	});
// }


function checkCompleted()
{
	if($('section.individual-cont').length>0)
	{
		getResume("cannext");
		closeMyDoc();
	}
	else
	{
		console.log("check...");
		sendMsg(currentUrl,"", "checkCompleted");
	}
}

function listResume()
{
	getToken(token => 
	{
		console.log("current page is resumeLinks,"+token);
		if('no'!= token)
		{
			console.log("resumeLinks start!");
			getResumeLinks(ttresumeLinks => {
				resumeLinks = ttresumeLinks;
				console.log("resumeLinks length:"+resumeLinks.length);
				if(resumeLinks.length>0)
				{
					var clink = resumeLinks[0];
					resumeLinks.splice(0,1);
					console.log("resumeLinks length:"+resumeLinks.length);
					openNewWindow(clink);
				}
			});
		}
		else
		{
			alert('请先登录！');
		}
	});
}

function getResumeLinks(callback)
{
	var tresumeLinks = [];
	$("div.img a[target='_blank']").each(function(index){
		var link = '';
		var href = $(this).attr("href");
		var name = $(this).text();
		link = href;
		if(href.indexOf("https")<0)
		{
			link = 'https://lpt.liepin.com'+href;
		}
		tresumeLinks.push(link);
		console.log(name+":"+link);

	});
	if(callback) callback(tresumeLinks);
}

function getToken(callback)
{
	var token='no';
    chrome.storage.local.get('token', function (items) {
    	var options= items;
    	if (typeof(options['token'])!="undefined")
    	{
    		token = options['token'];
    	}
    	if(callback) callback(token);
    });
}

function closeMyDoc()
{
	window.opener=null;
	window.open('','_self');
	window.close();
}

function getResume(cmd)
{
	var resume=$("aside.board").html();
	sendMsg(currentUrl,resume, cmd,cookie);
}

function downloadResume()
{
	var resume=$("aside.board").html();
	var data = "\ufeff"+" <div id='teamface'> <aside class='board'><center> <a href='"+currentUrl+"' target='_blank'>简历原文</a></center>"+resume +"</aside></div>";  
	var blob = new Blob([data], { type: 'text/html,charset=UTF-8'});
	var aLink = document.createElement('a');
    aLink.download = "lpt.liepin.com-"+document.title + ".html";
    aLink.href = URL.createObjectURL(blob);
    aLink.click();
}

function getResumeLinks2(callback)
{
	var tresumeLinks = [];//简历链接
	getPageNum(pageNum => {
		var totalPage = 1;
		chrome.storage.local.get('totalPage', function (items) {
	    	var options= items;
	    	if (typeof(options['totalPage'])!="undefined")
	    	{
	    		totalPage = options['totalPage'];
	    	}
	    	if(pageNum <= totalPage)
			{
				clink = "https://lpt.liepin.com//apply/resume/showrecvresumelist/?kind=1&layout=2&pageSize=20&curPage="+(pageNum-1);
				$.ajax({
					url: clink,
					cache: false,
					type: "get",
					contentType: "application/x-www-form-urlencoded; charset=UTF-8"
				}).done(function(msg) {
					
					$(msg).find("td > a.link-resume-view").each(function(index){
						var link = '';
						var href = $(this).attr("href");
						var name = $(this).text();
						link=href;
						if(href.indexOf("https")<0)
						{
							link = 'https://lpt.liepin.com'+$(this).attr("href");
						}
						tresumeLinks.push(link);
						console.log(name+":"+link);
					});
					if(callback) callback(tresumeLinks);
				}).fail(function(msg) {
					console.log("fail:"+msg);
				});
			}
			else
			{
				if(callback) callback(tresumeLinks);
			}

			
		});
		
		
	});

}

function getPageNum(callback)
{
	var pageNum = 1;
	chrome.storage.local.get('pageNum', function (items) {
    	var options= items;
    	if (typeof(options['pageNum'])!="undefined")
    	{
    		pageNum = options['pageNum'];
    	}
    	chrome.storage.local.set({'pageNum':(pageNum+1)});
    	console.log("pageNum:"+pageNum);
    	if(callback) callback(pageNum);
	});
}

 //参数n为休眠时间，单位为毫秒:
function sleep(n) {
    var start = new Date().getTime();
    while (true) {
        if (new Date().getTime() - start > n) {
            break;
        }
    }
}


function openNewWindow(nurl) {
	//chrome.tabs.create({ url: newURL });
    let a = $("<a href='"+nurl+"' target='_blank'>baidu</a>").get(0);
    let e = document.createEvent('MouseEvents');
    e.initEvent( 'click', true, true );
    a.dispatchEvent(e);
}


//将获取内容传递给后台文件进行处理
function sendMsg(url, msg, cmd){
	chrome.runtime.sendMessage({"url":url,"msg": msg, "cmd": cmd}, function(response) {});
}
