const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../app');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If file contains Alert.alert
      if (content.includes('Alert.alert')) {
        console.log('Updating: ' + fullPath);
        
        // Replace Alert.alert with AlertService.alert
        content = content.replace(/Alert\.alert/g, 'AlertService.alert');
        
        // Add import { AlertService } from '@/contexts/AlertContext'; if not already present
        if (!content.includes("import { AlertService }")) {
          // find the last import to put this one after it, or just put it at the top
          const lastImportIndex = content.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
            const endOfLine = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfLine + 1) + "import { AlertService } from '@/contexts/AlertContext';\n" + content.slice(endOfLine + 1);
          } else {
            content = "import { AlertService } from '@/contexts/AlertContext';\n" + content;
          }
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

scanDir(srcDir);
console.log('Done replacing Alerts in partner/app');
