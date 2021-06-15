var maxFeedItems = 25;
var retryMilliseconds = 120000;
var firstRequest = true;
var hashedLinks = {};
var currentLinks = [];
var savedLinks = localStorage["HN.savedLinks"] === undefined? [] : JSON.parse(localStorage["HN.savedLinks"]);
var savedLinksHash = new Set();
var newItems = 0;

var updateFeed = ()=> {
  fetch('https://news.ycombinator.com/rss').then(async result => {
    links = parseHNLinks(await result.text());
    localStorage["HN.LastRefresh"] = (new Date()).getTime();
  });
}

function parseHNLinks(rawXmlStr) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(rawXmlStr, "text/xml");
  var entries = doc.getElementsByTagName('entry');
  
  if (entries.length == 0) {
    entries = doc.getElementsByTagName('item');
  }

  var count = Math.min(entries.length, maxFeedItems);
  
  newLinks = [];
  hashedLinks ??= hashedLinks | {};

  for (var i = 0; i < count; i++) {
    item = entries.item(i);

    var itemTitle = item.getElementsByTagName('title')[0]?.textContent;
    var itemLink = item.getElementsByTagName('link')[0]?.textContent;
    var commentsLink = item.getElementsByTagName('comments')[0]?.textContent;
    var hnLink = {
      link: itemLink || "", 
      title: itemTitle || "Unknown Title", 
      commentsLink: commentsLink || ""
    };

    if(hashedLinks[hnLink.title+hnLink.link]
      || savedLinks[hnLink.title+hnLink.link]) continue; 
    
    newLinks.push(hnLink);
    newItems++;
  }
  
  hashedLinks = {};

  newLinks.forEach(x=>{
    hashedLinks[x.title+x.link] = true;
  });
  currentLinks = [...newLinks, ...currentLinks];
  chrome.browserAction.setBadgeText({text: newItems > 0 ? newItems.toString() : "" });
  
  if(currentLinks.length > maxFeedItems) currentLinks = currentLinks.slice(currentLinks.length-maxFeedItems);
}

function openLink(e) {
  e.preventDefault();
  openUrl(this.href, (localStorage['HN.BackgroundTabs'] == 'false'));
}

function openLinkFront(e) {
  e.preventDefault();
  openUrl(this.href, true);
}

function openUrl(url, take_focus) {
  if (url.indexOf("http:") != 0 && url.indexOf("https:") != 0) {
    return;
  }
  chrome.tabs.create({url: url, selected: take_focus});
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
