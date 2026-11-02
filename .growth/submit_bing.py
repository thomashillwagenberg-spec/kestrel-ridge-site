#!/usr/bin/env python3
"""Submit live public URLs to IndexNow. Acceptance is not indexing."""
import argparse
import datetime as dt
import json
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from build import ROOT, BASE

def main():
    ap=argparse.ArgumentParser();ap.add_argument('urls',nargs='+');ap.add_argument('--report');args=ap.parse_args()
    urls=list(dict.fromkeys(args.urls))
    key='e2a76b4686264f2f9418b07705154e24'
    for url in urls:
        assert url.startswith(BASE+'/') and urlparse(url).hostname=='kestrelridgehealth.com'
        with urlopen(Request(url,headers={'User-Agent':'KRH-IndexNow-Submit/1.0'}),timeout=25) as r:
            assert r.status==200, f'URL not live: {url}'
    with urlopen(BASE+'/'+key+'.txt',timeout=25) as r: assert r.read().decode().strip()==key
    payload={'host':'kestrelridgehealth.com','key':key,'keyLocation':BASE+'/'+key+'.txt','urlList':urls}
    req=Request('https://api.indexnow.org/indexnow',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json; charset=utf-8'},method='POST')
    with urlopen(req,timeout=30) as r:
        status=r.status;body=r.read().decode()
    assert status in (200,202), f'Unexpected IndexNow response: {status}'
    report={'submitted_at':dt.datetime.now(dt.timezone.utc).isoformat(),'provider':'IndexNow (Bing and participating engines)','http_status':status,'accepted':True,'urls':urls,'response':body,'indexed':None}
    if args.report:
        from pathlib import Path
        Path(args.report).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__': main()
