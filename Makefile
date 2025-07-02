.PHONY: build

build:
	yarn install
	yarn format
	yarn lint
	yarn build
