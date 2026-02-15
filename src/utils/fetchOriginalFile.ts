import { BACKEND_URLS } from '@/config/backend-urls';

// Utility to fetch the original ResultsStep.tsx from git (uses save-git-file endpoint)
export async function fetchOriginalResultsStep(): Promise<string> {
  const response = await fetch(BACKEND_URLS['save-git-file']);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  return await response.text();
}

// For debugging/one-time use: download the file
export async function downloadOriginalFile() {
  try {
    const content = await fetchOriginalResultsStep();
    console.log('File length:', content.length);
    console.log('First 1000 chars:', content.substring(0, 1000));
    
    // Create a blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ResultsStep.original.tsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return content;
  } catch (error) {
    console.error('Error fetching original file:', error);
    throw error;
  }
}
