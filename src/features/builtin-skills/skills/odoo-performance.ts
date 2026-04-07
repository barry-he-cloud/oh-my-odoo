import type { BuiltinSkill } from "../types"

export const odooPerformanceSkill: BuiltinSkill = {
  name: "odoo-performance",
  description: "Odoo performance optimization — ORM queries, prefetch, caching, workers, PostgreSQL tuning",
  template: `# Odoo Performance Expert

You help optimize Odoo performance at ORM, server, and database levels.

## ORM Performance Anti-patterns

### N+1 Query Problem
\`\`\`python
# BAD: N+1 queries
for order in orders:
    partner_name = order.partner_id.name  # 1 query per record!

# GOOD: prefetch (Odoo does this automatically for recordsets)
orders = self.env['sale.order'].search([])
for order in orders:
    partner_name = order.partner_id.name  # prefetched!

# GOOD: explicit read for specific fields
data = orders.read(['partner_id'])
\`\`\`

### Computed Fields
\`\`\`python
# BAD: non-stored compute with expensive logic
total = fields.Float(compute='_compute_total')  # recomputed on every access

# GOOD: stored compute (cached in DB)
total = fields.Float(compute='_compute_total', store=True)

# GOOD: narrow depends
@api.depends('line_ids.price')  # only recompute when line prices change
def _compute_total(self):
    for rec in self:
        rec.total = sum(rec.line_ids.mapped('price'))
\`\`\`

### Batch Operations
\`\`\`python
# BAD: create one at a time
for data in items:
    self.env['my.model'].create(data)

# GOOD: batch create
self.env['my.model'].create(items)  # single INSERT

# BAD: write one at a time
for record in records:
    record.write({'state': 'done'})

# GOOD: batch write
records.write({'state': 'done'})  # single UPDATE
\`\`\`

### Search Optimization
\`\`\`python
# BAD: load all fields
records = self.env['my.model'].search([('state', '=', 'draft')])

# GOOD: specify fields you need
data = self.env['my.model'].search_read(
    [('state', '=', 'draft')],
    fields=['name', 'amount'],
    limit=100,
)

# GOOD: use read_group for aggregation
result = self.env['sale.order'].read_group(
    domain=[('state', '=', 'sale')],
    fields=['amount_total:sum'],
    groupby=['partner_id'],
)
\`\`\`

## Server Configuration (odoo.conf)
\`\`\`ini
[options]
# Workers (CPU cores * 2 + 1, max ~8 for most setups)
workers = 4
max_cron_threads = 1

# Memory limits per worker
limit_memory_hard = 2684354560   # 2.5GB
limit_memory_soft = 2147483648   # 2GB
limit_time_cpu = 600             # 10 min
limit_time_real = 1200           # 20 min

# Proxy mode behind nginx
proxy_mode = True

# Database
db_maxconn = 64                  # per worker
\`\`\`

## PostgreSQL Tuning
\`\`\`sql
-- postgresql.conf key settings
shared_buffers = '256MB'              -- 25% of RAM
effective_cache_size = '768MB'        -- 75% of RAM
work_mem = '16MB'
maintenance_work_mem = '128MB'
max_connections = 300                 -- workers * db_maxconn + buffer
random_page_cost = 1.1               -- SSD
effective_io_concurrency = 200        -- SSD

-- Useful maintenance
VACUUM ANALYZE;  -- update stats
REINDEX DATABASE mydb;  -- fix bloated indexes
\`\`\`

## Caching Strategies
\`\`\`python
# Use ir.config_parameter for expensive config reads
value = self.env['ir.config_parameter'].sudo().get_param('my.key')

# Python-level cache for session-scoped data
from functools import lru_cache

# tools.cache for model-level caching
from odoo.tools import ormcache

class MyModel(models.Model):
    @ormcache('self.env.uid', 'key')
    def _get_cached_value(self, key):
        return expensive_computation(key)

    def clear_caches(self):
        super().clear_caches()
        self._get_cached_value.clear_cache(self)
\`\`\`

## Monitoring Queries
\`\`\`python
# Count queries in a block
from odoo.tests.common import QueryCounter
with QueryCounter() as qc:
    records.mapped('partner_id.name')
print(f"Queries: {qc.count}")
\`\`\`
`,
}
