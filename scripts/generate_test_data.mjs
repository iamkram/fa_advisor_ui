/**
 * Test Data Generator for FA Advisor UI
 * Generates scaled-down realistic data for testing:
 * - 100 advisors
 * - 10,000 households (100 per advisor)
 * - 70,000 accounts (7 per household)
 * - 1,050,000 holdings (15 per account)
 */

import mysql from 'mysql2/promise';
import fs from 'fs';

// Configuration
const CONFIG = {
  ADVISORS: 100,
  HOUSEHOLDS_PER_ADVISOR: 100,
  ACCOUNTS_PER_HOUSEHOLD: 7,
  HOLDINGS_PER_ACCOUNT: 15,
  BATCH_SIZE: 500,
};

// Load S&P 500 data
const sp500 = JSON.parse(fs.readFileSync('./scripts/sp500_data.json', 'utf8'));

// Utility functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => 
  (Math.random() * (max - min) + min).toFixed(decimals);
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const randomDate = (start, end) => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Data generators
const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 
  'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark'];

const FIRM_NAMES = ['Merrill Lynch', 'Morgan Stanley', 'Wells Fargo Advisors', 'UBS', 'Raymond James', 
  'Edward Jones', 'Ameriprise', 'LPL Financial', 'RBC Wealth Management', 'Stifel'];

const ACCOUNT_TYPES = ['taxable', 'ira_traditional', 'ira_roth', '401k', '403b', '529', 'trust'];
const RISK_TOLERANCES = ['conservative', 'moderate', 'aggressive'];

function generateName() {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

function generateEmail(name) {
  return `${name.toLowerCase().replace(' ', '.')}@example.com`;
}

function generatePhone() {
  return `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

// Main generation function
async function generateTestData() {
  console.log('🚀 Starting TEST data generation...\n');
  console.log(`Target: ${CONFIG.ADVISORS.toLocaleString()} advisors`);
  console.log(`       ${(CONFIG.ADVISORS * CONFIG.HOUSEHOLDS_PER_ADVISOR).toLocaleString()} households`);
  console.log(`       ${(CONFIG.ADVISORS * CONFIG.HOUSEHOLDS_PER_ADVISOR * CONFIG.ACCOUNTS_PER_HOUSEHOLD).toLocaleString()} accounts`);
  console.log(`       ${(CONFIG.ADVISORS * CONFIG.HOUSEHOLDS_PER_ADVISOR * CONFIG.ACCOUNTS_PER_HOUSEHOLD * CONFIG.HOLDINGS_PER_ACCOUNT).toLocaleString()} holdings\n`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Step 1: Insert S&P 500 companies
    console.log('📊 Inserting S&P 500 companies...');
    for (const company of sp500) {
      await conn.query(
        'INSERT IGNORE INTO sp500Companies (ticker, companyName, sector, industry, marketCap) VALUES (?, ?, ?, ?, ?)',
        [company.ticker, company.name, company.sector, company.industry, randomFloat(1000000000, 3000000000000, 0)]
      );
    }
    console.log(`✓ Inserted ${sp500.length} S&P 500 companies\n`);

    // Step 2: Generate advisors
    console.log('👔 Generating advisors...');
    const advisorIds = [];
    for (let i = 1; i <= CONFIG.ADVISORS; i++) {
      const name = generateName();
      const result = await conn.query(
        `INSERT INTO users (openId, name, email, role, advisorId, firmName) 
         VALUES (?, ?, ?, 'user', ?, ?)`,
        [`advisor_${i}`, name, generateEmail(name), `ADV${String(i).padStart(6, '0')}`, randomChoice(FIRM_NAMES)]
      );
      advisorIds.push(result[0].insertId);
    }
    console.log(`✓ Generated ${advisorIds.length.toLocaleString()} advisors\n`);

    // Step 3: Generate households
    console.log('🏠 Generating households...');
    let householdCount = 0;
    const householdIds = [];
    
    for (const advisorId of advisorIds) {
      const households = [];
      for (let i = 0; i < CONFIG.HOUSEHOLDS_PER_ADVISOR; i++) {
        const name = `${randomChoice(LAST_NAMES)} Family`;
        const contactName = generateName();
        households.push([
          advisorId,
          name,
          contactName,
          generateEmail(contactName),
          generatePhone(),
          `${randomInt(100, 9999)} Main St, City, ST ${randomInt(10000, 99999)}`,
          randomFloat(100000, 10000000, 2),
          randomChoice(RISK_TOLERANCES),
          'Long-term growth and retirement planning',
          null
        ]);
      }
      
      const result = await conn.query(
        `INSERT INTO households (advisorId, householdName, primaryContactName, email, phone, address, totalNetWorth, riskTolerance, investmentObjective, salesforceId) 
         VALUES ?`,
        [households]
      );
      
      const firstId = result[0].insertId;
      for (let i = 0; i < CONFIG.HOUSEHOLDS_PER_ADVISOR; i++) {
        householdIds.push(firstId + i);
      }
      
      householdCount += CONFIG.HOUSEHOLDS_PER_ADVISOR;
      if (householdCount % 1000 === 0) console.log(`  Generated ${householdCount.toLocaleString()} households...`);
    }
    console.log(`✓ Generated ${householdIds.length.toLocaleString()} households\n`);

    // Step 4: Generate accounts
    console.log('💼 Generating accounts...');
    let accountCount = 0;
    const accountIds = [];
    
    for (let i = 0; i < householdIds.length; i += CONFIG.BATCH_SIZE) {
      const batchHouseholds = householdIds.slice(i, i + CONFIG.BATCH_SIZE);
      const accounts = [];
      
      for (const householdId of batchHouseholds) {
        for (let j = 0; j < CONFIG.ACCOUNTS_PER_HOUSEHOLD; j++) {
          const accountType = randomChoice(ACCOUNT_TYPES);
          const currentValue = parseFloat(randomFloat(10000, 2000000, 2));
          const costBasis = currentValue * parseFloat(randomFloat(0.7, 0.95, 4));
          
          accounts.push([
            householdId,
            `ACC${String(accountCount + j + 1).padStart(10, '0')}`,
            `${accountType.toUpperCase()} Account`,
            accountType,
            generateName(),
            currentValue.toFixed(2),
            costBasis.toFixed(2),
            randomFloat(-0.15, 0.35, 4),
            randomFloat(-0.20, 0.50, 4),
            'active',
            null
          ]);
        }
        accountCount += CONFIG.ACCOUNTS_PER_HOUSEHOLD;
      }
      
      const result = await conn.query(
        `INSERT INTO accounts (householdId, accountNumber, accountName, accountType, ownerName, currentValue, costBasis, ytdReturn, oneYearReturn, status, salesforceId) 
         VALUES ?`,
        [accounts]
      );
      
      const firstId = result[0].insertId;
      for (let j = 0; j < accounts.length; j++) {
        accountIds.push(firstId + j);
      }
      
      if (accountCount % 5000 === 0) console.log(`  Generated ${accountCount.toLocaleString()} accounts...`);
    }
    console.log(`✓ Generated ${accountIds.length.toLocaleString()} accounts\n`);

    // Step 5: Generate holdings
    console.log('📈 Generating holdings...');
    let holdingCount = 0;
    
    for (let i = 0; i < accountIds.length; i += CONFIG.BATCH_SIZE) {
      const batchAccounts = accountIds.slice(i, i + CONFIG.BATCH_SIZE);
      const holdings = [];
      
      for (const accountId of batchAccounts) {
        const selectedStocks = [];
        const usedIndices = new Set();
        
        while (selectedStocks.length < CONFIG.HOLDINGS_PER_ACCOUNT) {
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
          
          holdings.push([
            accountId,
            stock.ticker,
            stock.name,
            null,
            shares.toFixed(4),
            (shares * costBasis).toFixed(2),
            currentPrice.toFixed(2),
            currentValue.toFixed(2),
            'equity',
            stock.sector,
            unrealizedGainLoss.toFixed(2),
            unrealizedGainLossPercent.toFixed(4),
            randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31))
          ]);
        }
        holdingCount += CONFIG.HOLDINGS_PER_ACCOUNT;
      }
      
      await conn.query(
        `INSERT INTO holdings (accountId, ticker, companyName, cusip, shares, costBasis, currentPrice, currentValue, assetClass, sector, unrealizedGainLoss, unrealizedGainLossPercent, purchaseDate) 
         VALUES ?`,
        [holdings]
      );
      
      if (holdingCount % 10000 === 0) console.log(`  Generated ${holdingCount.toLocaleString()} holdings...`);
    }
    console.log(`✓ Generated ${holdingCount.toLocaleString()} holdings\n`);

    console.log('✅ Test data generation complete!');
    console.log('\nFinal counts:');
    const [advisorRows] = await conn.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const [householdRows] = await conn.query('SELECT COUNT(*) as count FROM households');
    const [accountRows] = await conn.query('SELECT COUNT(*) as count FROM accounts');
    const [holdingRows] = await conn.query('SELECT COUNT(*) as count FROM holdings');
    
    console.log(`  Advisors:   ${advisorRows[0].count.toLocaleString()}`);
    console.log(`  Households: ${householdRows[0].count.toLocaleString()}`);
    console.log(`  Accounts:   ${accountRows[0].count.toLocaleString()}`);
    console.log(`  Holdings:   ${holdingRows[0].count.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const startTime = Date.now();
  generateTestData()
    .then(() => {
      const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
      console.log(`\n⏱️  Total time: ${duration} minutes`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { generateTestData };
