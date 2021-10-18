var feed;
var issueLink;
var title; 
var saved; 
var savedHeader; 
var toggleButton;
var slider;
var savedLinks;
var indexSavedLinks = 0;
var metadataList = [];
function appendMetadata(data) {
  fetch(new URL(data.link)).then(function (response) {
    return response.text();
  }).then(function (html) {
  
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    
    doc.querySelectorAll('meta').forEach(element => {if(element.name == "description" || element.name == "twitter:title") {data.element.innerText += element.content; return false;}});
  
  }).catch(function (err) {
    console.warn('Something went wrong.', err);
  });
}


document.addEventListener("DOMContentLoaded", (event) => {
  feed = document.getElementById("feed");
  slider = document.getElementById("slider");
  saved = document.getElementById("saved");
  title = document.getElementById("title");
  popView = document.getElementById("popView");
  loadMetadata = document.getElementById("loadMetadata");
  
  slider.addEventListener("change", (e)=> {
    Array.prototype.forEach.call(
      document.getElementsByClassName("container"), 
      (element)=>element.style.columnWidth = parseInt(e.target.value)+"em"
    );
  });

  popView.addEventListener("click", ()=> {
    chrome.tabs.create({url : "popup.html"}); 
    popup.cancel();
  });

  
  loadMetadata.addEventListener("click", () => {
    metadataList.forEach((item)=> {
      appendMetadata(item);
    });
  });
  
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
  var metadata = document.createElement("span");
  var comments = document.createElement("a");
  
  row.className = "link";
  network.innerText = hnLink.type+" ";
  title.className = `link_title${hnLink.new?" new":""}`;
  title.innerText = hnLink.title;
  title.href = hnLink.link;

  metadata.className = `metadata`;
  
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
  row.appendChild(metadata);
  row.appendChild(title);
  row.appendChild(comments);

  metadataList.push({element:metadata, link:hnLink.link});
  
  return row;
}
