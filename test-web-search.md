# Web Search Test Documentation

## Testing Improved Multi-Engine Web Search

The web_search tool now uses a tiered approach with multiple search engines for the most reliable results:

### Search Engine Priority:
1. **Brave Search API** (Primary) - Free tier with 5,000 queries/month
2. **DuckDuckGo Instant Answer API** (Fallback) - For factual queries
3. **Wikipedia API** (Final fallback) - For encyclopedic content

### Test Queries to Try:
1. "Google's birthday" - Should return founding date and company info
2. "latest news technology" - Should return current tech news
3. "TypeScript programming language" - Should return comprehensive info
4. "current weather New York" - Should return weather information
5. "stock price Apple" - Should return current stock information

### Expected Behavior:
- **Primary**: Brave Search provides fresh web results with titles, descriptions, and URLs
- **Fallback**: DuckDuckGo instant answers for factual queries
- **Final**: Wikipedia for general knowledge topics
- **Error handling**: Clear messages when all services are unavailable

### Implementation Benefits:
- ✅ Real web search results (not just Wikipedia)
- ✅ Current information and news
- ✅ Multiple fallback options for reliability
- ✅ Free tier usage (5,000 Brave queries/month)
- ✅ Comprehensive error handling

### How to Test in LM Studio:
1. Load the Qwen Coder Tools plugin 
2. Ask: "Can you search for the latest news about artificial intelligence?"
3. The model should use web_search tool and return current web results
4. Try different types of queries to test all search engines
