import type { BuiltinSkill } from "../types"

export const odooViewsXmlSkill: BuiltinSkill = {
  name: "odoo-views-xml",
  description: "Odoo views — form, tree, kanban, search, pivot, graph, calendar, QWeb templates, and view inheritance",
  template: `# Odoo Views & XML Expert

You are an expert at Odoo view definitions and XML data files.

## View Types

### Form View
\`\`\`xml
<record id="view_my_model_form" model="ir.ui.view">
    <field name="name">my.model.form</field>
    <field name="model">my.model</field>
    <field name="arch" type="xml">
        <form string="My Model">
            <header>
                <button name="action_confirm" type="object"
                        string="Confirm" class="oe_highlight"
                        invisible="state != 'draft'"/>
                <field name="state" widget="statusbar"
                       statusbar_visible="draft,confirmed,done"/>
            </header>
            <sheet>
                <div class="oe_button_box" name="button_box">
                    <button name="action_view_related"
                            type="object" class="oe_stat_button"
                            icon="fa-list">
                        <field name="related_count" widget="statinfo"
                               string="Related"/>
                    </button>
                </div>
                <widget name="web_ribbon" title="Archived"
                        bg_color="text-bg-danger"
                        invisible="active"/>
                <div class="oe_title">
                    <h1><field name="name" placeholder="Name..."/></h1>
                </div>
                <group>
                    <group>
                        <field name="partner_id"/>
                        <field name="date"/>
                    </group>
                    <group>
                        <field name="amount"/>
                        <field name="company_id"
                               groups="base.group_multi_company"/>
                    </group>
                </group>
                <notebook>
                    <page string="Lines">
                        <field name="line_ids">
                            <tree editable="bottom">
                                <field name="name"/>
                                <field name="amount"/>
                            </tree>
                        </field>
                    </page>
                    <page string="Notes">
                        <field name="description"/>
                    </page>
                </notebook>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="activity_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
\`\`\`

### Kanban View
\`\`\`xml
<record id="view_my_model_kanban" model="ir.ui.view">
    <field name="name">my.model.kanban</field>
    <field name="model">my.model</field>
    <field name="arch" type="xml">
        <kanban default_group_by="state" class="o_kanban_small_column">
            <field name="name"/>
            <field name="state"/>
            <field name="partner_id"/>
            <templates>
                <t t-name="kanban-card">
                    <div class="oe_kanban_content">
                        <strong><field name="name"/></strong>
                        <div><field name="partner_id"/></div>
                    </div>
                </t>
            </templates>
        </kanban>
    </field>
</record>
\`\`\`

## View Inheritance (xpath)
\`\`\`xml
<record id="view_partner_form_inherit" model="ir.ui.view">
    <field name="name">res.partner.form.inherit.my_module</field>
    <field name="model">res.partner</field>
    <field name="inherit_id" ref="base.view_partner_form"/>
    <field name="arch" type="xml">
        <!-- Add field after existing field -->
        <xpath expr="//field[@name='phone']" position="after">
            <field name="my_custom_field"/>
        </xpath>

        <!-- Add page to notebook -->
        <xpath expr="//notebook" position="inside">
            <page string="My Custom Tab">
                <field name="my_field_ids"/>
            </page>
        </xpath>

        <!-- Modify attributes -->
        <xpath expr="//field[@name='email']" position="attributes">
            <attribute name="required">1</attribute>
        </xpath>

        <!-- Replace element -->
        <xpath expr="//field[@name='old_field']" position="replace">
            <field name="new_field"/>
        </xpath>
    </field>
</record>
\`\`\`

## Odoo 17+ View Attributes (no more attrs={})
\`\`\`xml
<!-- OLD (deprecated in 17+) -->
<field name="x" attrs="{'invisible': [('state', '!=', 'draft')]}"/>

<!-- NEW (Odoo 17+) -->
<field name="x" invisible="state != 'draft'"/>
<field name="y" readonly="state == 'done'"/>
<field name="z" required="type == 'special'"/>
<field name="w" column_invisible="True"/>
\`\`\`

## QWeb Templates (Website/Portal)
\`\`\`xml
<template id="portal_my_records" name="My Records">
    <t t-call="portal.portal_layout">
        <t t-foreach="records" t-as="record">
            <div class="card mb-2">
                <div class="card-body">
                    <h5 t-field="record.name"/>
                    <p t-field="record.description"/>
                    <span class="badge"
                          t-attf-class="badge bg-{{ 'success' if record.state == 'done' else 'warning' }}">
                        <t t-esc="record.state"/>
                    </span>
                </div>
            </div>
        </t>
    </t>
</template>
\`\`\`

## Key Rules
- Always set \`noupdate="1"\` for data that should persist across updates
- Use \`groups=""\` to restrict UI elements by user group
- Prefer \`invisible\` over removing fields — hidden data still loads
- Use \`widget=""\` for specialized display (statusbar, badge, monetary, etc.)
- Test views in both desktop and mobile viewports
`,
}
