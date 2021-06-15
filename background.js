var maxFeedItems = 25;
var retryMilliseconds = 120000;
var firstRequest = true;
var hashedLinks = new Set();
var savedLinksHash = new Set();
var currentLinks = [];
var savedLinks = localStorage["HN.savedLinks"] === undefined? [] : JSON.parse(localStorage["HN.savedLinks"]);
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
  
  var newLinks = [];
  
  for (var i = 0; i < count; i++) {
    item = entries.item(i);

    var itemTitle = item.getElementsByTagName('title')[0]?.textContent;
    var itemLink = item.getElementsByTagName('link')[0]?.textContent;
    var commentsLink = item.getElementsByTagName('comments')[0]?.textContent;
    var hnLink = {
      link: itemLink || "", 
      title: itemTitle || "Unknown Title", 
      commentsLink: commentsLink || "",
      new: true
    };

    if(hashedLinks.has(hnLink.title+hnLink.link) || savedLinksHash.has(hnLink.title+hnLink.link)) continue; 
    hashedLinks.add(hnLink.title+hnLink.link);
    newLinks.push(hnLink);
    newItems++;
  }

  currentLinks = [...newLinks, ...currentLinks];
  chrome.browserAction.setBadgeText({text: newItems > 0 ? newItems.toString() : "" });
  if(currentLinks.length > maxFeedItems) currentLinks = currentLinks.slice(0, maxFeedItems);
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

chrome.alarms.create("refresh", {delayInMinutes: 1.0, periodInMinutes: 1.0} );
chrome.alarms.onAlarm.addListener((alarm)=>{
  updateFeed();
});

updateFeed();
