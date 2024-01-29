// Retrieve an article from local storage
function getStoredArticle() {
  return localStorage.getItem("confluenceArticle");
}

// Display the article in the popup
function displayStoredArticle() {
  const article = getStoredArticle();
  document.getElementById("content").innerHTML = article || "No article available.";
}

// Call the function when the popup is loaded
displayStoredArticle();
