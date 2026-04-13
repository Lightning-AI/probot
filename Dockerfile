FROM node:24 as install
WORKDIR /build
COPY tsconfig.json .
COPY package.json .
COPY yarn.lock .
RUN yarn install
COPY src/ src/

FROM install as build
RUN yarn build

FROM node:24 as prod-build
WORKDIR /out
COPY package.json .
RUN yarn install --production

FROM alpine:3 as zip
RUN apk -U --no-cache add zip
WORKDIR /build
COPY --from=build /build/dist dist/
COPY --from=prod-build /out/node_modules node_modules/
COPY ./package.json .
COPY ./yarn.lock .
RUN zip -FSr /lightning-probot.zip .

FROM scratch as prod
COPY --from=zip /lightning-probot.zip .
