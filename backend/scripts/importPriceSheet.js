import mongoose from 'mongoose';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PriceSheet from '../models/PriceSheet.js';
import connectDB from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importPriceSheet = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find Excel file - try all possible locations
    // Script is in VZ/backend/scripts/, need to go up 3 levels to reach root
    const possiblePaths = [
      path.join(__dirname, '../../../speedy-visakha-ship/src/assets/ITEM LIST-1.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/src/assets/ITEM LIST.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/ITEM LIST-1.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/ITEM LIST.xlsx'),
      path.join(__dirname, '../../../speedy-visakha-ship/public/ITEM LIST.xlsx'),
    ];
    
    console.log('🔍 Searching for Excel file...');
    console.log(`📁 Script location: ${__dirname}`);
    
    let excelPath = null;
    for (const filePath of possiblePaths) {
      const resolvedPath = path.resolve(filePath);
      console.log(`   Checking: ${resolvedPath}`);
      if (fs.existsSync(resolvedPath)) {
        excelPath = resolvedPath;
        console.log(`✅ Found Excel file: ${resolvedPath}`);
        break;
      }
    }
    
    if (!excelPath) {
      console.error('❌ Excel file not found in any of the checked locations.');
      console.error('💡 Please ensure ITEM LIST.xlsx or ITEM LIST-1.xlsx exists in one of these locations:');
      possiblePaths.forEach(p => console.error(`   - ${path.resolve(p)}`));
      process.exit(1);
    }
    
    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Get first sheet
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
    
    // Parse data - assuming first row is headers
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
    
    // Process rows (skip header row)
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
      
      // Parse rate (remove currency symbols, commas, etc.)
      // Try to parse rate - check multiple formats
      let rate = 0;
      if (rateStr) {
        rate = parseFloat(rateStr.toString().replace(/[₹,$,\s]/g, '')) || 0;
      }
      
      // If rate is still 0, try checking if there's a number in the row
      if (rate === 0 && row.length > rateIndex) {
        // Check adjacent columns for rate-like values
        for (let col = Math.max(0, rateIndex - 2); col < Math.min(row.length, rateIndex + 3); col++) {
          if (col !== itemNameIndex && col !== hsnIndex && col !== weightIndex) {
            const val = (row[col] || '').toString().trim();
            const numVal = parseFloat(val.replace(/[₹,$,\s]/g, ''));
            if (!isNaN(numVal) && numVal > 0) {
              rate = numVal;
              console.log(`   Found rate ${rate} in column ${col} for "${itemName}"`);
              break;
            }
          }
        }
      }
      
      // Only add if we have at least item name (rate can be 0 for now, user can update later)
      if (itemName) {
        items.push({
          itemName,
          hsnCode,
          weight,
          rate: rate || 0, // Allow 0 rate, user can update manually
          destination,
          country,
          countryCode: '',
          serviceType,
          currency: 'INR'
        });
      }
    }
    
    if (items.length === 0) {
      console.error('❌ No valid price items found in the Excel file');
      console.log('💡 Make sure your Excel file has columns for Item Name and Rate');
      process.exit(1);
    }
    
    console.log(`✅ Parsed ${items.length} items from Excel file`);
    
    // Check if price sheet already exists
    const existingSheet = await PriceSheet.findOne({ 
      sheetName: 'ITEM LIST' 
    });
    
    if (existingSheet) {
      console.log('⚠️  Price sheet "ITEM LIST" already exists. Updating it...');
      existingSheet.items = items;
      existingSheet.updatedAt = Date.now();
      await existingSheet.save();
      console.log(`✅ Updated price sheet with ${items.length} items`);
    } else {
      // Unset other defaults if setting this as default
      await PriceSheet.updateMany({}, { isDefault: false });
      
      // Create price sheet
      const priceSheet = new PriceSheet({
        sheetName: 'ITEM LIST',
        description: 'Imported from ITEM LIST.xlsx',
        items,
        originalFileName: path.basename(excelPath),
        isActive: true,
        isDefault: true
      });
      
      await priceSheet.save();
      console.log(`✅ Created price sheet "ITEM LIST" with ${items.length} items`);
      console.log(`📊 Price Sheet ID: ${priceSheet._id}`);
    }
    
    // Display summary
    console.log('\n📊 Import Summary:');
    console.log(`   Total items imported: ${items.length}`);
    if (countryIndex >= 0) {
      const countries = [...new Set(items.map(i => i.country).filter(c => c))];
      console.log(`   Countries: ${countries.length} unique countries`);
    }
    if (serviceIndex >= 0) {
      const services = [...new Set(items.map(i => i.serviceType).filter(s => s))];
      console.log(`   Service types: ${services.length} unique services`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing price sheet:', error);
    process.exit(1);
  }
};

importPriceSheet();
