export const ODOO_NEW_MODULE_TEMPLATE = `Scaffold a new Odoo module with best-practice structure.

This command will:
1. Load skill "odoo-orm-expert" for model conventions
2. Use the odoo_scaffold tool to generate full module skeleton
3. Create the standard Odoo directory layout:
   - __manifest__.py with proper metadata and dependencies
   - models/ with starter model (fields, compute, constraints)
   - views/ with form, tree, search, and kanban views
   - security/ with ir.model.access.csv and record rules
   - controllers/ (optional) for HTTP endpoints
   - wizards/ (optional) for TransientModel wizards
   - data/ for default data and configuration
   - static/ for web assets (JS, CSS, images)
   - tests/ for unit tests

Arguments:
- Module technical name (e.g. "my_inventory_tracker")
- Display name (e.g. "Inventory Tracker")
- Optional: --with-controller (generate HTTP controller)
- Optional: --with-wizard (generate wizard TransientModel)
- Optional: --with-report (generate QWeb PDF report)
- Optional: --with-website (generate website pages and portal)
- Optional: --with-api (generate REST API controller)

Follow Odoo OCA coding standards:
- PEP 8 + OCA-specific conventions
- All strings translatable with _()
- Security-first: access rules + record rules
- Proper __manifest__.py with all data files listed`
