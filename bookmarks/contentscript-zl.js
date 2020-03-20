var resumeLinks = [];
var access_token="";
var cookie =document.cookie;
var currentUrl = window.location.href;
//注册前台页面监听事件
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	var ccmd = request.cmd;
  	console.log(currentUrl+","+ccmd);
  	if('init' == ccmd)
  	{
  		chrome.storage.local.set({'pageNum':1});
  		chrome.runtime.sendMessage(
			{"url":currentUrl,"msg": "", "cmd": "gcookie","domain":"https://ihr.zhaopin.com","name":"Token"}, 
			function(response) {}
		);
	}
	else if('gcookie' == ccmd)
	{
		var key = request.key;
		var msg = request.msg;

		console.log(key+":"+msg);
		if('Token'==key)
		{
			access_token = msg;
			
			// nextPage(msg,ttresumeLinks => {
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
	else if('sleep' == ccmd)
	{
		getResume("cannext");
		closeMyDoc()
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
			//nextPage();
		}
	
	}
	else if('parse' == ccmd)
  	{
  		
  		if(currentUrl.indexOf("resume/details")>0 || currentUrl.indexOf("resume/manage")>0)
  		{
  			//chrome.storage.local.set({'parseResume':'1'});
  			getResume("one");
  		}
  		
  	}
  	else if('parseList' == ccmd)
  	{
  		console.log('parseList');
  		if(currentUrl.indexOf("resume/manage")>0)
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




if(currentUrl.indexOf("getresumedetial")>0 || currentUrl.indexOf("resume/details")>0)
{
	getToken(token => {
		console.log("current page is resume,"+token);
		if('no'!= token)
		{
			console.log("current page is resume!");
			chrome.storage.local.get('parseResumeList', function (items) {
		    	var options= items;
		    	console.log(options['parseResumeList'],'check');
		    	if (typeof(options['parseResumeList'])!="undefined")
		    	{
		    		sendMsg(currentUrl,'2000', 'sleep');
		    	}
		    });
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

function getResumeLinks(callback)
{
	var tlink ="http://ihr.zhaopin.com/resume/details/?access_token="+access_token+"&resumeSource=3&resumeNo=";
	var tresumeLinks = [];
	$("td.dave-name a.dave-js-goDetail").each(function(index){
		dataid = $(this).attr("data-id");
		name = $(this).text();
		href= tlink+dataid;
		tresumeLinks.push(href);
		console.log(name+":"+href);
	});
	if(tresumeLinks.length==0)
	{
		$("li.dave-js-checkSingle").each(function(index){
			dataid = $(this).attr("data-id");
			name = $(this).text();
			href= tlink+dataid;
			tresumeLinks.push(href);
			console.log(name+":"+href);
		});
	}
	if(callback) callback(tresumeLinks);
}

function getResume(cmd)
{
	//resume=$("pre").html();
	//currentJson = JSON.parse(resume);
	//console.log(resume);
	//sendMsg(url,currentJson, "resume");
	chrome.storage.local.remove('parseResume');
	resume=$("div.personage-resume-container").html();
	sendMsg(currentUrl,resume, cmd,cookie);
}

function downloadResume()
{
	resume=$("div.personage-resume-container").html();
	var data = "\ufeff"+" <div id='teamface'><div class='personage-resume-container'><center> <a href='"+currentUrl+"' target='_blank'>简历原文</a></center>"+resume +"</div></div>";  
	var blob = new Blob([data], { type: 'text/html,charset=UTF-8'});
	var aLink = document.createElement('a');
    aLink.download = "ihr.zhaopin.com-"+document.title + ".html";
    aLink.href = URL.createObjectURL(blob);
    aLink.click();
}

function nextPage(token,callback)
{
	var tresumeLinks = [];
	var pageNum = $('div#page a.laypage_next').attr('data-page');

}

function nextPage2(token,callback)
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
				startNum=(pageNum-1)*30-1;
				var turl = "https://ihr.zhaopin.com/resumemanage/resumelistbykey.do?access_token="+token+"&startNum="+startNum+"&rowsCount=30&onlyLastWork=false&orderFlag=deal&countFlag=1&pageType=all&sort=time";
				console.log(turl);
				$.ajax({
					url: turl,
					cache: false,
					type: "get",
					data:"",
					contentType: "application/json; charset=utf-8",
					dataType: "json"
				}).done(function(msg) {
					sendMsg(turl,msg,"users");
					msg.data.deal.results.map(item => {
						resumeJobId = item.id;
						jobNo=item.jobNumber;
						resumeNo=item.number;
						phone = item.phone;
						email = item.email;
						did = resumeJobId+"_"+jobNo+"_"+resumeNo+"_1_1";
						//rlink = "https://ihr.zhaopin.com/resumesearch/getresumedetial.do?access_token="+token+"&resumeNo="+did+"&resumeSource=3";
						rlink ="https://ihr.zhaopin.com/resume/details/?access_token="+token+"&resumeNo="+did+"&resumeSource=3&phone="+phone+"&email="+email;
						console.log(rlink);
						tresumeLinks.push(rlink);
					})
					if(callback) callback(tresumeLinks);
				}).fail(function(msg) {
					console.log(turl+","+JSON.stringify(msg));
				});
			}

    	});
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

function closeMyDoc()
{
	window.opener=null;
	window.open('','_self');
	window.close();
}

function openNewWindow(nurl) {
	//chrome.tabs.create({ url: newURL });
    let a = $("<a href='"+nurl+"' target='_blank'>baidu</a>").get(0);
    let e = document.createEvent('MouseEvents');
    e.initEvent( 'click', true, true );
    a.dispatchEvent(e);
}

function getPageNum(callback)
{
	var pageNum = 2;
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
function sleep(n,callback) {
    var start = new Date().getTime();
    while (true) {
        if (new Date().getTime() - start > n) {
            break;
        }
    }
    if(callback) callback("ok");
}

//将获取内容传递给后台文件进行处理
function sendMsg(url, msg, cmd){
	chrome.runtime.sendMessage({"url":url,"msg": msg, "cmd": cmd}, function(response) {});
}
