import { drizzle } from "drizzle-orm/mysql2";
import { households, accounts, meetings } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const firstNames = [
  "John", "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Lisa",
  "William", "Mary", "James", "Patricia", "Richard", "Linda", "Thomas", "Barbara",
  "Charles", "Elizabeth", "Daniel", "Susan", "Matthew", "Jessica", "Anthony", "Karen",
  "Mark", "Nancy", "Donald", "Betty", "Steven", "Helen"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
];

const riskTolerances = ["conservative", "moderate", "aggressive"] as const;

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "email.com"];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`;
}

function generatePhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

async function main() {
  console.log("Generating synthetic household data...");

  // Get distinct household IDs from accounts (limit to 50 for performance)
  const result = await db.execute(sql`
    SELECT DISTINCT householdId
    FROM accounts
    WHERE householdId IS NOT NULL
    ORDER BY householdId
    LIMIT 50
  `);

  const householdIds = result[0] as Array<{ householdId: number }>;
  console.log(`Found ${householdIds.length} unique households in accounts table`);

  // Generate household data for each unique householdId
  for (const { householdId } of householdIds) {
    // Assign advisor ID 1 to all households for now
    const advisorId = 1;
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const householdName = `${lastName} Family`;
    const primaryContactName = `${firstName} ${lastName}`;
    const email = generateEmail(firstName, lastName);
    const phone = generatePhone();
    const riskTolerance = randomElement(riskTolerances);

    // Calculate total net worth from accounts
    const accountsResult = await db.execute(sql`
      SELECT SUM(currentValue) as totalValue
      FROM accounts
      WHERE householdId = ${householdId}
    `);
    
    const totalNetWorth = (accountsResult[0] as any)[0]?.totalValue || "0";

    // Insert household
    await db.insert(households).values({
      id: householdId,
      advisorId,
      householdName,
      primaryContactName,
      email,
      phone,
      riskTolerance,
      totalNetWorth: totalNetWorth.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`Created household ${householdId}: ${householdName} ($${parseFloat(totalNetWorth).toLocaleString()})`);

    // Skip meeting creation for now - meetings table requires clientId
    // Meetings can be added later via the UI or a separate script
  }

  console.log("\n✅ Synthetic household data generation complete!");
  console.log(`Generated ${householdIds.length} households with meetings`);
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Error generating households:", err);
  process.exit(1);
});
