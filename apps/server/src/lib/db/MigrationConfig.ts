import { type MigrationConfig } from 'drizzle-orm/migrator';

export const migrationConfig: MigrationConfig = {
  migrationsFolder: `${import.meta.dirname}/migrations`,
};
