#!/usr/bin/env python3
"""
Script to fetch and parse Yandex Wordstat regions tree
to find Stavropol-related region IDs
"""

import json
import urllib.request

def search_regions(items, target_labels, parent=None, results=None):
    """Recursively search through the regions tree"""
    if results is None:
        results = {}
    
    if not items:
        return results
    
    for item in items:
        label = item.get('label', item.get('name', ''))
        value = item.get('value', item.get('id', ''))
        
        # Check for target regions
        if label == 'Ставропольский край':
            results['stavropol_krai'] = {
                'id': value,
                'label': label,
                'parent_id': parent.get('value') if parent else None,
                'parent_label': parent.get('label') if parent else None
            }
        
        if label == 'Ставрополь':
            # Store with parent information
            key = f'stavropol_city_{value}'
            results[key] = {
                'id': value,
                'label': label,
                'parent_id': parent.get('value') if parent else None,
                'parent_label': parent.get('label') if parent else None
            }
        
        if label == 'Северо-Кавказский федеральный округ':
            results['north_caucasus_district'] = {
                'id': value,
                'label': label,
                'parent_id': parent.get('value') if parent else None,
                'parent_label': parent.get('label') if parent else None
            }
        
        # Recursively search children
        children = item.get('children', [])
        if children:
            search_regions(children, target_labels, item, results)
    
    return results

def main():
    url = 'https://functions.poehali.dev/6e6f4963-53eb-43b1-a048-822b807a734b'
    
    print("Fetching regions data from API...")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        print("Parsing regions tree...")
        regions = data.get('regions', data.get('data', data))
        
        # Search for target regions
        target_labels = [
            'Ставропольский край',
            'Ставрополь',
            'Северо-Кавказский федеральный округ'
        ]
        
        results = search_regions(regions, target_labels)
        
        # Print results
        print("\n" + "="*60)
        print("SEARCH RESULTS")
        print("="*60)
        
        # 1. Stavropol Krai ID
        if 'stavropol_krai' in results:
            krai = results['stavropol_krai']
            print(f"\n1. Ставропольский край ID: {krai['id']}")
        else:
            print("\n1. Ставропольский край ID: NOT FOUND")
        
        # 2. Stavropol City ID (filter the one that's a child of Stavropol Krai)
        stavropol_cities = {k: v for k, v in results.items() if k.startswith('stavropol_city_')}
        stavropol_city = None
        for key, city in stavropol_cities.items():
            if city.get('parent_label') == 'Ставропольский край':
                stavropol_city = city
                break
        
        if stavropol_city:
            print(f"2. Ставрополь city ID: {stavropol_city['id']}")
            print(f"3. Parent region for Ставрополь city: {stavropol_city['parent_id']} (Ставропольский край)")
        else:
            # If not found as direct child, show any Stavropol found
            if stavropol_cities:
                first_city = list(stavropol_cities.values())[0]
                print(f"2. Ставрополь city ID: {first_city['id']}")
                print(f"3. Parent region for Ставрополь city: {first_city['parent_id']} ({first_city.get('parent_label', 'Unknown')})")
            else:
                print("2. Ставрополь city ID: NOT FOUND")
                print("3. Parent region for Ставрополь city: NOT FOUND")
        
        # 4. North Caucasus Federal District ID
        if 'north_caucasus_district' in results:
            district = results['north_caucasus_district']
            print(f"4. Северо-Кавказский федеральный округ ID: {district['id']}")
        else:
            print("4. Северо-Кавказский федеральный округ ID: NOT FOUND")
        
        print("\n" + "="*60)
        print("DETAILED RESULTS (JSON)")
        print("="*60)
        print(json.dumps(results, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
