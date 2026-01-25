import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API base URL - use environment variable or default to local
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

const importPriceSheetViaAPI = async () => {
  try {
    // Find Excel file - try all possible locations
    // Script is in VZ/backend/scripts/, need to go up 3 levels to reach root
    const possiblePaths = [
      path.join(__dirname, '../../../speedy-visakha-ship/src/assets/ITEM LIST-1.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/src/assets/ITEM LIST.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/ITEM LIST-1.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/ITEM LIST.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/public/ITEM LIST.xlsx'),
    ];
    
    let excelPath = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        excelPath = filePath;
        console.log(`✅ Found Excel file: ${filePath}`);
        break;
      }
    }
    
    if (!excelPath) {
      console.error('❌ Excel file not found. Please ensure ITEM LIST.xlsx or ITEM LIST-1.xlsx exists in speedy-visakha-ship directory.');
      process.exit(1);
    }
    
    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: ''
    });
    
    if (data.length === 0) {
      console.error('❌ Excel file is empty');
      process.exit(1);
    }
    
    // Parse data
    const headers = data[0] || [];
    const items = [];
    
    console.log('📋 Headers found:', headers);
    
    // Find column indices
    const itemNameIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('item') || 
           h.toString().toLowerCase().includes('product') ||
           h.toString().toLowerCase().includes('description') ||
           h.toString().toLowerCase().includes('name'))
    );
    const hsnIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('hsn')
    );
    const weightIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('weight') ||
           h.toString().toLowerCase().includes('kg'))
    );
    const rateIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('rate') ||
           h.toString().toLowerCase().includes('price') ||
           h.toString().toLowerCase().includes('amount') ||
           h.toString().toLowerCase().includes('cost'))
    );
    const destinationIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('destination')
    );
    const countryIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('country') ||
           h.toString().toLowerCase().includes('nation'))
    );
    const serviceIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('service')
    );
    
    console.log('🔍 Column indices:', {
      itemName: itemNameIndex,
      hsn: hsnIndex,
      weight: weightIndex,
      rate: rateIndex,
      destination: destinationIndex,
      country: countryIndex,
      service: serviceIndex
    });
    
    // Process rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const itemName = itemNameIndex >= 0 ? (row[itemNameIndex] || '').toString().trim() : '';
      const hsnCode = hsnIndex >= 0 ? (row[hsnIndex] || '').toString().trim() : '';
      const weight = weightIndex >= 0 ? (row[weightIndex] || '').toString().trim() : '';
      const rateStr = rateIndex >= 0 ? (row[rateIndex] || '').toString().trim() : '';
      const destination = destinationIndex >= 0 ? (row[destinationIndex] || '').toString().trim() : '';
      const country = countryIndex >= 0 ? (row[countryIndex] || '').toString().trim() : '';
      const serviceType = serviceIndex >= 0 ? (row[serviceIndex] || '').toString().trim() : '';
      
      const rate = parseFloat(rateStr.toString().replace(/[₹,$,\s]/g, '')) || 0;
      
      if (itemName && rate > 0) {
        items.push({
          itemName,
          hsnCode,
          weight,
          rate,
          destination,
          country,
          countryCode: '',
          serviceType,
          currency: 'INR'
        });
      } else if (itemName) {
        console.log(`⚠️  Skipping row ${i + 1}: Missing rate for "${itemName}"`);
      }
    }
    
    if (items.length === 0) {
      console.error('❌ No valid price items found in the Excel file');
      process.exit(1);
    }
    
    console.log(`✅ Parsed ${items.length} items from Excel file`);
    console.log('\n📊 Sample items (first 3):');
    items.slice(0, 3).forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.itemName} - ₹${item.rate}${item.country ? ` (${item.country})` : ''}`);
    });
    
    // Create price sheet via API
    console.log(`\n🌐 Creating price sheet via API: ${API_BASE_URL}`);
    
    const createResponse = await fetch(`${API_BASE_URL}/price-sheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetName: 'ITEM LIST',
        description: 'Imported from ITEM LIST.xlsx',
        isDefault: true
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Failed to create price sheet:', errorText);
      
      // Try to find existing sheet
      console.log('🔍 Checking for existing price sheet...');
      const getResponse = await fetch(`${API_BASE_URL}/price-sheets`);
      if (getResponse.ok) {
        const sheets = await getResponse.json();
        const existingSheet = sheets.find((s: any) => s.sheetName === 'ITEM LIST');
        if (existingSheet) {
          console.log(`✅ Found existing sheet: ${existingSheet._id}`);
          console.log('💡 Please use the Admin Dashboard UI to add items to this sheet, or delete it first.');
          process.exit(0);
        }
      }
      process.exit(1);
    }
    
    const createResult = await createResponse.json();
    const priceSheetId = createResult.priceSheet?._id || createResult._id;
    
    if (!priceSheetId) {
      console.error('❌ Failed to get price sheet ID from response');
      process.exit(1);
    }
    
    console.log(`✅ Created price sheet with ID: ${priceSheetId}`);
    
    // Add items via bulk import API
    console.log(`\n📦 Adding ${items.length} items via bulk import...`);
    
    const bulkResponse = await fetch(`${API_BASE_URL}/price-sheets/${priceSheetId}/items/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items })
    });
    
    if (!bulkResponse.ok) {
      const errorText = await bulkResponse.text();
      console.error('❌ Failed to import items:', errorText);
      process.exit(1);
    }
    
    const bulkResult = await bulkResponse.json();
    console.log(`✅ Successfully imported ${bulkResult.addedCount || items.length} items`);
    
    if (bulkResult.errors && bulkResult.errors.length > 0) {
      console.log('\n⚠️  Some items had errors:');
      bulkResult.errors.forEach((err: string) => console.log(`   - ${err}`));
    }
    
    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Total items: ${items.length}`);
    if (countryIndex >= 0) {
      const countries = [...new Set(items.map(i => i.country).filter(c => c))];
      console.log(`🌍 Countries: ${countries.length} unique`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing price sheet:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Your backend server is running');
    console.error('   2. API_BASE_URL is correct in .env or set as environment variable');
    console.error('   3. Or use the Admin Dashboard UI to create and import manually');
    process.exit(1);
  }
};

importPriceSheetViaAPI();
