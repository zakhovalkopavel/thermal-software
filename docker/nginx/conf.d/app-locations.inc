# Shared proxy locations — included by HTTP/HTTPS server blocks in default.conf.
# Use .inc so nginx does not load this as a top-level conf.d/*.conf file.

resolver 127.0.0.11 valid=10s ipv6=off;

add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

location /api/ {
    proxy_pass http://backend_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";

    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}

location /source-extractor/api/ {
    set $se_api source-extractor:8100;
    rewrite ^/source-extractor/api/(.*)$ /api/$1 break;
    proxy_pass http://$se_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_read_timeout 3600s;
}

location /source-extractor/docs {
    set $se_api source-extractor:8100;
    proxy_pass http://$se_api/docs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location /source-extractor/redoc {
    set $se_api source-extractor:8100;
    proxy_pass http://$se_api/redoc;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location /source-extractor/openapi.json {
    set $se_api source-extractor:8100;
    proxy_pass http://$se_api/openapi.json;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location /source-extractor/ {
    set $se_ui source-extractor-ui:5174;
    proxy_pass http://$se_ui;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
}

# Vite / SPA assets stay on the frontend container (dev HMR + production assets).
location ~ ^/(src|@vite|@react-refresh|@fs|@id|node_modules|assets|vite\.svg)(/|$) {
    proxy_pass http://frontend_dev;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_read_timeout 60s;
}

# Document requests: Nest SSR shell injects SEO meta (+ content HTML) then boots the SPA.
# Rewrite strips nothing — path /about is forwarded as /ssr/about on the backend.
location / {
    rewrite ^/(.*)$ /ssr/$1 break;
    proxy_pass http://backend_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
