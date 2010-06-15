var feedUrl = 'http://news.ycombinator.com/rss';
var maxFeedItems = 15;
var req;
var buildPopupAfterResponse = false;
var OnFeedSuccess = null;
var OnFeedFail = null;
var retryMilliseconds = 120000;

function SetInitialOption(key, value) {
	if (localStorage[key] == null) {
		localStorage[key] = value;
	}
}

function UpdateIfReady() {
  if (localStorage["HN.LastRefresh"] == null) {
    UpdateFeed();
  }
  var lastRefresh = localStorage["HN.LastRefresh"];
  var interval = localStorage["HN.RequestInterval"];
  if (lastRefresh + interval > (new Date()).getTime()) {
    UpdateFeed();
  }
}

function UpdateFeed() {
  req = new XMLHttpRequest();
  req.onload = HandleRssResponse;
  req.onerror = handleError;
  req.open("GET", feedUrl, true);
  req.send(null);
}

function HandleRssResponse() {
  var doc = req.responseXML;
  if (!doc) {
    doc = parseXml(req.responseText);
  }
  if (!doc) {
    handleFeedParsingFailed("Not a valid feed.");
    return;
  }
 	links = parseHNLinks(doc);
 	if (localStorage['HN.Notifications'] == 'true') {
    if (localStorage['HN.LastNotificationTitle'] == null || localStorage['HN.LastNotificationTitle'] != links[0].Title) {
      ShowLinkNotification(links[0]);
      localStorage['HN.LastNotificationTitle'] = links[0].Title;
    }
 	}
	SaveLinksToLocalStorage(links);
	if (buildPopupAfterResponse == true) {
		buildPopup(links);
		buildPopupAfterResponse = false;
	}
	localStorage["HN.LastRefresh"] = (new Date()).getTime();
}

function DebugMessage(message) {
  var notification = webkitNotifications.createNotification(
    "icon48.gif",
    "DEBUG",
    message
  );
  notification.show();

}

function ShowLinkNotification(link) {
  var notification = webkitNotifications.createHTMLNotification("notification.html");
  notification.show();
}

function handleError() {
  handleFeedParsingFailed('Failed to fetch RSS feed.');
}

function handleFeedParsingFailed(error) {
  var feed = document.getElementById("feed");
  feed.className = "error"
  feed.innerText = "Error: " + error;
  localStorage["HN.LastRefresh"] = localStorage["HN.LastRefresh"] + retryMilliseconds;
}

function parseXml(xml) {
  var xmlDoc;
  try {
    xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = false;
    xmlDoc.loadXML(xml);
  } catch (e) {
    xmlDoc = (new DOMParser).parseFromString(xml, 'text/xml');
  }

  return xmlDoc;
}

function parseHNLinks(doc) {
	var entries = doc.getElementsByTagName('entry');
	if (entries.length == 0) {
	  entries = doc.getElementsByTagName('item');
	}
  var count = Math.min(entries.length, maxFeedItems);
  var links = new Array();
  for (var i=0; i< count; i++) {
    item = entries.item(i);
    var hnLink = new Object();
    //Grab the title
    var itemTitle = item.getElementsByTagName('title')[0];
    if (itemTitle) {
      hnLink.Title = itemTitle.textContent;
    } else {
      hnLink.Title = "Unknown Title";
    }
    
    //Grab the Link
    var itemLink = item.getElementsByTagName('link')[0];
    if (!itemLink) {
      itemLink = item.getElementsByTagName('comments')[0];
    }
    if (itemLink) {
      hnLink.Link = itemLink.textContent;
    } else {
      hnLink.Link = '';
    }

    //Grab the comments link
    var commentsLink = item.getElementsByTagName('comments')[0];
    if (commentsLink) {
      hnLink.CommentsLink = commentsLink.textContent;
    } else {
      hnLink.CommentsLink = '';
    }
    
    links.push(hnLink);
  }
  return links;
}

function SaveLinksToLocalStorage(links) {
	localStorage["HN.NumLinks"] = links.length;
	for (var i=0; i<links.length; i++) {
		localStorage["HN.Link" + i] = JSON.stringify(links[i]);
	}
}

function RetrieveLinksFromLocalStorage() {
	var numLinks = localStorage["HN.NumLinks"];
	if (numLinks == null) {
		return null;
	}
	else {
		var links = new Array();
		for (var i=0; i<numLinks; i++) {
			links.push(JSON.parse(localStorage["HN.Link" + i]))
		}
		return links;
	}
}

function openLink() {
  openUrl(this.href, (localStorage['HN.BackgroundTabs'] == 'false'));
}

// Show |url| in a new tab.
function openUrl(url, take_focus) {
  // Only allow http and https URLs.
  if (url.indexOf("http:") != 0 && url.indexOf("https:") != 0) {
    return;
  }
  chrome.tabs.create({url: url, selected: take_focus});
}
	
	function hideElement(id) {
		var e = document.getElementById(id);
		e.style.display = 'none';
	}
	
	function showElement(id) {
		var e = document.getElementById(id);
    	e.style.display = 'block';
	}
	
	function toggle(id) {
     var e = document.getElementById(id);
     if(e.style.display == 'block')
        e.style.display = 'none';
     else
        e.style.display = 'block';
  }