export async function getUrlMetadata(url) {
    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch metadata');
      
      return response.json();
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }
  
  