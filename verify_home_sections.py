import json
import urllib.request
import ssl
import sys

sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('deep_home_audit.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sections = data['domAudit']['sections']

print(f"Total DOM Sections Evaluated: {len(sections)}\n")

for s in sections:
    idx = s['index']
    snippet = s['textSnippet']
    text_len = s['textLength']
    img_cnt = s['imgCount']
    broken_cnt = s['brokenImgCount']
    
    print(f"Section #{idx} | Text Length: {text_len} | Images: {img_cnt} | Snippet: {snippet[:80]}")

print("\nChecking all image URLs in all sections for actual HTTP status (200 vs 404)...")
all_img_srcs = set()
for s in sections:
    for img in s.get('brokenImgs', []):
        all_img_srcs.add(img['src'])

print(f"Unique image URLs to verify via HTTP request: {len(all_img_srcs)}")

broken_404_images = []
for url in all_img_srcs:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.woodenstreet.com/'
    }
    req = urllib.request.Request(url, headers=headers, method='HEAD')
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            pass
    except urllib.error.HTTPError as e:
        if e.code == 404:
            broken_404_images.append((url, e.code))
            print(f"❌ [404 NOT FOUND IMAGE] {url}")
        else:
            # Retry with GET if HEAD 403 or 405
            try:
                req_get = urllib.request.Request(url, headers=headers, method='GET')
                with urllib.request.urlopen(req_get, context=ctx, timeout=10) as resp_get:
                    pass
            except urllib.error.HTTPError as e_get:
                if e_get.code == 404:
                    broken_404_images.append((url, e_get.code))
                    print(f"❌ [404 NOT FOUND IMAGE] {url}")
    except Exception as e:
        print(f"Error checking {url}: {e}")

print("\n--- IMAGE CHECK SUMMARY ---")
print(f"Total 404 Broken Images Found: {len(broken_404_images)}")
for img_url, code in broken_404_images:
    print(f"  - {img_url}")
