# Claude Instructions for WhatsApp Chat Converter

## Development Server

To restart the development server (kills existing, cleans up, and starts fresh):

```bash
./restart-server.sh
```

- Default port: 8000
- Custom port: `./restart-server.sh 8001`
- Always run this script when code changes need to be reflected
- Server URL: http://localhost:8000

## Project Structure

- `index.html` - Main application entry point
- `js/` - Modular JavaScript code (ES6 modules)
- `js/config.local.js` - Local config with API key (git-ignored)
- `restart-server.sh` - Server management script

## Notes

- The app requires a local HTTP server due to ES6 module CORS restrictions
- API key is loaded from `js/config.local.js`
- All processing happens client-side (no backend needed)