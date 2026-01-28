# mean-demo-app

App Node.js (Express) para práctica Terraform.

## Variables de entorno
- PORT=3000
- MONGO_URL=mongodb://10.10.2.4:27017/mean
- MONGO_DB=mean
- MONGO_COL=items

## Ejecutar local
npm install
MONGO_URL="mongodb://127.0.0.1:27017/mean" npm start

## Endpoints
- GET /health        -> 200 siempre (para balanceador)
- GET /mongo-health  -> estado Mongo
- GET /api/items
- POST /api/items    -> { "name": "test" }
- DELETE /api/items/:id
