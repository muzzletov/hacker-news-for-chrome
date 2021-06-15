var feed;
var issueLink;
var title; 
var saved; 
var savedHeader; 
var toggleButton;
var savedLinks;

document.addEventListener("DOMContentLoaded", (event) => {
  feed = document.getElementById("feed");
  saved = document.getElementById("saved");

  title = document.getElementById("title");
  title.addEventListener("click", chrome.extension.getBackgroundPage().openLink);

  chrome.extension.getBackgroundPage().newItems = 0;
  chrome.browserAction.setBadgeText({text: "" });

  buildPopup(feed, chrome.extension.getBackgroundPage().currentLinks, false);
  buildPopup(saved, appropriateArray(chrome.extension.getBackgroundPage().savedLinks), true);
  
});

function appropriateArray(src) {
  var new_ = [];
  var length = Math.min(src.length, chrome.extension.getBackgroundPage().maxFeedItems);
  
  for(var i = 0; i < length; i++) 
    new_.push(src[src.length-i-1]);
  
  return new_;
}

function handleClick(event, hnLink) {
  event.preventDefault();

  if(event.ctrlKey) {
    chrome.extension.getBackgroundPage().saveLink(hnLink);
    event.target.parentNode.parentNode.removeChild(event.target.parentNode);
    saved.insertBefore(event.target.parentNode, saved.firstChild);
    
  } else chrome.extension.getBackgroundPage().openUrl(hnLink.link, (localStorage['HN.BackgroundTabs'] == 'false'));
}

function buildPopup(parent, links, keep) {
  
  for (var i=0; i<links.length; i++) {
    if(keep 
        || !chrome.extension.getBackgroundPage().savedLinksHash.has(links[i].title+links[i].link))
      parent.appendChild(createLink(links[i]));
  }

}

function createLink(hnLink) {
  var row = document.createElement("div");
  var title = document.createElement("a");
  var comments = document.createElement("a");

  row.className = "link";
  
  title.className = "link_title";
  title.innerText = hnLink.title;
  title.href = hnLink.link;
  
  comments.className = "comments";
  comments.innerText = "(comments)";
  comments.href = hnLink.commentsLink;

  comments.addEventListener("click", (event)=>{
    chrome.extension.getBackgroundPage().openUrl(event.target.href, (localStorage['HN.BackgroundTabs'] == 'false'));
  });
  
  title.addEventListener("click", (event)=>{
    handleClick(event, hnLink);
  });

  row.appendChild(title);
  row.appendChild(comments);

  return row;
}