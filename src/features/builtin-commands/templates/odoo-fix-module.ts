export const ODOO_FIX_MODULE_TEMPLATE = `Debug and fix issues in an Odoo module.

This command will:
1. Load skills: odoo-debugging, odoo-orm-expert, odoo-views-xml
2. Analyze the error/issue description
3. Check relevant log files and error traces
4. Identify root cause across models, views, security, and controllers
5. Propose and implement the fix

Diagnostic flow:
- If ORM error: check model definition, field types, compute dependencies
- If view error: validate XML, check xpath, field references
- If security error: verify ir.model.access.csv and ir.rule
- If import error: check __init__.py chain and __manifest__.py
- If JS error: check OWL component syntax and asset bundles
- If data error: check XML data files and noupdate flags

Arguments:
- Error description or log output
- Optional: --module=NAME (scope to specific module)
- Optional: --test (run tests after fix)`
