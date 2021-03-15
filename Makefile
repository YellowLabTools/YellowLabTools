env ?= dev
AWS_PROFILE ?= yellowlabtools-$(env)
AWS_REGION ?= us-east-1
DOCKER_IMAGE_TAG ?= latest
RESULT_BUCKET_NAME ?= $(env)-yellowlabtools-storage
TEST_NAME ?= test-local
TEST_URL ?= https://www.google.fr

all: install

install:
	@npm install

build-docker-image-lambda:
	@docker build -f Dockerfile.lambda -t yellowlabtools-runner-lambda .

tag-docker-image-lambda:
	@docker tag yellowlabtools-runner-lambda:$(DOCKER_IMAGE_TAG) $(DOCKER_REGISTRY)/yellowlabtools-runner-lambda:$(DOCKER_IMAGE_TAG)

push-docker-image-lambda:
	@docker push $(DOCKER_REGISTRY)/yellowlabtools-runner-lambda:$(DOCKER_IMAGE_TAG)

login-docker:
	@AWS_PROFILE=$(AWS_PROFILE) aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(DOCKER_REGISTRY)

start-local-lambda:
	@docker run --rm -it -p 9000:8080 -e RESULT_BUCKET_NAME=$(RESULT_BUCKET_NAME) -e AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) -e AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) yellowlabtools-runner-lambda:$(DOCKER_IMAGE_TAG)

run-local-test:
	@curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"id": "$(TEST_NAME)", "url": "$(TEST_URL)"}'