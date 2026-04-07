import type { BuiltinSkill } from "../types"

export const odooApiIntegrationSkill: BuiltinSkill = {
  name: "odoo-api-integration",
  description: "Odoo external API — XML-RPC, JSON-RPC, REST controllers, webhook patterns, authentication",
  template: `# Odoo API & Integration Expert

You help build integrations with Odoo using its API and external connectors.

## JSON-RPC (Primary API)
\`\`\`python
import requests
import json

url = "https://your-odoo.com"
db = "mydb"
username = "admin"
password = "admin"

# Authenticate
def jsonrpc(url, method, params):
    data = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    resp = requests.post(url, json=data)
    return resp.json().get('result')

# Login
uid = jsonrpc(f"{url}/web/session/authenticate", "call", {
    "db": db, "login": username, "password": password,
})

# Search and read
partners = jsonrpc(f"{url}/web/dataset/call_kw", "call", {
    "model": "res.partner",
    "method": "search_read",
    "args": [[("is_company", "=", True)]],
    "kwargs": {"fields": ["name", "email"], "limit": 10},
})

# Create
new_id = jsonrpc(f"{url}/web/dataset/call_kw", "call", {
    "model": "res.partner",
    "method": "create",
    "args": [{"name": "New Partner", "email": "new@example.com"}],
    "kwargs": {},
})
\`\`\`

## XML-RPC (Legacy but stable)
\`\`\`python
import xmlrpc.client

url = "https://your-odoo.com"
db = "mydb"

# Authentication
common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, 'admin', 'admin', {})

# Object endpoint
models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

# Search
partner_ids = models.execute_kw(db, uid, 'admin',
    'res.partner', 'search',
    [[('is_company', '=', True)]],
    {'limit': 10})

# Read
partners = models.execute_kw(db, uid, 'admin',
    'res.partner', 'read',
    [partner_ids],
    {'fields': ['name', 'email']})

# Create
new_id = models.execute_kw(db, uid, 'admin',
    'res.partner', 'create',
    [{'name': 'New Partner'}])

# Write
models.execute_kw(db, uid, 'admin',
    'res.partner', 'write',
    [[new_id], {'email': 'updated@example.com'}])
\`\`\`

## Custom REST Controllers
\`\`\`python
from odoo import http
from odoo.http import request, Response
import json

class MyApiController(http.Controller):

    @http.route('/api/v1/records', type='json', auth='api_key', methods=['GET'])
    def get_records(self, **kwargs):
        records = request.env['my.model'].search_read(
            [], fields=['name', 'state'], limit=100
        )
        return {'status': 'ok', 'data': records}

    @http.route('/api/v1/records', type='json', auth='api_key', methods=['POST'])
    def create_record(self, **kwargs):
        data = request.jsonrequest
        record = request.env['my.model'].create({
            'name': data.get('name'),
        })
        return {'status': 'ok', 'id': record.id}

    @http.route('/api/v1/records/<int:record_id>', type='http',
                auth='api_key', methods=['GET'], csrf=False)
    def get_record(self, record_id, **kwargs):
        record = request.env['my.model'].browse(record_id)
        if not record.exists():
            return Response(json.dumps({'error': 'Not found'}),
                          status=404, content_type='application/json')
        data = record.read(['name', 'state'])[0]
        return Response(json.dumps(data), content_type='application/json')
\`\`\`

## Webhook Pattern
\`\`\`python
class WebhookController(http.Controller):

    @http.route('/webhook/payment', type='json', auth='public',
                methods=['POST'], csrf=False)
    def payment_webhook(self, **kwargs):
        data = request.jsonrequest
        # Verify webhook signature
        signature = request.httprequest.headers.get('X-Signature')
        if not self._verify_signature(data, signature):
            return {'status': 'error', 'message': 'Invalid signature'}

        # Process asynchronously
        request.env['payment.webhook'].sudo().create({
            'payload': json.dumps(data),
            'status': 'pending',
        })
        return {'status': 'ok'}
\`\`\`

## API Key Authentication (Odoo 14+)
\`\`\`python
# In Odoo: Settings → Technical → API Keys → Generate
# Send in header: Authorization: Bearer <api_key>

# Controller with auth='api_key'
@http.route('/api/data', type='json', auth='api_key')
def get_data(self):
    user = request.env.user  # authenticated via API key
    return {'user': user.name}
\`\`\`

## Best Practices
- Use JSON-RPC for modern integrations, XML-RPC for legacy compatibility
- Always use API keys instead of password auth for external systems
- Rate-limit webhook endpoints to prevent abuse
- Log all external API calls for debugging
- Use \`sudo()\` cautiously in API controllers — validate permissions first
- Return proper HTTP status codes from REST endpoints
`,
}
