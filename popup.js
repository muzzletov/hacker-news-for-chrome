var feed;
var issueLink;
var title; 
var saved; 
var savedHeader; 
var toggleButton;
var savedLinks;
var indexSavedLinks = 0;
/***
 * - query controls
 * - populate list
 * - update badge
 */
document.addEventListener("DOMContentLoaded", (event) => {
  feed = document.getElementById("feed");
  saved = document.getElementById("saved");
  title = document.getElementById("title");
  pop_view = document.getElementById("pop_view");

  pop_view.addEventListener("click", ()=> {chrome.tabs.create({url : "popup.html"}); 
  popup.cancel();});
  title.addEventListener("click", chrome.extension.getBackgroundPage().openLink);

  chrome.extension.getBackgroundPage().newItems = 0;
  chrome.browserAction.setBadgeText({text: "" });

  buildPopup(feed, chrome.extension.getBackgroundPage().currentLinks, false);
  buildPopup(saved, appropriateArray(chrome.extension.getBackgroundPage().savedLinks, 0, false), true);
});
/***
* add scroll listener for infinite scroll
 */
document.addEventListener("scroll", (event)=>{
  
  if(parseInt(document.scrollingElement.offsetHeight) - parseInt(document.scrollingElement.clientHeight + document.scrollingElement.scrollTop) < 10
    && indexSavedLinks+chrome.extension.getBackgroundPage().maxFeedItems < chrome.extension.getBackgroundPage().savedLinks.length) {
      indexSavedLinks+=Math.min(chrome.extension.getBackgroundPage().savedLinks.length-indexSavedLinks, chrome.extension.getBackgroundPage().maxFeedItems);
      buildPopup(saved, appropriateArray(chrome.extension.getBackgroundPage().savedLinks, indexSavedLinks, indexSavedLinks+chrome.extension.getBackgroundPage().maxFeedItems), true);
  }
});

// prepare array
function appropriateArray(src, index, end) {
  var new_ = [];
  var length = Math.min(src.length, end 
    || chrome.extension.getBackgroundPage().maxFeedItems);
  
  for(var i = index; i < length; i++) new_.push(src[src.length-i-1]);

  return new_;
}

function handleClick(event, hnLink) {
  event.preventDefault();

  if(event.altKey) {
    chrome.extension.getBackgroundPage().saveLink(hnLink);
    event.target.parentNode.parentNode.removeChild(event.target.parentNode);
    saved.insertBefore(event.target.parentNode, saved.firstChild);
  } else chrome.extension.getBackgroundPage().openUrl(hnLink.link, (localStorage['HN.BackgroundTabs'] == 'false'));
}

function buildPopup(parent, links, keep) {
  for (var i=0; i<links.length; i++) 
    (keep || !chrome.extension.getBackgroundPage().savedLinksHash.has(links[i].title+links[i].link)) 
      && parent.appendChild(createLink(links[i]));
}

function createLink(hnLink) {
  var row = document.createElement("div");
  var network = document.createElement("span");
  var title = document.createElement("a");
  var comments = document.createElement("a");

  row.className = "link";
  network.innerText = hnLink.type+" ";
  title.className = `link_title${hnLink.new?" new":""}`;
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

  hnLink.new = false;

  row.appendChild(network);
  row.appendChild(title);
  row.appendChild(comments);

  return row;
}