# 📝 Voice-Activated Teleprompter App

A modern, mobile-friendly teleprompter application with speech recognition that automatically scrolls as you speak. Perfect for recording poetry videos, presentations, or any content where you need to read from a script.

## ✨ Features

- **📱 Mobile-Friendly**: Optimized for iPhone and mobile devices
- **🎤 Voice-Activated Scrolling**: Uses speech recognition to automatically scroll the script as you speak
- **📄 Flexible Input**: Write your script directly or upload a text file
- **⚙️ Customizable Settings**: 
  - Adjustable font size (Small, Medium, Large, Extra Large)
  - Scroll sensitivity controls (Low, Medium, High)
- **🎯 Real-Time Feedback**: See what the app is hearing and responding to
- **📱 Fullscreen Mode**: Distraction-free reading experience
- **💾 No Installation Required**: Works directly in your web browser

## 🚀 Getting Started

### Quick Start

1. Open `index.html` in a modern web browser (Chrome, Safari, or Edge recommended)
2. Write or paste your script, or upload a text file
3. Adjust font size and scroll sensitivity to your preference
4. Tap "Start Teleprompter"
5. Tap "Start Voice" to begin speech recognition
6. Start speaking your script - the teleprompter will scroll automatically!

### Using on iPhone

1. Open Safari on your iPhone
2. Navigate to the app (you can host it on any web server or open the local file)
3. For best experience, add to Home Screen:
   - Tap the Share button
   - Select "Add to Home Screen"
   - The app will launch in fullscreen mode like a native app

## 📋 How to Use

### Writing Your Script

1. Select the "Write Script" tab
2. Type or paste your script into the text area
3. The script can include line breaks and paragraphs

### Uploading a Script

1. Select the "Upload File" tab
2. Click the upload area
3. Select a `.txt` file from your device
4. The script will be loaded automatically

### Recording Your Content

1. Once in teleprompter mode, position your camera
2. Tap "Start Voice" to begin speech recognition
3. Speak naturally - the app will recognize your words and scroll accordingly
4. Use "Pause" if you need to take a break
5. Tap "Exit" when finished

## 🔧 Technical Details

### Browser Compatibility

The app uses the Web Speech API for speech recognition. Supported browsers include:

- ✅ **Chrome/Edge**: Full support on desktop and mobile
- ✅ **Safari (iOS 14.5+)**: Full support on iPhone and iPad
- ⚠️ **Firefox**: Limited speech recognition support
- ❌ **IE**: Not supported

### Speech Recognition

The app uses continuous speech recognition with these features:

- **Smart Matching**: Matches spoken words to your script intelligently
- **Context-Aware**: Considers word sequences for better accuracy
- **Adjustable Sensitivity**: Control how aggressively the app scrolls
- **Real-Time Processing**: Instant response to your speech

### Privacy

- All speech recognition happens in your browser
- No audio or scripts are sent to external servers
- No data is stored or tracked

## 🎨 Customization

### Font Size Options

- **Small (24px)**: For longer scripts
- **Medium (32px)**: Balanced readability
- **Large (42px)**: Default, ideal for most uses
- **Extra Large (52px)**: Maximum readability

### Scroll Sensitivity

- **Low**: Slower, more conservative scrolling
- **Medium**: Balanced scrolling (default)
- **High**: Aggressive scrolling for fast speakers

## 💡 Tips for Best Results

1. **Speak Clearly**: Enunciate words for better recognition
2. **Natural Pace**: Speak at your normal pace - the app adapts
3. **Quiet Environment**: Reduce background noise for better accuracy
4. **Test First**: Do a quick test run before recording
5. **Adjust Settings**: Experiment with font size and scroll sensitivity
6. **Keep Screen Active**: The app requests wake lock to keep your screen on

## 🛠️ Development

### Project Structure

```
teleprompter_app/
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── script.js       # Core functionality and speech recognition
└── README.md       # Documentation
```

### Local Development

Simply open `index.html` in a web browser. No build process required!

### Hosting

To make the app accessible on your iPhone:

1. **Option 1**: Use GitHub Pages
   - Push to a GitHub repository
   - Enable GitHub Pages in repository settings
   - Access via the provided URL

2. **Option 2**: Use a local server
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js
   npx http-server
   ```

3. **Option 3**: Deploy to services like Netlify, Vercel, or Cloudflare Pages

## 📝 Example Script Format

```
Hello everyone, welcome to my poetry channel.

Today I'll be sharing my latest piece about nature.

The sun rises over the mountains,
Painting the sky in shades of gold,
Each ray a promise of new beginnings,
Stories waiting to be told.

Thank you for watching!
```

## ⚠️ Troubleshooting

**Speech recognition not working?**
- Ensure microphone permissions are granted
- Check if using a supported browser
- Verify microphone is working in other apps

**Scrolling too fast/slow?**
- Adjust the scroll sensitivity setting
- Try different font sizes
- Speak at a consistent pace

**App not loading?**
- Ensure JavaScript is enabled
- Try a different browser
- Check browser console for errors

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💬 Support

For issues or questions, please open an issue on the GitHub repository.

---

Made with ❤️ for content creators and poets everywhere
