## Сборка контейнеров

'docker build -t inventory-api:latest ./api'

'docker build -t inventory-frontend:latest ./frontend'

## Инициализация, развертывание сварм

'docker swarm init'

'docker stack deploy -c docker-stack.yml inventory'

### проверка сервисов и контейнеров

'docker stack services inventory'

'docker stack ps inventory'

## отключение контейнера для проверки

'docker service ps inventory_api'

'docker kill <container_id_одного_из_api_контейнеров>

'watch docker service ps inventory_api'

'curl http://localhost:8081/api/products'

## Масштабирование сервисов

### 1. Увеличим количество реплик API
'docker service scale inventory_api=5'

### 2. Увеличим количество реплик Frontend
'docker service scale inventory_frontend=5'

### 3. Проверим распределение по нодам
```
docker service ps inventory_api
docker service ps inventory_frontend
```

### 4. Уменьшим обратно
```
docker service scale inventory_api=3
docker service scale inventory_frontend=3
```