# Brave Search API Key Setup Guide

## How to Add Your Brave API Key to the Plugin

### Step 1: Access Plugin Settings in LM Studio
1. Open LM Studio
2. Navigate to **Settings** or **Plugins** section
3. Find **"Qwen Coder Tools"** plugin
4. Click on plugin settings/configuration

### Step 2: Configure the API Key
1. Look for the **"Brave Search API Key"** field
2. Paste your Brave API key into the text field
3. Save the settings

### Step 3: Enable Web Search
1. Make sure **"Enable Web Search"** is set to `true`
2. Save all plugin settings

## Benefits of Using Your API Key

### Free Tier (No API Key)
- ❌ Limited to 5,000 queries/month
- ❌ 1 query per second rate limit
- ❌ Basic search results

### With Your API Key
- ✅ **Higher rate limits** based on your plan
- ✅ **Enhanced search quality** and freshness
- ✅ **Priority access** to Brave Search
- ✅ **Detailed error messages** for troubleshooting

## Troubleshooting

### Error Messages
- **"Brave Search API key invalid or expired"** → Check if your API key is correct
- **"Brave Search rate limit exceeded"** → Consider upgrading your Brave API plan
- **"Brave Search unavailable (check API key)"** → Verify your API key in settings

### Testing Your Setup
1. Enable web search and add your API key
2. Ask your model: *"Search for the latest technology news"*
3. You should see the status message: *"Using Brave Search with API key for: latest technology news"*
4. Results should be fresher and more comprehensive

## API Key Security
- Your API key is stored securely in LM Studio's plugin configuration
- It's only used for Brave Search API calls
- Never shared or logged in plain text
- Falls back to free tier if API key fails

## Getting More Queries
If you need more than your current plan allows:
1. Visit [Brave Search API pricing](https://brave.com/search/api/)
2. Upgrade to a higher tier
3. Your new limits will be active immediately

---

**Note**: The plugin works perfectly without an API key using the free tier (5,000 queries/month). Adding your API key just unlocks better performance and higher limits!
