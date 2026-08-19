FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./
HEALTHCHECK --interval=5m --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "process.exit(Date.now() - Number(require('fs').readFileSync('/tmp/heartbeat','utf8')) < 90*60*1000 ? 0 : 1)"
CMD ["node", "index.js"]
