import { NextApiRequest, NextApiResponse } from 'next';

export function verifyAuth(request: NextApiRequest, response: NextApiResponse) {
  const basicAuth = request.headers.authorization;
  if (!basicAuth) {
    return response.status(405).json({
      error: 'Missing auth secret',
    });
  }
  const auth = basicAuth.split(' ')[1];
  const [_user, secret] = Buffer.from(auth, 'base64').toString().split(':');
  if (process.env.CONFIG_CRUD_SECRET !== secret) {
    return response.status(405).json({
      error: 'Invalid auth secret',
    });
  }
  return null;
}
