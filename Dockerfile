FROM docker.io/library/node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start" ]
