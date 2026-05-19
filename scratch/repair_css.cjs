const fs = require('fs');
const path = 'src/App.css';
let content = fs.readFileSync(path, 'utf8');

// Fix the corrupted block near 1487
const corruptedRegex = /opacity: 0\.6;\s+transition: opacity 0\.3s ease;\s+\}\s+align-items: center;\s+gap: 1rem;\s+margin-bottom: 2\.5rem;\s+align-self: flex-start; \/\* Title stays left-aligned within the centered layout \*\/\s+width: 100%;\s+max-width: 1200px;\s+\}/g;

const restored = `opacity: 0.6;
  transition: opacity 0.3s ease;
}

.modules-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  align-self: flex-start;
  width: 100%;
  max-width: 1200px;
}`;

content = content.replace(corruptedRegex, restored);

// Also remove the duplicate .modules-grid-layout if it still exists
const duplicateGrid = /\.modules-grid-layout \{\s+padding: 40px 8%;\s+text-align: left;\s+display: flex;\s+flex-direction: column;\s+align-items: center; \/\* Center horizontally \*\/\s+height: 100vh;\s+justify-content: center; \/\* Center vertically \*\/\s+overflow: hidden; \/\* Remove scrolling \*\/\s+box-sizing: border-box;\s+\}/g;
content = content.replace(duplicateGrid, '');

fs.writeFileSync(path, content);
console.log('CSS Repaired');
