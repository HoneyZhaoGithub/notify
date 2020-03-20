var totalPage = 2;
var resumeLinks = [];
var cookie =document.cookie;
var currentUrl = window.location.href;
//注册前台页面监听事件
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	var ccmd = request.cmd;

  	console.log(currentUrl+","+ccmd);
  	if('grab' == ccmd)
  	{
		if(currentUrl.indexOf("ResumeViewFolder")>0)
	  	{
			getResume("cannext");
	  	}
	  	else if(currentUrl.indexOf("InboxRecentEngine")>0)
	  	{
	  		chrome.storage.local.set({'pageNum':1});
	  		listResume();
	  	}
	}
	else if('cannext' == ccmd)
	{
		console.log("resumeLinks length:"+resumeLinks.length);
		if(resumeLinks.length>0)
		{
			var clink = resumeLinks[0];
			resumeLinks.splice(0,1);
			openNewWindow(clink);
		}
		else
		{
			chrome.storage.local.remove('parseResumeList');
			//console.log('nextpage');
			//nextPage();
		}
	}
  	else if('parse' == ccmd)
  	{
  		
  		if(currentUrl.indexOf("ResumeViewFolder")>0)
  		{
  			chrome.storage.local.set({'parseResume':'1'});
  			getResume("one");
  		}
  		
  	}
  	else if('parseList' == ccmd)
  	{
  		if(currentUrl.indexOf("InboxRecentEngine")>0)
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

if(currentUrl.indexOf("ResumeViewFolder")>0)
{
	chrome.storage.local.get('parseResumeList', function (items) {
    	var options= items;
    	console.log(options['parseResumeList'],'check');
    	if (typeof(options['parseResumeList'])!="undefined")
    	{
    		getResume("cannext");
    	}
    });
}
else if(currentUrl.indexOf("InboxRecentEngine")>0)
{
	chrome.storage.local.get('parseResumeList', function (items) {
    	var options= items;
    	console.log(options['parseResumeList'],'check');
    	if (typeof(options['parseResumeList'])!="undefined")
    	{
    		listResume();
    	}
    });
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

function downloadResume()
{
	$("#divRecom").remove();
	var resume=$("#divResume").html();
	var data = "\ufeff"+" <div id='teamface'><div id='divResume'><center> <a href='"+currentUrl+"' target='_blank'>简历原文</a></center>"+resume +"</div></div>";  
	var blob = new Blob([data], { type: 'text/html,charset=UTF-8'});
	var aLink = document.createElement('a');
    aLink.download = "51job.com-"+document.title + ".html";
    aLink.href = URL.createObjectURL(blob);
    aLink.click();
}


function getResume(cmd)
{
	getToken(token => 
	{
		console.log("current page is resume,"+token);
		if('no'!= token)
		{
			chrome.storage.local.remove('parseResume');
			var resume=$("#divResume").html();
			if(resume.length>0)
			{
				sendMsg(currentUrl,resume, cmd,cookie);
				if('owgcookie'!=cmd)
				{
					closeMyDoc();
				}
			}
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
	getPageNum(pageNum => {
		chrome.storage.local.get('totalPage', function (items) {
	    	var options= items;
	    	if (typeof(options['totalPage'])!="undefined")
	    	{
	    		totalPage = options['totalPage'];
	    	}

	    	if(pageNum <= totalPage)
			{
				$("a[class=a_username]").each(function(index){
					var link = '';
					var href = $(this).attr("href");
					var name = $(this).text();
					link = href;
					if(href.indexOf("https")<0)
					{
						link = 'https://ehire.51job.com'+href;
					}
					tresumeLinks.push(link);
					console.log(name+":"+link);
				});
			}
			else
			{
				chrome.storage.local.remove('parseResumeList');
			}

			if(callback) callback(tresumeLinks);
    	});
	});
}

function nextPage()
{
	var pageclass = $('#pagerBottomNew_nextButton').attr('class');
	if(pageclass.indexOf('Disabled')<0)
	{
		var theForm = document.forms['form1'];
		if (!theForm) 
		{
			 theForm = document.form1;
		}

		theForm.__EVENTTARGET.value = 'pagerBottomNew$nextButton';
	    theForm.__EVENTARGUMENT.value = '';
	    theForm.submit();
	}
	else
	{
		chrome.storage.local.remove('parseResumeList');
	}
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

//参数n为休眠时间，单位为毫秒:
function sleep(n) {
    var start = new Date().getTime();
    while (true) {
        if (new Date().getTime() - start > n) {
            break;
        }
    }
}

function closeMyDoc()
{
	window.opener=null;
	window.open('','_self');
	window.close();
}

function openNewWindow(nurl) 
{
	//chrome.tabs.create({ url: newURL });
    let a = $("<a href='"+nurl+"' target='_blank'>baidu</a>").get(0);
    let e = document.createEvent('MouseEvents');
    e.initEvent( 'click', true, true );
    a.dispatchEvent(e);
}

//将获取内容传递给后台文件进行处理
function sendMsg(url, msg, cmd,cookie)
{
	chrome.runtime.sendMessage({"url":url,"msg": msg, "cmd": cmd,'cookie':cookie}, function(response) {});
}
