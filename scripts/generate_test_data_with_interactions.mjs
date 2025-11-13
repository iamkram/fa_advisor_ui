/**
 * Test Data Generator with Interactions
 * Generates realistic FA data including CRM-style interactions
 * 
 * Scale: 100 advisors
 * - 10,000 households (100 per advisor)
 * - 70,000 accounts (7 per household)
 * - 1,050,000 holdings (15 per account)
 * - 50,000 interactions (~5 per household)
 * 
 * Estimated time: 10-15 minutes
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

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const FIRM_NAMES = ['Merrill Lynch', 'Morgan Stanley', 'Wells Fargo Advisors', 'UBS', 'Raymond James'];
const ACCOUNT_TYPES = ['taxable', 'ira_traditional', 'ira_roth', '401k', 'trust', 'education'];
const RISK_TOLERANCES = ['conservative', 'moderate', 'aggressive'];

// Interaction templates
const EMAIL_SUBJECTS = [
  'Quarterly Portfolio Review',
  'Market Update and Opportunities',
  'Tax Planning for Year-End',
  'Estate Planning Discussion',
  'Retirement Income Strategy',
  'Investment Policy Statement Review',
  'Rebalancing Recommendation',
  'New Investment Opportunity',
];

const CALL_OUTCOMES = [
  'Scheduled follow-up meeting',
  'Client approved recommendations',
  'Discussed market concerns',
  'Reviewed retirement timeline',
  'Updated risk tolerance',
  'Addressed account questions',
];

const MEETING_SUBJECTS = [
  'Annual Financial Review',
  'Quarterly Portfolio Update',
  'Retirement Planning Session',
  'Estate Planning Discussion',
  'Tax Strategy Meeting',
  'Investment Policy Review',
];

const NOTE_DESCRIPTIONS = [
  'Client expressed interest in ESG investing',
  'Discussed upcoming major purchase (home)',
  'Client concerned about market volatility',
  'Planning for child\'s college education',
  'Considering early retirement options',
  'Interested in charitable giving strategies',
];

function generateName() {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

async function generateTestData() {
  console.log('🚀 Generating test data with interactions...\n');
  console.log('Scale: 100 advisors, 10K households, 70K accounts, 1M+ holdings, 50K interactions\n');
  
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Clear existing test data
    console.log('🗑️  Clearing existing test data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE interactions');
    await conn.query('TRUNCATE TABLE holdings');
    await conn.query('TRUNCATE TABLE accounts');
    await conn.query('TRUNCATE TABLE households');
    await conn.query('DELETE FROM users WHERE openId LIKE "test_advisor_%"');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Cleared\n');

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
    console.log('👔 Creating 100 advisors...');
    const advisorIds = [];
    for (let i = 1; i <= 100; i++) {
      const name = generateName();
      const result = await conn.query(
        `INSERT INTO users (openId, name, email, role, advisorId, firmName) 
         VALUES (?, ?, ?, 'user', ?, ?)`,
        [`test_advisor_${i}`, name, `${name.toLowerCase().replace(' ', '.')}@example.com`, 
         `ADV${String(i).padStart(6, '0')}`, randomChoice(FIRM_NAMES)]
      );
      advisorIds.push(result[0].insertId);
      
      if (i % 10 === 0) {
        console.log(`  Progress: ${i}/100 advisors`);
      }
    }
    console.log(`✓ Created ${advisorIds.length} advisors\n`);

    // Households
    console.log('🏠 Creating 10,000 households...');
    const householdIds = [];
    let householdCount = 0;
    for (const advisorId of advisorIds) {
      for (let i = 0; i < 100; i++) {
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
        householdIds.push({ id: result[0].insertId, advisorId });
        householdCount++;
        
        if (householdCount % 1000 === 0) {
          console.log(`  Progress: ${householdCount}/10,000 households`);
        }
      }
    }
    console.log(`✓ Created ${householdIds.length} households\n`);

    // Accounts (batch insert for speed)
    console.log('💼 Creating 70,000 accounts...');
    const accountIds = [];
    let accountCount = 0;
    let accountBatch = [];
    
    for (const household of householdIds) {
      for (let i = 0; i < 7; i++) {
        const accountType = randomChoice(ACCOUNT_TYPES);
        const currentValue = parseFloat(randomFloat(10000, 2000000, 2));
        const costBasis = currentValue * parseFloat(randomFloat(0.7, 0.95, 4));
        
        accountBatch.push([
          household.id,
          `ACC${String(++accountCount).padStart(10, '0')}`,
          `${accountType.toUpperCase()} Account`,
          accountType,
          generateName(),
          currentValue.toFixed(2),
          costBasis.toFixed(2),
          randomFloat(-0.15, 0.35, 4),
          randomFloat(-0.20, 0.50, 4),
          'active'
        ]);
        
        // Batch insert every 1000 accounts
        if (accountBatch.length >= 1000) {
          const result = await conn.query(
            `INSERT INTO accounts (householdId, accountNumber, accountName, accountType, ownerName, currentValue, costBasis, ytdReturn, oneYearReturn, status)
             VALUES ?`,
            [accountBatch]
          );
          
          // Store account IDs
          const firstId = result[0].insertId;
          for (let j = 0; j < accountBatch.length; j++) {
            accountIds.push(firstId + j);
          }
          
          console.log(`  Progress: ${accountCount}/70,000 accounts`);
          accountBatch = [];
        }
      }
    }
    
    // Insert remaining accounts
    if (accountBatch.length > 0) {
      const result = await conn.query(
        `INSERT INTO accounts (householdId, accountNumber, accountName, accountType, ownerName, currentValue, costBasis, ytdReturn, oneYearReturn, status)
         VALUES ?`,
        [accountBatch]
      );
      const firstId = result[0].insertId;
      for (let j = 0; j < accountBatch.length; j++) {
        accountIds.push(firstId + j);
      }
    }
    console.log(`✓ Created ${accountIds.length} accounts\n`);

    // Holdings (batch insert for speed)
    console.log('📈 Creating 1,050,000 holdings...');
    let holdingCount = 0;
    let holdingBatch = [];
    
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
        
        holdingBatch.push([
          accountId,
          stock.ticker,
          stock.name,
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
        holdingCount++;
        
        // Batch insert every 5000 holdings
        if (holdingBatch.length >= 5000) {
          await conn.query(
            `INSERT INTO holdings (accountId, ticker, companyName, shares, costBasis, currentPrice, currentValue, assetClass, sector, unrealizedGainLoss, unrealizedGainLossPercent, purchaseDate)
             VALUES ?`,
            [holdingBatch]
          );
          console.log(`  Progress: ${holdingCount}/1,050,000 holdings`);
          holdingBatch = [];
        }
      }
    }
    
    // Insert remaining holdings
    if (holdingBatch.length > 0) {
      await conn.query(
        `INSERT INTO holdings (accountId, ticker, companyName, shares, costBasis, currentPrice, currentValue, assetClass, sector, unrealizedGainLoss, unrealizedGainLossPercent, purchaseDate)
         VALUES ?`,
        [holdingBatch]
      );
    }
    console.log(`✓ Created ${holdingCount} holdings\n`);

    // Interactions
    console.log('💬 Creating 50,000 interactions...');
    let interactionCount = 0;
    let interactionBatch = [];
    
    for (const household of householdIds) {
      const numInteractions = randomInt(3, 7); // 3-7 interactions per household
      
      for (let i = 0; i < numInteractions; i++) {
        const interactionType = randomChoice(['email', 'call', 'meeting', 'note']);
        const interactionDate = randomDate(new Date(2024, 0, 1), new Date());
        
        let subject, description, duration, outcome;
        
        switch (interactionType) {
          case 'email':
            subject = randomChoice(EMAIL_SUBJECTS);
            description = `Sent email regarding ${subject.toLowerCase()}`;
            duration = null;
            outcome = 'Email sent';
            break;
          case 'call':
            subject = 'Client Phone Call';
            description = randomChoice(CALL_OUTCOMES);
            duration = randomInt(10, 45);
            outcome = randomChoice(CALL_OUTCOMES);
            break;
          case 'meeting':
            subject = randomChoice(MEETING_SUBJECTS);
            description = `In-person meeting to discuss ${subject.toLowerCase()}`;
            duration = randomInt(30, 120);
            outcome = 'Meeting completed successfully';
            break;
          case 'note':
            subject = 'Client Note';
            description = randomChoice(NOTE_DESCRIPTIONS);
            duration = null;
            outcome = null;
            break;
        }
        
        interactionBatch.push([
          household.advisorId,
          household.id,
          interactionType,
          subject,
          description,
          interactionDate,
          duration,
          outcome,
          null // nextSteps
        ]);
        interactionCount++;
        
        // Batch insert every 1000 interactions
        if (interactionBatch.length >= 1000) {
          await conn.query(
            `INSERT INTO interactions (advisorId, householdId, interactionType, subject, description, interactionDate, duration, outcome, nextSteps)
             VALUES ?`,
            [interactionBatch]
          );
          console.log(`  Progress: ${interactionCount}/~50,000 interactions`);
          interactionBatch = [];
        }
      }
    }
    
    // Insert remaining interactions
    if (interactionBatch.length > 0) {
      await conn.query(
        `INSERT INTO interactions (advisorId, householdId, interactionType, subject, description, interactionDate, duration, outcome, nextSteps)
         VALUES ?`,
        [interactionBatch]
      );
    }
    console.log(`✓ Created ${interactionCount} interactions\n`);

    console.log('✅ Test data generation complete!\n');
    
    const [advisorRows] = await conn.query('SELECT COUNT(*) as count FROM users WHERE openId LIKE "test_advisor_%"');
    const [householdRows] = await conn.query('SELECT COUNT(*) as count FROM households');
    const [accountRows] = await conn.query('SELECT COUNT(*) as count FROM accounts');
    const [holdingRows] = await conn.query('SELECT COUNT(*) as count FROM holdings');
    const [interactionRows] = await conn.query('SELECT COUNT(*) as count FROM interactions');
    
    console.log('Final counts:');
    console.log(`  Advisors:     ${advisorRows[0].count.toLocaleString()}`);
    console.log(`  Households:   ${householdRows[0].count.toLocaleString()}`);
    console.log(`  Accounts:     ${accountRows[0].count.toLocaleString()}`);
    console.log(`  Holdings:     ${holdingRows[0].count.toLocaleString()}`);
    console.log(`  Interactions: ${interactionRows[0].count.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

const startTime = Date.now();
generateTestData()
  .then(() => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total time: ${duration} seconds (${(duration / 60).toFixed(2)} minutes)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
