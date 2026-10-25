#!/usr/bin/env python3
"""Reads /tmp/urls.json and builds the IndexNow POST payload JSON.
Args: HOST KEY KEY_LOCATION"""
import sys, json

host, key, key_location = sys.argv[1:4]
urls = json.loads(sys.stdin.read())
print(json.dumps({
    "host": host,
    "key": key,
    "keyLocation": key_location,
    "urlList": urls,
}))
