export const PERMISSIONS_MAP: Record<string, string | null> = {
  'POST /auth/login':   null,
  'POST /auth/register':null,
  'GET /users':         'users:manage',
  'GET /users/me':      null,
  'PATCH /users/:id':   'users:manage',
  'GET /tickets':       null,
  'POST /tickets':      'tickets:add',
  'PUT /tickets/:id':   'tickets:add',
  'DELETE /tickets/:id':'tickets:add',
  'PATCH /tickets/:id/status': 'tickets:move',
  'GET /groups':        null,
  'POST /groups':       'groups:manage',
  'PUT /groups/:id':    'groups:manage',
  'DELETE /groups/:id': 'groups:manage',
  'POST /groups/:id/members':          'groups:manage',
  'DELETE /groups/:id/members/:userId':'groups:manage',
  'GET /groups/:id/permissions':       null,
  'PUT /groups/:id/users/:userId/permissions': 'groups:manage',
};

export const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];
