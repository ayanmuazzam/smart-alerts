/** Require Authorization from httpClient.fetchWithAuth before any auth.elevate. */
export function requireDashboardAuth(request: Request): Response | null {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
