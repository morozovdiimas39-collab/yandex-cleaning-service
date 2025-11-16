// Скрипт для проверки ID Ставрополя из Яндекс API
const https = require('https');

https.get('', (resp) => { //https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const json = JSON.parse(data);
    
    function findInTree(node, path = []) {
      const currentPath = [...path, { id: node.value, name: node.label }];
      
      // Проверяем текущий узел
      if (node.label && (
        node.label.includes('Ставроп') || 
        node.label.includes('Северо-Кавказ')
      )) {
        console.log('\n📍 НАЙДЕНО:', node.label);
        console.log('   ID:', node.value);
        console.log('   Путь:', currentPath.map(p => `${p.name} (${p.id})`).join(' → '));
        
        // Если есть дети, показываем их
        if (node.children) {
          console.log('   Дети:');
          node.children.forEach(child => {
            console.log(`     - ${child.label} (ID: ${child.value})`);
          });
        }
      }
      
      // Рекурсивно проверяем детей
      if (node.children) {
        node.children.forEach(child => findInTree(child, currentPath));
      }
    }
    
    // Ищем в дереве регионов
    json.regions.forEach(region => findInTree(region));
  });
}).on('error', (err) => {
  console.error('Ошибка:', err.message);
});
