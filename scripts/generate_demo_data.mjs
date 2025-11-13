/**
 * Quick Demo Data Generator
 * Generates minimal data for immediate testing:
 * - 5 advisors
 * - 25 households (5 per advisor)
 * - 175 accounts (7 per household)
 * - 2,625 holdings (15 per account)
 * 
 * Runs in under 30 seconds
 */

import mysql from 'mysql2/promise';
import fs from 'fs';

const sp500 = JSON.parse(fs.readFileSync('./scripts/sp500_data.json', 'utf8'));

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => 
  (Math.random() * (max - min) + min).toFixed(decimals);
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const randomDate = (start, end) => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
const FIRM_NAMES = ['Merrill Lynch', 'Morgan Stanley', 'Wells Fargo Advisors'];
const ACCOUNT_TYPES = ['taxable', 'ira_traditional', 'ira_roth', '401k'];
const RISK_TOLERANCES = ['conservative', 'moderate', 'aggressive'];

function generateName() {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

async function generateDemoData() {
  console.log('🚀 Generating demo data...\n');
  
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // S&P 500 companies
    console.log('📊 Inserting S&P 500 companies...');
    for (const company of sp500) {
      await conn.query(
        'INSERT IGNORE INTO sp500Companies (ticker, companyName, sector, industry, marketCap) VALUES (?, ?, ?, ?, ?)',
        [company.ticker, company.name, company.sector, company.industry, randomFloat(1000000000, 3000000000000, 0)]
      );
    }
    console.log(`✓ Inserted ${sp500.length} companies\n`);

    // Advisors
    console.log('👔 Creating advisors...');
    const advisorIds = [];
    for (let i = 1; i <= 5; i++) {
      const name = generateName();
      const result = await conn.query(
        `INSERT INTO users (openId, name, email, role, advisorId, firmName) 
         VALUES (?, ?, ?, 'user', ?, ?)`,
        [`demo_advisor_${i}`, name, `${name.toLowerCase().replace(' ', '.')}@example.com`, 
         `ADV${String(i).padStart(6, '0')}`, randomChoice(FIRM_NAMES)]
      );
      advisorIds.push(result[0].insertId);
    }
    console.log(`✓ Created ${advisorIds.length} advisors\n`);

    // Households
    console.log('🏠 Creating households...');
    const householdIds = [];
    for (const advisorId of advisorIds) {
      for (let i = 0; i < 5; i++) {
        const name = `${randomChoice(LAST_NAMES)} Family`;
        const contactName = generateName();
        const result = await conn.query(
          `INSERT INTO households (advisorId, householdName, primaryContactName, email, phone, address, totalNetWorth, riskTolerance, investmentObjective)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [advisorId, name, contactName, `${contactName.toLowerCase().replace(' ', '.')}@example.com`,
           `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
           `${randomInt(100, 9999)} Main St, City, ST ${randomInt(10000, 99999)}`,
           randomFloat(100000, 10000000, 2), randomChoice(RISK_TOLERANCES),
           'Long-term growth and retirement planning']
        );
        householdIds.push(result[0].insertId);
      }
    }
    console.log(`✓ Created ${householdIds.length} households\n`);

    // Accounts
    console.log('💼 Creating accounts...');
    const accountIds = [];
    let accountCount = 0;
    for (const householdId of householdIds) {
      for (let i = 0; i < 7; i++) {
        const accountType = randomChoice(ACCOUNT_TYPES);
        const currentValue = parseFloat(randomFloat(10000, 2000000, 2));
        const costBasis = currentValue * parseFloat(randomFloat(0.7, 0.95, 4));
        
        const result = await conn.query(
          `INSERT INTO accounts (householdId, accountNumber, accountName, accountType, ownerName, currentValue, costBasis, ytdReturn, oneYearReturn, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
          [householdId, `ACC${String(++accountCount).padStart(10, '0')}`,
           `${accountType.toUpperCase()} Account`, accountType, generateName(),
           currentValue.toFixed(2), costBasis.toFixed(2),
           randomFloat(-0.15, 0.35, 4), randomFloat(-0.20, 0.50, 4)]
        );
        accountIds.push(result[0].insertId);
      }
    }
    console.log(`✓ Created ${accountIds.length} accounts\n`);

    // Holdings
    console.log('📈 Creating holdings...');
    let holdingCount = 0;
    for (const accountId of accountIds) {
      const selectedStocks = [];
      const usedIndices = new Set();
      
      while (selectedStocks.length < 15) {
        const idx = randomInt(0, sp500.length - 1);
        if (!usedIndices.has(idx)) {
          selectedStocks.push(sp500[idx]);
          usedIndices.add(idx);
        }
      }
      
      for (const stock of selectedStocks) {
        const shares = parseFloat(randomFloat(1, 1000, 4));
        const currentPrice = parseFloat(randomFloat(10, 500, 2));
        const costBasis = currentPrice * parseFloat(randomFloat(0.6, 1.2, 4));
        const currentValue = shares * currentPrice;
        const unrealizedGainLoss = currentValue - (shares * costBasis);
        const unrealizedGainLossPercent = ((currentValue / (shares * costBasis)) - 1) * 100;
        
        await conn.query(
          `INSERT INTO holdings (accountId, ticker, companyName, shares, costBasis, currentPrice, currentValue, assetClass, sector, unrealizedGainLoss, unrealizedGainLossPercent, purchaseDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'equity', ?, ?, ?, ?)`,
          [accountId, stock.ticker, stock.name, shares.toFixed(4), (shares * costBasis).toFixed(2),
           currentPrice.toFixed(2), currentValue.toFixed(2), stock.sector,
           unrealizedGainLoss.toFixed(2), unrealizedGainLossPercent.toFixed(4),
           randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31))]
        );
        holdingCount++;
      }
    }
    console.log(`✓ Created ${holdingCount} holdings\n`);

    console.log('✅ Demo data generation complete!\n');
    
    const [advisorRows] = await conn.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [householdRows] = await conn.query('SELECT COUNT(*) as count FROM households');
    const [accountRows] = await conn.query('SELECT COUNT(*) as count FROM accounts');
    const [holdingRows] = await conn.query('SELECT COUNT(*) as count FROM holdings');
    
    console.log('Final counts:');
    console.log(`  Advisors:   ${advisorRows[0].count}`);
    console.log(`  Households: ${householdRows[0].count}`);
    console.log(`  Accounts:   ${accountRows[0].count}`);
    console.log(`  Holdings:   ${holdingRows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

const startTime = Date.now();
generateDemoData()
  .then(() => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total time: ${duration} seconds`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
