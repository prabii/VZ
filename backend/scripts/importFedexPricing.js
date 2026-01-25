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

const importFedexPricing = async () => {
  try {
    await connectDB();
    
    // Weight ranges (in kg)
    const weights = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21, 26];
    
    // FEDEX Pricing Data (from user's provided data)
    const fedexData = [
      { country: 'USA', rates: ['2000+GST', '2350+GST', '2500+GST', '2650+', '2800+', '2950+', '3500+', '4000+', '4500+', '5000+', '5500+', '6000+', '6500+', '7000+', '7500+', '8000+', '8500+', '9000+', '9500+', '10000+', '10500+', '1100+', '11500+', '635+'] },
      { country: 'CANADA', rates: ['2100+GST', '2400+GST', '2700+GST', '3000+', '3300+', '3600+', '4100+', '4600+', '5100+', '5600+', '6100+', '6600+', '7100+', '7500+', '8000+', '8500+', '9000+', '9500+', '10000+', '10500+', '11000+', '11500+', '12000+', '700+'] },
      { country: 'UNITED KINGDOM', rates: ['2000+', '2200+', '2500+', '2800+', '3100+', '3400+', '3000+', '3500+', '3000+', '3500+', '4000+', '4500+', '5000+', '4950+', '5400+', '5850+', '6300+', '6750+', '7200+', '7650+', '8100+', '8550+', '9000+', '400+'] },
      { country: 'AUSTRALIA', rates: ['2200+', '2500+', '2800+', '3100+', '3400+', '3700+', '4400+', '4900+', '5400+', '6000+', '6500+', '7000+', '8000', '8700', '9200', '9900', '10200', '10900', '12200', '12800', '13350', '14100', '14900'] },
      { country: 'NEW ZEALAND', rates: [] },
      { country: 'U.A.E.', rates: [] },
      { country: 'BAHRAIN', rates: [] },
      { country: 'KUWAIT', rates: [] },
      { country: 'OMAN', rates: [] },
      { country: 'QATAR', rates: [] },
      { country: 'SAUDI ARABIA', rates: [] },
      { country: 'BANGLADESH', rates: [] },
      { country: 'MALDIVES', rates: [] },
      { country: 'NEPAL', rates: [] },
      { country: 'PAKISTAN', rates: [] },
      { country: 'SRI LANKA', rates: [] },
      { country: 'SRI LANKA (DUTY PAID)', rates: [] },
      { country: 'CAMBODIA', rates: [] },
      { country: 'HONG KONG', rates: [] },
      { country: 'MALAYSIA', rates: [] },
      { country: 'SINGAPORE', rates: [] },
      { country: 'THAILAND', rates: [] },
      { country: 'VIETNAM', rates: [] },
      { country: 'PHILIPPINES', rates: [] },
      { country: 'CHINA', rates: [] },
      { country: 'INDONESIA', rates: [] },
      { country: 'JAPAN', rates: [] },
      { country: 'KOREA', rates: [] },
      { country: 'AUSTRIA', rates: [] },
      { country: 'BELGIUM', rates: [] },
      { country: 'BULGARIA', rates: [] },
      { country: 'CROATIA', rates: [] },
      { country: 'CZECH REPUBLIC', rates: [] },
      { country: 'DENMARK', rates: [] },
      { country: 'ESTONIA', rates: [] },
      { country: 'FINLAND', rates: [] },
      { country: 'FRANCE', rates: [] },
      { country: 'GERMANY', rates: [] },
      { country: 'GREECE', rates: [] },
      { country: 'HUNGARY', rates: [] },
      { country: 'IRELAND', rates: [] },
      { country: 'ITALY', rates: [] },
      { country: 'LATVIA', rates: [] },
      { country: 'LITHUANIA', rates: [] },
      { country: 'LUXEMBOURG', rates: [] },
      { country: 'MONACO', rates: [] },
      { country: 'NETHERLANDS', rates: [] },
      { country: 'POLAND', rates: [] },
      { country: 'PORTUGAL', rates: [] },
      { country: 'ROMANIA', rates: [] },
      { country: 'SLOVAKIA', rates: [] },
      { country: 'SLOVENIA', rates: [] },
      { country: 'SPAIN', rates: [] },
      { country: 'SWEDEN', rates: [] },
    ];
    
    const items = [];
    
    // Process each country
    for (const countryData of fedexData) {
      const { country, rates } = countryData;
      
      if (!country || rates.length === 0) continue;
      
      // Create items for each weight/rate combination
      for (let i = 0; i < rates.length && i < weights.length; i++) {
        const rateStr = rates[i];
        const weight = weights[i];
        
        if (rateStr && rateStr.trim()) {
          // Parse rate (remove +GST, +, etc.)
          const rate = parseFloat(rateStr.toString().replace(/[+GST,\s]/g, '')) || 0;
          
          if (rate > 0) {
            const weightStr = weight >= 21 
              ? `${weight}+ kg` 
              : `${weight} kg`;
            
            items.push({
              itemName: `FEDEX - ${country} - ${weightStr}`,
              hsnCode: '',
              weight: weightStr,
              rate: rate,
              destination: country,
              country: country,
              countryCode: '',
              serviceType: 'FEDEX',
              currency: 'INR'
            });
          }
        }
      }
    }
    
    if (items.length === 0) {
      console.error('❌ No valid FEDEX pricing items found');
      console.log('💡 Make sure the Excel file has FEDEX pricing data');
      process.exit(1);
    }
    
    console.log(`✅ Parsed ${items.length} FEDEX pricing items`);
    console.log('\n📊 Sample items (first 5):');
    items.slice(0, 5).forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.itemName} - ₹${item.rate}`);
    });
    
    // Find or create FEDEX price sheet
    let priceSheet = await PriceSheet.findOne({ sheetName: 'FEDEX Pricing' });
    
    if (priceSheet) {
      console.log('⚠️  FEDEX price sheet already exists. Updating it...');
      priceSheet.items = items;
      priceSheet.updatedAt = Date.now();
      await priceSheet.save();
      console.log(`✅ Updated FEDEX price sheet with ${items.length} items`);
    } else {
      priceSheet = new PriceSheet({
        sheetName: 'FEDEX Pricing',
        description: 'FEDEX International Shipping Rates by Weight and Country',
        items,
        isActive: true,
        isDefault: false
      });
      
      await priceSheet.save();
      console.log(`✅ Created FEDEX price sheet with ${items.length} items`);
      console.log(`📊 Price Sheet ID: ${priceSheet._id}`);
    }
    
    // Get unique countries
    const uniqueCountries = [...new Set(items.map(i => i.country).filter(c => c))];
    
    console.log('\n📊 Import Summary:');
    console.log(`   Total items: ${items.length}`);
    console.log(`   Countries: ${uniqueCountries.length}`);
    console.log(`   Weight ranges: ${weights.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing FEDEX pricing:', error);
    process.exit(1);
  }
};

importFedexPricing();
