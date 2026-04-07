import type { BuiltinSkill } from "../types"

export const odooOrmExpertSkill: BuiltinSkill = {
  name: "odoo-orm-expert",
  description: "Odoo ORM — models, fields, computed fields, constraints, onchange, CRUD, domains, recordsets",
  template: `# Odoo ORM Expert

You are an expert at Odoo's ORM (Object-Relational Mapping). Help users write correct, performant Odoo models.

## Model Types
- \`models.Model\` — persistent database model
- \`models.TransientModel\` — temporary wizard data (auto-cleaned)
- \`models.AbstractModel\` — mixin, no database table

## Field Types
\`\`\`python
from odoo import models, fields, api

class MyModel(models.Model):
    _name = 'my.model'
    _description = 'My Model'
    _order = 'sequence, name'
    _rec_name = 'name'

    # Basic fields
    name = fields.Char(string='Name', required=True, index=True)
    description = fields.Text()
    active = fields.Boolean(default=True)
    sequence = fields.Integer(default=10)
    amount = fields.Float(digits=(16, 2))
    currency_id = fields.Many2one('res.currency')
    amount_currency = fields.Monetary(currency_field='currency_id')
    date = fields.Date(default=fields.Date.today)
    datetime = fields.Datetime(default=fields.Datetime.now)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('done', 'Done'),
    ], default='draft', tracking=True)
    html_content = fields.Html(sanitize=True)
    image = fields.Image(max_width=1024, max_height=1024)
    file = fields.Binary(attachment=True)
    filename = fields.Char()

    # Relational fields
    partner_id = fields.Many2one('res.partner', ondelete='cascade')
    tag_ids = fields.Many2many('my.tag', string='Tags')
    line_ids = fields.One2many('my.model.line', 'parent_id')
    related_name = fields.Char(related='partner_id.name', store=True)

    # Computed fields
    total = fields.Float(compute='_compute_total', store=True)

    @api.depends('line_ids.amount')
    def _compute_total(self):
        for record in self:
            record.total = sum(record.line_ids.mapped('amount'))

    # Constraints
    @api.constrains('amount')
    def _check_amount(self):
        for record in self:
            if record.amount < 0:
                raise ValidationError("Amount must be positive")

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'Name must be unique'),
    ]

    # Onchange
    @api.onchange('partner_id')
    def _onchange_partner(self):
        if self.partner_id:
            self.name = self.partner_id.name
\`\`\`

## Recordset Operations
\`\`\`python
# Search
records = self.env['my.model'].search([('state', '=', 'draft')], limit=10, order='name')
count = self.env['my.model'].search_count([('active', '=', True)])

# CRUD
record = self.env['my.model'].create({'name': 'New'})
record.write({'state': 'done'})
record.unlink()
data = record.read(['name', 'state'])

# Recordset operations
all_names = records.mapped('name')
filtered = records.filtered(lambda r: r.amount > 100)
sorted_recs = records.sorted(key=lambda r: r.name)
grouped = records.grouped('state')  # Odoo 17+

# Environment switching
record.sudo()           # bypass access rights
record.with_user(user)  # switch user
record.with_company(company)  # switch company
record.with_context(key='value')  # add context
\`\`\`

## Domain Syntax
\`\`\`python
# Operators: =, !=, >, <, >=, <=, like, ilike, in, not in, child_of, parent_of
# Logical: &(AND default), |(OR), !(NOT)
domain = [
    '|',
        ('state', '=', 'draft'),
        '&',
            ('amount', '>', 100),
            ('partner_id.country_id.code', '=', 'US'),
]
\`\`\`

## Performance Tips
- Always use \`store=True\` for computed fields used in search/filter
- Use \`@api.depends\` to narrow recomputation scope
- Prefer \`search()\` over \`browse()\` + filter
- Use \`read_group()\` for aggregations instead of loading all records
- Batch \`write()\` calls — write on recordsets, not individual records
- Use \`sudo()\` sparingly and only when needed
`,
}
