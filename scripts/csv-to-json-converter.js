const fs = require('fs');
const path = require('path');

function csvToJson(csvFilePath, jsonFilePath) {
    try {
        const csvData = fs.readFileSync(csvFilePath, 'utf8');
        
        if (csvData.trim() === '') {
            throw new Error('CSV file is empty');
        }
        
        const rows = parseCSV(csvData);
        
        if (rows.length === 0) {
            throw new Error('No valid rows found in CSV');
        }
        
        const headers = rows[0];
        const jsonArray = [];
        let currentExperiment = null;
        
        // Find the index of "Dependent Variable" column
        const dependentVariableIndex = headers.indexOf('Dependent Variable');
        
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i];
            
            // Check if this is a new experiment (Example is not null)
            const hasExample = values[0] && values[0].trim() !== '';
            
            if (hasExample) {
                // Create new experiment object with only the first 4 columns
                currentExperiment = {};
                for (let j = 0; j <= dependentVariableIndex; j++) {
                    currentExperiment[headers[j]] = values[j] || '';
                }
                
                // Add columns after "Dependent Variable" as subElements
                if (dependentVariableIndex >= 0 && dependentVariableIndex + 1 < headers.length) {
                    const subElement = {};
                    for (let j = dependentVariableIndex + 1; j < headers.length; j++) {
                        if (values[j]) {
                            subElement[headers[j]] = values[j];
                        }
                    }
                    
                    if (Object.keys(subElement).length > 0) {
                        currentExperiment.subElements = [subElement];
                    }
                }
                
                jsonArray.push(currentExperiment);
            } else if (currentExperiment) {
                // This is a sub-element, add it as additional data to the current experiment
                const subElement = {};
                headers.forEach((header, index) => {
                    if (values[index]) {
                        subElement[header] = values[index];
                    }
                });
                
                // Add sub-element data to current experiment
                if (!currentExperiment.subElements) {
                    currentExperiment.subElements = [];
                }
                currentExperiment.subElements.push(subElement);
            }
        }
        
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2));
        console.log(`✅ Successfully converted ${csvFilePath} to ${jsonFilePath}`);
        console.log(`📊 Converted ${jsonArray.length} experiments`);
        
    } catch (error) {
        console.error(`❌ Error converting CSV to JSON: ${error.message}`);
    }
}

function parseCSV(csvData) {
    const rows = [];
    const lines = csvData.split('\n');
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i];
        let j = 0;
        
        while (j < line.length) {
            const char = line[j];
            
            if (char === '"') {
                if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
                    currentField += '"';
                    j += 2;
                } else {
                    inQuotes = !inQuotes;
                    j++;
                }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentField.trim());
                currentField = '';
                j++;
            } else {
                currentField += char;
                j++;
            }
        }
        
        if (inQuotes) {
            currentField += '\n';
            i++;
        } else {
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
            i++;
        }
    }
    
    if (currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }
    
    return rows;
}

csvToJson(path.join(__dirname, 'data.csv'), path.join(__dirname, 'data.json'));