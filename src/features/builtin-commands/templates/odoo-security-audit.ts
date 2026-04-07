export const ODOO_SECURITY_AUDIT_TEMPLATE = `Run a comprehensive security audit on Odoo custom modules.

This command will:
1. Use odoo_security_checker to scan all custom modules
2. Check ir.model.access.csv completeness and permission levels
3. Analyze ir.rule record rules for multi-company isolation
4. Scan Python code for SQL injection, eval(), sudo() misuse
5. Validate XML data files for security group references

Report structure:
- Critical issues (must fix before production)
- High issues (should fix)
- Medium issues (recommended improvements)
- Low issues (best-practice suggestions)

Arguments:
- Optional: --module=NAME (audit specific module)
- Optional: --fix (generate fix suggestions as code patches)`
