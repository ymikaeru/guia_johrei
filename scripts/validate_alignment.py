#!/usr/bin/env python3
"""
Validation script to verify paragraph alignment between PT and JA content
"""
import json
import glob
import os

def count_paragraphs(text):
    """Count paragraphs in text"""
    if not text:
        return 0
    # Split by double newlines (markdown paragraphs)
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    return len(paragraphs)

def validate_file(fpath):
    """Validate a single JSON file"""
    fname = os.path.basename(fpath)
    
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not isinstance(data, list):
        return None
    
    results = {
        'file': fname,
        'total': len(data),
        'with_ja': 0,
        'aligned': 0,
        'misaligned': 0,
        'missing_ja': 0,
        'misaligned_items': []
    }
    
    for item in data:
        content_pt = item.get('content') or item.get('content_pt') or ''
        content_ja = item.get('content_ja') or ''
        
        if content_ja:
            results['with_ja'] += 1
            
            # Count paragraphs
            pt_para = count_paragraphs(content_pt)
            ja_para = count_paragraphs(content_ja)
            
            # Check alignment (allow 10% difference)
            if pt_para == 0 or ja_para == 0:
                results['misaligned'] += 1
                results['misaligned_items'].append({
                    'id': item.get('id'),
                    'title': item.get('title') or item.get('title_pt'),
                    'pt_para': pt_para,
                    'ja_para': ja_para
                })
            elif abs(pt_para - ja_para) / max(pt_para, ja_para) > 0.1:
                results['misaligned'] += 1
                results['misaligned_items'].append({
                    'id': item.get('id'),
                    'title': item.get('title') or item.get('title_pt'),
                    'pt_para': pt_para,
                    'ja_para': ja_para
                })
            else:
                results['aligned'] += 1
        else:
            results['missing_ja'] += 1
    
    return results

def main():
    data_dir = 'data'
    
    all_results = []
    total_aligned = 0
    total_misaligned = 0
    total_with_ja = 0
    total_items = 0
    
    print("=" * 80)
    print("PARAGRAPH ALIGNMENT VALIDATION")
    print("=" * 80)
    
    for fpath in sorted(glob.glob(os.path.join(data_dir, '*.json'))):
        if 'backup' in fpath or 'aligned' in fpath or 'rebuilt' in fpath:
            continue
        fname = os.path.basename(fpath)
        if fname in ['index.json', 'index_ja.json', 'pontos_focais_ja.json', 'teachings_ja_raw.json']:
            continue
        
        results = validate_file(fpath)
        if results is None:
            continue
        
        all_results.append(results)
        total_aligned += results['aligned']
        total_misaligned += results['misaligned']
        total_with_ja += results['with_ja']
        total_items += results['total']
        
        if results['with_ja'] > 0:
            alignment_rate = results['aligned'] / results['with_ja'] * 100
            print(f"\n{fname}")
            print(f"  Total items: {results['total']}")
            print(f"  With JA: {results['with_ja']}")
            print(f"  Aligned: {results['aligned']} ({alignment_rate:.1f}%)")
            if results['misaligned'] > 0:
                print(f"  ⚠️  Misaligned: {results['misaligned']}")
                # Show first 3 misaligned items
                for item in results['misaligned_items'][:3]:
                    print(f"     - {item['id']}: PT={item['pt_para']} JA={item['ja_para']}")
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total items: {total_items}")
    print(f"Items with JA content: {total_with_ja} ({total_with_ja/total_items*100:.1f}%)")
    print(f"Aligned items: {total_aligned} ({total_aligned/total_with_ja*100 if total_with_ja > 0 else 0:.1f}%)")
    print(f"Misaligned items: {total_misaligned} ({total_misaligned/total_with_ja*100 if total_with_ja > 0 else 0:.1f}%)")
    
    # Save detailed report
    report_path = 'validation_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    
    print(f"\nDetailed report saved to: {report_path}")

if __name__ == "__main__":
    main()
