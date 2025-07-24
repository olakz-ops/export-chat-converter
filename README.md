# WhatsApp Chat Converter

A local web application that converts exported WhatsApp chats with media files into clean, readable HTML documents with audio transcriptions.

## Features

- 📝 Parse WhatsApp chat exports (_chat.txt files)
- 🎵 Transcribe audio messages using OpenAI Whisper
- 🧹 Clean system messages (deleted messages, missed calls, etc.)
- 🔗 Merge consecutive messages from the same sender
- 💾 Export as styled HTML with Tailwind CSS
- 🔐 Completely local - no server required

## Setup

1. **Clone or download this project**

2. **Set up your API key (optional but recommended):**
   ```bash
   # Copy the example config
   cp js/config.example.js js/config.local.js
   
   # Edit js/config.local.js and add your OpenAI API key
   ```

3. **Open the application:**
   - Simply open `index.html` in your web browser
   - No server or build process required!

## Usage

1. **Export your WhatsApp chat:**
   - In WhatsApp, go to the chat you want to export
   - Click ⋮ (menu) → More → Export chat → Include media
   - You'll get a ZIP file with `_chat.txt` and media files

2. **Process the chat:**
   - Open `index.html` in your browser
   - Upload the `_chat.txt` file and all media files (don't upload the ZIP)
   - If you didn't set up `config.local.js`, enter your OpenAI API key
   - Click "עבד קבצים" (Process Files)

3. **Review and download:**
   - Preview the processed chat
   - Edit transcriptions if needed
   - Download the final HTML file

## Configuration

Create `js/config.local.js` (this file is git-ignored):

```javascript
export const config = {
    OPENAI_API_KEY: 'sk-your-api-key-here',
    defaultSettings: {
        cleanMessages: true,
        mergeMessages: false
    }
};
```

## File Structure

```
├── index.html          # Main application
├── js/
│   ├── main.js        # Application entry point
│   ├── config.example.js # Example configuration
│   ├── core/          # Business logic
│   ├── utils/         # Utilities
│   ├── ui/            # UI management
│   └── api/           # API integrations
└── README.md          # This file
```

## Privacy

- All processing happens locally in your browser
- No data is sent to any server (except OpenAI for transcription)
- Your API key is never shared or logged

## Requirements

- Modern web browser with ES6 module support
- OpenAI API key for audio transcription
- WhatsApp chat export with media files