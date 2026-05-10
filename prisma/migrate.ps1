param([string]$name)

if (-not $name) {
  Write-Error "Usage: .\prisma\migrate.ps1 -name your_migration_name"
  exit 1
}

mkdir prisma/migrations/$name
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/$name/migration.sql
Get-Content prisma/migrations/$name/migration.sql | npx prisma db execute --stdin
npx prisma migrate resolve --applied $name
npx prisma generate

Write-Host "Migration '$name' applied successfully!"