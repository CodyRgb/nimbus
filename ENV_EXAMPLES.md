# 📝 Environment Configuration Examples

Complete environment variable configurations for development, staging, and production environments.

---

## Table of Contents

1. [Development Environment](#development-environment)
2. [Staging Environment](#staging-environment)
3. [Production Environment](#production-environment)
4. [Docker Environment](#docker-environment)
5. [Configuration Best Practices](#configuration-best-practices)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Security Guidelines](#security-guidelines)

---

## Development Environment

### .env.development

**File: `server/.env.development`**

```env
# ====== APPLICATION ======
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# ====== SERVER ======
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# ====== DATABASE ======
MONGODB_URI=mongodb://localhost:27017/nimbus_dev
MONGODB_USER=root
MONGODB_PASSWORD=dev_password
MONGODB_AUTH_SOURCE=admin

# ====== CACHE ======
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=dev_redis_password

# ====== FACE RECOGNITION ======
FACE_RECOGNITION_API=http://localhost:5000
FACE_MODEL=hog
FACE_DISTANCE_THRESHOLD=0.6
FACE_BATCH_SIZE=10
FACE_EMBEDDING_TTL=2592000
FACE_CACHE_TTL=3600
FACE_REQUEST_TIMEOUT=30000
FACE_MAX_FILE_SIZE=10485760
FACE_VERBOSE_LOGGING=true

# ====== AUTHENTICATION ======
JWT_SECRET=dev_jwt_secret_key_12345
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=dev_refresh_secret
REFRESH_TOKEN_EXPIRE=30d

# ====== CLOUDINARY ======
CLOUDINARY_CLOUD_NAME=dev_cloudinary
CLOUDINARY_API_KEY=dev_api_key
CLOUDINARY_API_SECRET=dev_api_secret
CLOUDINARY_UPLOAD_PRESET=dev_upload

# ====== TELEGRAM (Optional) ======
TELEGRAM_BOT_TOKEN=dev_bot_token
TELEGRAM_API_ID=dev_api_id
TELEGRAM_API_HASH=dev_api_hash

# ====== EMAIL ======
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=dev@example.com
SMTP_PASSWORD=dev_password
SMTP_FROM=dev@example.com

# ====== FILE UPLOAD ======
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,audio/mpeg

# ====== SECURITY ======
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ====== LOGGING ======
LOG_DIR=./logs/development
LOG_FILE_SIZE=10485760
LOG_MAX_FILES=5

# ====== MONITORING ======
SENTRY_DSN=
DATADOG_API_KEY=
```

### Frontend .env.development

**File: `nimbus/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Python .env.development

**File: `server/face_recognition_service/.env`**

```env
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_APP=app.py

# Face Recognition
FACE_MODEL=hog
FACE_DISTANCE_THRESHOLD=0.6
FACE_BATCH_SIZE=10

# Server
PORT=5000
HOST=0.0.0.0
DEBUG=True

# Processing
MAX_WORKERS=2
TIMEOUT=30

# Logging
LOG_LEVEL=DEBUG
LOG_FILE=logs/face_service.log
```

### docker-compose.dev.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: dev_password
      MONGO_INITDB_DATABASE: nimbus_dev
    volumes:
      - mongodb_data_dev:/data/db
    command: --auth

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass dev_redis_password
    volumes:
      - redis_data_dev:/data

  face-recognition:
    build:
      context: ./server/face_recognition_service
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: development
      FLASK_DEBUG: "True"
      FACE_MODEL: hog
      PORT: 5000
    volumes:
      - ./server/face_recognition_service:/app

  api:
    build:
      context: ./server
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://root:dev_password@mongodb:27017/nimbus_dev?authSource=admin
      REDIS_URL: redis://:dev_redis_password@redis:6379
      FACE_RECOGNITION_API: http://face-recognition:5000
    depends_on:
      - mongodb
      - redis
      - face-recognition
    volumes:
      - ./server/src:/app/src
      - ./server/logs:/app/logs

  frontend:
    build:
      context: ./nimbus
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - api
    volumes:
      - ./nimbus:/app

volumes:
  mongodb_data_dev:
  redis_data_dev:
```

---

## Staging Environment

### .env.staging

**File: `server/.env.staging`**

```env
# ====== APPLICATION ======
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info

# ====== SERVER ======
PORT=3001
API_URL=https://staging-api.example.com
FRONTEND_URL=https://staging.example.com

# ====== DATABASE ======
MONGODB_URI=mongodb+srv://staging_user:STAGING_PASSWORD@cluster.mongodb.net/nimbus_staging
MONGODB_AUTH_SOURCE=admin

# ====== CACHE ======
REDIS_URL=redis://:STAGING_REDIS_PASSWORD@staging-redis.example.com:6379
REDIS_MAX_CONNECTIONS=50

# ====== FACE RECOGNITION ======
FACE_RECOGNITION_API=http://face-service-staging.example.com:5000
FACE_MODEL=hog
FACE_DISTANCE_THRESHOLD=0.6
FACE_BATCH_SIZE=15
FACE_EMBEDDING_TTL=2592000
FACE_CACHE_TTL=3600
FACE_REQUEST_TIMEOUT=45000
FACE_MAX_FILE_SIZE=10485760
FACE_VERBOSE_LOGGING=false

# ====== AUTHENTICATION ======
JWT_SECRET=STAGING_JWT_SECRET_KEY_CHANGE_THIS
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=STAGING_REFRESH_SECRET_CHANGE_THIS
REFRESH_TOKEN_EXPIRE=30d

# ====== CLOUDINARY ======
CLOUDINARY_CLOUD_NAME=staging_cloudinary
CLOUDINARY_API_KEY=STAGING_API_KEY
CLOUDINARY_API_SECRET=STAGING_API_SECRET
CLOUDINARY_UPLOAD_PRESET=staging_upload

# ====== TELEGRAM ======
TELEGRAM_BOT_TOKEN=STAGING_BOT_TOKEN
TELEGRAM_API_ID=STAGING_API_ID
TELEGRAM_API_HASH=STAGING_API_HASH

# ====== EMAIL ======
SMTP_HOST=smtp.staging.example.com
SMTP_PORT=587
SMTP_USER=staging@example.com
SMTP_PASSWORD=STAGING_SMTP_PASSWORD
SMTP_FROM=noreply@staging.example.com

# ====== FILE UPLOAD ======
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,audio/mpeg

# ====== SECURITY ======
CORS_ORIGIN=https://staging.example.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# ====== LOGGING ======
LOG_DIR=/var/log/nimbus/staging
SENTRY_DSN=https://STAGING_KEY@sentry.example.com/STAGING_PROJECT_ID
DATADOG_API_KEY=STAGING_DATADOG_KEY

# ====== MONITORING ======
ENABLE_METRICS=true
PROMETHEUS_PORT=9090
```

### Staging Kubernetes Deployment

**File: `k8s/staging/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: face-recognition-staging
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: face-recognition-staging
  template:
    metadata:
      labels:
        app: face-recognition-staging
    spec:
      containers:
      - name: face-service
        image: your-registry/face-recognition:staging-latest
        ports:
        - containerPort: 5000
        env:
        - name: FLASK_ENV
          value: "staging"
        - name: FACE_MODEL
          value: "hog"
        - name: FACE_BATCH_SIZE
          value: "15"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10

      - name: api
        image: your-registry/nimbus-api:staging-latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "staging"
        - name: FACE_RECOGNITION_API
          value: "http://localhost:5000"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: staging-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Production Environment

### .env.production

**File: `server/.env.production`**

```env
# ====== APPLICATION ======
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn

# ====== SERVER ======
PORT=3001
API_URL=https://api.example.com
FRONTEND_URL=https://example.com

# ====== DATABASE ======
MONGODB_URI=mongodb+srv://prod_user:PRODUCTION_PASSWORD@prod-cluster.mongodb.net/nimbus_prod?retryWrites=true&w=majority
MONGODB_POOL_SIZE=100
MONGODB_TIMEOUT=30000

# ====== CACHE ======
REDIS_URL=redis://:PRODUCTION_REDIS_PASSWORD@prod-redis.example.com:6380
REDIS_SSL=true
REDIS_MAX_CONNECTIONS=200
REDIS_RETRY_STRATEGY=exponential

# ====== FACE RECOGNITION ======
FACE_RECOGNITION_API=https://face-service.example.com
FACE_MODEL=cnn
FACE_DISTANCE_THRESHOLD=0.55
FACE_BATCH_SIZE=20
FACE_EMBEDDING_TTL=7776000
FACE_CACHE_TTL=86400
FACE_REQUEST_TIMEOUT=60000
FACE_MAX_FILE_SIZE=10485760
FACE_VERBOSE_LOGGING=false
FACE_SERVICE_INSTANCES=5
FACE_LOAD_BALANCER_STRATEGY=round-robin

# ====== AUTHENTICATION ======
JWT_SECRET=PRODUCTION_JWT_SECRET_KEY_VERY_LONG_AND_COMPLEX
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=PRODUCTION_REFRESH_SECRET_VERY_LONG_AND_COMPLEX
REFRESH_TOKEN_EXPIRE=30d

# ====== CLOUDINARY ======
CLOUDINARY_CLOUD_NAME=production_cloudinary
CLOUDINARY_API_KEY=PRODUCTION_API_KEY
CLOUDINARY_API_SECRET=PRODUCTION_API_SECRET
CLOUDINARY_UPLOAD_PRESET=production_upload
CLOUDINARY_SECURE_URL=true

# ====== TELEGRAM ======
TELEGRAM_BOT_TOKEN=PRODUCTION_BOT_TOKEN
TELEGRAM_API_ID=PRODUCTION_API_ID
TELEGRAM_API_HASH=PRODUCTION_API_HASH

# ====== EMAIL ======
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=PRODUCTION_SENDGRID_KEY
SMTP_FROM=noreply@example.com

# ====== FILE UPLOAD ======
MAX_FILE_SIZE=52428800
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,audio/mpeg

# ====== SECURITY ======
CORS_ORIGIN=https://example.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
HELMET_ENABLED=true
CSRF_PROTECTION=true

# ====== LOGGING ======
LOG_DIR=/var/log/nimbus/production
LOG_MAX_SIZE=100M
LOG_MAX_FILES=30
LOG_COMPRESSION=gzip
SENTRY_DSN=https://PRODUCTION_KEY@sentry.example.com/PRODUCTION_PROJECT_ID
SENTRY_TRACES_SAMPLE_RATE=0.1
DATADOG_API_KEY=PRODUCTION_DATADOG_KEY
DATADOG_ENV=production

# ====== MONITORING ======
ENABLE_METRICS=true
PROMETHEUS_PORT=9090
ENABLE_APM=true
APM_SERVICE_NAME=nimbus-api
APM_SERVER_URL=https://apm.example.com

# ====== BACKUP & RECOVERY ======
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE=s3://production-backups

# ====== SCALING ======
WORKER_THREADS=8
CLUSTER_MODE=true
PM2_INSTANCES=4
```

### Production Kubernetes Manifest

**File: `k8s/production/deployment.yaml`**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: face-recognition-config
  namespace: production
data:
  FACE_MODEL: "cnn"
  FACE_BATCH_SIZE: "20"
  LOG_LEVEL: "warn"
---
apiVersion: v1
kind: Secret
metadata:
  name: face-recognition-secrets
  namespace: production
type: Opaque
stringData:
  MONGODB_URI: "mongodb+srv://prod_user:PASSWORD@cluster.mongodb.net/nimbus?retryWrites=true&w=majority"
  REDIS_URL: "redis://:PASSWORD@prod-redis.example.com:6380"
  JWT_SECRET: "VERY_LONG_PRODUCTION_SECRET"
  CLOUDINARY_API_SECRET: "SECRET_VALUE"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: face-recognition-prod
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: face-recognition-prod
  template:
    metadata:
      labels:
        app: face-recognition-prod
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - face-recognition-prod
              topologyKey: kubernetes.io/hostname
      containers:
      - name: face-service
        image: your-registry/face-recognition:prod-v1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5000
          name: http
          protocol: TCP
        envFrom:
        - configMapRef:
            name: face-recognition-config
        - secretRef:
            name: face-recognition-secrets
        resources:
          requests:
            memory: "2Gi"
            cpu: "2000m"
          limits:
            memory: "4Gi"
            cpu: "4000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 2
        volumeMounts:
        - name: logs
          mountPath: /var/log/face-service
        - name: tmp
          mountPath: /tmp

      - name: api
        image: your-registry/nimbus-api:prod-v1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3001
          name: http
          protocol: TCP
        envFrom:
        - configMapRef:
            name: face-recognition-config
        - secretRef:
            name: face-recognition-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "1000m"
          limits:
            memory: "1Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/status
            port: 3001
          initialDelaySeconds: 60
          periodSeconds: 30
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/status
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 2
        volumeMounts:
        - name: logs
          mountPath: /var/log/nimbus

      volumes:
      - name: logs
        persistentVolumeClaim:
          claimName: logs-pvc
      - name: tmp
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: face-recognition-service
  namespace: production
spec:
  selector:
    app: face-recognition-prod
  ports:
  - port: 80
    targetPort: 3001
    name: http
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: face-recognition-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: face-recognition-prod
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Docker Environment

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: nimbus_prod
    volumes:
      - ./data/mongodb:/data/db
      - ./backups:/backups
    command:
      - --auth
      - --wiredTigerCacheSizeGB=2
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test -u ${MONGO_ROOT_USER} -p ${MONGO_ROOT_PASSWORD}
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command:
      - redis-server
      - --requirepass
      - ${REDIS_PASSWORD}
      - --maxmemory
      - 2gb
      - --maxmemory-policy
      - allkeys-lru
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: redis-cli --raw incr ping
      interval: 30s
      timeout: 10s
      retries: 5

  face-recognition:
    image: your-registry/face-recognition:prod-latest
    restart: always
    environment:
      FLASK_ENV: production
      FACE_MODEL: cnn
      FACE_BATCH_SIZE: 20
      PORT: 5000
    ports:
      - "5000:5000"
    volumes:
      - ./logs:/var/log/face-service
      - ./temp:/app/temp
    depends_on:
      mongodb:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:5000/health || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    image: your-registry/nimbus-api:prod-latest
    restart: always
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongodb:27017/nimbus_prod?authSource=admin
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      FACE_RECOGNITION_API: http://face-recognition:5000
    ports:
      - "3001:3001"
    volumes:
      - ./logs:/app/logs
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
      face-recognition:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:3001/api/status || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - api
    healthcheck:
      test: curl -f http://localhost/api/status || exit 1
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Configuration Best Practices

### ✅ DO

```env
# ✅ Use strong, random secrets
JWT_SECRET=abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx

# ✅ Use secure connections
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
REDIS_URL=redis://:pass@host:port

# ✅ Separate concerns
FACE_RECOGNITION_API=https://face-service.example.com
API_URL=https://api.example.com

# ✅ Use meaningful names
FACE_MODEL=cnn
LOG_LEVEL=warn
NODE_ENV=production

# ✅ Include units when relevant
FACE_EMBEDDING_TTL=2592000  # seconds (30 days)
MAX_FILE_SIZE=52428800      # bytes (50MB)

# ✅ Document complex values
# Threshold ranges 0.0-1.0: lower=stricter matching
FACE_DISTANCE_THRESHOLD=0.6
```

### ❌ DON'T

```env
# ❌ Hardcode secrets
JWT_SECRET=debug123

# ❌ Use same secret everywhere
SECRET_KEY=same_secret_everywhere

# ❌ Vague variable names
SECRET=12345
KEY=abcde
VALUE=true

# ❌ Commit .env files
# NEVER: git add .env

# ❌ Use plaintext passwords in version control
POSTGRES_PASSWORD=mypassword123

# ❌ Log sensitive data
CLOUDINARY_API_SECRET=LOG_THIS_VALUE
```

---

## Environment Variables Reference

### Face Recognition Variables

| Variable | Dev | Staging | Production | Notes |
|----------|-----|---------|-----------|-------|
| FACE_MODEL | hog | hog | cnn | Fast vs Accurate |
| FACE_DISTANCE_THRESHOLD | 0.6 | 0.6 | 0.55 | Lower = stricter |
| FACE_BATCH_SIZE | 10 | 15 | 20 | Higher = more memory |
| FACE_EMBEDDING_TTL | 2592000 | 2592000 | 7776000 | Cache duration |
| FACE_VERBOSE_LOGGING | true | false | false | Debug logging |

### Database Variables

| Variable | Type | Required | Default |
|----------|------|----------|---------|
| MONGODB_URI | string | Yes | - |
| REDIS_URL | string | Yes | - |
| MONGODB_POOL_SIZE | number | No | 10 |
| REDIS_MAX_CONNECTIONS | number | No | 50 |

### Security Variables

| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| JWT_SECRET | string | Yes | Min 32 chars |
| CORS_ORIGIN | string | Yes | https required in prod |
| RATE_LIMIT_MAX_REQUESTS | number | No | Default: 100 |

---

## Security Guidelines

### Secret Management

```bash
# ✅ Use environment variable management
AWS Secrets Manager
Azure Key Vault
HashiCorp Vault

# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Never commit secrets
git add .env.example  # ✅ (template only)
git add .env          # ❌ (secrets!)
```

### .env.example Template

```env
# DO commit this file with dummy values
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/nimbus
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_here
CLOUDINARY_API_KEY=your_key_here
FACE_RECOGNITION_API=http://localhost:5000
```

### Rotation Policy

```
Quarterly:
  - Rotate JWT_SECRET
  - Rotate CLOUDINARY_API_SECRET
  - Rotate database passwords

On Incident:
  - Rotate all secrets immediately
  - Update credentials
  - Notify team

On Deployment:
  - Use new secrets
  - Never reuse old values
```

---

## Summary

**Use these configurations as templates:**

- Development: Fast iteration, verbose logging
- Staging: Production-like, thorough testing
- Production: Optimized, secure, monitored

**Key Differences:**

```
Development → Staging → Production
├─ Debug: ON → OFF → OFF
├─ Model: hog → hog → cnn
├─ Batch: 10 → 15 → 20
├─ TTL: 30d → 30d → 90d
├─ Instances: 1 → 2 → 5
└─ Replicas: 1 → 2 → 3
```

All environments production-ready with proper security, monitoring, and scaling! 🚀

