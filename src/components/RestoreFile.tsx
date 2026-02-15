import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BACKEND_URLS } from '@/config/backend-urls';

export default function RestoreFile() {
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState('');

  const restoreFile = async () => {
    try {
      setStatus('Fetching file from git commit 1e84b6d...');
      
      const baseUrl = BACKEND_URLS['save-git-file'];
      const chunkSize = 10000;
      let allContent = '';
      let chunkNum = 0;
      let hasMore = true;

      while (hasMore) {
        const url = `${baseUrl}?chunk=${chunkNum}&size=${chunkSize}`;
        setProgress(`Fetching chunk ${chunkNum}...`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        allContent += data.chunk;
        hasMore = data.has_more;
        chunkNum++;
        
        setProgress(`Progress: ${data.end}/${data.total_length} bytes (${Math.round(data.end / data.total_length * 100)}%)`);
      }

      // Download the file
      const blob = new Blob([allContent], { type: 'text/plain' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'ResultsStep.original.tsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setStatus(`Success! File downloaded (${allContent.length} characters)`);
      
      // Also log to console for easy access
      console.log('=== COMPLETE FILE CONTENT ===');
      console.log(allContent);
      console.log('=== END OF FILE ===');
      
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Restore ResultsStep.tsx from Git</h2>
      <p>This will fetch the original ResultsStep.tsx file from commit 1e84b6d (before the refactoring)</p>
      
      <Button onClick={restoreFile}>
        Restore Original File
      </Button>
      
      {status && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Status:</strong> {status}
        </div>
      )}
      
      {progress && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#e8f4f8', borderRadius: '4px' }}>
          {progress}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>After downloading, you can:</p>
        <ul>
          <li>Replace the current ResultsStep.tsx with the downloaded file</li>
          <li>Or check the browser console for the complete file content</li>
        </ul>
      </div>
    </div>
  );
}
