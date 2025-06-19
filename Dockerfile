FROM node:22

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY scripts/management.sh management.sh

RUN npm ci
RUN npm install -g degit

ENTRYPOINT ["/bin/bash", "management.sh"]
