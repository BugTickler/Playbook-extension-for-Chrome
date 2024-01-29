// Retrieve tags from the alert based on the ID from the URL
async function getAlertTags() {
  // Get alert ID from the URL
  const alertIdFromUrl = getAlertIdFromUrl();

  if (!alertIdFromUrl) {
    console.error('Failed to retrieve alert ID from the URL.');
    return [];
  }

  try {
    const response = await fetch(`https://api.opsgenie.com/v2/alerts/${alertIdFromUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ', // Replace with your access token
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const alertData = await response.json();

    // Return an array of tags
    return alertData.data.tags || [];
  } catch (error) {
    console.error('Error while retrieving tags from the alert:', error.message);
    return [];
  }
}

// Helper function to get the alert ID from the URL
function getAlertIdFromUrl() {
  const url = window.location.href;
  const matches = url.match(/\/alert\/detail\/([^/]+)\/details/);

  if (matches && matches.length > 1) {
    return matches[1];
  }

  return null;
}

// Check if a given tag starts with "Search::"
function isSearchTag(tag) {
  return tag.startsWith("Search::");
}

// Function to obtain OAuth access token
async function getConfluenceAccessToken() {
  const confluenceBaseUrl = ""; // Replace with the URL of your Confluence instance
  const clientId = ""; // Replace with the client ID of your OAuth application
  const clientSecret = ""; // Replace with the client secret of your OAuth application
  const tokenUrl = `${confluenceBaseUrl}/wiki/plugins/servlet/oauth/token`;

  const requestBody = new URLSearchParams();
  requestBody.append('grant_type', 'client_credentials');
  requestBody.append('client_id', clientId);
  requestBody.append('client_secret', clientSecret);

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`Error while obtaining access token: ${response.status}`);
    }

    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error while obtaining access token:', error.message);
    return null;
  }
}

// Send a request to Confluence to retrieve an article
async function getConfluenceArticle(query) {
  const confluenceBaseUrl = ""; // Replace with the URL of your Confluence instance
  const spaceKey = ""; // Replace with the space key of your documentation

  try {
    // Get the access token
    const accessToken = await getConfluenceAccessToken();

    if (!accessToken) {
      console.error('Failed to obtain access token.');
      return "No article content.";
    }

    // Search for articles based on the query in a specific Confluence space
    const response = await fetch(`${confluenceBaseUrl}/rest/api/content?spaceKey=${spaceKey}&q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const searchData = await response.json();

    // Check if any results were found
    if (searchData.results && searchData.results.length > 0) {
      // Get the details of the first found article
      const articleId = searchData.results[0].id;

      // Get the details of the article
      const articleResponse = await fetch(`${confluenceBaseUrl}/rest/api/content/${articleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!articleResponse.ok) {
        throw new Error(`Error while retrieving article: ${articleResponse.status}`);
      }

      const articleData = await articleResponse.json();
      return articleData.body && articleData.body.view ? articleData.body.view.value : "No article content.";
    } else {
      console.error('Article not found.');
      return "No article content.";
    }
  } catch (error) {
    console.error('Error while retrieving article from Confluence:', error.message);
    return "No article content.";
  }
}

// Display the article
function displayArticle(article) {
  // Get the element where you want to display the article
  const articleContainer = document.getElementById('content');

  // Check if the element is found
  if (articleContainer) {
    // Clear the existing content of the element (if any)
    articleContainer.innerHTML = '';

    // Create a div element to display the article content
    const articleDiv = document.createElement('div');
    articleDiv.innerHTML = article;

    // Add the created element to the article container
    articleContainer.appendChild(articleDiv);
  } else {
    console.error('Could not find an element with the ID "content" to display the article.');
  }
}

// Automatically call the function when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
  processAlertTags();
});

// Helper function to retrieve the query part after "Search::"
function getSearchQuery(tag) {
  return tag.substring("Search::".length);
}

// Main function handling tags on the Opsgenie alert page
function processAlertTags() {
  const tags = getAlertTags();

  for (const tag of tags) {
    if (isSearchTag(tag)) {
      const query = getSearchQuery(tag);
      const article = getConfluenceArticle(query);
      displayArticle(article);
      break; // End when the first matching tag is found
    }
  }
}