export default function handler(_req: any, res: any) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ status: 'error', message: 'Route not found' }));
}
