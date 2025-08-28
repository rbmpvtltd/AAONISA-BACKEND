Use Node Version 20.

## Project setup

```bash
$ npm install
```

## Nest cli
```bash
$ nest generate resource resource-name
```

## All Api List on ui
```
http://localhost:3001/api
```

## Run Migration
```
# run migration
$ npm run migration:run

# generate new migration file
$ npm run migration:generate --name=table-name

# revert latest migration
$ npm run migration:revert

# drop schema
$ npm run migration:drop
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```