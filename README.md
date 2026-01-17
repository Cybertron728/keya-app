# HR Helper - Bakerist Restaurant DHM

A desktop application for managing recruitment and sending interview invitations via email.

## Features

- 📄 **PDF CV Scanning**: Automatically extract email addresses from PDF resumes
- 📧 **Bulk Email Sending**: Send interview invitations to multiple candidates
- 📅 **Smart Scheduling**: Auto-schedule interviews with capacity management
- 🎨 **Custom Templates**: Personalize email templates with dynamic fields
- 🔒 **Pre-configured**: Webhook URL is built-in for immediate use
- 💾 **Local Storage**: All data persists locally

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm start
```

## Building for Distribution

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

The built application will be in the `dist` folder.

## Usage

1. **Upload CVs**: Click "Upload CV PDFs" to add candidate resumes
2. **Review Data**: Check extracted emails and edit if needed
3. **Set Schedule**: Configure interview date, time, and position
4. **Customize Template**: Edit the email template as needed
5. **Launch**: Click "Launch Batch" to send invitations

## Template Variables

Use these variables in your email template:
- `{greeting}` - Auto-generated based on time of day
- `{name}` - Candidate's name
- `{position}` - Interview position
- `{date}` - Interview date
- `{time}` - Interview time

## Configuration

The webhook URL is pre-configured in the application. You can change it in Settings if needed.

### Send Methods
- **Webhook**: Sends emails via Google Apps Script (pre-configured)
- **Mailto**: Opens default email client for each candidate

## Technical Details

- Built with Electron
- React 18 for UI
- PDF.js for PDF parsing
- Tesseract.js for OCR fallback
- LocalStorage for data persistence

## License

MIT

## Author

Bakerist Restaurant DHM
