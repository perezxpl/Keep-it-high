@echo off
title Keep it high - Serwer Lokalny
echo ========================================================
echo Uruchamianie gry w przegladarce (http://localhost:8000)...
echo Zamknij to okno, aby zatrzymac serwer.
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "$server = [System.Net.HttpListener]::new(); $server.Prefixes.Add('http://localhost:8000/'); $server.Start(); Start-Process 'http://localhost:8000/Index.html'; while ($server.IsListening) { $context = $server.GetContext(); $req = $context.Request; $res = $context.Response; $path = '.' + $req.RawUrl.Split('?')[0]; if ($path -eq './') { $path = './Index.html' }; if ([System.IO.File]::Exists($path)) { $bytes = [System.IO.File]::ReadAllBytes($path); $ext = [System.IO.Path]::GetExtension($path); if ($ext -eq '.html') { $res.ContentType = 'text/html; charset=utf-8' } elseif ($ext -eq '.js') { $res.ContentType = 'application/javascript; charset=utf-8' }; $res.OutputStream.Write($bytes, 0, $bytes.Length); } else { $res.StatusCode = 404; }; $res.Close(); }"
