import handler from './[...path].js';

export default function index(req: any, res: any) {
  const url = new URL(req.url || '/', 'https://local.test');
  const path = url.searchParams.get('path') || '';
  const nextParams = new URLSearchParams(url.search);
  nextParams.delete('path');
  const qs = nextParams.toString();
  req.url = `/api/${path}${qs ? `?${qs}` : ''}`;
  return handler(req, res);
}
