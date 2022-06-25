docker network create elastic

docker run \
--name kib-01 \
--net elastic \
-p 5601:5601 \
-e "xpack.security.enabled=false" \
-e "xpack.monitoring.enabled=false" \
-e "xpack.watcher.enabled=false" \
-e "xpack.ml.enabled=false" \
docker.elastic.co/kibana/kibana:8.2.3
