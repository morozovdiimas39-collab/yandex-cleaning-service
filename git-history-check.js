const { execSync } = require('child_process');

console.log('=== 1. Поиск ID a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d в истории backend/func2url.json ===\n');

try {
  // Получаем все коммиты, которые изменяли func2url.json
  const commits = execSync('git log --all --pretty=format:"%H|%ai|%s" -- backend/func2url.json', {encoding: 'utf-8'})
    .trim()
    .split('\n')
    .filter(line => line.length > 0);

  console.log(`Найдено ${commits.length} коммитов с изменениями backend/func2url.json\n`);

  let foundInCommit = null;
  let removedInCommit = null;

  for (const commit of commits) {
    const [hash, date, ...messageParts] = commit.split('|');
    const message = messageParts.join('|');
    
    try {
      const content = execSync(`git show ${hash}:backend/func2url.json`, {encoding: 'utf-8'});
      const hasId = content.includes('a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d');
      
      if (hasId && !foundInCommit) {
        foundInCommit = { hash, date, message };
      } else if (!hasId && foundInCommit && !removedInCommit) {
        removedInCommit = { hash, date, message };
        console.log('🔴 ID был УДАЛЁН в этом коммите:');
        console.log(`   Hash: ${hash}`);
        console.log(`   Дата: ${date}`);
        console.log(`   Сообщение: ${message}`);
        console.log('');
        break;
      }
    } catch (error) {
      // Файл не существовал в этом коммите
    }
  }

  if (!removedInCommit && foundInCommit) {
    console.log('ID ещё присутствует в самой ранней версии файла');
  } else if (!foundInCommit) {
    console.log('ID не найден ни в одном коммите');
  }

} catch (error) {
  console.error('Ошибка при проверке func2url.json:', error.message);
}

console.log('\n=== 2. Поиск по diff для точного коммита удаления ===\n');

try {
  const diffLog = execSync('git log --all -p -S "a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d" -- backend/func2url.json', {encoding: 'utf-8'});
  
  const lines = diffLog.split('\n');
  let currentCommit = null;
  let foundDeletion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('commit ')) {
      currentCommit = line.substring(7);
    } else if (line.startsWith('Date:')) {
      const date = line.substring(5).trim();
      if (currentCommit) {
        currentCommit = { hash: currentCommit, date };
      }
    } else if (line.startsWith('-') && line.includes('a0ab9dc8-671f-45ed-a5a9-a17f5e7fd34d') && !line.startsWith('---')) {
      console.log('🎯 Найдено удаление в diff:');
      console.log(`   Hash: ${currentCommit.hash}`);
      console.log(`   Дата: ${currentCommit.date}`);
      console.log(`   Удалённая строка: ${line}`);
      console.log('');
      foundDeletion = true;
      break;
    }
  }

  if (!foundDeletion) {
    console.log('Удаление не найдено в diff');
  }
} catch (error) {
  console.error('Ошибка при проверке diff:', error.message);
}

console.log('\n=== 3. Поиск папок backend/wordstat-regions/ и backend/regions/ ===\n');

try {
  // Проверяем wordstat-regions
  const wordstatLog = execSync('git log --all --diff-filter=D --summary -- "backend/wordstat-regions/*" 2>&1', {encoding: 'utf-8'});
  if (wordstatLog && wordstatLog.trim().length > 0) {
    console.log('Найдены удаления в backend/wordstat-regions/:');
    console.log(wordstatLog.split('\n').slice(0, 10).join('\n'));
  } else {
    console.log('Папка backend/wordstat-regions/ не найдена в истории');
  }
} catch (error) {
  console.log('Папка backend/wordstat-regions/ не найдена в истории');
}

console.log('');

try {
  // Проверяем regions
  const regionsLog = execSync('git log --all --diff-filter=D --summary -- "backend/regions/*" 2>&1', {encoding: 'utf-8'});
  if (regionsLog && regionsLog.trim().length > 0) {
    console.log('Найдены удаления в backend/regions/:');
    console.log(regionsLog.split('\n').slice(0, 10).join('\n'));
  } else {
    console.log('Папка backend/regions/ не найдена в истории');
  }
} catch (error) {
  console.log('Папка backend/regions/ не найдена в истории');
}

console.log('\n=== 4. Поиск всех файлов с "regions" в пути ===\n');

try {
  const allFiles = execSync('git log --all --name-only --pretty=format:"" | grep -i regions | sort | uniq', {encoding: 'utf-8'});
  if (allFiles.trim()) {
    console.log('Файлы с "regions" в пути, когда-либо существовавшие в проекте:');
    console.log(allFiles);
  } else {
    console.log('Файлы с "regions" в пути не найдены');
  }
} catch (error) {
  console.log('Файлы с "regions" в пути не найдены');
}

console.log('\n=== 5. Коммиты упоминающие "regions" в сообщении ===\n');

try {
  const grepLog = execSync('git log --all --oneline --grep="regions" -i', {encoding: 'utf-8'});
  if (grepLog.trim()) {
    console.log('Коммиты с упоминанием "regions":');
    console.log(grepLog);
  } else {
    console.log('Коммиты с упоминанием "regions" не найдены');
  }
} catch (error) {
  console.log('Коммиты с упоминанием "regions" не найдены');
}

console.log('\n=== 6. Последние 15 коммитов изменявших backend/func2url.json ===\n');

try {
  const recentCommits = execSync('git log --pretty=format:"%h|%ai|%s" -15 -- backend/func2url.json', {encoding: 'utf-8'});
  console.log(recentCommits);
} catch (error) {
  console.error('Ошибка:', error.message);
}
