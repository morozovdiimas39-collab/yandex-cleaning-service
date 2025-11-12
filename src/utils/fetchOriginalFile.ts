// Utility to fetch the original ResultsStep.tsx from git
export async function fetchOriginalResultsStep(): Promise<string> {
  const response = await fetch('https://functions.poehali.dev/a3303416-e846-4220-9585-089be8a0ccc2');
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
