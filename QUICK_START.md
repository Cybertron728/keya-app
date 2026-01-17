# HR Helper App - Quick Start Guide

## ✅ Installation Complete!

Your HR Helper application is now set up and ready to use.

## 🚀 How to Run the Application

### Option 1: Using npm
```bash
npm start
```

### Option 2: Using the batch file (Windows)
Double-click `start.bat` in the project folder

### Option 3: Using the development command
```bash
npm run dev
```

## 📦 Building Standalone Executables

To create a distributable application:

### For Windows (.exe)
```bash
npm run build:win
```
The installer will be created in the `dist` folder.

### For macOS (.dmg)
```bash
npm run build:mac
```

### For Linux (.AppImage)
```bash
npm run build:linux
```

## 🔧 Pre-configured Settings

✅ **Webhook URL**: Already configured and ready to use
- The Google Apps Script webhook is pre-set in the application
- You can view/change it in Settings if needed

✅ **Default Position**: SOUS CHEF
✅ **Email Template**: Professional interview invitation template included

## 📋 How to Use

### Step 1: Upload CVs
1. Click "Upload CV PDFs" button
2. Select one or multiple PDF resumes
3. The app will automatically extract email addresses

### Step 2: Review Candidates
1. Check the extracted information
2. Click on email addresses to edit if needed
3. Verify interview times and positions

### Step 3: Schedule Interviews
1. Set default date, time, and position in the top panel
2. Use the "Schedule" button to auto-distribute interview slots
3. Edit individual times by clicking on them

### Step 4: Customize Email Template
1. Click "Email Template Message" to expand
2. Edit the template using these variables:
   - `{greeting}` - Auto-generated (Good morning/afternoon/evening)
   - `{name}` - Candidate's name
   - `{position}` - Interview position
   - `{date}` - Interview date (formatted)
   - `{time}` - Interview time (12-hour format)

### Step 5: Send Invitations
1. Select candidates (or leave all selected for everyone)
2. Click "Launch Batch" button
3. Review the safety modal
4. Click "Launch Emails" to send

## 🎯 Features

### Smart Email Extraction
- Reads PDF metadata
- Scans text content
- Falls back to OCR if needed
- Handles multiple pages

### Bulk Operations
- Select multiple candidates
- Bulk edit positions and times
- Group sending by position
- Progress tracking

### Capacity Management
- Set max candidates per time slot
- Visual timeline showing slot usage
- Auto-scheduling with capacity limits
- Color-coded warnings for overcrowded slots

### Two Sending Methods

**Webhook Mode** (Default - Pre-configured)
- Sends via Google Apps Script
- Automatic delivery
- No user interaction needed
- Status shows as "assumed" (no-cors limitation)

**Mailto Mode**
- Opens your default email client
- Full control over each email
- Can edit before sending
- Requires manual sending

## 💡 Tips

1. **Test First**: Try with 1-2 candidates before bulk sending
2. **Check Emails**: Always verify extracted email addresses
3. **Customize Template**: Personalize the message for your needs
4. **Use Scheduling**: Auto-schedule feature saves time
5. **Save Settings**: Webhook URL and preferences are saved automatically

## 🔒 Data Privacy

- All data is stored locally on your computer
- No external databases
- Uses browser LocalStorage
- Clear data by resetting the app

## 🛠️ Troubleshooting

### App won't start
- Make sure Node.js is installed
- Run `npm install` again
- Check for error messages in terminal

### Emails not extracting
- Ensure PDFs are text-based (not scanned images)
- Try the OCR feature for image-based PDFs
- Manually enter emails if needed

### Webhook not working
- Verify the webhook URL in Settings
- Check your internet connection
- Ensure Google Apps Script is deployed correctly

### Build fails
- Update electron-builder: `npm install electron-builder@latest --save-dev`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## 📞 Support

For issues or questions:
1. Check the README.md file
2. Review this guide
3. Contact your IT administrator

## 🎨 Customization

You can customize:
- Email templates
- Default positions
- Time slots
- Capacity limits
- Subject lines
- Webhook URL

All settings are accessible through the Settings panel (gear icon).

---

**Version**: 1.0.0  
**Built with**: Electron, React, PDF.js, Tesseract.js  
**For**: Bakerist Restaurant DHM
