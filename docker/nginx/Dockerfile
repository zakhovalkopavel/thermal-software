# Docker Nginx - Reverse Proxy

ARG NGINX_VERSION=1.28.1-alpine
FROM nginx:${NGINX_VERSION}

LABEL maintainer="Thermal Software Team"
LABEL version="1.0.0"
LABEL description="Nginx reverse proxy for Thermal Software"

# Shared location blocks (also bind-mounted from host for live edits)
COPY conf.d/app-locations.inc /etc/nginx/conf.d/app-locations.inc

# Server templates — entrypoint copies one to conf.d/default.conf at start
COPY templates/ /etc/nginx/templates/
COPY docker-entrypoint.d/40-select-ssl-mode.sh /docker-entrypoint.d/40-select-ssl-mode.sh
RUN chmod +x /docker-entrypoint.d/40-select-ssl-mode.sh

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/www/certbot && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
