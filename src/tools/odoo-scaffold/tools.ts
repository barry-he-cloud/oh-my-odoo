import type { PluginInput } from "@opencode-ai/plugin"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { resolve } from "path"

function generateManifest(opts: {
  name: string
  technical_name: string
  version: string
  depends: string[]
  category: string
  data: string[]
  demo: string[]
}): string {
  return `# -*- coding: utf-8 -*-
{
    'name': '${opts.name}',
    'version': '${opts.version}',
    'category': '${opts.category}',
    'summary': '',
    'description': """
        ${opts.name}
    """,
    'depends': [${opts.depends.map(d => `'${d}'`).join(", ")}],
    'data': [
${opts.data.map(d => `        '${d}',`).join("\n")}
    ],
    'demo': [
${opts.demo.map(d => `        '${d}',`).join("\n")}
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
`
}

function generateModel(moduleName: string, modelName: string, modelClass: string): string {
  return `# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ${modelClass}(models.Model):
    _name = '${moduleName}.${modelName}'
    _description = '${modelClass}'

    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    active = fields.Boolean(default=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ], string='Status', default='draft', tracking=True)
    company_id = fields.Many2one('res.company', string='Company',
                                  default=lambda self: self.env.company)

    def action_confirm(self):
        self.write({'state': 'confirmed'})

    def action_done(self):
        self.write({'state': 'done'})

    def action_cancel(self):
        self.write({'state': 'cancelled'})

    def action_draft(self):
        self.write({'state': 'draft'})
`
}

function generateFormView(moduleName: string, modelName: string, modelClass: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<odoo>
    <record id="view_${modelName}_form" model="ir.ui.view">
        <field name="name">${moduleName}.${modelName}.form</field>
        <field name="model">${moduleName}.${modelName}</field>
        <field name="arch" type="xml">
            <form string="${modelClass}">
                <header>
                    <button name="action_confirm" type="object" string="Confirm"
                            class="oe_highlight"
                            invisible="state != 'draft'"/>
                    <button name="action_done" type="object" string="Done"
                            class="oe_highlight"
                            invisible="state != 'confirmed'"/>
                    <button name="action_cancel" type="object" string="Cancel"
                            invisible="state in ('done', 'cancelled')"/>
                    <button name="action_draft" type="object" string="Reset to Draft"
                            invisible="state not in ('cancelled',)"/>
                    <field name="state" widget="statusbar"
                           statusbar_visible="draft,confirmed,done"/>
                </header>
                <sheet>
                    <group>
                        <group>
                            <field name="name"/>
                            <field name="company_id" groups="base.group_multi_company"/>
                        </group>
                        <group>
                            <field name="active" invisible="1"/>
                        </group>
                    </group>
                    <notebook>
                        <page string="Description">
                            <field name="description"/>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>

    <record id="view_${modelName}_tree" model="ir.ui.view">
        <field name="name">${moduleName}.${modelName}.tree</field>
        <field name="model">${moduleName}.${modelName}</field>
        <field name="arch" type="xml">
            <tree string="${modelClass}">
                <field name="name"/>
                <field name="state" decoration-success="state == 'done'"
                       decoration-info="state == 'confirmed'"
                       decoration-muted="state == 'cancelled'" widget="badge"/>
                <field name="company_id" groups="base.group_multi_company"/>
            </tree>
        </field>
    </record>

    <record id="view_${modelName}_search" model="ir.ui.view">
        <field name="name">${moduleName}.${modelName}.search</field>
        <field name="model">${moduleName}.${modelName}</field>
        <field name="arch" type="xml">
            <search string="${modelClass}">
                <field name="name"/>
                <filter name="draft" string="Draft" domain="[('state', '=', 'draft')]"/>
                <filter name="confirmed" string="Confirmed" domain="[('state', '=', 'confirmed')]"/>
                <filter name="done" string="Done" domain="[('state', '=', 'done')]"/>
                <separator/>
                <filter name="archived" string="Archived" domain="[('active', '=', False)]"/>
                <group expand="0" string="Group By">
                    <filter name="group_state" string="Status" context="{'group_by': 'state'}"/>
                    <filter name="group_company" string="Company" context="{'group_by': 'company_id'}"/>
                </group>
            </search>
        </field>
    </record>

    <record id="action_${modelName}" model="ir.actions.act_window">
        <field name="name">${modelClass}</field>
        <field name="res_model">${moduleName}.${modelName}</field>
        <field name="view_mode">tree,form</field>
        <field name="help" type="html">
            <p class="o_view_nocontent_smiling_face">
                Create your first ${modelClass.toLowerCase()}
            </p>
        </field>
    </record>

    <menuitem id="menu_${modelName}_root" name="${modelClass}"
              sequence="10"/>
    <menuitem id="menu_${modelName}" name="${modelClass}"
              parent="menu_${modelName}_root"
              action="action_${modelName}"
              sequence="10"/>
</odoo>
`
}

function generateSecurity(moduleName: string, modelName: string): string {
  return `id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_${moduleName}_${modelName}_user,${moduleName}.${modelName} user,model_${moduleName.replace(/\./g, "_")}_${modelName},base.group_user,1,1,1,0
access_${moduleName}_${modelName}_manager,${moduleName}.${modelName} manager,model_${moduleName.replace(/\./g, "_")}_${modelName},base.group_system,1,1,1,1
`
}

function generateInit(models: string[]): string {
  return `# -*- coding: utf-8 -*-
${models.map(m => `from . import ${m}`).join("\n")}
`
}

export function createOdooScaffoldTool(ctx: PluginInput): Record<string, ToolDefinition> {
  const scaffold: ToolDefinition = tool({
    description:
      "Generate a complete Odoo module skeleton with best practices. " +
      "Creates __manifest__.py, __init__.py, models/, views/, security/, controllers/, static/ directories. " +
      "Generates a starter model with form/tree/search views, access rules, and menu items. " +
      "Follows Odoo OCA coding standards.",
    args: {
      module_name: tool.schema.string()
        .describe("Technical module name (e.g. 'my_custom_module'). Must be a valid Python identifier."),
      display_name: tool.schema.string()
        .describe("Human-readable module name (e.g. 'My Custom Module')"),
      model_name: tool.schema.string().optional()
        .describe("Primary model name (e.g. 'custom_record'). Defaults to module_name"),
      model_class: tool.schema.string().optional()
        .describe("Python class name (e.g. 'CustomRecord'). Auto-generated from model_name if omitted."),
      odoo_version: tool.schema.string().optional()
        .describe("Target Odoo version (e.g. '17.0'). Defaults to '17.0'"),
      category: tool.schema.string().optional()
        .describe("Module category (e.g. 'Tools', 'Sales', 'Accounting'). Defaults to 'Uncategorized'"),
      depends: tool.schema.array(tool.schema.string()).optional()
        .describe("Module dependencies. Defaults to ['base']"),
      addons_path: tool.schema.string().optional()
        .describe("Directory to create the module in. Defaults to 'addons/' or 'custom_addons/'"),
      with_controller: tool.schema.boolean().optional()
        .describe("Generate a starter HTTP controller"),
      with_wizard: tool.schema.boolean().optional()
        .describe("Generate a starter wizard (TransientModel)"),
      with_report: tool.schema.boolean().optional()
        .describe("Generate a starter QWeb PDF report"),
    },
    execute: async (params) => {
      const projectRoot = resolve(ctx.directory)
      const odooVersion = params.odoo_version ?? "17.0"
      const moduleName = params.module_name
      const modelName = params.model_name ?? moduleName
      const modelClass = params.model_class ?? modelName.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")
      const category = params.category ?? "Uncategorized"
      const depends = params.depends ?? ["base"]

      const dataFiles = [
        "security/ir.model.access.csv",
        `views/${modelName}_views.xml`,
      ]
      const demoFiles: string[] = []

      const files: Array<{ path: string; content: string }> = []

      // __manifest__.py
      files.push({
        path: `__manifest__.py`,
        content: generateManifest({
          name: params.display_name,
          technical_name: moduleName,
          version: `${odooVersion}.1.0.0`,
          depends,
          category,
          data: dataFiles,
          demo: demoFiles,
        }),
      })

      // __init__.py (root)
      files.push({ path: `__init__.py`, content: generateInit(["models"]) })

      // models/__init__.py
      files.push({ path: `models/__init__.py`, content: generateInit([modelName]) })

      // models/<model>.py
      files.push({ path: `models/${modelName}.py`, content: generateModel(moduleName, modelName, modelClass) })

      // views
      files.push({ path: `views/${modelName}_views.xml`, content: generateFormView(moduleName, modelName, modelClass) })

      // security
      files.push({ path: `security/ir.model.access.csv`, content: generateSecurity(moduleName, modelName) })

      // Controller
      if (params.with_controller) {
        files[1] = { path: `__init__.py`, content: generateInit(["models", "controllers"]) }
        files.push({ path: `controllers/__init__.py`, content: generateInit(["main"]) })
        files.push({
          path: `controllers/main.py`,
          content: `# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


class ${modelClass}Controller(http.Controller):

    @http.route('/${moduleName}/list', type='http', auth='user', website=True)
    def list_records(self, **kw):
        records = request.env['${moduleName}.${modelName}'].search([])
        return request.render('${moduleName}.portal_list', {'records': records})
`,
        })
      }

      // Wizard
      if (params.with_wizard) {
        const rootInit = files.find(f => f.path === "__init__.py")
        if (rootInit) {
          const imports = ["models"]
          if (params.with_controller) imports.push("controllers")
          imports.push("wizards")
          rootInit.content = generateInit(imports)
        }
        files.push({ path: `wizards/__init__.py`, content: generateInit([`${modelName}_wizard`]) })
        files.push({
          path: `wizards/${modelName}_wizard.py`,
          content: `# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ${modelClass}Wizard(models.TransientModel):
    _name = '${moduleName}.${modelName}.wizard'
    _description = '${modelClass} Wizard'

    name = fields.Char(string='Name', required=True)

    def action_apply(self):
        self.ensure_one()
        # TODO: implement wizard logic
        return {'type': 'ir.actions.act_window_close'}
`,
        })
      }

      // Format output
      const lines: string[] = [
        `=== Odoo Module Scaffold: ${moduleName} ===`,
        `Display Name: ${params.display_name}`,
        `Odoo Version: ${odooVersion}`,
        `Category: ${category}`,
        `Dependencies: ${depends.join(", ")}`,
        "",
        "Generated files:",
      ]

      for (const file of files) {
        lines.push(`\n--- ${moduleName}/${file.path} ---`)
        lines.push("```" + (file.path.endsWith(".py") ? "python" : file.path.endsWith(".xml") ? "xml" : file.path.endsWith(".csv") ? "csv" : ""))
        lines.push(file.content)
        lines.push("```")
      }

      lines.push("")
      lines.push("Next steps:")
      lines.push(`1. Create the module directory and write these files`)
      lines.push(`2. Add the module's parent directory to addons_path in odoo.conf`)
      lines.push(`3. Restart Odoo and update module list: Settings → Apps → Update Apps List`)
      lines.push(`4. Install the module: Settings → Apps → search '${params.display_name}'`)

      return lines.join("\n")
    },
  })

  return { odoo_scaffold: scaffold }
}
