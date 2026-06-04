FROM node:22.11.0-slim

# Install tzdata and set timezone
RUN apt-get update && apt-get install -y tzdata \
  && ln -sf /usr/share/zoneinfo/Asia/Jakarta /etc/localtime \
  && echo "Asia/Jakarta" > /etc/timezone \
  && dpkg-reconfigure -f noninteractive tzdata \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2) Install + deps + fonts
RUN apt-get update && apt-get install -y \
  fonts-dejavu fonts-noto fonts-noto-cjk fontconfig \
  libnss3 libxss1 libx11-6 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxi6 libxrender1 libxtst6 libcups2 libdrm2 libgbm1 libasound2 \
  && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Jakarta

ENV RUN_IN_DOCKER=1

WORKDIR /app

# Root
COPY ./package.json ./
COPY ./node_modules/ ./node_modules/

# This package
COPY ./dist/ ./dist/

# 5) Jalankan sebagai user non-root
USER node

EXPOSE 3000
CMD ["yarn", "start:prod"]