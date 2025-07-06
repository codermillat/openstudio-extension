# OpenStudio - YouTube SEO & Channel Optimization Tool

![Version](https://img.shields.io/badge/version-1.0.2--enterprise-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-red.svg)

## 🎯 Overview

**OpenStudio** is an open-source, local-only Chrome Extension that enhances YouTube Studio with advanced SEO, analytics, and channel optimization features. All processing happens on the client side with no external servers or data collection.

## ✨ Features

### 🎥 Video SEO Optimization
- **Real-time SEO scoring** - Advanced algorithm that analyzes titles, descriptions, and tags
- **AI-powered tag recommendations** - Smart suggestions via Google Gemini AI
- **Title optimization** - AI-generated compelling titles for better CTR
- **Description enhancement** - Automated description improvements with keywords
- **Keyword analysis** - Trending keyword identification and optimization
- **One-click metadata application** - Seamless integration with YouTube Studio
- **SEO score tracking** - Historical performance monitoring

### 📊 Advanced Analytics & Insights  
- **Enhanced dashboard** - Extended YouTube Studio with additional metrics
- **Performance alerts** - Notifications for underperforming content
- **Audience analytics** - Detailed demographics and engagement insights
- **Watch time optimization** - Analysis and suggestions for better retention
- **CTR improvement tools** - Thumbnail and title testing recommendations
- **Revenue tracking** - Enhanced monetization analytics
- **Competitor analysis** - Benchmarking against similar channels

### 🧠 AI-Powered Content Assistance
- **Content idea generator** - Daily suggestions based on trends and performance
- **Google Trends integration** - Real-time topic discovery and analysis
- **Smart content planning** - AI-driven content calendar suggestions
- **Thumbnail concept generator** - Creative ideas for better visual appeal
- **Script optimization** - AI analysis for better engagement
- **Trend prediction** - Early identification of emerging topics

### ⚙️ Automation & Workflow Tools
- **Bulk operations** - Mass editing of tags, descriptions, and metadata
- **Template system** - Reusable templates for consistent branding
- **Upload checklist** - Comprehensive pre-upload optimization guide
- **Batch SEO optimization** - Apply improvements across multiple videos
- **Custom workflows** - Personalized optimization processes
- **Export/import tools** - Backup and restore your optimization settings

## 🚀 Installation

### From Source (Development)

1. **Clone or download** this repository
   ```bash
   git clone https://github.com/openstudio-extension/openstudio.git
   cd openstudio
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the extension**
   - Click "Load unpacked"
   - Select the OpenStudio folder
   - The extension should now appear in your extensions list

4. **Configure API keys**
   - Click the OpenStudio icon in your browser toolbar
   - Go to Settings
   - Add your YouTube Data API key and Google Gemini API key

### Getting API Keys

#### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Restrict the key to YouTube Data API for security

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key for use in OpenStudio

## 🎮 Usage

### Getting Started

1. **Open YouTube Studio** - Navigate to [studio.youtube.com](https://studio.youtube.com)
2. **Access SEO Tools** - The OpenStudio panel will automatically appear on video edit pages
3. **Configure Settings** - Click the extension icon and go to Settings to customize features
4. **Start Optimizing** - Use the SEO assistant to analyze and improve your video metadata

### Key Features Walkthrough

#### SEO Assistant Panel
- Automatically appears when editing videos in YouTube Studio
- Provides real-time SEO scoring based on title, description, and tags
- Offers specific suggestions for improvement
- Shows keyword analysis and optimization opportunities

#### AI-Powered Enhancements
- **Generate Tags**: Click to get AI-suggested tags based on your content
- **Optimize Title**: Get title variations optimized for search and engagement
- **Enhance Description**: Improve your description with AI assistance
- **Content Ideas**: Generate video ideas based on trends and your channel's performance

#### Analytics Integration
- Monitor your channel's performance directly within YouTube Studio
- Track key metrics and identify optimization opportunities
- Get alerts for videos that need attention
- Export analytics data for further analysis

## 🛠️ Development

### Project Structure

```
openstudio/
├── manifest.json                    # Extension manifest
├── public/
│   ├── popup.html                  # Extension popup interface
│   └── icon128.png                 # Extension icon
├── src/
│   ├── background/
│   │   └── service_worker.js       # Background script
│   ├── content_scripts/
│   │   ├── injectStudioUI.js       # YouTube Studio UI injection
│   │   └── scrapeAnalytics.js      # Analytics data extraction
│   ├── popup/
│   │   └── popup.js                # Popup interface logic
│   ├── settings/
│   │   ├── options.html            # Settings page
│   │   └── options.js              # Settings logic
│   ├── components/
│   │   └── SEOAssistantPanel.js    # SEO panel component
│   └── utils/
│       ├── storage.js              # Storage management
│       ├── seoScorer.js            # SEO analysis engine
│       ├── youtubeAPI.js           # YouTube API integration
│       └── gptHelper.js            # AI integration
├── docs/
│   ├── development-rules.md        # Development guidelines
│   └── publish-checklist.md        # Publishing checklist
└── status/
    └── DEV_STATUS.md               # Development progress
```

### Building and Testing

1. **Load in Development Mode**
   ```bash
   # Open Chrome Extensions page
   chrome://extensions/
   
   # Enable Developer mode and load unpacked
   ```

2. **Test on YouTube Studio**
   - Navigate to YouTube Studio
   - Edit a video to see the SEO assistant panel
   - Test all features with your API keys configured

3. **Debug Issues**
   - Open Chrome DevTools
   - Check the Console and Network tabs
   - Review extension logs in `chrome://extensions/`

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow development guidelines** in `docs/development-rules.md`
4. **Test thoroughly** on YouTube Studio
5. **Update documentation** as needed
6. **Submit a pull request**

## 📋 Requirements

- **Chrome Browser** version 88+ (Manifest V3 support)
- **YouTube Data API key** for analytics and video data
- **Google Gemini API key** for AI-powered features
- **Active YouTube channel** for full functionality

## 🛡️ Privacy & Security

OpenStudio is designed with privacy as a top priority:
- No data is sent to external servers
- All processing happens on your device
- Uses only your own API credentials
- No tracking or analytics collection

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our development guidelines in `docs/development-rules.md` before contributing.

## 📞 Support & Community

### 🆘 Getting Help

- **GitHub Issues**: [Report bugs and request features](https://github.com/openstudio-extension/openstudio/issues)
- **Documentation**: Complete guides in the `/docs` folder
- **FAQ**: Common questions and solutions in our Wiki
- **Community Forum**: Join discussions with other creators

### 🐛 Bug Reports

When reporting issues, please include:
- Chrome browser version
- Extension version
- Detailed steps to reproduce
- Screenshots or screen recordings
- Console error messages (if any)

### 💡 Feature Requests

We welcome suggestions for new features! Please use our GitHub Issues with the "enhancement" label.

### 🤝 Contributing

Contributions are welcome! Please read our development guidelines in `docs/development-rules.md` before contributing.

### 📧 Contact

- **Email**: support@openstudio-extension.com
- **Twitter**: @OpenStudioExt
- **Discord**: Join our creator community

---

**Made with ❤️ for YouTube creators worldwide**
