FROM nginx:1.27-alpine

RUN apk add --no-cache openssl

RUN mkdir -p /etc/nginx/certs/dev /etc/nginx/certs/prod

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/conf.d/ /etc/nginx/conf.d/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
