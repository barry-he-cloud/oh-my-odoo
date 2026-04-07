import { Command } from "commander"
import { PLUGIN_NAME, PLUGIN_VERSION } from "../shared/plugin-identity"
import { runDoctorChecks, formatDoctorResults } from "./doctor/checks/odoo-system"

const program = new Command()

program
  .name(PLUGIN_NAME)
  .description("The Best AI Agent Harness for Odoo — OpenCode Plugin")
  .version(PLUGIN_VERSION)

program
  .command("doctor")
  .description("Check system requirements for Odoo development")
  .option("-d, --directory <path>", "Project root directory", process.cwd())
  .action((options) => {
    const results = runDoctorChecks(options.directory)
    console.log(formatDoctorResults(results))
  })

program
  .command("info")
  .description("Show plugin information and loaded configuration")
  .action(() => {
    console.log(`${PLUGIN_NAME} v${PLUGIN_VERSION}`)
    console.log(`OpenCode Plugin for Odoo ERP Development`)
    console.log()
    console.log("Tools:")
    console.log("  odoo_cli              - Execute odoo-bin commands safely")
    console.log("  odoo_module_update    - Update Odoo modules")
    console.log("  odoo_module_install   - Install Odoo modules")
    console.log("  odoo_test_module      - Run Odoo module tests")
    console.log("  odoo_module_scanner   - Scan & inventory all custom modules")
    console.log("  odoo_config_validator - Validate odoo.conf security & performance")
    console.log("  odoo_upgrade_analyze  - Analyze version upgrade compatibility")
    console.log("  odoo_upgrade_migrate  - Generate migration scripts")
    console.log("  odoo_security_checker - Security audit for custom modules")
    console.log("  odoo_xml_validator    - Validate Odoo XML view files")
    console.log("  odoo_scaffold         - Generate complete module skeleton")
    console.log()
    console.log("Skills:")
    console.log("  odoo-orm-expert       - ORM models, fields, recordsets, domains")
    console.log("  odoo-views-xml        - Views, QWeb, inheritance, xpath")
    console.log("  odoo-security         - Access rights, record rules, groups")
    console.log("  odoo-upgrade-analysis - Version migration planning")
    console.log("  odoo-debugging        - Log analysis, shell, pdb, profiling")
    console.log("  odoo-performance      - Query optimization, caching, tuning")
    console.log("  odoo-testing          - Test classes, Form helper, tours, mocking")
    console.log("  odoo-api-integration  - JSON-RPC, XML-RPC, REST, webhooks")
    console.log()
    console.log("Hooks:")
    console.log("  odoo-context-injector - Auto-detect Odoo project & inject context")
    console.log("  odoo-module-guard     - Prevent accidental core module edits")
  })

program.parse()
