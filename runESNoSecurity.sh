docker network create elastic

docker run \
       -p 9200:9200 \
       -p 9300:9300 \
       --name es-node01 \
       --net elastic \
       -e "discovery.type=single-node" \
       -e "xpack.security.enabled=false" \
       -e "http.cors.enabled=true" \
       -e "http.cors.allow-origin=\"*\"" \
       -e "http.cors.allow-methods=OPTIONS, HEAD, GET, POST, PUT, DELETE" \
       -e "http.cors.allow-headers=X-Requested-With,X-Auth-Token,Content-Type,Content-Length" \
       -e "http.cors.allow-credentials=true" \
       docker.elastic.co/elasticsearch/elasticsearch:8.2.3
