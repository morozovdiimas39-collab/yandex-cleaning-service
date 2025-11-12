const https = require('https');

console.log('Fetching data from API...\n');

https.get('https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const targetIds = ['10995', '11004'];
    const results = {};
    
    function searchTree(node, path = []) {
      if (!node) return;
      
      const currentPath = [...path, { value: node.value, label: node.label }];
      
      // Check if this is one of our target IDs
      if (targetIds.includes(node.value)) {
        results[node.value] = {
          id: node.value,
          label: node.label,
          path: currentPath,
          children: node.children || []
        };
      }
      
      // Recursively search children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          searchTree(child, currentPath);
        }
      }
    }
    
    // Search through all regions
    if (json.regions && Array.isArray(json.regions)) {
      for (const region of json.regions) {
        searchTree(region);
      }
    }
    
    // Print results
    console.log('='.repeat(70));
    console.log('SEARCH RESULTS');
    console.log('='.repeat(70));
    
    for (const id of targetIds) {
      console.log(`\n🔍 Searching for ID: ${id}`);
      
      if (results[id]) {
        const result = results[id];
        console.log(`✓ FOUND!`);
        console.log(`\n1. Label (name): ${result.label}`);
        console.log(`\n2. Complete path from root:`);
        result.path.forEach((node, index) => {
          const indent = '   '.repeat(index);
          console.log(`${indent}${index > 0 ? '└─ ' : ''}${node.label} (ID: ${node.value})`);
        });
        console.log(`\n3. Children: ${result.children.length > 0 ? result.children.length : 'None'}`);
        if (result.children.length > 0) {
          result.children.forEach(child => {
            console.log(`   - ${child.label} (ID: ${child.value})`);
          });
        }
      } else {
        console.log('✗ NOT FOUND');
      }
      console.log('');
    }
    
    console.log('='.repeat(70));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
