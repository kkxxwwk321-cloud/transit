# Test server for D:\06_codex\transit\dist on 127.0.0.1:<port> (default 8791). Threaded, deep listen queue,
# no caching, so a page with 30+ scripts never loses one to a refused connection.
import functools, http.server, sys
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
root = sys.argv[2] if len(sys.argv) > 2 else r'D:\06_codex\transit\dist'
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 128; daemon_threads = True
S(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
