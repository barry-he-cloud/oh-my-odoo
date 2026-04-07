import type { BuiltinSkill } from "../types"

export const odooSecuritySkill: BuiltinSkill = {
  name: "odoo-security",
  description: "Odoo security — access rights (ir.model.access), record rules (ir.rule), groups, superuser, sudo patterns",
  template: `# Odoo Security Expert

You help implement proper security in Odoo modules.

## Access Rights (ir.model.access.csv)
Controls CRUD permissions per model per group.

\`\`\`csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model user,model_my_model,base.group_user,1,1,1,0
access_my_model_manager,my.model manager,model_my_model,my_module.group_manager,1,1,1,1
\`\`\`

Rules:
- model_id format: \`model_\` + model name with dots replaced by underscores
- Every model needs at least one access rule or users get AccessError
- Omitting group_id = public access (dangerous!)
- Users get the UNION of all their groups' permissions

## Record Rules (ir.rule)
Row-level security — controls WHICH records a user can access.

\`\`\`xml
<record id="rule_my_model_company" model="ir.rule">
    <field name="name">My Model: multi-company</field>
    <field name="model_id" ref="model_my_model"/>
    <field name="domain_force">[
        '|',
            ('company_id', '=', False),
            ('company_id', 'in', company_ids),
    ]</field>
    <field name="perm_read" eval="True"/>
    <field name="perm_write" eval="True"/>
    <field name="perm_create" eval="True"/>
    <field name="perm_unlink" eval="True"/>
</record>

<!-- Restrict to own records -->
<record id="rule_my_model_own" model="ir.rule">
    <field name="name">My Model: own records only</field>
    <field name="model_id" ref="model_my_model"/>
    <field name="groups" eval="[(4, ref('base.group_user'))]"/>
    <field name="domain_force">[('create_uid', '=', user.id)]</field>
</record>
\`\`\`

Rule evaluation:
- Global rules (no group): AND together — ALL must pass
- Group rules: OR together — ANY matching group rule passes
- Then global AND group results are ANDed

## Security Groups
\`\`\`xml
<record id="group_manager" model="res.groups">
    <field name="name">My Module Manager</field>
    <field name="category_id" ref="base.module_category_extra"/>
    <field name="implied_ids" eval="[(4, ref('base.group_user'))]"/>
    <field name="users" eval="[(4, ref('base.user_admin'))]"/>
</record>
\`\`\`

## Controller Security
\`\`\`python
# Public endpoint
@http.route('/api/public', type='json', auth='public')
def public_api(self):
    pass

# Logged-in users only
@http.route('/api/data', type='json', auth='user')
def user_api(self):
    pass

# Check specific group in controller
from odoo.exceptions import AccessError
if not request.env.user.has_group('my_module.group_manager'):
    raise AccessError("Managers only")
\`\`\`

## sudo() Best Practices
\`\`\`python
# Good: narrow sudo scope
partner = self.env['res.partner'].sudo().search([('email', '=', email)], limit=1)

# Good: switch back after privileged read
config_value = self.env['ir.config_parameter'].sudo().get_param('my.key')

# AVOID: broad sudo on user-facing writes
# record.sudo().write(user_data)  # bypasses ALL security

# Better: validate then sudo for specific operation
if self.env.user.has_group('my_module.group_manager'):
    record.sudo().write({'state': 'approved'})
\`\`\`

## Common Pitfalls
1. Forgetting ir.model.access.csv → users get "Access Denied"
2. Using sudo() too broadly → security bypass
3. Not testing with non-admin user → hidden permission issues
4. Record rules with [(1,'=',1)] → no actual restriction
5. Missing multi-company rules → data leaks between companies
`,
}
