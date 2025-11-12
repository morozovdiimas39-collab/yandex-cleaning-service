const https = require('https');

https.get('https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const foundRegions = [];
    
    function searchTree(node, parentId = null, parentName = null, level = 0) {
      if (!node || !node.label) return;
      
      // Check if node matches our search
      if (node.label.includes('Ставроп') || node.label.includes('Северо-Кавказ')) {
        foundRegions.push({
          id: node.value,
          name: node.label,
          parent_id: parentId,
          parent_name: parentName,
          level: level,
          has_children: node.children && node.children.length > 0,
          children_count: node.children ? node.children.length : 0,
          full_node: node
        });
      }
      
      // Recursively search children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          searchTree(child, node.value, node.label, level + 1);
        }
      }
    }
    
    // Search through all regions
    if (json.regions && Array.isArray(json.regions)) {
      for (const region of json.regions) {
        searchTree(region, null, 'Россия', 0);
      }
    }
    
    console.log('='.repeat(80));
    console.log('ALL REGIONS CONTAINING "Ставроп" OR "Северо-Кавказ"');
    console.log('='.repeat(80));
    
    foundRegions.forEach((region, idx) => {
      console.log(`\n[${idx + 1}] ${region.name}`);
      console.log(`    ID: ${region.id}`);
      console.log(`    Parent ID: ${region.parent_id || 'ROOT'}`);
      console.log(`    Parent Name: ${region.parent_name || 'N/A'}`);
      console.log(`    Children: ${region.children_count}`);
      if (region.children_count > 0) {
        console.log(`    Child cities:`);
        region.full_node.children.forEach(child => {
          console.log(`      - ${child.label} (ID: ${child.value})`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('COMPLETE HIERARCHY FOR STAVROPOL');
    console.log('='.repeat(80));
    
    // Find the specific hierarchy
    const ncfd = foundRegions.find(r => r.name.includes('Северо-Кавказский'));
    const krai = foundRegions.find(r => r.name === 'Ставропольский край');
    const city = krai?.full_node.children?.find(c => c.label === 'Ставрополь');
    
    console.log('\n1. Россия (225) [ROOT]');
    if (ncfd) {
      console.log(`   └─ ${ncfd.name} (${ncfd.id}) [FEDERAL DISTRICT]`);
    }
    if (krai) {
      console.log(`       └─ ${krai.name} (${krai.id}) [KRAI]`);
    }
    if (city) {
      console.log(`           └─ ${city.label} (${city.value}) [CITY]`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('FINAL ANSWERS FROM API');
    console.log('='.repeat(80));
    console.log(`\n1. Ставропольский край ID: ${krai?.id || 'NOT FOUND'}`);
    console.log(`2. Ставрополь city ID: ${city?.value || 'NOT FOUND'}`);
    console.log(`3. Parent of Ставрополь city: ${krai?.id || 'NOT FOUND'} (${krai?.name || 'N/A'})`);
    console.log(`4. Северо-Кавказский федеральный округ ID: ${ncfd?.id || 'NOT FOUND'}`);
    console.log('');
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
