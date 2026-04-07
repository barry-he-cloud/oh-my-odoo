import type { BuiltinSkill } from "../types"

export const odooTestingSkill: BuiltinSkill = {
  name: "odoo-testing",
  description: "Odoo testing — TransactionCase, HttpCase, tours, mocking, test tags, CI setup",
  template: `# Odoo Testing Expert

You help write comprehensive tests for Odoo modules.

## Test Classes
\`\`\`python
from odoo.tests.common import TransactionCase, HttpCase, Form, tagged

@tagged('post_install', '-at_install')
class TestMyModel(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.partner = cls.env['res.partner'].create({
            'name': 'Test Partner',
        })
        cls.record = cls.env['my.model'].create({
            'name': 'Test Record',
            'partner_id': cls.partner.id,
        })

    def test_create_record(self):
        """Test basic record creation."""
        self.assertEqual(self.record.state, 'draft')
        self.assertTrue(self.record.active)

    def test_confirm_workflow(self):
        """Test state transitions."""
        self.record.action_confirm()
        self.assertEqual(self.record.state, 'confirmed')

    def test_compute_total(self):
        """Test computed field."""
        self.env['my.model.line'].create({
            'parent_id': self.record.id,
            'amount': 100.0,
        })
        self.assertEqual(self.record.total, 100.0)

    def test_constraint(self):
        """Test validation constraint."""
        with self.assertRaises(ValidationError):
            self.record.write({'amount': -1})

    def test_access_rights(self):
        """Test security."""
        user = self.env['res.users'].create({
            'name': 'Basic User',
            'login': 'basic@test.com',
            'groups_id': [(6, 0, [self.env.ref('base.group_user').id])],
        })
        record = self.record.with_user(user)
        record.read(['name'])  # should work
        with self.assertRaises(AccessError):
            record.unlink()  # should fail for basic user
\`\`\`

## Testing with Form
\`\`\`python
def test_onchange(self):
    """Test onchange via Form helper."""
    form = Form(self.env['my.model'])
    form.partner_id = self.partner
    # onchange should set name
    self.assertEqual(form.name, self.partner.name)

    record = form.save()
    self.assertTrue(record.id)
\`\`\`

## HTTP Tests & Tours
\`\`\`python
@tagged('post_install', '-at_install')
class TestMyModelHttp(HttpCase):

    def test_website_page(self):
        """Test website controller returns 200."""
        self.authenticate('admin', 'admin')
        response = self.url_open('/my_module/list')
        self.assertEqual(response.status_code, 200)

    def test_tour(self):
        """Run a browser tour test."""
        self.start_tour('/web', 'my_module_tour', login='admin')
\`\`\`

## Test Tags
\`\`\`python
@tagged('post_install', '-at_install')      # Run after install
@tagged('-at_install', 'post_install')      # Same
@tagged('my_module')                        # Custom tag
@tagged('-standard')                        # Exclude from standard run

# Run specific tags:
# odoo-bin --test-tags=my_module -d testdb -u my_module
# odoo-bin --test-tags=-slow -d testdb -u my_module
\`\`\`

## Mocking
\`\`\`python
from unittest.mock import patch, MagicMock

def test_external_api(self):
    """Mock external API call."""
    with patch('odoo.addons.my_module.models.my_model.requests.get') as mock_get:
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {'result': 'ok'},
        )
        result = self.record.call_external_api()
        self.assertEqual(result, 'ok')
        mock_get.assert_called_once()

def test_with_freeze_time(self):
    """Mock date/time."""
    with patch('odoo.fields.Date.today', return_value=date(2024, 1, 15)):
        self.record.action_set_date()
        self.assertEqual(self.record.date, date(2024, 1, 15))
\`\`\`

## Running Tests
\`\`\`bash
# All tests for a module
./odoo-bin -d testdb -u my_module --test-enable --stop-after-init

# Specific test file
./odoo-bin -d testdb -u my_module --test-tags=my_module --stop-after-init

# With logging
./odoo-bin -d testdb -u my_module --test-enable --stop-after-init --log-level=test

# Using pytest (with pytest-odoo)
pytest addons/my_module/tests/ --odoo-database=testdb
\`\`\`

## Best Practices
1. Use \`setUpClass\` for shared test data (faster than setUp)
2. Tag tests with \`post_install\` for tests that need full DB
3. Always test with non-admin user for security verification
4. Use \`Form\` helper to test onchange/compute in the same way UI does
5. Mock external services — never call real APIs in tests
6. Keep tests independent — don't rely on execution order
`,
}
