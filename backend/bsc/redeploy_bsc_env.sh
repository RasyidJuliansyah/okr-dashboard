docker stop bsc-env
docker rm bsc-env

docker build --no-cache -t bsc-app:latest .

docker run -d  --name bsc-env  -p 3000:3000 -p 3001:3001  --restart unless-stopped  bsc-app:latest
