/**
 * Salesforce Data Extraction Sub-Agent
 * 
 * Extracts advisor, household, and account data from Salesforce
 * and syncs it to the FA Advisor UI database.
 * 
 * Salesforce Object Mapping:
 * - User → Financial Advisor
 * - Account → Household
 * - Contact → Household Member
 * - Opportunity → Account/Relationship
 * - Custom Objects → Holdings data
 */

import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

// Salesforce configuration
const SF_CONFIG = {
  instanceUrl: process.env.SALESFORCE_INSTANCE_URL || 'https://your-instance.salesforce.com',
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  username: process.env.SALESFORCE_USERNAME,
  password: process.env.SALESFORCE_PASSWORD,
  securityToken: process.env.SALESFORCE_SECURITY_TOKEN,
};

class SalesforceExtractor {
  constructor() {
    this.accessToken = null;
    this.instanceUrl = null;
    this.dbConn = null;
  }

  /**
   * Authenticate with Salesforce using OAuth 2.0 Password Flow
   */
  async authenticate() {
    console.log('🔐 Authenticating with Salesforce...');
    
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: SF_CONFIG.clientId,
      client_secret: SF_CONFIG.clientSecret,
      username: SF_CONFIG.username,
      password: SF_CONFIG.password + SF_CONFIG.securityToken,
    });

    try {
      const response = await fetch(`${SF_CONFIG.instanceUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.instanceUrl = data.instance_url;
      
      console.log('✓ Authenticated successfully\n');
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Execute SOQL query against Salesforce
   */
  async query(soql) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const url = `${this.instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(soql)}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.records;
    } catch (error) {
      console.error('❌ Query error:', error.message);
      throw error;
    }
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    console.log('🗄️  Connecting to database...');
    this.dbConn = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✓ Database connected\n');
  }

  /**
   * Extract and sync advisors from Salesforce Users
   */
  async syncAdvisors() {
    console.log('👔 Syncing advisors from Salesforce...');
    
    // Query Salesforce for financial advisors
    // Adjust the WHERE clause based on your Salesforce setup
    const soql = `
      SELECT Id, Name, Email, Title, Department, Phone
      FROM User
      WHERE IsActive = true
      AND (Title LIKE '%Advisor%' OR Title LIKE '%Financial%')
      LIMIT 5000
    `;

    const advisors = await this.query(soql);
    console.log(`  Found ${advisors.length} advisors in Salesforce`);

    let syncedCount = 0;
    for (const advisor of advisors) {
      try {
        // Check if advisor already exists
        const [existing] = await this.dbConn.query(
          'SELECT id FROM users WHERE advisorId = ?',
          [advisor.Id]
        );

        if (existing.length > 0) {
          // Update existing advisor
          await this.dbConn.query(
            `UPDATE users 
             SET name = ?, email = ?, firmName = ?, updatedAt = NOW()
             WHERE advisorId = ?`,
            [advisor.Name, advisor.Email, advisor.Department, advisor.Id]
          );
        } else {
          // Insert new advisor
          await this.dbConn.query(
            `INSERT INTO users (openId, name, email, role, advisorId, firmName)
             VALUES (?, ?, ?, 'user', ?, ?)`,
            [`sf_${advisor.Id}`, advisor.Name, advisor.Email, advisor.Id, advisor.Department]
          );
        }
        syncedCount++;
      } catch (error) {
        console.error(`  Error syncing advisor ${advisor.Name}:`, error.message);
      }
    }

    console.log(`✓ Synced ${syncedCount} advisors\n`);
    return syncedCount;
  }

  /**
   * Extract and sync households from Salesforce Accounts
   */
  async syncHouseholds() {
    console.log('🏠 Syncing households from Salesforce...');
    
    // Query Salesforce for household accounts
    const soql = `
      SELECT Id, Name, OwnerId, Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode,
             AnnualRevenue, Type, Description
      FROM Account
      WHERE Type = 'Household'
      LIMIT 10000
    `;

    const accounts = await this.query(soql);
    console.log(`  Found ${accounts.length} households in Salesforce`);

    let syncedCount = 0;
    for (const account of accounts) {
      try {
        // Get advisor ID from database
        const [advisorRows] = await this.dbConn.query(
          'SELECT id FROM users WHERE advisorId = ?',
          [account.OwnerId]
        );

        if (advisorRows.length === 0) {
          console.warn(`  Advisor not found for household ${account.Name}`);
          continue;
        }

        const advisorId = advisorRows[0].id;
        const address = `${account.BillingStreet || ''}, ${account.BillingCity || ''}, ${account.BillingState || ''} ${account.BillingPostalCode || ''}`.trim();

        // Check if household already exists
        const [existing] = await this.dbConn.query(
          'SELECT id FROM households WHERE salesforceId = ?',
          [account.Id]
        );

        if (existing.length > 0) {
          // Update existing household
          await this.dbConn.query(
            `UPDATE households 
             SET householdName = ?, phone = ?, address = ?, 
                 totalNetWorth = ?, investmentObjective = ?, updatedAt = NOW()
             WHERE salesforceId = ?`,
            [account.Name, account.Phone, address, account.AnnualRevenue, account.Description, account.Id]
          );
        } else {
          // Insert new household
          await this.dbConn.query(
            `INSERT INTO households (advisorId, householdName, phone, address, totalNetWorth, 
                                      investmentObjective, salesforceId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [advisorId, account.Name, account.Phone, address, account.AnnualRevenue, account.Description, account.Id]
          );
        }
        syncedCount++;
      } catch (error) {
        console.error(`  Error syncing household ${account.Name}:`, error.message);
      }
    }

    console.log(`✓ Synced ${syncedCount} households\n`);
    return syncedCount;
  }

  /**
   * Extract and sync accounts from Salesforce Opportunities
   */
  async syncAccounts() {
    console.log('💼 Syncing accounts from Salesforce...');
    
    // Query Salesforce for opportunities (representing investment accounts)
    const soql = `
      SELECT Id, Name, AccountId, Amount, StageName, Type, Description, CloseDate
      FROM Opportunity
      WHERE IsClosed = false
      LIMIT 20000
    `;

    const opportunities = await this.query(soql);
    console.log(`  Found ${opportunities.length} accounts in Salesforce`);

    let syncedCount = 0;
    for (const opp of opportunities) {
      try {
        // Get household ID from database
        const [householdRows] = await this.dbConn.query(
          'SELECT id FROM households WHERE salesforceId = ?',
          [opp.AccountId]
        );

        if (householdRows.length === 0) {
          continue; // Skip if household not found
        }

        const householdId = householdRows[0].id;
        const accountType = this.mapAccountType(opp.Type);

        // Check if account already exists
        const [existing] = await this.dbConn.query(
          'SELECT id FROM accounts WHERE salesforceId = ?',
          [opp.Id]
        );

        if (existing.length > 0) {
          // Update existing account
          await this.dbConn.query(
            `UPDATE accounts 
             SET accountName = ?, currentValue = ?, updatedAt = NOW()
             WHERE salesforceId = ?`,
            [opp.Name, opp.Amount, opp.Id]
          );
        } else {
          // Insert new account
          const accountNumber = `SF${opp.Id.substring(0, 12)}`;
          await this.dbConn.query(
            `INSERT INTO accounts (householdId, accountNumber, accountName, accountType, 
                                    currentValue, status, salesforceId)
             VALUES (?, ?, ?, ?, ?, 'active', ?)`,
            [householdId, accountNumber, opp.Name, accountType, opp.Amount, opp.Id]
          );
        }
        syncedCount++;
      } catch (error) {
        console.error(`  Error syncing account ${opp.Name}:`, error.message);
      }
    }

    console.log(`✓ Synced ${syncedCount} accounts\n`);
    return syncedCount;
  }

  /**
   * Map Salesforce opportunity type to account type
   */
  mapAccountType(sfType) {
    const typeMap = {
      'IRA': 'ira_traditional',
      'Roth IRA': 'ira_roth',
      '401(k)': '401k',
      '403(b)': '403b',
      '529 Plan': '529',
      'Trust': 'trust',
      'Taxable': 'taxable',
    };
    return typeMap[sfType] || 'taxable';
  }

  /**
   * Run full sync
   */
  async runFullSync() {
    console.log('🚀 Starting Salesforce full sync...\n');
    const startTime = Date.now();

    try {
      await this.authenticate();
      await this.connectDatabase();

      const stats = {
        advisors: await this.syncAdvisors(),
        households: await this.syncHouseholds(),
        accounts: await this.syncAccounts(),
      };

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('✅ Sync complete!');
      console.log(`\nSynced:`);
      console.log(`  ${stats.advisors} advisors`);
      console.log(`  ${stats.households} households`);
      console.log(`  ${stats.accounts} accounts`);
      console.log(`\n⏱️  Total time: ${duration} seconds`);

      return stats;
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      throw error;
    } finally {
      if (this.dbConn) {
        await this.dbConn.end();
      }
    }
  }

  /**
   * Run incremental sync (only changes since last sync)
   */
  async runIncrementalSync(since) {
    console.log(`🔄 Starting incremental sync (since ${since})...\n`);
    
    // Modify SOQL queries to include WHERE LastModifiedDate > :since
    // Implementation similar to runFullSync but with date filter
    
    console.log('⚠️  Incremental sync not yet implemented');
    console.log('   Use runFullSync() for now\n');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new SalesforceExtractor();
  
  const command = process.argv[2] || 'full';
  
  if (command === 'full') {
    extractor.runFullSync()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'incremental') {
    const since = process.argv[3] || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    extractor.runIncrementalSync(since)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage:');
    console.log('  node salesforce_extractor.mjs full');
    console.log('  node salesforce_extractor.mjs incremental [since_date]');
    process.exit(1);
  }
}

export { SalesforceExtractor };
