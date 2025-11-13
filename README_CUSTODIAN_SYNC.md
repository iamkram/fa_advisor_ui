# Custodian Portfolio Sync

Real-time portfolio synchronization with major custodians (Schwab, Fidelity, etc.).

## Overview

The Custodian Sync service automatically syncs portfolio holdings from external custodians into the FA Advisor UI database. This ensures advisors always have up-to-date portfolio information for their clients.

## Supported Custodians

| Custodian | API | Status |
|-----------|-----|--------|
| Charles Schwab | [Schwab Advisor API](https://developer.schwab.com/) | ✅ Implemented |
| Fidelity | [WealthCentral API](https://www.fidelity.com/wealthcentral) | ✅ Implemented |
| TD Ameritrade | [TD Ameritrade API](https://developer.tdameritrade.com/) | 🔜 Planned |
| Interactive Brokers | [IB API](https://www.interactivebrokers.com/en/trading/ib-api.php) | 🔜 Planned |

## Setup

### 1. Get API Credentials

**Schwab:**
1. Register at [developer.schwab.com](https://developer.schwab.com/)
2. Create an application
3. Get your API Key and Secret

**Fidelity:**
1. Contact Fidelity WealthCentral support
2. Request API access for your firm
3. Receive API credentials

### 2. Configure Environment Variables

Add to `.env`:

```bash
# Schwab API
SCHWAB_API_KEY=your_schwab_api_key
SCHWAB_API_SECRET=your_schwab_api_secret

# Fidelity API
FIDELITY_API_KEY=your_fidelity_api_key
FIDELITY_API_SECRET=your_fidelity_api_secret
```

### 3. Link Accounts

In the database, ensure accounts have the correct `accountNumber` that matches the custodian's account number:

```sql
UPDATE accounts 
SET accountNumber = 'SCHWAB-12345678'
WHERE id = 1;
```

## Usage

### Manual Sync

Sync a specific advisor:

```typescript
import { custodianSync } from './server/services/custodianSync';

// Sync one advisor
await custodianSync.syncAdvisor('advisor-id-123');
```

### Scheduled Sync

The system automatically syncs all advisors nightly at 2 AM. To enable:

```typescript
import cron from 'node-cron';
import { custodianSync } from './server/services/custodianSync';

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  await custodianSync.syncAll();
});
```

### API Endpoint

Trigger sync via tRPC:

```typescript
// Client-side
const syncMutation = trpc.custodian.sync.useMutation();

await syncMutation.mutateAsync({ advisorId: '123' });
```

## How It Works

1. **Authentication**: Connects to custodian APIs using OAuth 2.0
2. **Account Discovery**: Fetches all accounts for an advisor
3. **Holdings Sync**: For each account:
   - Deletes existing holdings
   - Fetches current positions from custodian
   - Inserts updated holdings with:
     - Current prices
     - Cost basis
     - Unrealized gains/losses
     - Asset allocation
4. **Error Handling**: Logs errors but continues syncing other accounts

## Data Mapping

### Account Types

| Custodian | FA UI |
|-----------|-------|
| Individual | Individual |
| Joint | Joint |
| IRA | IRA |
| Roth IRA | Roth IRA |
| 401(k) | 401k |
| Trust | Trust |

### Asset Classes

| Custodian | FA UI |
|-----------|-------|
| Stock, Equity | equity |
| Bond, Fixed Income | fixed_income |
| Cash, Money Market | cash |
| Alternative, Hedge Fund | alternative |
| Other | other |

## Monitoring

Check sync status:

```typescript
const result = await custodianSync.syncAdvisor('advisor-123');

console.log(`Success: ${result.success}`);
console.log(`Accounts synced: ${result.accountsSynced}`);
console.log(`Holdings synced: ${result.holdingsSynced}`);
console.log(`Errors: ${result.errors.join(', ')}`);
```

## Troubleshooting

### Authentication Fails

- Verify API credentials in `.env`
- Check if credentials have expired
- Ensure IP address is whitelisted with custodian

### Account Not Found

- Verify `accountNumber` in database matches custodian
- Check if account is active at custodian
- Ensure advisor has access to the account

### Holdings Not Updating

- Check custodian API rate limits
- Verify account has positions
- Review sync logs for errors

## Rate Limits

| Custodian | Limit | Notes |
|-----------|-------|-------|
| Schwab | 120 req/min | Per API key |
| Fidelity | 60 req/min | Per firm |

## Security

- API credentials stored in environment variables
- OAuth tokens refreshed automatically
- All API calls use HTTPS
- Holdings data encrypted at rest

## Future Enhancements

- [ ] Real-time webhooks for instant updates
- [ ] Support for more custodians
- [ ] Transaction history sync
- [ ] Performance attribution
- [ ] Tax lot tracking
- [ ] Corporate actions (splits, dividends)

## Support

For issues or questions:
- Check custodian API documentation
- Review sync logs in console
- Contact custodian API support
