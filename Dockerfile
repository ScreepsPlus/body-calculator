FROM nginx:alpine
ADD default.conf /etc/nginx/conf.d/default.conf
ADD static/ /usr/share/nginx/html/