/**
 * CSV Parser Utility
 * Parses CSV content into an array of objects
 */

interface CsvParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
}

export function parseCSV<T = Record<string, string>>(
  csvContent: string,
  options: CsvParseOptions = {}
): T[] {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    trimValues = true,
  } = options;

  const lines = csvContent.split(/\r?\n/);
  
  if (lines.length === 0) {
    return [];
  }

  // Extract headers from first line
  const headers = parseLine(lines[0], delimiter, trimValues);
  
  const results: T[] = [];

  // Process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines if configured
    if (skipEmptyLines && !line.trim()) {
      continue;
    }

    const values = parseLine(line, delimiter, trimValues);
    
    // Create object from headers and values
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    results.push(row as T);
  }

  return results;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseLine(line: string, delimiter: string, trim: boolean): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      // Handle escaped quotes
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(trim ? current.trim() : current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last value
  result.push(trim ? current.trim() : current);

  return result;
}

/**
 * Convert array of objects back to CSV string
 */
export function toCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header line
  const lines: string[] = [csvHeaders.join(',')];

  // Create data lines
  for (const row of data) {
    const values = csvHeaders.map(header => {
      const value = row[header]?.toString() || '';
      // Quote value if it contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}
