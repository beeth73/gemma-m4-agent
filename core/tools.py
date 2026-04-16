from duckduckgo_search import DDGS

def search_web(query, max_results=3):
    """Fetches web context *before* inference to prevent looping."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            
        if not results:
            return ""
            
        formatted = "--- RECENT INTERNET SEARCH CONTEXT ---\n"
        for r in results:
            formatted += f"Source: {r.get('href')}\nSnippet: {r.get('body')}\n\n"
        return formatted
    except Exception as e:
        print(f"[Tools] Web search failed: {e}")
        return ""