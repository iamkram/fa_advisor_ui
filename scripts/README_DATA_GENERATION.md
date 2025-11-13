# Synthetic Data Generation

This directory contains scripts to generate realistic synthetic data for the FA Advisor UI system.

## Overview

The system supports two data generation modes:

### 1. Test Data (Recommended for Development)
- **100 advisors**
- **10,000 households** (100 per advisor)
- **70,000 accounts** (7 per household)
- **1,050,000 holdings** (15 per account, from S&P 500)
- **Generation time**: ~5-10 minutes
- **Database size**: ~500MB

### 2. Production Data (Full Scale)
- **4,000 advisors**
- **800,000 households** (200 per advisor)
- **5,600,000 accounts** (7 per household)
- **84,000,000 holdings** (15 per account, from S&P 500)
- **Generation time**: ~2-4 hours
- **Database size**: ~40GB

## Data Hierarchy

```
Advisors (4,000)
└── Households (200 per advisor)
    └── Accounts (7 per household)
        └── Holdings (15 per account)
```

### Advisor Data
- Name, email, firm affiliation
- Unique advisor ID
- Role and permissions

### Household Data
- Family name and primary contact
- Contact information (email, phone, address)
- Total net worth ($100K - $10M)
- Risk tolerance (conservative, moderate, aggressive)
- Investment objectives

### Account Data
- Account types: Taxable, IRA (Traditional/Roth), 401(k), 403(b), 529, Trust
- Current value and cost basis
- YTD and 1-year returns
- Account status

### Holdings Data
- S&P 500 stocks (50 companies included)
- Shares, current price, cost basis
- Unrealized gains/losses
- Purchase dates
- Sector classification

## Usage

### Generate Test Data (Recommended First)

```bash
cd /home/ubuntu/fa_advisor_ui
node scripts/generate_test_data.mjs
```

This will:
1. Insert S&P 500 company data
2. Generate 100 advisors
3. Generate 10,000 households
4. Generate 70,000 accounts
5. Generate 1,050,000 holdings

**Estimated time**: 5-10 minutes

### Generate Production Data (Full Scale)

```bash
cd /home/ubuntu/fa_advisor_ui
node scripts/generate_synthetic_data.mjs
```

⚠️ **Warning**: This will take 2-4 hours and generate ~40GB of data. Only run this when:
- You have sufficient database capacity
- You're ready for production-scale testing
- You have time to wait for completion

## Data Quality

The synthetic data includes:

✅ **Realistic names** - Common first and last names  
✅ **Valid email addresses** - Generated from names  
✅ **Phone numbers** - US format  
✅ **Addresses** - Formatted street addresses  
✅ **Financial metrics** - Realistic portfolio values and returns  
✅ **S&P 500 holdings** - Actual company names and tickers  
✅ **Performance data** - YTD and 1-year returns  
✅ **Purchase dates** - Random dates from 2020-2024  
✅ **Gain/loss calculations** - Accurate unrealized P&L  

## Database Schema

The data populates these tables:

- `users` - Advisors with role='user'
- `households` - Client family units
- `accounts` - Individual investment accounts
- `holdings` - Securities within accounts
- `sp500Companies` - S&P 500 reference data

## Performance Tips

1. **Start with test data** - Always generate test data first to verify everything works
2. **Monitor database** - Watch disk space and memory during generation
3. **Batch processing** - Scripts use batching (500-1000 records) for efficiency
4. **Index creation** - Indexes are created automatically via schema
5. **Connection pooling** - Scripts use single connection for speed

## Clearing Data

To clear all synthetic data and start fresh:

```bash
cd /home/ubuntu/fa_advisor_ui
node -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
await conn.query('SET FOREIGN_KEY_CHECKS = 0');
await conn.query('TRUNCATE TABLE holdings');
await conn.query('TRUNCATE TABLE accounts');
await conn.query('TRUNCATE TABLE households');
await conn.query('DELETE FROM users WHERE role = \"user\"');
await conn.query('TRUNCATE TABLE sp500Companies');
await conn.query('SET FOREIGN_KEY_CHECKS = 1');
await conn.end();
console.log('✓ All synthetic data cleared');
"
```

## Salesforce Integration

The schema includes `salesforceId` fields for future integration. The Salesforce extraction sub-agent (to be implemented) will:

1. Connect to Salesforce API
2. Extract advisor, household, and account data
3. Map to database schema
4. Perform incremental sync
5. Handle authentication and rate limits

## Next Steps

After generating data:

1. **Test the UI** - Log in and browse clients/households
2. **Test AI queries** - Try the AI co-pilot with real data
3. **Generate reports** - Create PDF reports with actual holdings
4. **Test performance** - Verify query speed with realistic data volume
5. **Integrate backend** - Connect to FA AI System API for real analysis

## Troubleshooting

### "Table doesn't exist" error
Run the database migration first:
```bash
cd /home/ubuntu/fa_advisor_ui
pnpm db:push
```

### "Out of memory" error
- Reduce BATCH_SIZE in the script (default: 500-1000)
- Use test data instead of production data
- Increase database memory allocation

### Slow generation
- Normal for large datasets
- Monitor progress via console output
- Consider running overnight for production data

### Duplicate key errors
- Clear existing data first (see "Clearing Data" section)
- Or use `INSERT IGNORE` for idempotent runs

## Data Statistics

### Test Data (100 advisors)
- Total records: ~1,130,100
- Database size: ~500MB
- Generation time: ~5-10 minutes
- Queries/sec: ~200-500

### Production Data (4,000 advisors)
- Total records: ~89,604,000
- Database size: ~40GB
- Generation time: ~2-4 hours
- Queries/sec: ~100-300 (with proper indexing)

## Support

For issues or questions:
1. Check the main README.md
2. Review database schema in `drizzle/schema.ts`
3. Check console output for specific errors
4. Verify database connection and credentials
