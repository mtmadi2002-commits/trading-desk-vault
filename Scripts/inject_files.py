#!/usr/bin/env python3
"""Inject the vault's note list into index.html (window.__VAULT_FILES__)."""
import os,json,re,pathlib
V=pathlib.Path(__file__).resolve().parents[1]
files=sorted(str(p.relative_to(V)) for p in V.rglob("*") if p.is_file() and not any(part.startswith(".") for part in p.relative_to(V).parts) and p.suffix in (".md",".py",".js",".json") and p.name!="index.html")
html=(V/"index.html").read_text()
html=re.sub(r"<script>window\.__VAULT_FILES__=.*?;</script>", "<script>window.__VAULT_FILES__="+json.dumps(files)+";</script>", html, count=1, flags=re.S)
(V/"index.html").write_text(html); print(len(files),"files injected")
