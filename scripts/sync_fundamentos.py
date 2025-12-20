#!/usr/bin/env python3
"""
Sync fundamentos.json with fundamentos_ptJp.json
Copies title_ja and content_ja from ptJp to fundamentos.json
"""
import json

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    # Load both files
    ptjp_data = load_json('data/fundamentos_ptJp.json')
    fund_data = load_json('data/fundamentos.json')
    
    # Create a map of ptJp data by ID
    ptjp_map = {item['id']: item for item in ptjp_data}
    
    updated_count = 0
    
    for item in fund_data:
        item_id = item.get('id')
        if item_id in ptjp_map:
            ptjp_item = ptjp_map[item_id]
            
            # Check if we need to update
            needs_update = False
            
            if ptjp_item.get('title_ja') and item.get('title_ja') != ptjp_item.get('title_ja'):
                item['title_ja'] = ptjp_item['title_ja']
                needs_update = True
                
            if ptjp_item.get('content_ja') and item.get('content_ja') != ptjp_item.get('content_ja'):
                item['content_ja'] = ptjp_item['content_ja']
                needs_update = True
            
            if needs_update:
                updated_count += 1
                print(f"Updated {item_id}: {item.get('title', 'Unknown')}")
    
    # Save updated fundamentos.json
    save_json('data/fundamentos.json', fund_data)
    
    # Stats
    fund_ja_count = sum(1 for item in fund_data if item.get('content_ja'))
    ptjp_ja_count = sum(1 for item in ptjp_data if item.get('content_ja'))
    
    print(f"\n✓ Sync complete!")
    print(f"  - Updated {updated_count} items")
    print(f"  - fundamentos.json now has {fund_ja_count}/{len(fund_data)} items with content_ja")
    print(f"  - fundamentos_ptJp.json has {ptjp_ja_count}/{len(ptjp_data)} items with content_ja")

if __name__ == "__main__":
    main()
