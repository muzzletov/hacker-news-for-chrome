var maxFeedItems = 50;
var retryMilliseconds = 120000;
var firstRequest = true;
var hashedLinks = new Set();
var savedLinksHash = new Set();
var savedLinks = localStorage["HN.savedLinks"] === undefined? [] : JSON.parse(localStorage["HN.savedLinks"]);
var currentLinks = [];
var newItems = 0;

var updateFeed = ()=> {
  result = Promise.all([
    fetch('https://news.ycombinator.com/rss').then(async result => {
      return parseHNLinks((await result.text()));
      
    }),
    fetch('https://lobste.rs/newest.json').then(async result => {
      return parseLobsterLinks(await result.json() || []);
    })
  ]).then(result=> {
    addLinks(result.reduce((prev, current)=>prev.concat(current)));
  })

  localStorage["HN.LastRefresh"] = (new Date()).getTime();
}

function parseHNLinks(rawXmlStr) {
  items = [];
  var parser = new DOMParser();
  var doc = parser.parseFromString(rawXmlStr, "text/xml");
  var entries = doc.getElementsByTagName('entry')?.length == 0? doc.getElementsByTagName('item') : doc.getElementsByTagName('entry');
  var count = Math.min(entries.length, parseInt(maxFeedItems/2));
  
  for (var i = 0; i < count; i++) {
    item = entries.item(i);

    var itemTitle = item.getElementsByTagName('title')[0]?.textContent;
    var itemLink = item.getElementsByTagName('link')[0]?.textContent;
    var commentsLink = item.getElementsByTagName('comments')[0]?.textContent;
    items.push({
      type: "HN",
      link: itemLink || "", 
      title: itemTitle || "Unknown Title", 
      commentsLink: commentsLink || "",
      commentsCount: "",
      new: true
    })
  }

  return items;
}


function parseLobsterLinks(jsonData) {
  items = [];

  var count = Math.min(jsonData.length, parseInt(maxFeedItems/2));

  for (var i = 0; i < count; i++) {
    let item=jsonData[i]
    items.push({
      type: "LS",
      link: item.url || "", 
      title: item.title || "Unknown Title", 
      commentsCount: item.comments_count || 0,
      commentsLink: item.comments_url || 0,
      new: true
    })
  }

  return items;
}

function addLinks(items) {
  var newLinks = [];
  for (item of items) {
    if(hashedLinks.has(item.title+item.link) || savedLinksHash.has(item.title+item.link)) continue; 
    hashedLinks.add(item.title+item.link);
    newLinks.push(item);
    newItems++;
  }

  currentLinks = [...newLinks, ...currentLinks];

  chrome.browserAction.setBadgeText({text: newItems > 0 ? newItems.toString() : "" });
/*  if(newItems > 0)
    chrome.notifications.create(`my-notification-${Date.now()}`, {
      
      type: "basic",
      title: newItems+' new stories',
      message: '',
      iconUrl: "icon48.png",
      type: 'basic'
    });*/
  if(currentLinks.length > maxFeedItems) currentLinks = currentLinks.slice(0, maxFeedItems);
}

function openLink(e) {
  e.preventDefault();
  openUrl(this.href, (localStorage['HN.BackgroundTabs'] == 'false'));
}

function openLinkFront(ev) {
  e.preventDefault();
  openUrl(this.href, true);
}

function openUrl(url, takeFocus) {
  if (url.indexOf("http:") != 0 && url.indexOf("https:") != 0) {
    return;
  }
  chrome.tabs.create({url: url, selected: takeFocus});
}

function saveLink(hnLink) {
  savedLinks.push(hnLink);
  savedLinksHash.add(hnLink.title+hnLink.link);
  localStorage["HN.savedLinks"] = JSON.stringify(savedLinks);
}

chrome.alarms.create("refresh", {delayInMinutes: 15.0, periodInMinutes: 15.0} );
chrome.alarms.onAlarm.addListener((alarm)=>{
  updateFeed();
});

updateFeed();
