# Salesforce Integration

This document explains how to integrate the FA Advisor UI with Salesforce to sync advisor, household, and account data.

## Overview

The Salesforce extraction sub-agent connects to your Salesforce instance and syncs data to the FA Advisor UI database.

### Salesforce Object Mapping

| Salesforce Object | FA Advisor UI Table | Description |
|-------------------|---------------------|-------------|
| User | users | Financial advisors |
| Account | households | Client households/families |
| Contact | households | Household members |
| Opportunity | accounts | Investment accounts |
| Custom Objects | holdings | Portfolio holdings (if available) |

## Prerequisites

1. **Salesforce Account** with API access
2. **Connected App** configured in Salesforce
3. **OAuth Credentials** (Client ID and Secret)
4. **User Credentials** (Username, Password, Security Token)

## Setup

### 1. Create Salesforce Connected App

1. Log in to Salesforce
2. Go to **Setup** → **Apps** → **App Manager**
3. Click **New Connected App**
4. Fill in:
   - **Connected App Name**: FA Advisor UI
   - **API Name**: FA_Advisor_UI
   - **Contact Email**: your-email@example.com
5. Enable **OAuth Settings**:
   - **Callback URL**: `https://your-domain.com/oauth/callback`
   - **Selected OAuth Scopes**:
     - Full access (full)
     - Perform requests on your behalf at any time (refresh_token, offline_access)
     - Access and manage your data (api)
6. Click **Save**
7. Copy the **Consumer Key** (Client ID) and **Consumer Secret** (Client Secret)

### 2. Get Security Token

1. In Salesforce, click your profile → **Settings**
2. Go to **My Personal Information** → **Reset My Security Token**
3. Click **Reset Security Token**
4. Check your email for the new security token

### 3. Configure Environment Variables

Add these to your `.env` file:

```bash
# Salesforce Configuration
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_USERNAME=your_salesforce_username
SALESFORCE_PASSWORD=your_salesforce_password
SALESFORCE_SECURITY_TOKEN=your_security_token_here
```

## Usage

### Full Sync

Sync all advisors, households, and accounts from Salesforce:

```bash
cd /home/ubuntu/fa_advisor_ui
node scripts/salesforce_extractor.mjs full
```

This will:
1. Authenticate with Salesforce
2. Query all active financial advisors (Users)
3. Query all household accounts
4. Query all investment accounts (Opportunities)
5. Insert or update records in the database

**Estimated time**: 5-15 minutes for 1,000 advisors

### Incremental Sync

Sync only changes since a specific date:

```bash
node scripts/salesforce_extractor.mjs incremental 2024-01-01T00:00:00Z
```

⚠️ **Note**: Incremental sync is not yet fully implemented. Use full sync for now.

### Scheduled Sync

To run sync automatically every night at 2 AM, add a cron job:

```bash
crontab -e
```

Add this line:
```
0 2 * * * cd /home/ubuntu/fa_advisor_ui && node scripts/salesforce_extractor.mjs full >> /var/log/salesforce_sync.log 2>&1
```

## Data Flow

```
Salesforce                    FA Advisor UI Database
──────────                    ──────────────────────

User (Advisor)           →    users table
  ├─ Id                       ├─ advisorId (SF Id)
  ├─ Name                     ├─ name
  ├─ Email                    ├─ email
  └─ Department               └─ firmName

Account (Household)      →    households table
  ├─ Id                       ├─ salesforceId
  ├─ Name                     ├─ householdName
  ├─ OwnerId                  ├─ advisorId (FK)
  ├─ Phone                    ├─ phone
  ├─ BillingAddress           ├─ address
  └─ AnnualRevenue            └─ totalNetWorth

Opportunity (Account)    →    accounts table
  ├─ Id                       ├─ salesforceId
  ├─ Name                     ├─ accountName
  ├─ AccountId                ├─ householdId (FK)
  ├─ Amount                   ├─ currentValue
  └─ Type                     └─ accountType
```

## Customization

### Modify SOQL Queries

Edit `salesforce_extractor.mjs` to customize which records are synced:

```javascript
// Example: Only sync advisors from specific department
const soql = `
  SELECT Id, Name, Email, Title, Department
  FROM User
  WHERE IsActive = true
  AND Department = 'Wealth Management'
  LIMIT 5000
`;
```

### Add Custom Fields

If you have custom fields in Salesforce:

```javascript
// Add custom fields to SOQL query
const soql = `
  SELECT Id, Name, Email, Custom_Field__c
  FROM User
  WHERE IsActive = true
`;

// Map to database
await this.dbConn.query(
  `INSERT INTO users (openId, name, email, advisorId, customField)
   VALUES (?, ?, ?, ?, ?)`,
  [`sf_${advisor.Id}`, advisor.Name, advisor.Email, advisor.Id, advisor.Custom_Field__c]
);
```

### Sync Holdings

If you have holdings data in Salesforce custom objects:

```javascript
async syncHoldings() {
  const soql = `
    SELECT Id, Account__c, Ticker__c, Shares__c, Current_Price__c
    FROM Holding__c
    LIMIT 50000
  `;
  
  const holdings = await this.query(soql);
  
  for (const holding of holdings) {
    // Get accountId from database
    const [accountRows] = await this.dbConn.query(
      'SELECT id FROM accounts WHERE salesforceId = ?',
      [holding.Account__c]
    );
    
    if (accountRows.length > 0) {
      await this.dbConn.query(
        `INSERT INTO holdings (accountId, ticker, shares, currentPrice)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE shares = ?, currentPrice = ?`,
        [accountRows[0].id, holding.Ticker__c, holding.Shares__c, 
         holding.Current_Price__c, holding.Shares__c, holding.Current_Price__c]
      );
    }
  }
}
```

## Error Handling

### Authentication Errors

**Error**: `Authentication failed: 401 Unauthorized`

**Solutions**:
- Verify Client ID and Client Secret are correct
- Check username and password
- Ensure security token is appended to password
- Verify Connected App is approved in Salesforce

### Rate Limits

Salesforce has API call limits:
- **Developer Edition**: 5,000 calls per 24 hours
- **Enterprise Edition**: 25,000 calls per 24 hours
- **Unlimited Edition**: 100,000+ calls per 24 hours

**Solution**: Use bulk API for large data sets (not yet implemented)

### Missing Data

**Error**: `Advisor not found for household X`

**Solution**: Ensure advisors are synced before households:
```bash
# Run sync in order
node scripts/salesforce_extractor.mjs full
```

## Monitoring

### Check Sync Status

```bash
# View recent sync logs
tail -f /var/log/salesforce_sync.log

# Check database counts
mysql -e "
  SELECT 
    (SELECT COUNT(*) FROM users WHERE advisorId IS NOT NULL) as advisors,
    (SELECT COUNT(*) FROM households WHERE salesforceId IS NOT NULL) as households,
    (SELECT COUNT(*) FROM accounts WHERE salesforceId IS NOT NULL) as accounts;
"
```

### Verify Data Quality

```bash
# Check for orphaned records
mysql -e "
  SELECT COUNT(*) FROM households WHERE advisorId NOT IN (SELECT id FROM users);
  SELECT COUNT(*) FROM accounts WHERE householdId NOT IN (SELECT id FROM households);
"
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate security tokens** regularly
4. **Use IP restrictions** in Salesforce Connected App
5. **Enable MFA** for Salesforce user account
6. **Monitor API usage** in Salesforce Setup → System Overview

## Troubleshooting

### Test Salesforce Connection

```bash
curl -X POST https://your-instance.salesforce.com/services/oauth2/token \
  -d "grant_type=password" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD_AND_TOKEN"
```

### Test SOQL Query

Use Salesforce Developer Console:
1. Go to **Developer Console** → **Query Editor**
2. Test your SOQL queries
3. Verify field names and data

### Debug Mode

Add debug logging to the extractor:

```javascript
console.log('DEBUG: Query:', soql);
console.log('DEBUG: Response:', JSON.stringify(data, null, 2));
```

## Performance Optimization

### Batch Processing

For large datasets, process in batches:

```javascript
const BATCH_SIZE = 200;
for (let i = 0; i < advisors.length; i += BATCH_SIZE) {
  const batch = advisors.slice(i, i + BATCH_SIZE);
  await this.processBatch(batch);
}
```

### Parallel Processing

Sync different object types in parallel:

```javascript
await Promise.all([
  this.syncAdvisors(),
  this.syncHouseholds(),
  this.syncAccounts(),
]);
```

### Use Bulk API

For very large datasets (100K+ records), use Salesforce Bulk API 2.0:
- Documentation: https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/

## Next Steps

1. **Test the integration** with a small dataset
2. **Verify data mapping** is correct
3. **Schedule regular syncs** via cron
4. **Monitor sync performance** and errors
5. **Implement incremental sync** for efficiency
6. **Add holdings sync** if available in Salesforce

## Support

For Salesforce-specific issues:
- Salesforce Help: https://help.salesforce.com
- Developer Documentation: https://developer.salesforce.com/docs

For FA Advisor UI integration issues:
- Check main README.md
- Review database schema in `drizzle/schema.ts`
- Test with synthetic data first
