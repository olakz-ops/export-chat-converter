#!/usr/bin/env python3
"""
Development server for WhatsApp Chat Converter
Serves files with cache-busting headers to prevent browser caching during development
"""

import http.server
import socketserver
import sys
import os
from urllib.parse import urlparse, unquote

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache-busting headers for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def guess_type(self, path):
        """Override to set proper MIME types for JS modules"""
        mimetype, encoding = super().guess_type(path)
        
        # Ensure JS files are served with correct MIME type for ES6 modules
        if path.endswith('.js'):
            return 'application/javascript', encoding
        
        return mimetype, encoding

def run_server(port=8000):
    """Run the development server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
        print(f"🚀 Development server running on port {port}")
        print(f"📂 Serving from: {os.getcwd()}")
        print(f"🌐 Open: http://localhost:{port}")
        print("🔧 Cache disabled for development")
        print("⏹️  Stop with: Ctrl+C")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)