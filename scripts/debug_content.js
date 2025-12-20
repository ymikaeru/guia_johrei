const fs = require('fs');

const ptData = JSON.parse(fs.readFileSync('data/fundamentos.json', 'utf8'));
const jaData = JSON.parse(fs.readFileSync('data/fundamentos_ja.json', 'utf8'));

const id = 'fundamentos_45';

const ptItem = ptData.find(i => i.id === id);
const jaItem = jaData.find(i => i.id === id);

if (!ptItem || !jaItem) {
    console.log("Item not found");
    process.exit(1);
}

const ptContent = ptItem.content;
let jaContent = jaItem.content;

// Retrieve regex used in modal.js
jaContent = jaContent.replace(/^\s*[（(].+?[）)]\s*/s, '').trim();

console.log("--- PT Content Analysis ---");
console.log("Raw Length:", ptContent.length);
console.log("Newlines:", ptContent.split('\n').length);
console.log("Double Newlines:", ptContent.split('\n\n').length);
console.log("Preview Lines:");
ptContent.split('\n').forEach((l, i) => console.log(`[${i}] ${l.substring(0, 20)}...`));

console.log("\n--- JA Content Analysis ---");
console.log("Raw Length:", jaContent.length);
console.log("Newlines:", jaContent.split('\n').length);
console.log("Double Newlines:", jaContent.split('\n\n').length);
console.log("Preview Lines:");
jaContent.split('\n').forEach((l, i) => console.log(`[${i}] ${l.substring(0, 20)}...`));

// Compare paragraph blocks (splitting by \n\n)
const ptBlocks = ptContent.split(/\n\n+/).filter(x => x.trim());
const jaBlocks = jaContent.split(/\n\n+/).filter(x => x.trim());

console.log("\n--- Block Comparison (split by \\n\\n) ---");
console.log(`PT Blocks: ${ptBlocks.length}`);
console.log(`JA Blocks: ${jaBlocks.length}`);

for (let i = 0; i < Math.max(ptBlocks.length, jaBlocks.length); i++) {
    console.log(`Block ${i}:`);
    console.log(`  PT: ${ptBlocks[i] ? 'Present' : 'MISSING'} (${ptBlocks[i] ? ptBlocks[i].length : 0} chars)`);
    console.log(`  JA: ${jaBlocks[i] ? 'Present' : 'MISSING'} (${jaBlocks[i] ? jaBlocks[i].length : 0} chars)`);
}
