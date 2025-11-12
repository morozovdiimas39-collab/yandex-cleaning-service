export async function handler(req) {
  try {
    // Fetch the file content from GitHub API
    const apiUrl = 'https://api.github.com/repos/morozovdiimas39-collab/yandex-cleaning-service/git/blobs/2c745976ccab2f75e4af7f286f9adf9437ce055b';
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitFileExtractor'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Decode base64 content
    const base64Content = data.content.replace(/\n/g, '');
    const decodedContent = atob(base64Content);
    
    return new Response(decodedContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
