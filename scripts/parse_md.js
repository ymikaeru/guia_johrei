const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../Docx_Original');
const OUTPUT_DIR = path.join(__dirname, '../data/generated');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function processFile(filename) {
    const filePath = path.join(SOURCE_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Simple parser: Split by headers (Markdown #)
    // Adjust regex based on actual Markdown structure
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let orderCounter = 0;

    // Helper to save current section
    const saveSection = () => {
        if (currentSection) {
            currentSection.content = currentSection.content.join('\n').trim();
            if (currentSection.content.length > 0 || currentSection.title) {
                sections.push(currentSection);
            }
        }
    };

    lines.forEach(line => {
        const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
        if (headerMatch) {
            saveSection();
            currentSection = {
                id: `generated_${path.basename(filename, '.md').replace(/\s+/g, '_')}_${orderCounter++}`,
                title: headerMatch[2].trim(),
                content: [],
                source: path.basename(filename, '.md'),
                tags: [], // Placeholder
                order: orderCounter
            };
        } else {
            if (currentSection) {
                currentSection.content.push(line);
            } else {
                // Content before first header? 
                // Maybe treat as a Preface or ignore if empty
                if (line.trim().length > 0) {
                    currentSection = {
                        id: `generated_${path.basename(filename, '.md').replace(/\s+/g, '_')}_${orderCounter++}`,
                        title: "Intro / Prefácio",
                        content: [line],
                        source: path.basename(filename, '.md'),
                        tags: [],
                        order: orderCounter
                    };
                }
            }
        }
    });
    saveSection();

    return sections;
}

// Main execution
try {
    const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));

    files.forEach(file => {
        console.log(`Processing ${file}...`);
        const data = processFile(file);

        const outputFilename = `generated_${file.replace('.md', '.json').replace(/\s+/g, '_')}`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Saved ${data.length} items to ${outputPath}`);
    });

    console.log("Processing complete.");

} catch (e) {
    console.error("Error processing files:", e);
}
