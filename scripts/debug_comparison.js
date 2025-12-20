const fs = require('fs');
const path = require('path');

// Mock STATE and data
const STATE = { modalFontSize: 18, modalAlignment: 'justify' };

function formatBodyText(text, searchQuery, focusPoints) {
    if (!text) return '';
    return text.split('\n').map(line => `<p>${line}</p>`).join('');
}

function renderBilingualContent(item) {
    if (!item) return;

    const ptContent = item.content_pt || item.content || '';
    let jaContent = item.content_ja || '';

    console.log(`\n--- Testing Item: ${item.title} ---`);
    console.log(`Original JA Content Length: ${jaContent.length}`);

    // Remove Japanese headers/titles from the beginning
    const originalJa = jaContent;
    jaContent = jaContent
        .replace(/^[（\(][^）\)]+[）\)]\s*\n*/m, '') // Remove (Title) at start
        .replace(/^#{1,6}\s+[^\n]+\n*/m, '') // Remove ### Headers at start
        .replace(/^\*\*[^\*]+\*\*\s*\n*/m, '') // Remove **Bold Title** at start
        .replace(/^【[^】]+】\s*\n*/m, '') // Remove 【Title】 at start
        .trim();

    if (jaContent.length !== originalJa.length) {
        console.log("Cleaned header from Japanese content.");
    } else {
        console.log("No header cleaning performed.");
    }

    // Paragraph counting
    const ptParas = ptContent.split('\n\n').filter(p => p.trim()).length;
    const jaParas = jaContent.split('\n\n').filter(p => p.trim()).length;

    console.log(`PT Paragraphs: ${ptParas}`);
    console.log(`JA Paragraphs: ${jaParas}`);

    const diff = Math.abs(ptParas - jaParas);
    const maxParas = Math.max(ptParas, jaParas);
    const alignmentPercent = maxParas > 0 ? Math.round((1 - diff / maxParas) * 100) : 100;

    console.log(`Alignment Score: ${alignmentPercent}%`);

    if (ptParas !== jaParas) {
        console.warn("MISMATCH detected!");
    } else {
        console.log("Perfect alignment.");
    }
}

// Load Data
try {
    const dataPath = path.join(__dirname, 'data/fundamentos.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    // Filter items that have content_ja
    const validItems = data.filter(item => item.content_ja && item.content_ja.length > 0);

    console.log(`Found ${validItems.length} items with Japanese content.`);

    // Test the first 3
    validItems.slice(0, 3).forEach(renderBilingualContent);

} catch (err) {
    console.error("Error reading data:", err);
}
