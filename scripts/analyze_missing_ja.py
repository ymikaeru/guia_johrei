import json

def analyze():
    with open('data/fundamentos_ptJp.json', 'r') as f:
        data = json.load(f)
    
    total = len(data)
    missing_ja = 0
    sources = {}

    for item in data:
        if not item.get('content_ja'):
            missing_ja += 1
            src = item.get('source', 'Unknown')
            sources[src] = sources.get(src, 0) + 1
        else:
            # Check for potential issues (e.g. very short content)
            if len(item['content_ja']) < 10:
                print(f"Warning: Short Japanese content for {item['id']}: {item['content_ja']}")

    print(f"Total items: {total}")
    print(f"Items missing content_ja: {missing_ja}")
    print("\nMissing by source:")
    for src, count in sources.items():
        print(f"  {src}: {count}")

if __name__ == "__main__":
    analyze()
