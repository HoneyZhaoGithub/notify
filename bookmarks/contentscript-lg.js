var onloadCount = 0;
var totalPage = 3;
var checklength=0;
var resumeLinks = [];
var domain = document.domain;
var cookie = document.cookie;
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
  		listResume();
	}
	else if('checkCompleted' == ccmd)
	{
		checkCompleted();
	}
	else if('cannext' == ccmd)
	{
		getObjectResumeLinks(tresumeLinks => {
			if('no'!= tresumeLinks)
			{
				resumeLinks = tresumeLinks;
				if(resumeLinks.length>0)
				{
					var clink = resumeLinks[0];
					resumeLinks.splice(0,1);
					chrome.storage.local.set({'resumeLinks':resumeLinks});
					console.log("resumeLinks length:"+resumeLinks.length);
					console.log(clink);
					openNewWindow(clink);
				}
				else
				{
					chrome.storage.local.remove('parseResumeList');
					//nextPage();
				}
			}
			else
			{
				chrome.storage.local.remove('parseResumeList');
				//nextPage();
			}
		});
	}
	else if('parse' == ccmd)
  	{
  		
  		if(currentUrl.indexOf("details.htm")>0)
  		{
  			chrome.storage.local.set({'parseResume':'1'});
  			getResume("owgcookie");
  		}
  		
  	}
  	else if('parseList' == ccmd)
  	{
  		if(currentUrl.indexOf("index.htm")>0 ||currentUrl.indexOf("list.htm")>0)
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


if(currentUrl.indexOf("details.htm")>0 || currentUrl.indexOf("index.htm")>0 || currentUrl.indexOf("list.htm")>0)
{
	getToken(token => {
		console.log("current page is for check,"+token);
		if('no'!= token)
		{
			console.log("current page is for check!");
			sendMsg(currentUrl,"", "checkCompleted");
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
				console.log("current resumeLinks length:"+ttresumeLinks.length);
				if(ttresumeLinks.length>0)
				{
					resumeLinks = ttresumeLinks;
					chrome.storage.local.get('resumeLinks', function (items) {
				    	var options= items;
				    	if (typeof(options['resumeLinks'])!="undefined")
				    	{
				    		lastlinks = options['resumeLinks'];
							ctresumeLinks = $.merge(ttresumeLinks, lastlinks);       
				    	}

				    	var clink = resumeLinks[0];
						resumeLinks.splice(0,1);
						chrome.storage.local.set({'resumeLinks':resumeLinks});
						console.log("resumeLinks length:"+resumeLinks.length);
						console.log(clink);
						openNewWindow(clink);
			    	});

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
	if(currentUrl.indexOf("details.htm")>0)
  	{
  		var resume=$("div.scrollarea.left-content").html();
		var data = "\ufeff"+" <div id='teamface'> <div class='scrollarea left-content'><center> <a href='"+currentUrl+"' target='_blank'>简历原文</a></center>"+resume +"</div></div>";  
		var blob = new Blob([data], { type: 'text/html,charset=UTF-8'});
		var aLink = document.createElement('a');
	    aLink.download = "lagou.com-"+document.title + ".html";
	    aLink.href = URL.createObjectURL(blob);
	    aLink.click();
	}
}

function getResume(cmd)
{
	getToken(token => 
	{
		console.log("current page is resume,"+token);
		if('no'!= token)
		{
			chrome.storage.local.remove('parseResume');
			var resume=$("div.scrollarea.left-content").html();
			chrome.runtime.sendMessage(
				{"url":currentUrl,"msg": resume, "cmd":cmd,"cookie":cookie,"domain":"https://"+domain,"name":"JSESSIONID"}, 
				function(response) {}
			);
			if('owgcookie'!=cmd)
			{
				closeMyDoc();
			}
		}
		else
		{
			alert('请先登录！');
		}
	});

}

function checkCompleted()
{
	chrome.storage.local.get('parseResumeList', function (items) {
    	var options= items;
    	console.log(options['parseResumeList'],'check');
    	if (typeof(options['parseResumeList'])!="undefined")
    	{
    		if(currentUrl.indexOf("details.htm")>0)
			{
				checkResume();
			}
			else if(currentUrl.indexOf("index.htm")>0)
			{
				if($('td.item-nickname > a').length>0)
				{
					listResume();
				}
				else
				{
					sendMsg(currentUrl,"", "checkCompleted");
				}
			}
    	}
    });
}

function checkResume()
{
	if($('div.resume-preview-container div.no_data').length>0)
	{
		nodata=$('div.resume-preview-container div.no_data').text();
		if(nodata.indexOf('失败')>=0)
		{
			window.location.reload();
		}
		else if(nodata.indexOf('正在加载简历')>=0 )
		{
			onloadCount++;
			if(onloadCount>2)
			{
				window.location.reload();
			}
			else
			{
				sendMsg(currentUrl,"", "checkCompleted");
			}
		}
		else
		{
			sendMsg(currentUrl,"", "checkCompleted");
		}
	}
	else
	{
		onloadCount=0;
		tlength = $('div.resume-preview-container').html().length;
		if(tlength==checklength)
		{
			getResume('wgcookie');
		}
		else
		{
			sendMsg(currentUrl,"", "checkCompleted");
		}
		checklength = tlength;
		console.log("check length:"+checklength);
	}
}

function getResumePDF()
{
	resumeId=$("div[data-resume-id]").attr("data-resume-id");
	resumeType =$("div[data-resume-id]").attr("class");
	if(resumeType.indexOf("PDF")>=0)
	{
		pdfurl = "https://easy.lagou.com/resume/"+resumeId+".pdfa";
			$.ajax({
				url:pdfurl,
				cache: false,
				type: "get",
				contentType: "application/pdf; charset=utf-8"
			}).done(function(msg) {
				console.log(typeof msg, 'seccuss.....')
				// let arrayBuffer = new Blob(msg, {type: "application/octet-binary"});
				let formData = new FormData()
				formData.append('pdf', msg);
				console.log(formData.get.pdf, 'WENJIAN')
				var serverDomain="http://192.168.1.172:8080/custom-resume/common/";
				var sererUrl=serverDomain+"/saveResume";
				$.ajax({
					url:sererUrl,
					cache: false,
					type: "post",
					contentType: "application/pdf; charset=utf-8",
					processData: false,
					processData: false,
					data: formData
				}).done(function(msg) {

					
				}).fail(function(msg) {
					console.log("fail:"+JSON.stringify(msg)); 
				});
				sendMsg(pdfurl,msg, "pdf");
			}).fail(function(msg) {
				console.log("fail:"+JSON.stringify(msg)); 
			});
	}
}

function getResumeLinks(callback)
{
	var tresumeLinks = [];
	$("td.item-nickname > a").each(function(index){
		var href = $(this).attr("href");
		var name = $(this).text();

		tresumeLinks.push(href);
		console.log(name+":"+href);
	});
	if(tresumeLinks.length==0)
	{
		$("a.book_nick").each(function(index){
			var href = $(this).attr("href");
			var name = $(this).text();

			tresumeLinks.push(href);
			console.log(name+":"+href);
		});
	}
	if(callback) callback(tresumeLinks);
}

function getObjectResumeLinks(callback)
{
	var resumeLinks='no';
    chrome.storage.local.get('resumeLinks', function (items) {
    	var options= items;
    	if (typeof(options['resumeLinks'])!="undefined")
    	{
    		resumeLinks = options['resumeLinks'];
    	}
    	if(callback) callback(resumeLinks);
    });
}

function getAllUserInfo(pageNum)
{

	var turl = "https://easy.lagou.com/can/new/list.json?can=true&stage=NEW&needQueryAmount=true&pageNo="+pageNum;
  		$.ajax({
			url: turl,
			cache: false,
			type: "post",
			data:"",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(msg) {
			sendMsg(turl,msg,"user");
		}).fail(function(msg) {
			console.log(turl+","+JSON.stringify(msg));
		});
	
}

function nextPage()
{
	var currentPage = 1;
	var pib = currentUrl.indexOf('pageNo=');
	if(pib>0)
	{
		currentPage = currentUrl.substring(pib+7);
	}
	var pageNum=parseInt(currentPage)+1;
   	console.log(pageNum,totalPage);
	if(pageNum <= totalPage)
	{
		console.log(pageNum,'gonext');
		//getAllUserInfo(pageNum);
		$('li.pagination-next').click();
		sendMsg(currentUrl,"", "checkCompleted");
	}
	else
	{
		chrome.storage.local.remove('parseResumeList');
	}

}

function nextPage2()
{
	getPageNum(pageNum => {
		chrome.storage.local.get('totalPage', function (items) {
	    	var options= items;
	    	if (typeof(options['totalPage'])!="undefined")
	    	{
	    		totalPage = options['totalPage'];
	    	}
	    	console.log(pageNum,totalPage);
	    	if(pageNum <= totalPage)
			{
				console.log(pageNum,'gonext');
				//getAllUserInfo(pageNum);
				var tlink = "https://easy.lagou.com/can/index.htm?can=true&stage=NEW&needQueryAmount=true&pageNo="+pageNum;
				openSelfWindow(tlink);
			}
			else
			{
				chrome.storage.local.remove('parseResumeList');
			}

		});
	});
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
	window.open(nurl);
}

function openSelfWindow(nurl) 
{
	window.open(nurl,'_self');
}

//将获取内容传递给后台文件进行处理
function sendMsg(url, msg, cmd,cookie)
{
	chrome.runtime.sendMessage({"url":url,"msg": msg, "cmd": cmd,'cookie':cookie}, function(response) {});
}
